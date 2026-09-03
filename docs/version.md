# Documentation Version

Version: 1.3.0
Reviewed: 2026-09-03

This checkpoint says the `/docs` folder has been reviewed against the current
source structure, token pipeline, Storybook organization, Figma sync flow, Drupal
token endpoint, planned visual testing workflow, and DEV/PROD command runbook.

## Versioning Policy

- `package.json` owns one version for the whole repository. The tracked theme
  `release-info.json`, Drupal, Storybook, and this documentation checkpoint use
  that same project version.
- Version `1.0.0` marks the first production release. Bump the minor version for
  each subsequent delivered project iteration (`1.1.0`, `1.2.0`, and so on).
  Reserve patch bumps for corrections to an existing release and major bumps
  for intentionally incompatible changes.
- Use `npm run version:bump` for the normal minor increment, or pass `patch`,
  `minor`, or `major` explicitly. The command keeps `package.json`,
  `package-lock.json`, the tracked theme `release-info.json`, and this checkpoint
  synchronized.
- During active refactoring, it is fine to avoid rewriting docs for every small
  experiment. Before committing meaningful source changes, run
  `npm run docs:check` and update docs when the checker reports drift.
- If a change is code-only and does not affect developer workflow or public
  component behavior, no documentation bump is required.

## Current Source Contract

- Editable token source: `src/token/tokens.yaml`.
- Generated token artifacts: `generated/styles/_tokens.scss`,
  `generated/token/tokens.js`, and the readable three-layer mapping table at
  `generated/token/color-mappings.json`.
- The public Drupal theme is self-contained with `base theme: false`; it does
  not depend on the deprecated Stable 9 theme.
- Storybook stories: one component folder per visible example under
  `src/stories/`.
- Figma sync helper: `scripts/figma/design-system-sync.js` reads
  `generated/token/tokens.js`; it is helper code, not a generated artifact.
- Visual testing is documented as a plan in `docs/visual-testing-plan.md`; it
  becomes runnable documentation only after the first real scenario is
  implemented and verified.
- Spacing tokens use semantic names, not numeric names, so values can change
  without renaming component code.
- Reusable absolute dimensions in shared theme SCSS use semantic layer- and
  component-scoped tokens. Intrinsic percentages, ratios, grid coordinates,
  transforms, and spacing-grid multipliers remain local CSS mechanics.
- Typography uses seventeen one-line CSS `font` shorthand role tokens. Open Sans owns
  website headings, body copy, and the Storybook UI; most roles below 24px use
  the attached Light face at weight 300, while Badge is semibold at 14px for
  compact emphasis. Bold Courier New owns Storybook code
  text; Ubuntu Sans Mono owns prominent numbers and Date Value date/time text;
  Roundabout is demonstration-only; and 4pixel is limited to demonstrations and
  compact technical details such as the bottom-right version watermark. Anchors
  inherit the typography of their surrounding content; `.text-link` is the
  explicit opt-in for the dedicated link typography role.
- Token lint rejects numeric `font-size` declarations and numeric handwritten
  `font` shorthands so project typography must use roles or semantic tokens.
- Storybook browser inspection is prepared through `npm run storybook:inspect`;
  install Playwright locally first with `npm install --save-dev playwright` and
  `npm run playwright:install`.
- Storybook and Drupal expose generated build identity in a bottom-right
  screenshot signature.
- Pagination uses one class contract across Storybook, shared SCSS, and Drupal's
  pager override. At mobile width it automatically switches to four list items:
  previous arrow, current page, total pages, and next arrow.
- Breadcrumbs retain a reusable Storybook and shared-SCSS contract, but Drupal
  currently suppresses breadcrumb trails on every route, including Webforms and
  node detail pages. Full Articles show only a text Back link to `/blog` for
  personal Articles or `/videos` for YouTube references, with a replaceable
  24px, 1px-stroke left-arrow Icon Atom. The link uses normal anchor navigation
  rather than browser history.
  Named SVG geometry is stored in `src/public/assets/icons` and copied into the
  deployable Drupal theme assets during the theme build. The Back link uses the
  caption typography role.
- Project-owned SVG icons are rendered through the shared 24px Icon component
  rather than handwritten inline SVG or text glyphs. Named geometry remains in
  `src/public/assets/icons`; the Blog tag-filter clear action composes the
  `icon-cross` asset through that shared contract.
- Full Article YouTube players show the shared animated no-signal noise while
  their iframe loads. The overlay derives its responsive dimensions and aspect
  ratio from the field formatter's player box, crossfades to the loaded player
  over 200ms, and stops rendering after the transition.
