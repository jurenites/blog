# Thumbnail studio: Signal / Layers

A proposed editorial identity for Jurenites, delivered as a local Blender starter
kit. This is an art-direction sample; it has not been applied to Drupal or
Storybook. The laptop now uses jackbaeten’s downloaded MacBook Pro M3 model under CC BY
4.0. The monitor and phone remain original simplified Apple-inspired shapes.
None of these assets is presented as official Apple CAD.

## The visual signature

Use a dark blue-black stage, satin aluminum, seven parallel diagonal bands with
a cyan-to-magenta gradient, and a consistent gentle Dutch angle. Colors come
from `src/token/tokens.yaml`; the scene generator reads the existing palette.
Pale yellow is reserved for small labels in the portrait demo.

- Make the interface the subject. Use one device per cover and two or three
  meaningful UI fragments, not a cloud of unrelated windows.
- Keep the stripe angle and spacing consistent across a series. Let the motif
  live behind the device or in the margin; preserve screen contrast.
- Start with a 55mm camera, a -9 degree roll and a three-quarter view. Reserve
  more extreme angles for occasional feature images.
- Keep lifted desktop panels about 25–55mm in front of the display. The small
  phone uses 10–18mm gaps so layers remain close to its physical scale.
- Use the same crop and a still from the animation for the video poster. The
  starter uses 8:5, with 1600×1000 stills and 768×480 preview clips. Reframe
  separately for square or portrait covers instead of blindly cropping them.
- Pair real photographs with CGI through the same angle, cool shadow colors,
  stripe motif and restrained accent light. Real photographs should retain
  their texture and character.

The stripes are also supplied as `signal-stripes.svg` and
`signal-background.svg` in the output folder. They can be placed over or behind
photographs in a design/compositing application. The transparent variant uses
low-alpha gradient colors derived from the project tokens.

## Open the kit

Open `output/thumbnail-studio/jurenites-thumbnail-studio.blend`.
Select one of these scenes in Blender's Scene selector:

1. **01 MONITOR - Signal Layers**: aluminum display, stand, screen and two layers.
2. **02 LAPTOP - Signal Layers**: sourced MacBook Pro M3 with its original
   keyboard, enclosure, ports and materials, plus two floating layers. This is
   the default scene on opening.
3. **03 PHONE - Signal Layers**: portrait handset with a procedural sample UI and
   two floating cards.

Each scene has numbered Device, Floating UI, Studio and Camera collections.
Hardware collections are marked as assets. Use File → Append → this blend →
Collection to reuse one in another file, or add its folder as an Asset Library.
Textures and the mono font are packed in the file. A `START HERE` text block is
included for reference without leaving Blender.

Use the rendered PNGs to judge the finished appearance. The file opens in Solid
viewport mode for responsiveness; switch to Rendered shading to inspect the
lighting. Render Image (F12) produces a still. Timeline playback previews object
motion but may run below realtime depending on viewport shading.

## Replace the interface

The monitor and laptop use the packed Oksenate screenshot already present in
this repository. The laptop has an independent **MACBOOK SCREEN** material and
UVs fitted to the actual display, with letterboxing to preserve image proportions. It demonstrates replacement and perspective, not a completed
layer decomposition. Their two floating fragments deliberately use crops of
the same screenshot, so the base currently contains duplicate content.

1. Select the screen mesh and open the Shading workspace.
2. For the laptop, select **MacBook Display - replace screenshot** and edit
   **MACBOOK SCREEN - replace image here**. The monitor and floating demo crops
   still use **SCREEN - replace image here**. Use Open on **REPLACE_SCREENSHOT**
   to load your image. Update the floating-card material separately when needed.
3. For finished layers, export the base screen with the lifted elements removed,
   plus each lifted element as an individual PNG with transparency. Keep the
   original element's canvas bounds so its scale is easy to reproduce.
4. Duplicate the screen material for each floating image plane, load its PNG,
   and reset that plane's UVs to the whole 0–1 image. The sample planes use
   cropped UV coordinates; merely loading a new PNG would keep the old crop.
5. Match each plane's physical width/height to the PNG aspect ratio. Scale or
   hide its separate cyan backing frame; hide that frame for irregular cutouts
   so the backing does not fill their transparent areas.
6. Preserve each card’s animation and its parent. The laptop cards inherit
   **UI PIVOT - aligned with sourced MacBook display**. This controls the UI
   only; the downloaded hardware retains its original open-lid pose.
7. File → External Data → Pack Resources, then Save As your project-specific file.

