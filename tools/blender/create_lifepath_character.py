import math
from pathlib import Path

import bpy
from mathutils import Vector


ROOT = Path(__file__).resolve().parents[2]
ASSET_DIR = ROOT / "public" / "assets" / "characters"
ASSET_DIR.mkdir(parents=True, exist_ok=True)

BLEND_PATH = ASSET_DIR / "lifepath-stickman.blend"
GLB_PATH = ASSET_DIR / "lifepath-stickman.glb"
KIT_GLB_PATH = ASSET_DIR / "lifepath-character-kit.glb"
PREVIEW_PATH = ASSET_DIR / "lifepath-stickman-preview.png"
ACCESSORY_PREVIEW_PATH = ASSET_DIR / "lifepath-character-kit-preview.png"


def p(point):
    # Author the character in game-friendly coordinates: X horizontal, Y height, Z depth.
    # Blender is Z-up, so convert here and keep the shape definitions readable.
    return (point[0], -point[2], point[1])


def s(scale):
    return (scale[0], scale[2], scale[1])


def clear_scene():
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete()


def make_mat(name, color, roughness=0.62, metallic=0.0, alpha=1.0, emission=None, emission_strength=0.0):
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    mat.diffuse_color = color
    if alpha < 1:
        mat.blend_method = "BLEND"
        mat.use_screen_refraction = True
    bsdf = next((node for node in mat.node_tree.nodes if node.type == "BSDF_PRINCIPLED"), None)
    if bsdf is None:
        bsdf = mat.node_tree.nodes.new(type="ShaderNodeBsdfPrincipled")
    bsdf.inputs["Base Color"].default_value = color
    bsdf.inputs["Roughness"].default_value = roughness
    bsdf.inputs["Metallic"].default_value = metallic
    if "Alpha" in bsdf.inputs:
        bsdf.inputs["Alpha"].default_value = alpha
    if emission:
        if "Emission Color" in bsdf.inputs:
            bsdf.inputs["Emission Color"].default_value = emission
        if "Emission Strength" in bsdf.inputs:
            bsdf.inputs["Emission Strength"].default_value = emission_strength
    return mat


def make_collection(name):
    collection = bpy.data.collections.new(name)
    bpy.context.scene.collection.children.link(collection)
    return collection


def link_to(collection, obj):
    if obj.name not in collection.objects.keys():
        collection.objects.link(obj)
    for source in list(obj.users_collection):
        if source != collection:
            source.objects.unlink(obj)
    return obj


def shade_smooth(obj):
    bpy.context.view_layer.objects.active = obj
    obj.select_set(True)
    bpy.ops.object.shade_smooth()
    obj.select_set(False)
    return obj


def add_uv_sphere(name, location, scale, mat, segments=48, rings=24, collection=None):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=segments, ring_count=rings, location=p(location))
    obj = bpy.context.object
    obj.name = name
    obj.scale = s(scale)
    obj.data.materials.append(mat)
    shade_smooth(obj)
    if collection:
        link_to(collection, obj)
    return obj


def add_capsule(name, start, end, radius, mat, collection=None):
    start_v = Vector(p(start))
    end_v = Vector(p(end))
    mid = (start_v + end_v) * 0.5
    direction = end_v - start_v
    length = direction.length

    bpy.ops.mesh.primitive_cylinder_add(vertices=32, radius=radius, depth=length, location=mid)
    cylinder = bpy.context.object
    cylinder.name = f"{name}_shaft"
    cylinder.data.materials.append(mat)
    cylinder.rotation_euler = direction.to_track_quat("Z", "Y").to_euler()
    shade_smooth(cylinder)
    if collection:
        link_to(collection, cylinder)

    head = add_uv_sphere(f"{name}_cap_top", end, (radius, radius, radius), mat, 32, 16, collection)
    foot = add_uv_sphere(f"{name}_cap_bottom", start, (radius, radius, radius), mat, 32, 16, collection)
    return [cylinder, head, foot]


