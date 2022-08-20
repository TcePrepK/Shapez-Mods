import { globalConfig } from "shapez/core/config";
import { Rectangle } from "shapez/core/rectangle";
import { STOP_PROPAGATION } from "shapez/core/signal";
import { Vector } from "shapez/core/vector";
import { Camera, USER_INTERACT_MOVE } from "shapez/game/camera";
import { enumNotificationType } from "shapez/game/hud/parts/notifications";
import { HUDWaypoints } from "shapez/game/hud/parts/waypoints";
import { KEYMAPPINGS } from "shapez/game/key_action_mapper";
import { ShapeDefinition } from "shapez/game/shape_definition";
import { ModInterface } from "shapez/mods/mod_interface";
import { ACHIEVEMENTS } from "shapez/platform/achievement_provider";
import { T } from "shapez/translations";
import { RotatableRectangle } from "./rotatableRectangle";

const velocitySmoothing = 0.5;

/**
 * @param {ModInterface} modInterface
 */
export function overrides(modInterface) {
    modInterface.replaceMethod(Camera, "getVisibleRect", function ($original) {
        const center = this.center;
        const width = this.root.gameWidth / this.zoomLevel;
        const height = this.root.gameHeight / this.zoomLevel;
        const rotation = globalConfig["cameraRotation"];

        const rotatedRectangle = new RotatableRectangle(
            center.x - width / 2,
            center.y - height / 2,
            width / 2,
            height / 2
        ).rotateRectangle(rotation);

        const visibleRect = new Rectangle(
            center.x - rotatedRectangle.w,
            center.y - rotatedRectangle.h,
            rotatedRectangle.w * 2,
            rotatedRectangle.h * 2
        );

        return visibleRect;
    });

    modInterface.runBeforeMethod(Camera, "transform", function (context) {
        const rotation = globalConfig["cameraRotation"];

        context.translate(this.root.gameWidth / 2, this.root.gameHeight / 2);
        context.rotate(-rotation);
        context.translate(-this.root.gameWidth / 2, -this.root.gameHeight / 2);
    });

    modInterface.replaceMethod(Camera, "screenToWorld", function ($original, [screen]) {
        const rotation = globalConfig["cameraRotation"];
        const centerSpace = screen.subScalars(this.root.gameWidth / 2, this.root.gameHeight / 2);
        const worldSpace = centerSpace.divideScalar(this.zoomLevel).add(this.center);
        return worldSpace.sub(this.center).rotated(rotation).add(this.center);
    });

    modInterface.replaceMethod(Camera, "worldToScreen", function ($original, [world]) {
        const rotation = globalConfig["cameraRotation"];
        const fixedWorld = world.sub(this.center).rotated(-rotation).add(this.center);
        const screenSpace = fixedWorld.sub(this.center).multiplyScalar(this.zoomLevel);
        return screenSpace.addScalars(this.root.gameWidth / 2, this.root.gameHeight / 2);
    });

    modInterface.replaceMethod(Camera, "internalUpdateKeyboardForce", function ($original, [now, dt]) {
        if (this.currentlyMoving || this.desiredCenter) {
            return;
        }

        const limitingDimension = Math.min(this.root.gameWidth, this.root.gameHeight);

        const moveAmount = ((limitingDimension / 2048) * dt) / this.zoomLevel;

        let forceX = 0;
        let forceY = 0;

        const actionMapper = this.root.keyMapper;
        if (actionMapper.getBinding(KEYMAPPINGS.navigation.mapMoveUp).pressed) {
            forceY -= 1;
        }

        if (actionMapper.getBinding(KEYMAPPINGS.navigation.mapMoveDown).pressed) {
            forceY += 1;
        }

        if (actionMapper.getBinding(KEYMAPPINGS.navigation.mapMoveLeft).pressed) {
            forceX -= 1;
        }

        if (actionMapper.getBinding(KEYMAPPINGS.navigation.mapMoveRight).pressed) {
            forceX += 1;
        }

        const movementSpeed =
            this.root.app.settings.getMovementSpeed() *
            // @ts-ignore
            (actionMapper.getBinding(KEYMAPPINGS.navigation.mapMoveFaster).pressed ? 4 : 1);

        // this.center.x += moveAmount * forceX * movementSpeed;
        // this.center.y += moveAmount * forceY * movementSpeed;
        const movementVector = new Vector(
            moveAmount * forceX * movementSpeed,
            moveAmount * forceY * movementSpeed
        );
        const rotatedMovementVector = movementVector.rotated(globalConfig["cameraRotation"]);
        this.center = this.center.add(rotatedMovementVector);

        this.clampToBounds();
    });

    // @ts-ignore
    modInterface.replaceMethod(Camera, "combinedSingleTouchMoveHandler", function ($original, [x, y]) {
        const pos = new Vector(x, y);
        if (this.movePreHandler.dispatch(pos) === STOP_PROPAGATION) {
            // Somebody else captured it
            return;
        }

        if (!this.currentlyMoving) {
            return false;
        }

        let delta = this.lastMovingPosition
            .sub(pos)
            .divideScalar(this.zoomLevel)
            .rotated(globalConfig["cameraRotation"]);
        if (shapez.G_IS_DEV && globalConfig.debug.testCulling) {
            // When testing culling, we see everything from the same distance
            delta = delta.multiplyScalar(this.zoomLevel * -2);
        }

        this.didMoveSinceTouchStart = this.didMoveSinceTouchStart || delta.length() > 0;
        this.center = this.center.add(delta);

        this.touchPostMoveVelocity = this.touchPostMoveVelocity
            .multiplyScalar(velocitySmoothing)
            .add(delta.multiplyScalar(1 - velocitySmoothing));

        this.lastMovingPosition = pos;
        this.userInteraction.dispatch(USER_INTERACT_MOVE);

        // Since we moved, abort any programmed moving
        if (this.desiredCenter) {
            this.desiredCenter = null;
        }
    });

    modInterface.replaceMethod(HUDWaypoints, "addWaypoint", function ($original, [label, position]) {
        const cameraCenter = this.root.camera.center;
        const cameraRotation = globalConfig["cameraRotation"];
        const rotatedPosition = position.sub(cameraCenter).rotated(cameraRotation).add(cameraCenter);

        this.waypoints.push({
            label,
            center: { x: rotatedPosition.x, y: rotatedPosition.y },
            zoomLevel: this.root.camera.zoomLevel,
            layer: this.root.currentLayer,
        });

        this.sortWaypoints();

        // Show notification about creation
        this.root.hud.signals.notification.dispatch(
            T.ingame.waypoints.creationSuccessNotification,
            enumNotificationType.success
        );
        this.root.signals.achievementCheck.dispatch(
            ACHIEVEMENTS.mapMarkers15,
            this.waypoints.length - 1 // Disregard HUB
        );

        // Re-render the list and thus add it
        this.rerenderWaypointList();
    });
}
