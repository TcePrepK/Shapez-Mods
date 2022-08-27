import { globalConfig } from "shapez/core/config";
import { enumPinSlotType } from "shapez/game/components/wired_pins";
import { GameSystemWithFilter } from "shapez/game/game_system_with_filter";
import { BOOL_FALSE_SINGLETON, BOOL_TRUE_SINGLETON } from "shapez/game/items/boolean_item";
import {
    arctrigMathVariants,
    basicMathVariants,
    bitMathVariants,
    compareMathVariants,
    complexMathVariants,
    MathGatesComponent,
    trigMathVairants,
} from "../components/mathGates";

export class MathGatesSystem extends GameSystemWithFilter {
    constructor(root) {
        super(root, [MathGatesComponent]);

        this.boundOperations = {
            [basicMathVariants.default]: n => n[0] + n[1],
            [basicMathVariants.subtraction]: n => n[0] - n[1],
            [basicMathVariants.multiplication]: n => n[0] * n[1],
            [basicMathVariants.division]: n => n[0] / n[1],
            [basicMathVariants.modulo]: n => n[0] % n[1],
            [basicMathVariants.powerof]: n => Math.pow(n[0], n[1]),

            [complexMathVariants.default]: n => Math.log10(n[0]),
            [complexMathVariants.sqrt]: n => Math.sqrt(n[0]),
            [complexMathVariants.floor]: n => Math.floor(n[0]),
            [complexMathVariants.ceil]: n => Math.ceil(n[0]),
            [complexMathVariants.round]: n => Math.round(n[0]),
            [complexMathVariants.sign]: n => Math.sign(n[0]),
            [complexMathVariants.abs]: n => Math.abs(n[0]),

            [trigMathVairants.default]: n => Math.sin(n[0]),
            [trigMathVairants.cos]: n => Math.cos(n[0]),
            [trigMathVairants.tan]: n => Math.tan(n[0]),
            [trigMathVairants.cot]: n => 1 / Math.tan(n[0]),
            [trigMathVairants.csc]: n => 1 / Math.sin(n[0]),
            [trigMathVairants.sec]: n => 1 / Math.cos(n[0]),

            [arctrigMathVariants.default]: n => Math.asin(n[0]),
            [arctrigMathVariants.arccos]: n => Math.acos(n[0]),
            [arctrigMathVariants.arctan]: n => Math.atan(n[0]),
            [arctrigMathVariants.arccot]: n => Math.PI / 2 - Math.atan(n[0]),
            [arctrigMathVariants.arccsc]: n => Math.asin(1 / n[0]),
            [arctrigMathVariants.arcsec]: n => Math.acos(1 / n[0]),

            [compareMathVariants.default]: n => n[0] > n[1],
            [compareMathVariants.lessThan]: n => n[0] < n[1],

            [bitMathVariants.default]: n => n[0] & n[1],
            [bitMathVariants.or]: n => n[0] | n[1],
            [bitMathVariants.xor]: n => n[0] ^ n[1],
            [bitMathVariants.not]: n => ~n[0],
            [bitMathVariants.lshift]: n => n[0] << n[1],
            [bitMathVariants.rshift]: n => n[0] >> n[1],
            [bitMathVariants.urshift]: n => n[0] >>> n[1],
        };
    }

    update() {
        for (let i = 0; i < this.allEntities.length; ++i) {
            const entity = this.allEntities[i];
            const slotComp = entity.components.WiredPins;

            // @ts-ignore
            /** @type {Array<NumberItem>} */
            const slotValues = new Array(slotComp.slots.length - 1);

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

            /** @type {Array<number>} */
            const inputNumbers = [];

            for (let i = 0; i < slotValues.length; ++i) {
                inputNumbers[i] = slotValues[i].number;
            }

            /** @type {MathGatesComponent} */
            const mathComp = entity.components["MathGates"];
            const result = this.boundOperations[mathComp.type](inputNumbers);
            if (result == null) {
                continue;
            }

            let resultItem;
            if (result === true || result === false) {
                resultItem = result ? BOOL_TRUE_SINGLETON : BOOL_FALSE_SINGLETON;
            } else {
                resultItem = globalConfig["numberManager"].getItem(result);
            }

            assert(
                slotValues.length === slotComp.slots.length - 1,
                "Bad slot config, should have N acceptor slots and 1 ejector"
            );
            assert(slotComp.slots[0].type === enumPinSlotType.logicalEjector, "Slot 0 should be ejector");
            slotComp.slots[0].value = resultItem;
        }
    }
}