- Content Layout provides one controlled Storybook composition for generic page
  and node shells, with token-backed readable and wide widths. Drupal's native
  `.layout-content` uses the readable width without requiring another wrapper.
- The project contact recipe owns `/contact` through a three-field Webform,
  retains submissions locally, sends plain-text notifications to the Drupal
  site email, and protects anonymous submissions with a local math CAPTCHA.
- Two-tone Heading defaults to `h3` and its 40px `headline-3` role, while other
  selected heading levels inherit their matching base typography roles. Its
  structured leading strong, soft, and trailing strong plain-text segments use
  inline/new-line placement to support two colored lines and a soft phrase
  between strong text without author-entered HTML or WYSIWYG markup.
  Basic pages now use their native Title as the first strong segment and one
  compound, translatable field for Title 2, Title 3, and both placement values.
  The edit widget mirrors the component controls while the public page title is
  fixed semantically at `h1`; no JSON settings blob or separate field per control
  is required.
- Drupal's `/blog` and `/videos` paths give their native `.layout-content` an
  800px token-backed maximum width while standard page and node content remains
  at 720px. Their Views queries split personal Articles with an empty YouTube
  field from YouTube reference Articles with a populated field while retaining
  the same tag filtering and editorial list-item presentation.
- Editorial-list thumbnails preserve the intrinsic `<img>` aspect ratio and
  zoom to
  120% inside their clipped media container on pointer hover, with the zoom
  suppressed for reduced-motion users. A Blog-list media region now requires a
  YouTube video, so Articles without video do not show a thumbnail. Saving an
  Article with YouTube video and an empty Image field prefers YouTube's
  1280×720 thumbnail, then falls back to the oEmbed thumbnail, and stores it in
  that field. Existing Images remain under editorial control and are never
  overwritten by the automatic fallback. Blog-list images use Drupal's narrow
  responsive candidate set with an embedded blurry placeholder and the shared
  progressive loading state. Its listing-specific `sizes` rule follows the actual
  641px single-column breakpoint so mobile images are not stretched from the
  325px candidate.
- All global semantic corner-radius tokens resolve to `0px`; project-owned
  preview styles also use the zero-radius token so Drupal and Storybook
  consistently render square corners. Chip owns a component-level `9999px`
  pill radius, Avatar owns a component-level circular radius token, and Select
  Input uses a local 50% radius only for
  the requested transient 36px hover indicator inside its square suffix target.
- Article teaser and editorial list links use normal Drupal navigation to the
  full
  Article detail route. Their title and image remain separate presentations;
  they do not morph into the full page through cross-document View Transitions.
- Article Teaser is the square-corner, bordered editorial card used by the
  homepage three-tile composition. The Drupal Blog and Videos Views use a
  separate, borderless Article Blog List Item with horizontal media and content
  that collapses to one column on mobile. Its dedicated `blog_list` view mode
  keeps Drupal markup and render caching separate from the homepage `teaser`
  cards. Storybook documents both presentations.
  Teaser titles use semantic `<h3>` markup with the 16px semibold `subtitle-1`
  role; teaser excerpts use the new 14px `body-2` role, while full Article body
  copy remains on the 16px `body` role.
- Article teaser metadata composes Avatar in Storybook and Drupal. Its Uploaded
  image state falls back to initials when the image fails, while Drupal passes
  its native compact-user `author_picture` render array into the shared shell.
  The Avatar removes the inaccessible user-profile link and owns displayed
  image sizing through explicit small (16px), medium (24px), large (32px), and
  token-backed big (40px) modifier classes rather than HTML dimensions. Its
  image box always uses a 1:1 cover crop so non-square uploaded thumbnails stay
  circular. The default medium value renders its modifier class explicitly.
- Article list items and detail pages compose the Author Byline structure
  documented in Storybook. Its time contract keeps the integer minute count and
  translatable `min to read` or `min to watch` label in separate elements so
  multi-digit values retain their word spacing. Personal Articles present their
  Drupal owner, Article date, editable `N min to read` time (5 minutes by
  default), and Tags.
  Articles containing a YouTube URL instead present the stored video creator
  link, elapsed time since the original source date, and automatically collected
  `N min to watch` time;
  seconds are truncated and hour-long videos remain expressed in total minutes.
  Name and date/time details share one wrapping inline row in Storybook and
  Drupal; elapsed dates use calendar units such as `4 months and 9 days`.
  Author Byline and Article Teaser both compose the Consumption Time atom, which
  keeps the minute number and `min` in secondary text while rendering the
  remaining read/watch purpose in gray.
  The detail credit sits below the iframe and video title, while Drupal retains
  the node owner for its normal editorial history. The video creator Avatar uses
  the stored 16px channel image with initials as its non-blocking fallback.
