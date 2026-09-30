# Dynamic thumbnails

## Preview Mobile Screen Card

The component’s Storybook Docs page includes a Project integration guide, raw HTML
nesting example, control-to-attribute table and complete generated ScatchApp markup.
Its explanation is maintained in `src/stories/molecules/card/card.docs.md`; it
documents the protected rich text editing workflow. Wrap cards in
`<div data-phone-preview>...</div>` when embedding them in rich text. The
`jurenites_admin` PhonePreview plugin treats that wrapper (and the existing
`data-scatchapp-sequence` wrapper) as a CKEditor block object with raw contents.
Accountia's `.accountia-preview__phones`, `[data-accountia-gallery]`, and
`[data-accountia-video]` containers receive the same protection without extra wrappers.
It displays a safe text placeholder in the visual editor and preserves the
phone markup through ordinary saves and source-mode toggles. The whole block can
be moved or deleted; deliberate source edits remain possible. Unwrapped card
HTML is not protected, and the plugin does not repair already-damaged markup.

The local regression check `tests/phone-preview-editor.browser.mjs` performs two
real ScatchApp node saves with changed revision notes, checks source toggles and
intentional removal, then verifies both videos play in sequence after each save.
It creates Drupal revisions and requires the local Docker site.

Storybook **Molecules / Preview Mobile Screen Card / Phone Preview** provides a standalone, square,
optionally clickable image card inspired by the ICU preview at
<https://fintech.auxility.ca/#cases>. The demo uses four unmodified AMI PNGs in
`src/public/assets/images/projects/ami/`. The accessible link label and destination
are editable story args; the demo links to the funded-accounts screenshot.

`card_url` is optional. A non-empty URL renders an accessible anchor. An empty,
omitted or whitespace-only URL renders a regular `div`, without link attributes,
keyboard focus, pointer cursor or hover feedback. This mode disables phone tilt,
background tracking and hover-to-pause regardless of `follow_cursor`, while
preserving normal media playback and reduced-motion behavior.

The phone and background tile are separate renderers and templates:
`phone-preview.markup.js` renders the device, screen sequence and static poster;
`background-tile.markup.js` renders only the radial-gradient SVG. `card.markup.js`
composes them into the card wrapper. The phone can be reused without the tile
inside a wrapper with `data-cursor-card` for its existing interaction lifecycle.
Pass `data-follow-cursor="false"` on that wrapper for the fixed mode; the composed
card handles this attribute automatically.

`background_mode` selects `gradient` or `transparent`, independently of size.
`display_size: thumbnail` retains the square tile. `native-screen` hugs the phone
with 32px of tilt clearance on every side. At sufficient container width, the
screen itself is exactly 375px or 414px wide, plus the selected era's case:
modern wrappers are 463px/502px wide; classic wrappers are 483px/522px wide.
Smaller containers proportionally reduce the phone. Native previews use 2560px
perspective to keep their larger device within the tilt clearance. Changing size
never stretches the raster or alters the sequence timing.

