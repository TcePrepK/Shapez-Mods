import { BackgroundResourcesLoader } from "shapez/core/background_resources_loader";
import { globalConfig } from "shapez/core/config";
import { gMetaBuildingRegistry } from "shapez/core/global_registries";
import { Vector } from "shapez/core/vector";
import { defaultBuildingVariant } from "shapez/game/meta_building";
import { initBuildingCodesAfterResourcesLoaded } from "shapez/game/meta_building_registry";
import { MetaTestBuilding } from "./building";

function setTile({
    x = 0,
    y = 0,
    building = "empty",
    variant = defaultBuildingVariant,
    rotation = 0,
    rotationVariant = 0,
    layer = "regular",
}) {
    const root = globalConfig["root"];
    if (building == "empty") {
        const contents = root.map.getTileContent(new Vector(x, y), layer);
        if (contents) {
            root.logic.tryDeleteBuilding(contents);
        }
    } else {
        const contents = root.map.getTileContent(new Vector(x, y), layer);
        if (contents) {
            root.logic.tryDeleteBuilding(contents);
        }
        root.logic.tryPlaceBuilding({
            origin: new Vector(x, y),
            rotation,
            rotationVariant,
            originalRotation: 0,
            building: gMetaBuildingRegistry.findById(building),
            variant,
        });
    }
}

function lineBuilding({
    x1 = 0,
    y1 = 0,
    x2 = 0,
    y2 = 0,
    building = "empty",
    variant = defaultBuildingVariant,
    rotation = 0,
    rotationVariant = 0,
    layer = "regular",
}) {
    let dx = Math.abs(x2 - x1),
        sx = x1 < x2 ? 1 : -1,
        dy = -Math.abs(y2 - y1),
        sy = y1 < y2 ? 1 : -1,
        err = dx + dy;

    // eslint-disable-next-line no-constant-condition
    while (true) {
        setTile({
            x: x1,
            y: y1,
            building,
            variant,
            rotation,
            rotationVariant,
            layer,
        });

        if (x1 == x2 && y1 == y2) {
            break;
        }

        const e2 = 2 * err;

        if (e2 >= dy) {
            err += dy;
            x1 += sx;
        }

        if (e2 <= dx) {
            err += dx;
            y1 += sy;
        }
    }
}

function findEntity({ x = 0, y = 0, layer = "regular" }) {
    const root = globalConfig["root"];
    return root.map.getTileContent(new Vector(x, y), layer);
}

function test() {
    const modInterface = globalConfig["shapez"].modInterface;
    modInterface.registerNewBuilding({
        metaClass: MetaTestBuilding,
    });

    modInterface.addNewBuildingToToolbar({
        toolbar: "regular",
        location: "primary",
        metaClass: MetaTestBuilding,
    });

    initBuildingCodesAfterResourcesLoaded();
}

export const enumCommands = {
    setTile,
    lineBuilding,
    findEntity,
    test,
};
