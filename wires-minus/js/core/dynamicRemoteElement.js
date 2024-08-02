import { enumDirection, Vector } from "shapez/core/vector";
import { enumWireType } from "shapez/game/components/wire";
import { Entity } from "shapez/game/entity";
import { GameRoot } from "shapez/game/root";
import { WireNetwork } from "shapez/game/systems/wire";
import { HammerLinkComponent } from "../components/hammerLink";

/** @typedef {{
 *  variantMask: String
 *  direction: enumDirection
 * }} NetworkMetadata */

/** @typedef {{
 *   tile: Vector
 *   directions: Array<enumDirection>
 * }} LinkResults */

/** @typedef {{
 * }} NetworkContents */

/** @typedef {{
 *   entity: Entity
 *   metadata: NetworkMetadata
 * }} NetworkTarget */

shapez.NetworkElement ??= class {
    constructor() {}
};
export class DynamicRemoteElement extends shapez.NetworkElement {
    constructor() {
        super(HammerLinkComponent);
    }

    /**
     * @param {HammerLinkComponent} comp
     */
    clearNetworks(comp) {
        comp.wireNetwork = null;
    }

    /**
     * @param {WireNetwork} network
     * @param {Entity} entity
     * @param {NetworkMetadata} metadata
     * @returns {LinkResults}
     */
    tryToLinkNetwork(network, entity, metadata) {
        if (!metadata.direction) {
            return null;
        }
        delete metadata.direction;

        const dynamicComp = HammerLinkComponent.get(entity);
        const staticComp = entity.components.StaticMapEntity;

        if (dynamicComp.wireNetwork) {
            return null;
        }

        network.tunnels.push(entity);
        dynamicComp.wireNetwork = network;

        return {
            tile: staticComp.origin,
            directions: [
                staticComp.worldDirectionToLocal(enumDirection.top),
                staticComp.worldDirectionToLocal(enumDirection.bottom),
            ],
        };
    }

    /**
     * @param {GameRoot} root
     * @param {Entity} entity
     * @param {NetworkMetadata} metadata
     * @returns {Array<NetworkTarget>|NetworkTarget}
     */
    getWireTarget(root, entity, metadata, { direction }) {
        const dynamicComp = HammerLinkComponent.get(entity);
        const staticComp = entity.components.StaticMapEntity;

        if (dynamicComp.wireNetwork) {
            return null;
        }

        const dir = staticComp.worldDirectionToLocal(direction);
        if (dir !== enumDirection.top && dir !== enumDirection.bottom) {
            return null;
        }

        delete metadata.variantMask;
        metadata.direction = dir;
        const ret = [{ entity, metadata }];

        const linkedNetwork = dynamicComp.linkedNetwork;
        if (linkedNetwork) {
            ret.shift();

            metadata.direction = "wireless";
            for (const sibling of linkedNetwork.entities) {
                ret.push({ entity: sibling, metadata });
            }
        }

        return ret;
    }

    /**
     * @param {Object} param0
     * @param {enumWireType} param0.wireVariant
     * @param {Vector} param0.tile
     * @param {enumDirection} param0.edge
     * @param {Entity} entity
     * @returns {boolean}
     */
    computeWireEdgeStatus({ edge }, entity) {
        const staticComp = entity.components.StaticMapEntity;
        const dir = staticComp.worldDirectionToLocal(edge);
        return dir === enumDirection.top || dir === enumDirection.bottom;
    }

    /**
     * @param {Entity} entity
     * @param {Vector} tile
     * @param {Set<WireNetwork>} networks
     * @returns {boolean}
     */
    getEntityWireNetworks(entity, tile, networks) {
        const dynamicComp = HammerLinkComponent.get(entity);
        if (dynamicComp.wireNetwork) {
            networks.add(dynamicComp.wireNetwork);
        }

        return true;
    }
}
