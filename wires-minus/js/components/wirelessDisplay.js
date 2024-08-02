import { makeOffscreenBuffer } from "shapez/core/buffer_utils";
import { globalConfig } from "shapez/core/config";
import { Component } from "shapez/game/component";
import { Entity } from "shapez/game/entity";
import { types } from "shapez/savegame/serialization";

export const enumDisplayType = {
    none: "none",
    side: "side",
    sides: "sides",
    corner: "corner",
    around: "around",
    full: "full",
};

export class AdvancedDisplayComponent extends Component {
    /** @type {String} */ type = null;

    /** @type {HTMLCanvasElement} */ canvas = null;
    /** @type {CanvasRenderingContext2D} */ context = null;
    /** @type {import("../core/displayNetwork").DisplayNetwork} */ linkedNetwork = null;

    /** @type {Boolean} */ isParent = false;

    static getId() {
        return "AdvancedDisplay";
    }

    static getSchema() {
        return {
            serializedCanvas: types.string,
        };
    }

    /**
     * @param {Entity} entity
     * @returns {AdvancedDisplayComponent}
     */
    static get(entity) {
        return entity?.components[this.getId()];
    }

    constructor() {
        super();

        this.type = enumDisplayType.none;
        this.createCanvas();
    }

    createCanvas() {
        const tileSize = globalConfig.tileSize;
        const [canvas, context] = makeOffscreenBuffer(tileSize, tileSize, {
            label: "display-canvas",
            smooth: false,
        });

        context.fillStyle = "#000000";
        context.fillRect(0, 0, tileSize, tileSize);

        this.canvas = canvas;
        this.context = context;
    }

    get serializedCanvas() {
        return this.canvas.toDataURL("image/png");
    }

    set serializedCanvas(string) {
        const img = new Image();
        img.onload = () => {
            this.context.drawImage(img, 0, 0);
        };
        img.src = string;
    }
}
