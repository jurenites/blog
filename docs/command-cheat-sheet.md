# Command Cheat Sheet

Keep DEV and PROD commands separate. Docker service names such as `db` resolve
inside the DEV Docker network, so run Drush inside the web container rather
than directly on macOS.

## DEV Environment

### Clear Drupal cache from any directory

```bash
docker exec blog_jurenites_web ./vendor/bin/drush cr
```

### Run database updates, then clear cache

```bash
docker exec blog_jurenites_web ./vendor/bin/drush updatedb --yes
docker exec blog_jurenites_web ./vendor/bin/drush cr
```

### Apply project Drupal recipes

```bash
docker exec blog_jurenites_web ./vendor/bin/drush recipe /opt/drupal/recipes/jurenites_media
docker exec blog_jurenites_web ./vendor/bin/drush recipe /opt/drupal/recipes/jurenites_progressive_images
docker exec blog_jurenites_web ./vendor/bin/drush recipe /opt/drupal/recipes/jurenites_image_comparison
docker exec blog_jurenites_web ./vendor/bin/drush recipe /opt/drupal/recipes/jurenites_paragraphs_crossfade
docker exec blog_jurenites_web ./vendor/bin/drush recipe /opt/drupal/recipes/jurenites_two_tone_heading
docker exec blog_jurenites_web ./vendor/bin/drush recipe /opt/drupal/recipes/jurenites_cookbook
```



### Build project assets

Run these commands from the project folder:

```bash
cd /Users/alexanderilivanov/Projects/blog_jurenites
npm run build:tokens
npm run build:theme
npm run build-storybook
npm run build:info
npm run build:info:check
npm run version:check
npm run version:bump
```

`npm run version:bump` increments the minor version by default. Use
`npm run version:bump -- patch`, `npm run version:bump -- minor`, or
`npm run version:bump -- major` when the release type must be explicit.

## PROD Environment

The ISPmanager production checkout is
`/var/www/u3614358/data/apps/blog_jurenites`. Do not copy DEV database
credentials, container names, `.env`, or `settings.php` to PROD.

### Confirm the production environment

```bash
cd /var/www/u3614358/data/apps/blog_jurenites
pwd
/opt/php/8.3/bin/php ./vendor/bin/drush.php --uri=https://jurenites.com status
```

Check the reported site URI, database, and Drupal root before continuing.

### Verify the production identity

PROD does not build or write identity metadata. The tracked release record
arrives with the source, and Drupal reads the checked-out commit from `.git`:

```bash
git rev-parse --short=7 HEAD
cat web/themes/custom/jurenites_theme/release-info.json
```

The visible watermark combines those two read-only sources. The tracked release
record is also available at
`/themes/custom/jurenites_theme/release-info.json`.

### Clear the production Drupal cache

```bash
/opt/php/8.3/bin/php ./vendor/bin/drush.php --uri=https://jurenites.com cr
```



### Restore missing production fonts

If Ubuntu Sans Mono falls back to a generic monospace font and its font URL returns 404,
restore the theme font copies from the existing checkout. This needs no Node
build or database update:

```bash
cd /var/www/u3614358/data/apps/blog_jurenites
mkdir -p web/themes/custom/jurenites_theme/assets/fonts && \
  cp src/public/assets/fonts/* web/themes/custom/jurenites_theme/assets/fonts/ && \
  chmod 755 web/themes/custom/jurenites_theme/assets/fonts && \
  chmod 644 web/themes/custom/jurenites_theme/assets/fonts/* && \
  /opt/php/8.3/bin/php ./vendor/bin/drush.php --uri=https://jurenites.com cr
```

Verify `/themes/custom/jurenites_theme/assets/fonts/ubuntu-sans-mono-regular.ttf`
and `/themes/custom/jurenites_theme/assets/fonts/opensans-regular.woff` return
HTTP 200, then reload the page. Theme font copies and licenses are now included
with compiled CSS in Git deployments; include the entire font directory in the
commit when updating font sources.

### Run production database updates, then clear cache

Take a current database backup before database updates.

```bash
/opt/php/8.3/bin/php ./vendor/bin/drush.php --uri=https://jurenites.com updatedb --yes
/opt/php/8.3/bin/php ./vendor/bin/drush.php --uri=https://jurenites.com cr
```



### Run production cron manually

```bash
/opt/php/8.3/bin/php ./vendor/bin/drush.php --uri=https://jurenites.com cron
```

Use the hosting scheduler for recurring production cron runs.

## Manual DEV to PROD Content Restore

Use this direction only when DEV intentionally replaces all PROD content. The
normal long-term content-sync direction is PROD to DEV. The SQL dump contains
content, users, passwords, configuration, and module state; importing it replaces
those PROD records. Public files are transferred separately because they are not
inside the SQL dump.

