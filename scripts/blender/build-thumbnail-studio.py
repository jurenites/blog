"""Build the editable Jurenites Signal / Layers device kit in Blender 5.2.
Run with Blender --background --factory-startup --python this-file.py.
Colors are read from the project's editable token source; no downloaded models.
"""
import bpy
import math
import re
import runpy
from pathlib import Path
from mathutils import Vector, Quaternion

PROJECT_ROOT = Path(__file__).resolve().parents[2]
OUTPUT_ROOT = PROJECT_ROOT / 'output' / 'thumbnail-studio'
TOKEN_SOURCE = PROJECT_ROOT / 'src/token/tokens.yaml'
SCREEN_SOURCE = PROJECT_ROOT / 'src/public/assets/images/projects/oksenate/homepage-2026-09-11.png'
FONT_SOURCE = PROJECT_ROOT / 'src/public/assets/fonts/ubuntu-sans-mono-regular.ttf'
PALETTE_VALUES = dict(re.findall(r'^    ([a-z-]+): "(#[0-9a-fA-F]{6})"', TOKEN_SOURCE.read_text(), re.M))
FRAME_COUNT = 192
OUTPUT_ROOT.mkdir(parents=True, exist_ok=True)
(OUTPUT_ROOT / 'renders').mkdir(exist_ok=True)
runpy.run_path(str(Path(__file__).with_name('build-pattern-assets.py')))


def token_color(token_name, linear_space=True):
    color_text = PALETTE_VALUES[token_name].lstrip('#')
    color_values = [int(color_text[color_index:color_index + 2], 16) / 255 for color_index in (0, 2, 4)]
    if linear_space:
        color_values = [color_value / 12.92 if color_value <= 0.04045 else ((color_value + 0.055) / 1.055) ** 2.4 for color_value in color_values]
    return (*color_values, 1)


def solid_material(material_name, token_name, metallic_value=0, roughness_value=0.4, emission_value=0):
    material_data = bpy.data.materials.new(material_name)
    material_data.use_nodes = True
    shader_node = material_data.node_tree.nodes.get('Principled BSDF')
    shader_node.inputs['Base Color'].default_value = token_color(token_name)
    shader_node.inputs['Metallic'].default_value = metallic_value
    shader_node.inputs['Roughness'].default_value = roughness_value
    shader_node.inputs['Emission Color'].default_value = token_color(token_name)
    shader_node.inputs['Emission Strength'].default_value = emission_value
    material_data.diffuse_color = token_color(token_name)
    return material_data


def activate_collection(collection_name):
    collection_data = bpy.data.collections.new(collection_name)
    bpy.context.scene.collection.children.link(collection_data)
    return collection_data


def move_collection(object_data, collection_data):
    for previous_collection in list(object_data.users_collection):
        previous_collection.objects.unlink(object_data)
    collection_data.objects.link(object_data)
    return object_data


def rounded_box(object_name, object_location, object_dimensions, material_data, collection_data, bevel_size=0.003):
    bpy.ops.mesh.primitive_cube_add(size=1, location=object_location)
    object_data = bpy.context.object
    object_data.name = object_name
    object_data.dimensions = object_dimensions
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    object_data.data.materials.append(material_data)
    if bevel_size:
        bevel_modifier = object_data.modifiers.new('Machined edge radius', 'BEVEL')
        bevel_modifier.width = bevel_size
        bevel_modifier.segments = 4
        object_data.modifiers.new('Weighted surface normals', 'WEIGHTED_NORMAL')
    move_collection(object_data, collection_data)
    return object_data


def screen_plane(object_name, object_location, plane_width, plane_height, material_data, collection_data, crop_bounds=(0, 0, 1, 1)):
    mesh_data = bpy.data.meshes.new(object_name + ' mesh')
    mesh_data.from_pydata([(-plane_width/2, 0, -plane_height/2), (plane_width/2, 0, -plane_height/2), (plane_width/2, 0, plane_height/2), (-plane_width/2, 0, plane_height/2)], [], [(0, 1, 2, 3)])
    mesh_data.uv_layers.new(name='Screen UV')
    left_edge, bottom_edge, right_edge, top_edge = crop_bounds
    for loop_index, uv_value in enumerate([(left_edge,bottom_edge),(right_edge,bottom_edge),(right_edge,top_edge),(left_edge,top_edge)]):
        mesh_data.uv_layers.active.data[loop_index].uv = uv_value
    object_data = bpy.data.objects.new(object_name, mesh_data)
    collection_data.objects.link(object_data)
    object_data.location = object_location
    object_data.data.materials.append(material_data)
    return object_data


