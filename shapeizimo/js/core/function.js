import { Application } from "shapez/application";
import { ExplainedResult } from "shapez/core/explained_result";
import { createLogger } from "shapez/core/logging";
import { ReadWriteProxy } from "shapez/core/read_write_proxy";
import { GameRoot } from "shapez/game/root";
import { Savegame } from "shapez/savegame/savegame";
import { BaseSavegameInterface } from "shapez/savegame/savegame_interface";
import { savegameInterfaces } from "shapez/savegame/savegame_interface_registry";
import { FunctionSerializer } from "./functionSerializer";

const logger = createLogger("function");

/**
 * @typedef {import("./utils").FunctionMetadata} FunctionMetadata
 */

export class FunctionData extends ReadWriteProxy {
    /**
     * @param {Application} app
     * @param {FunctionMetadata} metaData
     */
    constructor(app, metaData) {
        super(app, "function-" + metaData.internalId + ".bin");

        /** @type {FunctionMetadata} */
        this.metaDataRef = metaData;

        this.currentData = this.getDefaultData();
    }

    //////// RW Proxy Impl //////////

    /**
     * @returns {number}
     */
    static getCurrentVersion() {
        return 1010;
    }

    /**
     * @returns {typeof BaseSavegameInterface}
     */
    static getReaderClass() {
        return savegameInterfaces[Savegame.getCurrentVersion()];
    }

    /**
     * @returns {number}
     */
    getCurrentVersion() {
        return /** @type {typeof Savegame} */ (this.constructor).getCurrentVersion();
    }

    // /**
    //  * Returns the savegames default data
    //  * @returns {SavegameData}
    //  */
    getDefaultData() {
        return {
            version: this.getCurrentVersion(),
            dump: /** @type {import("./utils").SerializedFunctionData} */ (null),
            lastUpdate: Date.now(),
        };
    }

    migrate(data) {
        return ExplainedResult.good();
    }

    verify(data) {
        return ExplainedResult.good();
    }

    //////// Subclasses interface  ////////

    /**
     * Returns if this game can be saved on disc
     * @returns {boolean}
     */
    isSaveable() {
        return true;
    }

    /**
     * Returns the *real* last update of the savegame, not the one of the metadata
     * which could also be the servers one
     */
    getRealLastUpdate() {
        return this.currentData.lastUpdate;
    }

    /**
     * Returns if this game has a serialized game dump
     */
    hasGameDump() {
        return !!this.currentData.dump && this.currentData.dump.entities.length > 0;
    }

    /**
     * Returns the current game dump
     * @returns {import("./utils").SerializedFunctionData}
     */
    getCurrentDump() {
        return this.currentData.dump;
    }

    /**
     * Returns a reader to access the data
     * @returns {BaseSavegameInterface}
     */
    getDumpReader() {
        if (!this.currentData.dump) {
            logger.warn("Getting reader on null-savegame dump");
        }

        const cls = /** @type {typeof Savegame} */ (this.constructor).getReaderClass();
        return new cls(this.currentData);
    }

    ///////// Public Interface ///////////

    /**
     * Updates the last update field so we can send the savegame to the server,
     * WITHOUT Saving!
     */
    setLastUpdate(time) {
        this.currentData.lastUpdate = time;
    }

    /**
     *
     * @param {GameRoot} root
     */
    updateData(root) {
        // Construct a new serializer
        const serializer = new FunctionSerializer();

        // let timer = performance.now();
        const dump = serializer.generateDumpFromGameRoot(root);
        if (!dump) {
            return false;
        }

        const shadowData = Object.assign({}, this.currentData);
        shadowData.dump = dump;
        shadowData.lastUpdate = new Date().getTime();
        shadowData.name = this.currentData.name || "unnamed";

        // Save data
        this.currentData = shadowData;
    }

    /**
     * Writes the function as well as its metadata
     */
    writeFunctionAndMetadata() {
        return this.writeAsync().then(() => this.saveMetadata());
    }

    /**
     * Updates the savegames metadata
     */
    saveMetadata() {
        this.metaDataRef.lastUpdate = new Date().getTime();

        return this.app.functionMgr.writeAsync();
    }
}
