import { BaseItem } from "shapez/game/base_item";
import { Entity } from "shapez/game/entity";
import { GameSystemWithFilter } from "shapez/game/game_system_with_filter";
import { DynamicRemoteSignalComponent } from "../components/dynamic_remote_signal";

export class DynamicRemoteSignalSystem extends GameSystemWithFilter {
    constructor(root) {
        super(root, [DynamicRemoteSignalComponent]);
    }

    update() {
        /** @type {Map<BaseItem, BaseItem>} */
        const channelToInput = new Map();

        /** @type {Map<BaseItem, Array<Entity>>} */
        const channelToEntities = new Map();
        for (const entity of this.allEntities) {
            this.setOutput(entity, null);

            const channel = this.getChannel(entity);
            if (!channel) {
                continue;
            }

            if (!channelToEntities.has(channel)) {
                channelToEntities.set(channel, []);
            }

            if (!channelToEntities.get(channel)) {
                continue;
            }

            channelToEntities.get(channel).push(entity);

            const input = this.getInput(entity);
            if (!input) {
                continue;
            }

            if (!channelToInput.has(channel)) {
                channelToInput.set(channel, input);
                continue;
            }

            if (channelToInput.get(channel) === input) {
                continue;
            }

            channelToEntities.set(channel, null);
            channelToInput.set(channel, null);
        }

        for (const channel of channelToEntities.keys()) {
            const entities = channelToEntities.get(channel);
            const input = channelToInput.get(channel);

            if (!entities || !input) {
                continue;
            }

            for (const entity of entities) {
                this.setOutput(entity, input);
            }
        }
    }

    /**
     * @param {Entity} entity
     * @returns {BaseItem}
     */
    getChannel(entity) {
        const wirePins = entity.components.WiredPins;
        if (!wirePins) {
            return;
        }

        const pin = wirePins.slots[0];
        const network = pin.linkedNetwork;
        if (!network) {
            return;
        }

        return network.currentValue;
    }

    /**
     * @param {Entity} entity
     * @returns {BaseItem}
     */
    getInput(entity) {
        const wirePins = entity.components.WiredPins;
        if (!wirePins) {
            return;
        }

        const pin = wirePins.slots[1];
        const network = pin.linkedNetwork;
        if (!network) {
            return;
        }

        return network.currentValue;
    }

    /**
     * @param {Entity} entity
     * @param {BaseItem} value
     */
    setOutput(entity, value) {
        const wirePins = entity.components.WiredPins;
        if (!wirePins) {
            return;
        }

        wirePins.slots[2].value = value;
    }
}
