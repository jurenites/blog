"""Decode the exported MP4 in Blender and record delivery metadata."""
import bpy
import json
import struct
import numpy as numpy_array
from pathlib import Path

OUTPUT_ROOT = Path(__file__).resolve().parent
VIDEO_PATH = OUTPUT_ROOT / 'ceramic-logo-8s.mp4'
video_bytes = VIDEO_PATH.read_bytes()


def read_atoms(start_offset, end_offset):
    while start_offset + 8 <= end_offset:
        atom_size, atom_kind = struct.unpack_from('>I4s', video_bytes, start_offset)
        header_size = 8
        if atom_size == 1:
            atom_size = struct.unpack_from('>Q', video_bytes, start_offset + 8)[0]
            header_size = 16
        elif atom_size == 0:
            atom_size = end_offset - start_offset
        assert atom_size >= header_size
        yield atom_kind, start_offset + header_size, start_offset + atom_size
        start_offset += atom_size


movie_start, movie_end = next((atom_start, atom_end) for atom_kind, atom_start, atom_end in read_atoms(0, len(video_bytes)) if atom_kind == b'moov')
header_start = next(atom_start for atom_kind, atom_start, atom_end in read_atoms(movie_start, movie_end) if atom_kind == b'mvhd')
header_version = video_bytes[header_start]
if header_version == 0:
    time_scale, duration_ticks = struct.unpack_from('>II', video_bytes, header_start + 12)
else:
    time_scale, duration_ticks = struct.unpack_from('>IQ', video_bytes, header_start + 20)
video_duration = duration_ticks / time_scale
movie_clip = bpy.data.movieclips.load(str(VIDEO_PATH))
scene_data = bpy.data.scenes.new('Verify exported movie')
bpy.context.window.scene = scene_data
scene_data.render.resolution_x = 1080
scene_data.render.resolution_y = 1080
scene_data.render.resolution_percentage = 100
scene_data.render.fps = 24
scene_data.render.image_settings.file_format = 'PNG'
scene_data.view_settings.view_transform = 'Standard'
sequence_editor = scene_data.sequence_editor_create()
movie_strip = sequence_editor.strips.new_movie('Exported MP4', str(VIDEO_PATH), 1, 1)
assert movie_strip.frame_duration == 192
assert abs(video_duration - 8.0) < 0.001
frame_errors = {}
for frame_number in (1, 96, 192):
    scene_data.frame_set(frame_number)
    scene_data.render.filepath = str(OUTPUT_ROOT / ('video-check-%04d.png' % frame_number))
    bpy.ops.render.render(write_still=True)
    source_image = bpy.data.images.load(str(OUTPUT_ROOT / 'frames' / ('frame-%04d.png' % frame_number)))
    decoded_image = bpy.data.images.load(scene_data.render.filepath)
    source_pixels = numpy_array.empty(1080 * 1080 * 4, dtype=numpy_array.float32)
    decoded_pixels = numpy_array.empty_like(source_pixels)
    source_image.pixels.foreach_get(source_pixels)
    decoded_image.pixels.foreach_get(decoded_pixels)
    frame_errors[str(frame_number)] = float(numpy_array.abs(source_pixels.reshape(-1, 4)[:, :3] - decoded_pixels.reshape(-1, 4)[:, :3]).mean())
    bpy.data.images.remove(source_image)
    bpy.data.images.remove(decoded_image)
validation_data = {'video': VIDEO_PATH.name, 'duration_seconds': video_duration, 'frame_count': movie_strip.frame_duration, 'dimensions': list(movie_clip.size), 'fps': 24, 'decoded_check_frames': [1, 96, 192], 'file_bytes': len(video_bytes)}
validation_data['mean_pixel_error_vs_render'] = frame_errors
assert validation_data['dimensions'] == [1080, 1080]
assert max(frame_errors.values()) < 0.03, 'Encoded video differs unexpectedly from source renders'
(OUTPUT_ROOT / 'video-validation.json').write_text(json.dumps(validation_data, indent=2))
print('VIDEO_VERIFIED', json.dumps(validation_data), flush=True)
