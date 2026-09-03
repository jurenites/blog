# Command Cheat Sheet

Keep DEV and PROD commands separate. Docker service names such as `db` resolve
inside the DEV Docker network, so run Drush inside the web container rather
than directly on macOS.

## DEV Environment

### Clear Drupal cache from any directory

```bash
docker exec blog_jurenites_web ./vendor/bin/drush cr
```

### Start the DEV containers from any directory

```bash
docker compose -f /Users/alexanderilivanov/Projects/blog_jurenites/docker-compose.yml up -d
```

### Check the DEV containers from any directory

```bash
docker compose -f /Users/alexanderilivanov/Projects/blog_jurenites/docker-compose.yml ps
```

### Follow Drupal container logs

```bash
docker logs --follow blog_jurenites_web
```

### Check Drupal status

```bash
docker exec blog_jurenites_web ./vendor/bin/drush status
```

### Run database updates, then clear cache

```bash
docker exec blog_jurenites_web ./vendor/bin/drush updatedb --yes
docker exec blog_jurenites_web ./vendor/bin/drush cr
```

### Run Drupal cron

```bash
docker exec blog_jurenites_web ./vendor/bin/drush cron
```

### Apply project Drupal recipes

```bash
docker exec blog_jurenites_web ./vendor/bin/drush recipe /opt/drupal/recipes/jurenites_media
docker exec blog_jurenites_web ./vendor/bin/drush recipe /opt/drupal/recipes/jurenites_progressive_images
docker exec blog_jurenites_web ./vendor/bin/drush recipe /opt/drupal/recipes/jurenites_image_comparison
docker exec blog_jurenites_web ./vendor/bin/drush recipe /opt/drupal/recipes/jurenites_paragraphs_crossfade
docker exec blog_jurenites_web ./vendor/bin/drush recipe /opt/drupal/recipes/jurenites_two_tone_heading
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

PROD is not configured in this repository yet. Do not copy DEV database
credentials, container names, or paths to PROD. Connect to the production host,
change to its deployed project root, and confirm the environment before running
write commands.

### Confirm the production environment

```bash
pwd
./vendor/bin/drush status
```

Check the reported site URI, database, and Drupal root before continuing.

### Build and verify the production identity

When PROD is a Git checkout, the build reads its current `HEAD` automatically:

```bash
npm ci
npm run build:theme
npm run build:info:check
```

When PROD receives an artifact without `.git`, its CI/CD system must provide the
full source commit while building:

```bash
JURENITES_GIT_COMMIT=FULL_COMMIT_SHA npm run build:theme
```

After deployment, the visible watermark and
`/themes/custom/jurenites_theme/build-info.json` expose the same non-secret
version, Git hash, build time, and collaboration credit.

### Clear the production Drupal cache

```bash
./vendor/bin/drush cr
```

### Run production database updates, then clear cache

Take a current database backup before database updates.

```bash
./vendor/bin/drush updatedb --yes
./vendor/bin/drush cr
```

### Run production cron manually

```bash
./vendor/bin/drush cron
```

Use the hosting scheduler for recurring production cron runs.
