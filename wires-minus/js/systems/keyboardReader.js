import { globalConfig } from "shapez/core/config";
import { DrawParameters } from "shapez/core/draw_parameters";
import { Dialog } from "shapez/core/modal_dialog_elements";
import { STOP_PROPAGATION } from "shapez/core/signal";
import { enumMouseButton } from "shapez/game/camera";
import { Entity } from "shapez/game/entity";
import { GameSystemWithFilter } from "shapez/game/game_system_with_filter";
import { enumNotificationType } from "shapez/game/hud/parts/notifications";
import { BOOL_FALSE_SINGLETON, BOOL_TRUE_SINGLETON } from "shapez/game/items/boolean_item";
import { Keybinding, getStringForKeyCode } from "shapez/game/key_action_mapper";
import { MapChunk } from "shapez/game/map_chunk";
import { GameRoot } from "shapez/game/root";
import { SOUNDS } from "shapez/platform/sound";
import { KeyboardReaderComponent } from "../components/keyboardReader";

export const OverrideToggleID = "key_input_override_toggle";

export class KeyboardReaderSystem extends GameSystemWithFilter {
    static getId() {
        return "keyboardReader";
    }

    /**
     * @param {GameRoot} root
     * @returns {KeyboardReaderSystem}
     */
    static get(root) {
        return root.systemMgr.systems[this.getId()];
    }

    constructor(root) {
        super(root, [KeyboardReaderComponent]);

        this.root.signals.postLoadHook.add(this.gameRestored, this);
        this.root.signals.entityManuallyPlaced.add(this.entityPlaced, this);
        this.root.signals.entityDestroyed.add(this.entityDestroyed, this);

        /** @type {Object.<number, number>} */
        this.codeToEntityCount = {};

        /** @type {Function} */
        this.overrideFunction = (() => {
            if (!this.overrideBindings) {
                return;
            }

            return STOP_PROPAGATION;
        }).bind(this);

        /** @type {Boolean} */
        this.overrideBindings = false;

        this.overrideMouseToggle = {
            [enumMouseButton.left]: false,
            [enumMouseButton.middle]: false,
            [enumMouseButton.right]: false,
        };

        this.root.camera.downPreHandler.addToTop((pos, button) => {
            if (!this.overrideBindings) {
                return;
            }

            if (this.overrideMouseToggle[button]) {
                return STOP_PROPAGATION;
            }
        }, this);
    }

    gameRestored() {
        /** @type {Object.<number, Array<string>>} */
        this.codeToID = this.createCodeMap(this.root.keyMapper.keybindings);

        this.codeToEntityCount = {};
        for (const entity of this.allEntities) {
            const keyboardComp = KeyboardReaderComponent.get(entity);

            const code = keyboardComp.assignedKeyCode;
            if (!this.codeToEntityCount[code]) {
                this.codeToEntityCount[code] = 0;
            }

            this.codeToEntityCount[code]++;
            this.fixBinding(code);
        }
    }

    /**
     * @param {Entity} entity
     */
    entityPlaced(entity) {
        this.channelSignalValue(entity);
    }

    /**
     * @param {Entity} entity
     */
    entityDestroyed(entity) {
        const keyboardComp = KeyboardReaderComponent.get(entity);
        if (!keyboardComp) {
            return;
        }

        const code = keyboardComp.assignedKeyCode;
        this.codeToEntityCount[code]--;

        if (this.codeToEntityCount[code] === 0) {
            this.fixBinding(code);
            delete this.codeToEntityCount[code];
        }
    }

    update() {
        const inputManager = this.root.app.inputMgr;
        for (const entity of this.allEntities) {
            const keyboardComp = KeyboardReaderComponent.get(entity);
            keyboardComp.pressing = false;

            const wiredPins = entity.components.WiredPins;
            const pin = wiredPins.slots[0];
            pin.value = BOOL_FALSE_SINGLETON;

            const assignedKeyCode = keyboardComp.assignedKeyCode;
            if (inputManager.keysDown.has(assignedKeyCode)) {
                keyboardComp.pressing = true;
                pin.value = BOOL_TRUE_SINGLETON;
            }
        }
    }

    /**
     * @param {number} keyCode
     */
    fixBinding(keyCode) {
        const entityCount = this.codeToEntityCount[keyCode];
        if (entityCount > 1) {
            return;
        }

        if (keyCode > 0 && keyCode <= 3) {
            this.setupMouseOverride(keyCode, entityCount != 0);
        }

        const ids = this.codeToID[keyCode];
        if (!ids) {
            return;
        }

        for (const id of ids) {
            if (id == OverrideToggleID) {
                continue;
            }

            // @ts-ignore
            const binding = this.root.keyMapper.keybindings[id];
            if (!binding) {
                return;
            }

            if (entityCount == 0) {
                binding.signal.remove(this.overrideFunction);
            } else {
                binding.signal.addToTop(this.overrideFunction);
            }
        }
    }

