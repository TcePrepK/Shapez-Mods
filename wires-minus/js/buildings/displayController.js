import { enumDirection, Vector } from "shapez/core/vector";
import { enumPinSlotType, WiredPinsComponent } from "shapez/game/components/wired_pins";
import { defaultBuildingVariant } from "shapez/game/meta_building";
import { enumHubGoalRewards } from "shapez/game/tutorial_goals";
import { ModMetaBuilding } from "shapez/mods/mod_meta_building";
import { DisplayControllerComponent } from "../components/displayController";
import { FiberPinsComponent } from "../components/fiberPins";

export class MetaDisplayController extends ModMetaBuilding {
    constructor() {
        super("display_controller");
    }

    // @ts-ignore
    getSilhouetteColor() {
        return "#aaaaaa";
    }

    // @ts-ignore
    getIsUnlocked(root) {
        return root.hubGoals.isRewardUnlocked(enumHubGoalRewards.reward_display);
    }

    // @ts-ignore
    getDimensions() {
        return new Vector(2, 1);
    }

    // @ts-ignore
    getLayer() {
        return "wires";
    }

    // @ts-ignore
    getRenderPins() {
        return false;
    }

    // @ts-ignore
    getAvailableVariants() {
        return [defaultBuildingVariant];
    }

    static getAllVariantCombinations() {
        const variants = [
            {
                variant: defaultBuildingVariant,
                name: "Display Controller",
                description: "Sets the specified pixel on linked displays.",
            },
        ];

        return variants;
    }

    // @ts-ignore
    setupEntityComponents(entity) {
        entity.addComponent(new DisplayControllerComponent());
        entity.addComponent(
            new WiredPinsComponent({
                slots: [
                    {
                        pos: new Vector(0, 0),
                        direction: enumDirection.bottom,
                        type: enumPinSlotType.logicalAcceptor,
                    },
                    {
                        pos: new Vector(1, 0),
                        direction: enumDirection.bottom,
                        type: enumPinSlotType.logicalAcceptor,
                    },
                    {
                        pos: new Vector(1, 0),
                        direction: enumDirection.right,
                        type: enumPinSlotType.logicalAcceptor,
                    },
                ],
            })
        );
        entity.addComponent(
            new FiberPinsComponent([
                {
                    tilePos: new Vector(0, 0),
                    offset: new Vector(1, -0.5),
                    wires: [],
                },
            ])
        );
    }
}
