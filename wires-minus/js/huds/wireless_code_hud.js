import { globalConfig } from "shapez/core/config";
import { DrawParameters } from "shapez/core/draw_parameters";
import { STOP_PROPAGATION } from "shapez/core/signal";
import { Vector } from "shapez/core/vector";
import { enumMouseButton } from "shapez/game/camera";
import { BaseHUDPart } from "shapez/game/hud/base_hud_part";
import { MapChunkView } from "shapez/game/map_chunk_view";
import { THEME } from "shapez/game/theme";

export class HUDWirelessCode extends BaseHUDPart {
    initialize() {
        this.root.camera.downPreHandler.add(this.downPreHandler, this);
    }

    /**
     * @returns {string}
     */
    computeChannelBelowTile() {
        const mousePosition = this.root.app.mousePosition;
        if (!mousePosition) {
            // Not on screen
            return null;
        }

        const worldPos = this.root.camera.screenToWorld(mousePosition);
        const tile = worldPos.toTileSpace();
        const contents = this.root.map.getTileContent(tile, this.root.currentLayer);
        if (!contents) {
            return;
        }

        const wirelessCodeComp = contents.components["WirelessCode"];
        if (!wirelessCodeComp) {
            return;
        }

        return wirelessCodeComp.wirelessCode;
    }

    /**
     * @param {Vector} pos
     * @param {enumMouseButton} button
     */
    downPreHandler(pos, button) {
        if (button !== enumMouseButton.left) {
            return;
        }

        const tile = this.root.camera.screenToWorld(pos).toTileSpace();
        const content = this.root.map.getLayerContentXY(tile.x, tile.y, this.root.currentLayer);
        if (!content) {
            return;
        }

        const wirelessCodeComp = content.components["WirelessCode"];
        if (!wirelessCodeComp) {
            return;
        }

        const oldCode = wirelessCodeComp.wirelessCode;
        globalConfig["wirelessManager"].removeEntity(oldCode, content);
        this.root.systemMgr.systems["wirelessCode"].channelSignalValue(content, oldCode);
        return STOP_PROPAGATION;
    }

    /**
     * @param {DrawParameters} parameters
     */
    draw(parameters) {
        const below = this.computeChannelBelowTile();
        if (!below) {
            return;
        }

        const mousePosition = this.root.app.mousePosition;
        const worldPos = this.root.camera.screenToWorld(mousePosition);
        const tile = worldPos.toTileSpace().toWorldSpace();

        this.drawStroked(parameters.context, below.toString(), worldPos.x + 5, worldPos.y + 5);
        parameters.context.strokeStyle = THEME.map.colorBlindPickerTile;
        parameters.context.beginPath();
        parameters.context.rect(tile.x, tile.y, globalConfig.tileSize, globalConfig.tileSize);
        parameters.context.stroke();
    }

    /**
     * Draws Text Storked
     * @param {string} text
     * @param {number} y
     * @param {number} x
     */
    drawStroked(ctx, text, x, y) {
        ctx.font = "15px Sans-serif";
        ctx.strokeStyle = "black";
        ctx.lineWidth = 1;
        ctx.miterLimit = 2;
        ctx.strokeText(text, x, y);
        ctx.fillStyle = "white";
        ctx.fillText(text, x, y);
    }
}