    /**
     * @param {Entity} entity
     */
    channelSignalValue(entity) {
        const keyboardComp = KeyboardReaderComponent.get(entity);
        if (!keyboardComp) {
            return;
        }

        const dialog = new Dialog({
            app: this.root.app,
            title: "SET KEYBINDING",
            contentHTML: "Press the key or mouse button you want to assign.",
            buttons: ["cancel:good"],
            type: "info",
        });

        dialog.inputReciever.keydown.add(({ keyCode, shift, alt, event }) => {
            if (event) {
                event.preventDefault();
            }

            if (event.target.id == "ingame_Canvas") {
                return;
            }

            if (event.target && event.target.tagName === "BUTTON" && keyCode === 1) {
                return;
            }

            const fancyText = getStringForKeyCode(keyCode);
            const key = fancyText != "[undefined]" ? fancyText : keyCode;
            keyboardComp.assignKey(key, keyCode);
            this.fixBinding(keyCode);

            if (!this.codeToEntityCount[keyCode]) {
                this.codeToEntityCount[keyCode] = 0;
            }

            this.codeToEntityCount[keyCode]++;

            this.root.hud.parts.dialogs.closeDialog(dialog);
        });

        dialog.inputReciever.backButton.add(() => {});
        this.root.hud.parts.dialogs.internalShowDialog(dialog);
        this.root.app.sound.playUiSound(SOUNDS.dialogOk);
    }

    /**
     * @param {Object.<string, Keybinding>} keybindings
     * @returns {Object.<number, Array<string>>}
     */
    createCodeMap(keybindings) {
        /** @type {Object.<number, Array<string>>} */
        const codeToID = {};
        for (const id in keybindings) {
            const code = keybindings[id].keyCode;

            if (!codeToID[code]) {
                codeToID[code] = [];
            }

            codeToID[code].push(id);
        }

        return codeToID;
    }

    /**
     * Draws Text Storked
     * @param {CanvasRenderingContext2D} ctx
     * @param {string} text
     * @param {number} y
     * @param {number} x
     */
    drawStroked(ctx, text, x, y) {
        ctx.lineWidth = 3;
        ctx.strokeText(text, x, y);
        ctx.fillText(text, x, y);
    }

    /**
     * @param {DrawParameters} parameters
     * @param {MapChunk} chunk
     */
    drawChunk(parameters, chunk) {
        const contents = chunk.containedEntitiesByLayer.regular;
        for (let i = 0; i < contents.length; ++i) {
            const entity = contents[i];
            if (!entity) {
                continue;
            }

            const keyboardComp = KeyboardReaderComponent.get(entity);
            if (!keyboardComp) {
                continue;
            }

            const keyText = keyboardComp.assignedKey;
            const tileSize = globalConfig.tileSize;
            const origin = entity.components.StaticMapEntity.origin.addScalar(0.5).multiplyScalar(tileSize);
            const offset = 1.5;
            const shadowOffset = keyText.length == 1 ? 1 : 1 - keyText.length * 0.1;

            const ctx = parameters.context;
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.font = `${keyText.length == 1 ? 17 : 17 - keyText.length * 2}px GameFont`;
            if (!keyboardComp.pressing) {
                ctx.strokeStyle = "#000000";
                ctx.fillStyle = "#000000";
                ctx.globalAlpha = 0.07;
                this.drawStroked(ctx, keyText, origin.x - shadowOffset, origin.y - offset - shadowOffset);
                ctx.globalAlpha = 1;

                ctx.strokeStyle = "#64666e";
                ctx.fillStyle = "#787b83";
                this.drawStroked(ctx, keyText, origin.x, origin.y);

                ctx.strokeStyle = "#686a72";
                ctx.fillStyle = "#91949e";
                this.drawStroked(ctx, keyText, origin.x, origin.y - offset / 2);
            } else {
                ctx.strokeStyle = "#64666e";
                ctx.fillStyle = "#89dd5c";
                this.drawStroked(ctx, keyText, origin.x, origin.y);
            }
        }
    }

    toggleOverride() {
        this.overrideBindings = !this.overrideBindings;

        this.root.hud.signals.notification.dispatch(
            "Override Toggle " + (this.overrideBindings ? "Enabled!" : "Disabled!"),
            enumNotificationType.info
        );
    }

    /**
     * @param {Number} keyCode
     * @param {boolean} override
     */
    setupMouseOverride(keyCode, override) {
        const button =
            keyCode == 1
                ? enumMouseButton.left
                : keyCode == 2
                ? enumMouseButton.middle
                : enumMouseButton.right;

        this.overrideMouseToggle[button] = override;
    }

    /**
     * @param {Number} keyCode
     */
    isAvailableBinding(keyCode) {
        if (!this.overrideBindings) {
            return true;
        }

        const entityCount = this.codeToEntityCount[keyCode];
        return !entityCount || entityCount == 0;
    }
}
