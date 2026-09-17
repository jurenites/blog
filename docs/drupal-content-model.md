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

Content → Blocks → Edit changes the reusable content and its translations.
Placement parameters (region, weight, title display and page visibility) belong
to **Structure → Block layout → Configure** for the placed instance. Use
`<front>` in **Visibility → Pages → Show for the listed pages** for the home page
in both languages; `/home` is just a literal path. Use the content block's
**Translate** tab to add or edit Russian copy, including translated button text.
The project invitation placement is `jurenites_theme_call_to_action`; its
content retains the administrative name **About project invitation**.

Skills profile no longer has Section heading (`field_skills_heading`) or
Introduction (`field_skills_intro`) fields. The skills module post-update deletes
the fields and purges their stored values and revisions; fresh installation does
not recreate them. The fixed “Web development” eyebrow is also removed from the
Drupal and Storybook templates. Technology cards and rating notes remain.

Technology skill Paragraphs no longer have the CV experience field
(`field_skill_evidence`). The skills module's `remove_skill_evidence` post-update
deletes its storage and purges values from every translation and revision.
Run `drush updatedb` and `drush cr` on existing sites. Installation, starter data,
translation imports, Drupal rendering and Storybook no longer include it.

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

## Clean URLs and redirects

`jurenites_path_aliases` uses Pathauto to generate aliases and Redirect to enforce
them with permanent **301** redirects. For example, `/node/4` redirects to
`/about`, and `/ru/node/4` redirects to `/ru/obo`. Already-clean URLs render
directly. Query strings are preserved; administrative routes and non-GET/HEAD
requests are excluded. Redirect also records redirects when an existing alias
changes, keeping the previous public URL usable.

Configure this under **Configuration → Search and metadata → URL redirects →
Settings** (`/admin/config/search/redirect/settings`). **Enforce clean and
canonical URLs** and **Automatically create redirects when URL aliases are
changed** are enabled. **Ignore redirections on admin paths** is enabled.
Existing aliases and content are preserved; enabling this does not reconstruct
aliases deleted before Redirect was installed.

Fresh installations receive the configuration from the path-alias module's
install hook. On existing environments, deploy the Composer files and custom
module changes, run `composer install`, then `drush updatedb` and `drush cr`.
The `jurenites_path_aliases_post_update_enable_clean_url_redirects` update enables
Redirect and applies these settings. Local enablement does not deploy to PROD.

Verify the local HTTP behavior with:

```bash
docker exec blog_jurenites_web vendor/bin/drush php:script tests/clean-url-redirects.php
```

This checks English/Russian redirects, GET/HEAD requests, query preservation,
already-clean pages, homepages, login, edit access and POST behavior.

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
finds, personal thoughts and interface reviews. A quiet divider separates the
heading from the full-width, left-aligned introductory copy.

Edit it under **Content → Blocks → Home introduction**, or use its contextual
pencil. Title 1, the existing compound Two-tone heading field and formatted Body
are translatable and revisioned. English and Russian starter copy is seeded
once; subsequent edits, unpublishing, deletion and placement changes survive
setup reruns. The shared heading renders as the homepage's `h1`. Native Block
layout places it at weight `-40`, visible only on `<front>` in either language,
before the existing homepage sections.

