# Blender: zjednoduší dílky, slije je do jednoho modelu a zapeče do vrcholů stínování v záhybech (ambient occlusion).
# Spuštění: python blender_ao.py vstup.gltf vystup.glb pomer [vzdalenost_ao] [vzorky]
import sys, bpy, time
src, dst, ratio = sys.argv[1], sys.argv[2], float(sys.argv[3])
ao_dist = float(sys.argv[4]) if len(sys.argv) > 4 else 0.9
samples = int(sys.argv[5]) if len(sys.argv) > 5 else 48
t0 = time.time()
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=src, merge_vertices=False)
meshes = {o.data for o in bpy.data.objects if o.type == 'MESH'}
for me in list(meshes):
    n = sum(len(p.vertices) - 2 for p in me.polygons)
    if n > 120 and ratio < 1.0:
        tmp = bpy.data.objects.new('tmp', me); bpy.context.scene.collection.objects.link(tmp)
        mod = tmp.modifiers.new('dec', 'DECIMATE'); mod.decimate_type = 'COLLAPSE'; mod.ratio = ratio; mod.use_collapse_triangulate = True
        dg = bpy.context.evaluated_depsgraph_get()
        new = bpy.data.meshes.new_from_object(tmp.evaluated_get(dg))
        bpy.data.objects.remove(tmp)
        for poly in new.polygons: poly.use_smooth = True
        new.set_sharp_from_angle(angle=0.65)
        me.user_remap(new); new.name = me.name
# slít všechna umístění do jednoho objektu (každý vrchol vlastní stín)
objs = [o for o in bpy.data.objects if o.type == 'MESH']
bpy.ops.object.select_all(action='DESELECT')
for o in objs:
    o.select_set(True)
bpy.context.view_layer.objects.active = objs[0]
bpy.ops.object.make_single_user(object=True, obdata=True)
bpy.ops.object.parent_clear(type='CLEAR_KEEP_TRANSFORM')
bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)
bpy.ops.object.join()
ob = bpy.context.view_layer.objects.active
me = ob.data
ca = me.color_attributes.new('ao', 'BYTE_COLOR', 'POINT')
me.color_attributes.active_color = ca
sc = bpy.context.scene
sc.render.engine = 'CYCLES'; sc.cycles.device = 'CPU'; sc.cycles.samples = samples
sc.world = bpy.data.worlds.new('w'); sc.world.light_settings.distance = ao_dist
bpy.ops.object.bake(type='AO', target='VERTEX_COLORS')
tris = sum(len(p.vertices) - 2 for p in me.polygons)
# glTF materiály bez uzlu barvy vrcholů – barvu nese jen atribut 'ao'
bpy.ops.export_scene.gltf(filepath=dst, export_format='GLB', export_normals=True, export_texcoords=False,
                          export_materials='EXPORT', export_vertex_color='ACTIVE', export_all_vertex_colors=False, export_yup=True, export_apply=False)
print(f'{dst}: tris {tris}, {time.time() - t0:.0f}s')
