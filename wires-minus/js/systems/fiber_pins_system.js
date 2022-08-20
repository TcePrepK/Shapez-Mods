import { DrawParameters } from "shapez/core/draw_parameters";
import { enumPinSlotType } from "shapez/game/components/wired_pins";
import { GameSystemWithFilter } from "shapez/game/game_system_with_filter";
import { MapChunk } from "shapez/game/map_chunk";
import { FiberPinsComponent } from "../components/fiber_pins";

export class FiberPinsSystem extends GameSystemWithFilter {
    constructor(root) {
        super(root, [FiberPinsComponent]);

        // this.root.signals.postLoadHook.add(this.gameRestored, this);
    }

    gameRestored() {
        // TODO
    }

    update() {
        const visitedNetworks = new Set();
        for (const entity of this.allEntities) {
            /** @type {FiberPinsComponent} */
            const fiberPin = entity.components["FiberPins"];

            for (const slot of fiberPin.slots) {
                if (!slot.linkedNetwork) {
                    continue;
                }

                if (visitedNetworks.has(slot.linkedNetwork)) {
                    continue;
                }

                visitedNetworks.add(slot.linkedNetwork);

                const senders = slot.linkedNetwork.senders;
                let value = null;
                for (const sender of senders) {
                    const slotValue = sender.value;
                    if (!slotValue) {
                        continue;
                    }

                    if (!value) {
                        value = sender.value;
                        continue;
                    }

                    if (value.equals(slotValue)) {
                        continue;
                    }

                    slot.linkedNetwork.valueConflict = true;
                    value = null;
                    break;
                }

                slot.linkedNetwork.currentValue = value;
            }
        }
    }
}
