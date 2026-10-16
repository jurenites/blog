"""Prepare the named Figma drawing for passive SVG upload and staged elevation."""
from pathlib import Path
import xml.etree.ElementTree as element_tree

project_root = Path(__file__).resolve().parents[1]
asset_directory = project_root / 'src/public/assets/images/dynamic-thumbnails'
source_root = element_tree.parse(asset_directory / 'originals/presentation-thumbnail.svg').getroot()
svg_namespace = 'http://www.w3.org/2000/svg'
element_tree.register_namespace('', svg_namespace)
source_nodes = {shape_node.get('id'): shape_node for shape_node in source_root.iter() if shape_node.get('id')}
required_names = ['presentation-thumnail', 'layer_0', 'layer_1', 'layer_2', 'Table View', 'Dialogbox',
                  'guide 1', 'guide 1_2', 'guide 1_3', 'guide-description', 'Section Label',
                  'guide 2', 'guide 2_2', 'guide', 'Name']
if any(node_name not in source_nodes for node_name in required_names):
    raise ValueError('Named artwork changed: review its semantic layer mapping.')
source_root.attrib.pop('width', None)
source_root.attrib.pop('height', None)
scene_group = source_nodes['presentation-thumnail']
scene_group.set('class', 'dynamic-thumbnail__elevation-scene')
for layer_index, role_name in enumerate(['body', 'table', 'dialog']):
    layer_group = source_nodes[f'layer_{layer_index}']
    layer_group.set('id', f'level_{layer_index}')
    layer_group.set('class', f'dynamic-thumbnail__elevation-{role_name}')

# Guides stay in scene coordinates while each surface moves independently.
parent_nodes = {child_node: parent_node for parent_node in source_root.iter() for child_node in parent_node}
for guide_number, role_name, guide_names in [
    (1, 'table', ['guide 1', 'guide 1_2', 'guide 1_3', 'guide-description', 'Section Label']),
    (2, 'dialog', ['guide 2', 'guide 2_2', 'guide', 'Name']),
]:
    guide_group = element_tree.SubElement(scene_group, f'{{{svg_namespace}}}g', {
        'id': f'guide_{guide_number}', 'class': f'dynamic-thumbnail__elevation-guide-{role_name}'})
    for guide_name in guide_names:
        guide_node = source_nodes[guide_name]
        parent_nodes[guide_node].remove(guide_node)
        guide_group.append(guide_node)
source_nodes['guide 1'].set('class', 'dynamic-thumbnail__elevation-height-table')
# The right-hand dialog guide is 25 units; the left line is a shorter 20-unit detail.
source_nodes['guide 2_2'].set('class', 'dynamic-thumbnail__elevation-height-dialog')
for gradient_node in source_root.iter(f'{{{svg_namespace}}}radialGradient'):
    old_reference = f"url(#{gradient_node.get('id')})"
    gradient_node.set('id', 'background_highlight')
    for shape_node in source_root.iter():
        if shape_node.get('fill') == old_reference:
            shape_node.set('fill', 'url(#background_highlight)')
    break
element_tree.indent(source_root, space='  ')
output_path = asset_directory / 'presentation-ux.svg'
output_path.write_text(element_tree.tostring(source_root, encoding='unicode') + '\n')
print(output_path)
