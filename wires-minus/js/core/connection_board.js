import { globalConfig } from "shapez/core/config";
import { DrawParameters } from "shapez/core/draw_parameters";
import { RandomNumberGenerator } from "shapez/core/rng";
import { STOP_PROPAGATION } from "shapez/core/signal";
import { enumDirectionToAngle, Vector } from "shapez/core/vector";
import { enumMouseButton } from "shapez/game/camera";
import { StaticMapEntityComponent } from "shapez/game/components/static_map_entity";
import { Entity } from "shapez/game/entity";
import { BaseHUDPart } from "shapez/game/hud/base_hud_part";
import { enumHubGoalRewards } from "shapez/game/tutorial_goals";
import { FiberPinsComponent } from "../components/fiber_pins";
import { FiberNetwork } from "./fiberNetwork";

export class ConnectionBoard extends BaseHUDPart {
    initialize() {
        this.rng = new RandomNumberGenerator(this.root.map.seed);

        this.isActive = false;

        /** @type {Array<FiberNetwork>} */
        this.allConnections = [];

        /** @type {FiberNetwork} */
        this.currentConnection;

        /** @type {Vector} */
        this.previousPosition;

        this.maxTime = 2;

        this.root.camera.downPreHandler.addToTop(this.downPreHandler, this);
        this.root.signals.entityDestroyed.add(this.entityDestroyed, this);

        this.toggle();
    }

    serialize() {
        return this.allConnections.map(c => c.serialize());
    }

    /**
     * @param {Array<{points: Array<{x: number, y: number}>, drawOrder: Array<number>, hue: number}>} data
     */
    deserialize(data) {
        console.log(data);
        for (const connection of data) {
            for (const point of connection.points) {
                const pos = new Vector(point.x, point.y);

                const tile = pos.toTileSpace();
                const contents = this.root.map.getLayersContentsMultipleXY(tile.x, tile.y);

                let relevantEntity = null;
                for (const entity of contents) {
                    if (!this.isRelevant(entity)) {
                        continue;
                    }

                    relevantEntity = entity;
                    break;
                }

                if (!relevantEntity) {
                    this.finializeConnection();
                    return;
                }

                this.connectEntity(relevantEntity, pos);
            }

            this.currentConnection.drawOrder = connection.drawOrder;
            this.currentConnection.setColor(connection.hue);
            this.finializeConnection();
        }
    }

    toggle() {
        if (
            !this.root.hubGoals.isRewardUnlocked(enumHubGoalRewards.reward_wires_painter_and_levers) &&
            !(shapez.G_IS_DEV || globalConfig.debug.allBuildingsUnlocked)
        ) {
            return;
        }

        this.root.signals.editModeChanged.dispatch("Connection Error");

        const alreadyActive = this.isActive;
        if (alreadyActive) {
            this.isActive = false;
            this.root.currentLayer = this.previousLayer;
            this.finializeConnection();
            return;
        }

        this.isActive = true;
        this.previousLayer = this.root.currentLayer;
        this.root.currentLayer = "wires";
    }

    finializeConnection() {
        if (!this.currentConnection) {
            return;
        }

        if (this.allConnections.includes(this.currentConnection)) {
            this.currentConnection = null;
            return;
        }

        this.allConnections.push(this.currentConnection);
        this.testConnectionForRemoval(this.currentConnection);

        this.currentConnection = null;
    }

    /**
     * @param {FiberNetwork} connection
     */
    testConnectionForRemoval(connection) {
        if (connection.points.length >= 2) {
            return;
        }

        connection.clear();

        const index = this.allConnections.indexOf(connection);
        if (index == -1) {
            return;
        }

        this.allConnections.splice(index, 1);
    }

    /**
     * @param {FiberNetwork} network 
     * @param {Vector} pos 
     */
     addPointToNetwork(network, pos) {
        
        this.previousPosition = pos;
    }

