import { globalConfig } from "shapez/core/config";
import { enumPinSlotType } from "shapez/game/components/wired_pins";
import { GameSystemWithFilter } from "shapez/game/game_system_with_filter";
import { BasicMathComponent } from "../components/basicMath";
import { ComplexMathComponent, enumComplexMathGateVariants } from "../components/complexMath";

export class ComplexMathSystem extends GameSystemWithFilter {
    constructor(root) {
        super(root, [ComplexMathComponent]);

        this.boundOperations = {
            [enumComplexMathGateVariants.default]: this.SIN.bind(this),
            [enumComplexMathGateVariants.cos]: this.COS.bind(this),
            [enumComplexMathGateVariants.tan]: this.TAN.bind(this),
            [enumComplexMathGateVariants.cot]: this.COT.bind(this),
            [enumComplexMathGateVariants.csc]: this.CSC.bind(this),
            [enumComplexMathGateVariants.sec]: this.SEC.bind(this),
            [enumComplexMathGateVariants.log]: this.LOG.bind(this),
        };
    }

    update() {
        for (let i = 0; i < this.allEntities.length; ++i) {
            const entity = this.allEntities[i];
            const slotComp = entity.components.WiredPins;

            // @ts-ignore
            /** @type {NumberItem} */
            let inputValue = null;

            // Store if any conflict was found
            let anyConflict = false;

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
                    inputValue = item;
                } else {
                    anyConflict = true;
                }
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

            /** @type {BasicMathComponent} */
            const mathComp = entity.components["ComplexMath"];
            const result = this.boundOperations[mathComp.type](inputValue.number);
            if (result == null) {
                continue;
            }

            const resultItem = globalConfig["numberManager"].getItem(result);

            assert(slotComp.slots[0].type === enumPinSlotType.logicalEjector, "Slot 0 should be ejector");
            slotComp.slots[0].value = resultItem;
        }
    }

    SIN(inputValue) {
        return Math.sin(inputValue);
    }

    COS(inputValue) {
        return Math.cos(inputValue);
    }

    TAN(inputValue) {
        return Math.tan(inputValue);
    }

    COT(inputValue) {
        return 1 / Math.tan(inputValue);
    }

    SEC(inputValue) {
        return 1 / Math.cos(inputValue);
    }

    CSC(inputValue) {
        return 1 / Math.sin(inputValue);
    }

    LOG(inputValue) {
        return Math.log(inputValue);
    }
}
