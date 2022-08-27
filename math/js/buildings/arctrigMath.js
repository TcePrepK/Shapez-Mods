import { enumDirection, Vector } from "shapez/core/vector";
import { enumPinSlotType, WiredPinsComponent } from "shapez/game/components/wired_pins";
import { Entity } from "shapez/game/entity";
import { defaultBuildingVariant } from "shapez/game/meta_building";
import { GameRoot } from "shapez/game/root";
import { ModMetaBuilding } from "shapez/mods/mod_meta_building";
import { arctrigMathVariants, MathGatesComponent } from "../components/mathGates";

export class ArcTrigMathGates extends ModMetaBuilding {
    constructor() {
        super("arctrig_math_gates");
    }

    // @ts-ignore
    getSilhouetteColor() {
        return "#3B83BD";
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
        for (const variant in arctrigMathVariants) {
            arr.push(variant);
        }
        return arr;
    }

    static getAllVariantCombinations() {
        return [
            {
                variant: defaultBuildingVariant,
                name: "Arcsine",
                description: "Emits the arcsine of the input.",
            },
            {
                variant: arctrigMathVariants.arccos,
                name: "Arccosine",
                description: "Emits the arccosine of the input.",
            },
            {
                variant: arctrigMathVariants.arctan,
                name: "Arctangent",
                description: "Emits the arctangent of the input.",
            },
            {
                variant: arctrigMathVariants.arccot,
                name: "Arccotangent",
                description: "Emits the arccotangent of the input.",
            },
            {
                variant: arctrigMathVariants.arccsc,
                name: "Arccosecant",
                description: "Emits the arccosecant of the input.",
            },
            {
                variant: arctrigMathVariants.arcsec,
                name: "Arcsecant",
                description: "Emits the arcsecant of the input.",
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

        entity.addComponent(new MathGatesComponent(arctrigMathVariants.default));
    }

    /**
     *
     * @param {Entity} entity
     * @param {number} rotationVariant
     * @param {string} variant
     */
    // @ts-ignore
    updateVariants(entity, rotationVariant, variant) {
        entity.components["MathGates"].type = arctrigMathVariants[variant];
    }
}
