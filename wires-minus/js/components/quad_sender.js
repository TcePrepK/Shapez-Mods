import { BaseItem } from "shapez/game/base_item";
import { enumColors } from "shapez/game/colors";
import { Component } from "shapez/game/component";

export class QuadSenderComponent extends Component {
    static getId() {
        return "QuadSender";
    }

    constructor() {
        super();

        /** @type {Array<BaseItem|Array<enumColors>>} */
        this.values = [];
    }
}
