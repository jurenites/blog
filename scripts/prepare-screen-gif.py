"""Prepare a lossless, pausable GIF sprite and manifest for mobile screen cards.

Requires Pillow. Example:
  python3 scripts/prepare-screen-gif.py input.gif src/public/assets/images/projects/skatch/map-list /assets/images/projects/skatch/map-list
"""
import argparse
import json
from pathlib import Path
import shutil
from PIL import Image


def prepare_gif(source_path, output_base, public_base):
    output_base.parent.mkdir(parents=True, exist_ok=True)
    shutil.copy2(source_path, str(output_base) + '-animation.gif')
    with Image.open(source_path) as gif_image:
        frame_width, frame_height = gif_image.size
        sprite_image = Image.new('RGBA', (frame_width * gif_image.n_frames, frame_height))
        frame_durations = []
        for frame_index in range(gif_image.n_frames):
            gif_image.seek(frame_index)
            sprite_image.paste(gif_image.convert('RGBA'), (frame_index * frame_width, 0))
            frame_durations.append(max(10, gif_image.info.get('duration', 100)))
        sprite_image.save(str(output_base) + '-sprite.webp', lossless=True)
        gif_image.seek(0)
        gif_image.convert('RGBA').save(str(output_base) + '-poster.png')
    manifest_values = {
        'gif_source': public_base + '-animation.gif',
        'gif_sprite_source': public_base + '-sprite.webp',
        'gif_frame_width': frame_width,
        'gif_frame_height': frame_height,
        'gif_frame_durations': frame_durations,
    }
    Path(str(output_base) + '-gif.json').write_text(json.dumps(manifest_values, indent=2) + '\n')


if __name__ == '__main__':
    argument_parser = argparse.ArgumentParser(description=__doc__)
    argument_parser.add_argument('source_path', type=Path)
    argument_parser.add_argument('output_base', type=Path)
    argument_parser.add_argument('public_base')
    script_arguments = argument_parser.parse_args()
    prepare_gif(script_arguments.source_path, script_arguments.output_base, script_arguments.public_base)