    /**
     * @param {Entity} entity
     * @param {import("../components/fiber_pins").FiberPinSlot} slot
     * @param {Vector} pos
     */
    testPointForConnection(entity, slot, pos) {
        const currentPoints = this.currentConnection.points;
        if (currentPoints.length == 0) {
            this.currentConnection.connectEntity(entity, slot, pos);
            this.previousPosition = pos;
            return;
        }

        this.currentConnection.connectEntity(entity, slot, pos);
        this.addPointToNetwork(this.currentConnection, pos);

        // let deletedConnection = false;
        // for (let i = 0; i < this.connections.length; i++) {
        //     const connection = this.connections[i];
        //     const connectionPoints = connection.points;

        //     let lastIndex = -1;
        //     for (let j = 0; j < connectionPoints.length; j++) {
        //         if (!connectionPoints[j].equals(lastPoint)) {
        //             continue;
        //         }

        //         if (j != connectionPoints.length - 1 && connectionPoints[j + 1].equals(currentPoint)) {
        //             lastIndex = j;
        //             break;
        //         }

        //         if (j != 0 && connectionPoints[j - 1].equals(currentPoint)) {
        //             lastIndex = j;
        //             break;
        //         }
        //     }

        //     if (lastIndex == -1) {
        //         continue;
        //     }

        //     connection.points.splice(lastIndex, 1);

        //     if (connection.points.length == 1) {
        //         this.connections.splice(this.connections.indexOf(connection), 1);
        //     }

        //     deletedConnection = true;

        //     break;
        // }

        // if (deletedConnection) {
        //     this.finializeConnection();
        //     return;
        // }
    }
    
    /**
     * @param {FiberNetwork} targetNetwork
     */
     connectNetworks(targetNetwork) {
        targetNetwork.clear();

        const points = targetNetwork.points;
        const drawOrder = targetNetwork.drawOrder;
        for (const order of drawOrder) {
            const point = points[order];

            const tile = point.toTileSpace();
            const contents = this.root.map.getLayersContentsMultipleXY(tile.x, tile.y);

            let relevantEntity = null;
            for (const entity of contents) {
                if (!this.isRelevant(entity)) {
                    continue;
                }

                relevantEntity = entity;
                break;
            }

            this.connectEntity(relevantEntity, point);
        }

        this.allConnections.splice(this.allConnections.indexOf(targetNetwork), 1);
    }

    /**
     * @param {Entity} entity
     * @param {Vector} worldMouse
     */
    connectEntity(entity, worldMouse) {
        /** @type {FiberPinsComponent} */
        const fiberPin = entity.components["FiberPins"];
        const staticComp = entity.components.StaticMapEntity;

        let minLength = Infinity;
        let selectedSlot;
        let selectedPos;
        for (const slot of fiberPin.slots) {
            const slotPos = this.positionOfSlot(staticComp, slot);
            const length = worldMouse.sub(slotPos).length();

            if (length < globalConfig.tileSize / 2 && length < minLength) {
                minLength = length;
                selectedPos = slotPos;
                selectedSlot = slot;
            }
        }

        if (minLength == Infinity) {
            this.finializeConnection();
            return;
        }

        const currentConnection = this.currentConnection;
        const selectedConnection = selectedSlot.linkedNetwork;
        if (currentConnection && selectedConnection && currentConnection != selectedConnection) {
            this.addPointToNetwork(currentConnection, selectedPos);
            this.connectNetworks(selectedConnection);
            return;
        }

        if (!currentConnection && selectedConnection) {
            this.currentConnection = selectedConnection;
        } else if (!currentConnection && !selectedConnection) {
            this.currentConnection = new FiberNetwork(this.root, this.maxTime);
            this.currentConnection.randomColor(this.rng);
        }

        this.testPointForConnection(entity, selectedSlot, selectedPos);
    }

    /**
     * @param {Vector} pos
     * @param {enumMouseButton} button
     */
    downPreHandler(pos, button) {
        if (!this.isActive) {
            return;
        }

        if (button == enumMouseButton.right && this.currentConnection) {
            this.finializeConnection();
            return STOP_PROPAGATION;
        }

        if (button !== enumMouseButton.left) {
            return;
        }

        const worldMouse = this.root.camera.screenToWorld(pos);
        const tile = worldMouse.toTileSpace();
        const contents = this.root.map.getLayersContentsMultipleXY(tile.x, tile.y);

        let relevantEntity = null;
        for (const entity of contents) {
            if (!this.isRelevant(entity)) {
                continue;
            }

            relevantEntity = entity;
            break;
        }

        if (!relevantEntity) {
            this.finializeConnection();
            return;
        }

        this.connectEntity(relevantEntity, worldMouse);

        return STOP_PROPAGATION;
    }

