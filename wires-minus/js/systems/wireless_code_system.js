import { globalConfig } from "shapez/core/config";
import { DialogWithForm } from "shapez/core/modal_dialog_elements";
import { FormElementInput } from "shapez/core/modal_dialog_forms";
import { Entity } from "shapez/game/entity";
import { GameSystemWithFilter } from "shapez/game/game_system_with_filter";
import { DEFAULTCODE, WirelessCodeComponent } from "../components/wireless_code";
import { WirelessManager } from "../core/wirelessManager";

export class WirelessCodeSystem extends GameSystemWithFilter {
    constructor(root) {
        super(root, [WirelessCodeComponent]);

        this.root.signals.postLoadHook.add(this.gameRestored, this);

        this.root.signals.entityDestroyed.add(this.entityDestroyed, this);
        this.root.signals.entityManuallyPlaced.add(this.entityPlaced, this);
        this.root.signals.entityAdded.add(this.entityAdded, this);
    }

    gameRestored() {
        /** @type {WirelessManager} */
        const wirelessManager = globalConfig["wirelessManager"];
        wirelessManager.clear();

        for (const entity of this.allEntities) {
            const code = entity.components["WirelessCode"].wirelessCode;
            wirelessManager.addEntity(code, entity);
        }
    }

    /**
     * @param {Entity} entity
     */
    entityAdded(entity) {
        const wirelessCodeComp = entity.components["WirelessCode"];
        if (!wirelessCodeComp) {
            return;
        }

        const code = wirelessCodeComp.wirelessCode;
        if (code == DEFAULTCODE) {
            return;
        }

        globalConfig["wirelessManager"].addEntity(code, entity);
    }

    /**
     * @param {Entity} entity
     */
    entityPlaced(entity) {
        this.channelSignalValue(entity, "");
    }

    /**
     * @param {Entity} entity
     */
    entityDestroyed(entity) {
        const wirelessCodeComp = entity.components["WirelessCode"];
        if (!wirelessCodeComp) {
            return;
        }

        const code = wirelessCodeComp.wirelessCode;
        globalConfig["wirelessManager"].removeEntity(code, entity);
    }

    /**
     * Asks the entity to enter a valid signal code
     * @param {Entity} entity
     * @param {String} oldCode
     */
    channelSignalValue(entity, oldCode) {
        if (!entity.components["WirelessCode"]) {
            return;
        }

        // Ok, query, but also save the uid because it could get stale
        const uid = entity.uid;

        const signalValueInput = new FormElementInput({
            id: "channelValue",
            label: "",
            placeholder: "",
            defaultValue: oldCode,
            validator: () => true,
        });

        const channelDialog = new DialogWithForm({
            app: this.root.app,
            title: "Set Channel",
            desc: "Enter channel name",
            formElements: [signalValueInput],
            buttons: ["cancel:bad:escape", "ok:good:enter"],
            closeButton: false,
        });
        this.root.hud.parts.dialogs.internalShowDialog(channelDialog);

        // When confirmed, set the signal
        const closeHandler = () => {
            if (!this.root || !this.root.entityMgr) {
                // Game got stopped
                return;
            }

            const entityRef = this.root.entityMgr.findByUid(uid, false);
            if (!entityRef) {
                // outdated
                return;
            }

            const constantComp = entityRef.components["WirelessCode"];
            if (!constantComp) {
                // no longer interesting
                return;
            }

            const code = signalValueInput.getValue();
            if (!code) {
                return;
            }

            entity.components["WirelessCode"].wirelessCode = code;
            globalConfig["wirelessManager"].addEntity(code, entity);
        };

        channelDialog.buttonSignals["ok"].add(closeHandler);
        channelDialog.buttonSignals["cancel"].add(closeHandler);
        channelDialog.valueChosen.add(closeHandler);
    }
}
