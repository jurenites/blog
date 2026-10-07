#!/usr/bin/env bash
# Finish the already imported DEV snapshot; never drops/imports the database.
set -Eeuo pipefail
umask 077
script_directory="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
project_directory="$(cd "$script_directory/.." && pwd)"
ssh_target="${1:-${PROD_SSH:-}}"
ssh_port="${SSH_PORT:-22}"
prod_project="${PROD_PROJECT:-/var/www/u3614358/data/apps/blog_jurenites}"
prod_php="${PROD_PHP:-/opt/php/8.3/bin/php}"
prod_composer="${PROD_COMPOSER:-/var/www/u3614358/data/bin/composer}"
prod_uri="${PROD_URI:-https://jurenites.com}"
[[ "$ssh_target" =~ ^[a-zA-Z0-9_@.-]+$ && "$ssh_target" != -* && "$ssh_port" =~ ^[0-9]+$ ]] || {
  echo 'Usage: bash scripts/finish-content-deployment.sh user@host' >&2; exit 2;
}
[[ "$prod_project" =~ ^/[a-zA-Z0-9_./-]+$ && "$prod_project" != / ]] || exit 2
local_directory="$(mktemp -d /tmp/blog-finish.XXXXXXXX)"
ssh_options=(-o "ControlPath=$local_directory/socket" -o ControlMaster=no -o BatchMode=yes)
cleanup_repair() {
  local exit_status=$?
  trap - EXIT
  ssh "${ssh_options[@]}" -p "$ssh_port" -O exit "$ssh_target" >/dev/null 2>&1 || true
  rm -rf -- "$local_directory"
  exit "$exit_status"
}
trap cleanup_repair EXIT
trap 'exit 130' INT
trap 'exit 143' TERM
python3 - "$project_directory/composer.lock" "$local_directory/packages.json" <<'PYTHON_SCRIPT'
import json
from pathlib import Path
import sys
lock_data = json.loads(Path(sys.argv[1]).read_text())
package_names = {"drupal/clickhouse", "drupal/devel", "drupal/ms_clarity"}
package_versions = {package_data["name"]: package_data["version"]
    for package_data in lock_data["packages"] + lock_data.get("packages-dev", [])
    if package_data["name"] in package_names}
if set(package_versions) != package_names:
    raise ValueError("Missing repair package in DEV composer.lock")
Path(sys.argv[2]).write_text(json.dumps(package_versions))
print("Installing DEV module versions: " + ", ".join(f"{name} {version}" for name, version in package_versions.items()))
PYTHON_SCRIPT
echo "Opening a shared SSH connection to $ssh_target (authenticate once)..."
ssh -M -N -f -o "ControlPath=$local_directory/socket" -o ControlPersist=no \
  -o ServerAliveInterval=30 -o ServerAliveCountMax=3 -p "$ssh_port" "$ssh_target"
printf -v prepare_command '%q ' bash -s -- "$prod_project" "$prod_php" "$prod_composer"
remote_directory="$(ssh "${ssh_options[@]}" -p "$ssh_port" "$ssh_target" "$prepare_command" <<'REMOTE_PREPARE'
set -euo pipefail
cd "$1"
test -x "$2"
test -f "$3"
test -f vendor/bin/drush.php
test -f web/sites/default/settings.php
command -v patch >/dev/null
"$2" -r 'if (PHP_VERSION_ID < 80300) { exit(1); }'
mktemp -d "$1/.content-repair.XXXXXXXX"
REMOTE_PREPARE
)"
[[ "$remote_directory" =~ ^/[a-zA-Z0-9_./-]+$ && "$remote_directory" == "$prod_project"/.content-repair.* ]] || exit 1
echo "Uploading the two custom modules and repair metadata to $remote_directory"
scp "${ssh_options[@]}" -r -P "$ssh_port" \
  "$project_directory/web/modules/custom/jurenites_metrika" \
  "$project_directory/web/modules/custom/jurenites_practice_shop" \
  "$project_directory/patches/ms-clarity-drupal-11-settings-cache.patch" \
  "$local_directory/packages.json" "$ssh_target:$remote_directory/"
printf -v repair_command '%q ' bash -s -- "$prod_project" "$prod_php" "$prod_composer" "$prod_uri" "$remote_directory"
ssh "${ssh_options[@]}" -p "$ssh_port" "$ssh_target" "$repair_command" <<'REMOTE_REPAIR'
set -Eeuo pipefail
umask 077
prod_project="$1"
prod_php="$2"
prod_composer="$3"
prod_uri="$4"
remote_directory="$5"
export PATH="$(dirname "$prod_php"):$PATH"
cd "$prod_project"
drush_command() { "$prod_php" ./vendor/bin/drush.php --uri="$prod_uri" "$@"; }
trap 'echo "Repair stopped; inspect PROD before reopening it. Repair files: $remote_directory" >&2' ERR
drush_command state:set system.maintenance_mode 1 --input-format=integer
cp composer.json "$remote_directory/composer.before.json"
cp composer.lock "$remote_directory/composer.before.lock"
echo 'Installing the three contributed modules and their required dependencies...'
"$prod_php" -r '
  $composer_path = "composer.json";
  $composer_data = json_decode(file_get_contents($composer_path), true, 512, JSON_THROW_ON_ERROR);
  $package_versions = json_decode(file_get_contents($argv[1]), true, 512, JSON_THROW_ON_ERROR);
  foreach ($package_versions as $package_name => $package_version) {
    $composer_data["require"][$package_name] = $package_version;
    unset($composer_data["require-dev"][$package_name]);
  }
  if (isset($composer_data["require-dev"]) && !$composer_data["require-dev"]) { unset($composer_data["require-dev"]); }
  file_put_contents($composer_path, json_encode($composer_data, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES | JSON_THROW_ON_ERROR) . "\n", LOCK_EX);
