import { Entity } from "shapez/game/entity";

/**
 * @typedef {{
 * lastUpdate: number,
 * internalId: string,
 * name: string|null;
 * starred: boolean;
 * }} FunctionMetadata
 *
 *
 * @typedef {{
 *   camera: any,
 *   waypoints: any,
 *   bounds: { w: number; h: number; },
 *   entities: Array<Entity>,
 *   beltPaths: Array<any>,
 * }} SerializedFunctionData
 *
 */

export const functionsMenuStateId = "FunctionMenuState";
export const functionsGameModeId = "functionsGameMode";
export const functionsGameModeType = "functionModeType";
