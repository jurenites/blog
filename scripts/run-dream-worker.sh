#!/bin/sh
set -eu
cd /opt/drupal
# Finish any current provider request before exiting on Docker stop.
trap 'wait; exit 0' TERM INT
while true; do
  php vendor/bin/drush.php --uri=http://jurenites.local queue:run jurenites_dream_desire_images --time-limit=240 --lease-time=300 &
  wait "$!" || true
  sleep 10 &
  wait "$!" || true
done
