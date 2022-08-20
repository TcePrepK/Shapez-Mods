import { Entity } from "shapez/game/entity";

export class RailNetwork {
    constructor() {
        this.rails = [];
    }

    /**
     * @param {Entity} entity
     */
    addEntityToTop(entity) {
        if (!this.isValidRail(entity)) {
            return;
        }

        this.rails.push(entity);
        entity.components["Rail"].railNetwork = this;
    }

    /**
     * @param {Entity} entity
     */
    addEntityToBottom(entity) {
        if (!this.isValidRail(entity)) {
            return;
        }

        this.rails.unshift(entity);
        entity.components["Rail"].railNetwork = this;
    }

    removeEntity(entity) {
        const index = this.rails.indexOf(entity);
        if (index === -1) {
            return;
        }

        this.rails.splice(index, 1);
        entity.components["Rail"].railNetwork = null;
    }

    clear() {
        this.rails = [];
    }

    /**
     * @param {Entity} entity
     */
    isValidRail(entity) {
        return !!entity.components["Rail"];
    }
}
