import { BaseItem } from "shapez/game/base_item";
import { Entity } from "shapez/game/entity";

export class DynamicNetwork {
    /** @type {Array<Entity>} */ entities = null;
    /** @type {BaseItem} */ channel = null;

    /**
     * @param {Array<Entity>} entities
     * @param {BaseItem} channel
     */
    constructor(entities, channel) {
        this.entities = entities;
        this.channel = channel;
    }
}
