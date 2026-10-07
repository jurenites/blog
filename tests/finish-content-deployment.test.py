"""Run the repair's actual PHP edits against disposable Composer/settings files."""
import json
import os
from pathlib import Path
import re
import shutil
import subprocess
import tempfile
import unittest

SCRIPT_PATH = Path(__file__).resolve().parents[1] / "scripts/finish-content-deployment.sh"
PHP_SNIPPETS = re.findall(r"""(?:drush_command php:eval|"\$prod_php" -r) '([^']*)'""",
                         SCRIPT_PATH.read_text())


class RepairEditsTests(unittest.TestCase):
    def setUp(self):
        if not shutil.which("php"):
            self.skipTest("PHP CLI required")
        self.temp_directory = tempfile.TemporaryDirectory(prefix="repair-settings-")
        self.addCleanup(self.temp_directory.cleanup)
        self.test_root = Path(self.temp_directory.name)
        self.site_root = self.test_root / "web/sites/default"
        self.site_root.mkdir(parents=True)
        self.backup_root = self.test_root / "repair"
        self.backup_root.mkdir()

    def test_composer_edit_preserves_other_packages(self):
        composer_path = self.test_root / "composer.json"
        composer_path.write_text(json.dumps({"require": {"drupal/core-recommended": "11.4.7"},
            "require-dev": {"drupal/devel": "^5.5"}, "extra": {"fixture": "keep"}}))
        package_versions = {"drupal/devel": "5.5.0", "drupal/clickhouse": "1.0.0-alpha1", "drupal/ms_clarity": "2.0.1"}
        package_path = self.test_root / "packages.json"
        package_path.write_text(json.dumps(package_versions))
        php_source = next(php_text for php_text in PHP_SNIPPETS if "$composer_path =" in php_text)
        subprocess.run(["php", "-r", php_source, str(package_path)], cwd=self.test_root, check=True)
        composer_data = json.loads(composer_path.read_text())
        self.assertEqual(composer_data["require"]["drupal/core-recommended"], "11.4.7")
        self.assertEqual(composer_data["extra"], {"fixture": "keep"})
        self.assertNotIn("require-dev", composer_data)
        for package_name, package_version in package_versions.items():
            self.assertEqual(composer_data["require"][package_name], package_version)

    def run_settings_repair(self, original_source):
        settings_path = self.site_root / "settings.php"
        if settings_path.exists():
            settings_path.chmod(0o644)
        (self.backup_root / "settings.before.php").unlink(missing_ok=True)
        settings_path.write_text(original_source)
        settings_path.chmod(0o444)
        stub_source = r'''
namespace Drupal\Core\Site {
  class Settings {
    public static function get($setting_name) {
      $settings = [];
      include DRUPAL_ROOT . "/sites/default/settings.php";
      return $settings[$setting_name] ?? null;
    }
  }
}
namespace {
  define("DRUPAL_ROOT", getenv("TEST_ROOT") . "/web");
  class Drupal {
    public static function getContainer() {
      return new class {
        public function getParameter($parameter_name) { return "sites/default"; }
      };
    }
  }
  eval($argv[1]);
}
'''
        php_source = next(php_text for php_text in PHP_SNIPPETS if "$settings_source = file_get_contents" in php_text)
        subprocess.run(["php", "-r", stub_source, php_source], cwd=self.test_root,
            env={**os.environ, "TEST_ROOT": str(self.test_root), "REPAIR_DIRECTORY": str(self.backup_root)}, check=True)
        subprocess.run(["php", "-l", str(settings_path)], check=True, capture_output=True)
        self.assertEqual(settings_path.stat().st_mode & 0o777, 0o444)
        return settings_path

    def test_missing_sync_preserves_settings_and_modes(self):
        for close_tag in ("", "?>"):
            with self.subTest(close_tag=close_tag):
                original_source = '<?php\n$databases = ["fixture" => "preserve-me"];\n' + close_tag
                settings_path = self.run_settings_repair(original_source)
                self.assertTrue(settings_path.read_text().startswith(original_source))
                self.assertEqual((self.backup_root / "settings.before.php").read_text(), original_source)
                self.assertTrue((self.test_root / "config/sync").is_dir())

    def test_existing_sync_setting_is_preserved(self):
        original_source = '<?php\n$settings["config_sync_directory"] = "./existing-sync";\n'
        settings_path = self.run_settings_repair(original_source)
        self.assertEqual(settings_path.read_text(), original_source)
        self.assertTrue((self.test_root / "existing-sync").is_dir())
        self.assertFalse((self.backup_root / "settings.before.php").exists())


if __name__ == "__main__":
    unittest.main()
