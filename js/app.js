import { createWorldSimulation } from "./world-simulation.js";
import { createStoryEngine } from "./story-engine.js";
import { createTextGenerator } from "./text-generator.js";
import { createStorage } from "./storage.js";
import { createUi } from "./ui.js";
import { createWorldState } from "./world-state.js";

function startApp() {
  const storage = createStorage();
  const worldSimulation = createWorldSimulation();
  const storyEngine = createStoryEngine();
  const textGenerator = createTextGenerator();
  const ui = createUi(document);
  const worldState = createWorldState();

  // Riippuvuudet ja nykyinen maailmantila kootaan sovelluksen juureen.
  const app = {
    storage,
    worldSimulation,
    storyEngine,
    textGenerator,
    ui,
    worldState,
  };

  app.ui.setStatus("Sovellus valmis");
}

startApp();
