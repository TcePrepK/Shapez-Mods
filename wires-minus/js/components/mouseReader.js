import { Component } from "shapez/game/component";
import { Entity } from "shapez/game/entity";

export class MouseReaderComponent extends Component {
    static getId() {
        return "MouseReader";
    }

    /**
     * @param {Entity} entity
     * @returns {MouseReaderComponent}
     */
    static get(entity) {
        return entity?.components[this.getId()];
    }

    constructor() {
        super();
    }
}
