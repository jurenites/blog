# About Me Page

## Project invitation

The project invitation now appears on the home page as an editable **Call to action** content block: “GOT A PROJECT?”
and “LET'S DISCUSS IT!” above the shared primary **CONTACT** button, linked to
`/contact`. Oversized uppercase type scales to the block width, with tight
tracking, a muted prompt and a bright invitation on an almost-black surface
without an outline. The background extends to both viewport edges while the
section is centered at a maximum width of 960px using the existing wide-content
token; it shrinks to fit narrower screens. The heading and Contact button align
left. The heading uses an `h1` in Drupal and Storybook, retaining its oversized
typography and joining the shared typing animation when it enters the viewport.
The Website Audit block shares the almost-black surface color.

Edit **About project invitation** under Content → Blocks or through its
contextual pencil. Both heading lines and the button label/link are translatable,
revisionable fields. Installation seeds the content only once and preserves
later edits, unpublishing and deletion. The placement uses `<front>` at content
weight `100`, covering both `/` and `/ru`. Russian copy is “ЕСТЬ ПРОЕКТ?”,
“ДАВАЙТЕ ОБСУДИМ!” and “СВЯЗАТЬСЯ”. Update `11001` moves the existing placement
and adds the missing translation in a new revision, preserving English content
and any existing Russian translation. **Organisms / Call to Action** in
Storybook uses the same SCSS and Button atom.

Enable with `docker exec blog_jurenites_web vendor/bin/drush en jurenites_call_to_action -y`,
build the theme and clear Drupal cache. STAGE/PROD require the equivalent explicit
enablement after deployment.

## Technology stack

The About page has a separate logo grid after the numeric values and before the
skills profile. The owner's supplied list defines three core knowledge areas:

- **Code**: HTML5, JavaScript, PHP and Node.js under Foundations & runtime;
  Vue, React and Laravel under **Frameworks**; Drupal and Docker under Platforms
  & tools.
- **Databases**: MySQL.
- **Visuals**: Figma, Unity, Blender, Godot and CapCut.

1С-Битрикс, PWA and Битрикс24 are excluded. This is a technology inventory, not a
new competency assessment; the existing skills profile and its provisional
ratings remain independent. The reference site could not be retrieved, so the
technology names supplied by the owner are the authoritative list.

Each logo fits a 16 × 16 px box beside the technology name, with an 8 px gap.
The JavaScript text mark fits the same compact artwork box.
Group headings use the existing `theme.dark.text.gray` token.
Links use a 32 px minimum height and 8 px padding on every side. The shared
Body 2 role has a 16 px line box, so a single-line item is exactly 32 px high;
wrapping can grow the item without clipping its text.
Logos are white at rest. Hover and keyboard focus reveal their original brand
colors; Unity and CapCut reveal their official black artwork on a white backing.
JavaScript has a text mark because the language has no single official
logo. MySQL uses its dolphin wordmark. Each logo and name share one link to the
official project website; HTML and JavaScript link to their WHATWG and Ecma
standards pages. The grid
works without JavaScript and removes transitions for reduced motion.