- Article body and tag fields use bundle-specific semantic templates; tag Chips
  link to the Blog's validated single-tag GET filter using cleaned tag-label
  slugs rather than internal IDs. Its selected state and clear action require no
  exposed input or custom AJAX.
- Form Field consolidates nine native control presentations into one Storybook
  page. Shared SCSS styles Drupal textareas, selects, checkboxes, radios, file
  uploads, descriptions, disabled states, and validation errors while retaining
  native form markup. Shared and native form labels and legends use regular 14px,
  font-weight-400 typography. Storybook label/control pairs use a dedicated
  wrapper with an 8px gap, while form labels use a fixed 16px height and
  line-height independent of the font's intrinsic line box. Textareas retain a
  96px minimum height and vertical resizing but stop at 80% of the viewport;
  Contact messages and Article comments also have a server-validated
  5000-character maximum.
- Select Input progressively enhances its native control in Storybook and
  Drupal while retaining the native fallback. Its 40px trigger includes a 40px
  suffix target, 24px one-stroke chevron, 36px circular hover state, and short
  rotation transition. The custom listbox extends 4px past both trigger edges,
  uses 40px minimum option rows, aligns value and option text, and visibly marks
  the selected option.
  The open menu now measures the visual viewport and trigger position whenever
  it opens, scrolls, or resizes. It chooses below or above based on available
  space and uses a bounded internal scroller when the full list fits on neither
  side. The Site Header language picker now composes this same atom in Storybook
  and Drupal, with a scoped borderless, intrinsic-width presentation.
- The public Contact Webform uses local Antibot protection instead of a visible
  math CAPTCHA. JavaScript restores the real form action after browser
  interaction and supplies the server-validated Antibot key; no third-party
  account, tracking request, or API key is involved.
- Select, text, textarea, unchecked choice, and choice-chip controls use the
  light-black palette surface so inputs sit one neutral tone above the default
  page surface. Selected Select Input rows use deep gray to remain distinct.
- Media Loader provides a 16:9 video-upload placeholder with independent
  monochrome noise frames, progress, filename, and upload status. Its noise
  advances at 15 fps and freezes under reduced motion.
- Storybook manager colors now come from generated YAML tokens instead of copied
  HEX values, and token builds enforce that source-of-truth contract.
- Elevation levels use distinct approved dark-gray surface tokens and generated
  background/shadow utility classes in Storybook. Handwritten colors remain HEX
  values owned exclusively by `src/token/tokens.yaml`.
- Palette, Abstraction Levels, and Color Contrast share one internal Color
  Block renderer that is intentionally omitted from Storybook navigation and
  the public token tree. Its private layout sizes remain in Storybook SCSS.
  Abstraction Levels exposes Palette, Theme → Palette, and Component Mappings
  while generated CSS preserves visible `var(--…)` relationships. Palette role
  counts remain open-ended for two-color, triadic, tetradic, or larger systems.
- Theme tokens now directly own surface, text, action, and border semantics;
  the redundant shared `color.*` aliases have been removed. Watermark identity
  and credit colors are component-owned mappings under `component.watermark`.
- All token HEX letters are uppercase. Both token builds and `npm run lint`
  enforce this source style alongside the existing token contract.
- Color authoring now uses a concise validated YAML schema: raw entries contain
  one uppercase HEX string plus an optional display-label comment, while theme
  and component colors are direct key/reference pairs. The builder normalizes
  them into DTCG records and rejects object-valued or malformed raw colors.
- Every raw color now occupies one key/value line.
  Color mappings use plain unquoted dot paths without braces; lint rejects the
  previous quoted/braced form and multiline raw-color formatting.
- The redundant `color.value` registry and generic `chromatic-*` IDs have been
  removed. Each `color.palette` role now directly owns its HEX and display label,
  reducing the color model to Palette → Theme → Component.
- Success roles use the `system-success*` family in both palette and theme
  layers; component success states map through `theme.dark.system.success`.
- Watermark colors are no longer declared under `theme.dark`. The Watermark
  component owns its identity and credit tokens directly, mapping them to the
  human-readable palette roles while SCSS continues to consume component variables only.
