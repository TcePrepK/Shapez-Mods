import { Component } from "shapez/game/component";
import { Entity } from "shapez/game/entity";

export class DisplayControllerComponent extends Component {
    static getId() {
        return "DisplayController";
    }

    /**
     * @param {Entity} entity
     * @returns {DisplayControllerComponent}
     */
    static get(entity) {
        return entity?.components[this.getId()];
    }

    constructor() {
        super();
    }
}
