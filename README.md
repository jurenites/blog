# Blog Jurenites

Personal Drupal 11 site for Alexander Ilivanov / jurenites.

This repo starts as the working system for a personal blog, portfolio, CV timeline, and public design/development process. The site should show not only finished work, but also how the work is structured: idea file, tokens, Figma, Storybook, Drupal content model, custom theme, and custom Drupal modules.

## Direction

- CMS: Drupal 11.
- Purpose: personal promotion, networking, portfolio, and long-form writing.
- Design source: Figma file `blog-jurenites`.
- Design data source: `tokens/tokens.json`.
- Component proving ground: Storybook.
- Runtime target: local Docker first, staging second, production hosting later.

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
  -> staging preview
  -> production hosting
```

The current Figma file is:

https://www.figma.com/design/UMshUcV87SZqsg1aDaDpnZ/blog-jurenites

## First Milestones

1. Freeze the initial site map and content model.
2. Create Drupal 11 Docker development environment.
3. Add Storybook for theme components.
4. Move first design decisions into `tokens/tokens.json`.
5. Build the interactive CV timeline component.
6. Add Drupal content types for timeline events, projects, articles, and gallery items.
7. Decide what can be public, anonymized, or private.

## Hosting Note

Drupal needs a PHP runtime, database, and persistent file storage. Vercel is useful for Storybook, static previews, or a decoupled frontend, but it is not the natural host for a full Drupal runtime. The practical plan is:

- local Docker: full Drupal development;
- Vercel: Storybook or static/design preview stage;
- later hosting server: full Drupal production site.

## Repository Status

Initial planning repo. Drupal code has not been scaffolded yet.
