"""Run in Blender's background mode. Input is a Rodin PBR GLB, output is a grounded, repaired GLB."""
import math
import sys
from pathlib import Path

import bmesh
import bpy
from mathutils import Matrix, Vector

KIND, INPUT, OUTPUT = sys.argv[sys.argv.index("--") + 1:]
if KIND not in ("standing", "recumbent"):
    raise ValueError("Expected standing or recumbent")
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=str(Path(INPUT).resolve()))
sculpt = next(o for o in bpy.context.scene.objects if o.type == "MESH")
sculpt.data.transform(sculpt.matrix_world)
sculpt.matrix_world = Matrix.Identity(4)
sculpt.name = "Rodin Anubis" if KIND == "standing" else "Rodin jackal and chest"


def xyz(p):
    """glTF Y-up coordinates to Blender coordinates."""
    x, y, z = p
    return Vector((x, -z, y))


def material(name, color, metallic, roughness):
    m = bpy.data.materials.new(name)
    m.diffuse_color = (*color, 1)
    m.use_nodes = True
    shader = m.node_tree.nodes.get("Principled BSDF")
    shader.inputs["Base Color"].default_value = (*color, 1)
    shader.inputs["Metallic"].default_value = metallic
    shader.inputs["Roughness"].default_value = roughness
    return m


gold = material("Brushed ritual gold", (.61, .326, .09), .78, .34)
bronze = material("Patinated bronze", (.105, .066, .031), .69, .39)
wood = material("Dark acacia stretchers", (.20, .083, .027), .12, .50)


def rod(name, a, b, r1, r2, mat):
    a, b = xyz(a), xyz(b)
    axis = b - a
    bpy.ops.mesh.primitive_cone_add(vertices=24, radius1=r1, radius2=r2, depth=axis.length, location=(a + b) * .5)
    obj = bpy.context.object
    obj.name = name
    obj.rotation_euler = axis.to_track_quat("Z", "Y").to_euler()
    obj.data.materials.append(mat)
    for face in obj.data.polygons:
        face.use_smooth = len(face.vertices) == 4


def loft(name, sections, axis, mat):
    """Capped elliptical sections along a local horizontal axis, with connected UV-free material."""
    vertices, faces, sides = [], [], 24
    for x, y, z, width, height in sections:
        for i in range(sides):
            a = i * 2 * math.pi / sides
            dx, dz = (0, width * math.cos(a)) if axis == "x" else (width * math.cos(a), 0)
            vertices.append(xyz((x + dx, y + height * math.sin(a), z + dz)))
    for j in range(len(sections)-1):
        for i in range(sides):
            a = j*sides+i
            b = j*sides+(i+1)%sides
            faces.append((a, b, b+sides, a+sides))
    faces.extend([tuple(reversed(range(sides))), tuple(range(len(vertices)-sides, len(vertices)))])
    mesh = bpy.data.meshes.new(name)
    mesh.from_pydata(vertices, [], faces)
    mesh.materials.append(mat)
    bm = bmesh.new()
    bm.from_mesh(mesh)
    bmesh.ops.recalc_face_normals(bm, faces=list(bm.faces))
    bm.to_mesh(mesh)
    bm.free()
    for f in mesh.polygons:
        f.use_smooth = len(f.vertices) == 4
    bpy.context.collection.objects.link(bpy.data.objects.new(name, mesh))


bm = bmesh.new()
bm.from_mesh(sculpt.data)
original = len(bm.faces)
bmesh.ops.remove_doubles(bm, verts=list(bm.verts), dist=.000002)
bmesh.ops.dissolve_degenerate(bm, edges=list(bm.edges), dist=.000002)

# Diagnose connectivity after welding matching UV-seam positions. Loop UVs remain per corner.
unvisited = set(bm.verts)
removed = []
while unvisited:
    v = unvisited.pop()
    island, stack = [v], [v]
    while stack:
        current = stack.pop()
        for edge in current.link_edges:
            other = edge.other_vert(current)
            if other in unvisited:
                unvisited.remove(other)
                island.append(other)
                stack.append(other)
    tiny = len(island) < 5
    floating_rack = KIND == "recumbent" and max(v.co.z for v in island) < -.42
    if tiny or floating_rack:
        removed.append(len(island))
        bmesh.ops.delete(bm, geom=island, context="VERTS")

