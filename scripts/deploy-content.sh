#!/usr/bin/env bash
# Run on DEV: bash scripts/deploy-content.sh user@host
# Only the database and public files are deployed. No Git commands are run.
set -Eeuo pipefail
umask 077

script_directory="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
project_directory="$(cd "$script_directory/.." && pwd)"
run_mode=deploy
case "${1:-}" in
  --check) run_mode=check; shift ;;
  --help|-h)
    echo 'Usage: bash scripts/deploy-content.sh [--check] user@host'
    echo 'Overrides: PROD_PROJECT, PROD_PHP, PROD_URI, SSH_PORT, DEV_DB_CONTAINER'
    exit 0 ;;
  --*) echo "Unknown option: $1" >&2; exit 2 ;;
esac
ssh_target="${1:-${PROD_SSH:-}}"
prod_project="${PROD_PROJECT:-/var/www/u3614358/data/apps/blog_jurenites}"
prod_php="${PROD_PHP:-/opt/php/8.3/bin/php}"
prod_uri="${PROD_URI:-https://jurenites.com}"
ssh_port="${SSH_PORT:-22}"
dev_db_container="${DEV_DB_CONTAINER:-blog_jurenites_db}"
if [[ -z "$ssh_target" || "$ssh_target" == -* || $# -gt 1 ]]; then
  echo 'Supply your SSH alias or user@host. Use --help for usage.' >&2
  exit 2
fi
[[ "$ssh_port" =~ ^[0-9]+$ ]] || { echo 'SSH_PORT must be numeric.' >&2; exit 2; }
# These paths are also used by scp. Reject shell metacharacters and relative paths.
[[ "$prod_project" =~ ^/[a-zA-Z0-9_./-]+$ && "$prod_project" != / ]] || exit 2
[[ "$prod_php" =~ ^/[a-zA-Z0-9_./-]+$ ]] || exit 2
[[ "$ssh_target" =~ ^[a-zA-Z0-9_@.-]+$ ]] || exit 2

for command_name in docker ssh scp python3 gzip sed; do
  command -v "$command_name" >/dev/null || { echo "Missing: $command_name" >&2; exit 1; }
done
test -f "$project_directory/web/sites/default/files/.htaccess"
check_dev_database() {
  docker exec "$dev_db_container" sh -eu -c '
    export MYSQL_PWD="$MARIADB_PASSWORD"
    mariadb --connect-timeout=2 --user="$MARIADB_USER" "$MARIADB_DATABASE" --execute="SELECT 1" >/dev/null
  '
}
wait_for_dev_database() {
  local container_running attempt_number
  container_running="$(docker inspect --format '{{.State.Running}}' "$dev_db_container")" || return 1
  if [[ "$container_running" != true ]]; then
    echo "DEV database container $dev_db_container is stopped. Run: docker compose up -d db" >&2
    return 1
  fi
  echo "Waiting for DEV database in $dev_db_container to accept connections..."
  for ((attempt_number = 1; attempt_number <= 30; attempt_number++)); do
    if check_dev_database >/dev/null 2>&1; then
      return 0
    fi
    sleep 2
  done
  echo "DEV database did not become ready. Inspect: docker logs --tail 50 $dev_db_container" >&2
  check_dev_database || true
  return 1
}
wait_for_dev_database
dev_extensions_hex="$(docker exec "$dev_db_container" sh -eu -c '
  export MYSQL_PWD="$MARIADB_PASSWORD"
  mariadb --user="$MARIADB_USER" "$MARIADB_DATABASE" --batch --skip-column-names \
    --execute="SELECT HEX(data) FROM config WHERE name = '\''core.extension'\''"
')"
[[ "$dev_extensions_hex" =~ ^[0-9A-Fa-f]+$ ]] || { echo 'Cannot read DEV extension inventory.' >&2; exit 1; }

# Keep one authenticated connection for every SSH command and scp upload.
# A short private path also fits macOS Unix socket path limits.
ssh_session_directory="$(mktemp -d /tmp/blog-deploy-ssh.XXXXXXXX)"
ssh_control_path="$ssh_session_directory/socket"
ssh_shared_options=(-o "ControlPath=$ssh_control_path" -o ControlMaster=no -o BatchMode=yes)
export_directory=''
cleanup_deployment() {
  local exit_status=$?
  trap - EXIT
  ssh "${ssh_shared_options[@]}" -p "$ssh_port" -O exit "$ssh_target" >/dev/null 2>&1 || true
  rm -rf -- "$ssh_session_directory"
  if [[ -n "$export_directory" ]]; then
    echo "Local export retained at: $export_directory"
  fi
  exit "$exit_status"
}
trap cleanup_deployment EXIT
trap 'exit 130' INT
trap 'exit 143' TERM
echo "Opening a shared SSH connection to $ssh_target (authenticate once)..."
ssh -M -N -f -o "ControlPath=$ssh_control_path" -o ControlPersist=no \
  -o ServerAliveInterval=30 -o ServerAliveCountMax=3 -p "$ssh_port" "$ssh_target"

remote_command() {
  local command_text
  printf -v command_text '%q ' bash -s -- "$prod_project" "$prod_php" "$prod_uri" "$1" "${2:-}" "$dev_extensions_hex"
  ssh "${ssh_shared_options[@]}" -p "$ssh_port" "$ssh_target" "$command_text" <<'REMOTE_SCRIPT'
set -Eeuo pipefail
umask 077
prod_project="$1"
prod_php="$2"
prod_uri="$3"
remote_action="$4"
remote_directory="$5"
export DEV_EXTENSIONS_HEX="$6"
# Drush launches child commands via /usr/bin/env php.
export PATH="$(dirname "$prod_php"):$PATH"
cd "$prod_project"
drush_command() { "$prod_php" ./vendor/bin/drush.php --uri="$prod_uri" "$@"; }
test -f web/sites/default/settings.php
test -f vendor/bin/drush.php
test -d web/sites/default/files
test -w web/sites/default/files
command -v mysql >/dev/null || command -v mariadb >/dev/null
command -v gzip >/dev/null

case "$remote_action" in
  check)
    drush_command sql:query 'SELECT DATABASE(), VERSION();'
    drush_command status --fields=drupal-version,bootstrap,db-status,root,uri
    drush_command php:eval 'if (!\Drupal::database()->query("SELECT 1")->fetchField()) { throw new \RuntimeException("Database verification failed"); }'
    drush_command php:eval '
      $sync_directory = \Drupal\Core\Site\Settings::get("config_sync_directory");
      if (!is_string($sync_directory) || $sync_directory === "" || !is_dir($sync_directory)) {
        throw new \RuntimeException("PROD config_sync_directory must point to an existing directory before deployment.");
      }
      $source_extensions = unserialize(hex2bin(getenv("DEV_EXTENSIONS_HEX")), ["allowed_classes" => false]);
      if (!is_array($source_extensions) || !isset($source_extensions["module"])) {
        throw new \RuntimeException("Invalid DEV extension inventory.");
      }
      $missing_extensions = [];
      foreach (["module", "theme"] as $extension_type) {
        $available_extensions = \Drupal::service("extension.list." . $extension_type)->getList(true);
        foreach (array_keys($source_extensions[$extension_type] ?? []) as $extension_name) {
          if (!isset($available_extensions[$extension_name])) { $missing_extensions[] = $extension_name; }
        }
      }
      if ($missing_extensions) {
        throw new \RuntimeException("PROD is missing DEV extensions: " . implode(", ", $missing_extensions) . ". Install matching code before importing the database.");
      }
    '
    ;;
  stage)
    # Private staging is outside web/ and has an unpredictable name.
    mktemp -d "$prod_project/.content-deploy.XXXXXXXX"
    ;;
  manifest)
    "$prod_php" -r '
      $public_root = "web/sites/default/files";
      $file_hashes = [];
      $directory_walk = new RecursiveDirectoryIterator($public_root, FilesystemIterator::SKIP_DOTS);
      $filtered_walk = new RecursiveCallbackFilterIterator($directory_walk, function ($file_info) use ($public_root) {
        $relative_path = substr($file_info->getPathname(), strlen($public_root) + 1);
        $path_parts = explode("/", $relative_path);
        $base_name = $file_info->getFilename();
        return !in_array($path_parts[0], ["css", "js", "php", "styles", "translations", "tmp"], true)
          && !str_starts_with($path_parts[0], "config_")
          && $base_name !== ".DS_Store" && !str_starts_with($base_name, "._")
          && !$file_info->isLink();
      });
      foreach (new RecursiveIteratorIterator($filtered_walk) as $file_info) {
        if (!$file_info->isFile()) { continue; }
        $file_hash = hash_file("sha256", $file_info->getPathname());
        if ($file_hash === false) { throw new RuntimeException("Cannot hash public file"); }
        $relative_path = substr($file_info->getPathname(), strlen($public_root) + 1);
        $file_hashes[$relative_path] = $file_hash;
      }
      echo json_encode((object) $file_hashes, JSON_THROW_ON_ERROR);
    '
    ;;
  deploy)
    [[ "$remote_directory" == "$prod_project"/.content-deploy.* ]]
    test -d "$remote_directory"
    gzip -t "$remote_directory/database.sql.gz"
    test -d "$remote_directory/files"
    "$prod_php" -r '
      $stage_root = $argv[1];
      $file_hashes = json_decode(file_get_contents($stage_root . "/changed-files.json"), true, 512, JSON_THROW_ON_ERROR);
      foreach ($file_hashes as $relative_path => $expected_hash) {
        $stage_path = $stage_root . "/files/" . $relative_path;
        if (!is_file($stage_path) || hash_file("sha256", $stage_path) !== $expected_hash) {
          throw new RuntimeException("Uploaded file failed verification: " . $relative_path);
        }
      }
    ' "$remote_directory"
    test -f "$remote_directory/files/.htaccess" || test -f web/sites/default/files/.htaccess
    gzip -dc "$remote_directory/database.sql.gz" > "$remote_directory/database.sql"
    grep -q '^CREATE TABLE' "$remote_directory/database.sql"
    trap 'echo "Restore stopped. Inspect PROD before reopening it. Uploaded data retained at: $remote_directory" >&2' ERR
    echo '1/3 Replacing PROD database with DEV data...'
    drush_command state:set system.maintenance_mode 1 --input-format=integer
    drush_command cache:rebuild
    # sql:query invokes the mysql/mariadb terminal client with credentials
    # from PROD settings.php. No database passwords enter this script.
    drush_command sql:drop --yes
    drush_command sql:query --file="$remote_directory/database.sql"
    # Rebuild before a full bootstrap can encounter DEV's cached container paths.
    drush_command cache:rebuild
    drush_command state:set system.maintenance_mode 1 --input-format=integer
    echo '2/3 Installing the public files transferred with scp...'
    # Overlay: overwrite matching files; retain PROD-only files.
    # Set public modes explicitly because the staging directory is private.
    find "$remote_directory/files" -type d -exec chmod 755 {} +
    find "$remote_directory/files" -type f -exec chmod 644 {} +
    cp -R "$remote_directory/files/." web/sites/default/files/
    echo '3/3 Running Drupal updates and rebuilding cache...'
    drush_command updatedb --yes
    drush_command cache:rebuild
    drush_command php:eval 'if (!\Drupal::database()->query("SELECT 1")->fetchField()) { throw new \RuntimeException("Database verification failed"); }'
    drush_command state:set system.maintenance_mode 0 --input-format=integer
    drush_command cache:rebuild
    drush_command status --fields=drupal-version,bootstrap,db-status,root,uri
    rm -rf -- "$remote_directory"
    ;;
