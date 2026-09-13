# Drupal Content Model

Keep the first content model universal. Do not overfit each project into many custom fields before the writing style is clear.

Rule: create fields only when Drupal needs to sort, filter, reference, render, or query the value. If the value is mostly storytelling, keep it in `Body`.

## Editable page copy and contextual menus

Public editorial paragraphs belong to Drupal content, including copy around
Views listings. Twig retains structure, short labels and technical interface
messages (loading/error announcements, accessible control descriptions and font
metadata states). Translation strings are not a substitute for editable content.

`jurenites_editorial` provides a **Page copy** Content Block type with a formatted
Body, Language, Published control, translations and revision history. The initial
migration creates six blocks: Guidelines introduction and empty message, Videos
introduction and empty message, Blog empty message, and Portfolio empty message.
Find these under **Content → Blocks** (`/admin/content/block`). Hover the pencil
beside a visible introduction to open **Edit**, **Translate**, or **Delete content
block**. Editing Body updates the listing without a template change or build.
Unpublish to hide copy reversibly; Delete opens Drupal's normal confirmation.
Empty-message blocks are always accessible through Content → Blocks even when
the listing has results and their public pencils are consequently absent.

In **Structure → Views**, the **Editable content block** area embeds one of
these records in Header, Footer or No results behavior, using its UUID. The
Guidelines and Videos introductions are headers above the listing rows. Each
area renders the standard block wrapper and contextual links, checks entity
access, selects the content translation and carries entity, language and
permission cache metadata. A missing/deleted block renders no broken placeholder.
Page copy can also be placed through the native Block layout like other reusable
Content Blocks. Do not place the same introduction both there and in Views.

Skills profile no longer has Section heading (`field_skills_heading`) or
Introduction (`field_skills_intro`) fields. The skills module post-update deletes
the fields and purges their stored values and revisions; fresh installation does
not recreate them. The fixed “Web development” eyebrow is also removed from the
Drupal and Storybook templates. Technology cards and rating notes remain.

The Skills profile footer retains supporting experience copy. Its rating-scale
details and project-history link are removed in Drupal and Storybook; the
`field_skills_scale` field and its stored values are retained but no longer rendered.

Skills profile owns **Rating scale explanation** and **Draft ratings note** in
its existing Content Block form. Pixel Glyph Editor Paragraphs own an
**Instructions** field, edited inside their parent Project's Content sections.
These fields are translatable; the existing Russian pixel instructions are
preserved. Nested Hero, Timeline, Skills and other Paragraph records continue to
be edited, reordered or removed through their owning node or block form.

`jurenites_admin` shows one native pencil for the innermost hovered or
keyboard-focused content region for accounts with **Access contextual links**
(including the Administrator role). Ancestor and neighboring pencils stay hidden.
Hovering the pencil opens the menu; click, touch, keyboard activation and Escape remain native Drupal
interactions. Drupal checks access separately for each action. No permissions
are granted to visitors or ordinary authenticated accounts. Menus use transparent items on a dark surface; only the hovered or keyboard-focused
item becomes white. They can extend beyond Portfolio/Guideline cards.

The September 12 audit covered all 60 custom-theme templates and seven custom
module templates. Article, News, Guideline, Project, Timeline and Basic Page copy
is already node/field content; Hero, Interests, Numeric values, Skills, Contact
photo and Cookie notice are existing block/Paragraph content. The migration
removes the remaining visible editorial paragraphs in Videos, Skills and the
pixel editor, and moves literal listing text from Views configuration to content.
It restores contextual wrappers/suffixes on Article teasers, Project cards and
details, Guideline tiles, Interests, navigation and branding. Shared Storybook
stories and markup remain unchanged; new wrapper styling is imported only by the
Drupal `theme.scss` entrypoint.

Existing sites receive this migration with `drush updatedb` through
`jurenites_admin_post_update_enable_editorial_content`. A fresh configured site
can enable `jurenites_editorial` directly. Back up the database before updates.
Setup preserves existing listing copy and configuration-language overrides,
creates missing fields and records, and sets a completion marker. It does not
reset subsequent CMS edits or recreate deliberately deleted content on reruns.
Starter copy belongs only in installation/migration code. Do not use theme
fallback paragraphs that make a cleared CMS field reappear.

The local integration check is:

```bash
docker exec blog_jurenites_web vendor/bin/drush php:script scripts/verify-editorial-content.php
```

It uses temporary records in a rolled-back transaction to check revisions,
translations, cache invalidation, anonymous/admin access, deletion and migration
idempotence. Run it on DEV. Deployment still requires applying database updates
and rebuilding Drupal cache in each target environment.

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

## Home introduction

