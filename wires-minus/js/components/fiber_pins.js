import { enumDirection, Vector } from "shapez/core/vector";
import { BaseItem } from "shapez/game/base_item";
import { Component } from "shapez/game/component";
import { enumPinSlotType } from "shapez/game/components/wired_pins";
import { typeItemSingleton } from "shapez/game/item_resolver";
import { types } from "shapez/savegame/serialization";
import { FiberNetwork } from "../core/fiberNetwork";

/** @typedef {{
 *   pos: Vector,
 *   type: enumPinSlotType,
 *   direction: enumDirection
 * }} FiberPinSlotDefinition */

/** @typedef {{
 *   pos: Vector,
 *   type: enumPinSlotType,
 *   direction: enumDirection,
 *   value: BaseItem,
 *   linkedNetwork: FiberNetwork
 * }} FiberPinSlot */

export class FiberPinsComponent extends Component {
    static getId() {
        return "FiberPins";
    }

    static getSchema() {
        return {
            slots: types.fixedSizeArray(
                types.structured({
                    value: types.nullable(typeItemSingleton),
                })
            ),
        };
    }

    /**
     *
     * @param {object} param0
     * @param {Array<FiberPinSlotDefinition>} param0.slots
     */
    constructor({ slots = [] }) {
        super();
        this.setSlots(slots);
    }

    /**
     * Sets the slots of this building
     * @param {Array<FiberPinSlotDefinition>} slots
     */
    setSlots(slots) {
        /** @type {Array<FiberPinSlot>} */
        this.slots = [];

        for (let i = 0; i < slots.length; ++i) {
            const slotData = slots[i];
            this.slots.push({
                pos: slotData.pos,
                type: slotData.type,
                direction: slotData.direction,
                value: null,
                linkedNetwork: null,
            });
        }
    }
}
