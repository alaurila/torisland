import { createWorldSimulation } from "./world-simulation.js";
import { createStoryEngine } from "./story-engine.js";
import { createTextGenerator } from "./text-generator.js";
import { createStorage } from "./storage.js";
import { createUi } from "./ui.js";

function startApp() {
  const storage = createStorage();
  const worldSimulation = createWorldSimulation();
  const storyEngine = createStoryEngine();
  const textGenerator = createTextGenerator();
  const ui = createUi(document);

  // Riippuvuudet kootaan täällä. Varsinainen maailmantila lisätään kohdassa 2.
  const app = {
    storage,
    worldSimulation,
    storyEngine,
    textGenerator,
    ui,
  };

  app.ui.setStatus("Sovellus valmis");
}

startApp();
