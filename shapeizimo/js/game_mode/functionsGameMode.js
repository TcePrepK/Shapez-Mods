import { APPLICATION_ERROR_OCCURED } from "shapez/core/error_handler";
import { createLogger } from "shapez/core/logging";
import { Rectangle } from "shapez/core/rectangle";
import { MetaConstantProducerBuilding } from "shapez/game/buildings/constant_producer";
import { MetaGoalAcceptorBuilding } from "shapez/game/buildings/goal_acceptor";
import { MetaItemProducerBuilding } from "shapez/game/buildings/item_producer";
import { GameMode } from "shapez/game/game_mode";
import { HUDConstantSignalEdit } from "shapez/game/hud/parts/constant_signal_edit";
import { HUDLayerPreview } from "shapez/game/hud/parts/layer_preview";
import { HUDLeverToggle } from "shapez/game/hud/parts/lever_toggle";
import { HUDMassSelector } from "shapez/game/hud/parts/mass_selector";
import { HUDScreenshotExporter } from "shapez/game/hud/parts/screenshot_exporter";
import { HUDWaypoints } from "shapez/game/hud/parts/waypoints";
import { HUDWiresOverlay } from "shapez/game/hud/parts/wires_overlay";
import { HUDWiresToolbar } from "shapez/game/hud/parts/wires_toolbar";
import { HUDWireInfo } from "shapez/game/hud/parts/wire_info";
import { GameRoot } from "shapez/game/root";
import { types } from "shapez/savegame/serialization";
import { T } from "shapez/translations";
import { FunctionData } from "../core/function";
import { FunctionSerializer } from "../core/functionSerializer";
import { functionsGameModeId, functionsGameModeType, functionsMenuStateId } from "../core/utils";
import { HUDFunctionBackToMenu } from "../huds/functionBackToMenu";
import { HUDFunctionEditorControls } from "../huds/functionEditorControls";
import { HUDFunctionEditorReview } from "../huds/functionEditorReview";
import { HUDFunctionEditorSettings } from "../huds/functionEditorSettings";

const logger = createLogger("function/load");

// @ts-ignore
export class FunctionsGameMode extends GameMode {
    static getId() {
        return functionsGameModeId;
    }

    static getType() {
        return functionsGameModeType;
    }

    /** @returns {object} */
    static getSchema() {
        return {
            zoneHeight: types.uint,
            zoneWidth: types.uint,
        };
    }

    /**
     * @param {GameRoot} root
     * @param {object} payload
     * @param {FunctionData} payload.functionData
     * */
    constructor(root, { functionData }) {
        super(root);

        this.additionalHudParts = {
            functionBackToMenu: HUDFunctionBackToMenu,
            functionEditorControls: HUDFunctionEditorControls,
            functionEditorReview: HUDFunctionEditorReview,
            functionEditorSettings: HUDFunctionEditorSettings,
            // puzzleDlcLogo: HUDPuzzleDLCLogo,
            // massSelector: HUDMassSelector,

            wiresToolbar: HUDWiresToolbar,
            massSelector: HUDMassSelector,
            waypoints: HUDWaypoints,
            wireInfo: HUDWireInfo,
            leverToggle: HUDLeverToggle,
            screenshotExporter: HUDScreenshotExporter,
            wiresOverlay: HUDWiresOverlay,
            layerPreview: HUDLayerPreview,
            constantSignalEdit: HUDConstantSignalEdit,
        };

        this.hiddenBuildings = [
            MetaItemProducerBuilding,
            MetaConstantProducerBuilding,
            MetaGoalAcceptorBuilding,
        ];

        this.functionData = functionData;
        root.signals.postLoadHook.add(this.loadFunction, this);

        this.zoneWidth = 10;
        this.zoneHeight = 10;
    }

    loadFunction() {
        let errorText;
        logger.log("Loading function", this.functionData);

        const dump = this.getSaveData();
        if (!dump) {
            return;
        }

        try {
            this.zoneWidth = dump.bounds.w;
            this.zoneHeight = dump.bounds.h;
            const status = new FunctionSerializer().deserializeFunction(this.root, dump);
            if (!status.isGood()) {
                errorText = status.reason;
            }
        } catch (ex) {
            errorText = ex.message || ex;
        }

        if (errorText) {
            this.root.gameState.moveToState(functionsMenuStateId, {
                error: {
                    title: T.dialogs.puzzleLoadError.title,
                    desc: T.dialogs.puzzleLoadError.desc + " " + errorText,
                },
            });
        }

        // try {
        //     const status = serializer.deserialize(this.root.savegame.getCurrentDump(), this.root);
        //     if (!status.isGood()) {
        //         logger.error("savegame-deserialize-failed:" + status.reason);
        //         return false;
        //     }
        // } catch (ex) {
        //     logger.error("Exception during deserialization:", ex);
        //     return false;
        // }
    }

    /**
     * Saves the game
     */
    doSave() {
        if (!this.functionData) {
            return Promise.resolve();
        }

        const core = this.root.gameState.core;
        if (!core) {
            return Promise.resolve();
        }

        if (APPLICATION_ERROR_OCCURED) {
            logger.warn("Skipping save because application crashed");
            return Promise.resolve();
        }

        if (this.currentSavePromise) {
            logger.warn("Skipping double save and returning same promise");
            return this.currentSavePromise;
        }

        logger.log("Starting to save function ...");
        this.functionData.updateData(core.root);

        this.currentSavePromise = this.functionData
            .writeFunctionAndMetadata()
            .catch(err => {
                // Catch errors
                logger.warn("Failed to save:", err);
            })
            .then(() => {
                // Clear promise
                logger.log("Saved!");
                core.root.signals.gameSaved.dispatch();
                this.currentSavePromise = null;
            });
        return this.currentSavePromise;
    }

    getSaveData() {
        return this.functionData?.currentData?.dump;
    }

    getCameraBounds() {
        return Rectangle.centered(this.zoneWidth + 20, this.zoneHeight + 20);
    }

    getBuildableZones() {
        return [new Rectangle(0, 0, this.zoneWidth, this.zoneHeight)];
    }

    hasHub() {
        return false;
    }

    hasResources() {
        return false;
    }

    getMinimumZoom() {
        return 1;
    }

    getMaximumZoom() {
        return 4;
    }

    getIsSaveable() {
        return false;
    }

    getHasFreeCopyPaste() {
        return true;
    }

    throughputDoesNotMatter() {
        return true;
    }

    getSupportsWires() {
        return true;
    }

    getFixedTickrate() {
        return 300;
    }

    /** @returns {boolean} */
    getIsFreeplayAvailable() {
        return true;
    }

    // getIsEditor() {
    //     return true;
    // }
}
