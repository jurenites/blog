"""Build a standalone ceramic relief from the supplied orthogonal SVG paths."""
import bpy
import bmesh
import math
import re
import sys
import json
import xml.etree.ElementTree as element_tree
from pathlib import Path
from mathutils import Vector

OUTPUT_ROOT = Path(__file__).resolve().parent
SOURCE_PATH = OUTPUT_ROOT / 'source/user_logo_32.svg'
UNIT_SIZE = 0.01


def parse_outline(path_data):
    path_tokens = re.findall(r'[MHVZmhvz]|-?\d+(?:\.\d+)?', path_data)
    point_list = []
    token_index = 0
    point_x = point_y = 0.0
    while token_index < len(path_tokens):
        command_type = path_tokens[token_index]
        token_index += 1
        if command_type == 'M':
            point_x, point_y = map(float, path_tokens[token_index:token_index + 2])
            token_index += 2
        elif command_type == 'H':
            point_x = float(path_tokens[token_index])
            token_index += 1
        elif command_type == 'V':
            point_y = float(path_tokens[token_index])
            token_index += 1
        elif command_type == 'Z':
            break
        else:
            raise ValueError('Unsupported SVG command: ' + command_type)
        point_list.append((point_x, point_y))
    return point_list


def contains_point(point_x, point_y, outline_points):
    inside_shape = False
    prior_point = outline_points[-1]
    for next_point in outline_points:
        start_x, start_y = prior_point
        end_x, end_y = next_point
        if (start_y > point_y) != (end_y > point_y):
            edge_x = (end_x - start_x) * (point_y - start_y) / (end_y - start_y) + start_x
            if point_x < edge_x:
                inside_shape = not inside_shape
        prior_point = next_point
    return inside_shape


def aim_object(scene_object, target_point):
    scene_object.rotation_euler = (Vector(target_point) - scene_object.location).to_track_quat('-Z', 'Y').to_euler()


def create_ceramic():
    ceramic_material = bpy.data.materials.new('Unglazed white ceramic | fine pores')
    ceramic_material.use_nodes = True
    shader_nodes = ceramic_material.node_tree.nodes
    shader_links = ceramic_material.node_tree.links
    ceramic_shader = shader_nodes.get('Principled BSDF')
    ceramic_shader.inputs['Base Color'].default_value = (0.79, 0.775, 0.745, 1)
    ceramic_shader.inputs['Roughness'].default_value = 0.86
    ceramic_shader.inputs['Specular IOR Level'].default_value = 0.24
    ceramic_shader.inputs['Subsurface Weight'].default_value = 0.018
    coordinate_node = shader_nodes.new('ShaderNodeTexCoord')
    grain_noise = shader_nodes.new('ShaderNodeTexNoise')
    grain_noise.name = 'Ceramic fine grain'
    grain_noise.inputs['Scale'].default_value = 1700
    grain_noise.inputs['Detail'].default_value = 2
    shader_links.new(coordinate_node.outputs['Object'], grain_noise.inputs['Vector'])
    grain_bump = shader_nodes.new('ShaderNodeBump')
    grain_bump.inputs['Strength'].default_value = 0.42
    grain_bump.inputs['Distance'].default_value = 0.00024
    shader_links.new(grain_noise.outputs['Fac'], grain_bump.inputs['Height'])
    pore_texture = shader_nodes.new('ShaderNodeTexVoronoi')
    pore_texture.name = 'Scattered pinhole pores'
    pore_texture.inputs['Scale'].default_value = 630
    shader_links.new(coordinate_node.outputs['Object'], pore_texture.inputs['Vector'])
    pore_ramp = shader_nodes.new('ShaderNodeValToRGB')
    pore_ramp.color_ramp.elements[0].position = 0.055
    pore_ramp.color_ramp.elements[1].position = 0.17
    shader_links.new(pore_texture.outputs['Distance'], pore_ramp.inputs['Fac'])
    pore_bump = shader_nodes.new('ShaderNodeBump')
    pore_bump.inputs['Strength'].default_value = 0.48
    pore_bump.inputs['Distance'].default_value = 0.00035
    shader_links.new(pore_ramp.outputs['Color'], pore_bump.inputs['Height'])
    shader_links.new(grain_bump.outputs['Normal'], pore_bump.inputs['Normal'])
    shader_links.new(pore_bump.outputs['Normal'], ceramic_shader.inputs['Normal'])
    return ceramic_material


