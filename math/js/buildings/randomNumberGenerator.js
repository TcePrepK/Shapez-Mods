import { generateMatrixRotations } from "shapez/core/utils";
import { enumDirection, Vector } from "shapez/core/vector";
import { enumPinSlotType, WiredPinsComponent } from "shapez/game/components/wired_pins";
import { Entity } from "shapez/game/entity";
import { defaultBuildingVariant } from "shapez/game/meta_building";
import { GameRoot } from "shapez/game/root";
import { ModMetaBuilding } from "shapez/mods/mod_meta_building";
import { RandomNumberGeneratorComponent } from "../components/randomNumberGenerator";

const overlayMatrix = generateMatrixRotations([0, 1, 0, 1, 1, 1, 1, 1, 1]);

export class RandomNumberGenerator extends ModMetaBuilding {
    constructor() {
        super("random_number_generator");
    }

    // @ts-ignore
    getSilhouetteColor() {
        return "#F75E25";
    }

    // @ts-ignore
    getDimensions(variant) {
        return new Vector(1, 1);
    }

    // @ts-ignore
    getSpecialOverlayRenderMatrix(rotation) {
        return overlayMatrix[rotation];
    }

    /**
     * @param {GameRoot} root
     */
    // @ts-ignore
    getAvailableVariants(root) {
        return [defaultBuildingVariant];
    }

    static getAllVariantCombinations() {
        return [
            {
                variant: defaultBuildingVariant,
                name: "Random Number Generator",
                description:
                    "Emits a new random number from [0, 1) when the input changes from falsy to truthy.",
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
        entity.addComponent(new RandomNumberGeneratorComponent());

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
                ],
            })
        );
    }
}
