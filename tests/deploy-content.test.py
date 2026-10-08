"""Exercise the real shell workflow against disposable command/server fixtures."""
import gzip
import os
from pathlib import Path
import shutil
import subprocess
import tempfile
import unittest


SCRIPT_PATH = Path(os.environ.get("DEPLOY_SCRIPT_PATH", Path(__file__).resolve().parents[1] / "scripts/deploy-content.sh"))
MOCK_COMMAND = r'''#!/usr/bin/env python3
import os
from pathlib import Path
import shutil
import subprocess
import sys

command_name = Path(sys.argv[0]).name
argument_list = sys.argv[1:]
with open(os.environ["CALL_LOG"], "a") as log_file:
    log_file.write(command_name + " " + " ".join(argument_list) + "\n")
if command_name == "docker":
    if argument_list[0] == "inspect":
        print("false" if os.environ.get("FAIL_PHASE") == "stopped" else "true")
    elif "SELECT HEX(data)" in argument_list[-1]:
        print(b'a:2:{s:6:"module";a:1:{s:4:"node";i:0;}s:5:"theme";a:0:{}}'.hex())
    elif "SELECT 1" in argument_list[-1]:
        attempt_path = Path(os.environ["CALL_LOG"] + ".attempts")
        attempt_count = int(attempt_path.read_text()) if attempt_path.exists() else 0
        attempt_path.write_text(str(attempt_count + 1))
        if os.environ.get("FAIL_PHASE") == "unready" or (
            os.environ.get("FAIL_PHASE") == "starting" and attempt_count < 2
        ):
            print("ERROR 2002: socket is not ready", file=sys.stderr)
            sys.exit(1)
    elif "mariadb-dump" in argument_list[-1]:
        if os.environ.get("FAIL_PHASE") == "export":
            sys.exit(9)
        print("/*M!999999\\- enable the sandbox mode */")
        print("CREATE TABLE `sample_data` (\n `sample_id` int\n) COLLATE=utf8mb4_uca1400_ai_ci;")
        print("INSERT INTO sample_data VALUES ('utf8mb4_uca1400_ai_ci');")
elif command_name == "ssh":
    control_path = Path(next(argument_value.split("=", 1)[1] for argument_value in argument_list if argument_value.startswith("ControlPath=")))
    if "-M" in argument_list:
        if os.environ.get("FAIL_PHASE") == "authentication":
            sys.exit(255)
        control_path.touch()
        sys.exit(0)
    if "-O" in argument_list:
        control_path.unlink(missing_ok=True)
        sys.exit(0)
    if not control_path.exists() or "BatchMode=yes" not in argument_list:
        sys.exit("Shared SSH session unavailable")
    sys.exit(subprocess.run(["bash", "-c", argument_list[-1]]).returncode)
elif command_name == "scp":
    control_path = Path(next(argument_value.split("=", 1)[1] for argument_value in argument_list if argument_value.startswith("ControlPath=")))
    if not control_path.exists() or "BatchMode=yes" not in argument_list:
        sys.exit("Shared SSH session unavailable for scp")
    if os.environ.get("FAIL_PHASE") == "upload":
        sys.exit(8)
    target_path = argument_list[-1].split(":", 1)[1]
    source_start = argument_list.index("-P") + 2
    for source_path in argument_list[source_start:-1]:
        if Path(source_path).is_dir():
            for source_file in Path(source_path).rglob("*"):
                if source_file.is_file():
                    with open(os.environ["CALL_LOG"], "a") as log_file:
                        log_file.write("uploaded-public-file " + str(source_file.relative_to(source_path)) + "\n")
            shutil.copytree(source_path, Path(target_path) / Path(source_path).name)
            if os.environ.get("FAIL_PHASE") == "corrupt":
                (Path(target_path) / "files/photo.txt").write_text("corrupted transfer")
        else:
            shutil.copy(source_path, target_path)
elif command_name == "find":
    if os.environ.get("FAIL_PHASE") == "prepare":
        sys.exit(4)
    sys.exit(subprocess.run(["/usr/bin/find", *argument_list]).returncode)
elif command_name == "php-fixture":
    if os.environ["PATH"].split(":")[0] != str(Path(sys.argv[0]).parent):
        sys.exit("PHP executable directory must be inherited by child commands")
    if argument_list[0] == "-r":
        sys.exit(subprocess.run([os.environ["REAL_PHP"], *argument_list]).returncode)
    if "DEV_EXTENSIONS_HEX" in " ".join(argument_list) and os.environ.get("FAIL_PHASE") == "incompatible":
        sys.exit("PROD is missing DEV extensions")
    if "sql:query" in argument_list:
        for argument_value in argument_list:
            if argument_value.startswith("--file="):
                if os.environ.get("FAIL_PHASE") == "import":
                    sys.exit(7)
                shutil.copy(argument_value.split("=", 1)[1], os.environ["IMPORTED_SQL"])
    if "updatedb" in argument_list and os.environ.get("FAIL_PHASE") == "updates":
        sys.exit(6)
    if "status" in argument_list and os.environ.get("FAIL_PHASE") == "final_status" and Path(os.environ["IMPORTED_SQL"]).exists():
        sys.exit(5)
'''


