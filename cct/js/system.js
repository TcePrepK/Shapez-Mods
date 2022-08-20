import { globalConfig } from "shapez/core/config";
import { DrawParameters } from "shapez/core/draw_parameters";
import { DialogWithForm } from "shapez/core/modal_dialog_elements";
import { Vector } from "shapez/core/vector";
import { enumMouseButton } from "shapez/game/camera";
import { Entity } from "shapez/game/entity";
import { GameSystemWithFilter } from "shapez/game/game_system_with_filter";
import { BOOL_TRUE_SINGLETON } from "shapez/game/items/boolean_item";
import { MapChunk } from "shapez/game/map_chunk";
import { enumCommands } from "./commands";
import { CCTComponent } from "./component";
import { FormCommandInput } from "./formInput";

export class CCTSystem extends GameSystemWithFilter {
    constructor(root) {
        super(root, [CCTComponent]);

        this.root.signals.entityManuallyPlaced.add(entity => this.editCommandController(entity));

        this.variables = {};

        // TODO: Remove this
        this.root.camera.downPreHandler.add(this.downPreHandler, this);

        globalConfig["root"] = root;
    }

    /**
     * Asks the entity to enter a valid signal code
     * @param {Entity} entity
     */
    editCommandController(entity, oldCommand = "") {
        if (!entity.components["CommandController"]) {
            return;
        }

        globalConfig["editingCCT"] = true;

        // Ok, query, but also save the uid because it could get stale
        const uid = entity.uid;

        const signalValueInput = new FormCommandInput({
            id: "signalValue",
            placeholder: "console.log('HelloWorld')",
            defaultValue: oldCommand,
        });

        const dialog = new DialogWithForm({
            app: this.root.app,
            title: "",
            desc: "",
            formElements: [signalValueInput],
            buttons: ["ok:good"],
            closeButton: false,
        });

        dialog.inputReciever.keydown.removeAll();
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

            const controllerComp = this.root.entityMgr.findByUid(uid, false).components["CommandController"];

            controllerComp.command = signalValueInput.getValue();
            globalConfig["editingCCT"] = false;
        };

        dialog.buttonSignals["ok"].add(closeHandler);
        dialog.valueChosen.add(closeHandler);
    }

    /**
     * @param {DrawParameters} parameters
     * @param {MapChunk} chunk
     */
    drawChunk(parameters, chunk) {
        this.parameters = parameters;

        const contents = chunk.containedEntitiesByLayer.regular;
        for (let i = 0; i < contents.length; ++i) {
            const entity = contents[i];
            if (entity && entity.components["CommandController"]) {
                const error = entity.components["CommandController"].error;
                if (error.lifeSpan > 0) {
                    const ctx = parameters.context;
                    const origin = entity.components.StaticMapEntity.origin
                        .copy()
                        .multiplyScalar(32)
                        .addScalars(32 * 1.5, 32 * 1.5 - 5)
                        .addScalars(0, error.lifeSpan);
                    ctx.font = "15px Sans-serif";
                    ctx.lineWidth = 1;
                    ctx.miterLimit = 2;
                    ctx.textAlign = "center";

                    ctx.globalAlpha = error.lifeSpan / 10;

                    ctx.strokeStyle = "black";
                    ctx.strokeText(error.msg, origin.x, origin.y);
                    ctx.fillStyle = "white";
                    ctx.fillText(error.msg, origin.x, origin.y);

                    error.lifeSpan -= 0.2;
                    ctx.globalAlpha = 1;
                }

                this.updateCCT(entity);
            }
        }
    }

    /**
     * @param {string} val
     */
    getFunction(val) {
        return new Function(
            `{${Object.keys(enumCommands)}}, root, ctx, globalConfig, variables, Vector, entity`,
            val
        );
    }

    updateCCT(entity) {
        const controllerComp = entity.components.CommandController;
        const command = controllerComp.command;
        const wirePins = entity.components.WiredPins;
        let status = false;
        for (let j = 0; j < wirePins.slots.length; ++j) {
            const slot = wirePins.slots[j];
            const network = slot.linkedNetwork;
            if (network) {
                const item = network.currentValue;
                if (item === BOOL_TRUE_SINGLETON) {
                    status = true;
                }
            }
        }

        if (status) {
            try {
                this.getFunction(command)(
                    enumCommands,
                    this.root,
                    this.parameters.context,
                    globalConfig,
                    this.variables,
                    Vector,
                    entity
                );
            } catch (error) {
                if (error instanceof Error) {
                    // console.log(error.message);

                    if (controllerComp.error.lifeSpan <= 0) {
                        controllerComp.error.msg = error.message;
                        controllerComp.error.lifeSpan = 10;
                    }

                    return;
                }
            }
        }
    }

    /**
     * @param {Vector} pos
     * @param {enumMouseButton} button
     */
    downPreHandler(pos, button) {
        if (button != enumMouseButton.left) {
            return;
        }

        const tile = this.root.camera.screenToWorld(pos).toTileSpace();
        const contents = this.root.map.getLayerContentXY(tile.x, tile.y, "regular");
        if (!contents) {
            return;
        }

        const commandControllerComp = contents.components["CommandController"];
        if (!commandControllerComp) {
            return;
        }

        const oldCommand = commandControllerComp.command;
        this.root.systemMgr.systems["CommandControllerSystem"].editCommandController(contents, oldCommand);
        return "stop_propagation";
    }
}
