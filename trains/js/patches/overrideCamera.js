import { STOP_PROPAGATION } from "shapez/core/signal";
import { Vector } from "shapez/core/vector";
import { Camera } from "shapez/game/camera";
import { ModInterface } from "shapez/mods/mod_interface";

/**
 * @param {ModInterface} modInterface
 */
export function overrideCamera(modInterface) {
    modInterface.extendClass(Camera, ({ $super, $old }) => ({
        /**
         * Mousewheel event
         * @param {WheelEvent} event
         */
        onMouseWheel(event) {
            if (event.cancelable) {
                event.preventDefault();
                // event.stopPropagation();
            }

            const buildingPlacer = this.root.hud.parts.buildingPlacer;
            if (buildingPlacer.onMouseWheel(event) == STOP_PROPAGATION) {
                return false;
            }

            const prevZoom = this.zoomLevel;
            const scale = 1 + 0.15 * this.root.app.settings.getScrollWheelSensitivity();
            assert(Number.isFinite(scale), "Got invalid scale in mouse wheel event: " + event.deltaY);
            assert(
                Number.isFinite(this.zoomLevel),
                "Got invalid zoom level *before* wheel: " + this.zoomLevel
            );
            this.zoomLevel *= event.deltaY < 0 ? scale : 1 / scale;
            assert(
                Number.isFinite(this.zoomLevel),
                "Got invalid zoom level *after* wheel: " + this.zoomLevel
            );

            this.clampZoomLevel();
            this.desiredZoom = null;

            let mousePosition = this.root.app.mousePosition;
            if (!this.root.app.settings.getAllSettings().zoomToCursor) {
                mousePosition = new Vector(this.root.gameWidth / 2, this.root.gameHeight / 2);
            }

            if (mousePosition) {
                const worldPos = this.root.camera.screenToWorld(mousePosition);
                const worldDelta = worldPos.sub(this.center);
                const actualDelta = this.zoomLevel / prevZoom - 1;
                this.center = this.center.add(worldDelta.multiplyScalar(actualDelta));
                this.desiredCenter = null;
            }

            return false;
        },
    }));
}