def text_object(object_name, text_body, object_location, text_size, material_data, collection_data):
    curve_data = bpy.data.curves.new(object_name + ' font', 'FONT')
    curve_data.body = text_body
    curve_data.size = text_size
    curve_data.font = DISPLAY_FONT
    object_data = bpy.data.objects.new(object_name, curve_data)
    collection_data.objects.link(object_data)
    object_data.location = object_location
    object_data.rotation_euler = (math.pi/2, 0, 0)
    object_data.data.materials.append(material_data)
    return object_data


def aim_camera(object_data, target_location, roll_degrees=0):
    direction_vector = Vector(target_location) - object_data.location
    object_data.rotation_mode = 'QUATERNION'
    object_data.rotation_quaternion = direction_vector.to_track_quat('-Z', 'Y') @ Quaternion((0, 0, 1), math.radians(roll_degrees))


def area_light(light_name, light_location, target_location, light_power, light_size, token_name, collection_data):
    light_data = bpy.data.lights.new(light_name, 'AREA')
    light_data.energy = light_power
    light_data.shape = 'DISK'
    light_data.size = light_size
    light_data.color = token_color(token_name, False)[:3]
    object_data = bpy.data.objects.new(light_name, light_data)
    collection_data.objects.link(object_data)
    object_data.location = light_location
    aim_camera(object_data, target_location)
    return object_data


def keyframe_float(object_data, rest_location, amount_value, phase_value=0):
    for frame_number in range(1, FRAME_COUNT + 2, 12):
        phase_angle = (frame_number-1) / FRAME_COUNT * math.tau
        object_data.location = Vector(rest_location) + Vector((0, -amount_value * math.sin(phase_angle + phase_value), amount_value * 0.35 * math.sin(phase_angle + phase_value)))
        object_data.keyframe_insert(data_path='location', frame=frame_number)


def floating_panel(panel_name, panel_location, panel_width, panel_height, crop_bounds, collection_data, phase_value=0):
    frame_object = rounded_box(panel_name + ' edge', panel_location, (panel_width+0.0018, 0.0014, panel_height+0.0018), FRAME_MATERIAL, collection_data, 0.0006)
    image_location = (panel_location[0], panel_location[1]-0.0009, panel_location[2])
    panel_object = screen_plane(panel_name + ' image - replace texture', image_location, panel_width, panel_height, SCREEN_MATERIAL, collection_data, crop_bounds)
    for object_data in (frame_object, panel_object):
        keyframe_float(object_data, object_data.location.copy(), 0.003, phase_value)
    panel_object['replacement_tip'] = 'This sample uses UV crops of the screenshot. For real projects use separate RGBA exports and reset UVs to the full image.'
    return panel_object


def gradient_material():
    material_data = bpy.data.materials.new('Signal stripes - cyan to magenta tokens')
    material_data.use_nodes = True
    material_nodes = material_data.node_tree.nodes
    material_nodes.clear()
    output_node = material_nodes.new('ShaderNodeOutputMaterial')
    emission_node = material_nodes.new('ShaderNodeEmission')
    emission_node.inputs['Strength'].default_value = 0.3
    texture_node = material_nodes.new('ShaderNodeTexCoord')
    separate_node = material_nodes.new('ShaderNodeSeparateXYZ')
    ramp_node = material_nodes.new('ShaderNodeValToRGB')
    ramp_node.color_ramp.elements[0].color = token_color('brand-primary')
    ramp_node.color_ramp.elements[1].color = token_color('brand-secondary')
    material_data.node_tree.links.new(texture_node.outputs['Generated'], separate_node.inputs[0])
    material_data.node_tree.links.new(separate_node.outputs['X'], ramp_node.inputs[0])
    material_data.node_tree.links.new(ramp_node.outputs[0], emission_node.inputs[0])
    material_data.node_tree.links.new(emission_node.outputs[0], output_node.inputs[0])
    return material_data


