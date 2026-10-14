# Command Cheat Sheet

Keep DEV, STAGE, and PROD commands separate. Local database host `db` resolves
inside Docker, so run DEV Drush in `blog_jurenites_web`. Hosting paths below are
the documented ISPmanager layout; confirm the checkout, branch, site URI, and
backup location before operating on a remote environment.

## Local DEV

Start Docker Desktop. Run the commands below in the **local macOS Terminal**
from the repository root:

```bash
cd /Users/alexanderilivanov/Projects/blog_jurenites
```

Add these hostnames to `/etc/hosts` once (editing this file requires administrator
access):

```text
127.0.0.1 jurenites.local storybook.jurenites.local test.jurenites.local presentation.jurenites.local
```

Use the existing local DEV settings. The standard Drupal Docker services define
their environment variables in `docker-compose.yml`; no new root `.env` file is
required for these startup commands. Keep any existing local `.env` and Drupal
`settings.php` values local.

### 1. Drupal Docker container

Install frontend dependencies on first setup or after the lockfile changes,
then start the stack and build the theme:

```bash
npm ci
docker compose up -d
npm run build:theme
docker exec blog_jurenites_web ./vendor/bin/drush cr
```

Open [Drupal](http://jurenites.local). The stack starts the database, Drupal,
Storybook, and the local proxy. This assumes the existing local Drupal database
and `settings.php` are already configured.

Check containers and Drupal:

```bash
docker compose ps
curl --fail -I http://jurenites.local
docker compose logs --tail=100 web db local_proxy
```

If the local proxy is unavailable, check Drupal from inside its container with `curl --fail -I -H 'Host: jurenites.local' http://127.0.0.1/` through `docker exec`. That checks Drupal separately from host routing.

### 2. Storybook

The stack above starts Storybook automatically. To start it and its proxy again:

```bash
docker compose up -d storybook local_proxy
docker compose logs -f storybook
```

Wait for Storybook to report that it is ready, then open
[Storybook](http://storybook.jurenites.local). Press `Ctrl+C` to leave the log
view; the container keeps running.

Alternatively, run Storybook directly on the Mac after `npm ci`:

```bash
npm run storybook
```

Keep that terminal open and visit [localhost:6006](http://localhost:6006).
Press `Ctrl+C` to stop it. The `storybook.jurenites.local` address routes to the
Docker Storybook service, not this host process.

### 3. Visual testing — test.jurenites.local

With the Docker stack running, build and serve the dashboard on the Mac:

```bash
npm run playwright:install  # First setup, or after a Playwright browser update.
npm run status:build
npm run status:serve
```

Keep this terminal open. Open the
[visual testing dashboard](http://test.jurenites.local), or use
[127.0.0.1:7779](http://127.0.0.1:7779) directly. The dashboard serves its own
built Storybook; rerun `npm run status:build` after source changes and restart
`npm run status:serve` after server changes.

In a second terminal at the repository root, verify the dashboard and its API:

```bash
curl --fail -I http://test.jurenites.local/
curl --fail http://test.jurenites.local/api/status
```

If the checked-in proxy configuration changed while Docker was running, reload it:

```bash
docker compose exec local_proxy nginx -t
docker compose exec local_proxy nginx -s reload
```

Both the Docker proxy and `npm run status:serve` must remain running for
`test.jurenites.local` to work. For capture commands and troubleshooting, see the
[visual testing guide](visual-testing-plan.md#implemented-local-component-status).

### 4. Presentation UX — presentation.jurenites.local

Presentation UX is the separate comparison/presentation app in
`/Users/alexanderilivanov/Projects/namesilo/presentation-ux`. Its complete static
application is in `dist/`, including the embedded NameSilo snapshots. Serving
the existing files needs no build, dependency install, Drupal, or database.
The local proxy configuration includes `presentation.jurenites.local` and its
read-only asset mount. Add the hosts entry on each Mac using this checkout.

For an immediate preview, run in a separate **local macOS Terminal**:

```bash
cd /Users/alexanderilivanov/Projects/namesilo/presentation-ux
./start-preview.command
```

Keep that terminal open and visit
[Presentation UX](http://127.0.0.1:8094/#story-1). `Ctrl+C` stops this preview.
If port 8094 is already in use by the app, use the running instance. Opening
`dist/index.html` as a `file://` URL does not replace an HTTP server.

The primary local address is
[presentation.jurenites.local](http://presentation.jurenites.local/#story-1).
The following documents the existing Docker Nginx setup for another machine:

1. Add `127.0.0.1 presentation.jurenites.local` to `/etc/hosts` once.
2. Ensure the following read-only mount exists in the
   `services.local_proxy.volumes` list in `docker-compose.yml`. The relative
   source assumes `blog_jurenites` and `namesilo` are sibling directories.

   ```yaml
   - ../namesilo/presentation-ux/dist:/srv/presentation-ux:ro
   ```

3. Ensure this server block exists in `docker/local-proxy.conf`, alongside the existing
   named hosts. Keep the existing default server and other host blocks.

   ```nginx
   server {
     listen 80;
     server_name presentation.jurenites.local;
     root /srv/presentation-ux;
     index index.html;

     location / {
       try_files $uri $uri/ =404;
     }
   }
   ```

4. With the Docker stack running, validate and recreate the proxy from the
   **blog repository root**. Recreation applies the new volume mount; an Nginx
   reload alone cannot add it. This briefly interrupts the other local hosts.

   ```bash
   cd /Users/alexanderilivanov/Projects/blog_jurenites
   docker compose config --quiet && \
     docker compose run --rm --no-deps local_proxy nginx -t && \
     docker compose up -d --no-deps --force-recreate local_proxy
   curl --fail -I http://presentation.jurenites.local/
   curl --fail -I http://presentation.jurenites.local/app.js
   ```

Open [the local subdomain](http://presentation.jurenites.local/#story-1).
Docker serves the mounted files directly, so this address does not depend on
the Python preview process on port 8094. Refresh after changing `dist/` files.
For later changes to the Nginx configuration alone, use the syntax-check and
reload commands in section 3 above. For production, see
[Deploy Presentation UX to PROD](#deploy-presentation-ux-to-prod).

### Stop local services

Press `Ctrl+C` in the dashboard terminal (and the host Storybook terminal, if
used). Stop Docker services without deleting database volumes:

```bash
docker compose stop
```

### Build and documentation checks

(optional) Useful independent commands:

```bash
npm run build:tokens
npm run build-storybook
npm run build:info:check
npm run lint
npm run docs:check
npm run version:check
npm run version:bump
```

increments the minor version. Use `-- patch` for a correction or `-- major` for an incompatible change. Rebuild Storybook after a version change before checking its embedded identity. `npm run build:info` refreshes metadata only; it does not rebuild stale application code.

### Dependency and database updates

Resolve dependency changes in DEV and deploy the reviewed `composer.lock` with `composer install` in PROD. `composer.lock` records resolved versions; do not use an old update report in this runbook as evidence of current patch status. The local Dockerfile uses Drupal's PHP 8.4 Apache image; the documented shared host commands explicitly select PHP 8.3.

Save `composer.json`, `composer.lock`, and a compressed database backup outside `web/` before updating. Check pending hooks first because `updatedb` also applies custom-module content and configuration migrations.

```bash
docker exec blog_jurenites_web ./vendor/bin/drush updatedb:status
docker exec blog_jurenites_web composer outdated 'drupal/*' --direct
docker exec blog_jurenites_web composer update 'drupal/*' --with-all-dependencies --dry-run --no-interaction
```

After reviewing the proposed changes:

```bash
docker exec blog_jurenites_web composer update 'drupal/*' --with-all-dependencies --no-interaction
docker exec blog_jurenites_web composer validate --strict
docker exec blog_jurenites_web composer check-platform-reqs
docker exec blog_jurenites_web composer audit
docker exec blog_jurenites_web ./vendor/bin/drush updatedb --yes
docker exec blog_jurenites_web ./vendor/bin/drush cr
docker exec blog_jurenites_web ./vendor/bin/drush updatedb:status
```

Apply only the setup recipes required by the feature, following its owning doc.
For example:

```bash
docker exec blog_jurenites_web ./vendor/bin/drush recipe /opt/drupal/recipes/jurenites_media
```



### ClickHouse integration

Composer includes `drupal/clickhouse:^1.0@alpha`, locked to `1.0.0-alpha1`.
This prerelease supports Drupal 11/12 and provides a PHP query and bulk-insert
API for a separate ClickHouse server. Drupal continues to use MariaDB locally.

The integration is for local evaluation on the M1 Mac. Enable the module and
rebuild caches in local DEV:

```bash
docker exec blog_jurenites_web ./vendor/bin/drush pm:enable clickhouse --yes
docker exec blog_jurenites_web ./vendor/bin/drush cache:rebuild
docker exec blog_jurenites_web ./vendor/bin/drush pm:list --filter=clickhouse --fields=name,status,version
```

Connections belong in environment-owned `$settings['clickhouse']` entries in
`settings.php`, with credentials kept outside version control. There is no
connection configuration form. Supply the server host, database, username,
password, scheme, and HTTP port (normally 8123, not native-protocol port 9000).
Connections are read-only unless explicitly configured with `write => TRUE`.
See `web/modules/contrib/clickhouse/README.md` for the connection and API contract.

#### Local ClickHouse server

The optional `clickhouse` Compose service uses the native ARM64 `26.8` LTS
image, with a 2 GB container memory limit and settings for small datasets in
`docker/clickhouse/`. It shares the local Drupal Docker network, but publishes
only `127.0.0.1:8123` on the Mac. The native database port is not published.
The `analytics` profile keeps it out of ordinary `docker compose up -d` startup.

```bash
docker compose up -d clickhouse
docker compose ps clickhouse
docker compose stop clickhouse
```

Run these commands from the repository root. The named `clickhouse-data` volume
preserves data when the container stops or is recreated. `docker compose down -v`
deletes project database volumes, including MariaDB; do not use it to stop this
experiment. There is no automatic restart policy: explicitly start ClickHouse
again when needed after restarting Docker.

Open [http://localhost:8123/play](http://localhost:8123/play) for the built-in SQL interface. The local
database is `local_analytics`, and the user is `local_analyst`. Its generated
password is stored in ignored `docker/clickhouse/.env.local`. This file contains
`CLICKHOUSE_DB`, `CLICKHOUSE_USER`, and `CLICKHOUSE_PASSWORD`; recreate it with a
new password on a new machine before starting this service. Never publish it.
The browser interface uses these database credentials, not a ClickHouse Cloud
account. For example, query generated rows without storing any visitor data:

```sql
SELECT number % 10 AS event_bucket, count() AS event_count
FROM numbers(1000000)
GROUP BY event_bucket
ORDER BY event_bucket;
```

For an authenticated terminal session using the container's local credentials:

```bash
docker compose exec clickhouse sh -c 'exec clickhouse-client --user "$CLICKHOUSE_USER" --password "$CLICKHOUSE_PASSWORD" --database "$CLICKHOUSE_DB"'
```

The ignored local Drupal `settings.php` defines a read-only `default` connection to host `clickhouse`, database `local_analytics`, using the same credentials. The local SQL console account permits creating tables for experiments; Drupal's connection requests read-only queries. Verify it through the installed module:

```bash
docker exec blog_jurenites_web ./vendor/bin/drush php:eval 'echo \Drupal::service("clickhouse")->get()->queryScalar("SELECT version()") . PHP_EOL;'
```

This setup collects no visitor events automatically and has no Cloud subscription. Keep it on the Mac. Do not copy local settings or provision ClickHouse on Hosting-0.

### Artwork and Git

`output/ceramic-logo/.gitignore` keeps generated renders, reports, Blender backups, and Python caches local. Preserve editable scenes and source artwork. For already tracked generated files, a reviewed `git rm --cached` removes only the index entry and keeps the working file. Review the staged diff before committing. A cleanup commit does not remove historical blobs; rewriting published history is a separate coordinated operation.

## Upload missing public files to PROD over SSH

Run this single `rsync` command in the **local macOS Terminal** after confirming that `u3614358@server290.hosting.reg.ru` is the SSH login you use for this hosting account. The source and destination trailing slashes copy the contents of `files/` into the existing PROD `files/` directory. The command skips generated caches and the configuration directory, uploads missing files, and does not overwrite or delete files already on PROD.

```bash
rsync -rltv --progress --ignore-existing -e ssh --exclude='.DS_Store' --exclude='._*' --exclude='/css/' --exclude='/js/' --exclude='/php/' --exclude='/styles/' --exclude='/translations/' --exclude='/tmp/' --exclude='/config_*/' /Users/alexanderilivanov/Projects/blog_jurenites/web/sites/default/files/ u3614358@server290.hosting.reg.ru:/var/www/u3614358/data/www/jurenites.com/web/sites/default/files/
```

This is an additive upload for missing originals, not the full DEV-to-PROD content restore below. An existing file with the same path is left as it is, even if the local copy differs. Run the command again if the SSH connection is interrupted; check the `rsync` exit status and transfer summary before assuming the upload finished.

## DEV to PROD content restore

Use this procedure only for an intentional replacement of PROD content with a DEV snapshot. Ordinary production code updates do not require a database import. A restore replaces content, users, submissions, and active configuration; public files transfer separately. Keep the target environment's settings and secrets.

### SSH shortcut: database and public files only

From the local Mac, run [the content deployment script](../scripts/deploy-content.sh). It does not commit, push, pull, install dependencies, or copy application code. PROD must already contain code and dependencies compatible with the current DEV database, including all enabled modules. Existing backups are managed separately; the script does not make another PROD backup or automatically roll back.

(optional) Start the local database if it is stopped, then check the SSH destination:

```bash
docker compose up -d db
```

(optional) check

```bash
bash scripts/deploy-content.sh --check u3614358@server290.hosting.reg.ru
```

The script retries the local database connection 30 times with two-second pauses while MariaDB starts. A running container can briefly have no database socket; this startup delay is handled before any SSH connection. If the container is stopped or never becomes ready, the script exits without contacting PROD and prints a local diagnostic command.

The check tests database connectivity, Drush availability, public-directory write access, an existing configuration sync directory, and presence on PROD of every module/theme enabled in DEV, without replacing content. It reports the destination database and Drupal status. Presence alone does not prove matching code versions or schema compatibility. Drush child processes inherit the selected PHP directory through PATH, so they use the same PHP version as the parent command. Use your actual SSH alias/login if it differs from this hosting example.

Run the restore with one command:

```bash
bash scripts/deploy-content.sh u3614358@server290.hosting.reg.ru
```

The default project directory is `/var/www/u3614358/data/apps/blog_jurenites`, PHP is `/opt/php/8.3/bin/php`, and the site URI is `https://jurenites.com`.
Override these with `PROD_PROJECT`, `PROD_PHP`, `PROD_URI`, and `SSH_PORT` environment variables if needed. SSH keys and connection settings can live in your normal SSH config. `PROD_SSH` can supply the destination when the argument is omitted.

Each invocation opens one shared SSH connection. Enter the hosting password once when that connection opens; all subsequent SSH commands and `scp` uploads reuse it. Passwords are not saved. The connection closes on completion, failure, or Ctrl+C. Later commands use batch mode so a lost connection cannot trigger another password prompt. Key-based authentication continues to work normally.

The script compares SHA-256 file hashes for DEV and PROD public files, prints the number and size of missing/changed files, and uses `scp -r` to transfer only those files in their original directory structure. Identical files are skipped even when timestamps differ; changed contents are detected even when sizes match. There is no public-files tar archive. `.htaccess` participates in the comparison; the same generated directories as the manual export below are excluded. Python 3 is required on the Mac; the existing PHP CLI computes hashes on PROD. Public-file
symlinks are unsupported and stop the export.

The Docker `blog_jurenites_db` database is still exported in full and compressed, with the known MariaDB-only collation converted in table definitions for MySQL compatibility. The database and changed public files are uploaded into a private staging directory outside `web/`. Uploaded file hashes are verified before the database restore starts. PROD also decompresses the dump and prepares staged file permissions before enabling maintenance mode. The script leaves PROD's public state unchanged during export, comparison, upload, and staging checks. Avoid editing DEV/PROD files or running cron during the comparison and restore. Identical files are skipped. A partially uploaded individual file is notresumed; a new run compares against the installed PROD files.

On PROD it enables Drupal maintenance mode, drops the target database's tables, and imports the DEV dump. Drush `sql:query` runs the MySQL/MariaDB terminal client using PROD's existing `settings.php` credentials. No password needs to be put in the script, a command argument, or chat. This is a full database replacement, including users, passwords, submissions, and configuration, not a content merge.

After import, it copies the staged public files into PROD, overwriting matching paths and retaining PROD-only files. It runs `updatedb`, rebuilds caches, checks Drupal database access, then disables maintenance mode and rebuilds caches. Remote status reporting and staging cleanup happen after the site is reopened. Review the public pages, login, images, and environment-specific settings after completion. This script copies only public files, not private-file storage.

The import is not transactional. Drupal maintenance state itself is replaced by the imported database and reapplied afterwards; it is not a continuous traffic lock during import. Run during a quiet window with external cron paused. If a command fails during the restore, the script tries to keep maintenance mode on and stops rather than exposing a partial import. If Drupal cannot bootstrap, the maintenance state cannot be confirmed; inspect the actual public response before recovering with backups or rerunning. A failure before maintenance starts leaves the site available. Failure after import can leave the new database with old or partially copied files. Remote staging is retained on failure and removed on success; the local DEV export location is printed and retained in a private temporary directory.

### Finish an imported snapshot after missing-code errors

If database import and public-file installation succeeded but updates stopped on missing `clickhouse`, `devel`, `jurenites_metrika`, `jurenites_practice_shop`, or `ms_clarity` code, the site remains in maintenance mode. After approving the additional module-code deployment, run:

```bash
bash scripts/finish-content-deployment.sh u3614358@server290.hosting.reg.ru
```

This repair does not import the database again or resend public files. It adds the three contributed modules at the versions in DEV's Composer lock using a targeted Composer update, and copies the two missing custom modules with scp. Devel becomes a production Composer requirement because the imported database
marks it installed. The project's Clarity compatibility patch is reapplied when needed. No ClickHouse server or local ClickHouse credentials are provisioned. Other Composer root requirements and existing custom module directories are preserved. Dependencies needed by the three packages may be installed or updated.

The repair uses PHP 8.3 for Drush and its child processes, creates the existing configuration sync directory if needed, or adds a setting for project-local `config/sync` outside `web/` when unset. It preserves PROD credentials and the settings file's permissions. Composer/settings backups remain in a private `.content-repair.*` directory. It checks extension availability, runs updates, clears caches, and disables maintenance mode only after the update steps succeed. Its custom-module upload, Composer backups, and Composer manifest edit finish before maintenance mode starts; the mode starts immediately before Composer changes the installed code. `PROD_COMPOSER` overrides the default account-local Composer executable path. There are no Git commits, pushes, or pulls. A completed local test does not prove the remote repair succeeded; check its terminal completion and the public site.

For the Drupal 11.4.7 deployment, PROD explicitly required `twig/twig:3.29.0`,
matching DEV's locked version at that time. Twig 3.30 produced a homepage HTTP 500 even though
Drush bootstrap and database updates succeeded: the compiled escape call passes
the environment into the wrong argument position. See the
[Drupal issue for the Twig 3.30 rendering regression](https://www.drupal.org/project/drupal/issues/3625969).
Preserve the PROD constraint during module installation until a compatible update
has been verified. Always request the public homepage after a dependency change;
a successful cache rebuild alone does not establish successful page rendering.

The 2026-10-07 local dependency update locks Drupal core to `11.4.8`, Tagify to
`2.0.4`, and Twig to `3.30.0`, with compatible dependency updates.
[Drupal 11.4.8](https://www.drupal.org/project/drupal/releases/11.4.8) includes the
Twig rendering fix. Local homepage, Blog, Videos, Portfolio, Contact, and login
requests returned HTTP 200 after database updates and cache rebuild. Composer
validation, platform requirements, and the advisory audit passed; no Drupal
package updates remained in the Composer report. The pending custom
`jurenites_admin_post_update_editor_alignment` update was also applied locally.
This verification does not deploy or remove any constraint on PROD; check the
target manifest and PHP 8.3 platform requirements before a separate code release.

### Manual restore including a separate code release

The remaining procedure covers a full release through ISPmanager/phpMyAdmin.
Its Git steps are not part of the SSH content-only shortcut above.

Before starting:

1. Review and commit the intended code and generated assets. Push the chosen branch, review its pull request and CI results, and merge to `main` through the project's normal review process. Do not stage unrelated work blindly.
2. Record the intended release commit and confirm the exported DEV database matches that code's schema. Reconcile divergent branches before deployment; do not force-reset an existing production checkout to resolve them.
3. Back up the current PROD database and public files outside the public web root, and retain the matching old code for rollback.
4. Put PROD in maintenance mode for the restore window. Deploy the matching code and install locked dependencies before importing the database. An imported DEV database can replace maintenance configuration, so retain maintenance access control through the complete restore.
5. Export and validate the DEV archives below, import the database, restore public files, run database updates, clear cache, and verify the site before reopening it. Roll back code, database, and files together if needed.



### Step 1: Export DEV database and public files

Run on local macOS from the project root. Each timestamp creates a new export
folder containing the MySQL-compatible database dump and public-files archive
used by this procedure.

```bash
cd /Users/alexanderilivanov/Projects/blog_jurenites
set -o pipefail

EXPORT_TIMESTAMP="$(date +%Y-%m-%d-%H%M%S)"
EXPORT_DIRECTORY_PATH="$HOME/Downloads/blog_jurenites-export-${EXPORT_TIMESTAMP}"
SQL_ARCHIVE_PATH="$EXPORT_DIRECTORY_PATH/blog_jurenites-dev-mysql8-${EXPORT_TIMESTAMP}.sql.gz"
PUBLIC_FILES_ARCHIVE_PATH="$EXPORT_DIRECTORY_PATH/blog_jurenites-public-files-dev-${EXPORT_TIMESTAMP}.tar.gz"

mkdir -p "$EXPORT_DIRECTORY_PATH"

docker exec -e MYSQL_PWD=drupal blog_jurenites_db mariadb-dump \
  --user=drupal \
  --single-transaction \
  --quick \
  --hex-blob \
  --add-drop-table \
  --default-character-set=utf8mb4 \
  --no-tablespaces \
  drupal \
  | LC_ALL=C sed 's/utf8mb4_uca1400_ai_ci/utf8mb4_unicode_ci/g' \
  | gzip -9 > "$SQL_ARCHIVE_PATH"

COPYFILE_DISABLE=1 tar \
  --exclude='.DS_Store' \
  --exclude='._*' \
  --exclude='*/._*' \
  --exclude='files/css' \
  --exclude='files/js' \
  --exclude='files/php' \
  --exclude='files/styles' \
  --exclude='files/translations' \
  --exclude='files/tmp' \
  --exclude='files/config_*' \
  -czf "$PUBLIC_FILES_ARCHIVE_PATH" \
  -C web/sites/default files
```

Validate the archives before uploading them:

```bash
gzip -t "$SQL_ARCHIVE_PATH"
gzip -t "$PUBLIC_FILES_ARCHIVE_PATH"
gzip -dc "$SQL_ARCHIVE_PATH" | rg -c '^CREATE TABLE'
gzip -dc "$SQL_ARCHIVE_PATH" | rg 'utf8mb4_uca1400_ai_ci|^CREATE DATABASE|^USE '
tar -tzf "$PUBLIC_FILES_ARCHIVE_PATH" | sed -n '1,30p'
shasum -a 256 "$SQL_ARCHIVE_PATH" "$PUBLIC_FILES_ARCHIVE_PATH"
open "$EXPORT_DIRECTORY_PATH"
```

The collation/database search must print nothing. The archive listing must start with `files/` and include `files/.htaccess`.

### Step 2: Prepare PROD code and upload archives

Sign in to [ISPmanager](https://server290.hosting.reg.ru:1500) using private credentials and the account's second factor. In its shell, verify the checkout:

```bash
PROD_DOCUMENT_ROOT="/var/www/u3614358/data/www/jurenites.com"
cd "$PROD_DOCUMENT_ROOT"
test "$(pwd -P)" = "$PROD_DOCUMENT_ROOT" || exit 1
pwd -P
git status --short
git branch --show-current
git rev-parse HEAD
```

On a clean `main` checkout, update to the reviewed release and install locked
dependencies. If `--ff-only` fails, stop and reconcile history separately.

```bash
git pull --ff-only origin main
/opt/php/8.3/bin/php /var/www/u3614358/data/bin/composer install --no-dev --optimize-autoloader
```

Use File Manager to upload the verified public-files archive to `/var/www/u3614358/data/backups/incoming/`. Never place database dumps or backup archives below a public website directory.

### Step 3: Import the database

Open phpMyAdmin through ISPmanager. Select the target database and verify its name against the target Drupal configuration. Confirm the current compressed backup has been exported and downloaded, then use Import to load the `blog_jurenites-dev-mysql8-<timestamp>.sql.gz` file created in Step 1.

### Step 4: Restore public files

Set the exact uploaded filename below. Extraction runs into staging with a byte-based progress bar when `pv` is installed; archive names are not printed. A rollback copy is kept under the account-writable `data/apps` directory. The live `default` directory may be read-only, so the command saves and restores its mode while swapping the files directory.

```bash
PROD_DOCUMENT_ROOT="/var/www/u3614358/data/www/jurenites.com"
cd "$PROD_DOCUMENT_ROOT"
test "$(pwd -P)" = "$PROD_DOCUMENT_ROOT" || exit 1

RESTORE_TIMESTAMP="$(date +%Y-%m-%d-%H%M%S)"
PUBLIC_FILES_ARCHIVE_PATH="/var/www/u3614358/data/backups/incoming/blog_jurenites-public-files-dev-2026-10-10-151524.tar.gz"
FILES_BACKUP_DIRECTORY="/var/www/u3614358/data/apps/files-before-dev-restore-${RESTORE_TIMESTAMP}"
FILES_STAGING_DIRECTORY="/var/www/u3614358/data/apps/files-restore-${RESTORE_TIMESTAMP}"
LIVE_FILES_DIRECTORY="$PROD_DOCUMENT_ROOT/web/sites/default/files"
LIVE_FILES_PARENT="$PROD_DOCUMENT_ROOT/web/sites/default"
LIVE_FILES_PARENT_MODE="$(stat -c '%a' "$LIVE_FILES_PARENT")"

if test -f "$PUBLIC_FILES_ARCHIVE_PATH" && \
  mkdir -p "$FILES_BACKUP_DIRECTORY" "$FILES_STAGING_DIRECTORY" && \
  tar --warning=no-unknown-keyword -tzf "$PUBLIC_FILES_ARCHIVE_PATH" >/dev/null && \
  { if command -v pv >/dev/null 2>&1; then
      pv --progress --timer --eta --rate --bytes "$PUBLIC_FILES_ARCHIVE_PATH" \
        | tar --warning=no-unknown-keyword --no-same-owner -xzf - -C "$FILES_STAGING_DIRECTORY"
    else
      echo "Extracting public files (install pv to show percentage progress)..."
      tar --warning=no-unknown-keyword --no-same-owner -xzf "$PUBLIC_FILES_ARCHIVE_PATH" -C "$FILES_STAGING_DIRECTORY"
    fi; } && \
  test -f "$FILES_STAGING_DIRECTORY/files/.htaccess" && \
  test -d "$FILES_STAGING_DIRECTORY/files/youtube-thumbnails" && \
  test -f "$FILES_STAGING_DIRECTORY/files/youtube-thumbnails/neE6wOuBIP8.jpg"; then
  chmod u+w "$LIVE_FILES_PARENT" && \
  if mv "$LIVE_FILES_DIRECTORY" "$FILES_BACKUP_DIRECTORY/files"; then
    if mv "$FILES_STAGING_DIRECTORY/files" "$LIVE_FILES_DIRECTORY"; then
      chmod "$LIVE_FILES_PARENT_MODE" "$LIVE_FILES_PARENT" && \
      find "$LIVE_FILES_DIRECTORY" -type d -exec chmod 755 {} + && \
      find "$LIVE_FILES_DIRECTORY" -type f -exec chmod 644 {} + && \
      test -f "$LIVE_FILES_DIRECTORY/.htaccess" && \
      test -f "$LIVE_FILES_DIRECTORY/youtube-thumbnails/neE6wOuBIP8.jpg" && \
      echo "Public files restored. Verifying Drupal cache..." && \
      /opt/php/8.3/bin/php ./vendor/bin/drush.php --uri=https://jurenites.com cr && \
      echo "Restored file count:" && find "$LIVE_FILES_DIRECTORY" -type f | wc -l
    else
      mv "$FILES_BACKUP_DIRECTORY/files" "$LIVE_FILES_DIRECTORY"
      chmod "$LIVE_FILES_PARENT_MODE" "$LIVE_FILES_PARENT"
      echo "ABORTED: new files could not be installed; the previous files directory was restored."
    fi
  else
    chmod "$LIVE_FILES_PARENT_MODE" "$LIVE_FILES_PARENT"
    echo "ABORTED: could not move the existing files directory; it was left in place."
  fi
else
  echo "ABORTED: archive or staged files failed validation; live files were not changed."
fi
```



### Step 5: Update, verify, and reopen PROD

```bash
/opt/php/8.3/bin/php ./vendor/bin/drush.php --uri=https://jurenites.com updatedb --yes
/opt/php/8.3/bin/php ./vendor/bin/drush.php --uri=https://jurenites.com cr
/opt/php/8.3/bin/php ./vendor/bin/drush.php --uri=https://jurenites.com status
```

Confirm database connectivity and successful Drupal bootstrap. Check English and translated routes, login, images, avatars, thumbnails, release identity, mail settings, and environment-specific menu destinations. Drupal regenerates excluded CSS, JS, and image-style derivatives on demand when their original files are present. Disable maintenance mode after verification and retain rollback data for the agreed review period.

## Deploy static Storybook to PROD

Production Storybook is a static browser application, not a permanent Node development server. The generated site remains interactive and includes the Storybook manager, stories, controls, documentation, JavaScript, CSS, fonts, and other assets. Serve `storybook-static/`; do not point the subdomain at the `.storybook/` configuration directory.

Previous builds on this shared host failed because of memory and Ruby/Psych
limitations. The documented deployment path builds on macOS and serves the
result statically. Match the intended PROD commit explicitly; a new `main`
commit is not proof that Drupal already runs it.

### Step 1: Build the exact `main` commit on macOS

This isolated build does not switch branches or modify the current working tree. Run this entire step in the **local macOS Terminal**, never in the ISPmanager shell. The first check deliberately stops a Linux shell before any paths or build variables are created:

```bash
test "$(uname -s)" = "Darwin" || {
  echo "ABORTED: run Storybook Step 1 in the local macOS Terminal, not on PROD."
  exit 1
}

cd /Users/alexanderilivanov/Projects/blog_jurenites

git fetch https://github.com/jurenites/blog.git main

PRODUCTION_COMMIT_HASH="$(git rev-parse FETCH_HEAD)"
SHORT_COMMIT_HASH="$(git rev-parse --short=7 "$PRODUCTION_COMMIT_HASH")"
STORYBOOK_BUILD_DATE="$(date +%Y-%m-%d)"
STORYBOOK_BUILD_DIRECTORY="$(mktemp -d /private/tmp/blog_jurenites-storybook.XXXXXX)"
STORYBOOK_SOURCE_DIRECTORY="$STORYBOOK_BUILD_DIRECTORY/source"
STORYBOOK_ARCHIVE_PATH="/Users/alexanderilivanov/Downloads/blog_jurenites-storybook-${SHORT_COMMIT_HASH}-${STORYBOOK_BUILD_DATE}.tar.gz"

mkdir -p "$STORYBOOK_SOURCE_DIRECTORY"
git archive --format=tar \
  --output="$STORYBOOK_BUILD_DIRECTORY/source.tar" \
  "$PRODUCTION_COMMIT_HASH"
tar -xf "$STORYBOOK_BUILD_DIRECTORY/source.tar" \
  -C "$STORYBOOK_SOURCE_DIRECTORY"

cd "$STORYBOOK_SOURCE_DIRECTORY"
npm ci --no-audit --no-fund
JURENITES_GIT_COMMIT="$PRODUCTION_COMMIT_HASH" npm run build-storybook
JURENITES_GIT_COMMIT="$PRODUCTION_COMMIT_HASH" npm run build:info:check

test -f storybook-static/index.html
test -f storybook-static/storybook-build-info.js
COPYFILE_DISABLE=1 tar -czf "$STORYBOOK_ARCHIVE_PATH" \
  -C "$STORYBOOK_SOURCE_DIRECTORY" storybook-static
```

Verify the artifact before uploading it:

```bash
gzip -t "$STORYBOOK_ARCHIVE_PATH"
tar -tzf "$STORYBOOK_ARCHIVE_PATH" | grep -Fx 'storybook-static/index.html'
tar -xOf "$STORYBOOK_ARCHIVE_PATH" \
  storybook-static/storybook-build-info.js | grep "$SHORT_COMMIT_HASH"
shasum -a 256 "$STORYBOOK_ARCHIVE_PATH"
open -R "$STORYBOOK_ARCHIVE_PATH"
```

The archive check must find both `storybook-static/index.html` and the expected seven-character commit hash. The archive is only a transfer package; after it is extracted, the subdomain serves the complete interactive Storybook build.

### Step 2: Upload and install the Storybook build

Upload the verified `blog_jurenites-storybook-*.tar.gz` with ISPmanager File
Manager to `/var/www/u3614358/data/backups/incoming/`. Wait for upload completion.
In the PROD shell, set `STORYBOOK_ARCHIVE_PATH` to the actual uploaded filename. Extract to staging and keep the previous build as a timestamped rollback:

```bash
cd /var/www/u3614358/data/apps/blog_jurenites

STORYBOOK_DEPLOY_TIMESTAMP="$(date +%Y-%m-%d-%H%M%S)"
STORYBOOK_ARCHIVE_PATH="/var/www/u3614358/data/backups/incoming/blog_jurenites-storybook-9a6d103-2026-09-29.tar.gz"
STORYBOOK_STAGING_DIRECTORY="/var/www/u3614358/data/apps/storybook-restore-${STORYBOOK_DEPLOY_TIMESTAMP}"
STORYBOOK_LIVE_DIRECTORY="/var/www/u3614358/data/apps/blog_jurenites/storybook-static"
STORYBOOK_BACKUP_DIRECTORY="/var/www/u3614358/data/backups/storybook-before-${STORYBOOK_DEPLOY_TIMESTAMP}"

if test -f "$STORYBOOK_ARCHIVE_PATH" && \
  mkdir -p "$STORYBOOK_STAGING_DIRECTORY" && \
  tar --no-same-owner --exclude='._*' --exclude='*/._*' \
    -xzf "$STORYBOOK_ARCHIVE_PATH" \
    -C "$STORYBOOK_STAGING_DIRECTORY" && \
  test -f "$STORYBOOK_STAGING_DIRECTORY/storybook-static/index.html" && \
  test -f "$STORYBOOK_STAGING_DIRECTORY/storybook-static/storybook-build-info.js"; then
  if test -d "$STORYBOOK_LIVE_DIRECTORY"; then
    mv "$STORYBOOK_LIVE_DIRECTORY" "$STORYBOOK_BACKUP_DIRECTORY"
  fi
  if test ! -e "$STORYBOOK_LIVE_DIRECTORY" && \
    mv "$STORYBOOK_STAGING_DIRECTORY/storybook-static" "$STORYBOOK_LIVE_DIRECTORY"; then
    find "$STORYBOOK_LIVE_DIRECTORY" -type d -exec chmod 755 {} +
    find "$STORYBOOK_LIVE_DIRECTORY" -type f -exec chmod 644 {} +
    echo "STORYBOOK BUILD INSTALLED"
  else
    echo "ABORTED: restoring the previous Storybook build."
    if test -d "$STORYBOOK_BACKUP_DIRECTORY" && \
      test ! -e "$STORYBOOK_LIVE_DIRECTORY"; then
      mv "$STORYBOOK_BACKUP_DIRECTORY" "$STORYBOOK_LIVE_DIRECTORY"
    fi
  fi
else
  echo "ABORTED: archive or staged Storybook failed validation."
fi
```

Continue only after `STORYBOOK BUILD INSTALLED`. Check the installed entrypoint:

```bash
test -f /var/www/u3614358/data/apps/blog_jurenites/storybook-static/index.html \
  && echo "BUILD READY" || echo "BUILD MISSING"
```



## Deploy Presentation UX to PROD

This is a future deployment runbook. Presentation UX remains local until a
deployment is requested. `presentation.jurenites.com` is the proposed hostname;
the DNS record and ISPmanager site are not created by these instructions.
The source lives outside the blog repository, so deploying the blog or pulling
its `main` branch does not deploy Presentation UX.

### Step 1: Configure the subdomain and static site

In the domain's DNS settings, add an `A` record for `presentation` pointing to
the hosting account's website IP. Add `AAAA` only if the host provides working
IPv6 for this site. Use the website IP supplied by hosting, not a guessed IP.

In ISPmanager **Sites → Create** (called **WWW domains** in older panels), add
`presentation.jurenites.com` under the intended hosting user. Use a dedicated
site directory, with the application handler set to **Not used** for static
files. The examples below assume this site directory:

```text
/var/www/u3614358/data/www/presentation.jurenites.com
```

Confirm the actual path in the panel. Keep the Drupal site's root unchanged.
Presentation UX does not need PHP, Node, a database, or a permanent Python
server. Configure hosting-level access control for a private team preview;
the application has no login of its own. See the official
[ISPmanager website settings](https://www.ispmanager.com/docs/ispmanager/adding-and-configuring-a-website).

### Step 2: Package the reviewed files on macOS

Preview and review the current app before packaging it. This command packages
the existing snapshots and presentation code; it does not rebuild or capture
new Git branches. Run in the **local macOS Terminal**:

```bash
cd /Users/alexanderilivanov/Projects/namesilo/presentation-ux
PRESENTATION_RELEASE_NAME="presentation-ux-$(date +%Y%m%d-%H%M%S)"
PRESENTATION_ARCHIVE_PATH="/Users/alexanderilivanov/Downloads/${PRESENTATION_RELEASE_NAME}.tar.gz"
test -f dist/index.html && test -f dist/provenance.json && \
  COPYFILE_DISABLE=1 tar -czf "$PRESENTATION_ARCHIVE_PATH" dist
gzip -t "$PRESENTATION_ARCHIVE_PATH"
shasum -a 256 "$PRESENTATION_ARCHIVE_PATH"
```

Continue only if packaging and validation succeed. Upload this archive with
ISPmanager File Manager to `/var/www/u3614358/data/backups/incoming/`. Record
its SHA-256 alongside the release name. Only `dist/` is included: do not expose
the source repository, `.git`, `.openai`, or local configuration as the site root.

### Step 3: Install a release and select its public directory

In the **PROD shell**, substitute the actual release name from Step 2 below.
Confirm the site path before running. Use a new release name for every upload;
the directory creation deliberately fails if that release already exists.

```bash
PRESENTATION_RELEASE_NAME="presentation-ux-REPLACE-WITH-UPLOADED-TIMESTAMP"
PRESENTATION_SITE_DIRECTORY="/var/www/u3614358/data/www/presentation.jurenites.com"
PRESENTATION_ARCHIVE_PATH="/var/www/u3614358/data/backups/incoming/${PRESENTATION_RELEASE_NAME}.tar.gz"
PRESENTATION_RELEASE_DIRECTORY="$PRESENTATION_SITE_DIRECTORY/releases/$PRESENTATION_RELEASE_NAME"
sha256sum "$PRESENTATION_ARCHIVE_PATH"
```

Compare that checksum with the local result before extracting:

```bash
test -d "$PRESENTATION_SITE_DIRECTORY" && \
  test -f "$PRESENTATION_ARCHIVE_PATH" && \
  mkdir -p "$PRESENTATION_SITE_DIRECTORY/releases" && \
  mkdir "$PRESENTATION_RELEASE_DIRECTORY" && \
  tar --no-same-owner --exclude='._*' --exclude='*/._*' \
    -xzf "$PRESENTATION_ARCHIVE_PATH" -C "$PRESENTATION_RELEASE_DIRECTORY" && \
  test -f "$PRESENTATION_RELEASE_DIRECTORY/dist/index.html" && \
  test -f "$PRESENTATION_RELEASE_DIRECTORY/dist/app.js" && \
  test -d "$PRESENTATION_RELEASE_DIRECTORY/dist/snapshots" && \
  echo "PRESENTATION RELEASE READY"
```

Only after `PRESENTATION RELEASE READY`, edit the site's **Public directory**
in ISPmanager to `releases/ACTUAL-RELEASE-NAME/dist`, relative to its site
directory. Record the previous public-directory value first. Retain the old
release for rollback; an update repeats Steps 2–3 with a new release directory.
To roll back, restore the previous public-directory value in the panel.

Once DNS resolves to this host, issue a Let's Encrypt certificate for the
subdomain and enable HTTP-to-HTTPS redirection. See
[ISPmanager SSL setup](https://www.ispmanager.com/docs/ispmanager/install-an-ssl-certificate).

### Step 4: Verify the presentation

```bash
curl --fail -I https://presentation.jurenites.com/
curl --fail -I https://presentation.jurenites.com/app.js
curl --fail -I https://presentation.jurenites.com/present_logo_16.svg
```

For a protected preview, authenticate through the browser; unauthenticated
requests may return `401`. Check that JavaScript is served with a JavaScript
MIME type, then open `https://presentation.jurenites.com/#story-1`. Verify
pagination, Before/Proposed switching, embedded search/cart interactions,
wireframe mode, focus outlines, layer elevation, and the P favicon.

Keep `/snapshots/` and all other `dist/` assets on the same origin as the shell:
DOM highlights and layer inspection require same-origin iframe access. Adding
CORS headers does not grant iframe DOM access. An external implemented build
must permit embedding and use HTTPS inside the HTTPS presentation. The current
`#story-1` routing needs no catch-all rewrite; missing assets should return 404.

Settings and demo carts live in browser storage per origin. Moving from
`127.0.0.1:8094` to a local subdomain or HTTPS production starts with separate
storage. Export configuration JSON from **Build & story** on the old origin,
then import it on the new one. That transfers presentation settings, not screen
assets or demo carts; it does not save a shared configuration on the server.

## PROD checks and code-only updates

The documented real checkout is `/var/www/u3614358/data/www/jurenites.com`, with `/var/www/u3614358/data/apps/blog_jurenites` as a compatibility symlink. The Drupal public root must resolve to the checkout's `web/`, not the repository root. Verify `pwd -P` and ISPmanager's document-root configuration before relying on either path. The Storybook subdomain must serve the installed `storybook-static/` directory; installing an archive alone does not configure its DNS, HTTPS, or document root.

For a code-only update, retain PROD's database, uploaded files, `.env`, and
`settings.php`. Back up before pending database migrations. From a clean,
reviewed `main` checkout:

```bash
cd /var/www/u3614358/data/apps/blog_jurenites
git pull --ff-only origin main
/opt/php/8.3/bin/php /var/www/u3614358/data/bin/composer install --no-dev --optimize-autoloader
/opt/php/8.3/bin/php ./vendor/bin/drush.php --uri=https://jurenites.com updatedb --yes
/opt/php/8.3/bin/php ./vendor/bin/drush.php --uri=https://jurenites.com cr
/opt/php/8.3/bin/php ./vendor/bin/drush.php --uri=https://jurenites.com status
```

Confirm dependencies before database updates. Deploy built theme assets, including
the tracked SVG icons and fonts, from the same release; production does not need
to rebuild them. If **Leading icon** offers only Pulse Indicator, verify that
`web/themes/custom/jurenites_theme/assets/icons/brand-chatgpt.svg` exists in the
PROD checkout before editing menu content or considering a database restore.

Check public HTTPS and HTTP redirects without bypassing certificate validation:

```bash
curl -I https://jurenites.com/
curl -I https://www.jurenites.com/
curl -I http://jurenites.com/
curl -I http://www.jurenites.com/
curl -I https://storybook.jurenites.com/
```

ISPmanager owns certificate configuration and renewal. Inspect its current
certificate status separately; local files cannot establish TLS health.

### Analytics and environment configuration

Google Tag configuration lives in the environment's Drupal database. A complete database restore transfers it; a code-only deployment does not. Inspect the container and actual measurement destination before and after a restore rather than relying on an old identifier copied into documentation. Preserve DEV's local tracking suppression and PROD's own settings overrides. Do not copy settings files or secrets between environments.

Verify public tag output and Analytics reception in a browser profile whose extensions do not block the intended test. Tag presence alone does not establish reception. Google Tag gateway configuration is not established by this runbook.

#### Microsoft Clarity

`drupal/ms_clarity` provides the editable Clarity project ID, page exclusions, and role selection at **Configuration → Web services → Microsoft Clarity** (`/admin/config/services/microsoft_clarity`). It inserts the asynchronous Clarity snippet into the HTML head. Do not add a second copy in Twig or Google Tag Manager.

The local installation tracks anonymous visitors only, excluding `/admin`, `/admin/*`, `/user`, `/user/*`, `/node/add`, `/node/add/*`, and `/node/*/edit`. The ID and visibility settings are stored in `ms_clarity.settings` in each environment's database. A code-only deployment requires enabling and configuring the module in that environment:

```bash
composer install
vendor/bin/drush pm:enable ms_clarity --yes
# Save the project ID and tracking options through the settings page.
vendor/bin/drush cr
```

Version 2.0.1 needs the tracked
`patches/ms-clarity-drupal-11-settings-cache.patch`: it fixes the Drupal 11 settings-form constructor and removed role-list function, and adds cache metadata for configuration changes and page/role visibility. Composer Patches applies the locked patch during install; ship `patches/` and `patches.lock.json` with the Composer manifests. Reassess the patch when upgrading the module.

Verify the local settings form, anonymous-only role selection, cache metadata, and English/Russian HTML head output without sending browser telemetry:

```bash
docker exec blog_jurenites_web vendor/bin/drush php:script tests/clarity-integration.php
```

The existing privacy module's starter copy claims there is no analytics. Review the editable privacy page and cookie notice before production activation. This module supplies tracking configuration, not a visitor consent interface.

#### Yandex.Metrika

`jurenites_metrika` adds counter `113437271` with the supplied Webvisor, click-map,
link-tracking, accurate-bounce, SSR, referrer/URL, and `dataLayer` ecommerce
options. The counter ID and enabled switch are editable under **Configuration →
Web services → Yandex.Metrika** (`/admin/config/services/yandex-metrika`). Clearing
the ID or disabling tracking stops both the script and the no-JavaScript beacon.
The ecommerce option names the container; it does not create purchase events.

The module uses Drupal page attachments and a body-level `noscript` beacon.
Only anonymous public requests on `jurenites.com` and `www.jurenites.com` qualify.
Local/preview hosts, signed-in users, administrative routes, account pages, and
content editing/revision paths are excluded. Visibility carries host, path,
route, and authentication cache contexts plus the configuration cache tag.
The isolated QR Studio document bypasses Drupal's page hooks and is not tracked
by this integration.

The contributed [Yandex.Metrics project](https://www.drupal.org/project/yandex_metrics)
listed no supported stable release when reviewed on 2026-10-05, so this small
Drupal 11 module owns the integration. Do not also paste the counter into Twig
or Google Tag Manager.

For local Docker development, run Drush inside the web container:

```bash
docker exec blog_jurenites_web vendor/bin/drush pm:enable jurenites_metrika --yes
docker exec blog_jurenites_web vendor/bin/drush cr
```

The local database hostname `db` resolves inside Docker. Running the local
`vendor/bin/drush` directly from macOS cannot connect to that hostname.

After deploying the module files to production, run these commands from the
production project directory in its PHP/database environment:

```bash
vendor/bin/drush pm:enable jurenites_metrika --yes
vendor/bin/drush cr
```

Installation seeds the supplied ID once. Later configuration edits and clears
are preserved. Local installation is enabled but emits no Yandex requests.
Code-only deployment does not enable the module in an existing production database.
Review the existing editable privacy copy, which was originally seeded with a
no-analytics claim, when activating production tracking.

Verify locally without sending analytics traffic:

```bash
node --test tests/metrika-counter.test.mjs
docker exec blog_jurenites_web vendor/bin/drush php:script tests/metrika-integration.php
```

These checks cover the routed settings form, initialization options, script reuse, visibility, cache
metadata, fallback markup, disabled/invalid IDs, and local HTTP suppression.
They do not establish production deployment or reception in Yandex.Metrika.

### Release identity

Drupal reads its checked-out commit and the tracked release record without writing host metadata:

```bash
git rev-parse --short=7 HEAD
cat web/themes/custom/jurenites_theme/release-info.json
```

Compare these with the visible watermark and the public non-secret `/themes/custom/jurenites_theme/release-info.json`. Storybook embeds identity at build time and must be checked against its own deployed artifact. Local checks, a branch push, or archive creation do not establish remote deployment.
