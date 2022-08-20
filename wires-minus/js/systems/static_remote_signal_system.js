import { GameSystemWithFilter } from "shapez/game/game_system_with_filter";
import { FiberPinsComponent } from "../components/fiber_pins";
import { StaticRemoteSignalComponent } from "../components/static_remote_signal";

export class StaticRemoteSignalSystem extends GameSystemWithFilter {
    constructor(root) {
        super(root, [StaticRemoteSignalComponent]);
    }

    update() {
        for (const entity of this.allEntities) {
            /** @type {FiberPinsComponent} */
            const fiberPins = entity.components["FiberPins"];
            const wiredPins = entity.components.WiredPins;

            const fiberInput = fiberPins.slots[0];
            const fiberOutput = fiberPins.slots[1];

            const wireInput = wiredPins.slots[0];
            const wireOutput = wiredPins.slots[1];

            fiberInput.value = null;
            wireOutput.value = null;

            const fiberNetwork = fiberOutput.linkedNetwork;
            if (fiberNetwork) {
                const fiberValue = fiberNetwork.valueConflict ? null : fiberNetwork.currentValue;
                wireOutput.value = fiberValue;
            }

            const wireNetwork = wireInput.linkedNetwork;
            if (wireNetwork) {
                const wireValue = wireNetwork.valueConflict ? null : wireNetwork.currentValue;
                fiberInput.value = wireValue;
            }
        }
    }
}
