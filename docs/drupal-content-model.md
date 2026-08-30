# Drupal Content Model

Keep the first content model universal. Do not overfit each project into many custom fields before the writing style is clear.

Rule: create fields only when Drupal needs to sort, filter, reference, render, or query the value. If the value is mostly storytelling, keep it in `Body`.

## Basic Page

Purpose: stable site pages such as About and Contact.

The native Title remains the canonical page title and the first strong segment
of the Two-tone Heading component. One compound `field_two_tone_heading` field
stores these optional, translatable properties:

- Title 2 (`soft_text`)
- Title 3 (`trailing_text`)
- Title 2 placement (`inline` or `new-line`)
- Title 3 placement (`inline` or `new-line`)

The field uses typed database columns rather than serialized JSON. This keeps
Drupal validation, translation, revisions, and future migrations available
without creating one field definition and field table per component control.
The public Basic page title is always rendered as `h1`; heading level belongs to
the rendering context, not to author-entered content.

Basic pages and Articles can add a Numeric Values Paragraph through Content
sections. The section contains repeatable Numeric Value tiles with:

- Number: short display text such as `80+`.
- Description: subtitle text such as `Projects I’ve worked on`.
- Start year: optional numeric source for an automatically calculated elapsed
  year value; when present, it takes precedence over Number.

The current professional-experience example uses `2010`, so its Number renders
`16` during 2026 and updates automatically in later calendar years.

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
- YouTube video: one direct YouTube URL. The YouTube Field module extracts the
  video ID and renders a responsive player with YouTube's video thumbnail. The
  public Article presentation uses cached oEmbed data for the video title,
  linked channel/author name, and provider.
- Body
- Hero image
- Tags: an unlimited Tagify input that suggests existing Tags terms and creates
  new terms from editor-entered text.
- Topics
- Related projects
- Publish state

The full Article renders YouTube video before Body, leaving Body available for
the author’s own thoughts. YouTube Field stores only the submitted URL and
extracted video ID; it does not import the video title, channel name, or channel
avatar into Drupal fields. Cached oEmbed supplies the displayed title and
channel/author name; a channel avatar still requires a separately configured
YouTube Data API integration.

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
