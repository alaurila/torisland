import {
  assertNumber,
  assertString,
  assertStringArray,
  createId,
  validateWorldState,
} from "./validation.js";

const DEFAULT_MAX_SITUATIONS = 8;

/** Tunnistaa maailman tilasta narratiivisesti kiinnostavia tilanteita. */
export function createStoryEngine({ maxSituations = DEFAULT_MAX_SITUATIONS } = {}) {
  if (!Number.isInteger(maxSituations) || maxSituations < 1) {
    throw new RangeError("maxSituations pitää olla positiivinen kokonaisluku.");
  }

  return {
    findSituations(worldState) {
      worldState.activeSituations = deduplicateCandidates(collectCandidates(worldState))
        .sort((left, right) => right.tension - left.tension)
        .slice(0, maxSituations)
        .map((candidate) => createSituation(candidate, worldState.day));
      validateWorldState(worldState);
      return worldState.activeSituations;
    },
  };
}

/** Laskee jännitteen erillisistä narratiivisista signaaleista. */
export function calculateTension({
  hostility = 0,
  conflictingGoals = 0,
  secrets = 0,
  debts = 0,
  scarcity = 0,
  proximity = 0,
  witnesses = 0,
  unresolvedHistory = 0,
  threat = 0,
  urgency = 0,
} = {}) {
  return Math.round(
    hostility * 2 +
    conflictingGoals * 45 +
    secrets * 35 +
    Math.min(debts, 100) * 0.5 +
    scarcity * 45 +
    proximity * 20 +
    witnesses * 15 +
    unresolvedHistory * 25 +
    threat * 25 +
    urgency * 0.5,
  );
}

export function createSituation(
  { type, title, partyIds, locationId, tension, reasons, sourceIds },
  createdDay,
) {
  assertString(type, "situation.type");
  assertString(title, "situation.title");
  assertStringArray(partyIds, "situation.partyIds");
  if (new Set(partyIds).size < 2) throw new Error("Tilanteella pitää olla kaksi eri osapuolta.");
  assertString(locationId, "situation.locationId");
  assertNumber(tension, "situation.tension", { min: 0 });
  assertStringArray(reasons, "situation.reasons");
  assertStringArray(sourceIds, "situation.sourceIds");

  return {
    id: createId("situation"),
    type,
    title,
    partyIds: [...new Set(partyIds)],
    locationId,
    tension,
    reasons: [...reasons],
    sourceIds: [...new Set(sourceIds)],
    status: "active",
    createdDay,
  };
}

function collectCandidates(worldState) {
  const entities = entityMap(worldState);
  return [
    ...conflictCandidates(worldState, entities),
    ...hostilityCandidates(worldState, entities),
    ...debtCandidates(worldState, entities),
    ...secretCandidates(worldState, entities),
    ...scarcityCandidates(worldState, entities),
    ...witnessCandidates(worldState, entities),
    ...unresolvedEventCandidates(worldState, entities),
  ];
}

function conflictCandidates(worldState, entities) {
  return worldState.conflicts
    .filter(({ status }) => status === "unresolved")
    .map((conflict) => {
      const names = conflict.partyIds.map((id) => entities.get(id)?.name ?? "Tuntematon");
      const threatened = conflict.urgency >= 70 && conflict.partyIds.some((id) =>
        worldState.characters.some((character) => character.id === id));
      return candidate({
        type: conflict.type,
        title: names.join(" ja "),
        partyIds: conflict.partyIds,
        locationId: conflict.locationId,
        signals: {
          conflictingGoals: conflict.type === "conflictingGoals" ? 1 : 0,
          scarcity: conflict.type === "missingResource" ? 1 : 0,
          unresolvedHistory: 1,
          threat: threatened ? 1 : 0,
          urgency: conflict.urgency,
        },
        reasons: [
          conflict.reason,
          `Konflikti on ratkaisematon ja sen kiireellisyys on ${conflict.urgency}/100.`,
          ...(threatened ? ["Kiireellinen konflikti uhkaa vähintään yhtä hahmoa."] : []),
        ],
        sourceIds: [conflict.id, ...conflict.sourceIds],
      });
    });
}

function hostilityCandidates(worldState, entities) {
  const actorIds = new Set([...worldState.characters, ...worldState.factions].map(({ id }) => id));
  return worldState.relations
    .filter((relation) =>
      relation.value <= -30 && actorIds.has(relation.sourceId) && actorIds.has(relation.targetId))
    .map((relation) => {
      const source = entities.get(relation.sourceId);
      const target = entities.get(relation.targetId);
      const sourceLocation = entityLocation(source);
      const targetLocation = entityLocation(target);
      const sameLocation = sourceLocation && sourceLocation === targetLocation;
      return candidate({
        type: sameLocation ? "enemiesInProximity" : "hostility",
        title: `${source.name} vastaan ${target.name}`,
        partyIds: [source.id, target.id],
        locationId: sourceLocation ?? targetLocation ?? worldState.locations[0].id,
        signals: { hostility: Math.abs(relation.value), proximity: sameLocation ? 1 : 0 },
        reasons: [
          `${source.name} suhtautuu osapuoleen ${target.name} arvolla ${relation.value}.`,
          relation.reason,
          ...(sameLocation ? ["Viholliset ovat samassa paikassa."] : []),
        ],
        sourceIds: [relation.id],
      });
    });
}

