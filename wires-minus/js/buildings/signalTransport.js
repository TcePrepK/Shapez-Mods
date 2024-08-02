import { generateMatrixRotations } from "shapez/core/utils";
import { enumDirection, Vector } from "shapez/core/vector";
import { enumPinSlotType, WiredPinsComponent } from "shapez/game/components/wired_pins";
import { Entity } from "shapez/game/entity";
import { defaultBuildingVariant } from "shapez/game/meta_building";
import { GameRoot } from "shapez/game/root";
import { enumHubGoalRewards } from "shapez/game/tutorial_goals";
import { ModMetaBuilding } from "shapez/mods/mod_meta_building";
import { FiberPinsComponent } from "../components/fiberPins";
import { HammerLinkComponent } from "../components/hammerLink";

/** @enum {string} */
export const enumSignalTransportVariants = {
    fiber: "fiber_link",
};

const overlayMatrices = {
    [defaultBuildingVariant]: generateMatrixRotations([0, 1, 0, 0, 1, 1, 0, 1, 0]),
    [enumSignalTransportVariants.fiber]: generateMatrixRotations([0, 1, 0, 0, 1, 0, 0, 1, 0]),
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
        return [defaultBuildingVariant, enumSignalTransportVariants.fiber];
    }

    static getAllVariantCombinations() {
        return [
            {
                variant: defaultBuildingVariant,
                name: "Hammer Link",
                description: "Connects together all links with matching side inputs.",
            },
            {
                variant: enumSignalTransportVariants.fiber,
                name: "Fiber Link",
                description: "Connects together all links joined by fibers.",
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
    setupEntityComponents(entity) {}

    /**
     *
     * @param {Entity} entity
     * @param {number} rotationVariant
     * @param {string} variant
     */
    // @ts-ignore
    updateVariants(entity, rotationVariant, variant) {
        HammerLinkComponent.get(entity) ? entity.removeComponent(HammerLinkComponent) : null;
        FiberPinsComponent.get(entity) ? entity.removeComponent(FiberPinsComponent) : null;
        entity.components.WiredPins ? entity.removeComponent(WiredPinsComponent) : null;

        switch (variant) {
            case defaultBuildingVariant:
                entity.addComponent(new HammerLinkComponent());
                entity.addComponent(
                    new WiredPinsComponent({
                        slots: [
                            {
                                pos: new Vector(0, 0),
                                direction: enumDirection.right,
                                type: enumPinSlotType.logicalAcceptor,
                            },
                        ],
                    })
                );

                break;
            case enumSignalTransportVariants.fiber:
                entity.addComponent(
                    new FiberPinsComponent([
                        {
                            tilePos: new Vector(0, 0),
                            offset: new Vector(0, 0),
                            wires: [
                                {
                                    pos: new Vector(0, 0),
                                    direction: enumDirection.top,
                                },
                                {
                                    pos: new Vector(0, 0),
                                    direction: enumDirection.bottom,
                                },
                            ],
                        },
                    ])
                );

                break;
        }
    }
}
