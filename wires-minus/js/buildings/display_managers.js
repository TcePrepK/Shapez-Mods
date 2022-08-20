import { WirelessCodeComponent } from "../components/wireless_code";
import { ModMetaBuilding } from "shapez/mods/mod_meta_building";
import { enumHubGoalRewards } from "shapez/game/tutorial_goals";
import { GameRoot } from "shapez/game/root";
import { defaultBuildingVariant } from "shapez/game/meta_building";
import { Entity } from "shapez/game/entity";
import { enumPinSlotType, WiredPinsComponent } from "shapez/game/components/wired_pins";
import { enumDirection, Vector } from "shapez/core/vector";
import { WirelessDisplayComponent } from "../components/wireless_display";
import { QuadSenderComponent } from "../components/quad_sender";
import { SingleSenderComponent } from "../components/single_sender";

/** @enum {string} */
export const enumWirelessDisplayManagerVariants = {
    single_sender: "single_sender",
    quad_sender: "quad_sender",
};

export class MetaWirelessDisplayManagers extends ModMetaBuilding {
    constructor() {
        super("wireless_display_managers");
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
        return root.hubGoals.isRewardUnlocked(enumHubGoalRewards.reward_display);
    }

    // @ts-ignore
    getAvailableVariants() {
        return [
            defaultBuildingVariant,
            enumWirelessDisplayManagerVariants.single_sender,
            enumWirelessDisplayManagerVariants.quad_sender,
        ];
    }

    static getAllVariantCombinations() {
        return [
            {
                variant: defaultBuildingVariant,
                name: "Wireless Display",
                description: "Like a Display, but values are supplied remotely by Display Transmitters.",
            },
            {
                variant: enumWirelessDisplayManagerVariants.single_sender,
                name: "Single Display Transmitter",
                description: "Broadcasts the input value to Wireless Displays on the same channel.",
            },
            {
                variant: enumWirelessDisplayManagerVariants.quad_sender,
                name: "Quad Display Transmitter",
                description:
                    "Broadcasts the input values to each corner of Wireless Displays on the same channel.",
            },
        ];
    }

    // @ts-ignore
    getRenderPins(variant) {
        switch (variant) {
            case defaultBuildingVariant:
                return true;
            case enumWirelessDisplayManagerVariants.single_sender:
                return true;
            case enumWirelessDisplayManagerVariants.quad_sender:
                return false;
            default:
                throw new Error("Unknown variant: " + variant);
        }
    }

    // @ts-ignore
    getShowWiresLayerPreview() {
        return true;
    }

    // @ts-ignore
    setupEntityComponents(entity) {
        entity.addComponent(new WirelessCodeComponent());
    }

    /**
     *
     * @param {Entity} entity
     * @param {number} rotationVariant
     * @param {string} variant
     */
    // @ts-ignore
    updateVariants(entity, rotationVariant, variant) {
        if (!entity.components.WiredPins) {
            entity.addComponent(new WiredPinsComponent({ slots: [] }));
        }

        if (entity.components["WirelessDisplay"]) {
            entity.removeComponent(WirelessDisplayComponent);
        }

        if (entity.components["SingleSender"]) {
            entity.removeComponent(SingleSenderComponent);
        } else if (entity.components["QuadSender"]) {
            entity.removeComponent(QuadSenderComponent);
        }

        switch (variant) {
            case defaultBuildingVariant:
                entity.removeComponent(WiredPinsComponent);
                entity.addComponent(new WirelessDisplayComponent());

                break;
            case enumWirelessDisplayManagerVariants.single_sender:
                entity.addComponent(new SingleSenderComponent());
                entity.components.WiredPins.setSlots([
                    {
                        pos: new Vector(0, 0),
                        direction: enumDirection.bottom,
                        type: enumPinSlotType.logicalAcceptor,
                    },
                ]);

                break;
            case enumWirelessDisplayManagerVariants.quad_sender:
                entity.addComponent(new QuadSenderComponent());

                entity.components.WiredPins.setSlots([
                    {
                        pos: new Vector(0, 0),
                        direction: enumDirection.top,
                        type: enumPinSlotType.logicalAcceptor,
                    },
                    {
                        pos: new Vector(0, 0),
                        direction: enumDirection.right,
                        type: enumPinSlotType.logicalAcceptor,
                    },
                    {
                        pos: new Vector(0, 0),
                        direction: enumDirection.bottom,
                        type: enumPinSlotType.logicalAcceptor,
                    },
                    {
                        pos: new Vector(0, 0),
                        direction: enumDirection.left,
                        type: enumPinSlotType.logicalAcceptor,
                    },
                ]);

                break;
            default:
                break;
        }
    }
}
