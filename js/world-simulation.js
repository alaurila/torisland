import { applyEventConsequences } from "./consequences.js";
import { generateEvent } from "./events.js";
import { changeRelation, createRelation, getRelation } from "./relations.js";
import {
  assertNumber,
  assertObject,
  assertString,
  createId,
  validateWorldState,
} from "./validation.js";

const MIN_RANDOMNESS = 0.15;
const INITIAL_RANDOMNESS = 0.8;

/** Vastaa kokonaisen maailmanvuoron suorittamisesta oikeassa järjestyksessä. */
export function createWorldSimulation({ storyEngine, questEngine = null, random = Math.random } = {}) {
  if (!storyEngine?.findSituations) throw new TypeError("Simulaatio tarvitsee storyEnginen.");
  if (typeof random !== "function") throw new TypeError("random pitää olla funktio.");

  return {
    advance(worldState, { playerDecision = null, advanceDay = true } = {}) {
      if (advanceDay) worldState.day += 1;
      if (playerDecision) applyPlayerDecision(worldState, playerDecision);

      const randomness = historyRandomness(worldState);
      const goalUpdates = pursueCharacterGoals(worldState, random, randomness);
      const hasOpenConflict = worldState.conflicts.some(({ status }) => status === "unresolved");
      const event = hasOpenConflict
        ? generateEvent(worldState, random, { randomness })
        : null;
      if (event) applyEventConsequences(worldState, event);
      const situations = storyEngine.findSituations(worldState);
      const quests = questEngine?.formQuests?.(worldState, situations) ?? worldState.activeQuests;
      worldState.activeQuests = quests;

      validateWorldState(worldState);
      return {
        day: worldState.day,
        goalUpdates,
        event,
        situations,
        quests,
        randomness,
        stages: ["goals", "events", "consequences", "situations", "quests"],
      };
    },
  };
}

/** Hahmot edistävät tavoitteitaan prioriteetin ja historian määrän perusteella. */
export function pursueCharacterGoals(worldState, random = Math.random, randomness = 1) {
  return worldState.characters.map((character) => {
    const previousProgress = character.goal.progress ?? 0;
    const baseProgress = 1 + Math.floor(character.goal.priority / 30);
    const randomBonus = random() < randomness ? Math.floor(random() * 3) : 0;
    character.goal.progress = clamp(previousProgress + baseProgress + randomBonus, 0, 100);
    return {
      characterId: character.id,
      previousProgress,
      progress: character.goal.progress,
    };
  });
}

/**
 * Soveltaa edellisen tehtävän tai pelaajan valinnan rakenteiset vaikutukset
 * ennen uuden vuoron tapahtumia.
 */
export function applyPlayerDecision(worldState, decision) {
  assertObject(decision, "playerDecision");
  assertString(decision.description, "playerDecision.description");
  const relationChanges = decision.relationChanges ?? [];
  const conflictChanges = decision.conflictChanges ?? [];
  const goalChanges = decision.goalChanges ?? [];
  if (!Array.isArray(relationChanges) || !Array.isArray(conflictChanges) || !Array.isArray(goalChanges)) {
    throw new TypeError("Pelaajapäätöksen muutosten pitää olla taulukoita.");
  }

  for (const change of relationChanges) {
    assertNumber(change.delta, "playerDecision.relationChanges.delta");
    if (getRelation(worldState, change.sourceId, change.targetId)) {
      changeRelation(
        worldState,
        change.sourceId,
        change.targetId,
        change.delta,
        decision.description,
      );
    } else {
      worldState.relations.push(createRelation({
        sourceId: change.sourceId,
        targetId: change.targetId,
        value: clamp(change.delta, -100, 100),
        reason: decision.description,
        day: worldState.day,
      }));
    }
  }

  for (const change of conflictChanges) {
    assertNumber(change.urgencyDelta, "playerDecision.conflictChanges.urgencyDelta");
    const conflict = worldState.conflicts.find(({ id }) => id === change.conflictId);
    if (!conflict) throw new Error(`Konfliktia ${change.conflictId} ei löytynyt.`);
    conflict.urgency = clamp(conflict.urgency + change.urgencyDelta, 0, 100);
    if (conflict.urgency === 0) conflict.status = "resolved";
  }

  const goalOwners = [...worldState.characters, ...worldState.factions];
  for (const change of goalChanges) {
    assertNumber(change.progressDelta, "playerDecision.goalChanges.progressDelta");
    const owner = goalOwners.find(({ id }) => id === change.entityId);
    if (!owner?.goal) throw new Error(`Tavoitteen omistajaa ${change.entityId} ei löytynyt.`);
    owner.goal.progress = clamp((owner.goal.progress ?? 0) + change.progressDelta, 0, 100);
  }

  const recordedDecision = {
    id: decision.id ?? createId("decision"),
    day: worldState.day,
    description: decision.description,
    relationChanges: relationChanges.map((change) => ({ ...change })),
    conflictChanges: conflictChanges.map((change) => ({ ...change })),
    goalChanges: goalChanges.map((change) => ({ ...change })),
  };
  worldState.playerDecisions.push(recordedDecision);
  validateWorldState(worldState);
  return recordedDecision;
}

/** Satunnaisuuden osuus pienenee, kun varsinaista tapahtumahistoriaa kertyy. */
export function historyRandomness(worldState) {
  const eventCount = worldState.events.filter(({ historical }) => !historical).length;
  return Math.max(MIN_RANDOMNESS, INITIAL_RANDOMNESS - eventCount * 0.06);
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}