The outer link stays fixed. The background reuses the authored `background_highlight`
radial gradient directly from the Roundabout Dynamic Thumbnail SVG, without the
decorative squares. It uses the same eased, hover-scoped gradient tracking as
Dynamic Thumbnail. The raster image sits above the background in a responsive
375:812 screen viewport by default. `iphone_era` selects `modern` or `classic`.
Modern compact/large screens are 375:812 and 414:896; classic compact/large screens
are 375:667 and 414:736, with top and bottom bezels, a speaker and a home button.
Classic screens have square corners and no camera island or gesture bar.
The phone geometry is fixed by the selected era and size preset,
independent of the active PNG dimensions. Images use `width: 100%; height: auto`, preserving their
intrinsic proportions, with overflowing content clipped by the screen. Shorter
images extend their final source pixel row down to the screen bottom using a
separate SVG crop. Only that one-pixel strip stretches vertically; the main PNG
stays proportional and unchanged. The strip shares the frame crossfade and
collapses to zero height for full-height or taller images.
The modern SVG phone frame supplies a shaded metal rim, slim glass bezel,
camera island, side buttons, gesture bar, and a soft shadow. There is no home
button or wide top/bottom bezel. The display reaches close to every edge and
has rounded corners that follow the device outline.
Both eras are stylized phone frames rather than exact model replicas.
These curves describe device artwork; the outer card
remains square. The raster screen sits above the frame, with the camera island
and gesture bar above the image. `island_overlay` is a boolean control for modern phones. When enabled, a fixed
band covers the top 56 screen-coordinate pixels, with the Dynamic Island above
it. Still images and the fallback poster fit proportionally below this band;
tall stills shrink uniformly to keep their bottom visible. Scrollable images
continue beneath the fixed band. For raster frames, its fill repeats the first
source pixel row, preserving horizontal color variation without extrapolating
a vertical gradient. Video frames can use `poster_source` for this fill; media
without a raster source retain the white fallback. This uses SVG cropping, not
canvas pixel readback, so cross-origin raster sources do not require CORS. Each `frame_list` entry can override `island_overlay`;
set it to false for images with their own status bar or camera cutout. The overlay
fades with its frame, stays fixed during scrolling, and also applies to video/GIF
frames. Classic phones ignore it. The fallback poster inherits a matching frame's
override, or otherwise uses the main control. AMI account frames disable the
overlay because they already include a status bar. A radial reflection
tracks the pointer along the frame outline without covering the screenshot.
Both screen sizes scale down responsively. The inner screen and frame
follow the pointer, with eased translation capped at 3px in each direction,
and perspective tilt capped at 10 degrees per axis, measured against the phone face rather than
the wider tile so movement over the phone produces a visible response. A 640px perspective makes the
phone face visibly turn toward the cursor without moving the outer card. Both return to center on exit.
Perspective belongs to the fixed outer card; the phone preserves 3D transforms.
Eight rounded chassis slices extend backward by 12px in thumbnails or 32px at native size,
while the screen and camera hardware sit slightly forward of the front frame.
This exposes a shaded metal sidewall when the phone tilts, instead of only a
flat screenshot plane. `follow_cursor: false` keeps the phone facing straight ahead:
it skips phone pointer tracking, gradient tracking, perspective, and depth-slice markup.
The frame sequence, hover pause, link, focus feedback and static poster still work.
Use it for repeated screenshots or slider frames; `is_playing: false` independently
stops the media sequence. Playback already stops while offscreen or when the document
is hidden, and detach releases observers, media clocks and animation handles.
Existing surface, outline, shadow, and motion
tokens supply presentation. Hover lightens the gradient; keyboard focus also
shows an inset outline. Touch visitors get no cursor motion. Reduced-motion
visitors get the first frame with all animation disabled.
Web Animations avoids inline style attributes. Drupal attach/detach support is
included for markup using `data-cursor-card` and `data-card-phone`; no CMS content
or existing portfolio cards are replaced by this standalone example.

The source files, including both independent markup helpers, live in `src/stories/molecules/card/`, with shared styling in
`src/slice/src/scss/molecules/_card.scss` and interaction in
`src/slice/src/js/cursor-card.js`.

A `fallback_source` image provides the static screen poster before enhancement and
when JavaScript is disabled or fails to load. It preserves the source aspect ratio
inside the same phone, gradient and clickable link. Without an explicit fallback,
the renderer uses the first available still image or video poster. Video-only
sequences should supply one. The poster is hidden only when the screen runtime is
ready; detach restores it. This fallback requires rendered HTML: Storybook itself
is a JavaScript application, so no-script verification uses exported card markup.

### Frame sequence controls

`frame_list` is an ordered array of objects editable in Storybook:

- `image_source`, `image_description`: image URL and alternative text.
- `frame_mode`: `still` holds at the top; `scroll` travels down to the image bottom
  and then back up at the same constant speed before advancing; `video` plays an
  embedded recording muted and inline before crossfading to the next frame;
  `gif` plays decoded GIF frames using their original timing.
