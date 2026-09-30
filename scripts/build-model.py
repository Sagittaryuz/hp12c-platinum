"""Run with Blender: blender -b --python scripts/build-model.py -- PROJECT_ROOT.
The six supplied views set nominal body dimensions; details are visually inferred.
"""
import bpy, json, math, sys
from pathlib import Path
from mathutils import Vector
ROOT=Path(sys.argv[sys.argv.index('--')+1]).resolve()
TEXTURES=ROOT/'model/textures'
bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
scene=bpy.context.scene;scene.unit_settings.system='METRIC';scene.unit_settings.scale_length=1
def material(name,color,metal=0,rough=.5,image=None):
    mat=bpy.data.materials.new(name);mat.use_nodes=True;p=mat.node_tree.nodes.get('Principled BSDF')
    p.inputs['Base Color'].default_value=(*color,1);p.inputs['Metallic'].default_value=metal;p.inputs['Roughness'].default_value=rough
    if image:
        tex=mat.node_tree.nodes.new('ShaderNodeTexImage');tex.image=bpy.data.images.load(str(image));mat.node_tree.links.new(tex.outputs['Color'],p.inputs['Base Color']);mat.node_tree.links.new(tex.outputs['Alpha'],p.inputs['Alpha'])
    return mat
black=material('Molded dark plastic',(.022,.025,.026),.12,.64)
keymat=material('Keycaps',(.027,.030,.031),.08,.29)
orange=material('Orange shift f',(.96,.235,.075),.05,.32)
blue=material('Blue shift g',(.025,.40,.64),.04,.34)
silver=material('Brushed aluminium',(.69,.71,.70),.72,.44,ROOT/'public/assets/brushed-aluminum.png')
chrome=material('Satin frame',(.56,.59,.56),.76,.3)
rubber=material('Rubber feet',(.015,.017,.016),0,.95)
lcd=material('LCD green',(.54,.62,.45),.04,.56)
def box(name,dimensions,location,mat,bevel=.0006,parent=None):
    bpy.ops.mesh.primitive_cube_add(size=1,location=location);o=bpy.context.object;o.name=name;o.dimensions=dimensions
    bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
    if bevel:
        mod=o.modifiers.new('Molded edges','BEVEL');mod.width=bevel;mod.segments=4;bpy.context.view_layer.objects.active=o;bpy.ops.object.modifier_apply(modifier=mod.name)
    o.data.materials.append(mat)
    if parent:o.parent=parent
    for face in o.data.polygons:face.use_smooth=True
    mod=o.modifiers.new('Face weighted normals','WEIGHTED_NORMAL')
    return o
def decal(name,image,w,h,x,y,z,parent=None,rear=False):
    bpy.ops.mesh.primitive_plane_add(size=1,location=(x,y,z));o=bpy.context.object;o.name=name;o.scale=(w,h,1)
    if rear:o.rotation_euler=(0,math.pi,0)
    o.data.materials.append(material(name+' ink',(1,1,1),0,.65,TEXTURES/image))
    if parent:o.parent=parent
    return o
