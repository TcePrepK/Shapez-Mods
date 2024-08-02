import { enumDirection, Vector } from "shapez/core/vector";
import { Component } from "shapez/game/component";
import { Entity } from "shapez/game/entity";
import { WireNetwork } from "shapez/game/systems/wire";

/** @typedef {{
 *   tilePos: Vector,
 *   offset: Vector,
 *   wires: Array<{
 *      pos: Vector,
 *      direction: enumDirection,
 *   }>
 * }} FiberPinSlotDefinition */

/** @typedef {{
 *   tilePos: Vector,
 *   offset: Vector,
 *   wires: Array<{
 *      pos: Vector,
 *      direction: enumDirection,
 *   }>
 *   linkedNetwork: import("../core/fiberNetwork").FiberNetwork
 *   wireNetwork: WireNetwork
 * }} FiberPinSlot */

export class FiberPinsComponent extends Component {
    /** @type {Array<FiberPinSlot>} */ slots = [];

    static getId() {
        return "FiberPins";
    }

    /**
     * @param {Entity} entity
     * @returns {FiberPinsComponent}
     */
    static get(entity) {
        return entity?.components[this.getId()];
    }

    /**
     * @param {Array<FiberPinSlotDefinition>} slots
     */
    constructor(slots) {
        super();
        this.setSlots(slots);
    }

    /**
     * Sets the slots of this building
     * @param {Array<FiberPinSlotDefinition>} slots
     */
    setSlots(slots) {
        for (let i = 0; i < slots.length; ++i) {
            const slotData = slots[i];
            this.slots.push({
                tilePos: slotData.tilePos,
                offset: slotData.offset,
                wires: slotData.wires,
                linkedNetwork: null,
                wireNetwork: null,
            });
        }
    }
}
