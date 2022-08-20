import { CustomSerializer } from "./customSerializer";

export class WaypointSerializer extends CustomSerializer {
    constructor() {
        super("waypoints", "w");
    }

    serialize(data) {
        const serializedData = [];

        for (const waypoint of data.waypoints) {
            serializedData.push([waypoint.label, [waypoint.center.x, waypoint.center.y], waypoint.zoomLevel]);
        }

        return serializedData;
    }

    deserialize(data) {
        // Deserialize and return the data
        return data;
    }
}
