// @ts-nocheck
import { globalConfig } from "shapez/core/config";
import { lerp } from "shapez/core/utils";
import { BeltReaderSystem } from "shapez/game/systems/belt_reader";
import { StorageSystem } from "shapez/game/systems/storage";

export function patchNumbers(modInterface) {
    modInterface.replaceMethod(BeltReaderSystem, "update", function ($original) {
        const now = this.root.time.now();
        const minimumTime = now - globalConfig.readerAnalyzeIntervalSeconds;
        for (let i = 0; i < this.allEntities.length; ++i) {
            const entity = this.allEntities[i];
            const readerComp = entity.components.BeltReader;
            const pinsComp = entity.components.WiredPins;

            // Remove outdated items
            while (readerComp.lastItemTimes[0] < minimumTime) {
                readerComp.lastItemTimes.shift();
            }

            if (now - readerComp.lastThroughputComputation > 0.5) {
                // Compute throughput
                readerComp.lastThroughputComputation = now;

                let throughput = 0;
                if (readerComp.lastItemTimes.length < 2) {
                    throughput = 0;
                } else {
                    let averageSpacing = 0;
                    let averageSpacingNum = 0;
                    for (let i = 0; i < readerComp.lastItemTimes.length - 1; ++i) {
                        averageSpacing += readerComp.lastItemTimes[i + 1] - readerComp.lastItemTimes[i];
                        ++averageSpacingNum;
                    }

                    throughput = 1 / (averageSpacing / averageSpacingNum);
                }

                readerComp.lastThroughput = Math.min(globalConfig.beltSpeedItemsPerSecond * 23.9, throughput);
            }

            if (pinsComp) {
                pinsComp.slots[1].value = readerComp.lastItem;
                pinsComp.slots[0].value = globalConfig["numberManager"].getItem(readerComp.lastThroughput);
            }
        }
    });

    modInterface.replaceMethod(StorageSystem, "update", function ($original) {
        for (let i = 0; i < this.allEntities.length; ++i) {
            const entity = this.allEntities[i];
            const storageComp = entity.components.Storage;
            const pinsComp = entity.components.WiredPins;

            // Eject from storage
            if (storageComp.storedItem && storageComp.storedCount > 0) {
                const ejectorComp = entity.components.ItemEjector;

                const nextSlot = ejectorComp.getFirstFreeSlot();
                if (nextSlot !== null) {
                    if (ejectorComp.tryEject(nextSlot, storageComp.storedItem)) {
                        storageComp.storedCount--;

                        if (storageComp.storedCount === 0) {
                            storageComp.storedItem = null;
                        }
                    }
                }
            }

            let targetAlpha = storageComp.storedCount > 0 ? 1 : 0;
            storageComp.overlayOpacity = lerp(storageComp.overlayOpacity, targetAlpha, 0.05);

            // a wired pins component is not guaranteed, but if its there, set the value
            if (pinsComp) {
                pinsComp.slots[0].value = storageComp.storedItem;
                pinsComp.slots[1].value = globalConfig["numberManager"].getItem(storageComp.storedCount);
            }
        }
    });
}
