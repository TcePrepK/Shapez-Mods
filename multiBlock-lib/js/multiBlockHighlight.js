import { globalConfig } from "shapez/core/config";
import { DrawParameters } from "shapez/core/draw_parameters";
import { Rectangle } from "shapez/core/rectangle";
import { makeDiv, makeDivElement } from "shapez/core/utils";
import { Entity } from "shapez/game/entity";
import { GameRoot } from "shapez/game/root";

export class MultiBlockHighlight {
    /**
     * @param {GameRoot} root
     * @param {Rectangle} staleArea
     * @param {Array<Array<Entity>>} entityList
     */
    constructor(root, staleArea, entityList) {
        /** @type {GameRoot} */
        this.root = root;

        /** @type {Rectangle} */
        this.staleArea = staleArea;

        /** @type {Array<Array<Entity>>} */
        this.entityList = entityList;

        /** @type {Array<Entity>} */
        this.flatEntityList = this.flatTheEntityList(entityList);

        /** @type {Number} */
        this.animationTime = 100;

        /** @type {Number} */
        this.currentTime = 0;

        /** @type {Number} */
        this.offset = 0;

        /** @type {Number} */
        this.offsetAngle = 0;

        this.initializeElement();
    }

    initializeElement() {
        // this.element = makeDiv(
        //     this.parent,
        //     "ingame_HUD_MultiBlockManager",
        //     [],
        //     "<h2>UNSTABLE BETA VERSION</h2><span>Unfinalized & potential buggy content!</span>"
        // );
        this.element = makeDivElement("ingame_HUD_MultiBlockManager", [], null);
    }

    renderCheckbox() {
        document.body.appendChild(this.element);
        const style = this.element.style;
        const rectWorldPos = this.staleArea.getCenter().toWorldSpace();
        const rectScreenPos = this.root.camera.worldToScreen(rectWorldPos);

        const width = this.root.camera.zoomLevel * globalConfig.tileSize;
        style.left = rectScreenPos.x + "px";
        style.top = rectScreenPos.y + "px";
        style.width = width + "px";
        style.height = width + "px";
    }

    /**
     * @param {DrawParameters} parameters
     */
    draw(parameters) {
        this.renderCheckbox();

        const mousePos = this.root.app.mousePosition;
        if (!mousePos) {
            // Mouse pos not ready
            return;
        }

        const worldPos = this.root.camera.screenToWorld(mousePos);
        const rect = this.staleArea.allScaled(globalConfig.tileSize);
        if (!rect.containsPoint(worldPos.x, worldPos.y)) {
            return;
        }

        const hoveredTile = worldPos.toTileSpace();
        const contents = this.root.map.getLayersContentsMultipleXY(hoveredTile.x, hoveredTile.y);
        if (contents.length == 0) {
            return;
        }

        let correctTile = false;
        for (const entity of contents) {
            for (let i = 0; i < this.entityList.length; i++) {
                for (let j = 0; j < this.entityList[i].length; j++) {
                    if (this.entityList[i][j] == entity) {
                        correctTile = true;
                        break;
                    }
                }
            }
        }

        if (!correctTile) {
            return;
        }

        const ctx = parameters.context;
        ctx.translate(rect.x, rect.y);
        ctx.strokeStyle = "#7f7";
        ctx.lineWidth = this.offset + 1;
        ctx.lineCap = "round";
        ctx.beginPath();
        for (let i = 0; i < this.entityList.length; i++) {
            for (let j = 0; j < this.entityList[i].length; j++) {
                const entity = this.entityList[i][j];
                if (!entity) {
                    continue;
                }

                this.drawIfNoNeighbor(ctx, i, j, this.entityList);
            }
        }
        ctx.stroke();
        ctx.lineCap = "square";
        ctx.translate(-rect.x, -rect.y);

        this.offsetAngle += 3.1415 / 90;
        this.offset = Math.abs(Math.sin(this.offsetAngle));
    }

    /**
     * @param {CanvasRenderingContext2D} ctx
     * @param {Number} i
     * @param {Number} j
     * @param {Array<Array<Entity>>} inputArray
     */
    drawIfNoNeighbor(ctx, i, j, inputArray) {
        const tileSize = globalConfig.tileSize;

        let xFirst = i == 0 || !inputArray[i - 1][j];
        let yFirst = j == 0 || !inputArray[i][j - 1];
        if (xFirst) {
            ctx.moveTo(i * tileSize, j * tileSize);
            ctx.lineTo(i * tileSize, (j + 1) * tileSize);
        }

        if (yFirst) {
            ctx.moveTo(i * tileSize, j * tileSize);
            ctx.lineTo((i + 1) * tileSize, j * tileSize);
        }

        let xLast = inputArray.length == i + 1 || !inputArray[i + 1][j];
        let yLast = inputArray[i].length == j + 1 || !inputArray[i][j + 1];

        if (xLast) {
            ctx.moveTo((i + 1) * tileSize, j * tileSize);
            ctx.lineTo((i + 1) * tileSize, (j + 1) * tileSize);
        }

        if (yLast) {
            ctx.moveTo(i * tileSize, (j + 1) * tileSize);
            ctx.lineTo((i + 1) * tileSize, (j + 1) * tileSize);
        }
    }

    /**
     * @param {Array<Array<Entity>>} entityList
     * @returns {Array<Entity>}
     */
    flatTheEntityList(entityList) {
        const flatList = [];
        for (let i = 0; i < entityList.length; ++i) {
            for (let j = 0; j < entityList[i].length; ++j) {
                const entity = entityList[i][j];
                if (!entity) {
                    continue;
                }

                flatList.push(entity);
            }
        }

        return flatList;
    }

    /**
     * @param {Array<Array<any>>} array
     * @returns {Array<Array<any>>}
     */
    static cloneArray(array) {
        /** @type {Array<Array<any>>} */
        const clone = new Array(array.length);
        for (let i = 0; i < array.length; ++i) {
            clone[i] = new Array(array[i].length);
        }

        return clone;
    }
}
