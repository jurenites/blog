# Command Cheat Sheet

## Local DEV

Run from `/Users/alexanderilivanov/Projects/blog_jurenites` with Docker Desktop open.

First setup: `npm ci`. Add to `/etc/hosts`:

```text
127.0.0.1 jurenites.local storybook.jurenites.local test.jurenites.local presentation.jurenites.local
```

### Start Drupal + Storybook

```bash
docker compose up -d
npm run build:theme
docker exec blog_jurenites_web ./vendor/bin/drush cr
```

[Drupal local](http://jurenites.local) [Storybook local](http://storybook.jurenites.local) [Presentation UX local](http://presentation.jurenites.local/#story-1) [Visual testing local](http://test.jurenites.local)

### Visual testing

```bash
npm run playwright:install  # First setup / browser updates
npm run status:build        # Repeat after source changes
npm run status:serve
```

### Update Drupal dependencies

```bash
docker exec blog_jurenites_web composer update 'drupal/*' --with-all-dependencies --dry-run
# Review, then apply
```

### Drupal dependency security release — 2026-10-31

Release `1.238.2` locks Drupal core to `11.4.11`, CAPTCHA to `2.0.11`,
and Token to `1.18.0` (Drupal label `8.x-1.18`). CAPTCHA fixes
[SA-CONTRIB-2026-281](https://www.drupal.org/sa-contrib-2026-281); the core
update also refreshes its Guzzle and Symfony dependencies. Composer constraints
and contributed-module configuration are unchanged.

Local verification: Composer validation, platform requirements and security
audit passed; no database updates were pending. CAPTCHA generation/validation,
Token replacement, English/Russian pages, login and contact routes passed smoke
checks. Drupal's refreshed update report lists all three projects as current.

Deploy the reviewed `main` commit using the code-only procedure below and
`composer install`, preserving the full dependency set while Devel is enabled.
Before deployment, record the current commit and maintenance state, pause
scheduled jobs, and save a verified compressed PROD database dump plus
`composer.json`, `composer.lock` and `web/.htaccess` outside `web/`. Run database
updates, rebuild caches, confirm the three installed versions, and check the
security audit and public routes before restoring the prior maintenance state
and scheduled jobs. Do not import DEV content for this dependency update.

If deployment fails, keep maintenance enabled; restore the recorded code and
lockfile and, if database updates ran, the matching PROD database snapshot.
Restore site-specific scaffold rules from the backup when needed, rebuild
caches, and verify recovery before reopening the site.

### ClickHouse (optional, local only)

```bash
docker compose up -d clickhouse
docker compose exec clickhouse sh -c 'exec clickhouse-client --user "$CLICKHOUSE_USER" --password "$CLICKHOUSE_PASSWORD" --database "$CLICKHOUSE_DB"'
docker compose stop clickhouse
```

[SQL console](http://localhost:8123/play) Credentials: ignored `docker/clickhouse/.env.local`.

## Upload missing public files to PROD over SSH

**Local Mac.** Adds missing originals; skips existing files and generated caches.

```bash
rsync -rltv --progress --ignore-existing -e ssh \
  --exclude='.DS_Store' --exclude='._*' \
  --exclude='/css/' --exclude='/js/' --exclude='/php/' \
  --exclude='/styles/' --exclude='/translations/' --exclude='/tmp/' --exclude='/config_*/' \
  web/sites/default/files/ \
  u3614358@server290.hosting.reg.ru:/var/www/u3614358/data/www/jurenites.com/web/sites/default/files/
```

## DEV to PROD content restore

**Replaces PROD's entire database, including users and configuration.** Copies
changed public files; keeps PROD-only files. No code deployment or automatic
backup/rollback. Back up PROD outside `web/`; deploy matching code first.
Run during a quiet window with cron paused; keep PROD settings and secrets.

**Local Mac:**

```bash
docker compose up -d db
bash scripts/deploy-content.sh --check u3614358@server290.hosting.reg.ru
```

After the check succeeds:

```bash
bash scripts/deploy-content.sh u3614358@server290.hosting.reg.ru
```

If it fails during restore, inspect PROD's maintenance state before recovery.
After success, check public pages, login, images, mail and analytics settings.
Overrides: `bash scripts/deploy-content.sh --help`.

## PROD checks and code-only updates

**PROD shell.** Back up before migrations; start from a clean, reviewed `main`.
Keeps PROD content and settings. Deploy built theme assets with the code.

```bash
cd /var/www/u3614358/data/www/jurenites.com
export PATH="/opt/php/8.3/bin:$PATH"
git pull --ff-only origin main && \
  php /var/www/u3614358/data/bin/composer install --optimize-autoloader && \
  php /var/www/u3614358/data/bin/composer check-platform-reqs && \
  php ./vendor/bin/drush.php --uri=https://jurenites.com updatedb --yes && \
  php ./vendor/bin/drush.php --uri=https://jurenites.com cr && \
  php ./vendor/bin/drush.php --uri=https://jurenites.com status
curl --fail -I https://jurenites.com/
```

PROD currently has Devel enabled: keep the full lockfile install (no `--no-dev`).
Drupal's public root is `web/`; `/var/www/u3614358/data/apps/blog_jurenites` is a
compatibility symlink to the checkout above.

## Testing subdomain hosting status

[Testing](http://test.jurenites.com) and [Storybook](http://storybook.jurenites.com)
serve static builds. Testing is read-only; captures and editing run in DEV.

**Build on the Mac from the intended release:**

```bash
npm run status:export
```

Publish `generated/status-public/` (including `.htaccess`) to the testing root,
and `storybook-static/` to Storybook's root. Stage complete builds and keep the
previous directories for rollback. [Deployment details](../deploy/component-status/README.md).

## Deploy Presentation UX to PROD

**Local Mac:**

```bash
cd /Users/alexanderilivanov/Projects/namesilo/presentation-ux
./start-preview.command  # Preview: http://127.0.0.1:8094/#story-1; Ctrl+C to stop
```

Package reviewed files:

```bash
presentation_archive="$HOME/Downloads/presentation-ux-$(date +%Y%m%d-%H%M%S).tar.gz"
COPYFILE_DISABLE=1 tar -czf "$presentation_archive" dist && gzip -t "$presentation_archive"
```

In [ISPmanager](https://server290.hosting.reg.ru:1500):

1. Upload the archive to `/var/www/u3614358/data/backups/incoming/`.
2. Extract into a new `releases/RELEASE-NAME/` under `/var/www/u3614358/data/www/presentation.jurenites.com/`.
3. Verify `dist/index.html`, `dist/app.js` and `dist/snapshots/` inside that release.
4. Record the previous **Website public directory**, then set it to `releases/RELEASE-NAME/dist`.
5. Check [the site](https://presentation.jurenites.com/), navigation, Before/Proposed and embedded screens.

Keep HTTPS enabled, PHP/CGI and long-lived static caching disabled.
Rollback: restore the previous public-directory value. Browser settings transfer
through **Build & story → Export/Import JSON**.

More: [Workflow](workflow.md) [CI/CD](ci-cd.md) [Visual testing](visual-testing-plan.md).



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

