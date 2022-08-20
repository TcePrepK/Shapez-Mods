import { globalConfig } from "shapez/core/config";
import { enumPinSlotType } from "shapez/game/components/wired_pins";
import { GameSystemWithFilter } from "shapez/game/game_system_with_filter";
import { BasicMathComponent, enumBasicMathGateVariants } from "../components/basicMath";

export class BasicMathSystem extends GameSystemWithFilter {
    constructor(root) {
        super(root, [BasicMathComponent]);

        this.boundOperations = {
            [enumBasicMathGateVariants.default]: this.ADD.bind(this),
            [enumBasicMathGateVariants.multiplication]: this.MULT.bind(this),
            [enumBasicMathGateVariants.subtraction]: this.SUB.bind(this),
            [enumBasicMathGateVariants.division]: this.DIV.bind(this),
            [enumBasicMathGateVariants.modulo]: this.MOD.bind(this),
            [enumBasicMathGateVariants.powerof]: this.POWER.bind(this),
            [enumBasicMathGateVariants.greater]: this.GREAT.bind(this),
            [enumBasicMathGateVariants.less]: this.LESS.bind(this),
        };
    }

    update() {
        for (let i = 0; i < this.allEntities.length; ++i) {
            const entity = this.allEntities[i];
            const slotComp = entity.components.WiredPins;

            // @ts-ignore
            /** @type {[NumberItem, NumberItem]} */
            const slotValues = [null, null];

            // Store if any conflict was found
            let anyConflict = false;

            let lastPinSlot = 0;

            // Gather inputs from all connected networks
            for (let i = 0; i < slotComp.slots.length; ++i) {
                const slot = slotComp.slots[i];
                if (slot.type !== enumPinSlotType.logicalAcceptor) {
                    continue;
                }

                const network = slot.linkedNetwork;
                if (network) {
                    if (network.valueConflict) {
                        anyConflict = true;
                        break;
                    }

                    const item = network.currentValue;
                    if (!item || item.getItemType() != "number") {
                        anyConflict = true;
                        break;
                    }

                    // @ts-ignore
                    slotValues[lastPinSlot] = item;
                } else {
                    anyConflict = true;
                }

                lastPinSlot++;
            }

            // Handle conflicts
            if (anyConflict) {
                for (let i = 0; i < slotComp.slots.length; ++i) {
                    const slot = slotComp.slots[i];
                    if (slot.type !== enumPinSlotType.logicalEjector) {
                        continue;
                    }
                    slot.value = null;
                }
                continue;
            }

            /** @type {[number, number]} */
            const inputNumbers = [slotValues[0].number, slotValues[1].number];

            /** @type {BasicMathComponent} */
            const mathComp = entity.components["BasicMath"];
            const result = this.boundOperations[mathComp.type](inputNumbers);
            if (result == null) {
                continue;
            }

            const resultItem = globalConfig["numberManager"].getItem(result);

            assert(
                slotValues.length === slotComp.slots.length - 1,
                "Bad slot config, should have N acceptor slots and 1 ejector"
            );
            assert(slotComp.slots[0].type === enumPinSlotType.logicalEjector, "Slot 0 should be ejector");
            slotComp.slots[0].value = resultItem;
        }
    }

    ADD(parameters) {
        return parameters[0] + parameters[1];
    }

    MULT(parameters) {
        return parameters[0] * parameters[1];
    }

    SUB(parameters) {
        return parameters[0] - parameters[1];
    }

    DIV(parameters) {
        return parameters[0] / parameters[1];
    }

    MOD(parameters) {
        return parameters[0] % parameters[1];
    }

    POWER(parameters) {
        return Math.pow(parameters[0], parameters[1]);
    }

    GREAT(parameters) {
        return parameters[0] > parameters[1] ? 1 : 0;
    }

    LESS(parameters) {
        return parameters[0] < parameters[1] ? 1 : 0;
    }
}
