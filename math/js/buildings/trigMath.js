import { enumDirection, Vector } from "shapez/core/vector";
import { enumPinSlotType, WiredPinsComponent } from "shapez/game/components/wired_pins";
import { Entity } from "shapez/game/entity";
import { defaultBuildingVariant } from "shapez/game/meta_building";
import { GameRoot } from "shapez/game/root";
import { ModMetaBuilding } from "shapez/mods/mod_meta_building";
import { MathGatesComponent, trigMathVairants } from "../components/mathGates";

export class TrigMathGates extends ModMetaBuilding {
    constructor() {
        super("trig_math_gates");
    }

    // @ts-ignore
    getSilhouetteColor() {
        return "#D26F53";
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
        for (const variant in trigMathVairants) {
            arr.push(variant);
        }
        return arr;
    }

    static getAllVariantCombinations() {
        return [
            {
                variant: defaultBuildingVariant,
                name: "Sine",
                description: "Emits the sine of the input.",
            },
            {
                variant: trigMathVairants.cos,
                name: "Cosine",
                description: "Emits the cosine of the input.",
            },
            {
                variant: trigMathVairants.tan,
                name: "Tangent",
                description: "Emits the tangent of the input.",
            },
            {
                variant: trigMathVairants.cot,
                name: "Cotangent",
                description: "Emits the cotangent of the input.",
            },
            {
                variant: trigMathVairants.csc,
                name: "Cosecant",
                description: "Emits the cosecant of the input.",
            },
            {
                variant: trigMathVairants.sec,
                name: "Secant",
                description: "Emits the secant of the input.",
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

        entity.addComponent(new MathGatesComponent(trigMathVairants.default));
    }

    /**
     *
     * @param {Entity} entity
     * @param {number} rotationVariant
     * @param {string} variant
     */
    // @ts-ignore
    updateVariants(entity, rotationVariant, variant) {
        entity.components["MathGates"].type = trigMathVairants[variant];
    }
}
