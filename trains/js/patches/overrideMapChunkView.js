import { globalConfig } from "shapez/core/config";
import { getBuildingDataFromCode } from "shapez/game/building_codes";
import { CHUNK_OVERLAY_RES, MapChunkView } from "shapez/game/map_chunk_view";
import { ModInterface } from "shapez/mods/mod_interface";

/**
 * @param {ModInterface} modInterface
 */
export function overrideMapChunkView(modInterface) {
    modInterface.extendClass(MapChunkView, ({ $super, $old }) => ({
        /**
         *
         * @param {CanvasRenderingContext2D} context
         * @param {number} w
         * @param {number} h
         * @param {number=} xoffs
         * @param {number=} yoffs
         */
        generateOverlayBuffer(context, w, h, xoffs, yoffs) {
            context.fillStyle =
                this.containedEntities.length > 0
                    ? shapez.THEME.map.chunkOverview.filled
                    : shapez.THEME.map.chunkOverview.empty;
            context.fillRect(xoffs, yoffs, w, h);

            if (this.root.app.settings.getAllSettings().displayChunkBorders) {
                context.fillStyle = shapez.THEME.map.chunkBorders;
                context.fillRect(xoffs, yoffs, w, 1);
                context.fillRect(xoffs, yoffs + 1, 1, h);
            }

            for (let x = 0; x < globalConfig.mapChunkSize; ++x) {
                for (let y = 0; y < globalConfig.mapChunkSize; ++y) {
                    const lowerContent = this.lowerLayer[x][y];
                    if (lowerContent) {
                        context.fillStyle = lowerContent.getBackgroundColorAsResource();
                        context.fillRect(
                            xoffs + x * CHUNK_OVERLAY_RES,
                            yoffs + y * CHUNK_OVERLAY_RES,
                            CHUNK_OVERLAY_RES,
                            CHUNK_OVERLAY_RES
                        );
                    }

                    const upperContents = this.contents[x][y];
                    if (!upperContents) {
                        continue;
                    }

                    const upperContent = upperContents[0];
                    if (!upperContent) {
                        continue;
                    }

                    const staticComp = upperContent.components.StaticMapEntity;
                    const data = getBuildingDataFromCode(staticComp.code);
                    const metaBuilding = data.metaInstance;

                    const overlayMatrix = metaBuilding.getSpecialOverlayRenderMatrix(
                        staticComp.rotation,
                        data.rotationVariant,
                        data.variant,
                        upperContent
                    );

                    if (overlayMatrix) {
                        // Draw lower content first since it "shines" through
                        const lowerContent = this.lowerLayer[x][y];
                        if (lowerContent) {
                            context.fillStyle = lowerContent.getBackgroundColorAsResource();
                            context.fillRect(
                                xoffs + x * CHUNK_OVERLAY_RES,
                                yoffs + y * CHUNK_OVERLAY_RES,
                                CHUNK_OVERLAY_RES,
                                CHUNK_OVERLAY_RES
                            );
                        }

                        context.fillStyle = metaBuilding.getSilhouetteColor(
                            data.variant,
                            data.rotationVariant
                        );
                        for (let dx = 0; dx < 3; ++dx) {
                            for (let dy = 0; dy < 3; ++dy) {
                                const isFilled = overlayMatrix[dx + dy * 3];
                                if (isFilled) {
                                    context.fillRect(
                                        xoffs + x * CHUNK_OVERLAY_RES + dx,
                                        yoffs + y * CHUNK_OVERLAY_RES + dy,
                                        1,
                                        1
                                    );
                                }
                            }
                        }
                    } else {
                        context.fillStyle = metaBuilding.getSilhouetteColor(
                            data.variant,
                            data.rotationVariant
                        );
                        context.fillRect(
                            xoffs + x * CHUNK_OVERLAY_RES,
                            yoffs + y * CHUNK_OVERLAY_RES,
                            CHUNK_OVERLAY_RES,
                            CHUNK_OVERLAY_RES
                        );
                    }
                }
            }

            if (this.root.currentLayer !== "wires") {
                return;
            }

            // Draw wires overlay

            context.fillStyle = shapez.THEME.map.wires.overlayColor;
            context.fillRect(xoffs, yoffs, w, h);

            for (let x = 0; x < globalConfig.mapChunkSize; ++x) {
                const wiresArray = this.wireContents[x];
                for (let y = 0; y < globalConfig.mapChunkSize; ++y) {
                    const content = wiresArray[y];
                    if (!content) {
                        continue;
                    }
                    MapChunkView.drawSingleWiresOverviewTile({
                        context,
                        x: xoffs + x * CHUNK_OVERLAY_RES,
                        y: yoffs + y * CHUNK_OVERLAY_RES,
                        entity: content,
                        tileSizePixels: CHUNK_OVERLAY_RES,
                    });
                }
            }
        },
    }));
}
