import { BaseItem } from "shapez/game/base_item";
import { Entity } from "shapez/game/entity";
import { WirelessSystem } from "./wirelessSystem";

export class WirelessManager {
    constructor() {
        /** @type {Map<String, WirelessSystem>} */
        this.codeToSystem = new Map();

        /** @type {Map<BaseItem, Array<Entity>>} */
        this.itemToSystem = new Map();
    }

    clear() {
        this.codeToSystem.clear();
        this.itemToSystem.clear();
    }

    /**
     * @param {Entity} code
     * @param {Entity} entity
     */
    addEntity(code, entity) {
        if (entity.components.WiredPins) {
            this.addSender(code, entity);
        } else {
            this.addReceiver(code, entity);
        }
    }

    removeEntity(code, entity) {
        if (entity.components.WiredPins) {
            this.removeSender(code, entity);
        } else {
            this.removeReceiver(code, entity);
        }
    }

    /**
     * @param {Entity} sender
     */
    addSender(code, sender) {
        let system = this.codeToSystem.get(code);
        if (!system) {
            system = new WirelessSystem(code);
            this.codeToSystem.set(code, system);
        }

        system.addSender(sender);
    }

    /**
     * @param {Entity} receiver
     */
    addReceiver(code, receiver) {
        let system = this.codeToSystem.get(code);
        if (!system) {
            system = new WirelessSystem(code);
            this.codeToSystem.set(code, system);
        }

        system.addReceiver(receiver);
    }

    /**
     * @param {String} code
     * @param {Entity} sender
     */
    removeSender(code, sender) {
        const system = this.codeToSystem.get(code);
        if (!system) {
            return;
        }

        system.removeSender(sender);
    }

    /**
     * @param {String} code
     * @param {Entity} receiver
     */
    removeReceiver(code, receiver) {
        const system = this.codeToSystem.get(code);
        if (!system) {
            return;
        }

        system.removeReceiver(receiver);
    }

    /**
     * @param {String} code
     * @returns {Array<Entity>}
     */
    getSenders(code) {
        const system = this.codeToSystem.get(code);
        if (!system) {
            return [];
        }

        return system.getSenders();
    }

    /**
     * @param {String} code
     */
    getReceivers(code) {
        const system = this.codeToSystem.get(code);
        if (!system) {
            return [];
        }

        return system.getReceivers();
    }
}