def studio_scene(scene_name, subject_width, target_height, device_kind):
    scene_data = bpy.data.scenes.new(scene_name)
    bpy.context.window.scene = scene_data
    scene_data.render.engine = 'CYCLES'
    scene_data.cycles.samples = 24
    scene_data.cycles.use_denoising = True
    scene_data.cycles.max_bounces = 5
    scene_data.render.resolution_x = 1600
    scene_data.render.resolution_y = 1000
    scene_data.render.resolution_percentage = 100
    scene_data.render.fps = 24
    scene_data.frame_start = 1
    scene_data.frame_end = FRAME_COUNT
    scene_data.render.image_settings.file_format = 'PNG'
    scene_data.render.image_settings.color_mode = 'RGBA'
    scene_data.render.film_transparent = False
    scene_data.view_settings.view_transform = 'AgX'
    scene_data.world = bpy.data.worlds.new(scene_name + ' world')
    scene_data.world.use_nodes = True
    scene_data.world.node_tree.nodes['Background'].inputs[0].default_value = token_color('pale-gray')
    scene_data.world.node_tree.nodes['Background'].inputs[1].default_value = 0.10
    scene_data.unit_settings.system = 'METRIC'
    device_collection = activate_collection('01 DEVICE - ' + device_kind)
    layer_collection = activate_collection('02 FLOATING UI - ' + device_kind)
    studio_collection = activate_collection('03 STUDIO - ' + device_kind)
    camera_collection = activate_collection('04 CAMERA AND TYPE - ' + device_kind)
    target_location = (0, -subject_width*0.1, target_height)
    rounded_box('Infinite matte stage', (0, 0, -0.02), (200, 200, 0.035), FLOOR_MATERIAL, studio_collection, 0)
    # A back wall with independent ribbon meshes makes the signature editable.
    rounded_box('Dark cyclorama wall', (0, subject_width*0.65, subject_width), (subject_width*10, 0.01, subject_width*6), FLOOR_MATERIAL, studio_collection, 0)
    for stripe_index in range(7):
        stripe_object = rounded_box('Signal ribbon %02d' % (stripe_index+1), (-subject_width*0.3, subject_width*0.62, target_height+(stripe_index-3)*subject_width*0.071), (subject_width*3.8, 0.001, subject_width*0.016), STRIPE_MATERIAL, studio_collection, 0)
        stripe_object.rotation_euler[1] = math.radians(-22)
    camera_data = bpy.data.cameras.new('Editorial camera - 55mm - Dutch minus 9 degrees')
    camera_object = bpy.data.objects.new('CAMERA - subtle 8 second loop', camera_data)
    camera_collection.objects.link(camera_object)
    camera_data.lens = 55
    camera_data.clip_start = 0.001
    camera_data.clip_end = 250
    scene_data.camera = camera_object
    for frame_number in range(1, FRAME_COUNT+2, 12):
        phase_angle = (frame_number-1) / FRAME_COUNT * math.tau
        camera_object.location = (subject_width*(1.6+0.055*math.sin(phase_angle)), -subject_width*(2.65+0.035*math.cos(phase_angle)), target_height+subject_width*0.92)
        if device_kind == 'phone':
            camera_object.location = Vector(target_location) + (camera_object.location - Vector(target_location)) * 1.7
        aim_camera(camera_object, target_location, -9 + 0.6*math.sin(phase_angle))
        camera_object.keyframe_insert(data_path='location', frame=frame_number)
        camera_object.keyframe_insert(data_path='rotation_quaternion', frame=frame_number)
    focus_object = bpy.data.objects.new('FOCUS - screen and floating cards', None)
    camera_collection.objects.link(focus_object)
    focus_object.location = target_location
    camera_data.dof.use_dof = True
    camera_data.dof.focus_object = focus_object
    camera_data.dof.aperture_fstop = 8
    key_light = area_light('KEY - large neutral softbox', (-subject_width, -subject_width*1.3, subject_width*2.5), target_location, 140*subject_width**2, subject_width*1.5, 'full-white', studio_collection)
    rim_light = area_light('RIM - moving cyan softbox', (subject_width, subject_width*0.15, subject_width*1.6), target_location, 120*subject_width**2, subject_width, 'brand-primary', studio_collection)
    area_light('FILL - magenta edge', (-subject_width*1.3, subject_width*0.2, subject_width), target_location, 45*subject_width**2, subject_width*0.7, 'brand-secondary', studio_collection)
    for frame_number in range(1, FRAME_COUNT+2, 12):
        phase_angle = (frame_number-1) / FRAME_COUNT * math.tau
        rim_light.location.x = subject_width*(1 + 0.25*math.sin(phase_angle))
        aim_camera(rim_light, target_location)
        rim_light.keyframe_insert(data_path='location', frame=frame_number)
        rim_light.keyframe_insert(data_path='rotation_quaternion', frame=frame_number)
    scene_data['read_me'] = 'See packed START HERE text. Units are meters. UI gaps are 25-55mm. 192 frames at 24fps = 8 seconds. Frame 193 is the unrendered loop closure.'
    scene_data['device_type'] = device_kind
    scene_data.render.filepath = '//renders/' + device_kind + '-'
    scene_data.frame_set(1)
    return scene_data, device_collection, layer_collection, camera_collection


