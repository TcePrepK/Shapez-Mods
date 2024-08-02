import { Camera } from "shapez/game/camera";
import { KEYMAPPINGS } from "shapez/game/key_action_mapper";
import { ModInterface } from "shapez/mods/mod_interface";
import { BasicSerializableObject } from "shapez/savegame/serialization";
import { KeyboardReaderSystem } from "../systems/keyboardReader";

/** @type {Object<ItemType, number>} */
const enumTypeToSize = {
    boolean: 9,
    shape: 9,
    color: 14,
};

/**
 * @param {ModInterface} modInterface
 */
export function removeThis(modInterface) {
    BasicSerializableObject.prototype.hasOwnProperty = function (key) {
        const proto = Object.getPrototypeOf(this);
        const prop = Object.getOwnPropertyDescriptor(proto, key);
        if (prop?.get && prop.set) {
            return true;
        }

        return Object.hasOwnProperty.call(this, key);
    };

    modInterface.replaceMethod(Camera, "internalUpdateKeyboardForce", function ($original, [now, dt]) {
        if (!this.currentlyMoving && this.desiredCenter == null) {
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

            const keyboardInput = KeyboardReaderSystem.get(this.root);
            if (
                !keyboardInput.isAvailableBinding(KEYMAPPINGS.navigation.mapMoveUp.keyCode) ||
                !keyboardInput.isAvailableBinding(KEYMAPPINGS.navigation.mapMoveDown.keyCode)
            ) {
                forceY = 0;
            }

            if (
                !keyboardInput.isAvailableBinding(KEYMAPPINGS.navigation.mapMoveLeft.keyCode) ||
                !keyboardInput.isAvailableBinding(KEYMAPPINGS.navigation.mapMoveRight.keyCode)
            ) {
                forceX = 0;
            }

            let movementSpeed =
                this.root.app.settings.getMovementSpeed() *
                // @ts-ignore
                (actionMapper.getBinding(KEYMAPPINGS.navigation.mapMoveFaster).pressed ? 4 : 1);

            this.center.x += moveAmount * forceX * movementSpeed;
            this.center.y += moveAmount * forceY * movementSpeed;

            this.clampToBounds();
        }
    });
}