### Step 1: Create the DEV upload files

Run from the project root on macOS. The timestamp creates a new folder on every
run, so an older export is not overwritten.

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

Verify both archives before uploading them:

```bash
gzip -t "$SQL_ARCHIVE_PATH"
gzip -t "$PUBLIC_FILES_ARCHIVE_PATH"
gzip -dc "$SQL_ARCHIVE_PATH" | rg -c '^CREATE TABLE'
gzip -dc "$SQL_ARCHIVE_PATH" | rg 'utf8mb4_uca1400_ai_ci|^CREATE DATABASE|^USE '
tar -tzf "$PUBLIC_FILES_ARCHIVE_PATH" | sed -n '1,30p'
shasum -a 256 "$SQL_ARCHIVE_PATH" "$PUBLIC_FILES_ARCHIVE_PATH"
open "$EXPORT_DIRECTORY_PATH"
```

The collation/database search must print nothing. The archive listing must start
with `files/` and include `files/.htaccess`.

### Step 2: Upload and restore the DEV database

First update the PROD code from `main` so its schema and recipes correspond to
the database being restored. Then create a private upload directory:

```bash
cd /var/www/u3614358/data/apps/blog_jurenites
git pull --ff-only origin main
mkdir -p /var/www/u3614358/data/backups/incoming
chmod 700 /var/www/u3614358/data/backups/incoming
```

Upload both archives with ISPmanager File Manager or FTP to
`/var/www/u3614358/data/backups/incoming/`; never upload them below either public
website directory.

In phpMyAdmin:

1. Select the PROD database `u3614358_default`.
2. Export a current compressed SQL backup and download it before changing tables.
3. In **Structure**, select every table and choose **Drop**. Confirm only after
  the backup is safely downloaded.
4. In **Import**, select the DEV `*.sql.gz` file and start the import.
5. Continue only after phpMyAdmin reports that the import completed successfully.

Finish the database restore from the PROD project directory:

```bash
/opt/php/8.3/bin/php ./vendor/bin/drush.php --uri=https://jurenites.com updatedb --yes
/opt/php/8.3/bin/php ./vendor/bin/drush.php --uri=https://jurenites.com cr
/opt/php/8.3/bin/php ./vendor/bin/drush.php --uri=https://jurenites.com status
```

The final status must report `Database: Connected` and `Drupal bootstrap: Successful`.

### Step 3: Replace PROD public files from the archive

Set the archive filename to the file that was uploaded. This procedure extracts
into a staging directory first and keeps the previous PROD files as a rollback.

```bash
cd /var/www/u3614358/data/apps/blog_jurenites

RESTORE_TIMESTAMP="$(date +%Y-%m-%d-%H%M%S)"
PUBLIC_FILES_ARCHIVE_PATH="/var/www/u3614358/data/backups/incoming/blog_jurenites-public-files-dev-2026-09-05.tar.gz"
FILES_BACKUP_DIRECTORY="/var/www/u3614358/data/backups/files-before-dev-restore-${RESTORE_TIMESTAMP}"
FILES_STAGING_DIRECTORY="/var/www/u3614358/data/apps/files-restore-${RESTORE_TIMESTAMP}"

if test -f "$PUBLIC_FILES_ARCHIVE_PATH" && \
  tar -tzf "$PUBLIC_FILES_ARCHIVE_PATH" | sed -n '1,30p' && \
  mkdir -p "$FILES_BACKUP_DIRECTORY" "$FILES_STAGING_DIRECTORY" && \
  tar --no-same-owner --exclude='._*' --exclude='*/._*' \
    -xzf "$PUBLIC_FILES_ARCHIVE_PATH" \
    -C "$FILES_STAGING_DIRECTORY" && \
  test -f "$FILES_STAGING_DIRECTORY/files/.htaccess"; then
  mv web/sites/default/files "$FILES_BACKUP_DIRECTORY/files" && \
  mv "$FILES_STAGING_DIRECTORY/files" web/sites/default/files && \
  find web/sites/default/files -type d -exec chmod 755 {} + && \
  find web/sites/default/files -type f -exec chmod 644 {} + && \
  /opt/php/8.3/bin/php ./vendor/bin/drush.php --uri=https://jurenites.com cr && \
  find web/sites/default/files -type f | wc -l
else
  echo "ABORTED: archive or staged files failed validation; live files were not moved."
fi
```

Open several image, avatar, and thumbnail URLs on PROD before removing the
rollback directory. Drupal will regenerate excluded CSS, JS, and image-style
derivatives when they are requested.

## Deploy Storybook to PROD