' "$remote_directory/packages.json"
# This targets only the three named packages and dependencies, not a full update.
umask 022
"$prod_php" "$prod_composer" update drupal/clickhouse drupal/devel drupal/ms_clarity \
  --with-dependencies --no-dev --no-interaction --no-progress
for module_name in clickhouse devel ms_clarity; do
  if [[ ! -f "web/modules/contrib/$module_name/$module_name.info.yml" ]]; then
    "$prod_php" "$prod_composer" reinstall "drupal/$module_name" --no-interaction --no-progress
  fi
done
umask 077
# Retain this project's existing Drupal 11 Clarity compatibility fix.
clarity_patch="$remote_directory/ms-clarity-drupal-11-settings-cache.patch"
if patch --dry-run --batch --forward -p1 -d web/modules/contrib/ms_clarity < "$clarity_patch" >/dev/null 2>&1; then
  patch --batch --forward -p1 -d web/modules/contrib/ms_clarity < "$clarity_patch"
elif ! patch --dry-run --batch --reverse -p1 -d web/modules/contrib/ms_clarity < "$clarity_patch" >/dev/null 2>&1; then
  echo 'Clarity patch does not match the installed module. Stopping for review.' >&2
  exit 1
fi
echo 'Installing missing custom modules...'
for module_name in jurenites_metrika jurenites_practice_shop; do
  if [[ ! -e "web/modules/custom/$module_name" ]]; then
    cp -R "$remote_directory/$module_name" web/modules/custom/
    find "web/modules/custom/$module_name" -type d -exec chmod 755 {} +
    find "web/modules/custom/$module_name" -type f -exec chmod 644 {} +
  fi
  test -f "web/modules/custom/$module_name/$module_name.info.yml"
done
echo 'Repairing the configuration sync directory while preserving PROD settings...'
export REPAIR_DIRECTORY="$remote_directory"
drush_command php:eval '
  $sync_directory = \Drupal\Core\Site\Settings::get("config_sync_directory");
  if (!is_string($sync_directory) || $sync_directory === "") {
    $sync_directory = dirname(DRUPAL_ROOT) . "/config/sync";
    $settings_path = DRUPAL_ROOT . "/" . \Drupal::getContainer()->getParameter("site.path") . "/settings.php";
    $settings_source = file_get_contents($settings_path);
    if ($settings_source === false || !copy($settings_path, getenv("REPAIR_DIRECTORY") . "/settings.before.php")) {
      throw new \RuntimeException("Cannot back up PROD settings");
    }
    $inside_php = false;
    foreach (token_get_all($settings_source) as $source_token) {
      if (is_array($source_token) && $source_token[0] === T_OPEN_TAG) { $inside_php = true; }
      if (is_array($source_token) && $source_token[0] === T_CLOSE_TAG) { $inside_php = false; }
    }
    $settings_source .= ($inside_php ? "\n" : "\n<?php\n") . "\$settings[\"config_sync_directory\"] = " . var_export($sync_directory, true) . ";\n";
    $settings_mode = fileperms($settings_path) & 0777;
    if (!chmod($settings_path, $settings_mode | 0200)) { throw new \RuntimeException("Cannot make settings writable"); }
    try {
      if (file_put_contents($settings_path, $settings_source, LOCK_EX) === false) { throw new \RuntimeException("Cannot update settings"); }
    } finally { chmod($settings_path, $settings_mode); }
  }
  if (!is_dir($sync_directory) && !mkdir($sync_directory, 0755, true)) {
    throw new \RuntimeException("Cannot create config sync directory");
  }
'
"$prod_php" -l web/sites/default/settings.php
drush_command cache:rebuild
drush_command php:eval '
  $active_extensions = \Drupal::config("core.extension");
  foreach (["module", "theme"] as $extension_type) {
    $available_extensions = \Drupal::service("extension.list." . $extension_type)->getList(true);
    $missing_extensions = array_diff(array_keys($active_extensions->get($extension_type) ?? []), array_keys($available_extensions));
    if ($missing_extensions) { throw new \RuntimeException("Still missing: " . implode(", ", $missing_extensions)); }
  }
  $sync_directory = \Drupal\Core\Site\Settings::get("config_sync_directory");
  if (!is_string($sync_directory) || $sync_directory === "" || !is_dir($sync_directory)) { throw new \RuntimeException("Invalid config sync directory"); }
'
echo 'Finishing Drupal updates with PHP 8.3 for parent and child processes...'
drush_command updatedb --yes
drush_command cache:rebuild
drush_command php:eval 'if (!\Drupal::database()->query("SELECT 1")->fetchField()) { throw new \RuntimeException("Database verification failed"); }'
drush_command state:set system.maintenance_mode 0 --input-format=integer
drush_command cache:rebuild
drush_command status --fields=drupal-version,bootstrap,db-status,root,uri
echo "Repair complete. Maintenance is disabled. Settings and Composer backups retained at: $remote_directory"
REMOTE_REPAIR
