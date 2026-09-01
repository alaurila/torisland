import { relationScore } from "./relations.js";
import {
  assertBoolean,
  assertOptionalId,
  assertString,
  assertStringArray,
  createId,
  validateWorldState,
} from "./validation.js";

export const EVENT_TEMPLATES = Object.freeze([
  template("argument", "Riita", { relationBelow: 0 }, ({ actor, target }) =>
    `${actor.name} ajautui kiivaaseen riitaan osapuolen ${target.name} kanssa.`),
  template("robbery", "Ryöstö", { conflictTypes: ["missingResource"], relationBelow: 20 }, ({ actor, target }) =>
    `${actor.name} ryösti osapuolen ${target.name} etsiessään kadonnutta resurssia.`),
  template("theft", "Varkaus", { conflictTypes: ["missingResource"] }, ({ actor, target }) =>
    `${actor.name} jäi kiinni yrittäessään varastaa osapuolelta ${target.name}.`),
  template("helpRequest", "Avunpyyntö", { conflictTypes: ["missingResource", "unpaidDebt"] }, ({ actor, target }) =>
    `${actor.name} pyysi osapuolelta ${target.name} apua ratkaisemattomaan ongelmaan.`),
  template("threat", "Uhkaus", { conflictTypes: ["unpaidDebt", "conflictingGoals"] }, ({ actor, target }) =>
    `${actor.name} uhkasi osapuolta ${target.name} saadakseen tahtonsa läpi.`),
  template("betrayal", "Petos", { relationBelow: -25 }, ({ actor, target }) =>
    `${actor.name} petti osapuolen ${target.name} luottamuksen.`),
  template("reconciliation", "Sovintoyritys", { relationBelow: -15 }, ({ actor, target }) =>
    `${actor.name} tarjosi sovintoa osapuolelle ${target.name}.`),
  template("secretReveal", "Salaisuuden paljastuminen", { requiresSecret: true }, ({ actor, target }) =>
    `${actor.name} paljasti osapuolta ${target.name} koskevan salaisuuden.`),
  template("debtDemand", "Velan perintä", { conflictTypes: ["unpaidDebt"], requiresDebt: true }, ({ actor, target }) =>
    `${actor.name} vaati osapuolta ${target.name} maksamaan vanhan velkansa.`),
  template("factionClash", "Valtataistelu", { conflictTypes: ["conflictingGoals"] }, ({ actor, target }) =>
    `${actor.name} haastoi osapuolen ${target.name} vallan julkisesti.`),
]);

/** Luo yhden maailman tapahtumalokiin sopivan tapahtuman. */
export function createEvent({
  id = createId("event"),
  type,
  actorId,
  targetId,
  locationId,
  witnessIds = [],
  day,
  summary,
  templateId = null,
  conflictId = null,
  historical = false,
  consequencesApplied = false,
  effects = [],
} = {}) {
  assertString(id, "event.id");
  assertString(type, "event.type");
  assertString(actorId, "event.actorId");
  assertString(targetId, "event.targetId");
  if (actorId === targetId) throw new Error("Tapahtuman toimija ja kohde eivät voi olla samat.");
  assertString(locationId, "event.locationId");
  assertStringArray(witnessIds, "event.witnessIds");
  if (!Number.isInteger(day) || day < 0) {
    throw new RangeError("event.day pitää olla nolla tai positiivinen kokonaisluku.");
  }
  assertString(summary, "event.summary");
  assertOptionalId(templateId, "event.templateId");
  assertOptionalId(conflictId, "event.conflictId");
  assertBoolean(historical, "event.historical");
  assertBoolean(consequencesApplied, "event.consequencesApplied");
  assertStringArray(effects, "event.effects");

  return {
    id,
    type,
    actorId,
    targetId,
    locationId,
    witnessIds: [...new Set(witnessIds)],
    day,
    summary,
    templateId,
    conflictId,
    historical,
    consequencesApplied,
    effects: [...effects],
  };
}

/**
 * Valitsee maailman aktiivisista konflikteista kelvollisen tapahtuman ja lisää
 * sen tapahtumahistoriaan.
 */
