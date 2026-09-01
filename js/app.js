import { createWorldSimulation } from "./world-simulation.js";
import { createStoryEngine } from "./story-engine.js";
import { createTextGenerator } from "./text-generator.js";
import { createStorage } from "./storage.js";
import { createUi } from "./ui.js";
import { generateWorld } from "./world-generator.js";
import { generateEvent } from "./events.js";
import { applyEventConsequences } from "./consequences.js";

function startApp() {
  const storage = createStorage();
  const worldSimulation = createWorldSimulation();
  const storyEngine = createStoryEngine();
  const textGenerator = createTextGenerator();
  const ui = createUi(document);
  const worldState = generateWorld();
  const event = generateEvent(worldState);
  applyEventConsequences(worldState, event);
  storyEngine.findSituations(worldState);

  // Riippuvuudet ja nykyinen maailmantila kootaan sovelluksen juureen.
  const app = {
    storage,
    worldSimulation,
    storyEngine,
    textGenerator,
    ui,
    worldState,
  };

  app.ui.renderWorldSummary(app.worldState);
  app.ui.setStatus(`${app.worldState.activeSituations.length} tilannetta löydetty`);
}

startApp();
