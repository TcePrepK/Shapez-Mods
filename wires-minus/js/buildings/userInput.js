import { enumDirection, Vector } from "shapez/core/vector";
import { enumPinSlotType, WiredPinsComponent } from "shapez/game/components/wired_pins";
import { Entity } from "shapez/game/entity";
import { defaultBuildingVariant } from "shapez/game/meta_building";
import { GameRoot } from "shapez/game/root";
import { enumHubGoalRewards } from "shapez/game/tutorial_goals";
import { ModMetaBuilding } from "shapez/mods/mod_meta_building";
import { FiberPinsComponent } from "../components/fiberPins";
import { KeyboardReaderComponent } from "../components/keyboardReader";
import { MouseReaderComponent } from "../components/mouseReader";

export const userInputVariants = {
    mouse_reader: "mouse_reader",
};

export class MetaUserInputBuildings extends ModMetaBuilding {
    constructor() {
        super("user_input");
    }

    // @ts-ignore
    getSilhouetteColor() {
        return "#aaaaaa";
    }

    /**
     * @param {GameRoot} root
     */
    // @ts-ignore
    getIsUnlocked(root) {
        return root.hubGoals.isRewardUnlocked(enumHubGoalRewards.reward_logic_gates);
    }

    /**
     * @param {GameRoot} root
     */
    // @ts-ignore
    getAvailableVariants(root) {
        return [defaultBuildingVariant, userInputVariants.mouse_reader];
    }

    static getAllVariantCombinations() {
        return [
            {
                variant: defaultBuildingVariant,
                name: "Keyboard Reader",
                description: 'Emits a boolean "1" when the set key is pressed.',
            },
            {
                variant: userInputVariants.mouse_reader,
                name: "Mouse Reader",
                description: "Reads cursor position from linked displays.",
            },
        ];
    }

    // @ts-ignore
    getDimensions(variant) {
        switch (variant) {
            case defaultBuildingVariant:
                return new Vector(1, 1);
            case userInputVariants.mouse_reader:
                return new Vector(2, 1);
            default:
                assertAlways(false, "Unknown balancer variant: " + variant);
        }
    }

    // @ts-ignore
    getLayer(variant) {
        switch (variant) {
            case defaultBuildingVariant:
                return "regular";
            case userInputVariants.mouse_reader:
                return "wires";
            default:
                return "regular";
        }
    }

    /**
     * @param {Entity} entity
     */
    // @ts-ignore
    setupEntityComponents(entity) {
        entity.addComponent(new WiredPinsComponent({ slots: [] }));
    }

    // @ts-ignore
    getRenderPins(variant) {
        return variant == defaultBuildingVariant;
    }

    /**
     *
     * @param {Entity} entity
     * @param {number} rotationVariant
     * @param {string} variant
     */
    // @ts-ignore
    updateVariants(entity, rotationVariant, variant) {
        if (KeyboardReaderComponent.get(entity)) entity.removeComponent(KeyboardReaderComponent);
        if (MouseReaderComponent.get(entity)) entity.removeComponent(MouseReaderComponent);
        if (FiberPinsComponent.get(entity)) entity.removeComponent(FiberPinsComponent);

        switch (variant) {
            case defaultBuildingVariant:
                entity.addComponent(new KeyboardReaderComponent());
                entity.components.WiredPins.setSlots([
                    {
                        pos: new Vector(0, 0),
                        direction: enumDirection.top,
                        type: enumPinSlotType.logicalEjector,
                    },
                ]);
                break;
            case userInputVariants.mouse_reader:
                entity.addComponent(new MouseReaderComponent());
                entity.components.WiredPins.setSlots([
                    {
                        pos: new Vector(0, 0),
                        direction: enumDirection.top,
                        type: enumPinSlotType.logicalEjector,
                    },
                    {
                        pos: new Vector(1, 0),
                        direction: enumDirection.top,
                        type: enumPinSlotType.logicalEjector,
                    },
                ]);
                entity.addComponent(
                    new FiberPinsComponent([
                        {
                            tilePos: new Vector(0, 0),
                            offset: new Vector(1, 0.5),
                            wires: [],
                        },
                    ])
                );
                break;
        }
    }
}