The first homepage section is the **Home introduction** reusable Content Block,
provided by `jurenites_home_intro`. It pairs “Personal Blog” with the soft-gray
“& Showcase projects” segment and introductory copy about articles, YouTube
finds, personal thoughts and interface reviews. A quiet divider and decorative
pixel cross connect it to the site's visual language.

Edit it under **Content → Blocks → Home introduction**, or use its contextual
pencil. Title 1, the existing compound Two-tone heading field and formatted Body
are translatable and revisioned. English and Russian starter copy is seeded
once; subsequent edits, unpublishing, deletion and placement changes survive
setup reruns. The shared heading renders as the homepage's `h1`. Native Block
layout places it at weight `-40`, visible only on `<front>` in either language,
before the existing homepage sections.

Styles live in `_home-introduction.scss`, shared with **Organisms/Home
Introduction** in Storybook. At mobile widths the heading reduces in size and
the description sits beside the pixel accent. No animation or new images are
required. Build the theme, enable `jurenites_home_intro`, then clear Drupal cache
on each target environment:

```sh
npm run build:theme
docker exec blog_jurenites_web vendor/bin/drush en jurenites_home_intro -y
docker exec blog_jurenites_web vendor/bin/drush cr
```

## Hero section

The About page uses the reusable `hero` Content Block with an editable background
image and reorderable `hero_slide` Paragraphs. English and Russian content,
button labels and destinations are authored in the translated block; placement
and page visibility are managed through Block layout. The block is withheld from
both language homepages. See [Hero section](hero-section.md) for editing and setup.

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

### Deferred Timeline Ideas

- Explore slider bookmarks for navigating the CV timeline.
- Explore company or project logos on timeline records.

These are future ideas; the current chronology, duration-button navigation,
and linked organization headings remain the delivered behavior.

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

The Portfolio listing ends with a separate **Website audit** Content Block,
placed in the Content region after the gallery on `/portfolio`, including tag
filters. `jurenites_website_audit` seeds the supplied report checklist and free
new-client offer. Body and Offer are formatted, translatable content; Turnaround
stores the number of business days (initially 3), and Order button owns its label
and internal link (initially `/contact`). Edit **Portfolio website audit** under
Content → Blocks or through its contextual pencil. The block supports revisions,
translation, unpublishing and deletion; setup never restores removed content or
resets edits. No new taxonomy terms are created.

The shared `Organisms/Website Audit` Storybook example uses the same SCSS and
primary Button atom. Desktop shows report details beside the offer; at the shared mobile breakpoint (640px and below)
these stack. The surface is almost black, without an outer outline or internal
divider. The semantic `time` element carries a day duration; visible copy
qualifies this as business days rather than an exact calendar deadline.

Install on each environment after deploying and building the theme:

```bash
docker exec blog_jurenites_web vendor/bin/drush en jurenites_website_audit -y
docker exec blog_jurenites_web vendor/bin/drush cr
```

The commands above target local DEV; use that environment's Drush invocation on
STAGE/PROD. The install creates only the new block type, fields, content and
Portfolio placement.

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
- Numeric values: existing editable statistic tiles, also used for case-study
  outcomes.

The Oksenate case study lives at `/portfolio/oksenate`. It uses the existing
Project Image for the user-supplied homepage hero screenshot dated 11 September
2026 (preserved without cropping), an authored
introduction, Numeric Values, and six editable Project story paragraphs. The
Lighthouse graphic reports the engagement notes' accessibility result of
91 to 98 at release, not a current audit or a complete compliance claim. The
notes' WAVE 7.4/9.9 figure is omitted because its scoring basis is unclear.
The story preserves subcontractor attribution and distinguishes rehearsal time
from the reported production upgrade window. Supporting implementation history
in the Oksenate checkout includes the Drupal 11 upgrade, Slick compatibility,
video sharing, table spacing and mobile-control fixes.

Editors can use the optional **Comparison images** field on Project to select
two Image media items, Before first and After second. Use aligned screenshots
and meaningful image alt text. The existing accessible image-comparison
formatter appears below the narrative only when both items are selected; no
placeholder or incomplete slider is shown. The field starts empty on Oksenate.

To create this content in another environment after the existing font-project,
numeric-values and image-comparison recipes have been applied, run
`drush php:script scripts/create-oksenate-project.php` from the repository root.
The script adds the existing numeric paragraph choice and optional comparison
field without replacing other Project controls, then creates the node using a
stable UUID. Rerunning it preserves existing editorial content. Initial copy
lives in `scripts/content/oksenate.json`; subsequent edits belong in Drupal.
Rebuild the token-derived graphic with `node scripts/build-oksenate-graphic.mjs`
after `npm run build:tokens`, then run `npm run build:theme` to copy the image
assets into the theme. The matching Storybook example is
`Molecules/Audit Comparison`. Content was prepared and checked locally; this
does not deploy the new page to PROD.

