// @ts-nocheck
import { globalConfig, THIRDPARTY_URLS } from "shapez/core/config";
import { DialogWithForm } from "shapez/core/modal_dialog_elements";
import { FormElementInput, FormElementItemChooser } from "shapez/core/modal_dialog_forms";
import { fillInLinkIntoTranslation } from "shapez/core/utils";
import { HUDConstantSignalEdit } from "shapez/game/hud/parts/constant_signal_edit";
import { COLOR_ITEM_SINGLETONS } from "shapez/game/items/color_item";
import { T } from "shapez/translations";

export const e = 2.71828182846;
export const pi = 3.14159265359;

export function patchConstant(modInterface) {
    const numberManager = globalConfig["numberManager"];

    modInterface.replaceMethod(
        HUDConstantSignalEdit,
        "parseSignalCode",
        function ($original, [entity, code]) {
            if (code == "e") {
                return numberManager.getItem(e);
            } else if (code == "pi") {
                return numberManager.getItem(pi);
            }

            const number = Number(code);
            if (!isNaN(number)) {
                return numberManager.getItem(number);
            }

            const result = $original(entity, code);
            if (result) {
                return result;
            }

            return null;
        }
    );

    modInterface.replaceMethod(
        HUDConstantSignalEdit,
        "editConstantSignal",
        function ($original, [entity, { deleteOnCancel = true }]) {
            if (!entity.components.ConstantSignal) {
                return;
            }

            // Ok, query, but also save the uid because it could get stale
            const uid = entity.uid;

            const signal = entity.components.ConstantSignal.signal;
            const signalValueInput = new FormElementInput({
                id: "signalValue",
                label: fillInLinkIntoTranslation(
                    T.dialogs.editSignal.descShortKey,
                    THIRDPARTY_URLS.shapeViewer
                ),
                placeholder: "",
                defaultValue: signal ? signal.getAsCopyableKey() : "",
                validator: val => this.parseSignalCode(entity, val),
            });

            const items = [...Object.values(COLOR_ITEM_SINGLETONS)];

            if (!entity.components.WiredPins) {
                // producer which can produce virtually anything
                const shapes = ["CuCuCuCu", "RuRuRuRu", "WuWuWuWu", "SuSuSuSu"];
                items.unshift(
                    ...shapes.reverse().map(key => this.root.shapeDefinitionMgr.getShapeItemFromShortKey(key))
                );
            }

            if (this.root.gameMode.hasHub()) {
                items.push(
                    this.root.shapeDefinitionMgr.getShapeItemFromDefinition(
                        this.root.hubGoals.currentGoal.definition
                    )
                );
            }

            if (this.root.hud.parts["pinnedShapes"]) {
                items.push(
                    ...this.root.hud.parts["pinnedShapes"].pinnedShapes.map(key =>
                        this.root.shapeDefinitionMgr.getShapeItemFromShortKey(key)
                    )
                );
            }

            const itemInput = new FormElementItemChooser({
                id: "signalItem",
                label: null,
                items,
            });

            const dialog = new DialogWithForm({
                app: this.root.app,
                title: T.dialogs.editConstantProducer.title,
                desc: T.dialogs.editSignal.descItems,
                formElements: [itemInput, signalValueInput],
                buttons: ["cancel:bad:escape", "ok:good:enter"],
                closeButton: false,
            });
            this.root.hud.parts.dialogs.internalShowDialog(dialog);

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

                const constantComp = entityRef.components.ConstantSignal;
                if (!constantComp) {
                    // no longer interesting
                    return;
                }

                if (itemInput.chosenItem) {
                    constantComp.signal = itemInput.chosenItem;
                } else {
                    constantComp.signal = this.parseSignalCode(entity, signalValueInput.getValue());
                }
            };

            dialog.buttonSignals["ok"].add(() => {
                closeHandler();
            });
            dialog.valueChosen.add(() => {
                dialog.closeRequested.dispatch();
                closeHandler();
            });

            // When cancelled, destroy the entity again
            if (deleteOnCancel) {
                dialog.buttonSignals["cancel"].add(() => {
                    if (!this.root || !this.root.entityMgr) {
                        // Game got stopped
                        return;
                    }

                    const entityRef = this.root.entityMgr.findByUid(uid, false);
                    if (!entityRef) {
                        // outdated
                        return;
                    }

                    const constantComp = entityRef.components.ConstantSignal;
                    if (!constantComp) {
                        // no longer interesting
                        return;
                    }

                    this.root.logic.tryDeleteBuilding(entityRef);
                });
            }
        }
    );
}
