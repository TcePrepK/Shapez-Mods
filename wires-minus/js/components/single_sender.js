import { BaseItem } from "shapez/game/base_item";
import { Component } from "shapez/game/component";

export class SingleSenderComponent extends Component {
    static getId() {
        return "SingleSender";
    }

    constructor() {
        super();

        /** @type {BaseItem} */
        this.value;
    }
}
