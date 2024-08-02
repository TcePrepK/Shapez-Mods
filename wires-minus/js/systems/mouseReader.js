import { globalConfig } from "shapez/core/config";
import { Entity } from "shapez/game/entity";
import { GameSystemWithFilter } from "shapez/game/game_system_with_filter";
import { GameRoot } from "shapez/game/root";
import { FiberPinsComponent } from "../components/fiberPins";
import { MouseReaderComponent } from "../components/mouseReader";
import { AdvancedDisplayComponent } from "../components/wirelessDisplay";

export class MouseReaderSystem extends GameSystemWithFilter {
    static getId() {
        return "mouseReader";
    }

    /**
     * @param {GameRoot} root
     * @returns {MouseReaderSystem}
     */
    static get(root) {
        return root.systemMgr.systems[this.getId()];
    }

    constructor(root) {
        super(root, [MouseReaderComponent]);
    }

    update() {
        this.allEntities.forEach(this.resetReader);

        const mousePos = this.root.camera.screenToWorld(this.root.app.mousePosition);
        const mouseTile = mousePos.toTileSpace();
        const mouseOver = this.root.map.getLayerContentXY(mouseTile.x, mouseTile.y, "regular");
        if (!mouseOver) {
            return;
        }

        const displayComp = AdvancedDisplayComponent.get(mouseOver);
        if (!displayComp) {
            return;
        }

        const targetNetwork = displayComp?.linkedNetwork;
        for (const entity of this.allEntities) {
            const fiberPins = FiberPinsComponent.get(entity);
            const network = fiberPins.slots[0].linkedNetwork;
            if (!network) {
                continue;
            }

            const displayNetworks = network.displayNetworks;
            if (!displayNetworks.includes(targetNetwork)) {
                continue;
            }

            const topLeft = targetNetwork.topLeft.toWorldSpace();
            const delta = mousePos.sub(topLeft).divideScalar(4).floor();

            const wiredPins = entity.components.WiredPins;
            wiredPins.slots[0].value = globalConfig["numberManager"].getItem(delta.x);
            wiredPins.slots[1].value = globalConfig["numberManager"].getItem(delta.y);
        }
    }

    /**
     * @param {Entity} entity
     */
    resetReader(entity) {
        const wiredPins = entity.components.WiredPins;
        wiredPins.slots[0].value = null;
        wiredPins.slots[1].value = null;
    }
}
