import { globalConfig } from "shapez/core/config";
import { DrawParameters } from "shapez/core/draw_parameters";
import { Loader } from "shapez/core/loader";
import { RandomNumberGenerator } from "shapez/core/rng";
import { STOP_PROPAGATION } from "shapez/core/signal";
import { AtlasSprite } from "shapez/core/sprites";
import { Vector } from "shapez/core/vector";
import { enumMouseButton } from "shapez/game/camera";
import { StaticMapEntityComponent } from "shapez/game/components/static_map_entity";
import { Entity } from "shapez/game/entity";
import { HUDWireInfo } from "shapez/game/hud/parts/wire_info";
import { KEYMAPPINGS } from "shapez/game/key_action_mapper";
import { GameRoot } from "shapez/game/root";
import { WireNetwork } from "shapez/game/systems/wire";
import { FiberPinsComponent } from "../components/fiberPins";
import { AdvancedDisplayComponent } from "../components/wirelessDisplay";
import { FiberNetwork } from "./fiberNetwork";

/**
 * @typedef {import("../components/fiberPins").FiberPinSlot} FiberPinSlot;
 */

export class FiberEditor {
    /** @type {GameRoot} */ root = null;
    /** @type {RandomNumberGenerator} */ rng = null;
    // /** @type {number} */ maxFiberLength = 250;

    /** @type {Boolean} */ isActive = false;

    /** @type {Array<FiberNetwork>} */ allNetworks = [];
    /** @type {FiberNetwork} */ selectedNetwork = null;

    /** @type {Entity} */ snappedEntity = null;
    /** @type {Vector} */ snappedNode = null;

    /** @type {AtlasSprite} */ crossSprite = null;

    static getId() {
        return "FiberEditor";
    }

    /**
     * @param {GameRoot} root
     */
    constructor(root) {
        this.root = root;
        this.root[FiberEditor.getId()] = this;

        this.rng = new RandomNumberGenerator(this.root.map.seed);
        this.crossSprite = Loader.getSprite("sprites/misc/slot_bad_arrow.png");

        this.root.camera.downPreHandler.addToTop(this.downPreHandler, this);
        this.root.signals.entityDestroyed.add(this.entityDestroyed, this);
    }

    /**
     * @returns {Array<{nodes: Array<{x: number, y: number}>, hue: number}>}
     */
    serialize() {
        return this.allNetworks.map(c => c.serialize());
    }

    /**
     * @param {Array<{nodes: Array<{x: number, y: number}>, hue: number}>} data
     */
    deserialize(data) {
        for (const networkData of data) {
            const network = new FiberNetwork(this.root);
            network.setColor(networkData.hue);

            for (const node of networkData.nodes) {
                const vector = new Vector(node.x, node.y);
                const { entity, slot } = FiberEditor.getNodeDataFromPoint(this.root, vector);

                this.addNodeToNetwork(network, entity, slot, vector);
            }

            this.finishNetwork(network);
        }
    }

    update() {
        if (!this.isActive) {
            return;
        }

        const buildingPlacer = this.root.hud.parts.buildingPlacer;
        const meta = buildingPlacer.currentMetaBuilding.get();
        if (!meta) {
            return;
        }

        this.returnToWiresLayer();
    }

    returnToWiresLayer() {
        this.toggleOff();

        const wiresIDX = shapez.layersToSwitch.findIndex(x => x.id === "wires");
        this.root.hud.parts["wiresOverlay"]["realCurrentLayer"] = shapez.layersToSwitch[wiresIDX];
    }

    toggleOn() {
        this.isActive = true;
        this.root.currentLayer = "wires";
        this.root.signals.editModeChanged.dispatch("Connection Error");
    }

    toggleOff() {
        this.isActive = false;
        this.clearCursor();
    }

    /**
     * @param {FiberNetwork} network
     */
    finishNetwork(network) {
        if (this.allNetworks.includes(network)) {
            return;
        }

        this.allNetworks.push(network);
        this.testNetworkForRemoval(network);
    }

    clearCursor() {
        if (!this.selectedNetwork) {
            return;
        }

        this.finishNetwork(this.selectedNetwork);
        this.selectedNetwork = null;
    }

