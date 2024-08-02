import { globalConfig } from "shapez/core/config";
import { arrayAllDirections, enumDirectionToVector } from "shapez/core/vector";
import { GameRoot } from "shapez/game/root";
import { FiberPinsComponent } from "../components/fiberPins";
import { AdvancedDisplayComponent } from "../components/wirelessDisplay";
import { DisplayNetwork } from "./displayNetwork";
import { FiberEditor } from "./fiberEditor";
import { FiberNetwork } from "./fiberNetwork";

export class DisplayManager {
    /** @type {GameRoot} */ root;

    /** @type {Array<DisplayNetwork>} */ allNetworks = [];

    static getId() {
        return "DisplayManager";
    }

    /**
     * @param {GameRoot} root
     * @returns {DisplayManager}
     */
    static get(root) {
        return root[this.getId()];
    }

    /**
     * @param {GameRoot} root
     */
    constructor(root) {
        this.root = root;

        this.root[DisplayManager.getId()] = this;
    }

    /**
     * @returns {DisplayNetwork}
     */
    createNewNetwork() {
        const network = new DisplayNetwork();
        this.allNetworks.push(network);

        return network;
    }

    /**
     * @param {DisplayNetwork} network
     */
    destroyNetwork(network) {
        this.allNetworks.splice(this.allNetworks.indexOf(network), 1);
    }

    /**
     * @param {Array<DisplayNetwork>} networks
     * @returns {DisplayNetwork}
     */
    connectNetworks(networks) {
        networks.forEach(this.destroyNetwork, this);
        const newNetwork = this.createNewNetwork();

        const parents = networks.map(n => n.parentDisplay);
        const connectedParents = parents.filter(p => FiberPinsComponent.get(p).slots[0].linkedNetwork);

        let bestParent = null;
        if (connectedParents.length != 0) {
            bestParent = connectedParents.reduce((prev, curr) => {
                const prevOrigin = prev.components.StaticMapEntity.origin;
                const currOrigin = curr.components.StaticMapEntity.origin;
                if (
                    currOrigin.y > prevOrigin.y ||
                    (currOrigin.y == prevOrigin.y && currOrigin.x > prevOrigin.x)
                ) {
                    return curr;
                }

                return prev;
            });
        }

        for (const parent of parents) {
            if (parent == bestParent) {
                continue;
            }

            FiberEditor.get(this.root).entityDestroyed(parent);
            DisplayNetwork.toggleOffParent(parent);
        }

        newNetwork.parentDisplay = bestParent;

        const allEntities = networks.map(n => n.displays).flat();
        allEntities.forEach(e => newNetwork.addDisplay(e), this);

        return newNetwork;
    }

    addDisplayToNetwork(display) {
        const staticComp = display.components.StaticMapEntity;
        const origin = staticComp.origin;

        const neighbors = arrayAllDirections.map(dir => {
            const tile = origin.add(enumDirectionToVector[dir]);
            return this.root.map.getLayerContentXY(tile.x, tile.y, "regular");
        });

        const neighborNetworks = [];
        for (const neighbor of neighbors) {
            const displayComp = AdvancedDisplayComponent.get(neighbor);
            if (!displayComp) {
                continue;
            }

            const network = displayComp.linkedNetwork;
            if (!network) {
                continue;
            }

            if (neighborNetworks.includes(network)) {
                continue;
            }

            neighborNetworks.push(network);
        }

        if (neighborNetworks.length == 0) {
            const newNetwork = this.createNewNetwork();
            newNetwork.addDisplay(display);
        } else if (neighborNetworks.length == 1) {
            neighborNetworks[0].addDisplay(display);
        } else {
            const newNetwork = this.connectNetworks(neighborNetworks);
            newNetwork.addDisplay(display);
        }
    }

    /**
     * X and Y is based on main network canvas.
     * @param {number} x
     * @param {number} y
     * @param {object?} data
     * @param {FiberNetwork} network
     * @param {function(CanvasRenderingContext2D, number, number, object?) : void} drawMethod
     */
    draw(x, y, data, network, drawMethod) {
        for (const displayNetwork of network.displayNetworks) {
            const topLeft = displayNetwork.topLeft.toWorldSpace();
            const position = topLeft.addScalars(x, y);
            if (x < 0 || y < 0) {
                continue;
            }

            const targetTile = position.toTileSpace();
            const display = this.root.map.getLayerContentXY(targetTile.x, targetTile.y, "regular");
            const displayComp = AdvancedDisplayComponent.get(display);
            if (!displayComp) {
                continue;
            }

            const tileSize = globalConfig.tileSize;
            const context = displayComp.context;
            drawMethod(context, x % tileSize, y % tileSize, data);
        }
    }
}
