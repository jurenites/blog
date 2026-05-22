# Drupal Content Model

Keep the first content model universal. Do not overfit each project into many custom fields before the writing style is clear.

Rule: create fields only when Drupal needs to sort, filter, reference, render, or query the value. If the value is mostly storytelling, keep it in `Body`.

## Timeline Event

Purpose: turn the CV into an interactive timeline with bookmarks. A timeline event can describe a job, project phase, release, skill shift, or important professional moment.

Suggested fields:

- Title
- Slug
- Start date
- End date
- Body
- Company / organization reference
- Project reference
- Role / occupation
- Icon or logo media
- Weight
- Visibility: public, anonymized, private

Everything else can start in `Body`: contribution, what happened, what I learned, screenshots, context, criticism, or story details. This keeps each timeline event flexible.

## Project

Purpose: portfolio pages for public or anonymized projects.

Suggested fields:

- Title
- Slug
- Body
- Project date or date range
- Company / organization reference
- Project URL
- Hero media
- Visibility: public, anonymized, private
- Tags

## Article

Purpose: blog posts and long-form analysis.

Suggested fields:

- Title
- Slug
- Teaser
- Body
- Hero image
- Topics
- Related projects
- Publish state

## Gallery Item

Purpose: visual inspiration, GIF/image/code recreation entries.

Suggested fields:

- Title
- Body
- Media
- Source URL
- Source author
- Code recreation URL
- Tags

## External Link

Purpose: designers, videos, tweets/posts, tools, and links that shape the project.

Suggested fields:

- Title
- URL
- Body
- Source/account
- Platform
- Topics

## Taxonomies

Start with a small set:

- Topic
- Technology
- Role
- Visibility

Add more only when content entry becomes painful without them.
