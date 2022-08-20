import { Mod } from "shapez/mods/mod";

class ModImpl extends Mod {
    init() {
        this.modInterface.runAfterMethod(shapez.MapView, "drawWiresForegroundLayer", function (parameters) {
            this.drawVisibleChunks(parameters, shapez.MapChunkView.prototype["drawWiredPins"]);
        });

        this.modInterface.extendClass(shapez.MapChunkView, ({ $super, $old }) => ({
            drawWiresForegroundLayer(parameters) {
                const systems = this.root.systemMgr.systems;
                systems.wire.drawChunk(parameters, this);
                systems.staticMapEntities.drawWiresChunk(parameters, this);
            },

            drawWiredPins(parameters) {
                const systems = this.root.systemMgr.systems;
                systems.wiredPins.drawChunk(parameters, this);
            },
        }));
    }
}
