import { enumDirection, Vector } from "shapez/core/vector";
import { enumPinSlotType, WiredPinsComponent } from "shapez/game/components/wired_pins";
import { Entity } from "shapez/game/entity";
import { defaultBuildingVariant } from "shapez/game/meta_building";
import { GameRoot } from "shapez/game/root";
import { ModMetaBuilding } from "shapez/mods/mod_meta_building";
import { complexMathVariants, MathGatesComponent } from "../components/mathGates";

export class ComplexMathGates extends ModMetaBuilding {
    constructor() {
        super("complex_math_gates");
    }

    // @ts-ignore
    getSilhouetteColor() {
        return "#287233";
    }

    // @ts-ignore
    getDimensions(variant) {
        return new Vector(2, 1);
    }

    /**
     * @param {GameRoot} root
     */
    // @ts-ignore
    getAvailableVariants(root) {
        let arr = [];
        for (const variant in complexMathVariants) {
            arr.push(variant);
        }
        return arr;
    }

    static getAllVariantCombinations() {
        return [
            {
                variant: defaultBuildingVariant,
                name: "Logarithm",
                description: "Emits the base-10 logarithm of the input.",
            },
            {
                variant: complexMathVariants.sqrt,
                name: "Square Root",
                description: "Emits the square root of the input.",
            },
            {
                variant: complexMathVariants.floor,
                name: "Floor",
                description: "Emits the nearest integer of the input, rounding down.",
            },
            {
                variant: complexMathVariants.ceil,
                name: "Ceil",
                description: "Emits the nearest integer of the input, rounding up.",
            },
            {
                variant: complexMathVariants.round,
                name: "Round",
                description: "Emits the nearest integer of the input.",
            },
            {
                variant: complexMathVariants.sign,
                name: "Sign",
                description: "Emits the sign of the input as 1 or -1 (0 if input is 0).",
            },
            {
                variant: complexMathVariants.abs,
                name: "Absolute Value",
                description: "Emits the absolute value of the input.",
            },
        ];
    }

    /**
     * @param {GameRoot} root
     */
    // @ts-ignore
    getIsUnlocked(root) {
        return true; //root.hubGoals.isRewardUnlocked(enumHubGoalRewards.reward_cutter_and_trash);
    }

    /** @returns {"wires"} **/
    // @ts-ignore
    getLayer() {
        return "wires";
    }

    // @ts-ignore
    getRenderPins() {
        // We already have it included
        return false;
    }

    /**
     * Creates the entity at the given location
     * @param {Entity} entity
     */
    // @ts-ignore
    setupEntityComponents(entity) {
        entity.addComponent(
            new WiredPinsComponent({
                slots: [
                    {
                        pos: new Vector(1, 0),
                        direction: enumDirection.right,
                        type: enumPinSlotType.logicalEjector,
                    },
                    {
                        pos: new Vector(0, 0),
                        direction: enumDirection.left,
                        type: enumPinSlotType.logicalAcceptor,
                    },
                ],
            })
        );

        entity.addComponent(new MathGatesComponent(complexMathVariants.default));
    }

    /**
     *
     * @param {Entity} entity
     * @param {number} rotationVariant
     * @param {string} variant
     */
    // @ts-ignore
    updateVariants(entity, rotationVariant, variant) {
        entity.components["MathGates"].type = complexMathVariants[variant];
    }
}
