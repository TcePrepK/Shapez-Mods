import { globalConfig } from "shapez/core/config";
import { DrawParameters } from "shapez/core/draw_parameters";
import { gMetaBuildingRegistry } from "shapez/core/global_registries";
import { Vector } from "shapez/core/vector";
import { enumRotaterVariants, MetaRotaterBuilding } from "shapez/game/buildings/rotater";
import { Entity } from "shapez/game/entity";
import { BaseHUDPart } from "shapez/game/hud/base_hud_part";
import { defaultBuildingVariant, MetaBuilding } from "shapez/game/meta_building";
import { MultiBlockRecipe } from "./multiBlockRecipe";

export class MultiBlockManager extends BaseHUDPart {
    initialize() {
        /** @type {Array<MultiBlockRecipe>} */
        this.recipes = [];

        globalConfig["multiBlockManager"] = this;

        /** @type {MultiBlockManager} */
        const multiBlockManager = globalConfig["multiBlockManager"];
        const rotator = multiBlockManager.createEntity(MetaRotaterBuilding, {});
        const rotatorID = multiBlockManager.getIDFromEntity(rotator);

        const recipe = [
            [rotatorID, rotatorID, rotatorID, rotatorID],
            [rotatorID, rotatorID, rotatorID],
            [rotatorID, rotatorID],
        ];

        const output = multiBlockManager.createEntity(MetaRotaterBuilding, {
            variant: enumRotaterVariants.rotate180,
        });

        multiBlockManager.addRecipe(recipe, output);
    }

    update() {
        for (const recipe of this.recipes) {
            recipe.update();
        }
    }

    /**
     * @param {DrawParameters} parameters
     */
    draw(parameters) {
        for (const recipe of this.recipes) {
            recipe.draw(parameters);
        }
    }

    /**
     * @param {Array<Array<String|Number>>} recipe
     * @param {Entity} output
     */
    addRecipe(recipe, output) {
        this.recipes.push(new MultiBlockRecipe(this.root, recipe, output));
    }

    /**
     * @param {typeof MetaBuilding} metaBuilding
     * @param {object} param1
     * @param {number=} param1.rotation Rotation
     * @param {number=} param1.originalRotation Original Rotation
     * @param {number=} param1.rotationVariant Rotation variant
     * @param {string=} param1.variant Variant
     * @returns {Entity}
     */
    createEntity(
        metaBuilding,
        { rotation = 0, originalRotation = 0, rotationVariant = 0, variant = defaultBuildingVariant }
    ) {
        return gMetaBuildingRegistry.findByClass(metaBuilding).createEntity({
            root: this.root,
            origin: new Vector(0, 0),
            rotation: rotation,
            originalRotation,
            rotationVariant,
            variant,
        });
    }

    /**
     * @param {Entity} entity
     */
    getIDFromEntity(entity) {
        return MultiBlockRecipe.getIDFromEntity(entity);
    }
}
