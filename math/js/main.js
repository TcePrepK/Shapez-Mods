import { Mod } from "shapez/mods/mod";
import { MODS } from "shapez/mods/modloader";
import { BasicMathGates } from "./buildings/basicMath";
import { ComplexMathGates } from "./buildings/complexMath";
import { RandomNumberGenerator } from "./buildings/randomNumberGenerator";
import { SeedProvider } from "./buildings/seedProvider";
import { BasicMathComponent } from "./components/basicMath";
import { ComplexMathComponent } from "./components/complexMath";
import { RandomNumberGeneratorComponent } from "./components/randomNumberGenerator";
import { SeedProviderComponent } from "./components/seedProvider";
import { BasicMathSystem } from "./systems/basicMath";
import { ComplexMathSystem } from "./systems/complexMath";
import { RandomNumberGeneratorSystem } from "./systems/randomNumberGenerator";
import { SeedProviderSystem } from "./systems/seedProvider";

class ModImpl extends Mod {
    init() {
        if (!MODS.mods.find(x => x.metadata.id === "numbersLib")) {
            console.log(window.open("https://shapez.mod.io/number-library"));
            throw "MathGates mod requires Numbers Library mod to work! Please get that mod first.";
        }

        // COMPONENTS
        this.modInterface.registerComponent(BasicMathComponent);
        this.modInterface.registerComponent(ComplexMathComponent);
        this.modInterface.registerComponent(SeedProviderComponent);
        this.modInterface.registerComponent(RandomNumberGeneratorComponent);
        // COMPONENTS

        // BUIlDINGS
        this.modInterface.registerNewBuilding({
            metaClass: BasicMathGates,
        });

        this.modInterface.registerNewBuilding({
            metaClass: ComplexMathGates,
        });

        this.modInterface.registerNewBuilding({
            metaClass: SeedProvider,
        });

        this.modInterface.registerNewBuilding({
            metaClass: RandomNumberGenerator,
        });
        // BUIlDINGS

        // SYSTEMS
        this.modInterface.registerGameSystem({
            id: "BasicMathSystem",
            systemClass: BasicMathSystem,

            before: "belt",
            // drawHooks: ["staticAfter"],
        });

        this.modInterface.registerGameSystem({
            id: "ComplexMathSystem",
            systemClass: ComplexMathSystem,

            before: "belt",
            // drawHooks: ["staticAfter"],
        });

        this.modInterface.registerGameSystem({
            id: "SeedProviderSystem",
            systemClass: SeedProviderSystem,

            before: "belt",
            // drawHooks: ["staticAfter"],
        });

        this.modInterface.registerGameSystem({
            id: "RandomNumberGeneratorSystem",
            systemClass: RandomNumberGeneratorSystem,

            before: "belt",
            // drawHooks: ["staticAfter"],
        });
        // SYSTEMS

        // TOOLBAR
        this.modInterface.addNewBuildingToToolbar({
            toolbar: "wires",
            location: "primary",
            metaClass: BasicMathGates,
        });

        this.modInterface.addNewBuildingToToolbar({
            toolbar: "wires",
            location: "primary",
            metaClass: ComplexMathGates,
        });

        this.modInterface.addNewBuildingToToolbar({
            toolbar: "wires",
            location: "secondary",
            metaClass: SeedProvider,
        });

        this.modInterface.addNewBuildingToToolbar({
            toolbar: "wires",
            location: "secondary",
            metaClass: RandomNumberGenerator,
        });
        // TOOLBAR
    }
}
