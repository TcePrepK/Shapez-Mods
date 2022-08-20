import { Rectangle } from "shapez/core/rectangle";
import { Vector } from "shapez/core/vector";

export class RotatableRectangle extends Rectangle {
    constructor(x = 0, y = 0, width = 0, height = 0, rotation = 0) {
        super(x, y, width, height);
        this.rotation = rotation;
    }

    /**
     * @param {number} angle
     * @returns {Rectangle}
     */
    rotateRectangle(angle) {
        const corners = [
            this.topLeft().rotated(angle),
            this.topRight().rotated(angle),
            this.bottomRight().rotated(angle),
            this.bottomLeft().rotated(angle),
        ];

        corners.sort((a, b) => {
            if (a.x > b.x) return 1;
            if (a.x < b.x) return -1;
            return 0;
        });

        const leftMostCorner = corners[0];
        const rightMostCorner = corners[3];

        corners.sort((a, b) => {
            if (a.y > b.y) return 1;
            if (a.y < b.y) return -1;
            return 0;
        });

        const topMostCorner = corners[0];
        const bottomMostCorner = corners[3];

        const leftTop = new Vector(leftMostCorner.x, topMostCorner.y);
        const rightBottom = new Vector(rightMostCorner.x, bottomMostCorner.y);

        return Rectangle.fromTwoPoints(leftTop, rightBottom);
    }

    /**
     * Returns the top right point
     * @returns {Vector}
     */
    topRight() {
        return new Vector(this.right(), this.top());
    }

    /**
     * Returns the bottom left point
     * @returns {Vector}
     */
    bottomLeft() {
        return new Vector(this.left(), this.bottom());
    }
}