    /**
     * @param {FiberNetwork} network
     */
    testNetworkForRemoval(network) {
        if (network.nodes.length > 1) {
            return;
        }

        network.clear();

        const index = this.allNetworks.indexOf(network);
        if (index == -1) {
            return;
        }

        this.allNetworks.splice(index, 1);
    }

    triggerNetworkRecompute() {
        this.root.systemMgr.systems.wire.needsRecompute = true;
    }

    /**
     * @param {FiberNetwork} network
     * @param {Entity} entity
     * @param {Vector} node
     */
    removeNodeFromNetwork(network, entity, node) {
        const index = network.nodes.findIndex(n => n.equals(node));

        const slot = network.slots[index];
        slot.linkedNetwork = null;

        network.nodes.splice(index, 1);
        network.slots.splice(index, 1);

        const displayComp = AdvancedDisplayComponent.get(entity);
        if (displayComp) {
            const displayNetwork = displayComp.linkedNetwork;
            network.displayNetworks.splice(network.displayNetworks.indexOf(displayNetwork));
        }

        this.testNetworkForRemoval(network);
        this.triggerNetworkRecompute();
    }

    /**
     * @param {FiberNetwork} network
     * @param {Entity} entity
     * @param {import("../components/fiberPins").FiberPinSlot} slot
     * @param {Vector} node
     */
    addNodeToNetwork(network, entity, slot, node) {
        if (network.nodes.includes(node)) {
            return;
        }

        const closestIDX = network.closestFiberToPoint(node);

        network.nodes.splice(closestIDX, 0, node);
        network.slots.splice(closestIDX, 0, slot);
        slot.linkedNetwork = network;

        const displayComp = AdvancedDisplayComponent.get(entity);
        if (displayComp) {
            network.displayNetworks.push(displayComp.linkedNetwork);
        }

        this.triggerNetworkRecompute();
    }

    /**
     * @param {FiberNetwork} network
     */
    destroyNetwork(network) {
        network.nodes = [];
        this.testNetworkForRemoval(network);
    }

    /**
     * @param {FiberNetwork} network
     * @param {Vector} point
     */
    splitNetworkFromPoint(network, point) {
        const closestIDX = network.closestFiberToPoint(point);

        const nodes = network.nodes;
        const nodesLeft = nodes.slice(0, closestIDX);
        const nodesRight = nodes.slice(closestIDX);

        const leftNetwork = new FiberNetwork(this.root);
        const rightNetwork = new FiberNetwork(this.root);

        leftNetwork.randomColor(this.rng);
        rightNetwork.randomColor(this.rng);

        network.slots = [];
        this.destroyNetwork(network);

        for (const node of nodesLeft) {
            const { entity, slot } = FiberEditor.getNodeDataFromPoint(this.root, node);
            this.addNodeToNetwork(leftNetwork, entity, slot, node);
        }

        for (const node of nodesRight) {
            const { entity, slot } = FiberEditor.getNodeDataFromPoint(this.root, node);
            this.addNodeToNetwork(rightNetwork, entity, slot, node);
        }

        this.finishNetwork(leftNetwork);
        this.finishNetwork(rightNetwork);
    }

    /**
     * @param {FiberNetwork} targetNetwork
     */
    connectNetworks(targetNetwork) {
        this.selectedNetwork.clear();
        targetNetwork.clear();

        const selectedIndex = this.allNetworks.indexOf(this.selectedNetwork);
        if (selectedIndex != -1) {
            this.allNetworks.splice(selectedIndex, 1);
        }
        this.allNetworks.splice(this.allNetworks.indexOf(targetNetwork), 1);

        const selectedNodes = this.selectedNetwork.nodes;
        const targetNodes = targetNetwork.nodes;

        const allNodes = [...selectedNodes, ...targetNodes];
        const newNetwork = new FiberNetwork(this.root);
        newNetwork.setColor(this.selectedNetwork.hue);

        for (const node of allNodes) {
            const { entity, slot } = FiberEditor.getNodeDataFromPoint(this.root, node);
            this.addNodeToNetwork(newNetwork, entity, slot, node);
        }

        this.selectedNetwork = newNetwork;
    }

