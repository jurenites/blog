# Project Workflow

## 1. Idea File

`idea-file.md` is the rough source of truth for product direction, content ideas, feature ideas, and implementation notes. It is intentionally allowed to be messy.

Rules:

- Add raw ideas quickly.
- Do not put final architecture only in chat.
- Promote stable ideas into docs, tokens, content model, or implementation tasks.

## 2. Tokens

`tokens/tokens.json` is the structured source for reusable design decisions.

Token groups:

- `color`
- `typography`
- `space`
- `radius`
- `motion`
- `background`
- `timeline`
- `mediaLoader`

Naming rule: prefer searchable names with at least two meaningful words.

Example:

```json
{
  "timeline.marker.activeColor": "#f97316"
}
```

## 3. Storybook

Storybook is the place to prove component behavior before Drupal integration.

Initial components:

- `GradientBackground`
- `TimelineRail`
- `TimelineMarker`
- `TimelineProjectCard`
- `ProgressiveMedia`
- `HireMeWidget`
- `ArticleTeaser`
- `GalleryEffectCard`

## 4. Figma

Figma is used for layout, visual exploration, and design review.

Current file:

https://www.figma.com/design/UMshUcV87SZqsg1aDaDpnZ/blog-jurenites

The file already has Material 3 Design Kit available. The project should reuse the parts that help, but the site should still feel personal and specific.

## 5. Drupal

Drupal is the content and runtime layer.

Initial content types:

- Article
- Timeline Event
- Project
- Gallery Item
- External Reference

Initial custom theme:

- `jurenites_theme`

Initial custom modules:

- `jurenites_timeline`
- `jurenites_media_loader`
- `jurenites_tokens`

## 6. Local Development

Local development should run in Docker first. The target developer command should eventually be one command, for example:

```bash
docker compose up -d
```

Then verify the site with an actual HTTP check, not just running containers.

## 7. Staging

Staging needs two tracks:

- Vercel for Storybook/static design previews.
- Drupal-capable hosting for full CMS staging when needed.

## 8. Production

Production target is a low-cost hosting server for `juernites.com` or a final domain chosen later.

Production needs:

- PHP supported by Drupal 11.
- Database.
- File storage.
- Backups.
- HTTPS.
- Simple deploy runbook.