root=bpy.data.objects.new('HP12c_Pl atinum'.replace(' ',''),None);scene.collection.objects.link(root)
root['nominalDimensionsMm']=[129,79,15];root['reference']='Six nominal views supplied by user, 2026-09-29'
body=box('case',( .129,.079,.0124),(0,0,-.0007),black,.0020,root)
box('case_seam',(.12902,.07902,.00013),(0,0,-.0018),rubber,.0018,root)
box('front_top_plate',(.121,.0218,.0008),(0,.02765,.0058),silver,.0008,root)
box('keypad_bezel',(.1205,.0532,.00055),(0,-.01165,.0056),chrome,.0008,root)
box('keypad_face',(.1178,.051,.00055),(0,-.01165,.0059),black,.0005,root)
box('display_bezel',(.064,.0170,.0006),(-.011,.0273,.0063),chrome,.0012,root)
box('display_inner_frame',(.0614,.0150,.0004),(-.011,.0273,.00665),black,.0007,root)
box('display_body',(.060,.0138,.00010),(-.011,.0273,.0069),lcd,.0003,root)
bpy.ops.mesh.primitive_plane_add(size=1,location=(-.011,.0273,.006956));display=bpy.context.object;display.name='display_window';display.scale=(.060,.0138,1);display.data.materials.append(lcd);display.parent=root
decal('front_brand','brand.png',.0146,.0073,-.050,.029,.00625,root)
box('hp_badge',(.0100,.0082,.00035),(.052,.027,.0061),chrome,.0007,root)
box('hp_badge_inset',(.0089,.0071,.00022),(.052,.027,.00635),black,.0007,root)
decal('hp_badge_letters','badge.png',.0075,.0075,.052,.027,.00648,root)
decal('bottom_name','nameplate.png',.112,.0040,0,-.0368,.00625,root)
for k in json.loads((ROOT/'model/key-layout.json').read_text(encoding='utf-8')):
    x=-.0514+k['col']*.01142;y=.0098-k['row']*.01205
    if k['id']=='enter':y=.0098-2.5*.01205
    h=.0186 if k['id']=='enter' else .0068;w=.0093
    group=bpy.data.objects.new('key_'+k['id'],None);scene.collection.objects.link(group);group.parent=root;group.location=(x,y,0);group['calculatorKey']=k['id'];group['shortcut']=k['shortcut']
    mat=orange if k['id']=='f' else blue if k['id']=='g' else keymat
    box('keycap_'+k['id'],(w,h,.0026),(0,0,.0062),mat,.00060,group)
    decal('legend_'+k['id'],'key-'+k['id']+'.png',w*.88,h*.92,0,0,.007515,group)
    if k['f'] and k.get('printF',True):decal('function_f_'+k['id'],'f-'+k['id']+'.png',.0105,.0023,0,h/2+.0018,.00626,group)
# Rear molding follows the arrangement in the supplied rear view.
box('rear_inner_panel',(.121,.070,.00028),(0,0,-.00701),black,.0015,root)
box('battery_cover',(.034,.025,.00035),(.040,.022,-.00714),black,.0006,root)
for j in range(3):box('battery_grip_'+str(j),(.017,.00055,.00020),(.038,.014+j*.003,-.00738),chrome,.0001,root)
decal('rear_guide','back-guide.png',.075,.057,-.017,-.001,-.0073,root,True)
decal('rear_brand','back-brand.png',.0155,.047,.044,-.007,-.00731,root,True)
for x in [-.055,.055]:
    for y in [-.030,.030]:box('foot_'+str(x)+'_'+str(y),(.0115,.0063,.0006),(x,y,-.0072),rubber,.0008,root)
for x in [-.060,.060]:
    bpy.ops.mesh.primitive_cylinder_add(vertices=24,radius=.0012,depth=.0002,location=(x,0,-.0072));o=bpy.context.object;o.name='rear_screw';o.data.materials.append(chrome);o.parent=root
for o in bpy.context.scene.objects:
    if o.type=='MESH':o.select_set(True)
    else:o.select_set(False)
# Bounds are audited in millimetres, including molded feet and legend surfaces.
bpy.context.view_layer.update();points=[o.matrix_world@Vector(c) for o in bpy.context.scene.objects if o.type=='MESH' for c in o.bound_box]
bounds=[(max(p[i] for p in points)-min(p[i] for p in points))*1000 for i in range(3)]
(ROOT/'model/measurements.json').write_text(json.dumps({'nominalMm':[129,79,15],'exportedBoundingBoxMm':bounds,'toleranceMm':.1,'scale':'metres, glTF','referenceStatus':'nominal dimensions; component sizes inferred visually'},indent=2))
for image in bpy.data.images:
    if image.filepath:image.pack()
bpy.ops.wm.save_as_mainfile(filepath=str(ROOT/'model/hp12c-platinum.blend'))
bpy.ops.export_scene.gltf(filepath=str(ROOT/'public/models/hp12c-platinum.glb'),export_format='GLB',export_extras=True,export_apply=True,export_yup=True)
print('MODEL_BOUNDS_MM',bounds)

