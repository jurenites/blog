# Command Cheat Sheet

Keep DEV, STAGE, and PROD commands separate. Local database host `db` resolves
inside Docker, so run DEV Drush in `blog_jurenites_web`. Hosting paths below are
the documented ISPmanager layout; confirm the checkout, branch, site URI, and
backup location before operating on a remote environment.

## Local DEV

Run build commands from the repository root:

```bash
cd /Users/alexanderilivanov/Projects/blog_jurenites
docker compose up -d
docker compose ps
npm ci
npm run build:theme
docker exec blog_jurenites_web ./vendor/bin/drush cr
```

Verify actual HTTP output after the build and cache clear:

```bash
curl --fail -I http://jurenites.local/
curl --fail -I http://storybook.jurenites.local/
```

If the local proxy is unavailable, check Drupal from inside its container with
`curl --fail -I -H 'Host: jurenites.local' http://127.0.0.1/` through `docker exec`.
That checks Drupal separately from host routing.

Useful independent commands:

```bash
npm run build:tokens
npm run build-storybook
npm run build:info:check
npm run lint
npm run docs:check
npm run version:check
```

`npm run version:bump` increments the minor version. Use
`npm run version:bump -- patch` for a correction or `-- major` for an incompatible
change. Rebuild Storybook after a version change before checking its embedded
identity. `npm run build:info` refreshes metadata only; it does not rebuild stale
application code.

### Dependency and database updates

Resolve dependency changes in DEV and deploy the reviewed `composer.lock` with
`composer install` in PROD. `composer.lock` records resolved versions; do not
use an old update report in this runbook as evidence of current patch status.
The local Dockerfile uses Drupal's PHP 8.4 Apache image; the documented shared
host commands explicitly select PHP 8.3.

Save `composer.json`, `composer.lock`, and a compressed database backup outside
`web/` before updating. Check pending hooks first because `updatedb` also applies
custom-module content and configuration migrations.

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

### Artwork and Git

`output/ceramic-logo/.gitignore` keeps generated renders, reports, Blender
backups, and Python caches local. Preserve editable scenes and source artwork.
For already tracked generated files, a reviewed `git rm --cached` removes only
the index entry and keeps the working file. Review the staged diff before
committing. A cleanup commit does not remove historical blobs; rewriting
published history is a separate coordinated operation.

## DEV to PROD content restore

Use this procedure only for an intentional replacement of PROD content with a
DEV snapshot. Ordinary production code updates do not require a database import.
A restore replaces content, users, submissions, and active configuration; public
files transfer separately. Keep the target environment's settings and secrets.

Before starting:

1. Review and commit the intended code and generated assets. Push the chosen
   branch, review its pull request and CI results, and merge to `main` through
   the project's normal review process. Do not stage unrelated work blindly.
2. Record the intended release commit and confirm the exported DEV database
   matches that code's schema. Reconcile divergent branches before deployment;
   do not force-reset an existing production checkout to resolve them.
3. Back up the current PROD database and public files outside the public web
   root, and retain the matching old code for rollback.
4. Put PROD in maintenance mode for the restore window. Deploy the matching
   code and install locked dependencies before importing the database. An
   imported DEV database can replace maintenance configuration, so retain
   maintenance access control through the complete restore.
5. Export and validate the DEV archives below, import the database, restore
   public files, run database updates, clear cache, and verify the site before
   reopening it. Roll back code, database, and files together if needed.

### Step 1: Export DEV database and public files

Run on local macOS from the project root. Each timestamp creates a new export
folder. Keep the original MariaDB dump as well as the MySQL-compatible copy.

```bash
cd /Users/alexanderilivanov/Projects/blog_jurenites
set -o pipefail

EXPORT_TIMESTAMP="$(date +%Y-%m-%d-%H%M%S)"
EXPORT_DIRECTORY_PATH="$HOME/Downloads/blog_jurenites-export-${EXPORT_TIMESTAMP}"
SOURCE_SQL_ARCHIVE_PATH="$EXPORT_DIRECTORY_PATH/blog_jurenites-dev-original-${EXPORT_TIMESTAMP}.sql.gz"
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
  | gzip -9 > "$SOURCE_SQL_ARCHIVE_PATH"

gzip -t "$SOURCE_SQL_ARCHIVE_PATH"
gzip -dc "$SOURCE_SQL_ARCHIVE_PATH" \
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
shasum -a 256 "$SOURCE_SQL_ARCHIVE_PATH" "$SQL_ARCHIVE_PATH" "$PUBLIC_FILES_ARCHIVE_PATH"
open "$EXPORT_DIRECTORY_PATH"
```

The collation/database search must print nothing. The archive listing must start with `files/` and include `files/.htaccess`.

### Step 2: Prepare PROD code and upload archives