def add_tapered_capsule(name, start, end, start_radius, end_radius, mat, collection=None, vertices=40):
    start_v = Vector(p(start))
    end_v = Vector(p(end))
    mid = (start_v + end_v) * 0.5
    direction = end_v - start_v
    length = direction.length

    bpy.ops.mesh.primitive_cone_add(
        vertices=vertices,
        radius1=start_radius,
        radius2=end_radius,
        depth=length,
        location=mid,
    )
    shaft = bpy.context.object
    shaft.name = f"{name}_taper"
    shaft.data.materials.append(mat)
    shaft.rotation_euler = direction.to_track_quat("Z", "Y").to_euler()
    shade_smooth(shaft)
    if collection:
        link_to(collection, shaft)

    cap_start = add_uv_sphere(f"{name}_cap_start", start, (start_radius, start_radius, start_radius), mat, 32, 16, collection)
    cap_end = add_uv_sphere(f"{name}_cap_end", end, (end_radius, end_radius, end_radius), mat, 32, 16, collection)
    return [shaft, cap_start, cap_end]


def add_hand(name, location, side, mat, collection):
    parts = []
    parts.append(add_uv_sphere(f"{name}_palm", location, (0.15, 0.095, 0.105), mat, 32, 16, collection))
    base_x = location[0] + side * 0.025
    for index in range(4):
        offset = (index - 1.5) * 0.034
        start = (base_x + side * (0.025 + index * 0.018), location[1] - 0.035, location[2] + offset)
        end = (start[0] + side * 0.045, location[1] - 0.17 - abs(offset) * 0.16, location[2] + offset * 1.08)
        parts += add_tapered_capsule(f"{name}_finger_{index + 1}", start, end, 0.026, 0.018, mat, collection, 16)
    thumb_start = (location[0] - side * 0.08, location[1] - 0.015, location[2] + 0.055)
    thumb_end = (location[0] - side * 0.15, location[1] - 0.12, location[2] + 0.085)
    parts += add_tapered_capsule(f"{name}_thumb", thumb_start, thumb_end, 0.032, 0.021, mat, collection, 16)
    return parts


def add_foot(name, location, side, mat, collection):
    foot = add_uv_sphere(name, location, (0.22, 0.155, 0.18), mat, 32, 16, collection)
    foot.rotation_euler[1] = math.radians(side * 5)
    foot.rotation_euler[0] = math.radians(4)
    return foot


def add_rounded_box(name, location, scale, mat, bevel=0.04, collection=None):
    bpy.ops.mesh.primitive_cube_add(size=1, location=p(location))
    obj = bpy.context.object
    obj.name = name
    obj.scale = s(scale)
    obj.data.materials.append(mat)
    if collection:
        link_to(collection, obj)
    if bevel:
        bevel_mod = obj.modifiers.new("soft rounded edges", "BEVEL")
        bevel_mod.width = bevel
        bevel_mod.segments = 5
        bevel_mod.affect = "EDGES"
        normal = obj.modifiers.new("weighted soft normals", "WEIGHTED_NORMAL")
        bpy.context.view_layer.objects.active = obj
        obj.select_set(True)
        bpy.ops.object.modifier_apply(modifier=bevel_mod.name)
        bpy.ops.object.modifier_apply(modifier=normal.name)
        obj.select_set(False)
    return obj


def fuse_mesh_parts(name, parts, mat, collection, voxel_size=0.036):
    bpy.ops.object.select_all(action="DESELECT")
    bpy.context.view_layer.objects.active = parts[0]
    for obj in parts:
        obj.select_set(True)
    bpy.ops.object.join()
    fused = bpy.context.object
    fused.name = name
    fused.data.name = f"{name}_mesh"
    fused.data.materials.clear()
    fused.data.materials.append(mat)

    remesh = fused.modifiers.new("single soft toy surface", "REMESH")
    remesh.mode = "VOXEL"
    remesh.voxel_size = voxel_size
    remesh.adaptivity = 0
    bpy.context.view_layer.objects.active = fused
    bpy.ops.object.modifier_apply(modifier=remesh.name)

    smooth = fused.modifiers.new("polished clay smoothing", "SMOOTH")
    smooth.factor = 0.58
    smooth.iterations = 10
    bpy.ops.object.modifier_apply(modifier=smooth.name)

    normal = fused.modifiers.new("soft weighted normals", "WEIGHTED_NORMAL")
    bpy.ops.object.modifier_apply(modifier=normal.name)
    shade_smooth(fused)
    link_to(collection, fused)
    return fused


