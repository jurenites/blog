# Blog Jurenites

Personal Drupal 11 site for Alexander Ilivanov / jurenites.

This repo is the working system for a personal blog, portfolio, CV timeline, and public design/development process. The site should show not only finished work, but also how the work is structured: idea file, tokens, Figma, Storybook, Drupal content model, custom theme, and custom Drupal modules.

## Direction

- CMS: Drupal 11.
- Purpose: personal promotion, networking, portfolio, and long-form writing.
- Design source: Figma file `blog-jurenites`.
- Design data source: `tokens/tokens.json`.
- Component proving ground: Storybook.
- Runtime target: Docker development first, stage preview second, production hosting later.

## Workflow

The project workflow is:

```text
Idea file
  -> tokens/tokens.json
  -> Storybook components
  -> Figma design
  -> Drupal 11 custom theme
  -> Drupal custom module(s)
  -> local Docker environment
  -> stage environment
  -> production hosting
```

The current Figma file is:

https://www.figma.com/design/UMshUcV87SZqsg1aDaDpnZ/blog-jurenites

## First Milestones

1. Create Drupal 11 Docker development environment.
2. Add Storybook for custom theme components.
3. Keep `tokens/tokens.json` as the shared machine-readable token contract.
4. Connect Figma design variables and code tokens in both directions.
5. Build the first interactive CV timeline component.
6. Add universal Drupal node types, without overfitting fields too early.
7. Decide what can be public, anonymized, or private.

## Local Development

The local development environment should be Docker-first and reproducible.

Target shape:

```text
docker-compose.yml
  Drupal 11 / PHP container
  database container
  web server container if not included in the Drupal image
  optional mailhog/mailpit container
```

Target commands:

```bash
docker compose up -d
docker compose ps
curl -I http://127.0.0.1:8081/
```

The local Drupal site uses port `8081` to avoid colliding with other local Drupal projects. A running container is not enough; the dev environment should be considered ready only after an HTTP check works.

Initial local admin login:

- URL: `http://127.0.0.1:8081/user/login`
- User: `admin`
- Password: `admin`

Storybook runs through Docker too:

```bash
docker compose up storybook
curl -I http://127.0.0.1:6006/
```

If `docker` is not on the shell PATH, use `/usr/local/bin/docker` or add Docker Desktop's CLI path to the shell profile.

## Stage Environment

Drupal needs PHP, a database, and persistent file storage. Vercel is useful for Storybook, static previews, or a decoupled frontend, but it is not the natural host for a full Drupal runtime.

Stage plan:

- Vercel: Storybook/static component preview, useful for visual review and design-system checks.
- Drupal-capable hosting: full CMS stage when database/content behavior needs to be tested.
- Later production: low-cost hosting server for the final domain.

The stage workflow will be refined after the local Docker environment exists.

## Repository Status

Drupal 11, Docker Compose, Storybook, a minimal custom theme, and a minimal token bridge module are installed locally. The project is still early and expected to change heavily.