# This script runs in a separate factory-startup Blender process.
bpy.ops.object.select_all(action='SELECT')
bpy.ops.object.delete(use_global=False)
scene_data = bpy.context.scene
scene_data.name = 'Ceramic logo | overhead light sweep'
scene_data.unit_settings.system = 'METRIC'
scene_data.unit_settings.length_unit = 'CENTIMETERS'
outline_list = [parse_outline(path_node.attrib['d']) for path_node in element_tree.parse(SOURCE_PATH).getroot().findall('{http://www.w3.org/2000/svg}path')]
height_grid = [[-16 if any(contains_point(column_number + 0.5, row_number + 0.5, outline_points) for outline_points in outline_list) else -15 for column_number in range(32)] for row_number in range(32)]
vertex_list, face_list, vertex_lookup = [], [], {}


def add_face(point_list):
    face_indices = []
    for point_data in point_list:
        if point_data not in vertex_lookup:
            vertex_lookup[point_data] = len(vertex_list)
            vertex_list.append(tuple(axis_value * UNIT_SIZE for axis_value in point_data))
        face_indices.append(vertex_lookup[point_data])
    face_list.append(face_indices)


for row_number in range(32):
    for column_number in range(32):
        left_x, right_x = column_number - 16, column_number - 15
        top_z, bottom_z = 16 - row_number, 15 - row_number
        front_y = height_grid[row_number][column_number]
        add_face([(left_x, front_y, top_z), (right_x, front_y, top_z), (right_x, front_y, bottom_z), (left_x, front_y, bottom_z)])
        if column_number < 31:
            next_depth = height_grid[row_number][column_number + 1]
            if front_y != next_depth:
                add_face([(right_x, front_y, bottom_z), (right_x, front_y, top_z), (right_x, next_depth, top_z), (right_x, next_depth, bottom_z)])
        if row_number < 31:
            next_depth = height_grid[row_number + 1][column_number]
            if front_y != next_depth:
                add_face([(left_x, front_y, bottom_z), (right_x, front_y, bottom_z), (right_x, next_depth, bottom_z), (left_x, next_depth, bottom_z)])
        if column_number == 0:
            add_face([(left_x, front_y, bottom_z), (left_x, front_y, top_z), (left_x, 16, top_z), (left_x, 16, bottom_z)])
        if column_number == 31:
            add_face([(right_x, front_y, top_z), (right_x, front_y, bottom_z), (right_x, 16, bottom_z), (right_x, 16, top_z)])
        if row_number == 0:
            add_face([(left_x, front_y, top_z), (right_x, front_y, top_z), (right_x, 16, top_z), (left_x, 16, top_z)])
        if row_number == 31:
            add_face([(right_x, front_y, bottom_z), (left_x, front_y, bottom_z), (left_x, 16, bottom_z), (right_x, 16, bottom_z)])
        add_face([(left_x, 16, bottom_z), (right_x, 16, bottom_z), (right_x, 16, top_z), (left_x, 16, top_z)])

cube_mesh = bpy.data.meshes.new('SVG exact stepped ceramic surface')
cube_mesh.from_pydata(vertex_list, [], face_list)
cube_mesh.update()
edit_mesh = bmesh.new()
edit_mesh.from_mesh(cube_mesh)
# Split coplanar edges at depth transitions before welding the height field.
bmesh.ops.remove_doubles(edit_mesh, verts=list(edit_mesh.verts), dist=0.000001)
bmesh.ops.dissolve_limit(edit_mesh, angle_limit=0.001, verts=list(edit_mesh.verts), edges=list(edit_mesh.edges), delimit={'NORMAL'})
bmesh.ops.recalc_face_normals(edit_mesh, faces=list(edit_mesh.faces))
non_manifold_count = sum(not mesh_edge.is_manifold for mesh_edge in edit_mesh.edges)
edit_mesh.to_mesh(cube_mesh)
edit_mesh.free()
cube_object = bpy.data.objects.new('32 cm cube | 1 cm carved relief', cube_mesh)
scene_data.collection.objects.link(cube_object)
cube_object.data.materials.append(create_ceramic())
cube_object['original_cube_size_cm'] = 32
cube_object['relief_depth_cm'] = 1
cube_object['source_artwork'] = SOURCE_PATH.name
cube_object['construction'] = 'Front background carved 1 cm; SVG black paths remain proud at original cube surface.'
edge_bevel = cube_object.modifiers.new('Very lightly softened ceramic edges', 'BEVEL')
edge_bevel.width = 0.00035
edge_bevel.segments = 3
edge_bevel.limit_method = 'ANGLE'
edge_bevel.harden_normals = True
normal_modifier = cube_object.modifiers.new('Keep ceramic faces planar', 'WEIGHTED_NORMAL')
normal_modifier.keep_sharp = True