Styles live in `_home-introduction.scss`, shared with **Organisms/Home
Introduction** in Storybook. At mobile widths the heading reduces in size while
the description remains left-aligned. Build the theme, enable
`jurenites_home_intro`, then clear Drupal cache
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
- Separate repeatable Product websites, App stores and Sources link fields;
  sources include case studies, archived pages, design files and public Dropbox PDFs
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
includes its CV description. The 81 URLs explicitly embedded in the CV and two supplied Scatch store links are
stored in separate website, store and source fields, including live project pages,
Figma and Moqups work, App Store listings, and historical Dropbox PDFs; projects without a
documented URL do not receive a guessed link. Each year keeps its compact 32px
month scale in a narrow left rail with up to four parallel duration tracks. The
corresponding project descriptions and links form a wider, left-aligned column
on the right; dense text groups grow so those entries stack instead of overlapping.
Hover or keyboard focus on a card or duration segment highlights every segment
of that project in full white with a small glow, and gives its cards a lighter
background. Each project has one description card, placed at the first authored
period's start, with every time frame listed together. Additional periods retain
their calendar bars without repeating the project heading or description.
Every duration button focuses that project's single card.
Without JavaScript the complete grouped chronology remains readable.
Project titles are plain text. Product websites display their actual hostname
without a protocol or path while retaining the full destination URL. Website
links use the Link typography role and the existing brand-primary cyan token;
hover and keyboard focus darken that cyan by mixing in 30% palette full-black.
The shared external-link icon appears on hover or keyboard focus, with its space
reserved to prevent layout shifts. The link row stays at 24px with no gap
between text and icon; the SVG has a 1px downward optical adjustment that does
not change the row height. These styles apply only to product websites.
App stores
appear as separate named links (Google Play, App Store, or another authored store).
Evidence stays in a separate link row with an accessible Sources label and no
visible heading; a wireframe, PDF, third-party profile or reference article never
becomes a product website by its position.
These links do not claim a current reachability check. Existing sites run
`jurenites_timeline_post_update_separate_product_links` through `drush updatedb`.
It moves only reviewed, exact product URLs from Sources, adds the supplied Scatch
store links, and preserves descriptions, translations, unrelated source links
and old revisions. Re-running does not duplicate links or create content revisions.
Later edits happen through the single Timeline node form; adding another item
creates a Paragraph revision, not a node ID. Timeline is linked from the bottom
of the footer Information menu, not from the primary navigation.

Gin Paragraphs subforms use zero bottom margin on `.form-item`, supplied by
`jurenites_admin/css/gin-branding.css` so contributed theme files stay intact.

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

The Portfolio gallery displays two Project cards per row, dropping to one on
mobile. Each card keeps its 16:9 thumbnail with the title and tag chips inline
beneath it; metadata wraps when the available width requires it.

The current `project` bundle owns Title, Body, Image, Tags, and reorderable
Content sections. `/portfolio` lists published Projects, while canonical aliases
such as `/portfolio/roundabout` remain editorial content rather than code-side
node-ID assumptions. Above the Project gallery, `/portfolio` shows every tag
used by an accessible published Project as a Chip choice. Project tag Chips and
the choices target `/portfolio?tag=<slug>`; the View validates that single GET
value through the same resolver used by Blog and filters the published Project
result set. The active Chip stays in the list with selected styling and no close
icon; activating it again clears the filter.

Immediately after the Portfolio View, a separate Basic block says “Want to see
more ? checkout the Timeline”, with **Timeline** linking to `/timeline`. The
**Portfolio Timeline cross-link** block is editable under Content → Blocks and
includes Russian copy linking to `/ru/timeline`. Its Content-region placement
uses weight 10 and `/portfolio` visibility, including filtered listings, before
the Website audit placement. Existing sites receive it through
`jurenites_font_projects_post_update_portfolio_timeline_cross_link` with
`drush updatedb` and `drush cr`; new installations seed it automatically. Setup
runs once, preserving later editorial changes, unpublishing and deletion.

Project add/edit forms also have optional **Supporting videos**, using the same
Remote video Media Library workflow as Article. Choose **Add media**, add a
**Remote video** by pasting its YouTube URL (or select an existing video), then
save the Project. Multiple videos can be reordered or removed. They appear
below the project narrative, sections and comparison images, before Tags;
Portfolio cards keep their existing image and summary. The field is translatable
and shares Article's `field_supporting_videos` storage. Project embeds use the
`project_video` Media view mode with responsive sizing in component SCSS. Each
video reuses the shared Video loader: animated noise and a progress bar fade
away when the iframe loads. The iframe stays in normal flow so logged-in Media
editing wrappers preserve its height; reduced motion uses the shared static
noise and instant reveal behavior.
Deploy with `drush updatedb -y` and `drush cr`; the
`jurenites_font_projects_post_update_project_supporting_videos()` update adds
only the new field/display settings and preserves existing Project controls.
Verify on DEV with `drush php:script tests/project-supporting-videos.php`; its
temporary Project is rolled back after form, save and render checks.

The Portfolio listing ends with a separate **Website audit** Content Block,
placed in the Content region after the gallery on `/portfolio`, including tag
filters. `jurenites_website_audit` seeds the supplied report checklist and free
new-client offer. Body and Offer are formatted, translatable content; Turnaround
stores the number of business days (initially 3), and Order button owns its label
and internal link (initially `/contact`). Edit **Portfolio website audit** under
Content → Blocks or through its contextual pencil. The block supports revisions,
translation, unpublishing and deletion; setup never restores removed content or
resets edits. No new taxonomy terms are created.

