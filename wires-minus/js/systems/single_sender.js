import { enumColors } from "shapez/game/colors";
import { GameSystemWithFilter } from "shapez/game/game_system_with_filter";
import { BooleanItem } from "shapez/game/items/boolean_item";
import { COLOR_ITEM_SINGLETONS } from "shapez/game/items/color_item";
import { SingleSenderComponent } from "../components/single_sender";

export class SingleSenderSystem extends GameSystemWithFilter {
    constructor(root) {
        super(root, [SingleSenderComponent]);
    }

    update() {
        for (const entity of this.allEntities) {
            /** @type {SingleSenderComponent} */
            const singleComp = entity.components["SingleSender"];

            singleComp.value = null;

            const pin = entity.components.WiredPins.slots[0];
            const network = pin.linkedNetwork;
            if (!network) {
                continue;
            }

            const pinValue = network.currentValue;
            if (!pinValue || network.valueConflict) {
                continue;
            }

            if (pinValue instanceof BooleanItem) {
                singleComp.value = pinValue.value
                    ? COLOR_ITEM_SINGLETONS[enumColors.white]
                    : COLOR_ITEM_SINGLETONS[enumColors.uncolored];
                continue;
            }

            singleComp.value = pinValue;
        }
    }
}