def add_cylinder_between(name, start, end, radius, mat, collection=None, vertices=24):
    start_v = Vector(p(start))
    end_v = Vector(p(end))
    mid = (start_v + end_v) * 0.5
    direction = end_v - start_v
    length = direction.length

    bpy.ops.mesh.primitive_cylinder_add(vertices=vertices, radius=radius, depth=length, location=mid)
    obj = bpy.context.object
    obj.name = name
    obj.data.materials.append(mat)
    obj.rotation_euler = direction.to_track_quat("Z", "Y").to_euler()
    shade_smooth(obj)
    if collection:
        link_to(collection, obj)
    return obj


def add_heart(name, location, scale, mat, collection):
    vertices = []
    front = []
    back = []
    for i in range(48):
        t = (math.tau * i) / 48
        x = 16 * (math.sin(t) ** 3) / 18
        y = (13 * math.cos(t) - 5 * math.cos(2 * t) - 2 * math.cos(3 * t) - math.cos(4 * t)) / 18
        front.append(len(vertices))
        vertices.append((location[0] + x * scale, -(location[2] + 0.035), location[1] + y * scale))
        back.append(len(vertices))
        vertices.append((location[0] + x * scale, -(location[2] - 0.035), location[1] + y * scale))

    faces = []
    faces.append(front)
    faces.append(list(reversed(back)))
    for i in range(48):
        faces.append((front[i], front[(i + 1) % 48], back[(i + 1) % 48], back[i]))

    mesh = bpy.data.meshes.new(f"{name}_mesh")
    mesh.from_pydata(vertices, [], faces)
    mesh.update()
    obj = bpy.data.objects.new(name, mesh)
    obj.data.materials.append(mat)
    collection.objects.link(obj)
    shade_smooth(obj)
    obj["lifepath_accessory_key"] = name
    return obj