The phone includes a hidden **OPTIONAL PHONE TEXTURE** object with full-image
UVs. Its **PHONE SCREEN** material is independent. Load a portrait screenshot
(1170×2532 is a suitable starting canvas), enable the object in viewport and
render, and hide the procedural demo text, stripes and lower caption. Keep the
hardware, black glass, island and home indicator as appropriate for your UI.
The optional screenshot plane has square corners; supply transparent corners
in the PNG if you need an exact fit inside the handset glass.

For animated interface content, an Image Texture can use a movie or image
sequence. Use a matching 24fps source, set its duration and start frame, and
check Auto Refresh. Movie textures are external dependencies: retain them next
to your project rather than assuming a packed still-image workflow includes
them. See Blender's [image settings](https://docs.blender.org/manual/en/latest/editors/image/image_settings.html).

## Motion and rendering

The loop is **192 frames / 24fps = eight seconds**. Camera position and roll,
the cyan rim light and floating panels return to their starting state at frame
193. That closing frame is excluded from the export to avoid a repeated frame.
The animation is a small cyclic drift, not a large orbit or a transition between
different devices. Each scene has its own loop.

The camera uses f/8 and a named focus target. The subtle depth of field should
keep the screen and nearby layers readable; adjust the focus target and aperture
when reframing. See Blender's [camera controls](https://docs.blender.org/manual/en/latest/render/cameras.html).

The master uses Cycles. Stills use 48 samples with denoising; the small motion
previews use Eevee with 16 temporal samples. These are review previews rather than final
production resolution. For publication, increase the output size and sample
count after approving the composition. Render PNG sequences first, then encode
H.264; interrupted frame rendering can be resumed without starting over.

From the repository root on this Mac:

```sh
/Applications/Blender.app/Contents/MacOS/Blender --background --factory-startup --python scripts/blender/build-thumbnail-studio.py
/Applications/Blender.app/Contents/MacOS/Blender --background output/thumbnail-studio/jurenites-thumbnail-studio.blend --python scripts/blender/render-thumbnail-studio.py -- stills
/Applications/Blender.app/Contents/MacOS/Blender --background output/thumbnail-studio/jurenites-thumbnail-studio.blend --python scripts/blender/render-thumbnail-studio.py -- frames laptop
/Applications/Blender.app/Contents/MacOS/Blender --background output/thumbnail-studio/jurenites-thumbnail-studio.blend --python scripts/blender/render-thumbnail-studio.py -- encode laptop
```

Use `monitor` or `phone` instead of `laptop`, or omit the device argument to
process all three. Rebuilding overwrites the starter blend; save custom edits
under another filename. Existing frame PNGs are skipped on resume: use a fresh
frame folder after changing the scene to avoid mixing old and new renders.

## Match your real camera photographs

Start with one strong physical-screen photograph and one matching CGI shot.
Record the camera height, approximate side angle, lens focal length (and sensor
size), roll, screen tilt, light position and crop. Match those in Blender before
introducing camera movement. Use manual exposure, white balance and focus;
check the photographed screen for flicker and moiré before a longer take.

Capture a clean background, the device with a dark screen, and the device with
your interface. Export the same UI layers separately. For a still, perspective
placement can be enough; for a moving photograph, track the screen before
compositing floating 3D layers. A single photograph cannot supply unseen device
surfaces for a free camera orbit. Prefer a short recorded move or a deliberate
cut between photography and CGI when the viewpoint changes substantially.

When these clips are later integrated into the blog, keep a static poster and
respect reduced-motion preferences. Website playback integration is a separate
step from this asset kit.

## Sourced MacBook and credits

The source is [MacBook Pro M3, 16-inch, by jackbaeten](https://sketchfab.com/3d-models/macbook-pro-m3-16-inch-2024-8e34fc2b303144f78490007d91ff57c4),
licensed under [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/).
The original packed download is retained in
`output/thumbnail-studio/source-assets/macbook/original-macbook-pro-m3.blend`.
The user’s Downloads directory is never modified. The previous complete scene
is retained as `jurenites-thumbnail-studio-before-sourced-macbook.blend`.

`replace-macbook-asset.py` imports the original hardware, converts its centimeter
coordinates to meters, fits it into the studio, replaces the display material/UVs,
and aligns the existing floating cards. All used image textures are packed.
The starter generator automatically reapplies this import when the packed
source asset exists, so rebuilding does not leave the placeholder laptop.

Keep the creator, source and license credits with published renders. Copy the
credit from `source-assets/macbook/CREDITS.txt` or the blend’s
**ASSET CREDITS - sourced MacBook** text block, updating its changes statement
to match any additional edits.
