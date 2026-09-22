## Command Cheat Sheet

Keep DEV .env and PROD .env commands separate at DEV there is a Docker service names such as `db` resolve inside the DEV Docker network, so run Drush inside the web container rather than directly on local machine (macOS).

# DEV Environment

### Blender outputs and Git

`output/ceramic-logo/.gitignore` keeps rendered frames, images, videos, validation reports, Blender backups, and Python caches local. The small editable scene, build/render scripts, and source SVG remain versioned. Back up local artwork and exports separately when needed.

For already tracked outputs, adding an ignore rule is not sufficient. Remove only the intended generated paths from the index with `git rm --cached` (or
`git rm -r --cached` for a directory); this preserves the working files. Review
`git diff --cached --stat` before committing.

A cleanup commit stops tracking those files in subsequent revisions. It does not remove their blobs from earlier commits or reduce full-clone history size. Purging published blobs requires a coordinated history rewrite and force push; back up the original history and local artwork before doing that.

### Step 1: StepRun commands from the project folder

```bash
cd /Users/alexanderilivanov/Projects/blog_jurenites
```

### Step 2: Clear Drupal cache (from any directory)

```bash
docker exec blog_jurenites_web ./vendor/bin/drush cr
```

### Step 3: Build project assets

```bash
npm run build:theme
```

(optional)

```bash
npm run build:tokens
npm run build-storybook
npm run build:info
npm run build:info:check
npm run version:check
```

increments the minor version by default. Use  when the release type must be explicit.

```bash
npm run version:bump

npm run version:bump -- patch
npm run version:bump -- minor
npm run version:bump -- major
```

#### Update Drupal core and contributed projects in DEV

Resolve dependency updates in DEV and deploy the resulting `composer.lock` with `composer install` in PROD. Keep `minimum-stability: stable`; Drupal 12 alpha is for compatibility testing and has no supported upgrade path to later alphas or beta. It also requires PHP 8.5, above the current DEV PHP 8.4 runtime.

Before updating, save `composer.json`, `composer.lock`, and a compressed database dump under an ignored `backups/` subdirectory, outside `web/`. Check pending database updates first: `updatedb` also applies pending custom-module hooks.

```bash
docker exec blog_jurenites_web ./vendor/bin/drush updatedb:status
docker exec blog_jurenites_web composer outdated 'drupal/*' --direct
docker exec blog_jurenites_web composer update 'drupal/*' --with-all-dependencies --dry-run --no-interaction
docker exec blog_jurenites_web composer update 'drupal/*' --with-all-dependencies --no-interaction
docker exec blog_jurenites_web composer validate --strict
docker exec blog_jurenites_web composer check-platform-reqs
docker exec blog_jurenites_web composer audit
```

