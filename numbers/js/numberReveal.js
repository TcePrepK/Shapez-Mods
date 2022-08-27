import { DrawParameters } from "shapez/core/draw_parameters";
import { enumDirectionToAngle, Vector } from "shapez/core/vector";
import { enumPinSlotType } from "shapez/game/components/wired_pins";
import { BaseHUDPart } from "shapez/game/hud/base_hud_part";
import { NumberItem } from "./item";

export class NumberReveal extends BaseHUDPart {
    initialize() {}

    /**
     * @param {DrawParameters} parameters
     */
    draw(parameters) {
        if (this.root.currentLayer !== "wires") {
            // Not in the wires layer
            return;
        }

        const mousePos = this.root.app.mousePosition;
        if (!mousePos) {
            // No mouse
            return;
        }

        const worldPos = this.root.camera.screenToWorld(mousePos);
        const tile = worldPos.toTileSpace();
        const entity = this.root.map.getLayerContentXY(tile.x, tile.y, "wires");

        if (!entity) {
            // No entity
            return;
        }

        if (
            !this.root.camera.getIsMapOverlayActive() &&
            !this.root.logic.getIsEntityIntersectedWithMatrix(entity, worldPos)
        ) {
            // Detailed intersection check
            return;
        }

        const wiredPins = entity.components.WiredPins;
        if (!wiredPins) {
            return;
        }

        for (let i = 0; i < wiredPins.slots.length; i++) {
            const slot = wiredPins.slots[i];
            if (slot.type != enumPinSlotType.logicalEjector) {
                continue;
            }

            const value = slot.value;
            if (!value) {
                continue;
            }

            if (!(value instanceof NumberItem)) {
                continue;
            }

            const staticComp = entity.components.StaticMapEntity;

            const slotPos = staticComp.localTileToWorld(slot.pos).toWorldSpaceCenterOfTile();
            const effectiveRotation = (staticComp.rotation + enumDirectionToAngle[slot.direction]) % 360;
            const slotCenter = slotPos.add(
                new Vector(0, -9.1).rotateInplaceFastMultipleOf90(effectiveRotation)
            );

            value.draw(parameters.context, slotCenter.x, slotCenter.y);
        }
    }
}
