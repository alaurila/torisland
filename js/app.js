import { createWorldSimulation } from "./world-simulation.js";
import { createStoryEngine } from "./story-engine.js";
import { createTextGenerator } from "./text-generator.js";
import { createStorage } from "./storage.js";
import { createUi } from "./ui.js";
import { generateNewcomer, generateWorld } from "./world-generator.js";
import { createQuestEngine } from "./quest-engine.js";
import { updateCharacterGoal, updateCharacterIdentity } from "./world-state.js";

function startApp() {
  const storage = createStorage();
  const storyEngine = createStoryEngine();
  const questEngine = createQuestEngine();
  const worldSimulation = createWorldSimulation({ storyEngine, questEngine });
  const textGenerator = createTextGenerator();
  const ui = createUi(document);
  const worldState = generateWorld();
  worldSimulation.advance(worldState, { advanceDay: false });

  // Riippuvuudet ja nykyinen maailmantila kootaan sovelluksen juureen.
  const app = {
    storage,
    worldSimulation,
    storyEngine,
    questEngine,
    textGenerator,
    ui,
    worldState,
  };

  app.ui.renderWorldSummary(app.worldState);
  app.ui.setStatus(`${app.worldState.activeSituations.length} tilannetta löydetty`);
  app.ui.bindAdvance(() => {
    const result = app.worldSimulation.advance(app.worldState);
    app.ui.renderWorldSummary(app.worldState);
    app.ui.setStatus(
      `Päivä ${result.day} — satunnaisuus ${Math.round(result.randomness * 100)} %`,
    );
  });
  app.ui.bindSituationGeneration(() => {
    const situations = app.storyEngine.findSituations(app.worldState);
    app.questEngine.formQuests(app.worldState, situations);
    app.ui.renderWorldSummary(app.worldState);
    app.ui.setStatus(`${situations.length} tilannetta tunnistettu`);
  });
  app.ui.bindQuestResolution((questId, actionId) => {
    const { quest } = app.questEngine.resolveQuest(app.worldState, questId, actionId);
    const situations = app.storyEngine.findSituations(app.worldState);
    app.questEngine.formQuests(app.worldState, situations);
    app.ui.renderWorldSummary(app.worldState);
    app.ui.setStatus(`Tehtävä ratkaistu: ${quest.title}`);
  });
  app.ui.bindCharacterUpdate((characterId, identity) => {
    const character = updateCharacterIdentity(app.worldState, characterId, identity);
    const situations = app.storyEngine.findSituations(app.worldState);
    app.questEngine.formQuests(app.worldState, situations);
    app.ui.renderWorldSummary(app.worldState);
    app.ui.setStatus(`Hahmon tiedot päivitetty: ${character.name}`);
  });
  app.ui.bindCharacterCreation(() => {
    const character = generateNewcomer(app.worldState);
    app.ui.renderWorldSummary(app.worldState);
    app.ui.showPerson(character.id);
    app.ui.setStatus(`Uusi henkilö saapui kylään: ${character.name}`);
  });
  app.ui.bindCharacterGoalUpdate((characterId, goalType) => {
    const character = updateCharacterGoal(app.worldState, characterId, goalType);
    app.ui.renderWorldSummary(app.worldState);
    app.ui.showPerson(character.id);
    app.ui.setStatus(`Uusi tavoite asetettu: ${character.name} haluaa ${character.goal.label}`);
  });
}

startApp();