    /**
     * @param {GameRoot} root
     * @param {Vector} point
     * @returns {{ entity: Entity, slot: FiberPinSlot, node: Vector }}
     */
    static getNodeDataFromPoint(root, point) {
        const emptyData = { entity: null, slot: null, node: null };

        const tile = point.toTileSpace();
        const contents = root.map.getLayersContentsMultipleXY(tile.x, tile.y);

        let relevantEntity = null;
        for (const entity of contents) {
            if (!FiberEditor.isRelevant(entity)) {
                continue;
            }

            relevantEntity = entity;
            break;
        }

        if (!relevantEntity) {
            return emptyData;
        }

        const fiberPin = FiberPinsComponent.get(relevantEntity);
        const staticComp = relevantEntity.components.StaticMapEntity;

        let minLength = globalConfig.tileSize / 4;
        let selectedSlot;
        let selectedNode;
        for (const slot of fiberPin.slots) {
            const slotPos = FiberEditor.positionOfSlot(staticComp, slot);
            const length = point.sub(slotPos).length();

            if (length < minLength) {
                minLength = length;
                selectedNode = slotPos;
                selectedSlot = slot;
            }
        }

        if (!selectedNode) {
            return emptyData;
        }

        return { entity: relevantEntity, slot: selectedSlot, node: selectedNode };
    }

    // /**
    //  * @returns {Vector}
    //  */
    // getFixedMousePosition() {
    //     const mousePos = this.root.camera.screenToWorld(this.root.app.mousePosition);

    //     if (!this.selectedNetwork) {
    //         return mousePos;
    //     }

    //     const network = this.selectedNetwork;
    //     const nodes = network.nodes;
    //     const closestIDX = network.closestFiberToPoint(mousePos);

    //     if (closestIDX == 0 || closestIDX == nodes.length) {
    //         const node = nodes[closestIDX == 0 ? 0 : closestIDX - 1];
    //         const delta = mousePos.sub(node);
    //         const dist = delta.length();

    //         if (dist < this.maxFiberLength) {
    //             return mousePos;
    //         }

    //         return node.add(delta.multiplyScalar(this.maxFiberLength / dist));
    //     }

    //     const nodeLeft = nodes[closestIDX - 1];
    //     const nodeRight = nodes[closestIDX];

    //     const deltaLeft = mousePos.sub(nodeLeft);
    //     const deltaRight = mousePos.sub(nodeRight);

    //     const distLeft = deltaLeft.length();
    //     const distRight = deltaRight.length();

    //     if (distLeft < this.maxFiberLength || distRight < this.maxFiberLength) {
    //         return mousePos;
    //     }

    //     if (distLeft < distRight) {
    //         return nodeLeft.add(deltaLeft.multiplyScalar(this.maxFiberLength / distLeft));
    //     } else {
    //         return nodeRight.add(deltaRight.multiplyScalar(this.maxFiberLength / distRight));
    //     }
    // }

    /**
     * @param {Vector} mousePos
     * @returns {boolean}
     */
    handleLeftClick(mousePos) {
        const { entity, slot, node } = FiberEditor.getNodeDataFromPoint(this.root, mousePos);
        if (!entity) {
            if (!this.selectedNetwork) {
                return true;
            }
            this.clearCursor();
            return;
        }

        const selectedNetwork = this.selectedNetwork;
        const targetNetwork = slot.linkedNetwork;

        if (!selectedNetwork) {
            if (!targetNetwork) {
                const newConnection = new FiberNetwork(this.root);
                newConnection.randomColor(this.rng);
                this.selectedNetwork = newConnection;
            } else {
                this.selectedNetwork = targetNetwork;
                return;
            }
        } else {
            if (selectedNetwork == targetNetwork) {
                this.clearCursor();
                return;
            }

            if (targetNetwork) {
                if (!this.altIsPressed) {
                    this.removeNodeFromNetwork(targetNetwork, entity, node);
                } else {
                    this.connectNetworks(targetNetwork);
                    this.clearCursor();
                    return;
                }
            }
        }

        this.addNodeToNetwork(this.selectedNetwork, entity, slot, node);
    }

