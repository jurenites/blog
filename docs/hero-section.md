# Hero section

The reusable `hero` content block displays an editable landscape image, an
optional introductory line and reorderable `hero_slide` Paragraphs. Each slide
contains a navigation label, headline, plain supporting text and two optional
links with editable button labels. Link to `/about`, `/contact`, `/portfolio`,
or an uploaded CV's actual URL; installation does not invent a CV download.

## Editing and placement

- Go to **Content > Content blocks**, find **Homepage hero**, and choose Edit.
  Replace **Background image**, edit **Introductory line**, and expand the slides
  to change their text and button destinations. Set alternative text for an image.
- Use the slide drag handles to change their order; the first is initially shown.
  Add or remove slides as needed. One slide hides the navigation controls.
- **Laptop screen glow** enables the subtle CSS light composed for the supplied
  photograph. Disable it for replacement photographs with different geometry.
- Go to **Structure > Block layout > Jurenites theme** to move the block between
  regions, change its weight/order, or configure page visibility. Its initial
  placement is in Content, before the existing homepage blocks, on `<front>` only.
- Additional Hero content blocks can be created and placed independently.

## Behavior and shared implementation

The homepage's sticky 64px top navigation has a 50% dark background tint and
12px backdrop blur. Both fade to transparent over an additional 32px below the
menu, keeping text readable over the photograph without a hard lower edge.
The effect does not intercept clicks or change layout. The expanded mobile
menu retains its opaque background. **Organisms/Top Nav Menu Site Header →
Homepage Overlay** demonstrates the shared treatment; its tint, blur and fade
height are editable under `component.site-header` in `src/token/tokens.yaml`.

The photograph stays still while manual tabs select the message and calls to
action. Arrow keys, Home and End select/focus tabs. No autoplay or pointer-tracking
animation runs. Hover/focus reveals subtle ray beams on the emitting side of
the laptop display. The beam projects lower into the scene, with a blurred
perimeter and a gradual distance fade. A separate CSS clip keeps the screen edge
crisp. Slow, randomized hue changes suggest moving screen content; they pause
when the Hero is inactive or the browser tab is hidden. There are no face or shirt
reflection overlays and no generated god-ray image. The percentage coordinates
in `.hero-section__glow` follow the supplied photo and scale with the image.
Reduced motion keeps the light static and disables its entrance transition.
Without JavaScript every slide remains readable and its links remain usable.

At narrow viewport or block-region widths the image is followed by the text. With no image, a readable
text-only layout remains. A Hero fills its available block region while respecting
the site's centered maximum width. Normal styling is entirely in SCSS; image
markup has no presentational sizing or inline style attributes.

`src/slice/src/scss/organisms/_hero-section.scss` and
`src/slice/src/js/hero-section.js` are shared by Drupal and **Organisms/Hero
Section** in Storybook. The `jurenites_hero` module owns authoring fields, rendering
data and the Twig template. The theme supplies the visual styles and behavior.
Background files, Paragraphs and link access results contribute render-cache
metadata. Author text is escaped and CTA links use Drupal's Link render element.

## Install and validate

Build the theme first so its initial photograph is available, then enable
`jurenites_hero` or apply `recipes/jurenites_hero`. Installation creates the type,
fields, three initial slides and a homepage placement. Existing content and
placement are never reset by the initial-content helper. Uploaded images are
managed Drupal files. The default photo source is
`src/public/assets/images/hero-night.jpg`, copied to the theme by its build.

Local DEV commands:

```sh
npm run build:theme
docker exec blog_jurenites_web ./vendor/bin/drush en jurenites_hero -y
docker exec blog_jurenites_web ./vendor/bin/drush cr
node --test tests/hero-section.test.mjs
docker exec blog_jurenites_web ./vendor/bin/drush php:script scripts/verify-hero-block.php
npm run lint
npm run docs:check
npm run build-storybook
```

The Drupal verification checks widgets, rendered slides, clean image markup,
escaped author text, missing-image fallback, and preservation of existing content
and placement when setup is repeated. Browser QA covers actual slide selection,
keyboard focus and responsive geometry.
