import { globalConfig } from "shapez/core/config";
import { DrawParameters } from "shapez/core/draw_parameters";
import { RandomNumberGenerator } from "shapez/core/rng";
import { Vector } from "shapez/core/vector";
import { BaseItem } from "shapez/game/base_item";
import { enumPinSlotType } from "shapez/game/components/wired_pins";
import { Entity } from "shapez/game/entity";
import { GameRoot } from "shapez/game/root";

export class FiberNetwork {
    /**
     * @param {GameRoot} root
     * @param {number} maxTime
     */
    constructor(root, maxTime) {
        this.root = root;

        /** @type {Array<Entity>} */
        this.entities = [];

        /** @type {Array<import("../components/fiber_pins").FiberPinSlot>} */
        this.slots = [];

        /** @type {Array<import("../components/fiber_pins").FiberPinSlot>} */
        this.senders = [];

        /** @type {Array<Vector>} */
        this.points = [];

        /** @type {Array<Array<number>>} */
        this.drawOrder = [];

        /**
         * The current value of this network
         * @type {BaseItem}
         */
        this.currentValue = null;

        /**
         * Whether this network has a value conflict, that is, more than one
         * sender has sent a value
         * @type {boolean}
         */
        this.valueConflict = false;

        this.maxTime = maxTime;

        this.hue = 0;
        this.color = "#000000";
    }

    /**
     * @returns {{points: Array<Vector>, drawOrder: Array<number>, hue: number}}
     */
    serialize() {
        return {
            points: this.points,
            drawOrder: this.drawOrder,
            hue: this.hue,
        };
    }

    /**
     * @param {RandomNumberGenerator} rng
     */
    randomColor(rng) {
        const scale = 60;
        this.setColor(scale * rng.nextIntRange(0, 360 / scale + 1));
    }

    setColor(hue) {
        this.hue = hue;
        this.color = `hsl(${this.hue}, 100%, 50%)`;
    }

    /**
     * @param {Entity} entity
     * @param {import("../components/fiber_pins").FiberPinSlot} slot
     * @param {Vector} point
     */
    connectEntity(entity, slot, point) {
        if (!this.entities.includes(entity)) {
            this.entities.push(entity);
        }

        if (!this.slots.includes(slot)) {
            this.slots.push(slot);

            if (slot.type == enumPinSlotType.logicalAcceptor) {
                this.senders.push(slot);
            }
        }

        if (!this.points.find(p => p.equals(point))) {
            this.points.push(point);
        }

        slot.linkedNetwork = this;
    }

    /**
     * @param {Vector} pos1
     * @param {Vector} pos2
     */
    addDrawOrder(pos1, pos2) {
        const index1 = this.points.findIndex(p => p.equals(pos1));
        const index2 = this.points.findIndex(p => p.equals(pos2));

        if (
            this.drawOrder.find(a => {
                return (a[0] == index1 && a[1] == index2) || (a[0] == index2 && a[1] == index1);
            })
        ) {
            return;
        }

        this.drawOrder.push([index1, index2]);
    }

    clear() {
        for (let i = 0; i < this.slots.length; i++) {
            this.slots[i].linkedNetwork = null;
        }
    }

    /**
     * @param {DrawParameters} parameters
     * @param {number} deltaMouse
     * @param {number} time
     */
    drawPoints(parameters, deltaMouse = 0, time = 0) {
        if (!this.root.hud.parts["connectionBoard"].isActive || this.points.length <= 1) {
            return;
        }

        const ctx = parameters.context;
        ctx.lineCap = "round";
        ctx.strokeStyle = this.color;
        ctx.fillStyle = this.color;

        if (this.valueConflict) {
            ctx.strokeStyle = "red";
            ctx.fillStyle = "red";
        }

        const alpha = ctx.globalAlpha;
        ctx.globalAlpha = 0.5;
        for (let i = 0; i < this.points.length; i++) {
            const pos = this.points[i];
            const type = this.slots[i].type;

            const r = 2;
            if (type == enumPinSlotType.logicalAcceptor) {
                ctx.fillRect(pos.x - r, pos.y - r, r * 2, r * 2);
            } else {
                ctx.beginPath();
                ctx.arc(pos.x, pos.y, r, 0, Math.PI * 2);
                ctx.fill();
                ctx.closePath();
            }
        }
        ctx.globalAlpha = alpha;

        for (const line of this.drawOrder) {
            const p1 = this.points[line[0]];
            const p2 = this.points[line[1]];

            const d = p2.sub(p1);
            if (Math.abs(d.x) < 1) {
                ctx.beginPath();
                ctx.moveTo(p1.x, p1.y);
                ctx.lineTo(p2.x, p2.y);
                ctx.stroke();
                ctx.closePath();
                continue;
            }

            const w = d.length();
            const ph = Math.max(1000 / Math.abs(p1.x - p2.x), 5) * w;
            const dmc = deltaMouse * 2 * (time - this.maxTime);
            const h = ph + Math.max(dmc, -ph + w);

            const n1 = d.normalize();
            const n2 = new Vector(Math.sign(n1.x) * n1.y, -Math.abs(n1.x));
            const n3 = n1.multiplyScalar(w).add(n2.multiplyScalar(h)).normalize();

            const c = p1.add(n3.multiplyScalar(Math.sqrt(w * w + h * h) / 2));
            const r = c.sub(p1).length();

            const sa = Math.atan2(p1.y - c.y, p1.x - c.x);
            const ea = Math.atan2(p2.y - c.y, p2.x - c.x);

            const asa = Math.abs(sa);
            const aea = Math.abs(ea);

            const tsa = asa < aea ? sa : ea;
            const tea = asa < aea ? ea : sa;

            ctx.beginPath();
            ctx.arc(c.x, c.y, r, tsa, tea);
            ctx.stroke();
            ctx.closePath();
        }
    }

    /**
     * @param {DrawParameters} parameters
     * @param {Vector} mousePos
     * @param {number} deltaMouse
     * @param {number} time
     */
    drawToMouse(parameters, mousePos, deltaMouse, time) {
        this.points.push(mousePos);
        this.drawOrder.push([this.points.length - 1, this.points.length - 2]);
        this.drawNetwork(parameters, deltaMouse, time);
        this.drawOrder.pop();
        this.points.pop();
    }

    /**
     * @param {DrawParameters} parameters
     * @param {number} deltaMouse
     * @param {number} time
     */
    drawNetwork(parameters, deltaMouse, time) {
        this.drawPoints(parameters, deltaMouse, time);

        const ctx = parameters.context;
        ctx.strokeStyle = `hsl(${this.hue}, 100%, 75%)`;
        ctx.lineWidth = 1;
        ctx.globalAlpha = 0.75;

        for (const entity of this.entities) {
            const staticComp = entity.components.StaticMapEntity;
            const rect = staticComp.getTileSpaceBounds().allScaled(globalConfig.tileSize);

            ctx.strokeRect(rect.x, rect.y, rect.w, rect.h);
        }

        ctx.globalAlpha = 1;
    }
}