Enable locally with
`docker exec blog_jurenites_web ./vendor/bin/drush en jurenites_technology_stack -y`,
build the theme, then clear Drupal cache. Installation adds one block restricted
to `/about` and `/obo`; it does not rewrite the About node or skills content.
**Structure → Block layout → Technology stack → Configure** (also accessible
from the block's contextual pencil) controls the heading and visible technologies.
The shared categorized catalogue is
`web/modules/custom/jurenites_technology_stack/data/technologies.json`.
MySQL retains the catalogue key `sql` so existing block visibility selections
continue to apply after replacing the SQL entry.
**Organisms / Technology Stack** in Storybook renders that same catalogue.
Production needs the same explicit module-enablement and theme-build steps.

### Logo sources

Official artwork was downloaded on 12 September 2026. Brand ownership remains
with the respective projects. These are third-party SVG assets, not hand-drawn
substitutes. Public image files are copied into the theme by the normal build.

| Technology | Official source |
| --- | --- |
| Drupal | `web/core/misc/logo/drupal-logo.svg`; [brand colors](https://www.drupal.org/about/media-kit/logos) |
| HTML5 | [W3C logo downloads](https://www.w3.org/html/logo/) — color and white SVGs |
| PHP | [Wikimedia SVG](https://upload.wikimedia.org/wikipedia/commons/2/27/PHP-logo.svg) — shared official artwork for both states; Colin Viebrock, CC BY-SA 3.0 |
| MySQL | [Official SVG](https://labs.mysql.com/common/logos/mysql-logo.svg) — dolphin wordmark, downloaded 14 September 2026 |
| Node.js | [Node.js branding](https://nodejs.org/en/about/branding) — green and white JS marks |
| Vue | [Official SVG](https://vuejs.org/logo.svg) |
| React | [Official website](https://react.dev/) — inline React mark |
| Laravel | [Wikimedia SVG](https://upload.wikimedia.org/wikipedia/commons/9/9a/Laravel.svg) — Laravel symbol |
| Docker | [Media resources](https://www.docker.com/company/newsroom/media-resources/) — ocean-blue mark |
| Figma | [Official website](https://www.figma.com/) — inline header mark |
| Unity | [Brand page](https://unity.com/legal/branding-trademarks) — symbol extracted from the existing official SVG |
| Blender | [Logo kit](https://www.blender.org/about/logo/) — symbol extracted from the existing logo-kit SVG |
| Godot | [Press kit](https://godotengine.org/press/) — color and white icons; Andrea Calabró, CC BY 4.0 |
| CapCut | [Official website](https://www.capcut.com/) — symbol extracted from the existing header SVG |

Drupal, Laravel and React use upstream geometry in `src/brand/technology-stack/`
with fixed component colors in `src/brand/technology-stack/brand-colors.js`.
These artwork constants are excluded from the token file and shared palette.
`npm run build:tokens`
also generates these three public SVG files through
`scripts/build-technology-logos.mjs`. Other downloaded SVGs preserve upstream
color values. Logo sizing, white presentation and hover behavior are scoped to
`src/slice/src/scss/organisms/_technology-stack.scss`.
Technology names are underlined when their link is hovered or keyboard-focused.

Laravel and PHP were refreshed from the linked SVGs on 14 September 2026.
Laravel uses `laravel-symbol.svg` in both states to avoid reusing cached copies
of the former wordmark. Rebuild Storybook as well as the theme after artwork changes.
The logo build also derives `php-white.svg` from the official `php.svg`, with
the three black letter shapes masked through the oval to become fully
transparent. The existing white filter supplies the inactive presentation;
hover and keyboard focus display the unchanged full-color PHP artwork.

Unity, Blender and CapCut use symbol-only SVG files with bounds fitted to the
artwork, extracted on 15 September 2026. Their names remain separate text labels.
Blender's inactive symbol omits the white eye backing so the white filter keeps
the eye and surrounding ring distinct; its color state retains the original
white, blue and orange artwork. Both states share identical bounds and proportions.

## Web development skills

The About page includes a reusable **Skills profile** content block, placed after
the introduction and numeric values. It uses repeatable **Technology skill**
Paragraphs: technology, category, explanation and an optional decimal
confidence rating from 0.0 to 5.0. Edit and reorder these under Content → Blocks →
About web development skills. Blank ratings display “Not assessed”; zero is a
valid rating. Whole-number ratings display without a decimal suffix (5.0 → 5),
while fractional ratings retain one decimal place (3.4). Normal Drupal revisions,
field access and cache invalidation apply.
Skill category labels use `theme.dark.text.gray`, matching Technology Stack group headings.

The starter copy was checked against the live
[Alexander Ilivanov CV](https://docs.google.com/document/d/1Aec-DgzHUGDfqpIy0LocrFvPZeIqcHZ1SBIWClsj2ZY/edit)
on 10 September 2026. The CV establishes experience, not current competence.
**All initial scores are assistant-proposed draft estimates for owner review.**
The authored block retains the “I have personally reviewed these ratings” field.
The public card renders only the technology grid; its rating-note header and
supporting-note footer are omitted. The scores remain self-assessment estimates,
not measured results.

Drupal, frontend styling, PHP, JavaScript/jQuery, Angular, Storybook, MySQL and Git
make up the card. Angular is scoped to design-system integration, and MySQL to
relational modelling; neither description claims broad platform expertise.
Docker and Composer are supporting tools. Laravel, Symfony 2 and WordPress are
earlier experience that needs refreshing. Kafka and Redis are intentionally absent:
the owner said they do not know them. Do not equate working on a project with
independently mastering every technology in its stack.

### Review the scores through practical work

Use a small sandbox project and explain your decisions after doing the work.
For current independent confidence, try first without AI-generated solutions;
documentation is normal. Record where guidance or substantial refreshing was
needed. These checks are prompts for self-assessment, not automatic certification.

| Technology | A useful practical check |
| --- | --- |
| Drupal | Create a content type and a filtered View; add a small custom feature and explain permissions and cache invalidation. |
| HTML & CSS / SCSS | Build a responsive card from a sketch; verify semantic headings, keyboard focus and narrow-screen layout. |
| PHP | Implement and debug a validated form handler; explain types, errors, dependency injection and output escaping. |
| JavaScript / jQuery | Build an accessible interactive control with an Ajax request; handle loading, failure and event cleanup. |
| Angular | Build a small component with inputs and outputs, then integrate it into a form and explain data flow. |
| Storybook | Document a reusable component with controls and meaningful empty, error and responsive states. |
| MySQL | Model related entities, write a JOIN query, choose an index and explain its effect using EXPLAIN. |
| Git | Make a feature branch, resolve a small conflict and safely undo a commit; explain merge versus rebase. |

Scale: **1.0** basic awareness; **2.0** work with guidance; **3.0** independent
routine work; **4.0** solve complex problems; **5.0** deep expertise. Fractions
are subjective refinement only. Reduce or clear a score when the exercise exposes
a gap; previous project experience remains valuable context for self-assessment.

### Implementation and delivery

Enable the additive module with
`docker exec blog_jurenites_web ./vendor/bin/drush en jurenites_skills -y`, then
rebuild the theme and Drupal cache. Installation creates missing fields, starter
content and the About-only placement without rewriting existing page content.
`jurenites_skills_setup()` may be repeated without resetting authored values or
placement. Enabling is a separate deployment step; source delivery is not a
production content migration. For production, review ratings before enabling.

The source seed is `web/modules/custom/jurenites_skills/data/skills.json`; after
installation, the Drupal entities are authoritative. Storybook's
**Organisms / Skills Profile** uses the same starter data and renders only the
technology grid, with provisional, unrated, boundary and mobile cases. Its sole
control is `skill_items`; header/footer copy and the reviewed-state toggle are
no longer part of the Storybook renderer. Component presentation lives in
`src/slice/src/scss/organisms/_skills-profile.scss`; it has no inline sizing,
star icons, progress bars or JavaScript requirement. Authored fields support translations;
the initial copy is English.

## Point-cloud bust

The About Me page will feature an artistic 3D bust made from points, not a
triangle surface. The initial capture device is the iPhone 11 front TrueDepth
camera.

### Capture contract

- Prefer Record3D for the first experiment because it can capture Face ID RGB-D
  video and export PLY point-cloud sequences.
- Test Heges as a second capture route because its PLY export can include
  per-vertex color.
- Keep the head and shoulders still while another person moves the phone slowly.
- Use diffuse, even lighting and a plain background. Avoid reflective glasses,
  moving hair, and changing facial expression.
- Capture several short takes rather than one long take.
- Preserve the original app recording locally, but move the durable working copy
  into a non-proprietary PLY file.

### Processing contract

- Crop the cloud to head, neck, and shoulders.
- Remove isolated points, background fragments, and low-confidence depth edges.
- Align and merge only the best frames; do not accumulate every noisy frame.
- Smooth positions gently without converting points into a triangle surface.
- Voxel-downsample to a stable spatial distribution.
- Produce desktop and mobile point budgets after testing. Begin evaluation around
  40,000 points for desktop and 15,000 points for mobile rather than treating
  those numbers as permanent limits.
- Normalize the bust into a local coordinate system with its origin near the base
  of the neck.
- Convert captured color into a controlled grayscale value per point. Preserve
  enough tonal range to describe facial planes without creating a photographic
  texture.

### Delivery contract

- Keep PLY as the editable point-cloud source.
- Generate a compact website-specific binary point buffer containing position
  and grayscale values. The browser format is derived, never the only copy.
- Render points through a dedicated WebGL/Three.js About Me canvas with responsive
  point size, depth testing, and restrained pointer or scroll motion.
- Lazy-load the point data near the About Me section.
- Provide a static poster image with matching framing as mandatory fallback for
  loading failure, JavaScript errors, WebGL failure, reduced-data preference, and
  print or social previews.
- The About Me text remains readable and complete without the 3D canvas.

### Privacy contract

Raw RGB-D captures and high-density facial point clouds remain private local
source material. Publish only the reduced artistic derivative required by the
website.

## Companies I have worked with

The About page includes a horizontal **Company slider** before the FAQ (content
weight `90`, restricted to `/about` and `/obo`). It lists Life.Church and Funnel
Design Group as **Indirect collaboration**, and Thrive.io, OysterLabs.com and
VolcanoIdeas.ae as **Direct collaboration**. Thrive also says **Ongoing**.
These relationship descriptions come from the site owner.

Edit **Companies I have worked with** under Content → Blocks. The heading and
repeatable Company collaboration Paragraphs support revisions and translations.
Each company has an editable name, official-logo selection, relationship,
website URL and project URL. Company ordering is shared between languages;
paragraph fields can be translated independently. Initial setup seeds once and
preserves subsequent editorial changes.

Logos keep their original proportions and are sized in shared SCSS: 32px high
by default, 40px for Funnel Design Group and 54px for Thrive and VolcanoIdeas. A shared 56px artwork
row keeps company names aligned. Each website link has a readable ID:
`company-life-church`, `company-funnel-design-group`, `company-thrive`,
`company-oysterlabs` and `company-volcanoideas`. Repeated Drupal instances receive
unique suffixes; scoped logo modifier classes handle per-company sizing.
Company names use Link typography (16px, weight 300, 24px line height), stay
white, and show a thin underline only when the company link is hovered or
keyboard-focused, matching the Technology Stack name interaction.
The arrow controls are hidden. While visible, the row pauses for three seconds,
then advances to the next card boundary with a 700ms eased transition. It stops
at the last scroll position and steps backwards to the first, repeating in both
directions without cloned cards or a wraparound jump. Hover, keyboard focus,
touch interaction and a hidden browser tab pause autoplay. Reduced-motion users
get manual scrolling only. Keyboard arrows and Home/End remain available.

The slider spans the usable viewport, beyond the reading column, with visible
section overflow and a heading aligned to the content frame. The track scrolls
at the screen edges; browser scrollbars and the admin navigation displacement
are excluded from its width to avoid horizontal overflow of the whole page.
The company cards are centered with equal space on both sides when the full row
fits. When the row overflows, it aligns to the start so every card remains reachable.
The native horizontal scrollbar remains visible and draggable, with an 8px-high
square thumb and track in browsers supporting scrollbar pseudo-elements.
Other browsers retain the thin native scrollbar fallback. Its shared
`.horizontal-scrollbar` atom is demonstrated independently in **Atoms /
Horizontal Scrollbar** for reuse. **Organisms / Company Slider** previews the
same automatic movement, catalogue and styles as Drupal.

“See the projects” uses the shared Link typography role (16px, weight 300,
24px line height) with a thin 1px underline. Each link targets `/timeline`,
with these project anchors:

| Company | Timeline destination |
| --- | --- |
| Life.Church | Life Church Blackbriar |
| Funnel Design Group | Oklahoma Children's Theatre |
| Thrive.io | `/timeline`, no anchor |
| OysterLabs.com | Oysterlabs Games Server |
| VolcanoIdeas.ae | Global-ny.com |

Each project has one Timeline detail `<li>` ID using the Paragraph UUID and
first authored period start date, e.g.
`timeline-project-<uuid>-2014-09-01`. Names and list order can change without
breaking these links. Changing a period's start date requires updating its
company link. Deep links focus the target after the timeline rearranges its
columns and fonts finish loading; native fragment navigation works without JS.
The existing timeline content is not migrated or rewritten.

Logo source assets: [Life.Church](https://www.life.church/static/img/logo.svg),
[Funnel Design Group](https://funneldesigngroup.com/images/funnel-logo.svg),
[OysterLabs](https://images.squarespace-cdn.com/content/v1/53e510f9e4b0c5db265c0333/1421876802902-5HZVAYJZF670MNNVIRZB/OysterLabsLogo-Blue-nobackground.png?format=1500w),
and VolcanoIdeas (the owner's `volcano-ideas.svg`, supplied 15 September 2026,
replacing the [previous vertical mark](https://volcanoideas.ae/img/logo-v.svg)).
Its content hash is appended to the asset URL so browsers fetch the new artwork.
The OysterLabs CDN
returns WebP despite the PNG URL; its local extension reflects the actual file.
A CSS-linked SVG color-matrix filter removes its white backing and paints the
blue lettering white. The source raster remains unchanged.

Enable locally with
`docker exec blog_jurenites_web vendor/bin/drush en jurenites_companies -y`, then
build the theme and clear Drupal cache. STAGE/PROD need explicit enablement after
deployment. Run `drush php:script /opt/drupal/tests/company-slider.php` inside the
local container for translations, field validation, exact link destinations,
unique IDs and seed-preservation checks.

Thrive uses the owner's horizontal `thrive-io-logo.svg`, supplied on 15 September
2026, at 54px high with its original transparent background and white artwork.
The catalogue's `logo_asset_file` replaces the former JPG in Drupal and Storybook
while retaining the stored logo selection key for existing content and revisions.
Imported Russian
interface labels live in `jurenites_companies/translations/jurenites_companies.ru.po`;
import with `drush locale:import ru <path> --type=customized --override=not-customized`.

## Career metrics and professional roles

The About page separates the two general statistics (projects and years of
experience) from three role tiles. The **Professional roles** content block sits
immediately after `jurenites_theme_numeric_values`, before Technology Stack.
Both blocks appear on `/about` and `/obo`. The three existing hour totals and
their tracking captions/links are retained. Clicking anywhere on a role tile
selects its story below, except tracking links, which keep their own navigation.
The role labels remain keyboard-accessible tabs with a focus outline around the
whole tile and a short slide motion. There are no separate slider controls.
The last role tile and its story are active by default.
The panels share the tallest panel's height to avoid movement while switching.
On narrow screens the role tiles scroll horizontally. Reduced motion disables
slide animation; without JavaScript all stories remain readable.

Edit **About professional roles** under Content → Blocks. Each repeatable tile
uses the existing Numeric value Paragraph plus a **Role heading** and formatted
**Role story**. Each tab displays the full **Numeric description**
(`field_numeric_description`); its story heading uses **Role heading**
(`field_role_heading`). Include any desired prefix such as “As a” in the
Numeric description. The initial story paragraphs are explicit placeholders while the
owner reviews the final copy. Headings, stories and numeric fields support
translations and revisions; ordering is shared between languages. Existing
metric numbers, descriptions, artwork, captions and links are preserved.

Enable `jurenites_expanding_text` and `jurenites_roles`, rebuild theme assets,
and clear cache. Back up the database before first enablement. Installation
identifies the original three role paragraphs by UUID, duplicates them into the
new role block, and saves a new revision of the metrics block with the two
remaining statistics. The original paragraphs remain attached to the old block
revision. A database transaction groups the content writes; a state marker and
stable block UUID prevent repeat setup from overwriting edits or recreating
removed content. On a site without these original role UUIDs, the new role tiles
use an em dash for hours rather than inventing figures. Deployment requires
explicit module enablement on that environment.

Storybook: **Organisms / Role Slider**, including a nested-explanation example.
Validation: `tests/role-slider.php` covers translations, schema/filter config and
repeat setup; `tests/role-slider.browser.mjs` covers desktop/mobile layout,
keyboard selection, reduced motion and actual editor authoring. An existing
Basic HTML Source Editing warning about the Game of Life table class is reported
separately by the integration check.

Numeric caption links use the shared Link typography (16px, weight 300, 24px line
height). External web caption links open in a new tab with `noopener noreferrer`.
The shared footer external-link icon is reserved after the caption label and
revealed on hover or keyboard focus, without shifting the text. Its visibility
is scoped to the caption's own icon; other numeric links and footer icons retain
their existing behavior.
