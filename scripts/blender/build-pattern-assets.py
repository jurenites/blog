"""Export the editorial stripe motif using existing project color tokens."""
import re
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parents[2]
OUTPUT_ROOT = PROJECT_ROOT / 'output/thumbnail-studio'
PALETTE_VALUES = dict(re.findall(r'^    ([a-z-]+): "(#[0-9a-fA-F]{6})"', (PROJECT_ROOT/'src/token/tokens.yaml').read_text(), re.M))
OUTPUT_ROOT.mkdir(parents=True, exist_ok=True)
for output_name, include_background in [('signal-stripes.svg', False), ('signal-background.svg', True)]:
    background_markup = '<rect width="1600" height="1000" fill="%s"/>' % PALETTE_VALUES['dark-black'] if include_background else ''
    stripe_markup = ''.join('<rect x="-350" y="%s" width="2300" height="20"/>' % (380+stripe_index*64) for stripe_index in range(7))
    output_text = '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 1000">
<title>Jurenites Signal / Layers diagonal gradient bands</title>
<desc>Generated from src/token/tokens.yaml by build-pattern-assets.py.</desc>
<defs><linearGradient id="signal-gradient" x1="0" y1="0" x2="1" y2="0">
<stop offset="0" stop-color="%s"/><stop offset="1" stop-color="%s"/>
</linearGradient></defs>%s
<g transform="rotate(-22 800 500)" fill="url(#signal-gradient)">%s</g>
</svg>\n''' % (PALETTE_VALUES['brand-primary']+'55', PALETTE_VALUES['brand-secondary']+'55', background_markup, stripe_markup)
    (OUTPUT_ROOT/output_name).write_text(output_text)
print('Generated stripe assets from project tokens')