if KIND == "standing":
    # Above the hand the generation produced a pointed finial. Preserve the original grip and
    # shaft. Plane cuts close to the surviving collars accept a was head and a forked foot.
    for level, top in ((.550, True), (-.850, False)):
        selected = [f for f in bm.faces if all(v.co.x < -.29 and (v.co.z > .44 if top else v.co.z < -.73) for v in f.verts)]
        edges = {e for f in selected for e in f.edges}
        verts = {v for f in selected for v in f.verts}
        cut = bmesh.ops.bisect_plane(bm, geom=selected + list(edges) + list(verts), dist=.000001,
                                    plane_co=(0,0,level), plane_no=(0,0,1),
                                    clear_outer=top, clear_inner=not top)
        rims = [e for e in cut["geom_cut"] if isinstance(e,bmesh.types.BMEdge) and e.is_valid and e.is_boundary]
        if rims:
            bmesh.ops.holes_fill(bm, edges=rims, sides=0)
    x, z = -.354, .159
    rod("Original shaft splice", (x,.539,z), (x,.747,z), .023,.018,bronze)
    for y in (.544,.562,.713):
        rod("Gold ferrule", (x,y,z), (x,y+.016,z), .026,.026,gold)
    loft("Was animal head", [(x+.064,.789,z,.005,.009),(x+.043,.775,z,.025,.038),
         (x+.018,.753,z,.033,.043),(x-.017,.752,z,.034,.037),
         (x-.077,.739,z-.003,.022,.024),(x-.133,.711,z-.006,.013,.017),
         (x-.144,.702,z-.006,.006,.009)], "x",gold)
    rod("Left was prong", (x,-.844,z),(x-.029,-.934,z),.019,.009,bronze)
    rod("Right was prong",(x,-.844,z),(x+.029,-.934,z),.019,.009,bronze)
else:
    # The generated carrying rack hung free under the chest and ran diagonally across it.
    # Seat new parallel runners and two transverse bearers directly against its underside.
    for side in (-1,1):
        x = -.045 + side*.165
        loft("Gilded sledge runner",[(x,-.375,-.986,.018,.026),(x,-.413,-.897,.031,.029),
             (x,-.419,-.695,.032,.030),(x,-.419,.735,.032,.030),
             (x,-.397,.899,.029,.026),(x,-.339,.990,.019,.027)],"z",gold)
        rod("Acacia carrying pole",(x,-.387,-1.165),(x,-.387,1.165),.017,.017,wood)
        for end in (-1,1):
            rod("Gilded pole end",(x,-.387,end*1.13),(x,-.387,end*1.165),.020,.018,gold)
    for z in (-.62,.62):
        rod("Chest bearer",(-.253,-.371,z),(.164,-.371,z),.023,.023,bronze)
bmesh.ops.recalc_face_normals(bm, faces=list(bm.faces))
bm.normal_update()
bm.to_mesh(sculpt.data)
bm.free()
sculpt.data.update()

objects = [o for o in bpy.context.scene.objects if o.type == "MESH"]
bpy.context.view_layer.update()
coords = [o.matrix_world @ v.co for o in objects for v in o.data.vertices]
lo = Vector(tuple(min(p[i] for p in coords) for i in range(3)))
hi = Vector(tuple(max(p[i] for p in coords) for i in range(3)))
# Standing height is the curatorial scale. The shrine's documented 95 cm describes the chest.
metres = 15.35/(hi.z-lo.z) if KIND=="standing" else .95/1.84
center = Vector(((lo.x+hi.x)/2,(lo.y+hi.y)/2,lo.z))
for obj in objects:
    transform = obj.matrix_world.copy()
    for v in obj.data.vertices:
        v.co = (transform @ v.co - center) * metres
    obj.matrix_world = Matrix.Identity(4)
    obj.data.update()
    obj.select_set(True)
sculpt["source"] = "Hyper3D Rodin"
sculpt["generation_id"] = "4ffb5033-4378-4c18-9184-0db025d610ba" if KIND=="standing" else "dd69bdcf-fb5f-4b2b-a2c7-935155d9fde9"
bpy.context.view_layer.update()
bpy.ops.export_scene.gltf(filepath=str(Path(OUTPUT).resolve()), export_format="GLB",
                          use_selection=False,export_extras=True,export_yup=True)
print("Repair",KIND,"original faces",original,"removed component vertex counts",sorted(removed),
      "height metres",round((hi.z-lo.z)*metres,4))
