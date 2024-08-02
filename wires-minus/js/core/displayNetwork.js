import { Vector } from "shapez/core/vector";
import { Entity } from "shapez/game/entity";
import { FiberPinsComponent } from "../components/fiberPins";
import { AdvancedDisplayComponent } from "../components/wirelessDisplay";

export class DisplayNetwork {
    /** @type {Array<Entity>} */ displays = [];
    /** @type {Entity} */ parentDisplay = null;

    /** @type {Vector} */ topLeft = null;
    /** @type {Vector} */ bottomRight = null;

    /**
     * @param {Entity} display
     */
    addDisplay(display) {
        const displayComp = AdvancedDisplayComponent.get(display);
        displayComp.linkedNetwork = this;
        this.displays.push(display);

        if (this.displays.length == 1) {
            const staticComp = display.components.StaticMapEntity;
            const origin = staticComp.origin;

            DisplayNetwork.toggleOnParent(display);
            this.parentDisplay = display;

            this.topLeft = origin.copy();
            this.bottomRight = origin.copy();
            return;
        }

        this.checkDisplayBorders(display);
        this.checkDisplayForParent(display);
    }

    /**
     * @param {Entity} display
     */
    removeDisplay(display) {
        const idx = this.displays.indexOf(display);
        if (idx == -1) {
            return;
        }

        if (DisplayNetwork.isParent(display)) {
            DisplayNetwork.toggleOffParent(display);
            this.parentDisplay = null;
        }

        this.displays.splice(idx, 1);
    }

    /**
     * @param {Entity} display
     */
    checkDisplayBorders(display) {
        const staticComp = display.components.StaticMapEntity;
        const origin = staticComp.origin;

        this.topLeft.x = Math.min(this.topLeft.x, origin.x);
        this.topLeft.y = Math.min(this.topLeft.y, origin.y);
        this.bottomRight.x = Math.max(this.bottomRight.x, origin.x);
        this.bottomRight.y = Math.max(this.bottomRight.y, origin.y);
    }

    /**
     * @param {Entity} display
     */
    checkDisplayForParent(display) {
        const fiberPins = FiberPinsComponent.get(this.parentDisplay);
        if (fiberPins.slots[0].linkedNetwork) {
            return;
        }

        const newOrigin = display.components.StaticMapEntity.origin;
        const parentOrigin = this.parentDisplay.components.StaticMapEntity.origin;
        if (newOrigin.y > parentOrigin.y || (newOrigin.y == parentOrigin.y && newOrigin.x > parentOrigin.x)) {
            DisplayNetwork.toggleOffParent(this.parentDisplay);
            DisplayNetwork.toggleOnParent(display);
            this.parentDisplay = display;
        }
    }

    /**
     * @param {Entity} display
     */
    static toggleOnParent(display) {
        const displayComp = AdvancedDisplayComponent.get(display);
        if (displayComp.isParent) {
            return;
        }

        display.addComponent(
            new FiberPinsComponent([
                {
                    tilePos: new Vector(0, 0),
                    offset: new Vector(0, 0),
                    wires: [],
                },
            ]),
            true
        );
        displayComp.isParent = true;
    }

    /**
     * @param {Entity} display
     */
    static toggleOffParent(display) {
        const displayComp = AdvancedDisplayComponent.get(display);
        if (!displayComp?.isParent) {
            return;
        }

        display.removeComponent(FiberPinsComponent, true);
        displayComp.isParent = false;
    }

    /**
     * @param {Entity} display
     * @returns {Boolean}
     */
    static isParent(display) {
        return AdvancedDisplayComponent.get(display)?.isParent;
    }

    /**
     * @param {Entity} entity
     * @returns {Boolean}
     */
    doesEntityBelong(entity) {
        return this.displays.includes(entity);
    }

    /**
     * @returns {Boolean}
     */
    doesHaveFiberConnection() {
        return !!FiberPinsComponent.get(this.parentDisplay).slots[0].linkedNetwork;
    }
}
