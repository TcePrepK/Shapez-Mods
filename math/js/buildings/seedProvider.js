import { generateMatrixRotations } from "shapez/core/utils";
import { enumDirection, Vector } from "shapez/core/vector";
import { enumPinSlotType, WiredPinsComponent } from "shapez/game/components/wired_pins";
import { Entity } from "shapez/game/entity";
import { defaultBuildingVariant } from "shapez/game/meta_building";
import { GameRoot } from "shapez/game/root";
import { ModMetaBuilding } from "shapez/mods/mod_meta_building";
import { SeedProviderComponent } from "../components/seedProvider";

const overlayMatrix = generateMatrixRotations([0, 1, 0, 1, 1, 1, 1, 1, 1]);

export class SeedProvider extends ModMetaBuilding {
    constructor() {
        super("seed_provider");
    }

    // @ts-ignore
    getSilhouetteColor() {
        return "#89AC76";
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
                name: "Seed Provider",
                description: "Emits the map seed as a constant.",
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
        entity.addComponent(new SeedProviderComponent());

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
    }
}
