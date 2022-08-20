import { globalConfig } from "shapez/core/config";
import { DrawParameters } from "shapez/core/draw_parameters";
import { AtlasSprite } from "shapez/core/sprites";
import { lerp } from "shapez/core/utils";
import { Vector } from "shapez/core/vector";

export class MovingSprite {
    /**
     * @param {Vector} startingPos
     * @param {Vector} endingPosition
     * @param {number} reachTime
     * @param {AtlasSprite} sprite
     */
    constructor(startingPos, endingPosition, reachTime, sprite) {
        /** @type {Vector} */
        this.startingPos = startingPos;

        /** @type {Vector} */
        this.endingPosition = endingPosition;

        /** @type {AtlasSprite} */
        this.sprite = sprite;

        /** @type {number} */
        this.time = 0;

        /** @type {number} */
        this.reachTime = reachTime;
    }

    update() {
        if (this.time >= this.reachTime) {
            return;
        }

        this.time++;
    }

    /**
     * @param {DrawParameters} parameters
     */
    draw(parameters) {
        const timeDelta = this.time / this.reachTime;
        const posX = lerp(this.startingPos.x, this.endingPosition.x, timeDelta);
        const posY = lerp(this.startingPos.y, this.endingPosition.y, timeDelta);

        this.sprite.drawCachedCentered(parameters, posX, posY, globalConfig.tileSize + 4, true);
        return;
    }

    /**
     * @return {boolean}
     */
    done() {
        return this.time >= this.reachTime;
    }
}
