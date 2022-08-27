import { enumDirection, Vector } from "shapez/core/vector";
import { enumPinSlotType, WiredPinsComponent } from "shapez/game/components/wired_pins";
import { Entity } from "shapez/game/entity";
import { defaultBuildingVariant } from "shapez/game/meta_building";
import { GameRoot } from "shapez/game/root";
import { ModMetaBuilding } from "shapez/mods/mod_meta_building";
import { basicMathVariants, MathGatesComponent } from "../components/mathGates";

export class BasicMathGates extends ModMetaBuilding {
    constructor() {
        super("basic_math_gates");
    }

    // @ts-ignore
    getSilhouetteColor() {
        return "#83DFC2";
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
        for (const variant in basicMathVariants) {
            arr.push(variant);
        }
        return arr;
    }

    static getAllVariantCombinations() {
        return [
            {
                variant: defaultBuildingVariant,
                name: "Addition",
                description: "Emits the sum of the two inputs.",
            },
            {
                variant: basicMathVariants.subtraction,
                name: "Subtraction",
                description: "Emits the difference of the right input from the left input.",
            },
            {
                variant: basicMathVariants.multiplication,
                name: "Multiplication",
                description: "Emits the product of the two inputs.",
            },
            {
                variant: basicMathVariants.division,
                name: "Division",
                description: "Emits the quotient of the left input divided by the right input.",
            },
            {
                variant: basicMathVariants.modulo,
                name: "Modulo",
                description: "Emits the remainder of the left input divided by the right input.",
            },
            {
                variant: basicMathVariants.powerof,
                name: "Exponent",
                description: "Emits the result of raising the left input to the power of the right input.",
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
                        pos: new Vector(0, 0),
                        direction: enumDirection.top,
                        type: enumPinSlotType.logicalEjector,
                    },
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
                ],
            })
        );

        entity.addComponent(new MathGatesComponent(basicMathVariants.addition));
    }

    /**
     *
     * @param {Entity} entity
     * @param {number} rotationVariant
     * @param {string} variant
     */
    // @ts-ignore
    updateVariants(entity, rotationVariant, variant) {
        entity.components["MathGates"].type = basicMathVariants[variant];
    }
}
