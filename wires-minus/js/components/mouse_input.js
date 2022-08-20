import { Component } from "shapez/game/component";
import { ShapeItem } from "shapez/game/items/shape_item";

export class MouseInputComponent extends Component {
    static getId() {
        return "MouseInput";
    }

    constructor() {
        super();

        /** @type {ShapeItem} */
        this.currentValue;
    }
}
