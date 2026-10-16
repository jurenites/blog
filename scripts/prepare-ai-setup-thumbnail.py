"""Preserve the supplied globe paths; add passive routes for the theme runtime."""
import json
from pathlib import Path
import xml.etree.ElementTree as ET

PROJECT_ROOT = Path(__file__).resolve().parent.parent
ASSET_ROOT = PROJECT_ROOT / 'src/public/assets/images/dynamic-thumbnails'
SVG_NAMESPACE = 'http://www.w3.org/2000/svg'
ET.register_namespace('', SVG_NAMESPACE)
palette_registry = json.loads((PROJECT_ROOT / 'generated/token/color-mappings.json').read_text())['palette_registry']


def palette_color(color_name):
    return palette_registry['--color-palette-' + color_name]['value']


def svg_element(parent_node, element_name, element_attributes):
    return ET.SubElement(parent_node, '{' + SVG_NAMESPACE + '}' + element_name, element_attributes)


svg_root = ET.parse(ASSET_ROOT / 'originals/rack-thumnail.svg').getroot()
artwork_group = svg_root[0]
original_parts = list(artwork_group)
for original_part in original_parts:
    artwork_group.remove(original_part)
background_group = svg_element(artwork_group, 'g', {'id': 'background'})
background_group.append(original_parts[0])
shadow_group = svg_element(artwork_group, 'g', {'id': 'level_0'})
shadow_group.append(original_parts[3])
globe_group = svg_element(artwork_group, 'g', {'id': 'level_1'})
globe_group.extend(original_parts[1:3])

# Approximate land positions in the supplied orthographic artwork.
# One raised arc per connection: Washington, DC -> Germany -> UAE.
# Routes and endpoints share the globe's depth so connections remain attached.
washington_point = (145, 53)
germany_point = (223, 45)
emirates_point = (257, 65)
route_paths = [
    [washington_point, (115, -2), (226, -10), germany_point],
    [germany_point, (242, -14), (335, 8), emirates_point],
]
for route_index, route_points in enumerate(route_paths):
    route_path = 'M{} {} C{} {} {} {} {} {}'.format(*[point_value for point_pair in route_points for point_value in point_pair])
    route_group = svg_element(globe_group, 'g', {'id': 'connection_' + str(route_index)})
    svg_element(route_group, 'path', {
        'class': 'dynamic-thumbnail__packet-route',
        'd': route_path, 'stroke': palette_color('brand-tertiary'),
        'stroke-width': '0.75', 'stroke-opacity': '0.45',
    })
    for packet_index in range(3):
        path_fraction = 0.3 + packet_index * 0.2
        curve_weights = [(1 - path_fraction) ** 3, 3 * (1 - path_fraction) ** 2 * path_fraction,
                         3 * (1 - path_fraction) * path_fraction ** 2, path_fraction ** 3]
        point_x, point_y = [sum(point_pair[axis_index] * curve_weight for point_pair, curve_weight in zip(route_points, curve_weights)) for axis_index in range(2)]
        packet_group = svg_element(route_group, 'g', {
            'class': 'dynamic-thumbnail__packet', 'transform': f'translate({point_x:.3f} {point_y:.3f})',
        })
        svg_element(packet_group, 'rect', {
            'x': '-3', 'y': '-2.5', 'width': '6', 'height': '5',
            'fill': palette_color('dark-black'), 'stroke': palette_color('brand-tertiary'),
            'stroke-width': '0.75',
        })
        svg_element(packet_group, 'path', {
            'd': 'M-1.5 -0.75 H1.5 M-1.5 0.75 H0.5',
            'stroke': palette_color('brand-tertiary'), 'stroke-width': '0.6',
        })
for point_x, point_y in [washington_point, germany_point, emirates_point]:
    svg_element(globe_group, 'rect', {
        'class': 'dynamic-thumbnail__endpoint',
        'x': str(point_x - 3), 'y': str(point_y - 3), 'width': '6', 'height': '6',
        'fill': palette_color('dark-black'), 'stroke': palette_color('brand-tertiary'),
        'stroke-width': '1',
    })
caption_group = svg_element(artwork_group, 'g', {'id': 'level_2'})
caption_offset = svg_element(caption_group, 'g', {'transform': 'translate(0 34)'})
caption_offset.append(original_parts[4])
gradient_node = next(svg_root.iter('{' + SVG_NAMESPACE + '}radialGradient'))
gradient_node.set('id', 'background_highlight')
original_parts[0].set('fill', 'url(#background_highlight)')
svg_root.attrib.pop('width', None)
svg_root.attrib.pop('height', None)
ET.indent(svg_root, space='  ')
ET.ElementTree(svg_root).write(ASSET_ROOT / 'ai-setup.svg', encoding='unicode')
