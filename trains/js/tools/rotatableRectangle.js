import { Rectangle } from "shapez/core/rectangle";
import { epsilonCompare } from "shapez/core/utils";
import { Vector } from "shapez/core/vector";
import { fastCos, fastSin } from "./math";

export class RotatableRectangle {
    /**
     * @param {Array<Vector>} nodes
     * @param {Vector} center
     */
    constructor(nodes, center = null) {
        /** @type {Vector} */
        this.center = center ? center : this.getCenter(nodes);

        /** @type {Array<Vector>} */
        this.nodes = nodes;
    }

    /**
     * @param {Vector} center
     * @param {Vector} size
     */
    static fromCenterAndSize(center, size) {
        const x = center.x;
        const y = center.y;
        const width = size.x / 2;
        const height = size.y / 2;
        return new RotatableRectangle(
            [
                new Vector(x + width, y + height),
                new Vector(x - width, y + height),
                new Vector(x - width, y - height),
                new Vector(x + width, y - height),
            ],
            center
        );
    }

    /**
     * @param {Array<Vector>} nodes
     * @returns {Vector}
     */
    getCenter(nodes) {
        if (this.center) {
            return this.center;
        }

        /** @type {Vector} */
        this.center = new Vector(0, 0);
        for (let i = 0; i < nodes.length; i++) {
            this.center.addInplace(nodes[i]);
        }
        this.center.divideScalarInplace(nodes.length);
        return this.center;
    }

    /**
     * @param {Vector} center
     */
    setCenter(center) {
        this.center = center;
    }

    /**
     * @param {Number} rotation
     * @returns {RotatableRectangle}
     */
    rotated(rotation) {
        if (rotation === 0) {
            return this.clone();
        }

        /** @type {Array<Vector>} */
        const nodes = [];

        const sin = fastSin(rotation);
        const cos = fastCos(rotation);

        const cX = this.center.x;
        const cY = this.center.y;
        for (let i = 0; i < this.nodes.length; i++) {
            const x = this.nodes[i].x - cX;
            const y = this.nodes[i].y - cY;
            const finalX = cX + x * cos - y * sin;
            const finalY = cY + x * sin + y * cos;

            nodes[i] = new Vector(Math.floor(finalX * 1000) / 1000, Math.floor(finalY * 1000) / 1000);
        }

        return new RotatableRectangle(nodes, this.center);
    }

    /**
     * @returns {RotatableRectangle}
     */
    clone() {
        return new RotatableRectangle(this.nodes, this.center);
    }

    /**
     * @returns {number}
     */
    top() {
        if (this.definedTop) {
            return this.definedTop;
        }

        const fixedNodes = [...this.nodes].sort((a, b) => a.y - b.y);
        const top = fixedNodes[0].y;
        this.definedTop = top;
        return top;
    }

    /**
     * @returns {number}
     */
    right() {
        if (this.definedRight) {
            return this.definedRight;
        }

        const fixedNodes = [...this.nodes].sort((a, b) => a.x - b.x);
        const right = fixedNodes[3].x;
        this.definedRight = right;
        return right;
    }

    /**
     * @returns {number}
     */
    bottom() {
        if (this.definedBottom) {
            return this.definedBottom;
        }

        const fixedNodes = [...this.nodes].sort((a, b) => a.y - b.y);
        const bottom = fixedNodes[3].y;
        this.definedBottom = bottom;
        return bottom;
    }

    /**
     * @returns {number}
     */
    left() {
        if (this.definedLeft) {
            return this.definedLeft;
        }

        const fixedNodes = [...this.nodes].sort((a, b) => a.x - b.x);
        const left = fixedNodes[0].x;
        this.definedLeft = left;
        return left;
    }

    /**
     * Returns rectangle that contains this rotatable rectangle
     * @returns {Rectangle} effectiveRectangle
     */
    getEffectiveRectangle() {
        return Rectangle.fromTRBL(
            Math.floor(this.top()),
            Math.ceil(this.right()),
            Math.ceil(this.bottom()),
            Math.floor(this.left())
        );
    }

    /**
     * Moves the rectangle by the given vector
     * @param {Vector} vec
     */
    moveByVector(vec) {
        this.nodes.forEach(node => node.addInplace(vec));
        this.center.addInplace(vec);
    }

    /**
     * Scales every node by the given factor. Useful to transform from world to tile space and vice versa
     * @param {number} factor
     * @returns {RotatableRectangle}
     */
    allScaled(factor) {
        return new RotatableRectangle(
            this.nodes.map(node => node.multiplyScalar(factor)),
            this.center.multiplyScalar(factor)
        );
    }

    /**
     * Expands the rectangle in all directions
     * @param {number} amount
     * @returns {RotatableRectangle} new rectangle
     */
    expandedInAllDirections(amount) {
        const expandedNodes = [];
        for (const node of this.nodes) {
            const dist = node.sub(this.center);
            expandedNodes.push(node.addScalars(amount * Math.sign(dist.x), amount * Math.sign(dist.y)));
        }

        return new RotatableRectangle(expandedNodes, this.center);
    }

    /**
     * Returns if the rectangle contains the given point
     * @param {number} x
     * @param {number} y
     * @returns {boolean}
     */
    containsPoint(x, y) {
        return this.SATCollusionWithPoint(x, y);
    }

    /**
     * Returns if the rectangle intersects with the given rectangle
     * @param {RotatableRectangle} rect
     * @returns {Boolean}
     */
    intersects(rect) {
        return this.SATCollusionWithRectangle(rect, true);
    }

    /**
     * @param {Vector} axis
     * @returns {[number, number]}
     */
    project(axis) {
        const min = this.nodes.reduce((min, node) => Math.min(min, node.dot(axis)), Number.MAX_VALUE);
        const max = this.nodes.reduce((max, node) => Math.max(max, node.dot(axis)), -Number.MAX_VALUE);
        return [min, max];
    }

    /**
     * @param {RotatableRectangle} otherRectangle
     * @param {boolean} firstCheck
     * @returns {boolean}
     */
    SATCollusionWithRectangle(otherRectangle, firstCheck) {
        const firstAxis = this.nodes[0].sub(this.nodes[1]);
        const axes = [firstAxis, firstAxis.rotatedByDegree(90)];

        for (const axis of axes) {
            const [min1, max1] = this.project(axis);
            const [min2, max2] = otherRectangle.project(axis);

            if (max1 <= min2 || max2 <= min1) {
                return false;
            }
        }

        if (firstCheck) {
            return otherRectangle.SATCollusionWithRectangle(this, false);
        }

        return true;
    }

    /**
     * @param {number} x
     * @param {number} y
     * @returns {boolean}
     */
    SATCollusionWithPoint(x, y) {
        const firstAxis = this.nodes[0].sub(this.nodes[1]);
        const axes = [firstAxis, firstAxis.rotatedByDegree(90)];

        for (const axis of axes) {
            const [min1, max1] = this.project(axis);
            const pos2 = axis.dot(new Vector(x, y));

            if (max1 <= pos2 || pos2 <= min1) {
                return false;
            }
        }

        return true;
    }
}