bpy.ops.wm.read_factory_settings(use_empty=True)
DISPLAY_FONT = bpy.data.fonts.load(str(FONT_SOURCE))
DISPLAY_FONT.pack()
ALUMINUM_MATERIAL = solid_material('Satin aluminum - pale gray token', 'pale-gray', 0.82, 0.25)
DARK_METAL_MATERIAL = solid_material('Graphite aluminum - gray token', 'gray', 0.85, 0.27)
BEZEL_MATERIAL = solid_material('Display bezel - full black token', 'full-black', 0.2, 0.23)
KEY_MATERIAL = solid_material('Keyboard keys - light black token', 'light-black', 0.1, 0.38)
FLOOR_MATERIAL = solid_material('Stage - dark black token', 'dark-black', 0.1, 0.5)
FRAME_MATERIAL = solid_material('UI hairline - cyan token', 'brand-primary', 0.3, 0.25, 0.3)
TEXT_MATERIAL = solid_material('UI white text token', 'white', 0, 0.5, 0.8)
ACCENT_MATERIAL = solid_material('UI yellow accent token', 'brand-tertiary', 0, 0.5, 0.8)
STRIPE_MATERIAL = gradient_material()
SCREEN_IMAGE = bpy.data.images.load(str(SCREEN_SOURCE))
SCREEN_IMAGE.name = 'REPLACE - desktop screenshot - Oksenate sample'
SCREEN_IMAGE.pack()
SCREEN_MATERIAL = solid_material('SCREEN - replace image here', 'white', 0, 0.35)
SCREEN_SHADER = SCREEN_MATERIAL.node_tree.nodes.get('Principled BSDF')
SCREEN_TEXTURE = SCREEN_MATERIAL.node_tree.nodes.new('ShaderNodeTexImage')
SCREEN_TEXTURE.name = 'REPLACE_SCREENSHOT'
SCREEN_TEXTURE.label = 'Replace with your screenshot; packed demo included'
SCREEN_TEXTURE.image = SCREEN_IMAGE
SCREEN_MATERIAL.node_tree.links.new(SCREEN_TEXTURE.outputs['Color'], SCREEN_SHADER.inputs['Base Color'])
SCREEN_MATERIAL.node_tree.links.new(SCREEN_TEXTURE.outputs['Color'], SCREEN_SHADER.inputs['Emission Color'])
SCREEN_SHADER.inputs['Emission Strength'].default_value = 0.9
SCREEN_SHADER.inputs['Specular IOR Level'].default_value = 0
SCREEN_MATERIAL.node_tree.links.new(SCREEN_TEXTURE.outputs['Alpha'], SCREEN_SHADER.inputs['Alpha'])

