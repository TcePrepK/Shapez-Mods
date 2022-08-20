import { FunctionPreview } from "./functionPreview";

export class FunctionPreviewManager {
    constructor() {
        /** @type {Map<String, FunctionPreview} */
        this.idToPreview = new Map();
    }

    setApp(app) {
        this.app = app;
    }

    getPreviewById(id) {
        const preview = this.idToPreview.get(id);
        if (!preview) {
            return this.createNewPreview(id);
        }

        return preview;
    }

    /**
     * @param {String} id
     */
    createNewPreview(id) {
        const functionData = this.app.functionMgr.getFunctionById(id);
        const functionPreview = new FunctionPreview(this.app, functionData);
        functionPreview.initialize();

        this.idToPreview.set(functionData.metaDataRef.internalId, functionPreview);

        return functionPreview;
    }
}
