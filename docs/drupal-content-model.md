# Drupal Content Model

Keep the first content model universal. Do not overfit each project into many custom fields before the writing style is clear.

Rule: create fields only when Drupal needs to sort, filter, reference, render, or query the value. If the value is mostly storytelling, keep it in `Body`.

## Basic Page

Purpose: stable site pages such as About and Contact.

The published `/cookbook` Basic Page is the editor-owned working manual for the
project. Its `basic_html` Body explains the idea, token, Storybook, Drupal,
verification, and release loop and includes explicit image and GIF placeholders.
The `jurenites_cookbook` module writes that starter Body only when the stable
node is first created; later CKEditor revisions are not reset by setup code.

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

The homepage uses a reusable Numeric values Content Block containing one to
eight nested Numeric Value Paragraph items. The block field enforces the
eight-item limit; its public grid renders no more than four items per row.
Each item contains:

- Number: required short display text such as `80+`.
- Text: subtitle text such as `Projects commercial have worked with`.
- Caption: optional gray text on its own line below Text, using caption typography.
- Caption link: optional URL and link text following the caption. Domain labels
  remain gray and underlined, with the shared yellow link hover and focus ring.
  For tracking notes, enter `*tracked with` as Caption and the domain as link text.
- Icon image: optional attached SVG file. It renders as an external image at
  its intrinsic dimensions while preserving the file's own `viewBox` and
  aspect ratio, with an 80px maximum width guard for oversized files.
- Link URL: optional internal or external destination with authored
  call-to-action text. The commercial-project tile uses `see Timeline` to link
  to `/timeline` while its number and descriptive text remain plain content.

The current professional-experience example stores `16` directly in Number.
The About page also shows three role-hour tiles, with tracking captions linking
to `redmine.org`, `atlassian.com`, and `track.toggl.com`. Caption fields are
optional and do not replace the separate call-to-action link.

Basic pages and Articles retain the Numeric Values Paragraph in Content
sections for existing authored compositions, while the homepage instance is a
Content Block so its placement is managed through Drupal's block layout.

## Hero section

The homepage also supports the reusable `hero` Content Block with an editable
background image and reorderable `hero_slide` Paragraphs. Text, button labels and
destinations are authored in the block; placement and page visibility are managed
through Block layout. See [Hero section](hero-section.md) for editing and setup.

## Timeline

Purpose: turn the commercial-project pages of the CV into one long chronology
without creating a node for every project. One published `timeline` node owns
the stable `/timeline` alias and a multi-value `field_timeline_items`
Paragraphs field.

Each `timeline_item` record contains:

- Name
- One or more Start/End date periods; the first Start date controls descending public
  order and Paragraph order breaks ties
- Optional hours worked and organization, plus the organization's official URL
- Optional short description copied or adapted from the CV
- Repeatable proof links for live work, case studies, archived pages, or public
  Dropbox PDFs
- Emphasis: standard, Featured with the official `star-outline.svg`, or Special
  place in my heart with the official `heart-outline.svg`

Hours worked remains available to editors and stored on each record, but is not
rendered on the public Timeline.

Project dates from the CV have month precision. They are stored on the first day
of their month for sorting but displayed only as month and year. A one-month
project uses the same month for its Start and End values and still renders as a
duration bar.
Every completed year's calendar rail occupies the same twelve 32px rows, with
December at the top and January at the bottom so scrolling moves backward
through time. The enhanced layout stacks calendar years with no gaps and places
descriptions in a separate flowing column. A sticky calendar viewport follows
the text's start-month anchors as the page scrolls; dense descriptions can take
more space without stretching the calendar. The current year begins with the current month and does not render
months that have not started. Duration records use an 8px-wide bar spanning
exactly the inclusive start and end months, with a small visual break between
adjacent projects; ranges continuing across a year boundary have no break.
Overlapping projects take the first free one of four
parallel lanes. If more than four ranges overlap, the shared marker uses a
45-degree yellow-and-white stripe. The year heading sticks until the next year
replaces it.