    /**
     * @param {Entity} entity
     */
    entityDestroyed(entity) {
        if (!this.isRelevant(entity)) {
            return;
        }

        const staticComp = entity.components.StaticMapEntity;
        /** @type {FiberPinsComponent} */
        const fiberPin = entity.components["FiberPins"];

        for (const slot of fiberPin.slots) {
            if (!slot.linkedNetwork) {
                continue;
            }

            const connection = slot.linkedNetwork;
            const entities = connection.entities;
            const slots = connection.slots;
            const points = connection.points;
            const drawOrder = connection.drawOrder;

            entities.splice(entities.indexOf(entity), 1);
            points.splice(points.indexOf(slot.pos), 1);

            const slotIdx = slots.indexOf(slot);
            slots.splice(slotIdx, 1);
            for (let i = 0; i < drawOrder.length; i++) {
                if (drawOrder[i] == slotIdx) {
                    drawOrder.splice(i, 1);
                    i--;
                    continue;
                }

                if (drawOrder[i] > slotIdx) {
                    drawOrder[i]--;
                }
            }

            this.testConnectionForRemoval(connection);
        }
    }

    /**
     * @param {Entity} entity
     */
    isRelevant(entity) {
        return !!entity?.components["FiberPins"];
    }

    /**
     * @param {StaticMapEntityComponent} staticComp
     * @param {import("../components/fiber_pins").FiberPinSlot} slot
     * @returns {Vector}
     */
    positionOfSlot(staticComp, slot) {
        const slotPos = staticComp.localTileToWorld(slot.pos).toWorldSpaceCenterOfTile();
        const effectiveRotation = (staticComp.rotation + enumDirectionToAngle[slot.direction]) % 360;
        return slotPos.add(new Vector(0, -9.1).rotateInplaceFastMultipleOf90(effectiveRotation));
    }

    update() {
        if (!this.lastMousePos) {
            this.lastMousePos = new Vector();
            this.time = 0;
        }

        if (this.time >= this.maxTime && !this.lastMousePos.equals(this.root.app.mousePosition)) {
            this.time = 0;
            return;
        }

        if (this.time < this.maxTime) {
            this.time += 0.1;
        }
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

        const mousePos = this.root.camera.screenToWorld(this.root.app.mousePosition);
        const deltaMouse = this.lastMousePos.sub(mousePos).length();
        if (this.currentConnection) {
            const lastPoint = this.currentConnection.points[this.currentConnection.points.length - 1];

            const maxDist = 32 * 32;
            const diff = mousePos.sub(lastPoint);
            const dist = diff.length();
            const norm = diff.normalize();
            const targetPos = lastPoint.add(norm.multiplyScalar(Math.min(dist, maxDist)));

            ctx.globalAlpha = 1;
            this.currentConnection.drawToMouse(parameters, targetPos, deltaMouse, this.time);
        } else {
            const mouseTile = mousePos.toTileSpace();
            const contents = this.root.map.getLayersContentsMultipleXY(mouseTile.x, mouseTile.y);
            for (const entity of contents) {
                if (!this.isRelevant(entity)) {
                    continue;
                }

                /** @type {FiberPinsComponent} */
                const fiberPin = entity.components["FiberPins"];
                for (const slot of fiberPin.slots) {
                    if (!slot.linkedNetwork) {
                        continue;
                    }

                    slot.linkedNetwork.drawNetwork(parameters, deltaMouse, this.time);
                }
            }
        }

        for (const connection of this.allConnections) {
            parameters.context.globalAlpha = 0.5;
            connection.drawPoints(parameters);
            parameters.context.globalAlpha = 1;
        }

        this.lastMousePos = mousePos;
    }
}
