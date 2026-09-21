"""Render resumable frames, lighting checks, and an H.264 video in Blender."""
import bpy
import sys
from pathlib import Path

OUTPUT_ROOT = Path(__file__).resolve().parent
SCRIPT_ARGS = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else ['frames']
RENDER_MODE = SCRIPT_ARGS[0]
scene_data = bpy.context.scene
device_prefs = bpy.context.preferences.addons['cycles'].preferences
device_prefs.compute_device_type = 'METAL'
device_prefs.get_devices()
for render_device in device_prefs.devices:
    render_device.use = render_device.type == 'METAL'
scene_data.cycles.device = 'GPU'
scene_data.render.use_persistent_data = True

if RENDER_MODE in ('checks', 'frames', 'still'):
    if RENDER_MODE == 'checks':
        render_frames = [1, 96, 192]
        scene_data.render.resolution_percentage = 60
        scene_data.cycles.samples = 24
    elif RENDER_MODE == 'still':
        render_frames = [48]
        scene_data.cycles.samples = 96
    else:
        render_frames = range(1, 193)
    for frame_number in render_frames:
        frame_path = OUTPUT_ROOT / 'frames' / ('frame-%04d.png' % frame_number)
        if RENDER_MODE == 'checks':
            frame_path = OUTPUT_ROOT / ('check-%04d.png' % frame_number)
        elif RENDER_MODE == 'still':
            frame_path = OUTPUT_ROOT / 'ceramic-logo-still.png'
        if RENDER_MODE == 'frames' and frame_path.exists():
            continue
        scene_data.frame_set(frame_number)
        scene_data.render.filepath = str(frame_path)
        bpy.ops.render.render(write_still=True)
        print('FRAME_COMPLETE', frame_number, flush=True)
elif RENDER_MODE == 'encode':
    frame_paths = [OUTPUT_ROOT / 'frames' / ('frame-%04d.png' % frame_number) for frame_number in range(1, 193)]
    assert all(frame_path.exists() for frame_path in frame_paths), 'Animation frames are incomplete'
    encode_scene = bpy.data.scenes.new('Encode ceramic logo')
    bpy.context.window.scene = encode_scene
    encode_scene.render.resolution_x = 1080
    encode_scene.render.resolution_y = 1080
    encode_scene.render.resolution_percentage = 100
    encode_scene.render.fps = 24
    encode_scene.frame_start = 1
    encode_scene.frame_end = 192
    encode_scene.view_settings.view_transform = 'Standard'
    sequence_editor = encode_scene.sequence_editor_create()
    image_strip = sequence_editor.strips.new_image('Ceramic rendered frames', str(frame_paths[0]), 1, 1)
    for frame_path in frame_paths[1:]:
        image_strip.elements.append(frame_path.name)
    image_strip.frame_final_duration = 192
    encode_scene.render.image_settings.media_type = 'VIDEO'
    encode_scene.render.image_settings.file_format = 'FFMPEG'
    encode_scene.render.ffmpeg.format = 'MPEG4'
    encode_scene.render.ffmpeg.codec = 'H264'
    encode_scene.render.ffmpeg.constant_rate_factor = 'HIGH'
    encode_scene.render.ffmpeg.audio_codec = 'NONE'
    encode_scene.render.filepath = str(OUTPUT_ROOT / 'ceramic-logo-8s.mp4')
    bpy.ops.render.render(animation=True)
    print('VIDEO_COMPLETE', flush=True)
else:
    raise ValueError('Use checks, frames, still or encode')
