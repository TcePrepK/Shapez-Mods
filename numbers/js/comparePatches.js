import { BOOL_FALSE_SINGLETON, BOOL_TRUE_SINGLETON } from "shapez/game/items/boolean_item";
import { LogicGateSystem } from "shapez/game/systems/logic_gate";

export function patchCompare(modInterface) {
    modInterface.replaceMethod(LogicGateSystem, "compute_COMPARE", function ($original, [parameters]) {
        const a = parameters[0];
        const b = parameters[1];

        if (a && b && a.getItemType() == "number" && b.getItemType() == "number") {
            return a.number == b.number ? BOOL_TRUE_SINGLETON : BOOL_FALSE_SINGLETON;
        }

        return $original(parameters);
    });
}
