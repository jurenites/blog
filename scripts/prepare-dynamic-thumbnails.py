import xml.etree.ElementTree as ET
from pathlib import Path
SVG_NS='http://www.w3.org/2000/svg'
ET.register_namespace('',SVG_NS)
ET.register_namespace('xlink','http://www.w3.org/1999/xlink')
asset_root=Path('src/public/assets/images/dynamic-thumbnails')
for source_name,asset_name in [('Roudabout-thumnail.svg','roundabout'),('4pixel-thumnail.svg','4pixel'),('SMEP.svg','smep'),('oksenate.svg','oksenate')]:
 svg_root=ET.parse(asset_root/'originals'/source_name).getroot()
 artwork_group=svg_root[0]
 original_parts=list(artwork_group)
 for svg_part in original_parts:artwork_group.remove(svg_part)
 layer_groups={layer_name:ET.SubElement(artwork_group,'{'+SVG_NS+'}g',{'id':layer_name}) for layer_name in ['background','level_0','level_1','level_2']}
 if asset_name=='smep':
  for layer_name in ['level_1_second','level_2_orbit']:
   layer_groups[layer_name]=ET.SubElement(artwork_group,'{'+SVG_NS+'}g',{'id':layer_name})
 for part_index,svg_part in enumerate(original_parts):
  if asset_name in ['roundabout','4pixel']:
   layer_name='background' if part_index==0 else 'level_0' if part_index==1 else 'level_1' if 'stroke' in svg_part.attrib and part_index < 5 else 'level_2'
  elif asset_name=='smep':
   layer_name='background' if part_index<2 else 'level_1' if part_index==2 else 'level_1_second' if part_index==len(original_parts)-3 else 'level_2_orbit' if part_index>len(original_parts)-3 else 'level_2'
  else:
   layer_name='level_0' if part_index==0 else 'level_2' if part_index==15 else 'level_1'
  layer_groups[layer_name].append(svg_part)
 # Background highlight only; keep all illustration gradients unchanged.
 if asset_name in ['roundabout','4pixel','smep']:
  gradient_node=next(svg_root.iter('{'+SVG_NS+'}radialGradient'))
  old_id=gradient_node.get('id'); gradient_node.set('id','background_highlight')
  for svg_part in svg_root.iter():
   if svg_part.get('fill')=='url(#'+old_id+')': svg_part.set('fill','url(#background_highlight)')
  if asset_name=='smep':
   glow_circle=layer_groups['background'][1]
   glow_circle.tag='{'+SVG_NS+'}rect'; glow_circle.attrib.clear(); glow_circle.attrib.update({'width':'384','height':'192','fill':'url(#background_highlight)'})
  gradient_node.set('gradientTransform','translate(0 0) scale(290 240)')
 else:
  # No authored background gradient: preserve the photo without adding a highlight.
  layer_groups['level_0'].set('class','dynamic-thumbnail__layer--horizontal')
 svg_root.attrib.pop('width',None);svg_root.attrib.pop('height',None)
 ET.ElementTree(svg_root).write(asset_root/(asset_name+'.svg'),encoding='unicode')