def add_accessory_placeholders(mats, collection):
    # Small hidden-ish reference meshes that define where dynamic game accessories should attach.
    # They are exported as named empties/meshes so the web renderer can use them later.
    for name, location in {
        "slot_heart_chest": (0.18, 1.52, 0.5),
        "slot_right_hand": (0.96, 0.66, 0.18),
        "slot_left_hand": (-0.96, 0.66, 0.18),
        "slot_face": (0, 2.86, 0.92),
        "slot_money_floor": (0.76, 0.08, 0.52),
    }.items():
        bpy.ops.object.empty_add(type="PLAIN_AXES", location=p(location))
        obj = bpy.context.object
        obj.name = name
        link_to(collection, obj)

    # Relationship: chest heart and family mini-heart.
    add_heart("accessory_relationship_heart", (0.15, 1.92, 0.86), 0.17, mats["heart"], collection)
    add_heart("accessory_family_heart", (-0.12, 1.72, 0.88), 0.105, mats["heart_alt"], collection)

    # Study: glasses and UAB book.
    add_cylinder_between("accessory_glasses_bridge", (-0.12, 2.86, 0.95), (0.12, 2.86, 0.95), 0.012, mats["dark"], collection, 16)
    for side in (-1, 1):
        bpy.ops.mesh.primitive_torus_add(
            major_radius=0.115,
            minor_radius=0.012,
            major_segments=32,
            minor_segments=8,
            location=p((side * 0.18, 2.86, 0.95)),
            rotation=(math.radians(90), 0, 0),
        )
        lens = bpy.context.object
        lens.name = f"accessory_glasses_lens_{'left' if side < 0 else 'right'}"
        lens.data.materials.append(mats["dark"])
        link_to(collection, lens)
        add_cylinder_between(
            f"accessory_glasses_arm_{'left' if side < 0 else 'right'}",
            (side * 0.29, 2.86, 0.92),
            (side * 0.42, 2.78, 0.62),
            0.01,
            mats["dark"],
            collection,
            12,
        )
    book = add_rounded_box("accessory_uab_book", (-0.42, 0.94, 0.33), (0.22, 0.035, 0.16), mats["book"], 0.018, collection)
    book.rotation_euler[2] = math.radians(-9)
    add_rounded_box("accessory_uab_book_label", (-0.42, 0.945, 0.372), (0.14, 0.008, 0.055), mats["paper"], 0.006, collection)

    # Party: cubata with straw and liquid.
    glass = add_cylinder_between("accessory_cubata_glass", (0.92, 0.55, 0.35), (0.92, 0.88, 0.35), 0.082, mats["glass"], collection, 36)
    glass["lifepath_accessory_key"] = "party"
    add_cylinder_between("accessory_cubata_liquid", (0.92, 0.57, 0.35), (0.92, 0.75, 0.35), 0.073, mats["drink"], collection, 36)
    add_cylinder_between("accessory_cubata_straw", (0.96, 0.77, 0.35), (1.04, 1.03, 0.43), 0.012, mats["straw"], collection, 12)
    add_uv_sphere("accessory_cubata_ice", (0.88, 0.72, 0.31), (0.035, 0.035, 0.035), mats["ice"], 16, 8, collection)

    # Work: briefcase.
    case = add_rounded_box("accessory_work_briefcase", (-1.02, 0.49, 0.24), (0.33, 0.09, 0.24), mats["briefcase"], 0.035, collection)
    case.rotation_euler[2] = math.radians(3)
    add_cylinder_between("accessory_work_briefcase_handle_left", (-1.12, 0.72, 0.24), (-1.07, 0.82, 0.24), 0.018, mats["briefcase_dark"], collection, 16)
    add_cylinder_between("accessory_work_briefcase_handle_right", (-0.92, 0.72, 0.24), (-0.97, 0.82, 0.24), 0.018, mats["briefcase_dark"], collection, 16)
    add_cylinder_between("accessory_work_briefcase_handle_top", (-1.07, 0.82, 0.24), (-0.97, 0.82, 0.24), 0.018, mats["briefcase_dark"], collection, 16)

    # Money: coins and bills.
    for i in range(5):
        bpy.ops.mesh.primitive_cylinder_add(vertices=36, radius=0.085, depth=0.018, location=p((0.72 + i * 0.045, 0.11 + i * 0.018, 0.5)))
        coin = bpy.context.object
        coin.name = f"accessory_money_coin_{i + 1}"
        coin.rotation_euler[1] = math.radians(90)
        coin.data.materials.append(mats["coin"])
        shade_smooth(coin)
        link_to(collection, coin)
    for i in range(3):
        bill = add_rounded_box(f"accessory_money_bill_{i + 1}", (0.56 + i * 0.04, 0.34 + i * 0.01, 0.58), (0.24, 0.011, 0.105), mats["bill"], 0.01, collection)
        bill.rotation_euler[2] = math.radians(-8 + i * 6)

    # Smoking/drugs branch: joint plus soft smoke curls.
    add_cylinder_between("accessory_joint_paper", (0.43, 2.36, 0.84), (0.74, 2.31, 0.98), 0.026, mats["paper"], collection, 16)
    add_cylinder_between("accessory_joint_tip", (0.73, 2.31, 0.98), (0.81, 2.3, 1.01), 0.027, mats["ember"], collection, 16)
    for i in range(3):
        add_cylinder_between(
            f"accessory_smoke_wisp_{i + 1}",
            (0.82 + i * 0.035, 2.36 + i * 0.04, 1.03),
            (0.9 + i * 0.03, 2.54 + i * 0.05, 1.11 + i * 0.02),
            0.009,
            mats["smoke"],
            collection,
            12,
        )

    # Bonus: small neon ticket for the Wolf party route.
    ticket = add_rounded_box("accessory_wolf_ticket", (0.07, 0.95, 0.55), (0.18, 0.012, 0.105), mats["neon"], 0.012, collection)
    ticket["lifepath_accessory_key"] = "wolf_party"


