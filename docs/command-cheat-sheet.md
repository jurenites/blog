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

[Drupal](http://jurenites.local) · [Storybook](http://storybook.jurenites.local) ·
[Presentation UX](http://presentation.jurenites.local/#story-1)

### Visual testing

```bash
npm run playwright:install  # First setup / browser updates
npm run status:build        # Repeat after source changes
npm run status:serve
```

[Dashboard](http://test.jurenites.local) — requires Docker proxy + this terminal.

### Common commands

| Task | Command |
| --- | --- |
| Clear Drupal cache | `docker exec blog_jurenites_web ./vendor/bin/drush cr` |
| Pending database updates | `docker exec blog_jurenites_web ./vendor/bin/drush updatedb:status` |
| Apply database updates | `docker exec blog_jurenites_web ./vendor/bin/drush updatedb --yes` |
| Container status | `docker compose ps` |
| Logs | `docker compose logs --tail=100 web db local_proxy` |
| Reload proxy | `docker compose exec local_proxy nginx -t && docker compose exec local_proxy nginx -s reload` |
| Stop Docker, keep data | `docker compose stop` |
| Stop dashboard | `Ctrl+C` |
| Storybook without Docker | `npm run storybook` → [localhost:6006](http://localhost:6006) |
| Build theme | `npm run build:theme` |
| Build Storybook | `npm run build-storybook` |
| Lint | `npm run lint` |
| Check docs / version | `npm run docs:check && npm run version:check` |
| Next release | `npm run version:bump` (`-- patch` for corrections) |

Run local Drush inside Docker; database hostname `db` does not resolve on macOS.

### Update Drupal dependencies

Back up the DEV database and Composer manifests outside `web/` first.

```bash
docker exec blog_jurenites_web composer update 'drupal/*' --with-all-dependencies --dry-run
# Review, then apply:
docker exec blog_jurenites_web composer update 'drupal/*' --with-all-dependencies
docker exec blog_jurenites_web composer validate --strict
docker exec blog_jurenites_web composer check-platform-reqs
docker exec blog_jurenites_web composer audit
docker exec blog_jurenites_web ./vendor/bin/drush updatedb --yes
docker exec blog_jurenites_web ./vendor/bin/drush cr
```

### ClickHouse (optional, local only)

```bash
docker compose up -d clickhouse
docker compose exec clickhouse sh -c 'exec clickhouse-client --user "$CLICKHOUSE_USER" --password "$CLICKHOUSE_PASSWORD" --database "$CLICKHOUSE_DB"'
docker compose stop clickhouse
```

[SQL console](http://localhost:8123/play) · Credentials: ignored `docker/clickhouse/.env.local`.

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

More: [Workflow](workflow.md) · [CI/CD](ci-cd.md) · [Visual testing](visual-testing-plan.md).