    /**
     * @param {Vector} mousePos
     */
    handleRightClick(mousePos) {
        const snapped = this.snappedNode;
        if (!snapped) {
            if (this.altIsPressed) {
                this.splitNetworkFromPoint(this.selectedNetwork, mousePos);
            }
            this.clearCursor();
            return;
        }

        if (this.altIsPressed) {
            this.destroyNetwork(this.selectedNetwork);
            this.clearCursor();
        } else if (this.selectedNetwork.nodes.find(v => v.equals(snapped))) {
            this.removeNodeFromNetwork(this.selectedNetwork, this.snappedEntity, snapped);
        } else {
            this.clearCursor();
        }
    }

    /**
     * @param {Vector} pos
     * @param {enumMouseButton} button
     */
    downPreHandler(pos, button) {
        if (!this.isActive) {
            return;
        }

        const worldMouse = this.root.camera.screenToWorld(pos);
        if (button == enumMouseButton.left) {
            if (this.handleLeftClick(worldMouse)) {
                return;
            }
        } else if (button == enumMouseButton.right) {
            this.handleRightClick(worldMouse);
        }

        return STOP_PROPAGATION;
    }

    /**
     * @param {Entity} entity
     */
    entityDestroyed(entity) {
        if (!FiberEditor.isRelevant(entity)) {
            return;
        }

        const fiberPin = FiberPinsComponent.get(entity);
        for (const slot of fiberPin.slots) {
            if (!slot.linkedNetwork) {
                continue;
            }

            const network = slot.linkedNetwork;
            const idx = network.slots.findIndex(s => s == slot);

            const node = network.nodes[idx];
            this.removeNodeFromNetwork(network, entity, node);
        }
    }

    /**
     * @param {Entity} entity
     * @returns {Boolean}
     */
    static isRelevant(entity) {
        return !!FiberPinsComponent.get(entity);
    }

    get altIsPressed() {
        return this.root.keyMapper.getBinding(KEYMAPPINGS.placementModifiers.placeInverse).pressed;
    }

    /**
     * @param {StaticMapEntityComponent} staticComp
     * @param {FiberPinSlot} slot
     * @returns {Vector}
     */
    static positionOfSlot(staticComp, slot) {
        const slotPos = staticComp.localTileToWorld(slot.tilePos).toWorldSpaceCenterOfTile();
        const offset = slot.offset
            .multiplyScalar(globalConfig.tileSize / 2)
            .rotateInplaceFastMultipleOf90(staticComp.rotation);
        return slotPos.add(offset);
    }

