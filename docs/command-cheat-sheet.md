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
```

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
