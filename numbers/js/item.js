import { globalConfig } from "shapez/core/config";
import { smoothenDpi } from "shapez/core/dpi_manager";
import { DrawParameters } from "shapez/core/draw_parameters";
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
     * @param {HTMLCanvasElement} canvas
     * @param {CanvasRenderingContext2D} context
     * @param {number} w
     * @param {number} h
     * @param {number} dpi
     */
    draw(canvas, context, w, h, dpi) {
        context.font = "Bold " + h * 0.4 * dpi + "px Verdana";
        context.textAlign = "center";
        context.textBaseline = "middle";

        // 473737
        // 74CFC6

        let value = String(Math.round(this.number * 10000) / 10000);
        if (this.number == pi) {
            value = "π";
        } else if (this.number == e) {
            value = "e";
        }

        context.strokeStyle = "#4c0057";
        context.lineWidth = 1.5 * dpi;
        context.strokeText(value, (w * dpi) / 2, (h * dpi) / 2);
        context.fillStyle = "#E95944";
        context.fillText(value, (w * dpi) / 2, (h * dpi) / 2);
    }

    /**
     * Draws the item to a canvas
     * @param {CanvasRenderingContext2D} context
     * @param {number} size
     */
    drawFullSizeOnCanvas(context, size) {
        this.draw(null, context, size, size, 1);
    }

    /**
     * @param {number} x
     * @param {number} y
     * @param {DrawParameters} parameters
     * @param {number=} diameter
     */
    drawItemCenteredImpl(x, y, parameters, diameter = 20) {
        const dpi = smoothenDpi(globalConfig["shapesSharpness"] * parameters.zoomLevel);
        if (!this.bufferGenerator) {
            this.bufferGenerator = this.draw.bind(this);
        }

        const width = diameter * 0.4 * dpi * String(this.number).length;
        const key = diameter + "/" + dpi + "/" + this.number;
        const canvas = parameters.root.buffers.getForKey({
            key: "numbers",
            subKey: key,
            w: width,
            h: diameter,
            dpi,
            redrawMethod: this.bufferGenerator,
        });
        parameters.context.drawImage(canvas, x - width / 2, y - diameter / 2 + 0.5, width, diameter);
    }
}