esac
REMOTE_SCRIPT
}

echo "Checking DEV and PROD: $ssh_target:$prod_project"
remote_command check
if [[ "$run_mode" == check ]]; then
  echo 'Connection, database, Drush and files-directory checks passed. No content changed.'
  exit 0
fi

export_directory="$(mktemp -d "${TMPDIR:-/tmp}/blog-content-deploy.XXXXXXXX")"
echo 'Comparing DEV and PROD public files by SHA-256...'
remote_command manifest > "$export_directory/prod-files.json"
python3 - "$project_directory/web/sites/default/files" "$export_directory" <<'PYTHON_SCRIPT'
import hashlib
import json
import os
from pathlib import Path
import shutil
import sys

public_root = Path(sys.argv[1])
export_root = Path(sys.argv[2])
remote_hashes = json.loads((export_root / "prod-files.json").read_text())
if not isinstance(remote_hashes, dict):
    raise ValueError("Invalid PROD file manifest")
staging_root = export_root / "files"
staging_root.mkdir()
changed_hashes = {}
skipped_count = 0
changed_bytes = 0
excluded_roots = {"css", "js", "php", "styles", "translations", "tmp"}

def file_digest(file_path):
    digest_value = hashlib.sha256()
    with file_path.open("rb") as file_stream:
        for data_chunk in iter(lambda: file_stream.read(1024 * 1024), b""):
            digest_value.update(data_chunk)
    return digest_value.hexdigest()