Sign in to [ISPmanager](https://server290.hosting.reg.ru:1500) using private
credentials and the account's second factor. In its shell, verify the checkout:

```bash
cd /var/www/u3614358/data/apps/blog_jurenites
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

Use File Manager to upload the verified public-files archive to
`/var/www/u3614358/data/backups/incoming/`. Never place database dumps or backup
archives below a public website directory.

### Step 3: Import the database

Open phpMyAdmin through ISPmanager. Select the target database and verify its
name against the target Drupal configuration. Confirm the current compressed
backup has been exported and downloaded, then use Import to load the
`blog_jurenites-dev-mysql8-<timestamp>.sql.gz` file created in Step 1.
Keep the original MariaDB archive for rollback or investigation.

### Step 4: Restore public files

Set the exact uploaded filename below. The placeholder intentionally names no
real release. Extraction happens in staging; the current files are retained as
rollback data. If a move fails, restore the saved directory before continuing.

```bash
cd /var/www/u3614358/data/apps/blog_jurenites

RESTORE_TIMESTAMP="$(date +%Y-%m-%d-%H%M%S)"
PUBLIC_FILES_ARCHIVE_PATH="/var/www/u3614358/data/backups/incoming/REPLACE-WITH-UPLOADED-PUBLIC-FILES.tar.gz"
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

### Step 5: Update, verify, and reopen PROD

```bash
/opt/php/8.3/bin/php ./vendor/bin/drush.php --uri=https://jurenites.com updatedb --yes
/opt/php/8.3/bin/php ./vendor/bin/drush.php --uri=https://jurenites.com cr
/opt/php/8.3/bin/php ./vendor/bin/drush.php --uri=https://jurenites.com status
```

Confirm database connectivity and successful Drupal bootstrap. Check English
and translated routes, login, images, avatars, thumbnails, release identity,
mail settings, and environment-specific menu destinations. Drupal regenerates
excluded CSS, JS, and image-style derivatives on demand. Disable maintenance
mode after verification and retain rollback data for the agreed review period.

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
STORYBOOK_ARCHIVE_PATH="/var/www/u3614358/data/backups/incoming/REPLACE-WITH-UPLOADED-STORYBOOK.tar.gz"
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



## PROD checks and code-only updates

The documented real checkout is `/var/www/u3614358/data/www/jurenites.com`, with
`/var/www/u3614358/data/apps/blog_jurenites` as a compatibility symlink. The
Drupal public root must resolve to the checkout's `web/`, not the repository
root. Verify `pwd -P` and ISPmanager's document-root configuration before relying
on either path. The Storybook subdomain must serve the installed
`storybook-static/` directory; installing an archive alone does not configure
its DNS, HTTPS, or document root.

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

Confirm dependencies before database updates. Deploy built theme assets and
fonts from the same release; production does not need to rebuild them.

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

Google Tag configuration lives in the environment's Drupal database. A complete
database restore transfers it; a code-only deployment does not. Inspect the
container and actual measurement destination before and after a restore rather
than relying on an old identifier copied into documentation. Preserve DEV's
local tracking suppression and PROD's own settings overrides. Do not copy
settings files or secrets between environments.

Verify public tag output and Analytics reception in a browser profile whose
extensions do not block the intended test. Tag presence alone does not establish
reception. Google Tag gateway configuration is not established by this runbook.

#### Microsoft Clarity

`drupal/ms_clarity` provides the editable Clarity project ID, page exclusions,
and role selection at **Configuration → Web services → Microsoft Clarity**
(`/admin/config/services/microsoft_clarity`). It inserts the asynchronous Clarity
snippet into the HTML head. Do not add a second copy in Twig or Google Tag Manager.

The local installation tracks anonymous visitors only, excluding `/admin`,
`/admin/*`, `/user`, `/user/*`, `/node/add`, `/node/add/*`, and `/node/*/edit`.
The ID and visibility settings are stored in `ms_clarity.settings` in each
environment's database. A code-only deployment requires enabling and configuring
the module in that environment:

```bash
composer install
vendor/bin/drush pm:enable ms_clarity --yes
# Save the project ID and tracking options through the settings page.
vendor/bin/drush cr
```

Version 2.0.1 needs the tracked
`patches/ms-clarity-drupal-11-settings-cache.patch`: it fixes the Drupal 11
settings-form constructor and removed role-list function, and adds cache metadata
for configuration changes and page/role visibility. Composer Patches applies the locked patch during install;
ship `patches/` and `patches.lock.json` with the Composer manifests. Reassess the
patch when upgrading the module.

Verify the local settings form, anonymous-only role selection, cache metadata,
and English/Russian HTML head output without sending browser telemetry:

```bash
docker exec blog_jurenites_web vendor/bin/drush php:script tests/clarity-integration.php
```

The existing privacy module's starter copy claims there is no analytics. Review
the editable privacy page and cookie notice before production activation. This
module supplies tracking configuration, not a visitor consent interface.

### Release identity

Drupal reads its checked-out commit and the tracked release record without
writing host metadata:

```bash
git rev-parse --short=7 HEAD
cat web/themes/custom/jurenites_theme/release-info.json
```

Compare these with the visible watermark and the public non-secret
`/themes/custom/jurenites_theme/release-info.json`. Storybook embeds identity at
build time and must be checked against its own deployed artifact. Local checks,
a branch push, or archive creation do not establish remote deployment.
