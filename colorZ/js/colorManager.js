import { globalConfig } from "shapez/core/config";
import { ColorItem, COLOR_ITEM_SINGLETONS } from "shapez/game/items/color_item";

export class ColorManager {
    constructor() {
        globalConfig["colorManager"] = this;

        /** @type {Object<String, ColorItem>} */
        this.colorList = {};

        /** @type {Boolean} */
        this.registerToSingleton = true;
    }

    /**
     * @param {String} color
     * @returns {ColorItem}
     */
    getItem(color) {
        if (this.hasRegisteredColor(color)) {
            return this.colorList[color];
        }

        this.registerColor(color);

        return this.colorList[color];
    }

    /**
     * @param {String} color
     */
    registerColor(color) {
        if (!ColorManager.isValidHex(color)) {
            return;
        }

        if (this.hasRegisteredColor(color)) {
            return;
        }

        const colorItem = new ColorItem(color);
        this.colorList[color] = colorItem;

        if (this.registerToSingleton) {
            COLOR_ITEM_SINGLETONS[color] = colorItem;
        }
    }

    /**
     * @param {String} color
     * @returns {Boolean}
     */
    hasRegisteredColor(color) {
        return !!this.colorList[color];
    }

    /**
     * @param {String} name
     * @returns {Boolean}
     */
    static isValidHex(name) {
        if (!name.startsWith("#") || name.length !== 7) {
            return false;
        }

        for (let i = 1; i < name.length; i++) {
            const char = name[i];

            if ((char < "0" || char > "9") && (char < "a" || char > "f")) {
                return false;
            }
        }

        return true;
    }
}
