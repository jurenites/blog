#!/usr/bin/env bash
#
# Single console entrypoint for the interconnected token pipeline.
# Everything is operated from this script so the workflow stays inside the repo.
#
# Usage:
#   scripts/sync.sh build              Regenerate SCSS/CSS/min/flat from tokens.json
#   scripts/sync.sh theme              Build minified Drupal theme assets (runs build first)
#   scripts/sync.sh studio             Regenerate tokens.studio.json for the Tokens Studio push to Figma
#   scripts/sync.sh pull [file]        Apply Figma variable changes into tokens.json (then rebuild)
#   scripts/sync.sh pull-dry [file]    Preview Figma -> tokens changes without writing
#   scripts/sync.sh drush-cache        Rebuild the Drupal cache in the running web container
#   scripts/sync.sh deploy-theme       theme + reset asset query string + drush cache rebuild
#   scripts/sync.sh status             Show git status of token + generated files
#   scripts/sync.sh all                build + theme + studio

set -euo pipefail

# Constants.
readonly REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
readonly DOCKER_BIN="${DOCKER_BIN:-docker}"
readonly WEB_CONTAINER="blog_jurenites_web"
readonly FIGMA_INPUT_DEFAULT="${REPO_ROOT}/scripts/figma/figma-variables.json"

cd "${REPO_ROOT}"

print_usage() {
  cat <<'USAGE'
Token pipeline console. Everything is operated from this script.

Usage: scripts/sync.sh <command>

  build          Regenerate SCSS/CSS/min/flat from tokens.json
  theme          Build minified Drupal theme assets (runs build first)
  studio         Regenerate tokens.studio.json for the Tokens Studio push to Figma
  pull [file]    Apply Figma variable changes into tokens.json, then rebuild
  pull-dry [file] Preview Figma -> tokens changes without writing
  drush-cache    Rebuild the Drupal cache in the running web container
  deploy-theme   theme + reset asset query string + drush cache rebuild
  status         Show git status of token + generated files
  all            build + theme + studio
USAGE
}

build_tokens() {
  npm run build:tokens
}

build_theme() {
  npm run build:theme
}

build_studio() {
  node scripts/figma/to-tokens-studio.mjs
}

pull_from_figma() {
  local input_file="${1:-${FIGMA_INPUT_DEFAULT}}"
  shift || true
  node scripts/figma/pull-from-figma.mjs "${input_file}" "$@"
  build_tokens
}

require_web_container() {
  if ! "${DOCKER_BIN}" ps --format '{{.Names}}' | grep -q "^${WEB_CONTAINER}$"; then
    echo "Web container '${WEB_CONTAINER}' is not running. Start it with: docker compose up -d" >&2
    return 1
  fi
}

drush_cache_clear() {
  require_web_container
  "${DOCKER_BIN}" exec "${WEB_CONTAINER}" vendor/bin/drush cache:rebuild
}

# Reset Drupal's asset query string so every aggregated CSS/JS URL changes.
# Reason: a hard browser-history clear cannot be triggered remotely; bumping the
# ?query= on assets makes a plain F5 load the new build instead of stale cache.
reset_asset_query() {
  require_web_container
  "${DOCKER_BIN}" exec "${WEB_CONTAINER}" vendor/bin/drush php:eval \
    "\Drupal::service('asset.query_string')->reset();"
}

deploy_theme() {
  build_theme
  reset_asset_query
  drush_cache_clear
  echo "Theme deployed. Assets re-versioned; an F5 (or Cmd+Shift+R) loads the new build."
}

show_status() {
  git status --short -- tokens/ slice/ web/themes/custom/jurenites_theme/ || true
}

main() {
  local command="${1:-help}"
  shift || true
  case "${command}" in
    build) build_tokens ;;
    theme) build_theme ;;
    studio) build_studio ;;
    pull) pull_from_figma "$@" ;;
    pull-dry) pull_from_figma "${1:-${FIGMA_INPUT_DEFAULT}}" --dry-run ;;
    drush-cache) drush_cache_clear ;;
    deploy-theme) deploy_theme ;;
    status) show_status ;;
    all) build_tokens && build_theme && build_studio ;;
    help|*)
      print_usage
      ;;
  esac
}

main "$@"
