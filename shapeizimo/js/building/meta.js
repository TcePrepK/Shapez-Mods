import { ModMetaBuilding } from "shapez/mods/mod_meta_building";
import { enumHubGoalRewards } from "shapez/game/tutorial_goals";
import { defaultBuildingVariant } from "shapez/game/meta_building";
import { Entity } from "shapez/game/entity";

export class MetaFunctionBlock extends ModMetaBuilding {
    constructor() {
        super("function_block");
    }

    // @ts-ignore
    getSilhouetteColor() {
        return "#aaaaaa";
    }

    // @ts-ignore
    getHasDirectionLockAvailable() {
        return false;
    }

    // @ts-ignore
    getIsUnlocked(root) {
        return root.hubGoals.isRewardUnlocked(enumHubGoalRewards.reward_freeplay);
    }

    // @ts-ignore
    getAvailableVariants() {
        return [defaultBuildingVariant];
    }

    static getAllVariantCombinations() {
        return [
            {
                variant: defaultBuildingVariant,
                name: "Function Block",
                description: "Placeholder.",
            },
        ];
    }

    // @ts-ignore
    setupEntityComponents(entity) {
        // entity.addComponent(new WirelessCodeComponent());
    }

    /**
     *
     * @param {Entity} entity
     * @param {number} rotationVariant
     * @param {string} variant
     @ts-ignore */
    updateVariants(entity, rotationVariant, variant) {
        // TODO
    }
}