    /**
     * @param {DrawParameters} parameters
     */
    draw(parameters) {
        if (!this.isActive) {
            return;
        }

        const ctx = parameters.context;
        const visibleRect = parameters.visibleRect;

        ctx.globalAlpha = 0.15;
        ctx.fillStyle = "blue";
        ctx.fillRect(visibleRect.x, visibleRect.y, visibleRect.w, visibleRect.h);
        ctx.globalAlpha = 1;

        for (const connection of this.allNetworks) {
            if (connection == this.selectedNetwork) {
                continue;
            }

            parameters.context.globalAlpha = 0.5;
            connection.drawPoints(parameters, {});
            parameters.context.globalAlpha = 1;
        }

        // const mousePos = this.getFixedMousePosition();
        const mousePos = this.root.camera.screenToWorld(this.root.app.mousePosition);
        if (this.selectedNetwork) {
            const network = this.selectedNetwork;
            const { entity, node } = FiberEditor.getNodeDataFromPoint(this.root, mousePos);

            const shouldSnap = !!node;
            const connectedNode = !!network.nodes.find(
                n => (node && n.equals(node)) || (this.snappedNode && n.equals(this.snappedNode))
            );
            const targetPos = shouldSnap ? node : mousePos;

            const closestIDX = network.closestFiberToPoint(targetPos);
            network.nodes.splice(closestIDX, 0, targetPos);
            network.drawPoints(parameters, {
                wobbleEffect: !!this.snappedNode != shouldSnap && !connectedNode,
            });
            network.nodes.splice(closestIDX, 1);

            this.snappedEntity = shouldSnap ? entity : null;
            this.snappedNode = shouldSnap ? node : null;

            if (shouldSnap) {
                let color;
                if (connectedNode) {
                    color = "rgb(255, 0, 0)";
                } else {
                    color = "rgb(56, 235, 111)";
                }

                if (!this.altIsPressed) {
                    this.highlightEntity(parameters, entity, color);
                } else {
                    const fiberPin = FiberPinsComponent.get(entity);

                    let fullSlot = false;
                    for (const slot of fiberPin.slots) {
                        if (!slot.linkedNetwork) {
                            continue;
                        }

                        fullSlot = true;
                        slot.linkedNetwork.hightLightNetwork(parameters, color);
                    }

                    if (!fullSlot) {
                        this.highlightEntity(parameters, entity, color);
                    }
                }
            } else if (this.altIsPressed) {
                this.crossSprite.drawCachedCentered(parameters, mousePos.x, mousePos.y, 20);
            }
        } else {
            this.snappedEntity = null;
            this.snappedNode = null;

            const mouseTile = mousePos.toTileSpace();
            const contents = this.root.map.getLayersContentsMultipleXY(mouseTile.x, mouseTile.y);
            for (const entity of contents) {
                if (!FiberEditor.isRelevant(entity)) {
                    continue;
                }

                const fiberPin = FiberPinsComponent.get(entity);
                for (const slot of fiberPin.slots) {
                    const fiberNetwork = slot.linkedNetwork;
                    if (!fiberNetwork) {
                        continue;
                    }

                    fiberNetwork.drawPoints(parameters, {});
                    fiberNetwork.hightLightNetwork(parameters);
                }
            }
        }
    }

    /**
     * @param {DrawParameters} parameters
     */
    drawOverlays(parameters) {
        if (!this.isActive || this.selectedNetwork) {
            return;
        }

        const mousePos = this.root.app.mousePosition;
        const mouseTile = this.root.camera.screenToWorld(mousePos).toTileSpace();
        const contents = this.root.map.getLayersContentsMultipleXY(mouseTile.x, mouseTile.y);
        for (const entity of contents) {
            if (!FiberEditor.isRelevant(entity)) {
                continue;
            }

            const fiberComp = FiberPinsComponent.get(entity);
            if (!fiberComp) {
                continue;
            }

            for (const slot of fiberComp.slots) {
                const wireNetwork = slot.wireNetwork;
                if (!wireNetwork) {
                    continue;
                }

                this.highlightWireNetwork(parameters, wireNetwork, mousePos);
            }
        }
    }

    /**
     * @param {DrawParameters} parameters
     * @param {Entity} entity
     * @param {string} color
     */
    highlightEntity(parameters, entity, color) {
        const staticComp = entity.components.StaticMapEntity;
        const rect = staticComp.getTileSpaceBounds().allScaled(globalConfig.tileSize);

        parameters.context.strokeStyle = color;
        // @ts-ignore
        parameters.context.beginRoundedRect(rect.x, rect.y, rect.w, rect.h, 2);
        parameters.context.stroke();
    }

    /**
     * @param {DrawParameters} parameters
     * @param {WireNetwork} network
     * @param {Vector} mousePos
     */
    highlightWireNetwork(parameters, network, mousePos) {
        /** @type {HUDWireInfo} */
        const wireInfo = this.root.hud.parts["wireInfo"];

        if (network.valueConflict) {
            wireInfo.spriteConflict.draw(parameters.context, mousePos.x + 15, mousePos.y - 10, 60, 60);
        } else if (!network.currentValue) {
            wireInfo.spriteEmpty.draw(parameters.context, mousePos.x + 15, mousePos.y - 10, 60, 60);
        } else {
            network.currentValue.drawItemCenteredClipped(mousePos.x + 40, mousePos.y + 10, parameters, 60);
        }
    }

    /**
     * @param {GameRoot} root
     * @returns {FiberEditor}
     */
    static get(root) {
        return root[this.getId()];
    }
}
