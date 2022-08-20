import { globalConfig } from "shapez/core/config";
import { smoothenDpi } from "shapez/core/dpi_manager";
import { DrawParameters } from "shapez/core/draw_parameters";
import { drawSpriteClipped } from "shapez/core/draw_utils";
import { Rectangle } from "shapez/core/rectangle";
import { HUDConstantSignalEdit } from "shapez/game/hud/parts/constant_signal_edit";
import { ColorItem } from "shapez/game/items/color_item";
import { THEME } from "shapez/game/theme";
import { Mod } from "shapez/mods/mod";
import { types } from "shapez/savegame/serialization";
import { ColorManager } from "./colorManager";

class ModImpl extends Mod {
    init() {
        const colorManager = new ColorManager();
        globalConfig["colorManager"] = colorManager;

        this.modInterface.replaceMethod(
            HUDConstantSignalEdit,
            "parseSignalCode",
            function ($original, [entity, code]) {
                if (!ColorManager.isValidHex(code)) {
                    return $original(entity, code);
                }

                return colorManager.getItem(code);
            }
        );

        this.modInterface.extendClass(ColorItem, ({ $super, $old }) => ({
            getBackgroundColorAsResource() {
                if (ColorManager.isValidHex(this.color)) {
                    return this.color;
                }

                return THEME.map.resources[this.color];
            },

            internalGenerateColorBuffer(canvas, context, w, h, dpi) {
                context.translate((w * dpi) / 2, (h * dpi) / 2);
                context.scale((dpi * w) / 12, (dpi * h) / 12);

                context.fillStyle = this.color;
                context.strokeStyle = THEME.items.outline;
                context.lineWidth = 2 * THEME.items.outlineWidth;
                context.beginCircle(2, -1, 3);
                context.stroke();
                context.fill();
                context.beginCircle(-2, -1, 3);
                context.stroke();
                context.fill();
                context.beginCircle(0, 2, 3);
                context.closePath();
                context.stroke();
                context.fill();
            },

            getSchema() {
                return types.string;
            },
        }));

        this.modInterface.replaceMethod(
            ColorItem,
            "drawFullSizeOnCanvas",
            function ($original, [context, size]) {
                if (!ColorManager.isValidHex(this.color)) {
                    $original(context, size);
                    return;
                }

                this["internalGenerateColorBuffer"](null, context, size, size, 1);
            }
        );

        this.modInterface.replaceMethod(
            ColorItem,
            "drawItemCenteredClipped",
            function ($original, [x, y, parameters, diameter]) {
                if (!ColorManager.isValidHex(this.color)) {
                    $original(x, y, parameters, diameter);
                    return;
                }

                if (!this["bufferGenerator"]) {
                    this["bufferGenerator"] = this["internalGenerateColorBuffer"].bind(this);
                }

                const realDiameter = diameter * 0.6;

                const visibleRect = parameters.visibleRect;
                const drawRect = new Rectangle(
                    x - realDiameter / 2,
                    y - realDiameter / 2,
                    realDiameter,
                    realDiameter
                );
                if (!visibleRect.getIntersection(drawRect)) {
                    return;
                }

                const dpi = smoothenDpi(globalConfig["shapesSharpness"] * parameters.zoomLevel);
                const key = realDiameter + "/" + dpi + "/" + this.color;
                const canvas = parameters.root.buffers.getForKey({
                    key: "coloritem",
                    subKey: key,
                    w: realDiameter,
                    h: realDiameter,
                    dpi,
                    redrawMethod: this["bufferGenerator"],
                });

                drawSpriteClipped({
                    parameters,
                    sprite: canvas,
                    x: x - realDiameter / 2,
                    y: y - realDiameter / 2,
                    w: realDiameter,
                    h: realDiameter,
                    originalW: realDiameter * dpi,
                    originalH: realDiameter * dpi,
                });
            }
        );
    }
}