# Monitor: recognizable Studio Display proportions, original simplified geometry.
monitor_scene, device_collection, layer_collection, camera_collection = studio_scene('01 MONITOR - Signal Layers', 0.62, 0.28, 'monitor')
rounded_box('Monitor aluminum enclosure', (0,0,0.32), (0.623,0.022,0.365), ALUMINUM_MATERIAL, device_collection, 0.007)
rounded_box('Monitor black glass border', (0,-0.0115,0.32), (0.611,0.002,0.353), BEZEL_MATERIAL, device_collection, 0.005)
screen_plane('Monitor screen - replace screenshot', (0,-0.013,0.32), 0.588, 0.331, SCREEN_MATERIAL, device_collection)
rounded_box('Monitor foot', (0,0.005,0.012), (0.19,0.16,0.016), ALUMINUM_MATERIAL, device_collection, 0.004)
rounded_box('Monitor stand riser', (0,0.05,0.135), (0.1,0.02,0.25), ALUMINUM_MATERIAL, device_collection, 0.004)
rounded_box('Monitor camera lens', (0,-0.013,0.493), (0.004,0.002,0.004), DARK_METAL_MATERIAL, device_collection, 0.002)
floating_panel('01 Navigation fragment - 25mm forward', (0.025,-0.039,0.424), 0.36, 0.019, (0.18,0.68,0.9,0.75), layer_collection)
floating_panel('02 Hero fragment - 55mm forward', (0.04,-0.068,0.255), 0.48, 0.092, (0.02,0.06,0.98,0.387), layer_collection, 0.8)
device_collection.asset_mark()
device_collection.asset_data.description = 'Original simplified aluminum desktop display. Screen faces -Y. Dimensions approximate; no manufacturer CAD or logo.'

# Laptop: clamshell with hinge, individually editable keys, trackpad and ports.
laptop_scene, device_collection, layer_collection, camera_collection = studio_scene('02 LAPTOP - Signal Layers', 0.36, 0.135, 'laptop')
rounded_box('Laptop lower aluminum unibody', (0,-0.065,0.017), (0.355,0.245,0.018), ALUMINUM_MATERIAL, device_collection, 0.005)
rounded_box('Laptop keyboard well', (0,-0.035,0.027), (0.298,0.105,0.0015), BEZEL_MATERIAL, device_collection, 0.002)
for row_index in range(5):
    for column_index in range(14):
        rounded_box('Keyboard key %02d %02d' % (row_index+1,column_index+1), (-0.136+column_index*0.0209,0.003-row_index*0.019,0.029), (0.018,0.016,0.002), KEY_MATERIAL, device_collection, 0.0015)
rounded_box('Laptop trackpad perimeter', (0,-0.133,0.027), (0.14,0.073,0.001), DARK_METAL_MATERIAL, device_collection, 0.004)
rounded_box('Laptop trackpad surface', (0,-0.133,0.0276), (0.138,0.071,0.0005), ALUMINUM_MATERIAL, device_collection, 0.004)
rounded_box('Laptop continuous hinge', (0,0.047,0.029), (0.31,0.013,0.014), DARK_METAL_MATERIAL, device_collection, 0.006)
lid_parts = []
lid_parts.append(rounded_box('Laptop lid enclosure', (0,0,0.119), (0.355,0.008,0.23), ALUMINUM_MATERIAL, device_collection, 0.004))
lid_parts.append(rounded_box('Laptop lid glass', (0,-0.0045,0.119), (0.346,0.001,0.221), BEZEL_MATERIAL, device_collection, 0.003))
lid_parts.append(screen_plane('Laptop screen - replace screenshot', (0,-0.0052,0.119), 0.331,0.186,SCREEN_MATERIAL,device_collection))
lid_parts.append(rounded_box('Laptop camera notch', (0,-0.006,0.212), (0.025,0.001,0.004), BEZEL_MATERIAL,device_collection,0.001))
lid_pivot = bpy.data.objects.new('LID PIVOT - open angle',None)
device_collection.objects.link(lid_pivot)
lid_pivot.location = (0,0.047,0.029)
lid_pivot.rotation_euler[0] = math.radians(-12)
for object_data in lid_parts:
    object_data.parent = lid_pivot
for port_index in range(2):
    rounded_box('Laptop USB C port %02d' % (port_index+1),(-0.1778,0.012-port_index*0.024,0.018),(0.0006,0.011,0.004),BEZEL_MATERIAL,device_collection,0.001)