- The spacing scale keeps literal 0px, 1px, and 2px exceptions plus one 8px
  `base-gap`. Larger layout spacing is expressed at its use site with an
  explicit `calc(var(--space-scale-base-gap) * multiplier)` instead of a
  semantic pixel-size alias.
- All editable token families now use concise direct YAML values. Scalar values,
  dot-path references, inline arrays, and inline composite maps replace source
  `$type`/`$value` wrappers; YAML comments replace `$description`. The builder
  infers metadata and lint rejects the old fields.
- Redundant enum registries such as `small: small` have been removed from the
  token source. Storybook owns its control-option arrays locally, while lint
  rejects future key/value self-mappings.
- Elevation shadows are stored as complete CSS-ready strings instead of
  offset/blur/spread/color objects. Generated variables remain directly usable
  through one `box-shadow: var(--elevation-shadow-level-*);` declaration.
- Drupal theme builds configure relative font URLs and copy canonical font files
  into deployable theme assets.
- JavaScript, SCSS, and component-template linting now runs before the Storybook
  deployment build, with naming conventions introduced as configurable warnings.
- Storybook delivery now uses an explicit lint gate: pull requests run lint, and
  main-branch builds and deployments cannot start until that job succeeds.
- Storybook inspection discovers stories dynamically and checks both token-defined
  minimum mobile and desktop widths, including horizontal overflow as a failure.
- Personal publishing components now include a composed Author Byline, editorial
  Pull Quote, and responsive Top Nav Menu Site Header, each verified at the 360px minimum.
- Top Nav Menu Site Header uses the compact floating structure of Shadcnblocks Navbar 33:
  the Drupal logo sits left, the native one-level Main navigation is centered,
  and a flag-free `Eng`/`Rus` Select Input sits right. It preserves the current
  route through Drupal language URLs, moves the compact navigation to a second
  row on mobile, and hides Gin's secondary toolbar for authenticated
  frontend users.
- Blog discovery and retention patterns now include Breadcrumbs, Search Form,
  and Newsletter Signup, composed from a reusable labeled Text Input atom and
  verified without horizontal overflow at the 360px minimum.
- Drupal's native `.form-text` fields share the Text Input atom's control,
  placeholder, hover, and focus-visible styling, including the user login form.
- Text Input exposes token-backed `full`, `half`, and `quarter` width options
  capped at 320px, 160px, and 80px respectively, with an 80px minimum. Drupal
  `.form-text` fields use the full-width option by default. The input and its
  optional action are direct children; no control-row wrapper is required.
- Drupal's native `.button.form-submit` controls share the primary Button atom
  styling, including its visible inverse text and hover elevation states.
- A project-owned Drupal recipe enables Media Library with reusable Image media
  for JPEG uploads and Remote video media for YouTube or Vimeo URLs.
- A progressive-image recipe combines an embedded 20px blurry placeholder,
  intrinsic width/height layout reservation, responsive WebP candidates, and a
  project-owned 1px loading-state line. Placeholder generation happens when
  Drupal saves an image file, including cached remote-video thumbnails. The
  line represents browser-visible states rather than unavailable byte-level
  progress.
- Progressive previews render in a separate decorative layer, keeping native
  image alt/error feedback unfiltered. Local PHP grants GD 512 MB to decode
  large uploads while generating responsive image derivatives.
- Drupal Image media accepts files up to 200 MB. PHP permits a 200 MB file,
  while PHP, Apache, and Nginx permit a 210 MB request for multipart overhead.
- Image Compare Accessible Slider provides an accessible draggable comparison,
  backed by an Image comparison content type that accepts two Image media items.
- Articles accept one direct YouTube URL above Body through YouTube Field. The
  field extracts the video ID and renders a responsive player and YouTube video
  thumbnail without requiring editors to create or select Media entities first.
  Saving fills empty editable creator-name, creator-link, original-date, and
  thumbnail fields from the source. It also fills the editable content-time
  field from YouTube's duration and aligns the Article Authored on calendar
  date with the YouTube publication date without replacing its time of day.
  Existing editorial values are preserved; replacing the video URL refreshes
  its creator/date/duration metadata. This keeps one Article type while the
  YouTube URL cleanly distinguishes external video references from personal
  long reads.
- New Articles default to not promoted to the front page. Editors can opt in per
  Article, and the default change does not rewrite existing content.
- Article Tags use Tagify's unlimited entity-reference autocomplete widget.
  Editors can select existing Tags terms or create new terms by entering text.
