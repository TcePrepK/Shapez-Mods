import { Loader } from "shapez/core/loader";
import { enumDirection } from "shapez/core/vector";
import { defaultBuildingVariant } from "shapez/game/meta_building";
import { enumHubGoalRewards } from "shapez/game/tutorial_goals";
import { ModMetaBuilding } from "shapez/mods/mod_meta_building";
import { AdvancedDisplayComponent, enumDisplayType } from "../components/wirelessDisplay";

export const arrayDisplayRotationVariantToType = Object.keys(enumDisplayType);

export class MetaAdvancedDisplay extends ModMetaBuilding {
    constructor() {
        super("advanced_display");
    }

    // @ts-ignore
    getSilhouetteColor() {
        return "#aaaaaa";
    }

    // @ts-ignore
    getIsUnlocked(root) {
        return root.hubGoals.isRewardUnlocked(enumHubGoalRewards.reward_display);
    }

    // @ts-ignore
    getAvailableVariants() {
        return [defaultBuildingVariant];
    }

    static getAllVariantCombinations() {
        const variants = [];
        for (let i = arrayDisplayRotationVariantToType.length - 1; i >= 0; --i) {
            variants.unshift({
                variant: defaultBuildingVariant,
                name: "Advanced Display",
                description: "Multi-tile pixel display for use with controllers",
                rotationVariant: i,
            });
        }

        return variants;
    }

    // @ts-ignore
    getShowWiresLayerPreview() {
        return true;
    }

    // @ts-ignore
    setupEntityComponents(entity) {
        entity.addComponent(new AdvancedDisplayComponent());
    }

    // @ts-ignore
    getRotateAutomaticallyWhilePlacing(variant) {
        return variant == defaultBuildingVariant;
    }

    // @ts-ignore
    getPreviewSprite(rotationVariant, variant, building = true) {
        if (variant !== defaultBuildingVariant) {
            return super.getPreviewSprite(rotationVariant, variant);
        }

        return Loader.getSprite(
            `sprites/${building ? "buildings" : "blueprints"}/displays/wireless_display-${
                arrayDisplayRotationVariantToType[rotationVariant]
            }.png`
        );
    }

    // @ts-ignore
    getBlueprintSprite(rotationVariant, variant) {
        return this.getPreviewSprite(rotationVariant, variant, false);
    }

    // @ts-ignore
    getSprite(rotationVariant, variant) {
        return this.getPreviewSprite(rotationVariant, variant, true);
    }

    // @ts-ignore
    computeOptimalDirectionAndRotationVariantAtTile({ root, tile, rotation, variant, layer }) {
        if (variant !== defaultBuildingVariant) {
            return super.computeOptimalDirectionAndRotationVariantAtTile({
                root,
                tile,
                rotation,
                variant,
                layer,
            });
        }

        const connections = {
            top: root.logic.computeDisplayEdgeStatus({ tile, edge: enumDirection.top }),
            right: root.logic.computeDisplayEdgeStatus({ tile, edge: enumDirection.right }),
            bottom: root.logic.computeDisplayEdgeStatus({ tile, edge: enumDirection.bottom }),
            left: root.logic.computeDisplayEdgeStatus({ tile, edge: enumDirection.left }),
        };

        let flag = 0;
        flag |= connections.top ? 0 : 0x1000;
        flag |= connections.right ? 0 : 0x100;
        flag |= connections.bottom ? 0 : 0x10;
        flag |= connections.left ? 0 : 0x1;
        let targetType = enumDisplayType.none;

        rotation = 0;

        switch (flag) {
            case 0x0000:
                // Nothing
                break;

            case 0x0001:
                // Left
                targetType = enumDisplayType.side;
                rotation -= 90;
                break;

            case 0x0010:
                // Bottom
                targetType = enumDisplayType.side;
                rotation += 180;
                break;

            case 0x0011:
                // Bottom | Left
                targetType = enumDisplayType.corner;
                break;

            case 0x0100:
                // Right
                targetType = enumDisplayType.side;
                rotation += 90;
                break;

            case 0x0101:
                // Right | Left
                targetType = enumDisplayType.sides;
                break;

            case 0x0110:
                // Right | Bottom
                targetType = enumDisplayType.corner;
                rotation -= 90;
                break;

            case 0x0111:
                // Right | Bottom | Left
                targetType = enumDisplayType.around;
                rotation -= 90;
                break;

            case 0x1000:
                // Top
                targetType = enumDisplayType.side;
                break;

            case 0x1001:
                // Top | Left
                targetType = enumDisplayType.corner;
                rotation += 90;
                break;

            case 0x1010:
                // Top | Bottom
                targetType = enumDisplayType.sides;
                rotation += 90;
                break;

            case 0x1011:
                // Top | Bottom | Left
                targetType = enumDisplayType.around;
                break;

            case 0x1100:
                // Top | Right
                targetType = enumDisplayType.corner;
                rotation += 180;
                break;

            case 0x1101:
                // Top | Right | Left
                targetType = enumDisplayType.around;
                rotation += 90;
                break;

            case 0x1110:
                // Top | Right | Bottom
                targetType = enumDisplayType.around;
                rotation += 180;
                break;

            case 0x1111:
                // Top | Right | Bottom | Left
                targetType = enumDisplayType.full;
                break;
        }

        return {
            // Clamp rotation
            rotation: ((rotation % 360) + 360) % 360,
            rotationVariant: arrayDisplayRotationVariantToType.indexOf(targetType),
        };
    }

    // @ts-ignore
    updateVariants(entity, rotationVariant, variant) {
        const gateType = arrayDisplayRotationVariantToType[rotationVariant];
        AdvancedDisplayComponent.get(entity).type = gateType;
    }
}
