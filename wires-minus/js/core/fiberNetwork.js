import { globalConfig } from "shapez/core/config";
import { DrawParameters } from "shapez/core/draw_parameters";
import { RandomNumberGenerator } from "shapez/core/rng";
import { clamp } from "shapez/core/utils";
import { Vector } from "shapez/core/vector";
import { GameRoot } from "shapez/game/root";
import { FiberPinsComponent } from "../components/fiberPins";

export class FiberNetwork {
    /** @type {Array<Vector>} */ nodes = [];
    /** @type {Array<import("../components/fiberPins").FiberPinSlot>} */ slots = [];
    /** @type {Array<import("../core/displayNetwork").DisplayNetwork>} */ displayNetworks = [];

    /** @type {number} */ hue = 0;
    /** @type {string} */ color = "#000000";
    /** @type {number} */ wobbleTimer = 0;

    /**
     * @param {GameRoot} root
     */
    constructor(root) {
        this.root = root;
    }

    /**
     * @returns {{nodes: Array<{x: number, y: number}>, hue: number}}
     */
    serialize() {
        const obj = {
            nodes: [],
            hue: this.hue,
        };
        for (const node of this.nodes) {
            obj.nodes.push(node.serializeSimple());
        }
        return obj;
    }

    /**
     * @param {Vector} point
     * @returns {number}
     */
    closestFiberToPoint(point) {
        const mappedArr = [];
        for (let i = 0; i < this.nodes.length - 1; i++) {
            const p1 = this.nodes[i];
            const p2 = this.nodes[i + 1];

            const l2 = p1.distanceSquare(p2);
            const t = point.sub(p1).dot(p2.sub(p1)) / l2;
            const proj = p1.add(p2.sub(p1).multiplyScalar(clamp(t, 0, 1)));
            const dist = point.distance(proj);

            if (mappedArr[0] && mappedArr[0].dist >= dist) {
                mappedArr.splice(0, 0, {
                    idx: i,
                    time: t,
                    dist: dist,
                });
            } else {
                mappedArr.push({
                    idx: i,
                    time: t,
                    dist: dist,
                });
            }
        }

        let { idx, time, dist } = mappedArr[0] ?? { idx: 0, time: 0, dist: 0 };
        if (this.nodes.length != 1) {
            if (time > 0) {
                idx++;
            }

            if (time > 1) {
                idx++;
            }
        } else {
            idx++;
        }

        return idx;
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

    clear() {
        for (const slot of this.slots) {
            slot.linkedNetwork = null;
        }
    }

    /**
     * @param {DrawParameters} parameters
     * @param {Object} param1
     * @param {boolean=} param1.wobbleEffect
     */
    drawPoints(parameters, { wobbleEffect = false }) {
        if (this.nodes.length == 0) {
            return;
        }

        if (wobbleEffect) {
            this.wobbleTimer = 1;
        }

        const ctx = parameters.context;
        ctx.fillStyle = this.color;

        const alpha = ctx.globalAlpha;
        ctx.globalAlpha = 1;
        for (const node of this.nodes) {
            ctx.beginPath();
            ctx.arc(node.x, node.y, globalConfig.tileSize / 10, 0, 2 * Math.PI);
            ctx.closePath();
            ctx.fill();
        }
        ctx.globalAlpha = alpha;

        for (let i = 0; i < this.nodes.length - 1; i++) {
            this.drawFiber(parameters, i);
        }

        if (this.wobbleTimer > 0) {
            this.wobbleTimer -= 0.005;
        }
    }

    /**
     * @param {DrawParameters} parameters
     * @param {Number} index
     * @param {string} overrideColor
     */
    drawFiber(parameters, index, overrideColor = null) {
        const ctx = parameters.context;

        ctx.lineCap = "round";
        ctx.lineWidth = 1;
        ctx.strokeStyle = overrideColor ?? this.color;

        const p1 = this.nodes[index];
        const p2 = this.nodes[index + 1];

        const d = p2.sub(p1);
        if (Math.abs(d.x) < 1) {
            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.stroke();
            ctx.closePath();
            return;
        }

        const w = d.length();
        const h = Math.max(1000 / Math.abs(p1.x - p2.x), 5) * w;
        const lwh = Math.sqrt(w * w + h * h);
        const wob =
            ((32 * Math.pow(lwh, 0.25) * Math.sin((1 - this.wobbleTimer) * Math.PI * 16)) /
                Math.pow(2 - this.wobbleTimer, 10) +
                1) /
            1;
        const wOff = new Vector(0, wob).rotated(Math.atan2(p1.y - p2.y, p1.x - p2.x));

        const n1 = d.normalize();
        const n2 = new Vector(Math.sign(n1.x) * n1.y, -Math.abs(n1.x));
        const n3 = n1.multiplyScalar(w).add(n2.multiplyScalar(h)).normalize();

        const c = p1.add(n3.multiplyScalar(lwh / 2)).add(wOff);
        const r = c.sub(p1).length();

        const sa = Math.atan2(p1.y - c.y, p1.x - c.x);
        const ea = Math.atan2(p2.y - c.y, p2.x - c.x);

        const asa = Math.abs(sa);
        const aea = Math.abs(ea);

        const tsa = asa < aea ? sa : ea;
        const tea = asa < aea ? ea : sa;

        ctx.beginPath();
        ctx.arc(c.x, c.y, r, tsa, tea, false);
        ctx.stroke();
        ctx.closePath();
    }

    /**
     * @param {DrawParameters} parameters
     * @param {string=} overrideColor
     */
    hightLightNetwork(parameters, overrideColor = null) {
        const ctx = parameters.context;
        ctx.strokeStyle = overrideColor ?? this.color;
        ctx.lineWidth = 1;
        // ctx.globalAlpha = 0.8;

        for (const node of this.nodes) {
            const tile = node.toTileSpace();
            const contents = this.root.map.getLayersContentsMultipleXY(tile.x, tile.y);

            let relevantEntity = null;
            for (const entity of contents) {
                const fiberPin = FiberPinsComponent.get(entity);
                if (!fiberPin) {
                    continue;
                }

                for (const slot of fiberPin.slots) {
                    if (this.slots.includes(slot)) {
                        relevantEntity = entity;
                        break;
                    }
                }
            }

            if (!relevantEntity) {
                continue;
            }

            const staticComp = relevantEntity.components.StaticMapEntity;
            const rect = staticComp.getTileSpaceBounds().allScaled(globalConfig.tileSize);

            // @ts-ignore
            ctx.beginRoundedRect(rect.x, rect.y, rect.w, rect.h, 2);
            ctx.stroke();
        }

        // ctx.globalAlpha = 1;
    }
}
