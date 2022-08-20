import { globalConfig } from "shapez/core/config";
import { Entity } from "shapez/game/entity";
import { GameSystemWithFilter } from "shapez/game/game_system_with_filter";
import { BOOL_FALSE_SINGLETON } from "shapez/game/items/boolean_item";
import { RandomNumberGeneratorComponent } from "../components/randomNumberGenerator";

export class RandomNumberGeneratorSystem extends GameSystemWithFilter {
    constructor(root) {
        super(root, [RandomNumberGeneratorComponent]);

        this.root.signals.entityAdded.add(this.entityAdded, this);
    }

    update() {
        for (const entity of this.allEntities) {
            const slotComp = entity.components.WiredPins;

            const network = slotComp.slots[1].linkedNetwork;
            if (!network) {
                this.buildingOff(entity);
                continue;
            }

            if (network.valueConflict) {
                this.buildingOff(entity);
                continue;
            }

            const item = network.currentValue;
            if (!item || item == BOOL_FALSE_SINGLETON) {
                this.buildingOff(entity);
                continue;
            }

            this.buildingOn(entity);
        }
    }

    entityAdded(entity) {
        const comp = entity.components["RandomNumberGenerator"];
        if (!comp) {
            return;
        }

        if (comp.number) {
            return;
        }

        this.buildingOn(entity);
    }

    /**
     * @param {Entity} entity
     */
    buildingOff(entity) {
        const comp = entity.components["RandomNumberGenerator"];
        comp.pulse = false;
    }

    /**
     * @param {Entity} entity
     */
    buildingOn(entity) {
        const comp = entity.components["RandomNumberGenerator"];

        if (comp.pulse) {
            return;
        }

        this.selectNewRandom(entity);
        comp.pulse = true;
    }

    /**
     * @param {Entity} entity
     */
    selectNewRandom(entity) {
        const comp = entity.components["RandomNumberGenerator"];
        comp.number = Math.random();

        const slotComp = entity.components.WiredPins;
        slotComp.slots[0].value = globalConfig["numberManager"].getItem(comp.number);
    }
}
