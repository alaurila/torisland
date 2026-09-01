import { createConflict } from "./conflicts.js";
import { createRelation, getRelation, changeRelation } from "./relations.js";
import {
  createId,
  validateWorldState,
} from "./validation.js";

const CONSEQUENCES = Object.freeze({
  argument: profile(-12, 35, 3, -3, 8),
  robbery: profile(-35, 80, 8, -15, 15, -1, true),
  theft: profile(-25, 65, 6, -10, 12, -1, true),
  helpRequest: profile(8, 30, 5, 1, -15, 1),
  threat: profile(-25, 70, 5, -8, 12, 0, true),
  betrayal: profile(-45, 90, 10, -10, 18, 0, true),
  reconciliation: profile(20, 45, 5, 3, -20),
  secretReveal: profile(-15, 60, 8, -2, 10),
  debtDemand: profile(-10, 55, 6, -2, 8),
  factionClash: profile(-30, 75, 10, -12, 15, 0, true),
});

/** Soveltaa tapahtuman seuraukset maailmaan täsmälleen kerran. */
export function applyEventConsequences(worldState, event) {
  if (event.historical) return event;
  if (event.consequencesApplied) {
    throw new Error(`Tapahtuman ${event.id} seuraukset on jo käsitelty.`);
  }

  const consequence = CONSEQUENCES[event.type];
  if (!consequence) throw new Error(`Tapahtumatyypille "${event.type}" ei ole seurauksia.`);
  const entities = new Map(
    [...worldState.characters, ...worldState.factions].map((entity) => [entity.id, entity]),
  );
  const actor = entities.get(event.actorId);
  const target = entities.get(event.targetId);
  if (!actor || !target) throw new Error(`Tapahtuman ${event.id} osapuolia ei löytynyt.`);

  event.effects = [];
  updateRelations(worldState, event, actor, target, consequence);
  createMemories(worldState, event, consequence);
  createKnowledge(worldState, event);
  updateGoals(actor, target, consequence, event);
  updateResources(worldState, event, consequence);
  updateLocation(worldState, event, consequence);
  updateConflicts(worldState, event, actor, target, consequence);
  revealSecrets(worldState, event);

  event.consequencesApplied = true;
  validateWorldState(worldState);
  return event;
}

function updateRelations(worldState, event, actor, target, consequence) {
  const reason = event.summary;
  changeOrCreateRelation(
    worldState,
    target.id,
    actor.id,
    consequence.relationDelta,
    reason,
  );
  changeOrCreateRelation(
    worldState,
    actor.id,
    target.id,
    Math.trunc(consequence.relationDelta / 2),
    reason,
  );
  event.effects.push(
    `${target.name} → ${actor.name}: suhde ${signed(consequence.relationDelta)}`,
  );
}

function changeOrCreateRelation(worldState, sourceId, targetId, delta, reason) {
  if (getRelation(worldState, sourceId, targetId)) {
    return changeRelation(worldState, sourceId, targetId, delta, reason);
  }
  const relation = createRelation({
    sourceId,
    targetId,
    value: clamp(delta, -100, 100),
    reason,
    day: worldState.day,
  });
  worldState.relations.push(relation);
  return relation.value;
}

function createMemories(worldState, event, consequence) {
  const characterIds = new Set(worldState.characters.map(({ id }) => id));
  const participants = [
    { ownerId: event.actorId, targetId: event.targetId, strength: consequence.memoryStrength },
    { ownerId: event.targetId, targetId: event.actorId, strength: consequence.memoryStrength },
    ...event.witnessIds.map((ownerId) => ({
      ownerId,
      targetId: event.actorId,
      strength: Math.max(10, consequence.memoryStrength - 25),
    })),
  ];

  for (const memory of participants) {
    if (!characterIds.has(memory.ownerId)) continue;
    worldState.memories.push({
      id: createId("memory"),
      ownerId: memory.ownerId,
      type: event.type,
      targetId: memory.targetId,
      eventId: event.id,
      strength: memory.strength,
      reason: event.summary,
      day: event.day,
    });
  }
  event.effects.push(`${participants.filter(({ ownerId }) => characterIds.has(ownerId)).length} uutta muistoa`);
}

