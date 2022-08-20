import { enumDirection } from "shapez/core/vector";
import { Component } from "shapez/game/component";
import { RailNetwork } from "../networks/railNetwork";

export class RailComponent extends Component {
    static getId() {
        return "Rail";
    }

    constructor(direction = enumDirection.top) {
        super();

        this.direction = direction;

        /** @type {RailNetwork} */
        this.railNetwork = null;
    }
}
