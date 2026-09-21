# Ceramic logo light study

An eight-second Blender animation based on the supplied `user_logo_32.svg`.

Git retains the small editable `.blend` scene, Python scripts, this README,
and source SVG. Rendered frames, stills, videos, validation reports, Blender
backup files, and Python caches are local outputs excluded by `.gitignore`.
Back up local outputs separately if they must be preserved across machines.

- `ceramic-logo-8s.mp4`: 1080 × 1080, H.264, 24 fps, 192 frames, silent.
- `ceramic-logo-still.png`: full-resolution still from frame 48.
- `ceramic-logo.blend`: editable geometry, procedural ceramic shader, camera, and animated light.
- `source/user_logo_32.svg`: unchanged copy of the supplied artwork.

One SVG unit is one centimeter. The original cube envelope is 32 × 32 × 32 cm.
The front background is recessed one centimeter, leaving the black SVG paths
standing at the original front plane. The original 32 × 32 artwork margins and
all eight paths are preserved. The other cube faces are plain ceramic.

The surface uses matte off-white ceramic, fine grain and pinhole bump detail,
with lightly softened physical edges. The centered 70 mm perspective camera
is stationary and slightly above and to the right of the front face. One
overhead spotlight travels left to right, easing into and out of its sweep.
The world provides a very faint ambient fill; no room details appear in frame.
The clip is a single sweep, not a seamless loop.

The source artwork has three diagonal corner contacts. These are retained in
the rendering mesh and reported by the topology check as non-manifold edges.
This file is a visual animation asset, not a manufacturing mesh.

Rebuild in Blender 5.2:

```sh
/Applications/Blender.app/Contents/MacOS/Blender --background --factory-startup --python output/ceramic-logo/build-ceramic-logo.py
/Applications/Blender.app/Contents/MacOS/Blender --background output/ceramic-logo/ceramic-logo.blend --python output/ceramic-logo/render-ceramic-logo.py -- frames
/Applications/Blender.app/Contents/MacOS/Blender --background output/ceramic-logo/ceramic-logo.blend --python output/ceramic-logo/render-ceramic-logo.py -- encode
```

Run commands from the repository root. Rendering uses the Mac's Metal GPU.
The frame renderer resumes by skipping existing frame PNGs. Move previous
frames aside before rendering changes to geometry, material, light, or camera.
Use `checks` for three small lighting proofs and `still` for the 96-sample still.
