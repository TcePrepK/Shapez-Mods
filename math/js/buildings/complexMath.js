import { enumDirection, Vector } from "shapez/core/vector";
import { enumPinSlotType, WiredPinsComponent } from "shapez/game/components/wired_pins";
import { Entity } from "shapez/game/entity";
import { defaultBuildingVariant } from "shapez/game/meta_building";
import { GameRoot } from "shapez/game/root";
import { ModMetaBuilding } from "shapez/mods/mod_meta_building";
import { ComplexMathComponent, enumComplexMathGateVariants } from "../components/complexMath";

export class ComplexMathGates extends ModMetaBuilding {
    constructor() {
        super("complex_math_gates");
    }

    // @ts-ignore
    getSilhouetteColor() {
        return "#7dcda2";
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
        for (const variant in enumComplexMathGateVariants) {
            arr.push(variant);
        }
        return arr;
    }

    static getAllVariantCombinations() {
        return [
            {
                variant: defaultBuildingVariant,
                name: "Sin",
                description: "Takes the sine of the input",
            },
            {
                variant: enumComplexMathGateVariants.cos,
                name: "Cos",
                description: "Takes the cosine of the input",
            },
            {
                variant: enumComplexMathGateVariants.tan,
                name: "Tan",
                description: "Takes the tangent of the input",
            },
            {
                variant: enumComplexMathGateVariants.cot,
                name: "Cot",
                description: "Takes the cotangent of the input",
            },
            {
                variant: enumComplexMathGateVariants.csc,
                name: "Csc",
                description: "Takes the cosecant of the input",
            },
            {
                variant: enumComplexMathGateVariants.sec,
                name: "Sec",
                description: "Takes the secant of the input",
            },
            {
                variant: enumComplexMathGateVariants.log,
                name: "Log",
                description: "Takes the log of the input",
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
    }

    /**
     *
     * @param {Entity} entity
     * @param {number} rotationVariant
     * @param {string} variant
     */
    // @ts-ignore
    updateVariants(entity, rotationVariant, variant) {
        if (entity.components["ComplexMath"]) {
            return;
        }

        entity.addComponent(new ComplexMathComponent(enumComplexMathGateVariants[variant]));
    }
}
