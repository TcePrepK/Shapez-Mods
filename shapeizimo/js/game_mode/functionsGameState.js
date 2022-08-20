import { DrawParameters } from "shapez/core/draw_parameters";
import { DialogWithForm } from "shapez/core/modal_dialog_elements";
import { FormElementInput } from "shapez/core/modal_dialog_forms";
import { ReadWriteProxy } from "shapez/core/read_write_proxy";
import { Rectangle } from "shapez/core/rectangle";
import { TextualGameState } from "shapez/core/textual_game_state";
import { generateFileDownload, makeButton, makeDiv } from "shapez/core/utils";
import { Vector } from "shapez/core/vector";
import { EntityManager } from "shapez/game/entity_manager";
import { GameMode } from "shapez/game/game_mode";
import { GameSystemManager } from "shapez/game/game_system_manager";
import { HubGoals } from "shapez/game/hub_goals";
import { MapView } from "shapez/game/map_view";
import { GameRoot } from "shapez/game/root";
import { ShapeDefinitionManager } from "shapez/game/shape_definition_manager";
import { GameTime } from "shapez/game/time/game_time";
import { MUSIC } from "shapez/platform/sound";
import { Savegame } from "shapez/savegame/savegame";
import { SerializerInternal } from "shapez/savegame/serializer_internal";
import { T } from "shapez/translations";
import { FunctionData } from "../core/function";
import { FunctionPreview } from "../core/functionPreview";
import { FunctionPreviewManager } from "../core/functionPreviewManager";
import { functionsGameModeId, functionsMenuStateId } from "../core/utils";

/**
 * @typedef {import("../core/utils").FunctionMetadata} FunctionMetadata
 */

const lastSearchOptions = {
    searchTerm: "",
    onlyStarred: false,
};

export class FunctionMenuState extends TextualGameState {
    constructor() {
        super(functionsMenuStateId);

        this.functionPreviewManager = new FunctionPreviewManager();
    }

    // @ts-ignore
    getThemeMusic() {
        return MUSIC.theme;
    }

    getStateHeaderTitle() {
        return "Functions";
    }

    /**
     * Overrides the GameState implementation to provide our own html
     * @ts-ignore */
    internalGetFullHtml() {
        let headerHtml = `
            <div class="headerBar">
                <h1><button class="backButton"></button> ${this.getStateHeaderTitle()}</h1>

                <div class="actions">
                    <button class="styledButton importFunction">${"Import"}</button>
                    <button class="styledButton createFunction">+ ${"Create Function"}</button>
                </div>

            </div>`;

        return `
            ${headerHtml}
            <div class="container">
                    ${this.getInnerHTML()}
            </div>
        `;
    }

    getMainContentHTML() {
        let html = `
                <div class="functions" id="mainContainer"></div>
        `;

        return html;
    }

    renderSearchForm(parent) {
        const container = document.createElement("form");
        container.classList.add("searchForm");

        // Search
        const searchField = document.createElement("input");
        searchField.value = lastSearchOptions.searchTerm;
        searchField.classList.add("search");
        searchField.setAttribute("type", "text");
        searchField.setAttribute("placeholder", T.puzzleMenu.search.placeholder);
        searchField.addEventListener("input", () => {
            lastSearchOptions.searchTerm = searchField.value.trim();
        });
        container.appendChild(searchField);

        // Include starred
        const labelStarred = document.createElement("label");
        labelStarred.classList.add("filterStarred");

        const inputStarred = document.createElement("input");
        inputStarred.setAttribute("type", "checkbox");

        if (lastSearchOptions.onlyStarred) {
            inputStarred.setAttribute("checked", "checked");
        }

        inputStarred.addEventListener("change", () => {
            lastSearchOptions.onlyStarred = inputStarred.checked;
        });

        labelStarred.appendChild(inputStarred);

        container.appendChild(labelStarred);

        parent.appendChild(container);
    }