Update `jurenites_website_audit_update_11001()` restores the missing placement
of the existing audit block at Content weight 90, after the Portfolio timeline
at weight 10. Apply with `drush updatedb -y` and `drush cr`. It preserves the
saved content, translations, revisions and publication status, and skips sites
where the content block itself was deleted.

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

The Footer menu owns all column headings and links, with optional presentation
fields and a Portfolio counter Tag reference. See [Footer menu editing](footer-menu.md).
Roundabout and 4pixel share the existing `#Font` term. The Footer menu's Fonts
link selects that term, opens its filtered Portfolio view, and its gray Badge queries the current
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

SMEP includes an editable **Screen slider** Paragraph from `jurenites_screen_slider`.
Enable the module, then run `drush php:script scripts/add-smep-screen-slider.php`
to insert the 42 bundled exports before the existing story sections. The script
creates a node revision and preserves existing sections; reruns preserve the gallery.
Editors can add or replace images in the Screens image field. Display order uses
natural filename sorting. The six 376px exports are cropped into the requested
375 × 667px source frame, displayed at half size: 187.5 × 333.5px. Source
files remain unchanged. The gallery extends to both browser edges, while article text and pagination
retain the centered 960px content frame. Screens clip only at the browser edges;
loop duplicates adapt to the viewport width, including after resizing.
It moves continuously at eight seconds per screen and loops across the end.
Dragging, arrow keys, Previous/Next and Pause/Play provide manual control.
Previous/Next reuse the shared `arrow-left` SVG icon at 0° and 180° respectively.
The playback toggle reuses Game of Life’s `pause-rect` and `play-triangle` icons,
with its accessible label and visible icon following the paused state. Motion
pauses on hover, focus, hidden tabs and offscreen; reduced motion starts paused.
More than ten screens use a nine-marker moving window of Crossfade Dot atoms,
with the editor-adjusted rectangular markers tapering into smaller square edge
markers and a numeric page counter. All pagination markers have square corners.
The initial marker animation uses 200ms size transitions, pending further visual
direction. Storybook `Organisms/Screen Slider` shares the behavior and stylesheet.

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

## Article and Video

**Article** (`article`) owns written posts at `/blog`. **Video** (`video`) owns
YouTube recommendations at `/videos`. Choose **Content → Add content → Article**
or **Video**; a Video requires its primary YouTube URL. Articles have no primary
YouTube or creator-metadata fields. Supporting films within an Article remain
optional and do not change its type. Both types retain Body, Content sections,
images, shared Tags, content time, translations, revisions and comments.

Article add/edit forms show the optional Body **Summary** with the existing
**Basic HTML** CKEditor toolbar. `jurenites_admin` keeps it visible even when
empty and converts the submitted formatted widget back to Drupal's native
summary string. The summary still shares the Body's stored text format; no
field or content migration is needed. An empty summary retains Drupal's trimmed
Body fallback. Video and other content forms keep their existing widgets.
Deploy the module change and rebuild Drupal cache to activate it.

Purpose: personal blog posts, long-form analysis, and saved YouTube references.

