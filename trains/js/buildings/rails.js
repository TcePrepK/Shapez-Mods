import { Loader } from "shapez/core/loader";
import { enumDirection } from "shapez/core/vector";
import { Entity } from "shapez/game/entity";
import { defaultBuildingVariant } from "shapez/game/meta_building";
import { GameRoot } from "shapez/game/root";
import { ModMetaBuilding } from "shapez/mods/mod_meta_building";
import { SOUNDS } from "shapez/platform/sound";
import { RailComponent } from "../components/railComponent";

export const enumRailVariantToRotation = [enumDirection.top, enumDirection.left, enumDirection.right];

export class MetaRailBuilding extends ModMetaBuilding {
    constructor() {
        super("rails");
    }

    getSilhouetteColor() {
        return "#aaaaaa";
    }

    /**
     * @param {GameRoot} root
     */
    getAvailableVariants(root) {
        return [defaultBuildingVariant];
    }

    static getAllVariantCombinations() {
        return [
            {
                variant: defaultBuildingVariant,
                name: "Rails",
                description: "Rails",
                rotationVariant: 0,
            },
            {
                variant: defaultBuildingVariant,
                name: "Rails",
                description: "Rails",
                rotationVariant: 1,
            },
            {
                variant: defaultBuildingVariant,
                name: "Rails",
                description: "Rails",
                rotationVariant: 2,
            },
        ];
    }

    getPlacementSound() {
        return SOUNDS.placeBelt;
    }

    getHasDirectionLockAvailable() {
        return true;
    }
    getStayInPlacementMode() {
        return true;
    }

    getRotateAutomaticallyWhilePlacing() {
        return true;
    }

    getIsReplaceable() {
        return true;
    }

    /**
     * @param {GameRoot} root
     */
    getIsUnlocked(root) {
        return true;
    }

    /**
     * @param {number} rotationVariant
     * @param {String} state
     */
    static getSpriteByState(rotationVariant, state) {
        return Loader.getSprite(
            "sprites/" + state + "/belt_" + enumRailVariantToRotation[rotationVariant] + ".png"
        );
    }

    getSprite() {
        return null;
    }

    getPreviewSprite(rotationVariant) {
        return MetaRailBuilding.getSpriteByState(rotationVariant, "buildings");
    }

    getBlueprintSprite(rotationVariant) {
        return MetaRailBuilding.getSpriteByState(rotationVariant, "blueprints");
    }

    /**
     * Creates the entity at the given location
     * @param {Entity} entity
     */
    setupEntityComponents(entity) {
        entity.addComponent(new RailComponent());
    }

    /**
     * @param {Entity} entity
     * @param {number} rotationVariant
     */
    updateVariants(entity, rotationVariant) {
        entity.components["Rail"].direction = enumRailVariantToRotation[rotationVariant];
    }
}