- `video_source`: URL for a video frame; `poster_source` optionally supplies a
  still preview. `video_fit` defaults to `contain`, showing the complete video;
  `cover` crops its edges to fill the display. Both preserve proportions. Videos
  are not stretched or given the raster bottom-row extension.
- `hold_ms`: fully visible hold at the top before scrolling or fading.
  For video, zero or omitted plays to the end; a positive value limits the
  visible playback duration in milliseconds. A shorter clip holds its final
  frame for the remainder of a configured duration.
- `scroll_speed`: original image pixels per second, independent of preview scale.
- `bottom_hold_ms`: pause at the bottom before returning to the top.
- `scroll_behavior`: `continuous` keeps the existing constant-speed motion;
  `swipe` uses alternating eased swipes and short pauses, a small white bottom
  overscroll with a 360ms snap-back, and a 900ms eased return to the top.
- `scroll_start`: `bottom` starts swipe frames at their lower edge, returns to
  the top first, then swipes down. `top` is the default. Swipe timing is based
  on viewport-sized gestures rather than `scroll_speed`. Reduced motion still
  shows the static first frame without scrolling.

`fade_duration_ms` controls the crossfade between frames, separate from hold time.
`is_playing: false` stops playback and shows the first frame. The default order
is splash (900ms), PIN (1800ms), empty accounts (1800ms initial hold), and funded
accounts (2200ms initial hold), with a 450ms crossfade. Both account frames are configured to scroll
at 70 source pixels/second, pausing for 800ms and 1000ms at the bottom respectively.
The fifth demo frame is `src/public/assets/videos/skatch-app-list.mp4`, copied
unchanged from the supplied recording found in Downloads. It plays to the end.
Its 1280:720 canvas contains a centered portrait recording with black margins;
the demo uses `video_fit: cover` to crop those margins inside the phone.
The sixth frame is the supplied 375:667 Skatch map/list GIF, held for 4000ms
(two original 2000ms cycles). Its 28 frames are stored losslessly in a WebP strip;
the original GIF is retained. The accompanying `map-list-gif.json` provides
`gif_sprite_source`, `gif_frame_width`, `gif_frame_height` and
`gif_frame_durations`. Use `scripts/prepare-screen-gif.py` with Pillow to prepare
other GIFs. A sprite lets GIF playback freeze at the exact frame, unlike a native
animated image. Its bottom pixel row extends to fill short displays too.

Hover temporarily pauses the sequence's current hold, scroll, video,
and GIF position; leaving resumes from that point. An in-progress crossfade finishes
to the next fully visible screen before its hold pauses. This does not change the saved
`is_playing` control, which remains the master switch. Cursor tilt and lighting
continue while the screen content is paused. Touch input does not trigger this
hover pause. Reduced motion resets everything to the first still frame.
Inactive videos are paused; restarting playback resets them to the beginning.
Reduced motion, offscreen/hidden state, and detach stop video playback along with
the image sequence. The theme build copies the videos directory to theme assets.
The supplied 375:812 account screens fit the default screen exactly, so they do
not need scrolling; longer replacement images still scroll. The shorter splash
and PIN images fill the remaining space with their bottom pixel row instead of
resizing the device or stretching the full screenshot.
Scrolling only runs when the image exceeds the viewport height. The first frame
returns after the last frame. Images decode before playback; no image is resized
by the animation. `screen-sequence.js` handles playback and cancels animations
on detach, resize, reduced-motion changes, and when hidden/offscreen, restarting
at the first frame when playback becomes available again.

## CMS SVG thumbnails

Projects and Articles have an optional, translatable **Dynamic thumbnail** SVG
file field, provided by `jurenites_dynamic_thumbnail`. On the Project edit form,
the SVG upload and raster image upload share the **Hero image** section. The
raster upload is labeled for the detail page and the SVG upload for card previews;
their storage and upload controls remain independent. It replaces the Image
field in Project teasers and Article teaser / Blog list previews. The entire SVG preview links to the content detail page and has visible hover
and keyboard-focus feedback. The original
Image remains available for full pages and as the preview fallback when the
SVG is cleared or invalid. The existing Game of Life preview retains priority.

### Author in Figma and replace independently

