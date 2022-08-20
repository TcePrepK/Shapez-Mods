import { globalConfig } from "shapez/core/config";
import { DrawParameters } from "shapez/core/draw_parameters";
import { BaseItem } from "shapez/game/base_item";
import { enumColors, enumColorsToHexCode } from "shapez/game/colors";
import { Entity } from "shapez/game/entity";
import { GameSystemWithFilter } from "shapez/game/game_system_with_filter";
import { ColorItem } from "shapez/game/items/color_item";
import { ShapeItem } from "shapez/game/items/shape_item";
import { MapChunk } from "shapez/game/map_chunk";
import { QuadSenderComponent } from "../components/quad_sender";
import { SingleSenderComponent } from "../components/single_sender";
import { WirelessDisplayComponent } from "../components/wireless_display";
import { WirelessManager } from "../core/wirelessManager";

export class WirelessDisplaySystem extends GameSystemWithFilter {
    constructor(root) {
        super(root, [WirelessDisplayComponent]);
    }

    /**
     * @param {Entity} sender
     * @returns {Array<BaseItem|Array<enumColors>>}
     */
    getValuesFromSender(sender) {
        /** @type {SingleSenderComponent} */
        const singleSender = sender.components["SingleSender"];

        /** @type {QuadSenderComponent} */
        const quadSender = sender.components["QuadSender"];

        if (singleSender) {
            return [singleSender.value];
        } else if (quadSender) {
            return quadSender.values;
        }

        return [];
    }

    /**
     * @param {String} code
     */
    getSenders(code) {
        /** @type {WirelessManager} */
        const wirelessManager = globalConfig["wirelessManager"];

        const senders = wirelessManager.getSenders(code);
        for (let i = 0; i < senders.length; ++i) {
            const sender = senders[i];

            if (!sender.components["SingleSender"] && !sender.components["QuadSender"]) {
                senders.splice(i, 1);
                --i;
            }
        }

        return senders;
    }

    /**
     * @param {DrawParameters} parameters
     * @param {MapChunk} chunk
     */
    drawChunk(parameters, chunk) {
        const contents = chunk.containedEntities;
        for (let i = 0; i < contents.length; ++i) {
            const entity = contents[i];
            const display = entity.components["WirelessDisplay"];
            if (!display) {
                continue;
            }

            const code = entity.components["WirelessCode"].wirelessCode;
            const senders = this.getSenders(code);

            if (senders.length === 0) {
                continue;
            }

            let anyConflicts = false;
            let pinAmount = senders[0].components.WiredPins.slots.length;
            for (let i = 0; i < senders.length; ++i) {
                const pin = senders[i].components.WiredPins.slots.length;
                if (pinAmount != pin) {
                    anyConflicts = true;
                    break;
                }
            }

            if (anyConflicts) {
                continue;
            }

            /** @type {Array<BaseItem|Array<enumColors>>} */
            const values = this.getValuesFromSender(senders[0]);
            for (let i = 1; i < senders.length; ++i) {
                const newValues = this.getValuesFromSender(senders[i]);
                for (let j = 0; j < values.length; ++j) {
                    const value = values[j];
                    const newValue = newValues[j];

                    if (value && value[0] == "conflict") {
                        continue;
                    }

                    if (!newValue) {
                        continue;
                    }

                    if (!value) {
                        values[j] = newValue;
                        continue;
                    }

                    if (typeof value !== typeof newValue) {
                        values[j] = ["conflict"];
                        continue;
                    }

                    if (value instanceof BaseItem && newValue instanceof BaseItem) {
                        if (value.equalsImpl(newValue)) {
                            continue;
                        } else {
                            values[j] = ["conflict"];
                        }
                    } else if (value instanceof Array && newValue instanceof Array) {
                        if (value.length != newValue.length) {
                            values[j] = ["conflict"];
                            continue;
                        }

                        if (
                            !value.every(function (value, index) {
                                return value === newValue[index];
                            })
                        ) {
                            values[j] = ["conflict"];
                            continue;
                        }
                    } else {
                        values[j] = ["conflict"];
                    }
                }
            }

            this.drawValues(parameters, entity, values);
        }
    }

    /**
     * @param {DrawParameters} parameters
     * @param {Entity} entity
     * @param {Array<BaseItem|Array<String>>} values
     */
    drawValues(parameters, entity, values) {
        const display = entity.components["WirelessDisplay"];
        if (!display) {
            return;
        }

        const tileSize = globalConfig.tileSize;
        const pos = entity.components.StaticMapEntity.origin.multiplyScalar(tileSize);

        if (values.length != 1) {
            parameters.context.fillStyle = "black";
            parameters.context.fillRect(pos.x, pos.y, 32, 32);
        }

        this.drawArray(parameters, values, pos.x, pos.y, tileSize, tileSize);
    }

    /**
     * @param {DrawParameters} parameters
     * @param {Array<BaseItem|Array<String>>|Array<String>} values
     */
    drawArray(parameters, values, x, y, width, height) {
        const subWidth = Math.floor(Math.sqrt(values.length));
        const subHeight = Math.ceil(values.length / subWidth);
        for (let k = 0; k < subWidth; ++k) {
            for (let m = 0; m < subHeight; ++m) {
                const index = k + m * subWidth;
                const value = values[index];

                if (!value || value == "conflict") {
                    continue;
                }

                const subW = width / subWidth;
                const subH = height / subHeight;
                const subX = x + (k / subWidth) * width;
                const subY = y + (m / subHeight) * width;

                if (value instanceof ColorItem) {
                    parameters.context.fillStyle = enumColorsToHexCode[value.getAsCopyableKey()];
                    parameters.context.fillRect(subX, subY, subW, subH);
                } else if (value instanceof ShapeItem) {
                    value.drawItemCenteredClipped(
                        subX + subW / 2,
                        subY + subH / 2,
                        parameters,
                        Math.min(subW, subH)
                    );
                } else if (value instanceof Array) {
                    if (value[0] == "conflict") {
                        continue;
                    }

                    this.drawArray(parameters, value, subX, subY, subW, subH);
                } else if (value instanceof String && !(value instanceof BaseItem)) {
                    parameters.context.fillStyle = enumColorsToHexCode[value];
                    parameters.context.fillRect(subX, subY, subW, subH);
                }
            }
        }
    }
}
