from pathlib import Path

import bpy


ROOT = Path(__file__).resolve().parents[2]
ASSET_DIR = ROOT / "public" / "assets" / "characters"
BASE_BLEND_PATH = ASSET_DIR / "lifepath-stickman.blend"
BASE_GLB_PATH = ASSET_DIR / "lifepath-stickman.glb"
KIT_GLB_PATH = ASSET_DIR / "lifepath-character-kit.glb"
BASE_PREVIEW_PATH = ASSET_DIR / "lifepath-stickman-preview.png"
KIT_PREVIEW_PATH = ASSET_DIR / "lifepath-character-kit-preview.png"


def collection(name):
    found = bpy.data.collections.get(name)
    if not found:
        raise RuntimeError(f"No existe la coleccion requerida: {name}")
    return found


def set_collection_visible(target, visible):
    target.hide_viewport = not visible
    target.hide_render = not visible
    for obj in target.objects:
        obj.hide_viewport = not visible
        obj.hide_render = not visible


def select_collections(*collections):
    bpy.ops.object.select_all(action="DESELECT")
    for target in collections:
        for obj in target.objects:
            obj.select_set(True)


def export_glb(path, *collections):
    select_collections(*collections)
    bpy.ops.export_scene.gltf(
        filepath=str(path),
        export_format="GLB",
        use_selection=True,
        export_apply=True,
        export_yup=True,
        export_animations=False,
    )


def render(path, show_accessories):
    set_collection_visible(collection("LifePath_accessories"), show_accessories)
    bpy.context.scene.render.filepath = str(path)
    bpy.ops.render.render(write_still=True)


def main():
    base = collection("LifePath_base_character")
    accessories = collection("LifePath_accessories")

    set_collection_visible(base, True)
    set_collection_visible(accessories, True)
    export_glb(BASE_GLB_PATH, base)
    export_glb(KIT_GLB_PATH, base, accessories)
    render(BASE_PREVIEW_PATH, False)
    render(KIT_PREVIEW_PATH, True)
    set_collection_visible(accessories, True)

    print(
        "LifePath Blender character exported from current .blend:"
        f"\n- {BASE_GLB_PATH}"
        f"\n- {KIT_GLB_PATH}"
        f"\n- {BASE_PREVIEW_PATH}"
        f"\n- {KIT_PREVIEW_PATH}"
    )


if __name__ == "__main__":
    main()