def create_character():
    clear_scene()

    base_collection = make_collection("LifePath_base_character")
    accessory_collection = make_collection("LifePath_accessories")

    clay = make_mat("LifePath soft clay white", (0.94, 0.93, 0.89, 1), 0.82)
    soft_shadow = make_mat("Soft warm shadow", (0.72, 0.7, 0.66, 1), 0.9)
    coin = make_mat("Money gold", (0.98, 0.73, 0.16, 1), 0.35, 0.16)
    mats = {
        "clay": clay,
        "shadow": soft_shadow,
        "coin": coin,
        "heart": make_mat("Heart candy red", (1.0, 0.14, 0.25, 1), 0.42, emission=(0.45, 0.02, 0.06, 1), emission_strength=0.15),
        "heart_alt": make_mat("Heart warm pink", (1.0, 0.42, 0.66, 1), 0.46),
        "dark": make_mat("Glasses soft graphite", (0.03, 0.035, 0.04, 1), 0.36),
        "glass": make_mat("Cubata transparent glass", (0.74, 0.94, 1.0, 0.36), 0.06, alpha=0.36),
        "drink": make_mat("Cubata amber drink", (0.8, 0.34, 0.08, 0.76), 0.22, alpha=0.76),
        "straw": make_mat("Neon straw", (0.0, 0.96, 0.63, 1), 0.28, emission=(0.0, 0.58, 0.3, 1), emission_strength=0.25),
        "ice": make_mat("Ice cube pale blue", (0.82, 0.96, 1.0, 0.55), 0.08, alpha=0.55),
        "briefcase": make_mat("Briefcase rich teal", (0.02, 0.23, 0.2, 1), 0.54),
        "briefcase_dark": make_mat("Briefcase dark trim", (0.01, 0.08, 0.075, 1), 0.48),
        "bill": make_mat("Money bill phthalo", (0.0, 0.72, 0.46, 1), 0.5),
        "paper": make_mat("Joint paper offwhite", (0.96, 0.92, 0.8, 1), 0.7),
        "ember": make_mat("Joint ember", (1.0, 0.22, 0.07, 1), 0.36, emission=(1.0, 0.12, 0.02, 1), emission_strength=0.6),
        "smoke": make_mat("Smoke soft grey", (0.76, 0.78, 0.78, 0.38), 0.9, alpha=0.38),
        "book": make_mat("UAB book blue", (0.04, 0.23, 0.68, 1), 0.48),
        "neon": make_mat("Wolf ticket neon", (0.84, 0.11, 0.95, 1), 0.32, emission=(0.62, 0.0, 0.8, 1), emission_strength=0.5),
    }

    head = add_uv_sphere("head_big_round", (0, 2.42, 0.02), (0.74, 0.74, 0.74), clay, 72, 36, base_collection)

    body_builder = []
    body_builder.append(add_uv_sphere("torso_soft_capsule_builder", (0, 1.12, 0.0), (0.46, 0.72, 0.35), clay, 48, 24, base_collection))
    body_builder.append(add_uv_sphere("belly_front_builder", (0, 1.07, 0.15), (0.39, 0.43, 0.18), clay, 40, 16, base_collection))
    body_builder.append(add_uv_sphere("hip_soft_builder", (0, 0.68, 0.02), (0.39, 0.28, 0.3), clay, 40, 16, base_collection))

    body_builder += add_tapered_capsule("left_arm_builder", (-0.42, 1.46, 0.02), (-0.83, 0.72, 0.16), 0.16, 0.096, clay, base_collection)
    body_builder += add_tapered_capsule("right_arm_builder", (0.42, 1.46, 0.02), (0.83, 0.72, 0.16), 0.16, 0.096, clay, base_collection)
    body_builder += add_hand("left_hand_builder", (-0.88, 0.6, 0.16), -1, clay, base_collection)
    body_builder += add_hand("right_hand_builder", (0.88, 0.6, 0.16), 1, clay, base_collection)

    body_builder += add_tapered_capsule("left_leg_builder", (-0.18, 0.68, 0.0), (-0.22, 0.12, 0.02), 0.2, 0.15, clay, base_collection)
    body_builder += add_tapered_capsule("right_leg_builder", (0.18, 0.68, 0.0), (0.22, 0.12, 0.02), 0.2, 0.15, clay, base_collection)
    body_builder.append(add_foot("left_foot_builder", (-0.22, 0.02, 0.15), -1, clay, base_collection))
    body_builder.append(add_foot("right_foot_builder", (0.22, 0.02, 0.15), 1, clay, base_collection))

    fused_body = fuse_mesh_parts("body_one_piece_soft_silhouette", body_builder, clay, base_collection)
    body_parts = [head, fused_body]

    # Subtle ambient-contact ellipses to make the character feel grounded in preview renders.
    shadow = add_uv_sphere("soft_floor_contact_shadow", (0, -0.08, 0.02), (0.72, 0.026, 0.26), soft_shadow, 32, 12, base_collection)
    shadow.hide_select = True

    add_accessory_placeholders(mats, accessory_collection)

    for obj in body_parts:
        obj["lifepath_role"] = "base_body"

    bpy.ops.object.empty_add(type="PLAIN_AXES", location=p((0, 1.28, 0)))
    rig_root = bpy.context.object
    rig_root.name = "LifePath_character_root"
    link_to(base_collection, rig_root)

    for obj in body_parts:
        obj.parent = rig_root

    for obj in accessory_collection.objects:
        obj["lifepath_role"] = "optional_accessory"

    setup_camera_and_lights()
    return base_collection, accessory_collection