# Floating UI shares the exact lid plane before offsetting along its normal.
for panel_name,panel_location,panel_width,panel_height,crop_bounds,phase_value in [
    ('01 Navigation fragment - 25mm forward',(0.005,-0.031,0.177),0.232,0.012,(0.18,0.68,0.9,0.75),0),
    ('02 Hero fragment - 50mm forward',(0.025,-0.056,0.083),0.29,0.057,(0.02,0.06,0.98,0.387),0.8)]:
    existing_names = set(bpy.data.objects.keys())
    floating_panel(panel_name,panel_location,panel_width,panel_height,crop_bounds,layer_collection,phase_value)
    for object_data in layer_collection.objects:
        if object_data.name not in existing_names:
            object_data.parent = lid_pivot
# Parent belongs to device collection; collection asset deliberately includes hardware only.
device_collection.asset_mark()
device_collection.asset_data.description = 'Original simplified Apple-inspired laptop. Editable hinge, keys, trackpad, screen. No official CAD or logo.'

# Phone: a genuine portrait sample rather than squeezing a desktop page.
phone_scene, device_collection, layer_collection, camera_collection = studio_scene('03 PHONE - Signal Layers', 0.105, 0.09, 'phone')
rounded_box('Phone titanium enclosure',(0,0,0.086),(0.077,0.0085,0.159),DARK_METAL_MATERIAL,device_collection,0.009)
rounded_box('Phone black glass',(0,-0.0045,0.086),(0.074,0.001,0.156),BEZEL_MATERIAL,device_collection,0.008)
rounded_box('Phone display canvas - replace with portrait image',(0,-0.0053,0.086),(0.069,0.0005,0.147),FLOOR_MATERIAL,device_collection,0.006)
rounded_box('Phone dynamic island',(0,-0.006,0.150),(0.021,0.0008,0.006),BEZEL_MATERIAL,device_collection,0.003)
text_object('Phone identity','JURENITES',(-0.029,-0.0062,0.136),0.004,TEXT_MATERIAL,device_collection)
text_object('Phone project title','Interfaces\nin motion.',(-0.029,-0.0062,0.113),0.0065,TEXT_MATERIAL,device_collection)
text_object('Phone project caption','DESIGN / ENGINEERING',(-0.029,-0.0062,0.097),0.0028,ACCENT_MATERIAL,device_collection)
for stripe_index in range(5):
    stripe_object = rounded_box('Phone gradient line %02d' % stripe_index, (0,-0.0063,0.077-stripe_index*0.006),(0.056,0.0004,0.0025),STRIPE_MATERIAL,device_collection,0)
text_object('Phone lower caption','Selected work\n2026 — 01',(-0.029,-0.0062,0.028),0.0038,TEXT_MATERIAL,device_collection)
rounded_box('Phone home indicator',(0,-0.0063,0.018),(0.023,0.0005,0.0013),TEXT_MATERIAL,device_collection,0.0006)
for button_index,button_height in enumerate((0.125,0.111)):
    rounded_box('Phone volume button %02d' % button_index,(-0.039,0,button_height),(0.0015,0.003,0.009),ALUMINUM_MATERIAL,device_collection,0.0006)
rounded_box('Phone side button',(0.039,0,0.119),(0.0015,0.003,0.017),ALUMINUM_MATERIAL,device_collection,0.0006)
for layer_index,layer_height in enumerate((0.082,0.047)):
    card_depth = -0.015-layer_index*0.008
    card_object = rounded_box('Phone floating card %02d' % (layer_index+1),(0.011,card_depth,layer_height),(0.073,0.0012,0.025),KEY_MATERIAL,layer_collection,0.001)
    text_body = '01   Fluid systems' if layer_index == 0 else '02   Built to move'
    label_object = text_object('Phone card caption %02d' % layer_index,text_body,(-0.021,card_depth-0.0008,layer_height-0.001),0.0037,TEXT_MATERIAL,layer_collection)
    for object_data in (card_object,label_object):
        keyframe_float(object_data,object_data.location.copy(),0.0008,layer_index*0.8)
device_collection.asset_mark()
device_collection.asset_data.description = 'Original simplified Apple-inspired phone with portrait demo UI. No official CAD or logo.'