An organization appears as a large linked heading in the same left rail as the
year. It remains sticky while years, including empty years, pass below it and is
pushed away only when the next employer transition reaches the rail. It is not
repeated for every project. The rendered sequence ends at 2010.

The starter node contains the 72 commercial projects transcribed from the
current CV and no personal milestones. Every commercial project also
includes its CV description. The 81 URLs explicitly embedded in the CV are
stored as clickable proof links, including live project pages, Figma and Moqups
work, App Store listings, and historical Dropbox PDFs; projects without a
documented URL do not receive a guessed link. Each year keeps its compact 32px
month scale in a narrow left rail with up to four parallel duration tracks. The
corresponding project descriptions and links form a wider, left-aligned column
on the right; dense text groups grow so those entries stack instead of overlapping.
Hover or keyboard focus on a card or duration segment highlights every segment
of that project in full white with a small glow, and gives its cards a lighter
background. Duration buttons also jump to their corresponding period's card.
Without JavaScript the complete grouped chronology remains readable.
When a project has a CV-documented URL, its title links directly to the first
stored destination; the remaining proof links stay visible below its summary.
Later edits happen through the single Timeline node form; adding another item
creates a Paragraph revision, not a node ID. Timeline is linked from the bottom
of the footer Information menu, not from the primary navigation.

The current Paragraph editor exposes repeatable Start and End date inputs. Its
drag-and-drop mode changes item order only; it does not change dates or resolve
overlap. A visual month-grid editor would therefore be a separate admin widget,
not a capability of the installed Paragraphs date-range control.

## Project

Purpose: structured portfolio pages with reusable interactive sections.

The current `project` bundle owns Title, Body, Image, Tags, and reorderable
Content sections. `/portfolio` lists published Projects, while canonical aliases
such as `/portfolio/roundabout` remain editorial content rather than code-side
node-ID assumptions. Above the Project gallery, `/portfolio` shows every tag
used by an accessible published Project as a Chip choice. Project tag Chips and
the choices target `/portfolio?tag=<slug>`; the View validates that single GET
value through the same resolver used by Blog and filters the published Project
result set. The active Chip stays in the list with selected styling and no close
icon; activating it again clears the filter.

Roundabout and 4pixel share the existing `#Font` term. The Footer menu's Fonts
link opens that filtered Portfolio view, and its gray Badge queries the current
number of accessible published Projects carrying the term. The number is not a
stored menu value, so ordinary Project publication and tag cache invalidation
keeps it current.

The available Project sections are:

- Project story: revisionable long-form narrative.
- Font preview: a controlled `roundabout` or `4pixel` identifier which resolves
  to a theme-owned local font file and interactive browser.
- Pixel glyph editor: the blank, non-persistent 4×4 drawing experiment used by
  the 4pixel Project.

The `jurenites_font_projects` recipe creates the initial Roundabout and 4pixel
nodes and their ordered Paragraph trees with stable UUIDs. Reapplying the
recipe creates only missing UUIDs; it does not replace an editor's existing
copy or intentional changes. A later Windows screenshot can use the existing
Image field or a deliberately designed media section without changing the font
tool contract.

Future sortable values such as project dates, organizations, or visibility
levels should become fields only when a real listing or permissions requirement
needs them. Until then they remain authored story content.

## Guideline

Guideline tiles keep their body text free of underlines. Only the tile title
is underlined when the title itself is hovered.

Purpose: maintain the public visual rules and design-system examples behind the
site. `/guidelines` lists published Guideline nodes as ordered tiles; each node
has its own canonical detail page.

Guideline uses the native Title plus three deliberate values:

- Guidance: a required `basic_html` Body with a required summary. The summary
  is the overview-tile description; the Body is editor-owned detail copy.
- Guideline section: selects the project-owned Logo Icon or Color specimen.
- Overview order: a whole number used by the Guidelines View so new topics can
  be inserted without relying on creation dates or node IDs.