for current_root, directory_names, file_names in os.walk(public_root):
    relative_root = Path(current_root).relative_to(public_root)
    directory_names[:] = [directory_name for directory_name in directory_names
        if not directory_name.startswith("._") and not (
            relative_root == Path(".") and (directory_name in excluded_roots or directory_name.startswith("config_")))]
    for directory_name in directory_names:
        if (Path(current_root) / directory_name).is_symlink():
            raise ValueError("Public file symlinks are unsupported")
    for file_name in sorted(file_names):
        if file_name == ".DS_Store" or file_name.startswith("._"):
            continue
        source_path = Path(current_root) / file_name
        if source_path.is_symlink():
            raise ValueError("Public file symlinks are unsupported")
        relative_path = (relative_root / file_name).as_posix()
        source_hash = file_digest(source_path)
        if remote_hashes.get(relative_path) == source_hash:
            skipped_count += 1
            continue
        stage_path = staging_root / relative_path
        stage_path.parent.mkdir(parents=True, exist_ok=True)
        shutil.copyfile(source_path, stage_path)
        changed_hashes[relative_path] = file_digest(stage_path)
        changed_bytes += stage_path.stat().st_size
(export_root / "changed-files.json").write_text(json.dumps(changed_hashes))
print(f"Public files: {len(changed_hashes)} missing/changed ({changed_bytes / 1048576:.2f} MiB); {skipped_count} identical files skipped.")
PYTHON_SCRIPT
echo 'Exporting the current DEV database...'
docker exec "$dev_db_container" sh -eu -c '
  export MYSQL_PWD="$MARIADB_PASSWORD"
  exec mariadb-dump --user="$MARIADB_USER" --single-transaction --quick \
    --hex-blob --add-drop-table --default-character-set=utf8mb4 \
    --no-tablespaces "$MARIADB_DATABASE"
' | LC_ALL=C sed \
  -e '1{/sandbox mode/d;}' \
  -e '/^CREATE TABLE /,/^).*;$/s/utf8mb4_uca1400_ai_ci/utf8mb4_unicode_ci/g' \
  | gzip > "$export_directory/database.sql.gz"
gzip -t "$export_directory/database.sql.gz"

remote_directory="$(remote_command stage)"
[[ "$remote_directory" =~ ^/[a-zA-Z0-9_./-]+$ && "$remote_directory" == "$prod_project"/.content-deploy.* ]] || exit 1
echo "Uploading database and only missing/changed public files with scp to $ssh_target:$remote_directory"
scp "${ssh_shared_options[@]}" -r -P "$ssh_port" "$export_directory/database.sql.gz" "$export_directory/changed-files.json" "$export_directory/files" \
  "$ssh_target:$remote_directory/"
remote_command deploy "$remote_directory"
echo 'Database and public files deployed. Drupal updates and cache rebuild completed.'