# A dedicated replacement material and full-UV portrait surface is supplied hidden.
phone_texture_material = SCREEN_MATERIAL.copy()
phone_texture_material.name = 'PHONE SCREEN - load portrait 1170 x 2532 image'
phone_replacement = screen_plane('OPTIONAL PHONE TEXTURE - unhide and hide sample UI',(0,-0.0065,0.086),0.068,0.147,phone_texture_material,device_collection)
phone_replacement.hide_render = True
phone_replacement.hide_set(True)
phone_replacement['replacement_tip'] = 'Load your portrait screenshot in PHONE SCREEN material; unhide this object in viewport and render. Hide Phone identity, title, caption, lines and lower caption objects.'

readme_text = bpy.data.texts.new('START HERE - Thumbnail Studio')
readme_text.write('''JURENITES / SIGNAL LAYERS\n\nThree scenes: MONITOR, LAPTOP, PHONE. Choose in the top-right Scene selector.\nThe hardware collections are marked as assets. These are original simplified\nApple-inspired models, not official product CAD.\n\nCAMERA: 55mm, -9 degree Dutch angle, f/8.\nANIMATION: 1-192 at 24fps = 8 seconds. Frame 193 closes the loop; do not export it.\nMOTION: camera drift, cyan softbox sweep, restrained UI float.\nDesktop UI layers sit 25-55mm in front of the screen.\n\nREPLACE SCREEN:\nSelect screen > Shading > SCREEN - replace image here > image texture Open.\nUse a 16:9 desktop PNG. Packed Oksenate image is a sample from the repository.\nThe two floating desktop cards use crops of that same image. For your actual\nwork export separate PNGs from Figma (with alpha), duplicate the material for\neach card, set its image and reset its UVs to the full 0..1 square. Hide the\noriginal fragment in the base screenshot to avoid duplication.\n\nPHONE: procedural portrait demo; optional full-UV screen plane is hidden.\nUse a portrait PNG, unhide OPTIONAL PHONE TEXTURE, hide the demo text/stripes.\n\nF12 renders a still. Render Animation exports PNG frames to //renders/.\nMaster is 1600x1000. Preview clips are 768x480, 24fps.\nUse PNG sequences for resumable rendering, then encode H.264.\n\nCOLORS: read from src/token/tokens.yaml when rebuilding. Packed materials\nremain editable for art direction; regenerate to refresh the token palette.\n\nSee docs/thumbnail-studio.md for the photography matching workflow.\n''')
for scene_data in (monitor_scene,laptop_scene,phone_scene):
    scene_data.frame_set(1)
    scene_data.timeline_markers.new('LOOP START / thumbnail',frame=1)
    scene_data.timeline_markers.new('MIDPOINT / light sweep',frame=97)
    scene_data.timeline_markers.new('LOOP CLOSE - excluded',frame=193)
bpy.context.window.scene = laptop_scene
for screen_data in bpy.data.screens:
    for area_data in screen_data.areas:
        if area_data.type == 'VIEW_3D':
            area_data.spaces.active.region_3d.view_perspective = 'CAMERA'
            area_data.spaces.active.shading.type = 'MATERIAL'
# Avoid first-open shader compilation overhead by using material-colored solid view.
for screen_data in bpy.data.screens:
    for area_data in screen_data.areas:
        if area_data.type == 'VIEW_3D':
            area_data.spaces.active.shading.type = 'SOLID'
            area_data.spaces.active.shading.color_type = 'MATERIAL'
bpy.ops.wm.save_as_mainfile(filepath=str(OUTPUT_ROOT/'jurenites-thumbnail-studio.blend'))
# Fast first proof. Separate render script can produce stills and animation.
laptop_scene.render.resolution_percentage = 60
laptop_scene.cycles.samples = 16
laptop_scene.render.engine = 'CYCLES'
laptop_scene.render.filepath = str(OUTPUT_ROOT/'renders/laptop-proof.png')
bpy.ops.render.render(write_still=True)
print('THUMBNAIL_STUDIO_READY', str(OUTPUT_ROOT/'jurenites-thumbnail-studio.blend'))

# Reapply the sourced MacBook whenever its packed asset is available locally.
if (OUTPUT_ROOT / 'source-assets/macbook/original-macbook-pro-m3.blend').exists():
    laptop_scene.render.resolution_percentage = 100
    laptop_scene.cycles.samples = 24
    runpy.run_path(str(Path(__file__).with_name('replace-macbook-asset.py')))
