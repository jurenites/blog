# CI/CD and the Interconnected Pipeline

The goal: five tools stay in sync through one source of truth.

```text
                     tokens/tokens.yaml  (SOURCE OF TRUTH)
                              |
            scripts/build-tokens.mjs (scripts/sync.sh build)
        ______________________|________________________________
       |                |                |                      |
 generated SCSS    tokens.flat.json  tokens.min.json     tokens.studio.json
       |                |                                       |
 slice/main.scss   Storybook foundations                 Tokens Studio plugin
       |                |                                       |
 Storybook  <----  (same SCSS)                              Figma variables
       |
 scripts/build-theme.mjs (scripts/sync.sh theme)
       |
 web/themes/custom/jurenites_theme  ->  Drupal (drush cache rebuild + asset re-version)
```

Everything is driven from `scripts/sync.sh` so the workflow lives in the repo.

## Local commands (the everyday loop)

| Action                                   | Command                       |
| ---------------------------------------- | ----------------------------- |
| Edit tokens, regenerate derived files    | `scripts/sync.sh build`       |
| See/refresh Storybook                    | `npm run storybook`           |
| Push tokens to Figma (Tokens Studio)     | `scripts/sync.sh studio`      |
| Pull Figma variable edits back           | `scripts/sync.sh pull`        |
| Build + deploy theme to local Drupal     | `scripts/sync.sh deploy-theme`|

## GitHub Actions

- **CI** (`.github/workflows/ci.yml`): on every push/PR, builds tokens, theme,
  Tokens Studio file, and Storybook, then fails if any committed generated file
  drifts from `tokens.yaml`. This enforces the source-of-truth contract.
- **Deploy Storybook** (`.github/workflows/storybook-pages.yml`): publishes the
  component library to GitHub Pages on `main`. Enable Pages -> Source: GitHub
  Actions in the repo settings once.
- **Figma Sync** (`.github/workflows/figma-sync.yml`): a `repository_dispatch`
  of type `figma-sync` (or manual `workflow_dispatch`) applies an incoming flat
  token map onto `tokens.yaml` and opens a pull request.

## Webhook strategy (who triggers whom)

We avoid wiring custom servers. The trigger fabric is GitHub events plus a thin
relay where an external product cannot call GitHub directly.

| Source changed | Signal                              | Consumers re-synced                    |
| -------------- | ----------------------------------- | -------------------------------------- |
| tokens.yaml    | git push                            | CI rebuilds; Storybook redeploys; Tokens Studio file updated |
| SCSS slice     | git push                            | CI rebuilds theme + Storybook          |
| Figma variables| Figma webhook -> relay -> dispatch  | `figma-sync` workflow opens a PR on tokens.json |

### Figma webhook relay

Figma's REST webhooks (`FILE_UPDATE`) cannot POST GitHub's `repository_dispatch`
shape directly, so use a tiny relay (a serverless function such as a Cloudflare
Worker) that:

1. Receives the Figma `FILE_UPDATE` event.
2. Reads the file variables (Figma MCP read snippet logic, or the Variables API).
3. POSTs to `https://api.github.com/repos/jurenites/blog/dispatches` with
   `{ "event_type": "figma-sync", "client_payload": { "variables": { ... } } }`
   using a fine-grained token.

The relay is the only third-party piece and it is optional: until it exists, run
the Figma -> tokens pull manually (`scripts/sync.sh pull`) or trigger the
`figma-sync` workflow by hand with `workflow_dispatch`.

## One-time setup checklist

- [ ] Repo Settings -> Pages -> Source: GitHub Actions (for Storybook deploy).
- [ ] Add a fine-grained PAT/secret if the Figma relay will call dispatches.
- [ ] Configure Tokens Studio in Figma to sync from `tokens/tokens.studio.json`.