function debtCandidates(worldState, entities) {
  return worldState.debts.filter(({ settled }) => !settled).map((debt) => {
    const debtor = entities.get(debt.debtorId);
    const creditor = entities.get(debt.creditorId);
    return candidate({
      type: "unpaidDebt",
      title: `${debtor.name} on velkaa osapuolelle ${creditor.name}`,
      partyIds: [debtor.id, creditor.id],
      locationId: entityLocation(debtor) ?? entityLocation(creditor) ?? worldState.locations[0].id,
      signals: { debts: debt.amount, unresolvedHistory: 1 },
      reasons: [debt.description, `Velan voimakkuus on ${debt.amount}/100.`],
      sourceIds: [debt.id],
    });
  });
}

function secretCandidates(worldState, entities) {
  return worldState.secrets.filter(({ revealed }) => !revealed).flatMap((secret) =>
    secret.knownByIds.flatMap((knowerId) => secret.subjectIds
      .filter((subjectId) => entities.has(subjectId) && subjectId !== knowerId)
      .map((subjectId) => {
        const knower = entities.get(knowerId);
        const subject = entities.get(subjectId);
        return candidate({
          type: "dangerousSecret",
          title: `${knower.name} tietää salaisuuden osapuolesta ${subject.name}`,
          partyIds: [knower.id, subject.id],
          locationId: entityLocation(knower) ?? entityLocation(subject) ?? worldState.locations[0].id,
          signals: { secrets: 1, threat: secret.importance >= 70 ? 1 : 0 },
          reasons: [secret.description, `Salaisuuden merkitys on ${secret.importance}/100.`],
          sourceIds: [secret.id],
        });
      })),
  );
}

function scarcityCandidates(worldState, entities) {
  return worldState.resources.filter(({ scarce, quantity }) => scarce || quantity === 0)
    .flatMap((resource) => {
      const relatedNeeds = worldState.needs.filter(
        (need) => !need.fulfilled && need.resourceId === resource.id,
      );
      const partyIds = [...new Set([resource.ownerId, ...relatedNeeds.map(({ ownerId }) => ownerId)])]
        .filter((id) => id && entities.has(id));
      if (partyIds.length < 2) return [];
      return [candidate({
        type: "resourceScarcity",
        title: `Pula resurssista: ${resource.name}`,
        partyIds,
        locationId: resource.locationId ?? entityLocation(entities.get(partyIds[0])) ?? worldState.locations[0].id,
        signals: { scarcity: 1, threat: 1 },
        reasons: [
          `${resource.name} on loppunut tai kadonnut.`,
          `${relatedNeeds.length} osapuolta tarvitsee resurssia.`,
        ],
        sourceIds: [resource.id, ...relatedNeeds.map(({ id }) => id)],
      })];
    });
}

function witnessCandidates(worldState, entities) {
  return worldState.events
    .filter((event) => !event.historical && event.witnessIds.length > 0)
    .map((event) => {
      const actor = entities.get(event.actorId);
      const target = entities.get(event.targetId);
      return candidate({
        type: "witnessedEvent",
        title: `Todistettu tapahtuma: ${actor.name} ja ${target.name}`,
        partyIds: [event.actorId, event.targetId, ...event.witnessIds],
        locationId: event.locationId,
        signals: { witnesses: event.witnessIds.length, unresolvedHistory: 1 },
        reasons: [event.summary, `${event.witnessIds.length} hahmoa todisti tapahtuman.`],
        sourceIds: [event.id],
      });
    });
}

function unresolvedEventCandidates(worldState, entities) {
  const unresolvedConflictIds = new Set(
    worldState.conflicts
      .filter(({ status }) => status === "unresolved")
      .map(({ id }) => id),
  );
  return worldState.events
    .filter((event) => !event.historical && unresolvedConflictIds.has(event.conflictId))
    .map((event) => {
      const actor = entities.get(event.actorId);
      const target = entities.get(event.targetId);
      return candidate({
        type: "unresolvedPastEvent",
        title: `Ratkaisematon seuraus: ${actor.name} ja ${target.name}`,
        partyIds: [event.actorId, event.targetId],
        locationId: event.locationId,
        signals: { unresolvedHistory: 1, threat: 1 },
        reasons: [event.summary, "Tapahtumaan liittyvä konflikti on yhä ratkaisematta."],
        sourceIds: [event.id, event.conflictId],
      });
    });
}

function candidate({ signals, ...data }) {
  return { ...data, tension: calculateTension(signals) };
}

function deduplicateCandidates(candidates) {
  const byKey = new Map();
  for (const current of candidates) {
    const key = `${current.type}:${[...current.partyIds].sort().join(":")}`;
    const previous = byKey.get(key);
    if (!previous || current.tension > previous.tension) byKey.set(key, current);
  }
  return [...byKey.values()];
}

function entityMap(worldState) {
  return new Map(
    [...worldState.characters, ...worldState.factions, ...worldState.locations]
      .map((entity) => [entity.id, entity]),
  );
}

function entityLocation(entity) {
  return entity?.locationId ?? null;
}
