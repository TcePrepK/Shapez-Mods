import { epsilonCompare } from "shapez/core/utils";
import { Vector } from "shapez/core/vector";
import { ModInterface } from "shapez/mods/mod_interface";
import { fastCos, fastSin } from "../tools/math";

const rad15 = (15 * Math.PI) / 180;

/**
 * @param {ModInterface} modInterface
 */
export function overrideVector(modInterface) {
    modInterface.extendClass(Vector, ({ $super, $old }) => ({
        rotatedByDegree(angle) {
            let sin;
            let cos;

            if (angle % 15 == 0) {
                sin = fastSin(angle);
                cos = fastCos(angle);
            } else {
                // @ts-ignore
                const rad = Math.radians(angle);
                sin = Math.sin(rad);
                cos = Math.cos(rad);
            }

            return new Vector(this.x * cos - this.y * sin, this.x * sin + this.y * cos);
        },
    }));
}
