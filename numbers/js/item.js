import { globalConfig } from "shapez/core/config";
import { BaseItem } from "shapez/game/base_item";
import { types } from "shapez/savegame/serialization";
import { e, pi } from "./constantPatches";

export class NumberItem extends BaseItem {
    static getId() {
        return "number";
    }

    static getSchema() {
        return types.float;
    }

    serialize() {
        return this.number;
    }

    deserialize(data) {
        this.number = data;
    }

    /** @returns {"number"} **/
    getItemType() {
        return "number";
    }

    /**
     * @returns {string}
     */
    getAsCopyableKey() {
        return String(this.number);
    }

    /**
     * @param {BaseItem} other
     */
    equalsImpl(other) {
        return this.number === /** @type {NumberItem} */ (other).number;
    }

    /**
     * @param {number} number
     */
    constructor(number) {
        super();

        /** @type {number} */
        this.number = number;
    }

    getBackgroundColorAsResource() {
        return "#000000";
    }

    /**
     * @param {CanvasRenderingContext2D} context
     * @param {number} x
     * @param {number} y
     */
    draw(context, x, y, scale) {
        context.font = "Bold " + 8 * scale + "px Verdana";
        context.textAlign = "center";
        context.textBaseline = "middle";

        let value = String(Math.round(this.number * 10000) / 10000);
        if (this.number == pi) {
            value = "π";
        } else if (this.number == e) {
            value = "e";
        }

        context.strokeStyle = "#4c0057";
        context.lineWidth = 1.5 * scale;
        context.strokeText(value, x, y + 0.5);
        context.fillStyle = "#E95944";
        context.fillText(value, x, y + 0.5);
    }

    /**
     * Draws the item to a canvas
     * @param {CanvasRenderingContext2D} context
     * @param {number} size
     */
    drawFullSizeOnCanvas(context, size) {
        this.draw(context, 0, 0);
    }

    drawItemCenteredClipped(x, y, parameters, diameter = 20) {
        if (diameter == 20) {
            parameters.context.globalAlpha = 0.4;
        }

        if (globalConfig["opaqueNumbers"].pressed) {
            parameters.context.globalAlpha = 1;
        }

        this.draw(parameters.context, x, y, diameter / 20);
        parameters.context.globalAlpha = 1;
    }

    drawItemCenteredImpl(x, y, parameters, diameter) {
        this.drawItemCenteredClipped(x, y, parameters, diameter);
    }
}