- Paragraphs provides structured content sections on Articles and Basic pages.
  Stable Layout Paragraphs 2.x and core Layout Discovery are installed and
  enabled as the visual-layout foundation. The existing Content sections field
  intentionally retains its classic Paragraphs widget and entity-reference
  formatter until an explicit layout-section component is designed and added.
  Numeric Values adds a repeatable section of semantic statistic tiles. Each
  tile stores Number and Description fields, with an optional Start year that
  calculates elapsed years at render time. Numbers use a 64px Ubuntu Sans Mono
  role with a slashed zero; descriptions use `subtitle-1`.
  The Two-image crossfade Paragraph requires exactly two Image media items,
  defaults to two-second holds and half-second transitions, exposes both values
  as formatter settings, provides two interactive 4px pagination dots, and
  pauses automatic rotation on pointer hover.
- The two-image paginator's 4px Crossfade Dot is a shared Storybook/Drupal atom.
  Its inactive and active states remain dark gray and white, while hover adds a
  1px solid-white outline around the visible circle.
- Tooltip renders as a document-level, viewport-fixed overlay so it never changes
  its trigger's dimensions or document flow. It uses a token gap, automatic
  bottom/top/right/left collision handling, a manual position override, and an
  overlay layer above normal page UI. Badge, Chip, and Tooltip use the semibold
  14px Open Sans badge role. Chip overrides native link typography and uses its
  component-level pill radius. Chip and Button labels prevent accidental drag
  selection while retaining their normal interactive semantics. Version labels
  retain the 5px 4pixel Overline role for compact technical detail.
- Desktop and wide breakpoints are unified into one 1280-1920px desktop range.
  Centered content is capped at 1440px and wider screens remain background-only.
- Native document headings and components reuse the concise typography roles;
  role mixins emit one `font` declaration instead of separate family, size,
  weight, line-height, and letter-spacing declarations.
- Native `h3`, `h4`, `h5`, and `h6` elements map directly to the corresponding
  `headline-3`, `headline-4`, `headline-5`, and `headline-6` roles.
- The screenshot signature displays the shared project version, current UTC
  build update time to the second, seven-character Git hash, and collaboration
  credit with exact solid token colors in Drupal, the Storybook manager, and
  every Storybook preview iframe.
- The Storybook manager and each Canvas or Docs preview own one persistent build
  watermark. The Version Watermark story additionally remains its intentional
  component sample and is capped at 200px including Canvas chrome.
- Drupal renders the Version Watermark in every environment, including PROD.
  One build-identity writer updates both Drupal JSON and Storybook JavaScript;
  validation rejects output whose project version or Git commit differs from
  the current build context. Git checkouts resolve `HEAD`, supported CI systems
  supply their native commit variable, and artifact-only deployments can pass
  `JURENITES_GIT_COMMIT` explicitly.
- Typography dimensions now use explicit pixel values end to end; legacy root
  font-size conversion logic has been removed from Storybook and Figma sync.
- Project-owned folder documentation is centralized in
  `docs/repository-structure.md`; the repository root contains the only tracked
  `README.md`.
- The Drupal front page uses the full-black palette token without a canvas
  animation layer.
- Storybook Backgrounds offers `plain-black` and `particle-attraction` through
  one select control. The monochrome Canvas 2D
  field scales its 6px particle count with area, prevents dot overlap, and slowly
  gathers particles inside a delayed 200px cursor-attraction field.
- Future scenic backgrounds use named parallax depth layers from sky through
  foreground dunes.
- Typography roles do not own uppercase transformation. Uppercase is an explicit
  Button component token and applies only to the Button atom.
- Storybook manager CSS lives in `src/styles/storybook-manager.css`; manager HTML
  contains links and scripts only, with no inline styles.
- The future About Me page has a documented TrueDepth point-cloud bust contract:
  PLY capture, reduced grayscale points, progressive loading, and a mandatory
  static-image fallback.
- The project signature uses the 4pixel typeface at 5px; its `Version 0.0.N`
  identity line is light primary text while the collaboration credit is secondary.
- The Drupal theme uses the optimized 32px Jurenites mark for `logo.svg` and a
  high-contrast `favicon.svg`. Eight Figma-exported paths were consolidated into
  one compound path without changing the filled pixel geometry.
- Procedural artwork uses a documented WebGL shape language built from projected
  faces, edge functions, signed distance fields, color fields, and alpha fields.