SMEP's first personal-project article lives at `/portfolio/smep`, authored by
the `alexander` account. It introduces the incremental-game concept, the August
2019 start, Spaceplan and Cookie Clicker as personal genre references, and the
intention to return to development with more spare time and modern tools.
Six editable Project story sections include the original Google Doc and Figma
file as external links under Project files. The document stays linked in its
original form; no exported attachment or new field is required. Proposed
mechanics remain described as design intentions rather than shipped features.
Run `drush php:script scripts/create-smep-project.php` after the existing
font-project recipe to create the article from `scripts/content/smep.json`.
Reruns preserve the existing node and its editorial changes. Initial creation
and verification are local; production publishing is a separate operation.

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
`web/themes/custom/jurenites_theme/logo.svg` brand asset. The Color
specimen reads the generated token records derived from
`src/token/tokens.yaml`, then presents foundation, brand, and system palette
values through their generated CSS utility classes. Editors can revise the
guidance without forking those visual sources. The initial aliases are
`/guidelines/logo-icon` and `/guidelines/color`.

## Article

Purpose: personal blog posts, long-form analysis, and saved YouTube references.

Full Article pages generate a **Table of contents** from the rendered Body's
nonempty H2 and H3 headings when there are at least two. Editors use native
Heading 2 / Heading 3 in Body; no separate list or contributed module is needed.
H3 links nest under their preceding H2. The contents sits in a sticky right
sidebar outside the full 800px Body column, with the current section marked
while scrolling. The `article_table-of-content` sidebar narrows from 320px to
160px as needed. When the available content frame is below 992px (including
space used by Drupal's admin sidebar), it moves above Body instead of squeezing
the reading column. Native fragment links support keyboard navigation,
browser history and sharing; existing heading IDs are retained, and missing IDs
are generated from heading text with collision suffixes (including Cyrillic).
Changing a heading without an authored ID also changes its generated fragment.
Comments, supporting fields and other page headings are excluded. Without
JavaScript or with fewer than two headings, Body keeps its readable single-column
layout. Smooth scrolling respects reduced-motion preferences. The theme and the
Article Table of Contents Storybook example share the same behavior and SCSS.

The [Conway's Game of Life Article](game-of-life.md) combines editable long-form
copy with a node-scoped live experiment, local diagrams, and native Remote video
Media in the optional Supporting videos field. Those supporting films do not
change the Article's Blog/Video listing classification.

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
- Comments: native comments are attached to the shared Article node but record
  the content language used when they are posted. English and Russian Article
  translations render separate language-matched discussions.
  The comment pencil menu offers **Edit comment** and **Delete**. Content editors
  can delete their own Article comments through the `delete own article comments`
  permission; comment administrators retain Drupal's broader access. Delete opens
  the native confirmation form and permanently removes the comment and its
  replies, then returns to the Article. Anonymous visitors and other comment
  authors do not gain deletion access.

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

The shared site-branding block renders interactive “AI” initials that reveal
“Alexander Ilivanov” and link to Home. It uses the same text branding on LEGO
and other pages, without a header logo image. The favicon is retained, and the
existing enhanced mobile navigation continues to hide the brand.

The previous LEGO artwork remains available at
`src/public/assets/images/jurenites-lego-logo-square-v2.png`. It is an AI-assisted
color edit of Alexander Ilivanov's physical build. Image-edit provenance and the
exact prompt remain in `output/imagegen/lego-logo-edit.txt`.

Article add and edit forms keep the YouTube video URL visible. The derived
YouTube video ID, creator name, creator URL, and publication date appear in a
native **YouTube metadata** section that starts collapsed. Article editors can
expand it to inspect the ID or edit the credit fields. Field submission paths
remain unchanged. The channel avatar URL is also inside this collapsed section
and remains administrator-only.
The grouping runs for both the default Article form and the separate
`node_article_edit_form` used by `/node/{node}/edit`.
Automatic source collection fills empty creator, date, and
duration values, while replacing the YouTube URL clears the old credit and
collects the new source. Each save also keeps the Authored on calendar date
aligned with the stored YouTube publication date. The shared Avatar falls back
to channel initials when its stored URL is empty or invalid.

### Deferred Editorial Work

Develop UI reviews of games, HUDs, and other interfaces through the existing
Article model. The translation catalogue already contains a “Reviewing an
Interfaces” article stub; expand that material before deciding whether a
dedicated review page is needed. Reuse existing taxonomy tags when applicable.

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

## Browser applications

[QR Pixel Studio](qr-pixel-studio.md) is provided by `jurenites_qr_studio` at `/qr-studio`. It is a browser-local tool with a dedicated application document and Drupal library attachments, rather than editorial content stored in a node or paragraph.