def setup_camera_and_lights():
    bpy.ops.object.light_add(type="AREA", location=(-3.2, -3.2, 4.4))
    key = bpy.context.object
    key.name = "Large softbox key"
    key.data.energy = 460
    key.data.size = 4.2

    bpy.ops.object.light_add(type="AREA", location=(3, -1.4, 3))
    rim = bpy.context.object
    rim.name = "Gentle rim light"
    rim.data.energy = 120
    rim.data.size = 3

    bpy.ops.object.camera_add(location=(0, -7.4, 1.55))
    camera = bpy.context.object
    camera.name = "LifePath preview camera"
    camera.data.lens = 38
    camera.data.dof.use_dof = True
    camera.data.dof.focus_distance = 5.3
    camera.data.dof.aperture_fstop = 6.5
    bpy.context.scene.camera = camera
    look_at(camera, Vector((0, 0.02, 1.45)))

    bpy.context.scene.render.resolution_x = 1024
    bpy.context.scene.render.resolution_y = 1024
    bpy.context.scene.eevee.taa_render_samples = 64
    bpy.context.scene.world.color = (0.46, 0.46, 0.44)


def look_at(obj, target):
    direction = target - obj.location
    obj.rotation_euler = direction.to_track_quat("-Z", "Y").to_euler()


def set_collection_render_state(collection, visible):
    collection.hide_viewport = not visible
    collection.hide_render = not visible
    for obj in collection.objects:
        obj.hide_viewport = not visible
        obj.hide_render = not visible


def select_collection(collection):
    bpy.ops.object.select_all(action="DESELECT")
    for obj in collection.objects:
        obj.select_set(True)


def render_preview(path, accessory_collection, show_accessories):
    set_collection_render_state(accessory_collection, show_accessories)
    bpy.context.scene.render.filepath = str(path)
    bpy.ops.render.render(write_still=True)


def export_assets(base_collection, accessory_collection):
    set_collection_render_state(accessory_collection, True)
    bpy.ops.wm.save_as_mainfile(filepath=str(BLEND_PATH))

    select_collection(base_collection)
    bpy.ops.export_scene.gltf(
        filepath=str(GLB_PATH),
        export_format="GLB",
        use_selection=True,
        export_apply=True,
        export_yup=True,
        export_animations=False,
    )

    bpy.ops.object.select_all(action="DESELECT")
    for collection in (base_collection, accessory_collection):
        for obj in collection.objects:
            obj.select_set(True)
    bpy.ops.export_scene.gltf(
        filepath=str(KIT_GLB_PATH),
        export_format="GLB",
        use_selection=True,
        export_apply=True,
        export_yup=True,
        export_animations=False,
    )

    render_preview(PREVIEW_PATH, accessory_collection, False)
    render_preview(ACCESSORY_PREVIEW_PATH, accessory_collection, True)


if __name__ == "__main__":
    base, accessories = create_character()
    export_assets(base, accessories)
    print(
        "LifePath Blender character exported:"
        f"\n- {BLEND_PATH}"
        f"\n- {GLB_PATH}"
        f"\n- {KIT_GLB_PATH}"
        f"\n- {PREVIEW_PATH}"
        f"\n- {ACCESSORY_PREVIEW_PATH}"
    )
