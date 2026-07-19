# About Me Page

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
