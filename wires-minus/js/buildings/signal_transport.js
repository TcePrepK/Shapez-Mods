import { DynamicRemoteSignalComponent } from "../components/dynamic_remote_signal";
import { ModMetaBuilding } from "shapez/mods/mod_meta_building";
import { enumHubGoalRewards } from "shapez/game/tutorial_goals";
import { GameRoot } from "shapez/game/root";
import { defaultBuildingVariant } from "shapez/game/meta_building";
import { enumPinSlotType, WiredPinsComponent } from "shapez/game/components/wired_pins";
import { enumDirection, Vector } from "shapez/core/vector";
import { Entity } from "shapez/game/entity";
import { generateMatrixRotations } from "shapez/core/utils";
import { WirelessCodeComponent } from "../components/wireless_code";
import { StaticRemoteSignalComponent } from "../components/static_remote_signal";
import { FiberPinsComponent } from "../components/fiber_pins";

/** @enum {string} */
export const enumSignalTransportVariants = {
    mirrored: "mirrored",
    static: "static",
};

const overlayMatrices = {
    [defaultBuildingVariant]: generateMatrixRotations([0, 1, 0, 1, 1, 0, 0, 1, 0]),
    [enumSignalTransportVariants.mirrored]: generateMatrixRotations([0, 1, 0, 0, 1, 1, 0, 1, 0]),
    [enumSignalTransportVariants.static]: generateMatrixRotations([0, 1, 0, 0, 1, 0, 0, 1, 0]),
};

export class MetaSignalTransportBuildings extends ModMetaBuilding {
    constructor() {
        super("signal_transport");
    }

    // @ts-ignore
    getSilhouetteColor() {
        return "#aaaaaa";
    }

    /**
     * @param {GameRoot} root
     */
    // @ts-ignore
    getIsUnlocked(root) {
        return root.hubGoals.isRewardUnlocked(enumHubGoalRewards.reward_logic_gates);
    }

    // @ts-ignore
    getAvailableVariants() {
        return [
            defaultBuildingVariant,
            enumSignalTransportVariants.mirrored,
            enumSignalTransportVariants.static,
        ];
    }

    static getAllVariantCombinations() {
        return [
            {
                variant: defaultBuildingVariant,
                name: "Dynamic Transceiver",
                description:
                    "Wirelessly sends the input value to other Dynamic Transceivers on the same channel.",
            },
            {
                variant: enumSignalTransportVariants.mirrored,
                name: "Dynamic Transceiver",
                description:
                    "Wirelessly sends the input value to other Dynamic Transceivers on the same channel.",
            },
            {
                variant: enumSignalTransportVariants.static,
                name: "Static Transceiver",
                description:
                    "Wirelessly sends the input value to other Static Transceivers on the same channel.",
            },
        ];
    }

    // @ts-ignore
    getSpecialOverlayRenderMatrix(rotation, rotationVariant, variant) {
        return overlayMatrices[variant][rotation];
    }

    /** @returns {"wires"} **/
    // @ts-ignore
    getLayer() {
        return "wires";
    }

    // @ts-ignore
    getRenderPins() {
        // We already have it included
        return false;
    }

    // @ts-ignore
    setupEntityComponents(entity) {
        entity.addComponent(new DynamicRemoteSignalComponent());
        entity.addComponent(new WiredPinsComponent({ slots: [] }));
    }

    /**
     *
     * @param {Entity} entity
     * @param {number} rotationVariant
     * @param {string} variant
     */
    // @ts-ignore
    updateVariants(entity, rotationVariant, variant) {
        entity.components["DynamicRemoteSignal"]
            ? entity.removeComponent(DynamicRemoteSignalComponent)
            : null;
        entity.components["StaticRemoteSignal"] ? entity.removeComponent(StaticRemoteSignalComponent) : null;
        entity.components["WirelessCode"] ? entity.removeComponent(WirelessCodeComponent) : null;
        entity.components["FiberPins"] ? entity.removeComponent(FiberPinsComponent) : null;

        const mainSlots = [
            {
                pos: new Vector(0, 0),
                direction: enumDirection.bottom,
                type: enumPinSlotType.logicalAcceptor,
            },
            {
                pos: new Vector(0, 0),
                direction: enumDirection.top,
                type: enumPinSlotType.logicalEjector,
            },
        ];

        switch (variant) {
            case defaultBuildingVariant:
            case enumSignalTransportVariants.mirrored:
                entity.addComponent(new DynamicRemoteSignalComponent());

                entity.components.WiredPins.setSlots([
                    {
                        pos: new Vector(0, 0),
                        direction:
                            variant === enumSignalTransportVariants.mirrored
                                ? enumDirection.right
                                : enumDirection.left,
                        type: enumPinSlotType.logicalAcceptor,
                    },
                    ...mainSlots,
                ]);

                break;
            case enumSignalTransportVariants.static:
                entity.addComponent(new StaticRemoteSignalComponent());
                // entity.addComponent(new WirelessCodeComponent());
                entity.addComponent(new FiberPinsComponent({ slots: mainSlots }));

                entity.components.WiredPins.setSlots(mainSlots);

                break;
        }
    }
}