camera_data = bpy.data.cameras.new('Fixed perspective | 70 mm')
camera_object = bpy.data.objects.new('Fixed close-up camera', camera_data)
scene_data.collection.objects.link(camera_object)
camera_object.location = (0.25, -0.91, 0.21)
aim_object(camera_object, (0.008, -0.12, 0.006))
camera_data.type = 'PERSP'
camera_data.lens = 70
camera_data.clip_start = 0.01
scene_data.camera = camera_object

light_data = bpy.data.lights.new('Ceiling spotlight', 'SPOT')
light_object = bpy.data.objects.new('Ceiling spotlight | left to right', light_data)
scene_data.collection.objects.link(light_object)
light_data.energy = 55
light_data.spot_size = math.radians(78)
light_data.spot_blend = 0.55
light_data.shadow_soft_size = 0.008
for frame_number, light_x in [(1, -0.48), (192, 0.48)]:
    light_object.location = (light_x, -0.34, 0.55)
    aim_object(light_object, (0, -0.15, 0))
    light_object.keyframe_insert(data_path='location', frame=frame_number)
    light_object.keyframe_insert(data_path='rotation_euler', frame=frame_number)
# Per-frame aim avoids Euler interpolation pointing away from the subject.
for frame_number in range(1, 193):
    normalized_time = (frame_number - 1) / 191
    smooth_time = normalized_time * normalized_time * (3 - 2 * normalized_time)
    light_object.location = (-0.48 + 0.96 * smooth_time, -0.34, 0.55)
    aim_object(light_object, (0, -0.15, 0))
    light_object.keyframe_insert(data_path='location', frame=frame_number)
    light_object.keyframe_insert(data_path='rotation_euler', frame=frame_number)

scene_data.world.use_nodes = True
scene_data.world.node_tree.nodes.get('Background').inputs['Color'].default_value = (0.8, 0.84, 1.0, 1)
scene_data.world.node_tree.nodes.get('Background').inputs['Strength'].default_value = 0.012
scene_data.render.engine = 'CYCLES'
device_prefs = bpy.context.preferences.addons['cycles'].preferences
device_prefs.compute_device_type = 'METAL'
device_prefs.get_devices()
for render_device in device_prefs.devices:
    render_device.use = render_device.type == 'METAL'
scene_data.cycles.device = 'GPU'
scene_data.cycles.samples = 64
scene_data.cycles.use_denoising = True
scene_data.cycles.adaptive_threshold = 0.04
scene_data.cycles.max_bounces = 5
scene_data.render.resolution_x = 1080
scene_data.render.resolution_y = 1080
scene_data.render.resolution_percentage = 100
scene_data.render.fps = 24
scene_data.frame_start = 1
scene_data.frame_end = 192
scene_data.render.image_settings.file_format = 'PNG'
scene_data.render.image_settings.color_mode = 'RGB'
scene_data.render.film_transparent = False
scene_data.view_settings.view_transform = 'AgX'
scene_data.view_settings.look = 'AgX - Medium High Contrast'
scene_data.view_settings.exposure = 0.5
scene_data.frame_set(48)
scene_data.render.filepath = str(OUTPUT_ROOT / 'ceramic-logo-still.png')
bpy.context.view_layer.objects.active = cube_object
cube_object.select_set(True)
for screen_data in bpy.data.screens:
    for area_data in screen_data.areas:
        if area_data.type == 'VIEW_3D':
            area_data.spaces.active.region_3d.view_perspective = 'CAMERA'
readme_text = bpy.data.texts.new('READ ME | ceramic logo')
readme_text.write('32 cm cube; front background carved down 1 cm around exact SVG mark. Matte unglazed ceramic. Fixed 70 mm perspective camera. Ceiling spotlight sweeps left to right over 192 frames at 24 fps. Source SVG is beside this file. The entire model and surface are editable.\n')
validation_data = {'size_m': list(cube_object.dimensions), 'relief_m': 0.01, 'non_manifold_edges': non_manifold_count, 'svg_paths': len(outline_list), 'raised_grid_cells': sum(depth_value == -16 for row_values in height_grid for depth_value in row_values), 'camera_type': camera_data.type, 'camera_animated': camera_object.animation_data is not None, 'frames': 192, 'fps': 24}
(OUTPUT_ROOT / 'scene-validation.json').write_text(json.dumps(validation_data, indent=2))
bpy.ops.wm.save_as_mainfile(filepath=str(OUTPUT_ROOT / 'ceramic-logo.blend'))
if '--preview' in sys.argv:
    scene_data.render.resolution_percentage = 60
    scene_data.cycles.samples = 24
    bpy.ops.render.render(write_still=True)
print('CERAMIC_SCENE_READY', json.dumps(validation_data), flush=True)
