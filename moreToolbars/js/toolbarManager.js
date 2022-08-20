import { BaseHUDPart } from "shapez/game/hud/base_hud_part";

export class ToolbarManager {
    constructor() {
        this.idToToolbar = {};
    }

    /**
     * @param {string} id
     * @param {typeof BaseHUDPart} toolbar
     */
    registerToolbar(id, toolbar) {
        this.idToToolbar[id] = toolbar;
    }

    /**
     * Get the toolbar with the given id.
     * @param {string} toolbarID
     * @returns {typeof BaseHUDPart}
     */
    getToolbarByID(toolbarID) {
        return this.idToToolbar[toolbarID];
    }

    /**
     * Toggle the visibility of the toolbar with the given id.
     * @param {string} toolbarID
     */
    toggleToolbar(toolbarID) {
        this.idToToolbar[toolbarID].mtForceToggle();
    }

    /**
     * Force show toolbarID
     * @param {string} toolbarID
     */
    enableToolbar(toolbarID) {
        this.idToToolbar[toolbarID].mtForceEnable();
    }

    /**
     * Force hide toolbarID
     * @param {string} toolbarID
     */
    disableToolbar(toolbarID) {
        this.idToToolbar[toolbarID].mtForceDisable();
    }
}