export function generateEvent(worldState, random = Math.random) {
  if (typeof random !== "function") throw new TypeError("random pitää olla funktio.");
  const entities = entityMap(worldState);
  const candidates = [];

  for (const conflict of worldState.conflicts.filter(({ status }) => status === "unresolved")) {
    const [actorId, targetId] = conflict.partyIds;
    const context = createContext(worldState, conflict, actorId, targetId, entities);

    for (const eventTemplate of EVENT_TEMPLATES) {
      if (isTemplateEligible(eventTemplate, context)) {
        candidates.push({
          context,
          eventTemplate,
          weight: candidateWeight(context),
        });
      }
    }
  }

  if (candidates.length === 0) {
    throw new Error("Maailman tilaan sopivaa tapahtumatemplatea ei löytynyt.");
  }

  const selected = weightedPick(candidates, random);
  const { context, eventTemplate } = selected;
  const event = createEvent({
    type: eventTemplate.type,
    actorId: context.actor.id,
    targetId: context.target.id,
    locationId: context.conflict.locationId,
    witnessIds: findWitnesses(worldState, context, random),
    day: worldState.day,
    summary: eventTemplate.render(context),
    templateId: eventTemplate.id,
    conflictId: context.conflict.id,
  });

  worldState.events.push(event);
  validateWorldState(worldState);
  return event;
}

/** Tarkistaa templaten deklaratiiviset vaatimukset annettua tilannetta vasten. */
export function isTemplateEligible(eventTemplate, context) {
  const requirements = eventTemplate.requirements;
  if (
    requirements.conflictTypes &&
    !requirements.conflictTypes.includes(context.conflict.type)
  ) return false;
  if (
    requirements.relationBelow !== undefined &&
    context.relation >= requirements.relationBelow
  ) return false;
  if (requirements.requiresDebt && !context.hasDebt) return false;
  if (requirements.requiresSecret && !context.hasSecret) return false;
  return true;
}

function template(type, title, requirements, render) {
  return Object.freeze({ id: `event-template-${type}`, type, title, requirements, render });
}

function createContext(worldState, conflict, actorId, targetId, entities) {
  const actor = entities.get(actorId);
  const target = entities.get(targetId);
  if (!actor || !target) throw new Error(`Konfliktin ${conflict.id} osapuolta ei löytynyt.`);

  const directRelation = relationScore(worldState, actorId, targetId);
  const reverseRelation = relationScore(worldState, targetId, actorId);
  const relation = Math.abs(directRelation) >= Math.abs(reverseRelation)
    ? directRelation
    : reverseRelation;
  const hasDebt = worldState.debts.some(
    (debt) =>
      !debt.settled &&
      ((debt.debtorId === actorId && debt.creditorId === targetId) ||
        (debt.debtorId === targetId && debt.creditorId === actorId)),
  );
  const hasSecret = worldState.secrets.some(
    (secret) =>
      !secret.revealed &&
      secret.knownByIds.includes(actorId) &&
      secret.subjectIds.includes(targetId),
  );

  return { worldState, conflict, actor, target, relation, hasDebt, hasSecret };
}

function candidateWeight({ conflict, actor, target, relation }) {
  const goalPressure = [actor.goal?.priority, target.goal?.priority]
    .filter(Number.isFinite)
    .reduce((sum, priority) => sum + priority, 0) / 4;
  const relationTension = relation < 0 ? Math.abs(relation) : 0;
  const locationPressure =
    actor.locationId === conflict.locationId || target.locationId === conflict.locationId
      ? 15
      : 0;
  return Math.max(1, conflict.urgency + goalPressure + relationTension + locationPressure);
}

function findWitnesses(worldState, context, random) {
  const possibleWitnesses = worldState.characters.filter(
    (character) =>
      character.locationId === context.conflict.locationId &&
      character.id !== context.actor.id &&
      character.id !== context.target.id,
  );
  return shuffle(possibleWitnesses, random).slice(0, 2).map(({ id }) => id);
}

function weightedPick(candidates, random) {
  const totalWeight = candidates.reduce((sum, candidate) => sum + candidate.weight, 0);
  let cursor = random() * totalWeight;
  for (const candidate of candidates) {
    cursor -= candidate.weight;
    if (cursor < 0) return candidate;
  }
  return candidates.at(-1);
}

function shuffle(values, random) {
  const result = [...values];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    [result[index], result[swapIndex]] = [result[swapIndex], result[index]];
  }
  return result;
}

function entityMap(worldState) {
  return new Map(
    [...worldState.characters, ...worldState.factions, ...worldState.locations].map(
      (entity) => [entity.id, entity],
    ),
  );
}
