import { Application } from "shapez/application";
import { ExplainedResult } from "shapez/core/explained_result";
import { createLogger } from "shapez/core/logging";
import { ReadWriteProxy } from "shapez/core/read_write_proxy";
import { FunctionData } from "./function";

const logger = createLogger("function_manager");

/**
 * @typedef {import("./utils").FunctionMetadata} FunctionMetadata
 */

export class FunctionManager extends ReadWriteProxy {
    /**
     * @param {Application} app
     */
    constructor(app) {
        super(app, "functions.bin");

        this.currentData = this.getDefaultData();
    }

    getDefaultData() {
        return {
            version: this.getCurrentVersion(),
            /** @type {Array<FunctionMetadata>} */
            functions: [],
        };
    }

    getCurrentVersion() {
        return 1;
    }

    verify(data) {
        // @TODO
        return ExplainedResult.good();
    }

    migrate(data) {
        return ExplainedResult.good();
    }

    getFunctionsMetaData() {
        return this.currentData.functions;
    }

    /**
     * Returns a given games metadata by id
     * @param {String} id
     * @returns {FunctionMetadata}
     */
    getFunctionMetaDataByInternalId(id) {
        const metaData = this.currentData.functions.find(f => f.internalId === id);
        if (!metaData) {
            throw new Error(`Function with internalId ${id} not found`);
        }

        return metaData;
    }

    /**
     *
     * @param {String} internalId
     * @returns {FunctionData}
     */
    getFunctionById(internalId) {
        const metaData = this.getFunctionMetaDataByInternalId(internalId);
        if (!metaData) {
            return null;
        }

        return new FunctionData(this.app, metaData);
    }

    /**
     * Deletes a function
     * @param {FunctionMetadata} metaData
     */
    deleteFunction(metaData) {
        const functionData = new FunctionData(this.app, metaData);

        return functionData.deleteAsync().then(() => {
            this.currentData.functions.splice(this.currentData.functions.indexOf(metaData), 1);
            return this.writeAsync();
        });
    }

    /**
     * @returns {FunctionData}
     */
    createNewFunction() {
        const id = this.generateInternalId();

        const metaData = /** @type {FunctionMetadata} */ ({
            lastUpdate: Date.now(),
            internalId: id,
            starred: false,
        });

        const functionData = new FunctionData(this.app, metaData);

        this.currentData.functions.push(metaData);

        this.updateAfterFunctionChanged();

        return functionData;
    }

    /**
     * Attempts to import a savegame
     * @param {object} data
     */
    importFunction(data) {
        const savegame = this.createNewFunction();

        // Track legacy savegames
        const isOldSavegame = data.version < 1006;

        const migrationResult = savegame.migrate(data);
        if (migrationResult.isBad()) {
            return Promise.reject("Failed to migrate: " + migrationResult.reason);
        }

        savegame.currentData = data;
        const verification = savegame.verify(data);
        if (verification.isBad()) {
            return Promise.reject("Verification failed: " + verification.result);
        }

        return savegame
            .writeFunctionAndMetadata()
            .then(() => this.updateAfterFunctionChanged())
            .then(() => this.app.restrictionMgr.onHasLegacySavegamesChanged(isOldSavegame));
    }

    /**
     * Hook after the function got changed
     */
    updateAfterFunctionChanged() {
        return this.sortFunctions().then(() => this.writeAsync());
    }

    /**
     * Sorts all functions by their creation time descending
     * @returns {Promise<any>}
     */
    sortFunctions() {
        this.currentData.functions.sort((a, b) => b.lastUpdate - a.lastUpdate);
        let promiseChain = Promise.resolve();
        while (this.currentData.functions.length > 30) {
            const toRemove = this.currentData.functions.pop();

            const functionData = new FunctionData(this.app, toRemove);
            promiseChain = promiseChain
                .then(() => functionData.deleteAsync())
                .then(() => {
                    this.currentData.functions.splice(this.currentData.functions.indexOf(toRemove), 1);
                })
                .then(
                    () => {},
                    err => {
                        logger.error(this, "Failed to remove old savegame:", toRemove, ":", err);
                    }
                );
        }

        return promiseChain;
    }

    /**
     * Helper method to generate a new internal function id using savegame manager
     */
    generateInternalId() {
        return this.app.savegameMgr.generateInternalId();
    }

    // End

    initialize() {
        // First read, then directly write to ensure we have the latest data
        // @ts-ignore
        return this.readAsync().then(() => {
            return this.updateAfterFunctionChanged();
        });
    }
}