Production Storybook is a static browser application, not a permanent Node
development server. The generated site remains interactive and includes the
Storybook manager, stories, controls, documentation, JavaScript, CSS, fonts,
and other assets. Serve `storybook-static/`; do not point the subdomain at the
`.storybook/` configuration directory.

The ISPmanager host cannot build this project reliably: its 256 MB memory limit
caused WebAssembly allocation failures even with restricted Node heaps, and its
Ruby/Psych version cannot parse the token source used by the build. Build the
exact PROD `main` commit on macOS, upload the result, and let Nginx serve it.

### Step 1: Build the exact `main` commit on macOS

This isolated build does not switch branches or modify the current working
tree. Run this entire step in the **local macOS Terminal**, never in the
ISPmanager shell. The first check deliberately stops a Linux shell before any
paths or build variables are created:

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

The archive check must find both `storybook-static/index.html` and the expected
seven-character commit hash. The archive is only a transfer package; after it
is extracted, the subdomain serves the complete interactive Storybook build.

### Step 2: Upload and install the Storybook build

Upload the verified `blog_jurenites-storybook-*.tar.gz` file with ISPmanager
File Manager or FTP to this private directory:

```text
/var/www/u3614358/data/backups/incoming/
```

On PROD, set `STORYBOOK_ARCHIVE_PATH` to the actual uploaded filename. Extract
to staging and keep the previous build as a timestamped rollback:

```bash
cd /var/www/u3614358/data/apps/blog_jurenites

STORYBOOK_DEPLOY_TIMESTAMP="$(date +%Y-%m-%d-%H%M%S)"
STORYBOOK_ARCHIVE_PATH="/var/www/u3614358/data/backups/incoming/blog_jurenites-storybook-COMMIT-DATE.tar.gz"
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

Do not continue until the command prints `STORYBOOK BUILD INSTALLED` and this
check prints `BUILD READY`:

```bash
test -f /var/www/u3614358/data/apps/blog_jurenites/storybook-static/index.html \
  && echo "BUILD READY" || echo "BUILD MISSING"
```



### Step 3: Point the ISPmanager subdomain at the build

In ISPmanager, keep the existing website named `storybook.jurenites.com`.
Storybook does not need PHP. Its index page is `index.html`. On this hosting
plan, the website directory is fixed at
`/var/www/u3614358/data/www/storybook.jurenites.com`, so replace the placeholder
directory with a symlink while retaining a rollback copy:

```bash
STORYBOOK_DEPLOY_TIMESTAMP="$(date +%Y-%m-%d-%H%M%S)"
STORYBOOK_LIVE_DIRECTORY="/var/www/u3614358/data/apps/blog_jurenites/storybook-static"
STORYBOOK_WEB_DIRECTORY="/var/www/u3614358/data/www/storybook.jurenites.com"
STORYBOOK_PLACEHOLDER_BACKUP="${STORYBOOK_WEB_DIRECTORY}.pre-symlink-${STORYBOOK_DEPLOY_TIMESTAMP}"

if test ! -f "$STORYBOOK_LIVE_DIRECTORY/index.html"; then
  echo "ABORTED: Storybook build is missing."
elif test -L "$STORYBOOK_WEB_DIRECTORY"; then
  readlink -f "$STORYBOOK_WEB_DIRECTORY"
elif test -d "$STORYBOOK_WEB_DIRECTORY"; then
  mv "$STORYBOOK_WEB_DIRECTORY" "$STORYBOOK_PLACEHOLDER_BACKUP" && \
  ln -s "$STORYBOOK_LIVE_DIRECTORY" "$STORYBOOK_WEB_DIRECTORY" && \
  echo "STORYBOOK SUBDOMAIN LINKED"
else
  echo "ABORTED: ISPmanager website directory was not found."
fi
```

For later releases, keep the subdomain symlink and repeat only Steps 1 and 2;
the symlink continues to target the replaced `storybook-static` directory.

### Step 4: Verify the public subdomain and TLS

Verify the filesystem path and public response:

```bash
readlink -f /var/www/u3614358/data/www/storybook.jurenites.com
namei -l /var/www/u3614358/data/www/storybook.jurenites.com/index.html
curl -I http://storybook.jurenites.com/
curl -I https://storybook.jurenites.com/
```

Both public requests must return `200`, and the resolved path must end in
`/apps/blog_jurenites/storybook-static`. If HTTP returns ISPmanager's large
placeholder page, the website directory is not linked to the build. If HTTP
works but HTTPS presents a self-signed certificate, issue or select a trusted
certificate for `storybook.jurenites.com` in ISPmanager before enabling an
HTTP-to-HTTPS redirect.
