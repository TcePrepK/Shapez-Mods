import { off } from "process";
import { globalConfig } from "shapez/core/config";
import { Vector } from "shapez/core/vector";
import { enumColorMixingResults, enumColors } from "shapez/game/colors";
import { GameSystemWithFilter } from "shapez/game/game_system_with_filter";
import { ShapeItem } from "shapez/game/items/shape_item";
import { enumSubShape, ShapeDefinition } from "shapez/game/shape_definition";
import { MouseInputComponent } from "../components/mouse_input";

export class MouseInputSystem extends GameSystemWithFilter {
    constructor(root) {
        super(root, [MouseInputComponent]);

        /** @type {String} */
        this.defaultShapeKey = "CuCuCuCu:CuCuCuCu:CuCuCuCu:CuCuCuCu";

        /** @type {ShapeItem} */
        this.defaultShape;

        this.root.signals.postLoadHook.add(this.gameRestored, this);
    }

    gameRestored() {
        this.defaultShape = this.root.shapeDefinitionMgr.getShapeItemFromShortKey(this.defaultShapeKey);

        for (const entity of this.allEntities) {
            entity.components["MouseInput"].currentValue = this.defaultShape;
        }
    }

    update() {
        for (const entity of this.allEntities) {
            entity.components["MouseInput"].currentValue = this.defaultShape;
        }

        if (!this.defaultShape) {
            return;
        }

        const mousePos = this.root.app.mousePosition;
        if (!mousePos) {
            // Mouse pos not ready
            return;
        }

        if (this.root.camera.getIsMapOverlayActive()) {
            // Not within the map overlay
            return;
        }

        const worldPos = this.root.camera.screenToWorld(mousePos);
        const hoveredTile = worldPos.toTileSpace();

        const contents = this.root.map.getTileContent(hoveredTile, "wires");
        if (!contents) {
            // Empty tile
            return;
        }

        /** @type {MouseInputComponent} */
        const mouseComp = contents.components["MouseInput"];
        if (!mouseComp) {
            return;
        }

        const offset = worldPos
            .sub(hoveredTile.toWorldSpace())
            .divideScalar(globalConfig.tileSize / 4)
            .floor();

        const layers = this.defaultShape.definition.getClonedLayers();
        const targetCorner = this.getCorner(layers, offset);

        targetCorner.subShape = enumSubShape.rect;

        const buttonList = [1, 2, 3];
        const colors = [enumColors.red, enumColors.green, enumColors.blue];
        const enabledColors = [];
        for (const button of buttonList) {
            if (this.root.app.inputMgr.keysDown.has(button)) {
                enabledColors.push(colors[button - 1]);
            }
        }

        if (enabledColors.length != 0) {
            let mixedColor = enabledColors[0];
            for (let i = 1; i < enabledColors.length; ++i) {
                mixedColor = enumColorMixingResults[mixedColor][enabledColors[i]];
            }

            targetCorner.color = mixedColor;
        }

        const definition = this.root.shapeDefinitionMgr.registerOrReturnHandle(
            new ShapeDefinition({ layers })
        );
        mouseComp.currentValue = this.root.shapeDefinitionMgr.getShapeItemFromDefinition(definition);
    }

    /**
     * @param {Array<Object.<String, enumColors>>} layers
     * @param {Vector} offset
     * @returns {Object.<String, enumColors>}
     */
    getCorner(layers, offset) {
        /** Don't look here :(
        (0, 0) -> (3, 3)
        (1, 0) -> (3, 0)
        (2, 0) -> (0, 3)
        (3, 0) -> (0, 0)

        (0, 1) -> (3, 2)
        (1, 1) -> (3, 1)
        (2, 1) -> (0, 2)
        (3, 1) -> (0, 1)

        (0, 2) -> (2, 3)
        (1, 2) -> (2, 0)
        (2, 2) -> (1, 3)
        (3, 2) -> (1, 0)

        (0, 3) -> (2, 2)
        (1, 3) -> (2, 1)
        (2, 3) -> (1, 2)
        (3, 3) -> (1, 1)
        */

        const x = offset.x;
        const y = offset.y;
        const modX = x % 2;
        const modY = y % 2;
        const cornerX = y < 2 ? (x < 2 ? 3 : 0) : x < 2 ? 2 : 1;
        const cornerY = modX == 0 ? 3 - modY : modY;

        return layers[cornerX][cornerY];
    }
}
