import { DrawParameters } from "shapez/core/draw_parameters";
import { Rectangle } from "shapez/core/rectangle";
import { makeDiv } from "shapez/core/utils";
import { Vector } from "shapez/core/vector";
import { Entity } from "shapez/game/entity";
import { GameRoot } from "shapez/game/root";
import { MultiBlockHighlight } from "./multiBlockHighlight";

export class MultiBlockRecipe {
    /**
     * @param {GameRoot} root
     * @param {Array<Array<String|Number>>} recipe
     * @param {Entity} output
     */
    constructor(root, recipe, output) {
        assert(recipe.length != 0, "Invalid recipe");

        /** @type {GameRoot} */
        this.root = root;

        /** @type {Entity} */
        this.output = output;

        /** @type {Rectangle} */
        this.staleArea = this.getStaleArea(recipe);

        /** @type {Array<String|Number>} */
        this.flatRecipe = this.flatTheRecipe(recipe);

        /** @type {Array<Array<String|Number>>} */
        this.recipe = this.fixTheRecipe();

        // /** @type {Array<MovingSprite>} */
        // this.movingSprites = [];

        /** @type {Array<MultiBlockHighlight>} */
        this.highlights = [];

        this.root.signals.entityAdded.add(this.entityUpdated, this);
    }

    update() {
        // for (let i = 0; i < this.movingSprites.length; ++i) {
        //     const sprite = this.movingSprites[i];
        //     if (sprite.done()) {
        //         this.movingSprites.splice(i, 1);
        //         i--;
        //         continue;
        //     }
        //     sprite.update();
        // }
    }

    /**
     * @param {DrawParameters} parameters
     */
    draw(parameters) {
        for (const highlight of this.highlights) {
            highlight.draw(parameters);
        }
        // for (const sprite of this.movingSprites) {
        //     sprite.draw(parameters);
        // }
    }

    /**
     * @param {Rectangle} affectedArea
     * @param {Array<Array<Entity>>} entityList
     */
    recipeIsValid(affectedArea, entityList) {
        // const reachTime = 100;
        // const endingPosition = affectedArea.getCenter().toWorldSpace();

        // this.output.components.StaticMapEntity.origin = endingPosition.toTileSpace();
        // this.root.logic.freeEntityAreaBeforeBuild(this.output);
        // this.root.map.placeStaticEntity(this.output);
        // this.root.entityMgr.registerEntity(this.output);

        const highlight = new MultiBlockHighlight(this.root, affectedArea, entityList);
        this.highlights.push(highlight);
    }

    /**
     * @param {Entity} entity
     */
    entityUpdated(entity) {
        const staticComp = entity.components.StaticMapEntity;
        if (!staticComp) {
            return;
        }

        const metaID = MultiBlockRecipe.getIDFromEntity(entity);
        if (!this.isMetaInRecipe(metaID)) {
            return;
        }

        const entityPosition = staticComp.origin;
        const recipePositions = this.findRecipePositions(metaID);
        for (const recipePosition of recipePositions) {
            const startPos = entityPosition.sub(recipePosition);

            const fakeRect = this.staleArea.clone();
            fakeRect.moveByVector(startPos);

            const entityList = this.testForRecipe(fakeRect, entity);
            if (!entityList) {
                continue;
            }

            this.recipeIsValid(fakeRect, entityList);
        }
    }

