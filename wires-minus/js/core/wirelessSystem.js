import { Entity } from "shapez/game/entity";

export class WirelessSystem {
    constructor(code) {
        /** @type {String} */
        this.code = code;

        /** @type {Array<Entity>} */
        this.senders = [];

        /** @type {Array<Entity>} */
        this.receivers = [];
    }

    /**
     * @param {Entity} sender
     */
    addSender(sender) {
        if (this.senders.includes(sender)) {
            return;
        }

        this.senders.push(sender);
    }

    /**
     * @param {Entity} receiver
     */
    addReceiver(receiver) {
        if (this.receivers.includes(receiver)) {
            return;
        }

        this.receivers.push(receiver);
    }

    /**
     * @param {Entity} sender
     */
    removeSender(sender) {
        const index = this.senders.indexOf(sender);
        if (index !== -1) {
            this.senders.splice(index, 1);
        }
    }

    /**
     * @param {Entity} receiver
     */
    removeReceiver(receiver) {
        const index = this.receivers.indexOf(receiver);
        if (index !== -1) {
            this.receivers.splice(index, 1);
        }
    }

    /**
     * @returns {Array<Entity>}
     */
    getSenders() {
        return this.senders;
    }

    /**
     * @returns {Array<Entity>}
     */
    getReceivers() {
        return this.receivers;
    }
}
