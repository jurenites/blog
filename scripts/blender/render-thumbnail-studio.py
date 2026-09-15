"""Render kit proofs, stills, PNG animation frames, or encode existing frames.
Blender -b output/thumbnail-studio/jurenites-thumbnail-studio.blend
  --python scripts/blender/render-thumbnail-studio.py -- stills|proof|frames|encode [laptop|monitor|phone]
"""
import bpy
import sys
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parents[2]
OUTPUT_ROOT = PROJECT_ROOT / 'output/thumbnail-studio'
SCRIPT_ARGS = sys.argv[sys.argv.index('--')+1:] if '--' in sys.argv else ['stills']
RENDER_MODE = SCRIPT_ARGS[0]
DEVICE_FILTER = SCRIPT_ARGS[1] if len(SCRIPT_ARGS)>1 else None
SCENE_LIST = [scene_data for scene_data in bpy.data.scenes if scene_data.get('device_type') and (not DEVICE_FILTER or scene_data['device_type'] == DEVICE_FILTER)]
if not SCENE_LIST:
    raise ValueError('No matching device scene')
for scene_data in SCENE_LIST:
    device_kind = scene_data['device_type']
    bpy.context.window.scene = scene_data
    if RENDER_MODE == 'stills':
        scene_data.render.engine = 'CYCLES'
        scene_data.cycles.samples = 48
        scene_data.render.resolution_percentage = 100
        scene_data.render.filepath = str(OUTPUT_ROOT / 'renders' / (device_kind + '-still.png'))
        scene_data.frame_set(1)
        bpy.ops.render.render(write_still=True)
    elif RENDER_MODE in ('proof', 'frames'):
        scene_data.render.engine = 'BLENDER_EEVEE'
        scene_data.eevee.taa_render_samples = 16
        scene_data.render.resolution_percentage = 48
        frame_directory = OUTPUT_ROOT / 'renders' / (device_kind + '-frames')
        frame_directory.mkdir(exist_ok=True)
        scene_data.render.filepath = str(frame_directory / 'frame-')
        if RENDER_MODE == 'proof':
            scene_data.render.filepath = str(OUTPUT_ROOT / 'renders' / (device_kind + '-animation-proof.png'))
            bpy.ops.render.render(write_still=True)
        else:
            # Per-frame rendering lets a restarted job resume its completed images.
            for frame_number in range(1,193):
                frame_path = frame_directory / ('frame-%04d.png' % frame_number)
                if frame_path.exists():
                    continue
                scene_data.frame_set(frame_number)
                scene_data.render.filepath = str(frame_path)
                bpy.ops.render.render(write_still=True)
            print('FRAMES_COMPLETE', device_kind, flush=True)
    elif RENDER_MODE == 'encode':
        frame_directory = OUTPUT_ROOT / 'renders' / (device_kind + '-frames')
        frame_paths = [frame_directory / ('frame-%04d.png' % frame_number) for frame_number in range(1,193)]
        missing_paths = [frame_path for frame_path in frame_paths if not frame_path.exists()]
        if missing_paths:
            raise RuntimeError('Missing animation frames: %s' % len(missing_paths))
        encode_scene = bpy.data.scenes.new('ENCODE - ' + device_kind)
        bpy.context.window.scene = encode_scene
        encode_scene.render.resolution_x = 768
        encode_scene.render.resolution_y = 480
        encode_scene.render.resolution_percentage = 100
        encode_scene.render.fps = 24
        encode_scene.frame_start = 1
        encode_scene.frame_end = 192
        encode_scene.view_settings.view_transform = 'Standard'
        sequence_editor = encode_scene.sequence_editor_create()
        image_strip = sequence_editor.strips.new_image('Rendered PNG frames',str(frame_paths[0]),1,1)
        for frame_path in frame_paths[1:]:
            image_strip.elements.append(frame_path.name)
        image_strip.frame_final_duration = 192
        if hasattr(encode_scene.render.image_settings, 'media_type'):
            encode_scene.render.image_settings.media_type = 'VIDEO'
        encode_scene.render.image_settings.file_format = 'FFMPEG'
        encode_scene.render.ffmpeg.format = 'MPEG4'
        encode_scene.render.ffmpeg.codec = 'H264'
        encode_scene.render.ffmpeg.constant_rate_factor = 'HIGH'
        encode_scene.render.ffmpeg.audio_codec = 'NONE'
        encode_scene.render.filepath = str(OUTPUT_ROOT / (device_kind + '-8s.mp4'))
        bpy.ops.render.render(animation=True)
        print('VIDEO_COMPLETE', device_kind, flush=True)
    else:
        raise ValueError('Use stills, proof, frames or encode')
