import { Rectangle } from "shapez/core/rectangle";
import { make2DUndefinedArray, makeDiv } from "shapez/core/utils";
import { StaticMapEntityComponent } from "shapez/game/components/static_map_entity";
import { Entity } from "shapez/game/entity";
import { BaseHUDPart } from "shapez/game/hud/base_hud_part";
import { T } from "shapez/translations";

export class HUDFunctionEditorSettings extends BaseHUDPart {
    createElements(parent) {
        this.element = makeDiv(parent, "ingame_HUD_PuzzleEditorSettings");

        if (this.root.gameMode.getBuildableZones()) {
            const bind = (selector, handler) =>
                this.trackClicks(this.element.querySelector(selector), handler);
            this.zone = makeDiv(
                this.element,
                null,
                ["section", "zone"],
                `
                <label>${T.ingame.puzzleEditorSettings.zoneTitle}</label>

                <div class="buttons">
                    <div class="zoneWidth plusMinus">
                        <label>${T.ingame.puzzleEditorSettings.zoneWidth}</label>
                        <button class="styledButton minus">-</button>
                        <span class="value"></span>
                        <button class="styledButton plus">+</button>
                    </div>

                     <div class="zoneHeight plusMinus">
                        <label>${T.ingame.puzzleEditorSettings.zoneHeight}</label>
                        <button class="styledButton minus">-</button>
                        <span class="value"></span>
                        <button class="styledButton plus">+</button>
                    </div>

                    <div class="buttonBar">
                        <button class="styledButton trim">${T.ingame.puzzleEditorSettings.trimZone}</button>
                        <button class="styledButton clearItems">${T.ingame.puzzleEditorSettings.clearItems}</button>
                    </div>

                </div>`
            );

            bind(".zoneWidth .plus", () => this.increaseWidth());
            bind(".zoneWidth .minus", () => this.decreaseWidth());
            bind(".zoneHeight .plus", () => this.increaseHeight());
            bind(".zoneHeight .minus", () => this.decreaseHeight());
            bind("button.trim", this.trim);
            bind("button.clearItems", this.clearItems);
        }
    }

    clearItems() {
        this.root.logic.clearAllBeltsAndItems();
    }

    initialize() {
        /** @type {Boolean} */
        this.visible = true;

        this.root.signals.postLoadHook.add(() => {
            const mode = this.root.gameMode;
            this.zoneWidth = mode["zoneWidth"];
            this.zoneHeight = mode["zoneHeight"];
            this.updateZoneValues();
        }, this);
    }

    trim() {
        while (this.testForDecrease(true)) {
            this.decreaseWidth(true);
        }

        while (this.testForDecrease(false)) {
            this.decreaseHeight(true);
        }
    }

    increaseWidth() {
        this.zoneWidth++;

        this.updateZoneValues();
    }

    increaseHeight() {
        this.zoneHeight++;

        this.updateZoneValues();
    }

    /**
     * @param {Boolean} force
     */
    decreaseWidth(force = false) {
        if (this.zoneWidth <= 1) {
            return;
        }

        if (!force && !this.testForDecrease(true)) {
            this.root.hud.parts.dialogs.showWarning(
                T.dialogs.puzzleResizeBadBuildings.title,
                T.dialogs.puzzleResizeBadBuildings.desc
            );
            return;
        }

        this.zoneWidth--;

        this.updateZoneValues();
    }

    /**
     * @param {Boolean} force
     */
    decreaseHeight(force = false) {
        if (this.zoneHeight <= 1) {
            return;
        }

        if (!force && !this.testForDecrease(false)) {
            this.root.hud.parts.dialogs.showWarning(
                T.dialogs.puzzleResizeBadBuildings.title,
                T.dialogs.puzzleResizeBadBuildings.desc
            );
            return;
        }

        this.zoneHeight--;

        this.updateZoneValues();
    }

    /**
     * @param {Boolean} changedWidth
     * @returns {Boolean}
     */
    testForDecrease(changedWidth) {
        if ((changedWidth ? this.zoneWidth : this.zoneHeight) <= 3) {
            return false;
        }

        const newZone = new Rectangle(
            0,
            0,
            this.zoneWidth + (changedWidth ? -1 : 0),
            this.zoneHeight + (changedWidth ? 0 : -1)
        );
        const entities = this.root.entityMgr.getAllWithComponent(StaticMapEntityComponent);

        for (const entity of entities) {
            const staticComp = entity.components.StaticMapEntity;
            const bounds = staticComp.getTileSpaceBounds();
            if (!newZone.intersectsFully(bounds)) {
                return false;
            }
        }

        return true;
    }

    updateZoneValues() {
        const mode = this.root.gameMode;

        mode["zoneWidth"] = this.zoneWidth;
        mode["zoneHeight"] = this.zoneHeight;

        this.element.querySelector(".zoneWidth > .value").textContent = String(mode["zoneWidth"]);
        this.element.querySelector(".zoneHeight > .value").textContent = String(mode["zoneHeight"]);
    }
}
