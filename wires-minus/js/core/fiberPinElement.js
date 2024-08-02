import { enumDirection, enumInvertedDirections, Vector } from "shapez/core/vector";
import { enumWireType, enumWireVariant } from "shapez/game/components/wire";
import { Entity } from "shapez/game/entity";
import { GameRoot } from "shapez/game/root";
import { WireNetwork } from "shapez/game/systems/wire";
import { FiberPinsComponent } from "../components/fiberPins";
import { FiberEditor } from "./fiberEditor";

/** @typedef {{
 *  variantMask: String
 *  fiberSlot: import("./fiberEditor").FiberPinSlot
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

// @ts-ignore
shapez.NetworkElement ??= class {
    constructor() {}
};
export class FiberPinElement extends shapez.NetworkElement {
    constructor() {
        super(FiberPinsComponent);
    }

    /**
     * @param {FiberPinsComponent} comp
     */
    clearNetworks(comp) {
        for (const slot of comp.slots) {
            slot.wireNetwork = null;
        }
    }

    /**
     * @param {WireNetwork} network
     * @param {Entity} entity
     * @param {NetworkMetadata} metadata
     * @returns {Array<LinkResults>}
     */
    tryToLinkNetwork(network, entity, metadata) {
        const staticComp = entity.components.StaticMapEntity;

        const slot = metadata.fiberSlot;
        if (!slot || slot.wireNetwork) {
            return;
        }

        slot.wireNetwork = network;
        network.tunnels.push(entity);

        metadata.variantMask = null;

        return slot.wires.map(wire => ({
            tile: staticComp.localTileToWorld(wire.pos),
            directions: [staticComp.localDirectionToWorld(wire.direction)],
        }));
    }

    /**
     * @param {GameRoot} root
     * @param {Entity} entity
     * @param {NetworkMetadata} metadata
     * @returns {Array<NetworkTarget>|NetworkTarget}
     */
    getWireTarget(root, entity, metadata, { direction, tile }) {
        const fiberComp = FiberPinsComponent.get(entity);
        const staticComp = entity.components.StaticMapEntity;

        const connPos = staticComp.worldToLocalTile(tile);
        const connDir = enumInvertedDirections[staticComp.worldDirectionToLocal(direction)];

        // Get the connected slot of the current entity
        const connection = fiberComp.slots.find(slot =>
            slot.wires.some(wire => wire.pos.equals(connPos) && wire.direction === connDir)
        );

        if (!connection || connection.wireNetwork) {
            return;
        }

        if (!connection.linkedNetwork) {
            metadata.fiberSlot = connection;
            return {
                entity,
                metadata,
            };
        }

        return connection.linkedNetwork.nodes.map(node => {
            const nodeData = FiberEditor.getNodeDataFromPoint(root, node);
            const targetMeta = Object.assign({}, metadata);
            targetMeta.fiberSlot = nodeData.slot;

            return {
                entity: nodeData.entity,
                metadata: targetMeta,
            };
        });
    }

    /**
     * @param {Object} param0
     * @param {enumWireType} param0.wireVariant
     * @param {Vector} param0.tile
     * @param {enumDirection} param0.edge
     * @param {Entity} entity
     * @returns {boolean}
     */
    computeWireEdgeStatus({ wireVariant, tile, edge }, entity) {
        if (!enumWireVariant[wireVariant]) {
            return false;
        }

        const fiberComp = FiberPinsComponent.get(entity);
        const staticComp = entity.components.StaticMapEntity;

        for (const slot of fiberComp.slots) {
            for (const wireSlot of slot.wires) {
                const wireLocation = staticComp.localTileToWorld(wireSlot.pos);
                const wireDirection = staticComp.localDirectionToWorld(wireSlot.direction);

                if (!wireLocation.equals(tile)) {
                    continue;
                }
                if (wireDirection !== edge) {
                    continue;
                }

                return true;
            }
        }

        return false;
    }

    /**
     * @param {Entity} entity
     * @param {Vector} tile
     * @param {Set<WireNetwork>} networks
     * @returns {boolean}
     */
    getEntityWireNetworks(entity, tile, networks) {
        let canConnectAtAll = false;

        const fiberPins = FiberPinsComponent.get(entity);
        const staticComp = entity.components.StaticMapEntity;

        for (const slot of fiberPins.slots) {
            const slotLocalPos = staticComp.localTileToWorld(slot.tilePos);
            if (slotLocalPos.equals(tile)) {
                canConnectAtAll = true;
                if (slot.wireNetwork) {
                    networks.add(slot.wireNetwork);
                }
            }
        }

        return canConnectAtAll;
    }
}