    startSearch() {
        const container = this.htmlElement.querySelector("#mainContainer");
        while (container.firstChild) {
            container.removeChild(container.firstChild);
        }

        const loadingElement = document.createElement("div");
        loadingElement.classList.add("loader");
        loadingElement.innerText = T.global.loading + "...";
        container.appendChild(loadingElement);

        // const functions = this.getTargetFunctions(lastSearchOptions.onlyStarred);

        // this.asyncChannel
        //     .watch(this.app.clientApi.apiSearchPuzzles(lastSearchOptions))
        //     .then(
        //         puzzles => this.renderPuzzles(puzzles),
        //         error => {
        //             this.dialogs.showWarning(
        //                 T.dialogs.puzzleLoadFailed.title,
        //                 T.dialogs.puzzleLoadFailed.desc + " " + error
        //             );
        //             this.renderPuzzles([]);
        //         }
        //     )
        //     .then(() => (this.loading = false));
    }

    get savedFunctions() {
        return this.app.functionMgr.getFunctionsMetaData();
    }

    /**
     * @param {Boolean} starredFilter
     */
    renderFunctions(starredFilter) {
        const container = this.htmlElement.querySelector("#mainContainer");
        while (container.firstChild) {
            container.removeChild(container.firstChild);
        }

        /** @type {Array<FunctionMetadata>} */
        let functions = [];
        if (!starredFilter) {
            functions = this.savedFunctions;
        }

        for (const func of functions) {
            const elem = document.createElement("div");
            elem.classList.add("function");
            elem.setAttribute("data-function-id", String(func.internalId));

            // Name
            const title = document.createElement("div");
            title.classList.add("title");

            const name = makeDiv(
                elem,
                null,
                ["name"],
                "<span>" + (func.name ? func.name : T.mainMenu.savegameUnnamed) + "</span>"
            );
            elem.appendChild(name);
            // Name

            // Preview
            const functionPreview = this.functionPreviewManager.getPreviewById(func.internalId);
            functionPreview.drawCanvas();

            // const id = shapez.THEME == THEMES.dark ? "dark" : "light";
            // shapez.THEME = THEMES.light;
            // shapez.THEME = THEMES[id];

            const canvas = functionPreview.previewCanvas;
            elem.appendChild(canvas);
            // Preview

            // Buttons
            const buttons = document.createElement("div");
            buttons.classList.add("buttons");
            elem.appendChild(buttons);

            this.trackClicks(makeButton(buttons, ["styledButton", "renameGame"]), () =>
                this.requestRenameFunction(func)
            );

            this.trackClicks(
                makeButton(buttons, ["styledButton", "deleteGame"]),
                () => {
                    this.deleteFunction(func);
                },
                {
                    consumeEvents: true,
                    preventClick: true,
                    preventDefault: true,
                }
            );

            this.trackClicks(makeButton(buttons, ["styledButton", "downloadGame"]), () =>
                this.downloadGame(func)
            );
            // Buttons

            container.appendChild(elem);
            this.trackClicks(elem, () => this.editFunction(func));
        }

        if (functions.length === 0) {
            const elem = document.createElement("div");
            elem.classList.add("empty");
            elem.innerText = T.puzzleMenu.noPuzzles;
            container.appendChild(elem);
        }
    }

    // @ts-ignore
    onEnter(payload) {
        if (payload && payload.error) {
            this.dialogs.showWarning(payload.error.title, payload.error.desc);
        }

        this.trackClicks(this.htmlElement.querySelector("button.createFunction"), () =>
            this.createNewFunction()
        );

        this.functionPreviewManager.setApp(this.app);
        this.renderFunctions(false);

        // this.trackClicks(this.htmlElement.querySelector("button.loadPuzzle"), () => this.loadPuzzle());
    }

    // loadFunction() {
    //     const shortKeyInput = new FormElementInput({
    //         id: "shortKey",
    //         label: null,
    //         placeholder: "",
    //         defaultValue: "",
    //         validator: val => ShapeDefinition.isValidShortKey(val) || val.startsWith("/"),
    //     });

    //     const dialog = new DialogWithForm({
    //         app: this.app,
    //         title: T.dialogs.puzzleLoadShortKey.title,
    //         desc: T.dialogs.puzzleLoadShortKey.desc,
    //         formElements: [shortKeyInput],
    //         buttons: ["ok:good:enter"],
    //     });
    //     this.dialogs.internalShowDialog(dialog);