    /**
     * @param {Rectangle} affectedArea
     * @param {Entity} entity
     * @returns {Array<Array<Entity>>}
     */
    testForRecipe(affectedArea, entity) {
        /** @type {Array<Array<Entity>>} */
        const entityList = this.create2DArray(this.staleArea.h, this.staleArea.w);

        const entityPos = entity.components.StaticMapEntity.origin;
        for (let i = 0; i < affectedArea.w; ++i) {
            for (let j = 0; j < affectedArea.h; ++j) {
                const x = affectedArea.x + i;
                const y = affectedArea.y + j;

                if (new Vector(x, y).equals(entityPos)) {
                    entityList[i][j] = entity;
                    continue;
                }

                const metaID = this.recipe[i][j];
                const targetEntities = this.root.map.getLayersContentsMultipleXY(x, y);
                if (!targetEntities.length != !metaID) {
                    return;
                }

                for (const entity of targetEntities) {
                    const id = MultiBlockRecipe.getIDFromEntity(entity);
                    if (id !== metaID) {
                        return;
                    }

                    entityList[i][j] = entity;
                }
            }
        }

        return entityList;
    }

    /**
     * @param {Number} x
     * @param {Number} y
     * @return {String|Number}
     */
    getID(x, y) {
        return this.flatRecipe[this.getIDX(x, y)];
    }

    /**
     * @param {Number} x
     * @param {Number} y
     * @returns {Number}
     */
    getIDX(x, y) {
        return x + y * this.staleArea.w;
    }

    /**
     * @param {String|Number} metaID
     * @returns {boolean}
     */
    isMetaInRecipe(metaID) {
        return this.flatRecipe.indexOf(metaID) != -1;
    }

    /**
     * @param {String|Number} metaID
     * @returns {Array<Vector>}
     */
    findRecipePositions(metaID) {
        /** @type {Array<Vector>} */
        const positions = [];

        for (let i = 0; i < this.recipe.length; ++i) {
            for (let j = 0; j < this.recipe[i].length; ++j) {
                if (this.recipe[i][j] === metaID) {
                    positions.push(new Vector(i, j));
                }
            }
        }

        return positions;
    }

    /**
     * @param {Array<Array<String|Number>>} recipe
     * @returns {Rectangle}
     */
    getStaleArea(recipe) {
        let maxHeight = recipe.length;
        let maxWidth = 0;

        for (let i = 0; i < recipe.length; ++i) {
            if (recipe[i].length > maxWidth) {
                maxWidth = recipe[i].length;
            }
        }

        console.log(maxWidth, maxHeight);
        return new Rectangle(0, 0, maxWidth, maxHeight);
    }

    /**
     * @param {Array<Array<String|Number>>} recipe
     * @returns {Array<String|Number>}
     */
    flatTheRecipe(recipe) {
        /** @type {Array<String|Number>} */
        const flatRecipe = [];

        const width = this.staleArea.w;
        for (let j = 0; j < recipe.length; ++j) {
            const length = recipe[j].length;
            flatRecipe.push(...recipe[j]);
            flatRecipe.push(...new Array(width - length).fill(null));
        }

        console.log(flatRecipe);
        return flatRecipe;
    }

    /**
     * @returns {Array<Array<String|Number>>}
     */
    fixTheRecipe() {
        /** @type {Array<Array<String|Number>>} */
        const fixedRecipe = this.create2DArray(this.staleArea.h, this.staleArea.w);

        for (let i = 0; i < this.staleArea.w; ++i) {
            for (let j = 0; j < this.staleArea.h; ++j) {
                fixedRecipe[i][j] = this.getID(i, j);
            }
        }

        return fixedRecipe;
    }

    /**
     * @param {Number} width
     * @param {Number} height
     * @returns {Array<Array<any>>}
     */
    create2DArray(width, height) {
        const arr = new Array(height);
        for (let i = 0; i < height; ++i) {
            arr[i] = new Array(width);
        }

        return arr;
    }

    /**
     * @param {Entity} entity
     */
    static getIDFromEntity(entity) {
        return entity.components.StaticMapEntity.code;
        // const staticComp = entity.components.StaticMapEntity;
        // const metaData = staticComp.getMetaBuilding();
        // const variant = staticComp.getVariant();
        // const rotationVariant = staticComp.getRotationVariant();
        // return getCodeFromBuildingData(metaData, variant, rotationVariant);
    }
}
