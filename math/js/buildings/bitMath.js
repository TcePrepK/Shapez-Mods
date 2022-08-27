import { generateMatrixRotations } from "shapez/core/utils";
import { enumDirection, Vector } from "shapez/core/vector";
import { enumPinSlotType, WiredPinsComponent } from "shapez/game/components/wired_pins";
import { Entity } from "shapez/game/entity";
import { defaultBuildingVariant } from "shapez/game/meta_building";
import { GameRoot } from "shapez/game/root";
import { ModMetaBuilding } from "shapez/mods/mod_meta_building";
import { bitMathVariants, MathGatesComponent } from "../components/mathGates";

const overlayMatrices = {
    [defaultBuildingVariant]: generateMatrixRotations([1, 1, 1, 1, 1, 1, 1, 1, 1]),
    [bitMathVariants.or]: generateMatrixRotations([1, 1, 1, 1, 1, 1, 1, 1, 1]),
    [bitMathVariants.xor]: generateMatrixRotations([1, 1, 1, 1, 1, 1, 1, 1, 1]),

    [bitMathVariants.not]: generateMatrixRotations([0, 1, 0, 0, 1, 0, 0, 1, 0]),

    [bitMathVariants.lshift]: generateMatrixRotations([0, 1, 0, 0, 1, 1, 0, 1, 0]),
    [bitMathVariants.rshift]: generateMatrixRotations([0, 1, 0, 0, 1, 1, 0, 1, 0]),
    [bitMathVariants.urshift]: generateMatrixRotations([0, 1, 0, 0, 1, 1, 0, 1, 0]),
};

export class BitMathGates extends ModMetaBuilding {
    constructor() {
        super("bit_math_gates");
    }

    // @ts-ignore
    getSilhouetteColor() {
        return "#AD7CB0";
    }

    // @ts-ignore
    getDimensions(variant) {
        if (
            variant === defaultBuildingVariant ||
            variant === bitMathVariants.or ||
            variant === bitMathVariants.xor
        ) {
            return new Vector(2, 1);
        }

        return new Vector(1, 1);
    }

    // @ts-ignore
    getSpecialOverlayRenderMatrix(rotation, rotationVariant, variant) {
        return overlayMatrices[variant][rotation];
    }

    /**
     * @param {GameRoot} root
     */
    // @ts-ignore
    getAvailableVariants(root) {
        let arr = [];
        for (const variant in bitMathVariants) {
            arr.push(variant);
        }
        return arr;
    }

    static getAllVariantCombinations() {
        return [
            {
                variant: defaultBuildingVariant,
                name: "Bitwise And",
                description: "Performs an AND operation between each bit of the two input numbers",
            },
            {
                variant: bitMathVariants.or,
                name: "Bitwise Or",
                description: "Performs an OR operation between each bit of the two input numbers",
            },
            {
                variant: bitMathVariants.xor,
                name: "Bitwise Xor",
                description: "Performs an XOR operation between each bit of the two input numbers",
            },
            {
                variant: bitMathVariants.not,
                name: "Bitwise Not",
                description: "Performs a bitwise NOT operation on the input number",
            },
            {
                variant: bitMathVariants.lshift,
                name: "Left Shift",
                description:
                    "Shifts the bottom input left by the number of bits from the right input, filling in the rightmost bits with 0.",
            },
            {
                variant: bitMathVariants.rshift,
                name: "Right Shift",
                description:
                    "Shifts the bottom input right by the number of bits from the right input, filling in the leftmost bits with the sign.",
            },
            {
                variant: bitMathVariants.urshift,
                name: "Unsigned Right Shift",
                description:
                    "Shifts the bottom input right by the number of bits from the right input, filling in the leftmost bits with 0.",
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
        entity.addComponent(new WiredPinsComponent({ slots: [] }));
        entity.addComponent(new MathGatesComponent(bitMathVariants.default));
    }

    /**
     *
     * @param {Entity} entity
     * @param {number} rotationVariant
     * @param {string} variant
     */
    // @ts-ignore
    updateVariants(entity, rotationVariant, variant) {
        entity.components["MathGates"].type = bitMathVariants[variant];

        if (
            variant === defaultBuildingVariant ||
            variant === bitMathVariants.or ||
            variant === bitMathVariants.xor
        ) {
            entity.components.WiredPins.setSlots([
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
            ]);

            return;
        }

        if (variant === bitMathVariants.not) {
            entity.components.WiredPins.setSlots([
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
            ]);

            return;
        }

        if (
            variant === bitMathVariants.lshift ||
            variant === bitMathVariants.rshift ||
            variant === bitMathVariants.urshift
        ) {
            entity.components.WiredPins.setSlots([
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
                    pos: new Vector(0, 0),
                    direction: enumDirection.right,
                    type: enumPinSlotType.logicalAcceptor,
                },
            ]);

            return;
        }
    }
}