Use a frame of any positive dimensions. Its exported `viewBox` determines the
thumbnail's aspect ratio and motion distances; 384 by 192 is no longer required.
Arrange sibling groups in this example hierarchy (Figma displays frontmost first):

```text
Thumbnail frame
  level_5           nearest artwork
  level_2_right     another object at depth 2
  level_2_left      object at depth 2
  level_0_horizontal  optional wide background photo
  background        full-frame rectangle with a radial fill
```

Any nonnegative integer depth is supported, with no fixed layer-count limit.
Missing levels are allowed. Higher numbers move and tilt more; movement is
normalized across the distinct depths present so adding levels cannot make the
maximum movement larger. Separate groups sharing a number move identically.
Use unique names, such as `level_1_left` and `level_1_right`, rather than duplicate
SVG IDs. Keep named depth groups as siblings, since nested moving groups compound
their transforms. Ordinary child groups, masks and transforms remain intact.
`background` stays fixed. The optional `_horizontal` suffix limits a layer to
horizontal translation without tilt, bounded by its artwork overflow. Make a
photo wider than the frame to provide room for this movement.

Export the frame as SVG with **Include “id” attribute** and **Outline text**
enabled. The first setting preserves layer names; the second avoids font
requirements and unsupported live text elements. Use a full-frame radial-filled
rectangle as the bottom background, optionally in a group named `background`.
Its radial gradient is detected automatically; do not rename Figma's generated
gradient IDs manually. Its ellipse, size, colors and stops are retained while the
runtime controls its center. Author its center at the top-left for the same
starting appearance without JavaScript. An explicitly named radial gradient
`background_highlight` is also supported for hand-authored SVGs.

Upload the new file in the Project or Article **Dynamic thumbnail** field and
save the content. No preparation script or theme rebuild is required for future
exports following this convention.