    //     dialog.buttonSignals.ok.add(() => {
    //         const searchTerm = shortKeyInput.getValue();

    //         if (searchTerm === "/apikey") {
    //             alert("Your api key is: " + this.app.clientApi.token);
    //             return;
    //         }

    //         const closeLoading = this.dialogs.showLoadingDialog();

    //         this.app.clientApi.apiDownloadPuzzleByKey(searchTerm).then(
    //             puzzle => {
    //                 closeLoading();
    //                 this.startLoadedPuzzle(puzzle);
    //             },
    //             err => {
    //                 closeLoading();
    //                 this.dialogs.showWarning(
    //                     T.dialogs.puzzleDownloadError.title,
    //                     T.dialogs.puzzleDownloadError.desc + " " + err
    //                 );
    //             }
    //         );
    //     });
    // }

    createNewSavefile() {
        return new Savegame(this.app, {
            internalId: "function",
            metaDataRef: {
                internalId: "function",
                lastUpdate: 0,
                version: 0,
                level: 0,
                name: "function",
            },
        });
    }

    createNewFunction() {
        const savegame = this.createNewSavefile();
        const functionData = this.app.functionMgr.createNewFunction();
        this.moveToState("InGameState", {
            gameModeId: functionsGameModeId,
            gameModeParameters: {
                functionData,
            },
            savegame,
        });
    }

    /**
     *
     * @param {FunctionMetadata} func
     */
    editFunction(func) {
        const savegame = this.createNewSavefile();
        const functionData = this.app.functionMgr.getFunctionById(func.internalId);
        functionData.readAsync().then(() => {
            this.moveToState("InGameState", {
                gameModeId: functionsGameModeId,
                gameModeParameters: {
                    functionData,
                },
                savegame,
            });
        });
    }

    /**
     * @param {FunctionMetadata} game
     */
    requestRenameFunction(game) {
        const nameInput = new FormElementInput({
            id: "nameInput",
            label: null,
            placeholder: "",
            defaultValue: game.name || "",
            validator: val => val.length <= 32,
        });

        const dialog = new DialogWithForm({
            app: this.app,
            title: T.dialogs.renameSavegame.title,
            desc: T.dialogs.renameSavegame.desc,
            formElements: [nameInput],
            buttons: ["cancel:bad:escape", "ok:good:enter"],
        });

        this.dialogs.internalShowDialog(dialog);

        // @ts-ignore When confirmed, save the name
        dialog.buttonSignals.ok.add(() => {
            game.lastUpdate = Date.now();
            game.name = nameInput.getValue();
            this.app.functionMgr.updateAfterFunctionChanged().then(() => {
                this.renderFunctions(false);
            });
        });
    }

    /**
     * @param {FunctionMetadata} func
     */
    deleteFunction(func) {
        this.app.analytics.trackUiClick("delete_game");

        const signals = this.dialogs.showWarning(
            T.dialogs.confirmSavegameDelete.title,
            T.dialogs.confirmSavegameDelete.text.replace(
                "<savegameName>",
                func.name || T.mainMenu.savegameUnnamed
            ),
            ["cancel:good", "delete:bad:timeout"]
        );

        signals["delete"].add(() => {
            this.app.functionMgr.deleteFunction(func).then(
                () => {
                    this.renderFunctions(false);
                },
                err => {
                    this.dialogs.showWarning(
                        T.dialogs.savegameDeletionError.title,
                        T.dialogs.savegameDeletionError.text + "<br><br>" + err
                    );
                }
            );
        });
    }

    /**
     * @param {FunctionMetadata} func
     */
    downloadGame(func) {
        this.app.analytics.trackUiClick("download_game");

        const functionData = this.app.functionMgr.getFunctionById(func.internalId);
        functionData.readAsync().then(() => {
            const data = ReadWriteProxy.serializeObject(functionData.currentData);
            const filename = (func.name || "unnamed") + ".bin";
            // generateFileDownload(filename, data);
        });
    }
}