- Local Docker traffic uses semantic host routing: `jurenites.local` for Drupal
  and `storybook.jurenites.local` for Storybook, matching the future
  `jurenites.com` domain structure.
- Local Drupal installation documents a three-hour request-triggered automated
  cron interval. Stage and production should use their hosting scheduler for
  `drush cron` instead of combining both scheduling methods.
- Text links use the primary white text token instead of the cyan action token.
  The version Git hash links to the exact GitHub commit and always uses the
  4pixel font with a one-pixel solid underline.
- Media Loader noise renders one grayscale shader sample per CSS logical pixel.
  Each frame hashes pixel coordinates with a new frame seed instead of shifting
  an ordered pattern, preventing coherent diagonal drift.
- The favicon uses the compact 16px Jurenites mark and adapts for tab contrast:
  light browser themes receive a black background with a white mark, while dark
  browser themes receive a white background with a black mark.
- Logged-in admin pages use Gin in forced dark mode with user appearance
  overrides disabled. The browser tab uses the fixed inverted
  `favicon-admin.svg`, while the Gin Home toolbar link uses the public
  `favicon.svg` through the project-owned `jurenites_admin` module.
- Frontend pages identify the active custom theme with a `jurenites-theme` body
  class. Public link defaults are scoped to that class, while Gin navigation
  uses Jurenites blue and blue-gray palette mappings and keeps 14px toolbar
  link and button typography.
- Article comments are open and publicly readable, while posting, immediate
  publication, and own-comment editing belong only to the restricted Content
  editor role (plus Drupal's administrator bypass). Other comment fields remain
  forced closed. The shared Comment Message molecule renders the author's
  24px circular Avatar, user-entity Full name, relative website-post timestamp,
  and monochrome rounded speech bubble in Storybook and Drupal. An uploaded user
  picture takes priority regardless of Drupal's global comment-picture theme
  toggle, with initials reserved for an empty or failed image. Its header
  reuses the Article Teaser metadata layout, and Date Display preserves spaces
  around decorated zero digits in elapsed labels. The Article comment
  form keeps its fixed restricted text format but does not render Drupal's text
  format help and selector wrapper for any account. Its action row contains only
  the Post comment action; Drupal's optional Preview action remains hidden. The
  Author controls stay hidden while adding comments, but Drupal administrators
  can use them while editing an existing comment to correct its account owner.
- Gin hides Drupal's Shortcuts toolbar, Bookmarks menu, and page-title action.
  The Shortcut module and its stored sets remain installed and unchanged.
- Storybook uses its repository-owned 16px SVG logo at
  `src/public/storybook-favicon-16.svg`. Its explicit, uniquely named manager
  favicon URL avoids the persistent browser cache associated with the generic
  `/favicon.svg` path and requires no competing favicon declaration.
- The semantic site footer always contains the shared Cookie Policy Notice. It
  makes no consent claim because the site does not set cookies; “Whatever” stores
  only a boolean local dismissal preference and hides the notice. The
  `jurenites_privacy` module owns the linked `/privacy-policy` route and its
  deliberately brief NON-LEGAL explanation.
- The transparent Footer Navigation stays at the bottom of short and empty
  viewports without leaving normal document flow on longer pages. Alongside its
  secondary links, it shows the current year with the gray, regular Body
  typography message “No rights reserved.”
- The Privacy Policy route uses a reference-informed editorial hierarchy: a
  compact NON-LEGAL eyebrow, full-width divider, generous title spacing,
  oversized page title, and a readable Overview section. Its content remains
  project-specific rather than copying third-party legal boilerplate. It also
  discloses that local browser storage is used only to remember dismissal of
  the cookie notice, without an identifier, transmission, analytics, or
  tracking.
- Privacy is split across native Drupal responsibilities: the policy is an
  editable Basic Page node, its link belongs to the secondary Footer menu, and
  the cookie notice is a custom block placed in the Footer region. The notice
  cites the EU Commission’s approximate 334-million-hour annual estimate and
  remains separate from the policy body.
- The Cookie Policy Notice is a fixed, non-modal footer panel above the bottom
  viewport edge. Its dismissal key is versioned for the revised notice, and its
  server markup starts hidden until JavaScript checks storage, eliminating the
  returning-visitor flash before a stored dismissal is applied.
- The Cookie Policy Notice title and paragraphs are CMS-owned: Drupal renders a
  reusable Basic Content Block through its Footer-region placement. JavaScript
  owns only the “Whatever” dismiss control and local preference behavior;
  Storybook constants are explicitly preview fixtures rather than runtime copy.