The Logo Icon specimen renders the same
`web/themes/custom/jurenites_theme/logo.svg` used by the site header. The Color
specimen reads the generated token records derived from
`src/token/tokens.yaml`, then presents foundation, brand, and system palette
values through their generated CSS utility classes. Editors can revise the
guidance without forking those visual sources. The initial aliases are
`/guidelines/logo-icon` and `/guidelines/color`.

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
Articles whose YouTube field is populated. Both pages retain tag filtering.
Videos uses a wide grid with three columns on desktop, two on tablets, and one
on phones. Each tile keeps its thumbnail above the title, description, and
creator details, reusing the Article Blog List Item markup. The grid preserves
the existing Views ordering (newest first). As the visitor approaches the end,
the theme fetches the native next-page URL and appends its cards, retaining tag
filters and reattaching thumbnail, avatar, and tooltip behaviors. Only one page
loads at a time; the final page stops loading and announces completion. Native
pagination remains the server-rendered fallback when JavaScript or intersection
observation is unavailable, or when a request fails or times out after 15 seconds.
The fallback advances with each appended page so its Next link continues from
the last loaded batch. Direct paginated URLs still work. An introductory note
explains that these are personally recommended videos for learning, including
topics not covered elsewhere on the site. Blog keeps its editorial list layout.
Article Back and Tag links
return to the listing appropriate to the Article kind.

The shared Tags term `#lego` is available for personal builds in `/blog` and
videos in `/videos`; their filter URLs are `/blog?tag=lego` and
`/videos?tag=lego`. The Blog install helper and
`jurenites_blog_post_update_add_lego_tag()` ensure one canonical term without
assigning it to existing content. Select it in the existing Article Tags field.

The shared site-branding block uses the LEGO photograph whenever the current
page selects `?tag=lego`, displays the LEGO taxonomy term, or is a canonical
content page with that tag in `field_tags`. Unfiltered and other-tag pages keep
the configured logo; there is no persistent browser preference. Branding cache
metadata varies by route, tag query, and permissions, and invalidates when
taxonomy terms or the current content change. The existing mobile navigation
continues to hide the brand when its enhanced menu is active.

The image source is `src/public/assets/images/jurenites-lego-logo-square-v2.png`, copied
to the theme by `npm run build:theme`. It is an AI-assisted color edit of
Alexander Ilivanov's physical build, with a near-white baseplate and dark navy
bricks. Image-edit provenance and the exact prompt are in
`output/imagegen/lego-logo-edit.txt`. The Site Header `lego_tag` Storybook example
uses the same asset and SCSS modifier. Both header logos are 48 × 48px,
with sizing in SCSS. The LEGO image preserves the original square framing
and uses `object-fit: contain` so the full photograph remains visible.

The creator name, link, publication date, and channel avatar URL are treated as
managed metadata and hidden from non-administrator Article forms, together with
the derived YouTube video ID. Administrators can still inspect or override the
stored metadata. Automatic source collection fills empty creator, date, and
duration values, while replacing the YouTube URL clears the old credit and
collects the new source. Each save also keeps the Authored on calendar date
aligned with the stored YouTube publication date. The shared Avatar falls back
to channel initials when its stored URL is empty or invalid.

## News

The `news` bundle stores manually curated external links with an editorial
title, required Source URL, optional Tags, and managed source name, source
publication time, and thumbnail. The `jurenites_news` recipe owns its fields,
displays, and homepage View; `jurenites_blog` collects source metadata, reusing
the YouTube workflow for videos and page metadata for other web sources.
Changing the URL triggers a metadata refresh, while failed lookups preserve
existing values. Administrators can correct managed values.

The recipe's homepage-only News block shows up to three published records,
ordered by source publication time, newest first. Its News List Item thumbnail
and title link to the original external URL. The recipe adds no News listing
page or main-menu item.

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

The commercial Timeline calendar starts at August 2010; its 2010 section shows August through December in both Drupal and Storybook.
