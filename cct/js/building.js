import { enumDirection, Vector } from "shapez/core/vector";
import { enumPinSlotType, WiredPinsComponent } from "shapez/game/components/wired_pins";
import { ModMetaBuilding } from "shapez/mods/mod_meta_building";
import { CCTComponent } from "./component";

export class MetaCCTBuilding extends ModMetaBuilding {
    constructor() {
        super("command_controller");
    }

    static getAllVariantCombinations() {
        return [
            {
                name: "CCT",
                description: "Command block",
                variant: shapez.defaultBuildingVariant,
            },
        ];
    }

    getSilhouetteColor() {
        return "#000000";
    }

    getIsUnlocked(root) {
        return true;
    }

    getDimensions() {
        return new Vector(3, 3);
    }

    getRenderPins() {
        return false;
    }

    setupEntityComponents(entity) {
        entity.addComponent(
            new WiredPinsComponent({
                slots: [
                    {
                        pos: new Vector(1, 2),
                        direction: enumDirection.bottom,
                        type: enumPinSlotType.logicalAcceptor,
                    },
                ],
            })
        );

        entity.addComponent(new CCTComponent());
    }
}

export class MetaTestBuilding extends ModMetaBuilding {
    constructor() {
        super("test");
    }

    static getAllVariantCombinations() {
        return [
            {
                name: "Test",
                description: "Test on cracks",
                variant: shapez.defaultBuildingVariant,
            },
        ];
    }

    getSilhouetteColor() {
        return "#000000";
    }

    getIsUnlocked(root) {
        return true;
    }

    getDimensions() {
        return new Vector(5, 5);
    }

    getRenderPins() {
        return true;
    }

    setupEntityComponents(entity) {
        entity.addComponent(
            new WiredPinsComponent({
                slots: [
                    {
                        pos: new Vector(1, 2),
                        direction: enumDirection.bottom,
                        type: enumPinSlotType.logicalAcceptor,
                    },
                ],
            })
        );

        entity.addComponent(new CCTComponent());
    }
}