Full Article pages generate a **Table of contents** from the rendered Body's
nonempty H2 and H3 headings when there are at least two. Editors use native
Heading 2 / Heading 3 in Body; no separate list or contributed module is needed.
H3 links nest under their preceding H2. The contents sits in a sticky right
sidebar outside the full 800px Body column, with the current section marked
while scrolling. Equal left and right grid tracks keep Body centered in the page;
the right track contains the contents in normal flow, without overlapping Body.
The title, media and supporting content align with the centered Body column.
Article navigation breadcrumbs also keep the centered Body width, including
when they render in a separate Drupal block outside the Article element.
The `article_table-of-content` sidebar narrows from 320px to
160px as needed. When the available content frame is below 1184px (including
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
change the Article's Blog/Video listing classification. Supporting videos on all
Article and Video detail pages share the primary Video player's Media Loader:
a full-width 16:9 embed, animated TV-noise background and progress bar until the
iframe loads, followed by the existing reveal transition. Reduced motion keeps
the noise static and removes the transition. Remote-video iframe dimensions
come from theme SCSS rather than HTML width/height attributes. Keep supporting
iframes in normal flow so Drupal's logged-in contextual editing wrappers retain
their height after the loading noise is removed.

YouTube Remote video Media render directly from their saved URL using
`https://www.youtube.com/embed/VIDEO_ID`. The Blog module extends the existing
`oembed` formatter and Media source definitions: the player and the provider-name
template suggestion require no external request. Other providers retain core
oEmbed behavior. Watch, short-link, Shorts, live, and embed URLs are supported;
valid `t`/`start` timestamps become the player's `start` parameter. Iframes keep
their stored Media title, lazy loading, fullscreen support, and CSS dimensions.
The Video theme also uses only the saved node title and creator credits during
rendering, including teasers and `/videos`; missing credits do not trigger a
remote lookup. These direct URLs follow the
[YouTube iframe format](https://developers.google.com/youtube/player_parameters).

Deploy these PHP changes and rebuild Drupal caches (`drush cr`); no content or
display-configuration migration is needed. This removes the production server's
YouTube dependency for page rendering, but playback still requires YouTube access
from the visitor's browser. Metadata collection on Video save and native Remote
video creation/validation still require provider connectivity. The DEV check
`drush php:script tests/youtube-direct-render.php` renders the affected Article
and Video views with outbound HTTP and YouTube oEmbed calls disabled, and checks
that other providers retain their renderer.

### Small media inside rich text

Basic HTML and Full HTML expose **Insert Media** next to the image-upload
button. Choose **Animated GIF** (GIF, up to 5 MB) or **Video** (MP4/WebM, up to
20 MB), add a file, complete its media details, and insert the selected item
at the cursor. Use H.264 MP4 for broad browser playback support. Uploads are
reusable Media records; their presence does not change an Article into a Video.

`jurenites_inline_media` configures the core Media Library, the `animated_gif`
and local `video` Media types, and the `inline_media` view mode. GIFs render
the original file without an image style or upload-time dimension limit, so
GD does not discard their animation. Videos use native playback controls,
inline playback, metadata preloading, and no autoplay. The shared
`atoms/_inline-media.scss` styles both the public theme and CKEditor preview;
normal dimensions come from CSS, with no width/height/style HTML attributes.

The existing direct image-upload button now has a 5 MB limit for all inline
images, including GIFs. Hero images and the existing Image Media type keep
their separate upload settings. Content editors can use Basic HTML, open the
media library, create these two media types and edit their own uploads.
Anonymous visitors can view published embeds but cannot upload media.

For existing installations, apply
`jurenites_admin_post_update_enable_inline_media` through `drush updatedb`,
then rebuild caches. No existing article body or uploaded file is rewritten.
Verify limits, access, editor configuration and public rendering with
`drush php:script tests/inline-media.php`. PHP and web-server request limits
must accommodate the 20 MB video limit; local PHP allows 200 MB uploads and
210 MB requests. Production limits must be checked during deployment.

Shared fields and Video-specific source metadata:

- Title
- Slug
- Teaser
- YouTube video (Video only): one required direct YouTube URL. The YouTube Field module extracts the
  video ID and renders a responsive player with YouTube's video thumbnail.
  The URL must identify a video that is not already used by another Video node,
  including unpublished content and other languages. Add/edit validation shows
  an error on the YouTube input for duplicates, including equivalent watch,
  shortened, Shorts, and embed links. Editing or translating the same node is
  allowed. The `jurenites_blog` field constraint compares case-sensitive video
  IDs; it activates after a cache rebuild and does not modify existing content.
  Regression check: `drush php:script tests/video-youtube-uniqueness.php`.
  The Video stores the creator name, creator link, original source date, and an
  optional channel-avatar URL as editable credit metadata. Empty credit fields
  are filled from the linked YouTube source when the Video is saved; changing
  the video URL refreshes them for the new source. The Video Authored on
  calendar date follows the YouTube publication date while retaining its
  existing time of day; any time component in the source timestamp is ignored.
  When an Video has no Hero image, Drupal downloads YouTube's
  1280×720 thumbnail into that Image field on save and uses the oEmbed image as
  a lower-resolution fallback. Editors can then replace or manipulate it like
  any other Article image; an existing Image is never overwritten
  automatically. On the full Video, an animated no-signal layer occupies the
  responsive player figure until its iframe loads; the layer inherits the
  formatter's rendered size and aspect ratio. The Videos list presents this
  media for Video nodes, and serves responsive 325px, 650px, or source-width WebP
  candidates with the progressive blurry-placeholder treatment. The candidate
  sizing follows the editorial list's 641px switch between horizontal and
  stacked
  layouts.
- Body
- Content time (minutes): one editable whole-minute value. Personal Articles
  default to 5 minutes. Videos replace the default with the
  source video duration when the URL changes, truncating seconds and retaining
  total minutes for videos longer than one hour.
- Hero image
- Tags: the shared Tagify input. Reuse existing Tags terms for content work.
- Topics
- Related projects
- Publish state
- Promoted to front page: disabled by default for new Articles. Editors can
  still enable it explicitly, and existing Articles retain their current value.
- Comments: native comments are attached to each Article or Video node but record
  the content language used when they are posted. English and Russian Article
  translations render separate language-matched discussions.
  The comment pencil menu offers **Edit comment** and **Delete**. Content editors
  can delete their own Article comments through the `delete own article comments`
  or `delete own video comments` permission, respectively; comment administrators retain Drupal's broader access. Delete opens
  the native confirmation form and permanently removes the comment and its
  replies, then returns to the Article. Anonymous visitors and other comment
  authors do not gain deletion access.

The two content types reuse the established editorial components:

- An Article presents written content. Its Author Byline presents the Drupal
  owner, Article publication date, the stored `N min to read` value, and Tags. When
  an editor attaches an Image, that image appears in both the Blog list preview
  and the full Article detail view.
- A Video has a required YouTube URL. The public list and detail page
  credit the stored video creator and original YouTube publication date instead
  of presenting the Drupal owner as the writer. Drupal still retains the node
  owner normally for editing, revisions, and accountability. On the detail page,
  the iframe replaces the static Image and the video-credit Author Byline sits
  below the iframe and video title. Both the Videos preview and detail credit
  show the stored duration as `N min to watch`. In the `/videos` grid, each
  record's existing Tags appear inline immediately after its title, wrapping
  when needed and linking to the corresponding Videos tag filter. The stored source date is presented
  as elapsed calendar time, such as `4 months and 9 days`, and refreshes as time
  passes instead of remaining an absolute date.

The public Views queries keep these presentations separate. `/blog` lists
published Article nodes; `/videos` lists published Video nodes. The homepage
Latest articles block also selects Article nodes only. Both pages retain tag filtering.
Videos loads 12 items initially and in each subsequent page batch. It uses a wide
grid with three columns on desktop, two on tablets, and one
on phones. Each tile keeps its thumbnail above the title and creator details,
reusing the Article Blog List Item markup. The excerpt is hidden within the
Videos grid; Blog list excerpts remain visible. The grid preserves
the existing Views ordering (newest first). As the visitor approaches the end,
the theme fetches the native next-page URL and appends its cards, retaining tag
filters and reattaching thumbnail, avatar, and tooltip behaviors. Only one page
loads at a time; the final page stops loading and announces completion. Native
pagination remains the server-rendered fallback when JavaScript or intersection
observation is unavailable, or when loading fails. Each page request allows 30
seconds for the complete response and retries an interrupted connection or
timeout once before restoring pagination. Invalid responses fall back immediately.
The fallback advances with each appended page so its Next link continues from
the last loaded batch. Direct paginated URLs still work. An introductory note
explains that these are personally recommended videos for learning, including
topics not covered elsewhere on the site. Blog keeps its editorial list layout.
Back links, Tag links and the active navigation item use the node type to
select its owning listing.

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

Video add and edit forms keep the YouTube video URL visible. The derived
YouTube video ID, creator name, creator URL, and publication date appear in a
native **YouTube metadata** section that starts collapsed. Video editors can
expand it to inspect the ID or edit the credit fields. Field submission paths
remain unchanged. The channel avatar URL is also inside this collapsed section
and remains administrator-only.
The grouping runs for both the default Video form and the separate
`node_video_edit_form` used by `/node/{node}/edit`.
Automatic source collection fills empty creator, date, duration, and channel
avatar values. Each save with a YouTube URL and an empty avatar retries the
avatar lookup, even when the other metadata is already populated. The existing
video-page request reads the video owner's avatar from YouTube's initial page
data and stores only HTTPS URLs on `yt3.googleusercontent.com` or `yt3.ggpht.com`
that fit the field. An existing avatar URL is preserved. Missing data or a failed
lookup leaves the field empty for the next save and does not prevent saving the
Video; rendering never performs this lookup.
Replacing the YouTube URL clears the old creator, date, and duration credit and
collects the new source. Each save also keeps the Authored on calendar date
aligned with the stored YouTube publication date. The shared Avatar falls back
to channel initials when its stored URL is empty or invalid.

Run `docker exec blog_jurenites_web ./vendor/bin/drush php:script
tests/article-youtube-avatar-save.php` to check avatar collection and retry
behavior with controlled HTTP responses and temporary Video saves.

YouTube collaboration videos can credit a second channel through optional
`field_youtube_coauthor_name`, `field_youtube_coauthor_url`, and
`field_youtube_coauthor_avatar` fields. They appear in the same collapsed metadata
section; both avatar URL fields remain administrator-only. The deployable
`jurenites_blog_post_update_youtube_coauthor_fields()` update adds these fields
to the original Article setup. The Video split carries all these fields and
stored credits across to Video.

On save, the video owner's embedded collaborator dialog supplies channel names,
channel IDs, and avatar URLs. The parser recognizes the `videoOwnerRenderer`
dialog structure documented in the
[public collaborator parser reference](https://github.com/Ivorisnoob/Koda/blob/main/app/src/main/java/com/ivor/ivormusic/data/YouTubeRepository.kt).
It searches only the current video's credit area, ignores recommendations, and
deduplicates channel IDs. The stored primary name or URL selects the primary
channel when possible; the first different channel becomes the optional second
credit. This presentation supports two channels. Missing fields are filled;
editorial corrections remain intact. Changing the video ID clears the previous
second-channel credit before collecting the new source.

Successful channel lookup results are cached for 24 hours per source URL, so a
confirmed single-channel video does not trigger another page request on every
save. Missing primary avatars and incomplete known second-channel credits still
retry on save. Unavailable or unrecognized page data does not mark discovery as
complete. Automatic collaboration extraction is covered by representative
fixtures; a live two-channel video response still needs verification.

The shared Author Identity and Author Byline render both video cards and Video
details as `First channel & Second channel`, with separate links and a gray
ampersand. Two small 16px Avatars occupy a 24px square: the first is at the top
left, and the second is 8px down and right, in front. Other Avatar sizes preserve
the same half-diameter offsets. Each image retains its own initials fallback.
Single-channel credits keep their existing presentation. The `youtube_collaboration`
Author Byline story exposes the second-channel controls; run
`PLAYWRIGHT_BROWSERS_PATH=.cache/ms-playwright node --test tests/author-coauthors.test.mjs`
to check desktop/mobile geometry and wrapping.

### Deferred Editorial Work

Develop UI reviews of games, HUDs, and other interfaces through the existing
Article model. The translation catalogue already contains a “Reviewing an
Interfaces” article stub; expand that material before deciding whether a
dedicated review page is needed. Reuse existing taxonomy tags when applicable.

### Article/Video migration and deployment

`jurenites_blog_post_update_youtube_video_content_type()` creates Video by copying
the configured Article fields, form/view displays, base-field defaults and
translation settings. It moves nodes with a primary YouTube URL in any current
translation, updating only bundle columns in node and field tables, including
all revision rows. Node IDs, UUIDs, titles, authors, dates, aliases, comments,
images, tag references and Paragraph revision references remain unchanged.
No node saves or YouTube downloads run during migration. Existing detail URLs
remain valid. Migrated nodes with aliases have automatic alias generation
disabled so later edits preserve their URLs; editors can explicitly re-enable
it in URL alias settings. New Video aliases use `/videos/[node:title]`.

The migration grants each role only the Video equivalents of its existing
Article content/revision/translation and own-comment permissions. It removes
unused primary YouTube fields from Article. If a target environment contains
historical-only YouTube values on a remaining Article, those fields are retained
but hidden to preserve revision data. A completion marker makes reruns a no-op.
An independently existing Video type stops the migration for inspection.

Back up each target database, deploy the PHP and Twig files, then run
`drush updatedb -y` and `drush cr`. For a fresh site assembled from the existing
Article recipes and listing setup, finish with
`drush php:script scripts/split-video-content-type.php` and `drush cr`;
the historical Article YouTube recipe is a prerequisite, not a recipe to reapply
after splitting. Reverting this content migration requires restoring its database
backup with the corresponding previous code.

DEV verification: before migration run the following snapshot command, apply the
update, then run the check without `VIDEO_SPLIT_PHASE`:

```sh
docker exec -e VIDEO_SPLIT_PHASE=before blog_jurenites_web vendor/bin/drush php:script tests/video-content-type.php
docker exec blog_jurenites_web vendor/bin/drush php:script tests/video-content-type.php
docker exec blog_jurenites_web vendor/bin/drush php:script tests/article-youtube-metadata-form.php
docker exec blog_jurenites_web vendor/bin/drush php:script tests/article-youtube-avatar-save.php
```

The snapshot compares stored content across node, revision, alias, comment, file
usage, taxonomy index and Paragraph identity tables, allowing only the expected
bundle changes. Additional checks cover required URL validation, listing
membership, editorial rights, migration idempotence, Video add/edit forms and
controlled metadata-save requests. Video Twig templates include the existing
Article templates so the shared component markup and styles remain aligned.

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

English and Russian homepages share the same original News items; no News
translation is required. The View filters to original-language rows and renders
the original content, so existing translations cannot duplicate or replace an
item in the list. Interface labels and relative dates still follow the page
language. Existing installations receive this configuration through
`jurenites_blog_post_update_news_shared_original_content` when running
`drush updatedb`, followed by `drush cr`.

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

## FAQ

`jurenites_faq` provides a reusable, revisionable, translatable **FAQ** block,
placed at the bottom of About (`/about` and `/obo`, content region, weight `110`).
The initial two-line heading is “Questions?” / “Here are answers.” The first
answer links to the existing `/cookbook` page. English and Russian copy is seeded
once; subsequent editor changes survive setup reruns.

Edit the block in Content → Blocks. The two heading fields are plain text.
**Questions and answers** is an unlimited `text_with_summary` field: its native
summary is labelled **Question**, and its formatted value is labelled **Answer**.
Editors can add and reorder pairs together. Do not type numbering into content:
rendering generates `Q.N?` and `A.N!` from the current order. Answers use Drupal's
text filtering and can include links.

FAQ items meet at a 1px solid divider using `theme.dark.border.divider-default`,
with no grid gap. When both neighboring items are expanded, their shared divider
uses `theme.dark.surface.background-page` to stay distinct from the open panels.
Closing either item restores the standard divider color.

The first answer starts open. Each native `details`/`summary` disclosure works
independently with pointer or keyboard, including without JavaScript. Styling
uses existing tokens and the shared Two-tone Heading; the matching example is
**Organisms/FAQ** in Storybook. The rounded open panels and plus/minus controls
follow the FAQ interaction at https://zipzap.design/ in the site's dark theme.

Enable on each environment with
`drush en jurenites_faq -y`, then `drush cr`. Existing installs apply the About
placement with `jurenites_faq_update_11001` through `drush updatedb`. Local enablement does not deploy
the module or content to STAGE/PROD.

Verify the local content/editor contract with
`drush php:script tests/faq-block.php`. Storybook desktop/mobile review covers
native keyboard expansion and collapse; reduced-motion disables transitions.

## Expandable words and phrases

`jurenites_expanding_text` adds **Expandable term** beside **Link** in the Basic
HTML and Full HTML CKEditor toolbars. Select plain text within one paragraph and
press the button. The editor shows the short term followed by an arrow and an
editable explanation; type the complete replacement phrase so the surrounding
sentence still reads naturally. The short term can also be edited directly.
Select a word inside that explanation and use the same button to nest another
expansion. There is no configured nesting-depth limit. This also works in quotes.
Selections spanning blocks or containing links/objects are intentionally disabled.

Use **Remove expansion** while the term or its explanation is selected to restore
the short term as ordinary text; this button may be in the toolbar's overflow
menu. Standard Undo restores the complete expansion, including nested content.
Authors use the normal visual editor; Source Editing is not required.

The saved format is nested spans with the classes `expandable-term`,
`expandable-term__label`, and `expandable-term__explanation`. No scripts, inline
styles, arbitrary attributes or buttons are permitted by the new Basic HTML
allowlist. Frontend enhancement creates real buttons at runtime. Clicking or
pressing Enter/Space replaces the term inline with its explanation; a small
return arrow collapses it. Escape collapses the innermost focused explanation.
Focus returns to its term after collapse. Each expansion can contain further
terms and formatted inline text. Paragraphs reflow naturally; nothing opens a
new page or popup, and the term is colored without an underline. Without
JavaScript the complete explanation is readable. Shared token styling is also
loaded in CKEditor. Storybook: **Atoms / Expandable Term**.

The initial local implementation includes placeholder role stories only; the
owner's longer About and Home copy remains under review.