class DeploymentWorkflowTests(unittest.TestCase):
    def setUp(self):
        real_php = shutil.which("php")
        if not real_php:
            self.skipTest("PHP CLI is required to test real remote file comparisons")
        self.temp_directory = tempfile.TemporaryDirectory(prefix="content-deploy-test-", dir="/tmp")
        self.addCleanup(self.temp_directory.cleanup)
        self.test_root = Path(self.temp_directory.name)
        self.dev_root = self.test_root / "dev"
        self.prod_root = self.test_root / "prod"
        self.mock_root = self.test_root / "bin"
        self.mock_root.mkdir()
        for command_name in ("docker", "ssh", "scp", "mysql", "php-fixture", "sleep", "find"):
            command_path = self.mock_root / command_name
            command_path.write_text(MOCK_COMMAND)
            command_path.chmod(0o755)
        (self.dev_root / "scripts").mkdir(parents=True)
        shutil.copy(SCRIPT_PATH, self.dev_root / "scripts/deploy-content.sh")
        for project_root in (self.dev_root, self.prod_root):
            public_path = project_root / "web/sites/default/files"
            public_path.mkdir(parents=True)
            (public_path / ".htaccess").write_text("fixture access rules")
        self.dev_files = self.dev_root / "web/sites/default/files"
        self.prod_files = self.prod_root / "web/sites/default/files"
        (self.dev_files / "photo.txt").write_text("DEV photo")
        (self.prod_files / "photo.txt").write_text("old photo")
        (self.prod_files / "prod-only.txt").write_text("retained")
        (self.dev_files / "unchanged.txt").write_text("same bytes")
        (self.prod_files / "unchanged.txt").write_text("same bytes")
        os.utime(self.prod_files / "unchanged.txt", (1, 1))
        (self.dev_files / "nested folder").mkdir()
        (self.dev_files / "nested folder/new image ü.txt").write_text("new nested file")
        (self.dev_files / "css").mkdir()
        (self.dev_files / "css/cache.css").write_text("excluded cache")
        (self.prod_root / "vendor/bin").mkdir(parents=True)
        (self.prod_root / "vendor/bin/drush.php").touch()
        (self.prod_root / "web/sites/default/settings.php").write_text("PROD settings")
        self.call_log = self.test_root / "calls.log"
        self.environment_values = {
            **os.environ,
            "PATH": f"{self.mock_root}:{os.environ['PATH']}",
            "PROD_PROJECT": str(self.prod_root),
            "PROD_PHP": str(self.mock_root / "php-fixture"),
            "TMPDIR": str(self.test_root),
            "CALL_LOG": str(self.call_log),
            "IMPORTED_SQL": str(self.test_root / "imported.sql"),
            "REAL_PHP": real_php,
        }

    def run_script(self, *extra_args, fail_phase=""):
        return subprocess.run(
            ["bash", str(self.dev_root / "scripts/deploy-content.sh"), *extra_args, "fixture-host"],
            env={**self.environment_values, "FAIL_PHASE": fail_phase},
            text=True, capture_output=True,
        )

    def test_successful_restore(self):
        run_result = self.run_script()
        self.assertEqual(run_result.returncode, 0, run_result.stderr)
        self.assertEqual((self.prod_files / "photo.txt").read_text(), "DEV photo")
        self.assertEqual((self.prod_files / "prod-only.txt").read_text(), "retained")
        self.assertEqual((self.prod_files / "nested folder/new image ü.txt").read_text(), "new nested file")
        self.assertFalse((self.prod_files / "css").exists())
        self.assertEqual((self.prod_root / "web/sites/default/settings.php").read_text(), "PROD settings")
        sql_text = (self.test_root / "imported.sql").read_text()
        self.assertNotIn("sandbox mode", sql_text)
        self.assertIn("COLLATE=utf8mb4_unicode_ci", sql_text)
        self.assertIn("VALUES ('utf8mb4_uca1400_ai_ci')", sql_text)
        log_text = self.call_log.read_text()
        self.assertIn("uploaded-public-file photo.txt", log_text)
        self.assertIn("uploaded-public-file nested folder/new image ü.txt", log_text)
        self.assertNotIn("uploaded-public-file unchanged.txt", log_text)
        self.assertNotIn("uploaded-public-file .htaccess", log_text)
        self.assertNotIn("files.tar", log_text)
        self.assertIn("2 missing/changed", run_result.stdout)
        self.assertIn("2 identical files skipped", run_result.stdout)
        self.assertLess(log_text.index("scp "), log_text.index("sql:drop"))
        self.assertLess(log_text.index("find "), log_text.index("system.maintenance_mode 1"))
        self.assertLess(log_text.index("system.maintenance_mode 1"), log_text.index("sql:drop"))
        self.assertLess(log_text.index("sql:drop"), log_text.index("--file="))
        self.assertLess(log_text.index("updatedb"), log_text.index("system.maintenance_mode 0"))
        self.assertEqual(log_text.count("system.maintenance_mode 0"), 1)
        self.assertEqual(list(self.prod_root.glob(".content-deploy.*")), [])
        archive_path = next(self.test_root.glob("blog-content-deploy.*/database.sql.gz"))
        with gzip.open(archive_path, "rt") as archive_file:
            self.assertEqual(archive_file.read(), sql_text)

    def test_check_does_not_change_content(self):
        run_result = self.run_script("--check")
        self.assertEqual(run_result.returncode, 0, run_result.stderr)
        log_text = self.call_log.read_text()
        for forbidden_text in ("sql:drop", "state:set", "scp ", "mariadb-dump"):
            self.assertNotIn(forbidden_text, log_text)
        self.assertEqual((self.prod_files / "photo.txt").read_text(), "old photo")

    def test_failed_export_or_upload_never_starts_restore(self):
        for fail_phase in ("export", "upload"):
            with self.subTest(fail_phase=fail_phase):
                self.call_log.write_text("")
                run_result = self.run_script(fail_phase=fail_phase)
                self.assertNotEqual(run_result.returncode, 0)
                self.assertNotIn("sql:drop", self.call_log.read_text())
                self.assertEqual((self.prod_files / "photo.txt").read_text(), "old photo")

    def test_starting_database_is_retried_before_ssh(self):
        run_result = self.run_script("--check", fail_phase="starting")
        self.assertEqual(run_result.returncode, 0, run_result.stderr)
        log_text = self.call_log.read_text()
        self.assertEqual(log_text.count("sleep 2"), 2)
        self.assertEqual(log_text.split("ssh ", 1)[0].count('--execute="SELECT 1"'), 3)
        self.assertNotIn("socket is not ready", run_result.stderr)

    def test_stopped_or_unready_database_never_contacts_prod(self):
        for fail_phase in ("stopped", "unready"):
            with self.subTest(fail_phase=fail_phase):
                self.call_log.write_text("")
                run_result = self.run_script(fail_phase=fail_phase)
                self.assertNotEqual(run_result.returncode, 0)
                self.assertNotIn("ssh ", self.call_log.read_text())
                self.assertNotIn("scp ", self.call_log.read_text())
                self.assertIn("DEV database", run_result.stderr)

    def test_import_failure_stops_before_files_or_reopening(self):
        run_result = self.run_script(fail_phase="import")
        self.assertNotEqual(run_result.returncode, 0)
        log_text = self.call_log.read_text()
        self.assertNotIn("updatedb", log_text)
        self.assertNotIn("system.maintenance_mode 0", log_text)
        self.assertGreaterEqual(log_text.count("system.maintenance_mode 1"), 2)
        self.assertEqual((self.prod_files / "photo.txt").read_text(), "old photo")
        self.assertIn("Restore stopped", run_result.stderr)
        self.assertTrue(list(self.prod_root.glob(".content-deploy.*/database.sql")))

    def test_update_failure_does_not_reopen_site(self):
        run_result = self.run_script(fail_phase="updates")
        self.assertNotEqual(run_result.returncode, 0)
        self.assertNotIn("system.maintenance_mode 0", self.call_log.read_text())
        self.assertTrue(list(self.prod_root.glob(".content-deploy.*/database.sql")))

    def test_reporting_failure_after_restore_does_not_reenable_maintenance(self):
        run_result = self.run_script(fail_phase="final_status")
        self.assertNotEqual(run_result.returncode, 0)
        log_text = self.call_log.read_text()
        self.assertIn("system.maintenance_mode 0", log_text)
        self.assertNotIn("system.maintenance_mode 1", log_text.split("system.maintenance_mode 0", 1)[1])
        self.assertIn("maintenance mode disabled", run_result.stdout)

    def test_identical_public_files_transfer_no_file_contents(self):
        shutil.copytree(self.dev_files, self.prod_files, dirs_exist_ok=True)
        run_result = self.run_script()
        self.assertEqual(run_result.returncode, 0, run_result.stderr)
        self.assertIn("0 missing/changed", run_result.stdout)
        self.assertNotIn("uploaded-public-file", self.call_log.read_text())

    def test_corrupt_upload_stops_before_database_replacement(self):
        run_result = self.run_script(fail_phase="corrupt")
        self.assertNotEqual(run_result.returncode, 0)
        self.assertNotIn("sql:drop", self.call_log.read_text())
        self.assertIn("Uploaded file failed verification", run_result.stderr)

    def test_staging_failure_never_enables_maintenance(self):
        run_result = self.run_script(fail_phase="prepare")
        self.assertNotEqual(run_result.returncode, 0)
        log_text = self.call_log.read_text()
        self.assertIn("find ", log_text)
        self.assertNotIn("system.maintenance_mode", log_text)
        self.assertNotIn("sql:drop", log_text)
        self.assertEqual((self.prod_files / "photo.txt").read_text(), "old photo")

    def test_shared_connection_is_opened_once_and_closed(self):
        for fail_phase in ("", "upload", "authentication"):
            with self.subTest(fail_phase=fail_phase):
                self.call_log.write_text("")
                run_result = self.run_script(fail_phase=fail_phase)
                self.assertEqual(run_result.returncode == 0, fail_phase == "")
                log_lines = self.call_log.read_text().splitlines()
                connection_lines = [log_line for log_line in log_lines if log_line.startswith(("ssh ", "scp "))]
                self.assertEqual(sum(" -M " in log_line for log_line in connection_lines), 1)
                self.assertIn(" -O exit ", connection_lines[-1])
                control_paths = {word.split("=", 1)[1] for log_line in connection_lines
                                 for word in log_line.split() if word.startswith("ControlPath=")}
                self.assertEqual(len(control_paths), 1)
                self.assertFalse(Path(next(iter(control_paths))).parent.exists())
                if fail_phase == "authentication":
                    self.assertNotIn("sql:drop", self.call_log.read_text())
                    self.assertFalse(any(log_line.startswith("scp ") for log_line in log_lines))

    def test_incompatible_prod_stops_before_upload_or_import(self):
        run_result = self.run_script(fail_phase="incompatible")
        self.assertNotEqual(run_result.returncode, 0)
        self.assertNotIn("sql:drop", self.call_log.read_text())
        self.assertNotIn("scp ", self.call_log.read_text())
        self.assertIn("PROD is missing DEV extensions", run_result.stderr)


if __name__ == "__main__":
    unittest.main()
