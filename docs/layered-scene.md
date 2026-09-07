# Layered scene

The Desk arrival placement is currently disabled on the website pending image
rework. The person cutout needs hand/arm cleanup and a better cool color grade;
the background also needs a less sterile treatment. Storybook retains the
component with its foreground image URL empty by default. Original assets and
Drupal content remain available for later revisions. New installations create
the example placement disabled; the withholding post-update disables the existing
initial placement without deleting its content.

The `layered_scene` content block keeps one background fixed while an optional
transparent foreground fades in once on entering view. It is intended as a
secondary section below the opening Hero. Only the person fades; the desk never
shifts. The shared component is **Organisms / Layered Scene** in Storybook.

Edit **Desk arrival** under **Content > Content blocks** to replace either image,
change the introductory line, headline, supporting text and two links, or disable
the entrance. Both image layers must already align on identical 16:9 canvases.
The supplied 1600×900 assets are in `src/public/assets/images/desk-arrival-*`.
The foreground PNG has real transparency. Its original-photo extraction and
grading provenance is recorded in `output/desk-arrival/cold-grade-notes.md`.

Use **Structure > Block layout > Jurenites theme** to move the block or change
page visibility. Its saved position is on the homepage below the Hero, disabled. Setup
preserves subsequent content edits and placement changes. Additional Layered
scene blocks can be authored independently.

Storybook includes Portfolio entrance, Contact invitation, About the process,
Static scene, Background only and Without image examples. These can serve as
project introductions, a closing contact invitation, or an About-page process
section using the same photographs and different copy.

The image and text stack in narrow viewports and block regions. Reduced motion
and disabled JavaScript show the final still. Animation waits for both images to
decode, pauses while the browser tab is hidden, and never loops. A failed
foreground leaves the desk visible; a failed background leaves readable copy.

Build theme assets before applying
`jurenites_hero_post_update_add_layered_scene` on an installed site. New module
installations create the authoring model automatically. Validate with
`node --test tests/layered-scene.test.mjs` and
`drush php:script scripts/verify-layered-scene.php`.
