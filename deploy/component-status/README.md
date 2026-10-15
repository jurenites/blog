# Interactive testing dashboard deployment

Target: **http://test.jurenites.com**, HTTP only, restricted to trusted IPs.
These files prepare deployment; they do not change DNS or a live server.

The host needs Node.js 22, npm, Linux support for Playwright Chromium, Nginx
and a process supervisor. The supplied service uses systemd. A static-only
hosting plan cannot run this dashboard. Confirm these capabilities before
installing. ISPmanager-managed Nginx settings must be added through its supported
custom configuration mechanism so the panel does not overwrite them.

## Install privately

Use a dedicated unprivileged account `jurenites-testing` and a private application
directory `/srv/jurenites-testing/app`, outside every web document root. Copy the
reviewed repository there, including the changes in this delivery. A checkout of
the old remote branch does not include uncommitted local changes. Do not copy
local `.env` files, credentials, `node_modules`, or browser binaries.

Run as the service account from that directory:

```sh
npm ci
npm run status:build
PLAYWRIGHT_BROWSERS_PATH=/srv/jurenites-testing/browsers npx playwright install chromium
mkdir -p .cache/component-status visual-history
```

Install Chromium system dependencies with the host administrator's approved
package-management process (`npx playwright install-deps chromium` on supported
Linux distributions). Keep the build's source files: capture preflight hashes
them and rejects a stale Storybook build. Rebuild after any source change.

Copy `environment.example` to `/etc/jurenites-testing.env`, owned by root with
mode `0600`. Set `COMPONENT_STATUS_WEBSITE_ORIGIN` to the actual Drupal origin
(use HTTPS here if Drupal uses HTTPS). Add `FIGMA_ACCESS_TOKEN` only on the server
if automatic Figma export is wanted; manual PNG upload works without it.
Copy the service to `/etc/systemd/system/component-status.service`, adjusting
`ExecStart` if Node is not installed at `/usr/bin/node`, then:

```sh
sudo systemctl daemon-reload
sudo systemctl enable --now component-status
sudo systemctl status component-status
curl --fail http://127.0.0.1:7779/api/status
```

The account must own the report and history directories. They contain saved
settings, uploaded references, captures and history; back them up and retain them
across releases. Do not make the application checkout a public document root.

## Restrict and expose the HTTP virtual host

Add an A record for `test` using the hosting provider's actual website IP.
Use `nginx.conf` as the dedicated virtual host, replacing the commented allow
line with your trusted public IP or VPN subnet. Keep `deny all`. The supplied
configuration denies every external visitor until an allow entry is configured.
Restrict **all** routes, including API, Storybook and image paths, with this rule.
Do not expose port 7779; Node listens only on loopback.

This uses IP access control rather than a password sent over HTTP. HTTP traffic
is unencrypted; use a private VPN when transport confidentiality is needed.
The review token is CSRF protection, not user authentication. Anyone on an
allowed IP can edit the shared workspace and run browser captures.

Validate the complete host configuration before reloading:

```sh
sudo nginx -t
sudo systemctl reload nginx
curl --fail -I http://test.jurenites.com/
curl --fail -I http://test.jurenites.com/favicon.svg
```

From an unlisted address, `/`, `/api/status`, `/storybook/iframe.html` and
`/artifacts/` must all return 403. From an allowed address, open the dashboard,
edit a Storybook selector, verify a new PNG appears, upload a manual PNG, and
reload to verify saved settings. Test the T favicon and footer link too.

## Review environment-specific mappings

The committed examples and any copied DEV reports may contain `.local` website
URLs or loopback Storybook URLs. In source settings, replace those website URLs
with the real website address and use `/storybook/iframe.html?id=...` for
Storybook. Relative website paths are resolved by the capture API against
`COMPONENT_STATUS_WEBSITE_ORIGIN`. Existing absolute URLs and historical capture
metadata are intentionally preserved. Copy `.cache/component-status` and
`visual-history` only if you want those local records on this restricted server.

The live Website iframe bridge remains local-only. Production screenshot capture
works independently; enabling a production live Website embed would require a
separate Drupal origin/frame-policy change. The specialized language-picker
suite also retains its local fixtures. Neither is a deployment prerequisite for
normal component PNG captures.

The footer's existing Testing destination is editable menu content. Deploy the
theme assets containing `brand-testing.svg`, then run
`FOOTER_TEST_URL=http://test.jurenites.com/ vendor/bin/drush php:script scripts/footer/testing-link.php`
and rebuild Drupal caches. This adds a missing T icon without overwriting the
existing link or its translations.

For updates, stop the service, back up its data, install the reviewed code,
run `npm ci` and `npm run status:build`, then restart and repeat the checks.
Retain the previous code and data backup for rollback. Never copy macOS
`node_modules` or Chromium binaries to Linux.
