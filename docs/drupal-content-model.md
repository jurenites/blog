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

Purpose: personal blog posts, long-form analysis, and saved YouTube references.

Suggested fields:

- Title
- Slug
- Teaser
- YouTube video: one direct YouTube URL. The YouTube Field module extracts the
  video ID and renders a responsive player with YouTube's video thumbnail. The
  Article stores the creator name, creator link, original source date, and an
  optional channel-avatar URL as editable credit metadata. Empty credit fields
  are filled from the linked YouTube source when the Article is saved; changing
  the video URL refreshes them for the new source. The Article Authored on
  calendar date follows the YouTube publication date while retaining its
  existing time of day; any time component in the source timestamp is ignored.
  When an Article with a YouTube video has no Hero image, Drupal downloads YouTube's
  1280×720 thumbnail into that Image field on save and uses the oEmbed image as
  a lower-resolution fallback. Editors can then replace or manipulate it like
  any other Article image; an existing Image is never overwritten
  automatically. On the full Article, an animated no-signal layer occupies the
  responsive player figure until its iframe loads; the layer inherits the
  formatter's rendered size and aspect ratio. The Videos list presents this
  media when the Article also
  has a YouTube video, and serves responsive 325px, 650px, or source-width WebP
  candidates with the progressive blurry-placeholder treatment. The candidate
  sizing follows the editorial list's 641px switch between horizontal and
  stacked
  layouts.
- Body
- Content time (minutes): one editable whole-minute value. Personal Articles
  default to 5 minutes. YouTube reference Articles replace the default with the
  source video duration when the URL changes, truncating seconds and retaining
  total minutes for videos longer than one hour.
- Hero image
- Tags: an unlimited Tagify input that suggests existing Tags terms and creates
  new terms from editor-entered text.
- Topics
- Related projects
- Publish state
- Promoted to front page: disabled by default for new Articles. Editors can
  still enable it explicitly, and existing Articles retain their current value.

Article has two editorial presentations without requiring another content type:

- A personal Article has no YouTube URL. Its Author Byline presents the Drupal
  owner, Article publication date, the stored `N min to read` value, and Tags. When
  an editor attaches an Image, that image appears in both the Blog list preview
  and the full Article detail view.
- A YouTube reference Article has a YouTube URL. The public list and detail page
  credit the stored video creator and original YouTube publication date instead
  of presenting the Drupal owner as the writer. Drupal still retains the node
  owner normally for editing, revisions, and accountability. On the detail page,
  the iframe replaces the static Image and the video-credit Author Byline sits
  below the iframe and video title. Both the Videos preview and detail credit
  show
  the stored duration as `N min to watch`. The stored source date is presented
  as elapsed calendar time, such as `4 months and 9 days`, and refreshes as time
  passes instead of remaining an absolute date.

The public Views queries keep these presentations separate. `/blog` lists
published Articles whose YouTube field is empty; `/videos` lists published
Articles whose YouTube field is populated. Both pages retain the same tag
filtering and editorial list-item presentation. Article Back and Tag links
return to the listing appropriate to the Article kind.

The creator name, link, publication date, and channel avatar URL are treated as
managed metadata and hidden from non-administrator Article forms, together with
the derived YouTube video ID. Administrators can still inspect or override the
stored metadata. Automatic source collection fills empty creator, date, and
duration values, while replacing the YouTube URL clears the old credit and
collects the new source. Each save also keeps the Authored on calendar date
aligned with the stored YouTube publication date. The shared Avatar falls back
to channel initials when its stored URL is empty or invalid.

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