function createKnowledge(worldState, event) {
  const characterIds = new Set(worldState.characters.map(({ id }) => id));
  const knowers = [...new Set([event.actorId, event.targetId, ...event.witnessIds])]
    .filter((id) => characterIds.has(id));

  for (const knowerId of knowers) {
    worldState.knowledge.push(knowledge("eventKnown", knowerId, event.id, null, event.day));
    for (const witnessId of event.witnessIds) {
      if (witnessId !== knowerId) {
        worldState.knowledge.push(
          knowledge("witnessKnown", knowerId, event.id, witnessId, event.day),
        );
      }
    }
  }
  event.effects.push(`${knowers.length} hahmoa tietää tapahtumasta`);
}

function knowledge(type, knowerId, eventId, subjectId, day) {
  return {
    id: createId("knowledge"),
    type,
    knowerId,
    eventId,
    subjectId,
    day,
  };
}

function updateGoals(actor, target, consequence, event) {
  const actorProgress = changeGoalProgress(actor, consequence.goalProgress);
  const targetProgress = changeGoalProgress(target, -Math.trunc(consequence.goalProgress / 2));
  if (actorProgress !== null) event.effects.push(`${actor.name}: tavoite ${actorProgress}/100`);
  if (targetProgress !== null) event.effects.push(`${target.name}: tavoite ${targetProgress}/100`);
}

function changeGoalProgress(entity, delta) {
  if (!entity.goal) return null;
  entity.goal.progress = clamp((entity.goal.progress ?? 0) + delta, 0, 100);
  return entity.goal.progress;
}

function updateResources(worldState, event, consequence) {
  if (consequence.resourceDelta === 0 || !event.conflictId) return;
  const conflict = worldState.conflicts.find(({ id }) => id === event.conflictId);
  const resources = worldState.resources.filter((resource) =>
    conflict?.sourceIds.includes(resource.id));

  for (const resource of resources) {
    resource.quantity = Math.max(0, resource.quantity + consequence.resourceDelta);
    resource.scarce = resource.quantity === 0;
    event.effects.push(`${resource.name}: määrä ${signed(consequence.resourceDelta)}`);
    if (resource.quantity > 0 && conflict.type === "missingResource") {
      conflict.urgency = 0;
      conflict.status = "resolved";
      event.effects.push("Kadonneen resurssin konflikti ratkesi");
    }
  }
}

function updateLocation(worldState, event, consequence) {
  const location = worldState.locations.find(({ id }) => id === event.locationId);
  if (!location) return;
  location.safety = clamp(location.safety + consequence.safetyDelta, -100, 100);
  event.effects.push(`${location.name}: turvallisuus ${signed(consequence.safetyDelta)}`);
}

function updateConflicts(worldState, event, actor, target, consequence) {
  const conflict = worldState.conflicts.find(({ id }) => id === event.conflictId);
  if (conflict) {
    conflict.urgency = clamp(conflict.urgency + consequence.urgencyDelta, 0, 100);
    if (conflict.urgency === 0) conflict.status = "resolved";
    if (!conflict.sourceIds.includes(event.id)) conflict.sourceIds.push(event.id);
    event.effects.push(`Konfliktin kiireellisyys ${conflict.urgency}/100`);
  }

  const hasFallout = worldState.conflicts.some(
    (candidate) =>
      candidate.type === "eventFallout" &&
      candidate.status === "unresolved" &&
      actor.id === candidate.partyIds[0] &&
      target.id === candidate.partyIds[1],
  );
  if (consequence.createsConflict && !hasFallout) {
    worldState.conflicts.push(
      createConflict({
        type: "eventFallout",
        partyIds: [actor.id, target.id],
        reason: `Tapahtuma synnytti uuden konfliktin: ${event.summary}`,
        locationId: event.locationId,
        urgency: Math.max(40, consequence.memoryStrength),
        sourceIds: [event.id],
      }),
    );
    event.effects.push("Uusi konflikti syntyi");
  }
}

function revealSecrets(worldState, event) {
  if (event.type !== "secretReveal") return;
  for (const secret of worldState.secrets) {
    if (secret.knownByIds.includes(event.actorId) && secret.subjectIds.includes(event.targetId)) {
      secret.revealed = true;
      event.effects.push("Salaisuus paljastui");
    }
  }
}

function profile(
  relationDelta,
  memoryStrength,
  goalProgress,
  safetyDelta,
  urgencyDelta,
  resourceDelta = 0,
  createsConflict = false,
) {
  return Object.freeze({
    relationDelta,
    memoryStrength,
    goalProgress,
    safetyDelta,
    urgencyDelta,
    resourceDelta,
    createsConflict,
  });
}

function signed(value) {
  return value > 0 ? `+${value}` : `${value}`;
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}
