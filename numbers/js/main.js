import { globalConfig } from "shapez/core/config";
import { smoothenDpi } from "shapez/core/dpi_manager";
import { DrawParameters } from "shapez/core/draw_parameters";
import { STOP_PROPAGATION } from "shapez/core/signal";
import { enumColors } from "shapez/game/colors";
import { GameHUD } from "shapez/game/hud/hud";
import { BooleanItem } from "shapez/game/items/boolean_item";
import { COLOR_ITEM_SINGLETONS } from "shapez/game/items/color_item";
import { KEYCODES } from "shapez/game/key_action_mapper";
import { GameRoot } from "shapez/game/root";
import { DisplaySystem } from "shapez/game/systems/display";
import { Mod } from "shapez/mods/mod";
import { patchCompare } from "./comparePatches";
import { patchConstant } from "./constantPatches";
import { NumberItem } from "./item";
import { NumberManager } from "./numberManager";
import { NumberReveal } from "./numberReveal";
import { patchNumbers } from "./numbersPatches";

const numberManager = new NumberManager();
shapez.globalConfig["numberManager"] = numberManager;

class ModImpl extends Mod {
    init() {
        let font = new FontFace("Barlow", `url("res/fonts/GameFont.woff2")`);

        font.load().then(() => {
            // @ts-ignore
            document.fonts.add(font);
        });

        patchConstant(this.modInterface);
        patchCompare(this.modInterface);
        patchNumbers(this.modInterface);

        this.modInterface.registerHudElement("numberReveal", NumberReveal);
        this.modInterface.runAfterMethod(GameHUD, "draw", function (parameters) {
            this.parts["numberReveal"].draw(parameters);
        });

        this.modInterface.registerItem(NumberItem, itemData => numberManager.getItem(itemData));

        this.modInterface.registerIngameKeybinding({
            id: "make_da_numbers_visible",
            keyCode: KEYCODES.Alt,
            translation: "Make all numbers opaque",
            handler: root => {
                return STOP_PROPAGATION;
            },
        });

        this.modLoader.signals.gameStarted.add((/** @type {GameRoot} */ root) => {
            globalConfig["opaqueNumbers"] = root.keyMapper.getBindingById("make_da_numbers_visible");
        });

        this.modInterface.replaceMethod(DisplaySystem, "getDisplayItem", function ($original, [value]) {
            if (!value) {
                return null;
            }

            if (value.getItemType() === "number") {
                return COLOR_ITEM_SINGLETONS[enumColors.white];
            }

            return $original(value);
        });

        this.modInterface.extendClass(BooleanItem, ({ $super, $old }) => ({
            /**
             * @returns {string}
             */
            getAsCopyableKey() {
                return this.value ? "true" : "false";
            },

            /**
             * @param {HTMLCanvasElement} canvas
             * @param {CanvasRenderingContext2D} context
             * @param {number} w
             * @param {number} h
             * @param {number} dpi
             */
            draw(canvas, context, w, h, dpi) {
                context.font = "Bold " + h * 1 * dpi + "px Barlow";
                context.textAlign = "center";
                context.textBaseline = "middle";

                // 473737
                // 74CFC6

                const value = this.value ? "✔" : "✖";

                context.strokeStyle = "#64666e";
                context.lineWidth = 1.5 * dpi;
                context.strokeText(value, (w * dpi) / 2, (h * dpi) / 2);
                context.fillStyle = "#74aacf";
                context.fillText(value, (w * dpi) / 2, (h * dpi) / 2);
            },

            /**
             * Draws the item to a canvas
             * @param {CanvasRenderingContext2D} context
             * @param {number} size
             */
            drawFullSizeOnCanvas(context, size) {
                this.draw(null, context, size, size, 1);
            },

            /**
             * @param {number} x
             * @param {number} y
             * @param {DrawParameters} parameters
             * @param {number=} diameter
             */
            drawItemCenteredImpl(x, y, parameters, diameter = 20) {
                const dpi = smoothenDpi(globalConfig["shapesSharpness"] * parameters.zoomLevel);
                if (!this.bufferGenerator) {
                    this.bufferGenerator = this.draw.bind(this);
                }

                const key = diameter + "/" + dpi + "/" + (this.value ? "T" : "F");
                const canvas = parameters.root.buffers.getForKey({
                    key: "numbers",
                    subKey: key,
                    w: diameter,
                    h: diameter,
                    dpi,
                    redrawMethod: this.bufferGenerator,
                });
                parameters.context.drawImage(
                    canvas,
                    x - diameter / 2,
                    y - diameter / 2 + 0.5,
                    diameter,
                    diameter
                );
            },
        }));
    }
}