On 2026-09-17, the resolved update moves core 11.4.6 to the 11.4.7 security release, Image Blurry Placeholder 1.2.0 to 1.3.0, Image Compare 1.0.3 to 1.1.0, Publication Date 3.1.0 to 3.2.0, and Tagify 2.0.2 to 2.0.3, with compatible Symfony patch updates. See the [11.4.7 release notes](https://www.drupal.org/project/drupal/releases/11.4.7) and [Drupal 12 alpha limitations](https://www.drupal.org/project/drupal/releases/12.0.0-alpha1).

Local verification passed: Composer validation, platform requirements and audit (zero advisories), no remaining database updates, and all 21 projects in the refreshed Drupal update report marked current. Fifteen public/login routes, including both languages and the Russian About alias `/ru/obo`, returned HTTP 200; translated Videos layout and Game of Life editor checks also passed. Rollback files are in `backups/composer-update-20260917/`; the compressed SQL dump passed `gzip -t`. This records DEV verification, not a production deployment.

#### Run database updates, then clear cache

```bash
docker exec blog_jurenites_web ./vendor/bin/drush updatedb --yes
docker exec blog_jurenites_web ./vendor/bin/drush cr
docker exec blog_jurenites_web ./vendor/bin/drush updatedb:status
```

#### Apply project Drupal recipes

// maybe change it to a SH script?

```bash
docker exec blog_jurenites_web ./vendor/bin/drush recipe /opt/drupal/recipes/jurenites_media
docker exec blog_jurenites_web ./vendor/bin/drush recipe /opt/drupal/recipes/jurenites_progressive_images
docker exec blog_jurenites_web ./vendor/bin/drush recipe /opt/drupal/recipes/jurenites_image_comparison
docker exec blog_jurenites_web ./vendor/bin/drush recipe /opt/drupal/recipes/jurenites_paragraphs_crossfade
docker exec blog_jurenites_web ./vendor/bin/drush recipe /opt/drupal/recipes/jurenites_two_tone_heading
docker exec blog_jurenites_web ./vendor/bin/drush recipe /opt/drupal/recipes/jurenites_cookbook
```

# DEV to PROD Content Restore (Manual)

Development Mode - Use this direction only when intentionally replaces all from: DEV ->  to: PROD content. Inactive Mode - The normal long-term content-sync direction is form: PROD -> to: DEV.   

- The Database SQLdump contains content; importing it replaces every DB records.   
- public Files are transferred separately in a .tar archive.


### Step 0: at the DEV .env push changes to a codebase repo (terminal)

0.1 go to projcet folder

```bash
cd /Users/alexanderilivanov/Projects/blog_jurenites
```

0.2 check if anything new added

```bash
git status
```

0.3 IF yes than add to repo

```bash
git add .
```

0.4 ask AI the quick diff text for commit_message
0.5 copy/paste the {commit_message}

```bash
git commit -am'{commit_message}'
```

0.6 send the code to a needed branch

```bash
git push origin develop
```

0.7 go at [https://github.com/jurenites/blog/pulls](https://github.com/jurenites/blog/pulls) 
0.8 create new Pull Request from a given branch `develop` to a `main`,
0.9 assign on yourselfm check the text, check the CI/CD pipeline errors.
0.10 merge the created PR with branch `main`. 
voila!

### Step 1: at the DEV .env make 2 archive files (terminal)

1.1 Run from the project root on local machie macOS. The timestamp creates a new folder on every run, so an older export is not overwritten.

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

(optional) Verify both archives before uploading them:

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

### Step 2: Upload the DEV .env /files via ispmanager (browser)

2.1 go at [https://server290.hosting.reg.ru:1500](https://server290.hosting.reg.ru:1500)  
2.2 Authorise uing Login; Password (at **Notes** app)  
2.3 enter Verification Code (with **Authentificator** app)  
2.4 go at File manager. `/var/www/u3614358/data/backups/incoming/`  
note: never upload them below either public website directory.  
2.5 uplaod frol local computer files archive with files folder example: `/Users/alexanderilivanov/Downloads/blog_jurenites-export-2026-09-15-211343/blog_jurenites-public-files-dev-2026-09-15-211343.tar.gz`  
60+ MB

### Step 3: Upload the DEV .env DB via ispmanager -> **phpMyAdmin** (browser)

3.1 go at [https://server290.hosting.reg.ru:1500/ispmgr#/form?clickstat=yes&func=links_myadmin&tab_id=1&tab_standalone=true](https://server290.hosting.reg.ru:1500/ispmgr#/form?clickstat=yes&func=links_myadmin&tab_id=1&tab_standalone=true)  
3.2 Authorise uing Login; Password (at Notes app)  
3.3 at **phpMyAdmin** at left side select the database name,  
3.4 click [import] button  
3.5 choose the file `/Users/alexanderilivanov/Downloads/blog_jurenites-export-2026-09-15-211343/blog_jurenites-dev-mysql8-2026-09-15-211343.sql.gz`  
3.4 click [import] submit button. Export a current compressed SQL backup and download it before changing tables.

### Step 4: update the PROD code (browser)

4.1 go at [https://server290.hosting.reg.ru:1500](https://server290.hosting.reg.ru:1500)  
4.2 open Shell-client browser version  
4.3 First update code from `main` so its schema and recipes correspond to the database being restored.

```bash
cd /var/www/u3614358/data/apps/blog_jurenites
git pull --ff-only origin main
```

4.4 Finish the database restore from the PROD project directory:

```bash
/opt/php/8.3/bin/php ./vendor/bin/drush.php --uri=https://jurenites.com updatedb --yes
/opt/php/8.3/bin/php ./vendor/bin/drush.php --uri=https://jurenites.com cr
/opt/php/8.3/bin/php ./vendor/bin/drush.php --uri=https://jurenites.com status
```

The final status must report `Database: Connected` and `Drupal bootstrap: Successful`.

### Step 5: Replace PROD public files from the archive (browser)

5.1 Set the archive filename to the file that was uploaded. This procedure extracts into a staging directory first and keeps the previous PROD files as a rollback.

```bash
cd /var/www/u3614358/data/apps/blog_jurenites

RESTORE_TIMESTAMP="$(date +%Y-%m-%d-%H%M%S)"
PUBLIC_FILES_ARCHIVE_PATH="/var/www/u3614358/data/backups/incoming/blog_jurenites-public-files-dev-2026-09-19-154148.tar.gz"
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

(Optional) 5.2 verify, by Opening several image, avatar, and thumbnail URLs on PROD before removing the rollback directory. Drupal will regenerate excluded CSS, JS, and image-style derivatives when they are requested.

# Deploy Storybook from DEV to PROD (manual)

Production Storybook is a static browser application, not a permanent Node development server. The generated site remains interactive and includes the Storybook manager, stories, controls, documentation, JavaScript, CSS, fonts, and other assets. Serve `storybook-static/`; do not point the subdomain at the`.storybook/` configuration directory.

The ISPmanager host cannot build this project reliably: its 256 MB memory limit caused WebAssembly allocation failures even with restricted Node heaps, and its Ruby/Psych version cannot parse the token source used by the build. Build the exact PROD `main` commit on macOS, upload the result, and let Nginx serve it.

### Step 1: Build the exact `main` commit on macOS

1.1 This isolated build does not switch branches or modify the current working tree. Run this entire step in the **local macOS Terminal**, never in the ISPmanager shell. The first check deliberately stops a Linux shell before any paths or build variables are created:

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

1.2 Verify the artifact before uploading it:

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

2.1 Upload the verified `blog_jurenites-storybook-*.tar.gz`  file with ISPmanager File Manager or FTP to this private directory: `/var/www/u3614358/data/backups/incoming/` wait until uplaoding 10MB+

2.2 open Shell-client  
On PROD, set `STORYBOOK_ARCHIVE_PATH` to the actual uploaded filename. Extract to staging and keep the previous build as a timestamped rollback:

```bash
cd /var/www/u3614358/data/apps/blog_jurenites

STORYBOOK_DEPLOY_TIMESTAMP="$(date +%Y-%m-%d-%H%M%S)"
STORYBOOK_ARCHIVE_PATH="/var/www/u3614358/data/backups/incoming/blog_jurenites-storybook-f9504ad-2026-09-15.tar.gz"
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

`STORYBOOK BUILD INSTALLED` Do not continue until the expected output  
(optional) test this check prints `BUILD READY`:

```bash
test -f /var/www/u3614358/data/apps/blog_jurenites/storybook-static/index.html \
  && echo "BUILD READY" || echo "BUILD MISSING"
```



# PROD Environment

The real ISPmanager production checkout is `/var/www/u3614358/data/www/jurenites.com` with the website public directory set in ISPmanager.  
The symlink path `/var/www/u3614358/data/apps/blog_jurenites` to this checkout, so the commands below remain valid.   

1. go to folder

```bash
cd /var/www/u3614358/data/apps/blog_jurenites
```

note: Do not copy DEV .env database credentials, container names, .env, or settings.php 

(optional) To verify public HTTPS and HTTP redirects without bypassing validation:

```bash
curl -I https://jurenites.com/
curl -I https://www.jurenites.com/
curl -I http://jurenites.com/
curl -I http://www.jurenites.com/
```

(optional) Confirm the production environment

```bash
/opt/php/8.3/bin/php ./vendor/bin/drush.php --uri=https://jurenites.com status
```

Check the reported site URI, database, and Drupal root before continuing.

### Analytics transfers with the database

The DEV database already stores the enabled **jurenites Blog PROD** container
with Measurement ID `G-0JRLBSZQB4`. A fresh database export/import carries that
configuration to PROD; no Analytics deployment script is needed. Older database
archives still contain the previous ID, so export again for this deployment.

Local tracking is blocked on every path by an insertion-condition override in
DEV's ignored `web/sites/default/settings.php`. That override is not stored in
the database. Keep PROD's existing `settings.php` and `.env` when transferring
code and public files, then run the usual database updates and cache clear.
A code-only deployment does not transfer this database configuration.

The container's stable machine name still contains `G-8TW69FRKWF`; its actual
Measurement ID is `G-0JRLBSZQB4`. The Chrome opt-out extension remains unchanged.
After deployment, check the public tag configuration and GA4 using a browser
profile without the opt-out extension.

For a replacement DEV installation, preserve this local settings override:

```php
$config['google_tag.container.G-8TW69FRKWF.6a91c7e379c2c0.58424849']['conditions']['request_path'] = [
  'id' => 'request_path',
  'negate' => TRUE,
  'pages' => '*',
];
```

(optional) Verify the production identity

PROD does not build or write identity metadata. The tracked release record arrives with the source, and Drupal reads the  (optional) checked-out commit from `.git`:

```bash
git rev-parse --short=7 HEAD
cat web/themes/custom/jurenites_theme/release-info.json
```

The visible watermark combines those two read-only sources. The tracked release record is also available at `/themes/custom/jurenites_theme/release-info.json`.

2. Run production database updates, then clear cache

```bash
/opt/php/8.3/bin/php ./vendor/bin/drush.php --uri=https://jurenites.com updatedb --yes
```

3. then Clear the production Drupal cache

```bash
/opt/php/8.3/bin/php ./vendor/bin/drush.php --uri=https://jurenites.com cr
```
(optional) re install the libraries
```bash
/opt/php/8.3/bin/php /var/www/u3614358/data/bin/composer install --no-dev --optimize-autoloader
```
