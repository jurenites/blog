"""Replace the laptop hardware with the downloaded CC BY model by jackbaeten.
Run Blender -b output/thumbnail-studio/jurenites-thumbnail-studio.blend
  --disable-autoexec --python scripts/blender/replace-macbook-asset.py
The packed source is retained locally; the downloaded original is never edited.
"""
import bpy
import json
import math
from pathlib import Path
from mathutils import Matrix, Vector

PROJECT_ROOT = Path(__file__).resolve().parents[2]
OUTPUT_ROOT = PROJECT_ROOT / 'output/thumbnail-studio'
SOURCE_PATH = OUTPUT_ROOT / 'source-assets/macbook/original-macbook-pro-m3.blend'
SOURCE_URL = 'https://sketchfab.com/3d-models/macbook-pro-m3-16-inch-2024-8e34fc2b303144f78490007d91ff57c4'
LICENSE_URL = 'https://creativecommons.org/licenses/by/4.0/'
SCENE_NAME = '02 LAPTOP - Signal Layers'
SOURCE_SCREEN = 'VQmfhbMzfNAuKAD'
LAPTOP_SCENE = bpy.data.scenes[SCENE_NAME]
bpy.context.window.scene = LAPTOP_SCENE
LAPTOP_SCENE.frame_set(1)
DEVICE_COLLECTION = next(collection_data for collection_data in LAPTOP_SCENE.collection.children if collection_data.name.startswith('01 DEVICE'))
LAYER_COLLECTION = next(collection_data for collection_data in LAPTOP_SCENE.collection.children if collection_data.name.startswith('02 FLOATING'))
# The floating panels keep their original local animation channels; a new pivot
# aligns those channels with the sourced display plane.
for object_data in LAYER_COLLECTION.objects:
    object_data.parent = None
for object_data in list(DEVICE_COLLECTION.all_objects):
    bpy.data.objects.remove(object_data, do_unlink=True)
DEVICE_COLLECTION.name = '01 DEVICE - MacBook Pro M3 - jackbaeten'
with bpy.data.libraries.load(str(SOURCE_PATH), link=False) as (source_library, target_library):
    target_library.objects = source_library.objects
IMPORTED_OBJECTS = [object_data for object_data in target_library.objects if object_data]
for object_data in IMPORTED_OBJECTS:
    DEVICE_COLLECTION.objects.link(object_data)
bpy.context.view_layer.update()
SOURCE_MESHES = [object_data for object_data in IMPORTED_OBJECTS if object_data.type == 'MESH']
SOURCE_MATRICES = {object_data:object_data.matrix_world.copy() for object_data in SOURCE_MESHES}
PLACEMENT_MATRIX = Matrix.Translation((0,-0.078,0.013)) @ Matrix.Scale(0.01,4)
MODEL_ROOT = bpy.data.objects.new('MACBOOK ROOT - sourced hardware',None)
DEVICE_COLLECTION.objects.link(MODEL_ROOT)
MODEL_ROOT['creator'] = 'jackbaeten'
MODEL_ROOT['source_url'] = SOURCE_URL
MODEL_ROOT['license'] = 'CC BY 4.0'
MODEL_ROOT['license_url'] = LICENSE_URL
MODEL_ROOT['changes'] = 'Converted source units to meters; placed in studio; replaced screen texture and UV mapping; added separate floating UI and animation.'
IMPORTANT_NAMES = {'VQmfhbMzfNAuKAD':'Display - replace screenshot','XmEJWcRmlkotJdx':'Keyboard and key legends','gBoAkeTtukenhWq':'Trackpad surface','EsQRFXIuhhkXDHc':'Aluminum lid enclosure','eEDJDQDQQpAlFLR':'Aluminum base enclosure','vttfLwUKvlhvIxZ':'Apple lid logo','XlcvJOqSiZcqDDS':'Display bezel'}
for object_data in SOURCE_MESHES:
    original_name = object_data.name
    object_data.data = object_data.data.copy()
    object_data.data.transform(PLACEMENT_MATRIX @ SOURCE_MATRICES[object_data])
    object_data.parent = MODEL_ROOT
    object_data.matrix_parent_inverse = Matrix.Identity(4)
    object_data.matrix_basis = Matrix.Identity(4)
    object_data['source_object_name'] = original_name
    object_data.name = 'MacBook ' + IMPORTANT_NAMES.get(original_name,'part - '+original_name)
    if original_name == SOURCE_SCREEN:
        display_object = object_data
