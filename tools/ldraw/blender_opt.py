# Blender: zjednoduší dílky auta a vyexportuje GLB (sdílené meshe = instancing).
# Spuštění: python blender_opt.py vstup.gltf vystup.glb pomer
import sys, bpy, bmesh
src, dst, ratio = sys.argv[1], sys.argv[2], float(sys.argv[3])
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=src, merge_vertices=False)
meshes = {o.data for o in bpy.data.objects if o.type == 'MESH'}
tris_before = tris_after = 0
for me in meshes:
    n = sum(len(p.vertices) - 2 for p in me.polygons)
    tris_before += n * me.users
    if n > 120 and ratio < 1.0:
        tmp = bpy.data.objects.new('tmp', me); bpy.context.scene.collection.objects.link(tmp)
        mod = tmp.modifiers.new('dec', 'DECIMATE'); mod.decimate_type = 'COLLAPSE'; mod.ratio = ratio; mod.use_collapse_triangulate = True
        dg = bpy.context.evaluated_depsgraph_get()
        new = bpy.data.meshes.new_from_object(tmp.evaluated_get(dg))
        bpy.data.objects.remove(tmp)
        for poly in new.polygons: poly.use_smooth = True   # hladké stínování, ostré jen skutečné hrany dílku
        new.set_sharp_from_angle(angle=0.65)
        me.user_remap(new)          # všechna umístění dílku použijí zjednodušenou geometrii
        new.name = me.name
        me = new
    tris_after += sum(len(p.vertices) - 2 for p in me.polygons) * me.users
bpy.ops.export_scene.gltf(filepath=dst, export_format='GLB', export_extras=True, export_apply=False,
                          export_normals=True, export_texcoords=False, export_materials='EXPORT',
                          export_gpu_instances=True, export_yup=True)
print(f'{dst}: tris {tris_before} -> {tris_after}')