Figma export references: [SVG export options](https://help.figma.com/hc/en-us/articles/13402894554519-Export-formats-and-settings-for-static-designs)
and [ID/text export behavior](https://developers.figma.com/docs/plugins/api/ExportSettings/).

No placeholder or empty depth groups are required. If no named depth groups
survive export, the renderer keeps the foreground artwork together at level_1.
It does not guess which paths originally belonged to different editor layers.
A leading full-frame rectangle with a radial fill is recognized as a background;
its gradient is cloned for cursor tracking so shared artwork gradients remain
unchanged. The recognized background rectangle stays fixed, including solid and embedded-image pattern fills. If there is
no background gradient, only the foreground motion runs. Preserve the SVG paths, masks, filters, and image
references inside each group. The upload validator permits passive vector
artwork and embedded PNG/JPEG/WebP images; it rejects scripts, event handlers,
styles, external references, and unsupported SVG elements. This accepts the
supplied unmodified `originals/accountia.svg`, whose export contains paths but
no layer names or groups. The renderer validates
again and namespaces IDs, including gradient, mask, and embedded-image references.
The outer SVG has no presentational width, height, or style attributes; internal
SVG dimensions describe artwork geometry.

The source exports are preserved in
`src/public/assets/images/dynamic-thumbnails/originals/`. Run
`python3 scripts/prepare-dynamic-thumbnails.py` to create the prepared files in
the parent directory. The exports did not retain named depth groups, so the
preparation script groups their existing artwork: font grids / guides / glyphs,
SMEP's two spheres at level_1 / small details and orbit at level_2, and Oksenate's horizontal photo layer /
lettering / seal. Original artwork colors remain in SVG assets. Oksenate has no
authored background gradient, so it has no cursor highlight. SMEP's prepared legacy
asset intentionally keeps the approved yellow background treatment; a fresh export
should put that radial fill on the main frame to reproduce it. A radial fill on a
`level_N` layer remains artwork and is never automatically turned into a background
highlight. The renderer does not invent gradients when the frame has none.

## Interaction

The highlight starts in the upper-left corner. A mouse or hovering pen moves
its center only while the pointer is inside that thumbnail. All content movement
and tilt also respond only inside the thumbnail. The gradient follows with
viscous, exponential easing: it trails the cursor and slows as it approaches.
On exit the gradient eases back to the top-left and layers return to neutral.
Other thumbnails stay still. Each content layer moves a little farther and
tilts a little more with increasing depth. The fixed highlight does not tilt. Oksenate’s raster photo uses `level_0` with
class `dynamic-thumbnail__layer--horizontal`: it moves horizontally only, up to
1/32 of the viewBox width and limited by its existing left/right overflow. It never shifts
vertically or tilts, preserving full coverage of the thumbnail.
The thumbnail keeps its natural viewBox proportion and square clipping boundary.

Touch-only devices and reduced-motion visitors see a still composition. The
artwork also renders without JavaScript. Changing the reduced-motion preference
resets the motion and highlight. Window blur / leaving the browser also returns the thumbnail to rest. Drupal attach/detach handles dynamic content and cleans up
animations and event listeners. Animation uses Web Animations, without inline
style attributes. Existing card hover and keyboard-focus feedback is retained.

## Installation and verification

Enable `jurenites_dynamic_thumbnail` to add the optional fields and form widgets.
For the four current local Project aliases, explicitly run
`drush php:script scripts/seed-dynamic-thumbnails.php`. This saves new revisions,
keeps original images, and skips filled dynamic fields. It is not an automatic
update hook: later editorial replacements and clears remain authoritative.
On another database, review the aliases in the seed script before running it.

Run `npm run build:theme` and `drush cr` after source changes. Assigning a newly
prepared SVG is an editorial upload; rebuilding assets alone does not replace a
file already stored in Drupal.

Checks:

- `drush php:script tests/dynamic-thumbnail.php`: SVG validation, all four Project
  teasers, unsaved Article previews without an Image, and cleared-field fallback.
- `PLAYWRIGHT_BROWSERS_PATH=.cache/ms-playwright node tests/dynamic-thumbnail.browser.mjs`:
  live local Portfolio, proportions, independent depth, hover-only motion, eased tracking and return, reduced
  motion, mobile, and JavaScript errors. Screenshots go to
  `outputs/dynamic-thumbnails/`.
- Storybook: **Molecules / Dynamic Thumbnail**, with one example per artwork.

Storybook initializes each rendered phone after mounting, including replacements
created by control changes. Removing a preview detaches only its own cursor,
sequence and background runtimes. Switching size or toggling `follow_cursor`
therefore does not require a remount or reload.

## SMEP project description previews

The local English and Russian SMEP descriptions include four independent classic iPhone thumbnail
sequences, distributed after the element-card inspiration, interface beginnings,
learning-through-interaction, and ongoing-development sections. They use the
shared phone card renderer, gradient background, hover tilt, and reduced
motion fallback. Playback pauses only while the pointer is over the phone itself,
not the surrounding thumbnail. These phones are not links because the screens
are already shown in the page. The original screen slider and authored prose remain intact.

`scripts/build-smep-previews.mjs [source-directory]` imports the four supplied
folders (`real_screens`, `abstract_screens`, `details_orbitals`, `Guideline`) in
natural filename order. All 63 images remain unchanged in their respective
`src/public/assets/images/projects/smep/` subfolders. Generated CMS markup is in
`generated/content/smep/previews.json`; rebuild theme assets before insertion.
`scripts/update-smep-previews.php` checks the project and four section UUIDs,
backs up existing content, and creates new paragraph/node revisions in a
transaction. It skips a project that already contains SMEP previews, preserving
later CMS edits. The `data-phone-preview` wrappers protect the embedded markup
in CKEditor. `scripts/add-smep-translated-previews.php` adds missing previews to
the matching Russian sections while preserving translated prose and existing previews.
These are explicit local content operations, not deployment hooks.

Phone screenshots, poster images and their edge fills round fractional widths up
to whole CSS pixels with a hairline of overscan per side, centered inside the
clipped screen. Cursor tilt
coalesces pointer events into animation frames, caches geometry until resize,
scroll or pointer exit, and reuses one animation effect. Tracking stops when
settled; exit returns to rest, and reduced motion disables tracking.