for object_data in IMPORTED_OBJECTS:
    if object_data.type != 'MESH':
        bpy.data.objects.remove(object_data,do_unlink=True)
# Build screen coordinates from its actual vertices rather than the source's
# opaque object names or arbitrary original UV orientation.
DISPLAY_POINTS = [vertex_data.co.copy() for vertex_data in display_object.data.vertices]
MINIMUM_X = min(point_value.x for point_value in DISPLAY_POINTS)
MAXIMUM_X = max(point_value.x for point_value in DISPLAY_POINTS)
MINIMUM_Z = min(point_value.z for point_value in DISPLAY_POINTS)
MAXIMUM_Z = max(point_value.z for point_value in DISPLAY_POINTS)
BOTTOM_POINTS = [point_value for point_value in DISPLAY_POINTS if abs(point_value.z-MINIMUM_Z)<1e-5]
TOP_POINTS = [point_value for point_value in DISPLAY_POINTS if abs(point_value.z-MAXIMUM_Z)<1e-5]
BOTTOM_CENTER = Vector(((MINIMUM_X+MAXIMUM_X)/2,sum(point_value.y for point_value in BOTTOM_POINTS)/len(BOTTOM_POINTS),MINIMUM_Z))
TOP_CENTER = Vector(((MINIMUM_X+MAXIMUM_X)/2,sum(point_value.y for point_value in TOP_POINTS)/len(TOP_POINTS),MAXIMUM_Z))
UP_VECTOR = (TOP_CENTER-BOTTOM_CENTER).normalized()
SCREEN_HEIGHT = (TOP_CENTER-BOTTOM_CENTER).length
SCREEN_WIDTH = MAXIMUM_X-MINIMUM_X
SCREEN_MATERIAL = bpy.data.materials['SCREEN - replace image here'].copy()
SCREEN_MATERIAL.name = 'MACBOOK SCREEN - replace image here'
SCREEN_TEXTURE = SCREEN_MATERIAL.node_tree.nodes['REPLACE_SCREENSHOT']
SCREEN_TEXTURE.extension = 'CLIP'
# Letterbox the existing desktop screenshot without stretching its pixels.
IMAGE_ASPECT = SCREEN_TEXTURE.image.size[0]/SCREEN_TEXTURE.image.size[1]
SCREEN_ASPECT = SCREEN_WIDTH/SCREEN_HEIGHT
UV_LAYER = display_object.data.uv_layers.active or display_object.data.uv_layers.new(name='Screen UV')
for loop_data in display_object.data.loops:
    point_value = display_object.data.vertices[loop_data.vertex_index].co
    vertical_ratio = (point_value-BOTTOM_CENTER).dot(UP_VECTOR)/SCREEN_HEIGHT
    UV_LAYER.data[loop_data.index].uv = ((point_value.x-MINIMUM_X)/SCREEN_WIDTH,(vertical_ratio-0.5)*IMAGE_ASPECT/SCREEN_ASPECT+0.5)
display_object.data.materials.clear()
display_object.data.materials.append(SCREEN_MATERIAL)
# Opaque black letterboxing comes from the clipped texture, not alpha holes.
SCREEN_SHADER = SCREEN_MATERIAL.node_tree.nodes.get('Principled BSDF')
for link_data in list(SCREEN_SHADER.inputs['Alpha'].links):
    SCREEN_MATERIAL.node_tree.links.remove(link_data)
