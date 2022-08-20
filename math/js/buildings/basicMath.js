import { enumDirection, Vector } from "shapez/core/vector";
import { enumPinSlotType, WiredPinsComponent } from "shapez/game/components/wired_pins";
import { Entity } from "shapez/game/entity";
import { defaultBuildingVariant } from "shapez/game/meta_building";
import { GameRoot } from "shapez/game/root";
import { ModMetaBuilding } from "shapez/mods/mod_meta_building";
import { BasicMathComponent, enumBasicMathGateVariants } from "../components/basicMath";

export class BasicMathGates extends ModMetaBuilding {
    constructor() {
        super("basic_math_gates");
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
        for (const variant in enumBasicMathGateVariants) {
            arr.push(variant);
        }
        return arr;
    }

    static getAllVariantCombinations() {
        return [
            {
                variant: defaultBuildingVariant,
                name: "Addition",
                description: "Adds two numbers together",
            },
            {
                variant: enumBasicMathGateVariants.subtraction,
                name: "Subtraction",
                description: "Subtracts two numbers",
            },
            {
                variant: enumBasicMathGateVariants.multiplication,
                name: "Multiplication",
                description: "Multiplies two numbers",
            },
            {
                variant: enumBasicMathGateVariants.division,
                name: "Division",
                description: "Divides two numbers",
            },
            {
                variant: enumBasicMathGateVariants.modulo,
                name: "Modulo",
                description: "Gets the remainder of two numbers",
            },
            {
                variant: enumBasicMathGateVariants.powerof,
                name: "Power of",
                description: "Raises one number to the power of another",
            },
            {
                variant: enumBasicMathGateVariants.greater,
                name: "Greater than",
                description: "Checks if one number is greater than another",
            },
            {
                variant: enumBasicMathGateVariants.less,
                name: "Less than",
                description: "Checks if one number is less than another",
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
    }

    /**
     *
     * @param {Entity} entity
     * @param {number} rotationVariant
     * @param {string} variant
     */
    // @ts-ignore
    updateVariants(entity, rotationVariant, variant) {
        if (entity.components["BasicMath"]) {
            return;
        }

        entity.addComponent(new BasicMathComponent(enumBasicMathGateVariants[variant]));
    }
}
