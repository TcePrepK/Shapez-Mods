import { BaseItem } from "shapez/game/base_item";
import { enumColorsToHexCode } from "shapez/game/colors";
import { GameSystemWithFilter } from "shapez/game/game_system_with_filter";
import { ColorItem } from "shapez/game/items/color_item";
import { GameRoot } from "shapez/game/root";
import { DisplayControllerComponent } from "../components/displayController";
import { FiberPinsComponent } from "../components/fiberPins";
import { DisplayManager } from "../core/displayManager";

export class DisplayControllerSystem extends GameSystemWithFilter {
    static getId() {
        return "displayController";
    }

    /**
     * @param {GameRoot} root
     * @returns {DisplayControllerSystem}
     */
    static get(root) {
        return root.systemMgr.systems[this.getId()];
    }

    constructor(root) {
        super(root, [DisplayControllerComponent]);
    }

    /**
     * @param {CanvasRenderingContext2D} ctx
     * @param {number} x
     * @param {number} y
     * @param {ColorItem} data
     */
    pixelDrawMethod(ctx, x, y, data) {
        const color = data ? enumColorsToHexCode[data.color] : "#000000";

        ctx.fillStyle = color;
        ctx.fillRect(x, y, 4, 4);
    }

    update() {
        for (const entity of this.allEntities) {
            const fiberPins = FiberPinsComponent.get(entity);
            const network = fiberPins.slots[0].linkedNetwork;
            if (!network) {
                continue;
            }

            const wiredPins = entity.components.WiredPins;

            /** @type {Array<BaseItem>} */
            const signals = [];
            for (const slot of wiredPins.slots) {
                const network = slot.linkedNetwork;
                if (!network?.hasValue()) {
                    signals.push(null);
                    continue;
                }

                signals.push(network.currentValue);
            }

            const xSignal = signals[0];
            const ySignal = signals[1];
            if (!xSignal || !ySignal) {
                continue;
            }

            if (xSignal.getItemType() != "number" || ySignal.getItemType() != "number") {
                continue;
            }

            // @ts-ignore
            const xCord = Math.floor(xSignal.number) * 4;
            // @ts-ignore
            const yCord = Math.floor(ySignal.number) * 4;

            const data = signals[2];
            if (data && !(data instanceof ColorItem)) {
                continue;
            }

            const manager = DisplayManager.get(this.root);
            manager.draw(xCord, yCord, data, network, this.pixelDrawMethod);
        }
    }
}