SCREEN_SHADER.inputs['Alpha'].default_value = 1
DISPLAY_CENTER = (BOTTOM_CENTER+TOP_CENTER)/2
UI_PIVOT = bpy.data.objects.new('UI PIVOT - aligned with sourced MacBook display',None)
DEVICE_COLLECTION.objects.link(UI_PIVOT)
UI_PIVOT.rotation_euler[0] = -math.atan2(UP_VECTOR.y,UP_VECTOR.z)
UI_ROTATION = UI_PIVOT.rotation_euler.to_matrix()
UI_PIVOT.location = DISPLAY_CENTER - UI_ROTATION @ Vector((0,-0.0052,0.119))
for object_data in LAYER_COLLECTION.objects:
    object_data.parent = UI_PIVOT
    object_data.matrix_parent_inverse = Matrix.Identity(4)
DEVICE_COLLECTION.asset_mark()
DEVICE_COLLECTION.asset_data.author = 'jackbaeten'
DEVICE_COLLECTION.asset_data.description = 'MacBook Pro M3, 16-inch. CC BY 4.0. Source: '+SOURCE_URL
LAPTOP_SCENE['hardware_source'] = SOURCE_URL
LAPTOP_SCENE['hardware_creator'] = 'jackbaeten'
LAPTOP_SCENE['hardware_license'] = 'CC BY 4.0'
CREDIT_TEXT = 'MacBook Pro M3, 16-inch, by jackbaeten\nSource: '+SOURCE_URL+'\nLicense: CC BY 4.0 — '+LICENSE_URL+'\nChanges: unit conversion, placement, screen replacement and UV mapping.\nStudio, floating UI, lighting and animation: Alexander Ilivanov.\n'
CREDIT_BLOCK = bpy.data.texts.get('ASSET CREDITS - sourced MacBook') or bpy.data.texts.new('ASSET CREDITS - sourced MacBook')
CREDIT_BLOCK.clear()
CREDIT_BLOCK.write(CREDIT_TEXT)
(OUTPUT_ROOT/'source-assets/macbook/CREDITS.txt').write_text(CREDIT_TEXT)
START_BLOCK = bpy.data.texts['START HERE - Thumbnail Studio']
START_TEXT = START_BLOCK.as_string()
UPDATE_NOTE = 'LAPTOP UPDATE: hardware is now the sourced MacBook Pro M3 by jackbaeten, CC BY 4.0. See ASSET CREDITS. Select MacBook Display - replace screenshot and edit MACBOOK SCREEN material. Floating cards use the independent original screen material. The original hardware hinge pose is retained; UI PIVOT controls only floating layers.\n\n'
if not START_TEXT.startswith('LAPTOP UPDATE:'):
    START_BLOCK.clear()
    START_BLOCK.write(UPDATE_NOTE+START_TEXT)
MISSING_IMAGES = []
for image_data in bpy.data.images:
    if image_data.source == 'FILE' and image_data.users:
        if not image_data.packed_file:
            if Path(bpy.path.abspath(image_data.filepath)).exists():
                image_data.pack()
            else:
                MISSING_IMAGES.append(image_data.name)
assert not MISSING_IMAGES, MISSING_IMAGES
LAPTOP_SCENE.frame_set(1)
bpy.ops.wm.save_as_mainfile(filepath=str(OUTPUT_ROOT/'jurenites-thumbnail-studio.blend'))
REPORT_DATA = {'creator':'jackbaeten','license':'CC BY 4.0','source_url':SOURCE_URL,'imported_meshes':len(SOURCE_MESHES),'missing_images':MISSING_IMAGES,'screen_dimensions_m':[SCREEN_WIDTH,SCREEN_HEIGHT],'screen_center':list(DISPLAY_CENTER),'source_path':str(SOURCE_PATH)}
(OUTPUT_ROOT/'macbook-import.json').write_text(json.dumps(REPORT_DATA,indent=2)+'\n')
LAPTOP_SCENE.render.resolution_percentage = 60
LAPTOP_SCENE.cycles.samples = 24
LAPTOP_SCENE.render.filepath = str(OUTPUT_ROOT/'renders/laptop-sourced-proof.png')
bpy.ops.render.render(write_still=True)
print('MACBOOK_REPLACED',json.dumps(REPORT_DATA))
