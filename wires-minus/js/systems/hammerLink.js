import { DrawParameters } from "shapez/core/draw_parameters";
import { Loader } from "shapez/core/loader";
import { BaseItem } from "shapez/game/base_item";
import { Entity } from "shapez/game/entity";
import { GameSystemWithFilter } from "shapez/game/game_system_with_filter";
import { MapChunk } from "shapez/game/map_chunk";
import { GameRoot } from "shapez/game/root";
import { HammerLinkComponent } from "../components/hammerLink";
import { DynamicNetwork } from "../core/dynamicNetwork";

export class HammerLinkSystem extends GameSystemWithFilter {
    static getId() {
        return "hammerLinkSignal";
    }

    /**
     * @param {GameRoot} root
     * @returns {HammerLinkSystem}
     */
    static get(root) {
        return root.systemMgr.systems[this.getId()];
    }

    constructor(root) {
        super(root, [HammerLinkComponent]);

        this.spriteEmpty = Loader.getSprite("sprites/wires/network_empty.png");
        this.spriteConflict = Loader.getSprite("sprites/wires/network_conflict.png");
    }

    update() {
        let needsRecompute = false;

        /** @type {Map<BaseItem, Array<Entity>>} */
        const channelToEntities = new Map();
        for (const entity of this.allEntities) {
            const comp = HammerLinkComponent.get(entity);
            const previousNetwork = comp.linkedNetwork;
            const previousChannel = previousNetwork?.channel;
            comp.linkedNetwork = null;

            const channel = this.getChannel(entity);
            if (channel != previousChannel) {
                needsRecompute = true;
            }

            if (!channel) {
                continue;
            }

            const entities = channelToEntities.get(channel) || [];
            if (entities.length == 0) {
                channelToEntities.set(channel, entities);
            }
            entities.push(entity);
        }

        for (const channel of channelToEntities.keys()) {
            const entities = channelToEntities.get(channel);

            const newNetwork = new DynamicNetwork(entities, channel);
            entities.forEach(e => (HammerLinkComponent.get(e).linkedNetwork = newNetwork));
        }

        if (needsRecompute) {
            this.root.systemMgr.systems.wire.needsRecompute = true;
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

        const network = wirePins.slots[0].linkedNetwork;
        if (!network) {
            return;
        }

        return network.currentValue;
    }

    /**
     * @param {DrawParameters} parameters
     * @param {MapChunk} chunk
     */
    drawChunk(parameters, chunk) {
        const contents = chunk.containedEntities;
        for (const entity of contents) {
            const dynamicComp = HammerLinkComponent.get(entity);
            if (!dynamicComp) {
                continue;
            }

            const staticComp = entity.components.StaticMapEntity;
            const worldPos = staticComp.origin.toWorldSpaceCenterOfTile();

            const linkedNetwork = dynamicComp.linkedNetwork;
            const wireNetwork = dynamicComp.wireNetwork;
            const value = wireNetwork?.currentValue;

            if (wireNetwork?.valueConflict) {
                this.spriteConflict.draw(parameters.context, worldPos.x - 5, worldPos.y - 5, 10, 10);
                continue;
            }

            if (!linkedNetwork || !wireNetwork || !value) {
                this.spriteEmpty.draw(parameters.context, worldPos.x - 5, worldPos.y - 5, 10, 10);
                continue;
            }

            const type = value.getItemType();
            value.drawItemCenteredClipped(
                worldPos.x,
                worldPos.y,
                parameters,
                type == "color" || type == "number" ? 14 : 9
            );
        }
    }
}
