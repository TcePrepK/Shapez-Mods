import { Component } from "shapez/game/component";
import { Entity } from "shapez/game/entity";
import { WireNetwork } from "shapez/game/systems/wire";
import { DynamicNetwork } from "../core/dynamicNetwork";

export class HammerLinkComponent extends Component {
    /** @type {DynamicNetwork} */ linkedNetwork = null;
    /** @type {WireNetwork} */ wireNetwork = null;

    static getId() {
        return "HammerLinkSignal";
    }

    /**
     * @param {Entity} entity
     * @returns {HammerLinkComponent}
     */
    static get(entity) {
        return entity.components[this.getId()];
    }

    constructor() {
        super();
    }
}
