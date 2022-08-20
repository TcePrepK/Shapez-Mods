import { enumDirection, Vector } from "shapez/core/vector";
import { enumPinSlotType, WiredPinsComponent } from "shapez/game/components/wired_pins";
import { Entity } from "shapez/game/entity";
import { defaultBuildingVariant } from "shapez/game/meta_building";
import { RegularGameMode } from "shapez/game/modes/regular";
import { GameRoot } from "shapez/game/root";
import { enumHubGoalRewards } from "shapez/game/tutorial_goals";
import { ModMetaBuilding } from "shapez/mods/mod_meta_building";
import { KeyboardInputComponent } from "../components/keyboard_input";
import { MouseInputComponent } from "../components/mouse_input";
import { WirelessCodeComponent } from "../components/wireless_code";

export const enumUserInputVariants = {
    mouse_input: "mouse_input",
};

export class MetaUserInputBuildings extends ModMetaBuilding {
    constructor() {
        super("user_input");
    }

    getSilhouetteColor() {
        return "#aaaaaa";
    }

    /**
     * @param {GameRoot} root
     */
    getIsUnlocked(root) {
        return root.hubGoals.isRewardUnlocked(enumHubGoalRewards.reward_logic_gates);
    }

    getAvailableVariants() {
        return [defaultBuildingVariant, enumUserInputVariants.mouse_input];
    }

    static getAllVariantCombinations() {
        return [
            {
                variant: defaultBuildingVariant,
                name: "Keyboard Reader",
                description: 'Emits a boolean "1" when the set key is pressed.',
            },
            {
                variant: enumUserInputVariants.mouse_input,
                name: "Mouse Reader",
                description:
                    "Wirelessly sends an encoded shape based on cursor position to Static Tranceivers on the same channel.",
            },
        ];
    }

    getLayer(variant) {
        switch (variant) {
            case defaultBuildingVariant:
                return "regular";
            case enumUserInputVariants.mouse_input:
                return "wires";
            default:
                return "regular";
        }
    }

    setupEntityComponents(entity) {}

    /**
     *
     * @param {Entity} entity
     * @param {number} rotationVariant
     * @param {string} variant
     */
    updateVariants(entity, rotationVariant, variant) {
        entity.components["KeyboardInput"] ? entity.removeComponent(KeyboardInputComponent) : null;
        entity.components["MouseInput"] ? entity.removeComponent(MouseInputComponent) : null;
        entity.components["WirelessCode"] ? entity.removeComponent(WirelessCodeComponent) : null;
        entity.components["WiredPins"] ? entity.removeComponent(WiredPinsComponent) : null;

        switch (variant) {
            case defaultBuildingVariant:
                entity.addComponent(new KeyboardInputComponent());
                entity.addComponent(
                    new WiredPinsComponent({
                        slots: [
                            {
                                pos: new Vector(0, 0),
                                direction: enumDirection.top,
                                type: enumPinSlotType.logicalEjector,
                            },
                        ],
                    })
                );
                break;
            case enumUserInputVariants.mouse_input:
                entity.addComponent(new MouseInputComponent());
                entity.addComponent(new WirelessCodeComponent());
                break;
        }
    }
}
