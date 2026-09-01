const WORLD_COLLECTIONS = [
  "characters",
  "locations",
  "factions",
  "relations",
  "needs",
  "resources",
  "secrets",
  "debts",
  "conflicts",
  "memories",
  "knowledge",
  "events",
  "activeSituations",
  "activeQuests",
  "completedQuests",
  "playerDecisions",
];

let fallbackIdCounter = 0;

/** Luo tunnisteen, joka sopii JSON-dataan ja DOM-attribuutteihin. */
export function createId(prefix = "entity") {
  const safePrefix = String(prefix)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "") || "entity";

  if (globalThis.crypto?.randomUUID) {
    return `${safePrefix}-${globalThis.crypto.randomUUID()}`;
  }

  fallbackIdCounter += 1;
  const time = Date.now().toString(36);
  const random = Math.random().toString(36).slice(2, 10);
  return `${safePrefix}-${time}-${fallbackIdCounter.toString(36)}-${random}`;
}

export function assertObject(value, fieldName) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new TypeError(`${fieldName} pitää olla objekti.`);
  }
}

export function assertString(value, fieldName) {
  if (typeof value !== "string" || value.trim() === "") {
    throw new TypeError(`${fieldName} pitää olla merkkijono, joka ei ole tyhjä.`);
  }
}

export function assertOptionalId(value, fieldName) {
  if (value !== null) {
    assertString(value, fieldName);
  }
}

export function assertStringArray(value, fieldName, { length } = {}) {
  if (!Array.isArray(value) || value.some((item) => typeof item !== "string" || !item.trim())) {
    throw new TypeError(`${fieldName} pitää olla merkkijonotaulukko.`);
  }

  if (length !== undefined && value.length !== length) {
    throw new RangeError(`${fieldName} pitää sisältää täsmälleen ${length} arvoa.`);
  }
}

export function assertNumber(value, fieldName, { min = -Infinity, max = Infinity } = {}) {
  if (!Number.isFinite(value) || value < min || value > max) {
    throw new RangeError(`${fieldName} pitää olla luku väliltä ${min}...${max}.`);
  }
}

export function assertBoolean(value, fieldName) {
  if (typeof value !== "boolean") {
    throw new TypeError(`${fieldName} pitää olla totuusarvo.`);
  }
}

/**
 * Tarkistaa koko maailman rakenteen, tunnisteiden yksilöllisyyden ja tällä
 * hetkellä määriteltyjen mallien viittaukset. Palauttaa true tai heittää virheen.
 */
export function validateWorldState(worldState) {
  assertObject(worldState, "worldState");

  if (!Number.isInteger(worldState.day) || worldState.day < 1) {
    throw new RangeError("worldState.day pitää olla positiivinen kokonaisluku.");
  }

  for (const collectionName of WORLD_COLLECTIONS) {
    if (!Array.isArray(worldState[collectionName])) {
      throw new TypeError(`worldState.${collectionName} pitää olla taulukko.`);
    }
  }

  const ids = new Set();
  for (const collectionName of WORLD_COLLECTIONS) {
    for (const item of worldState[collectionName]) {
      if (item?.id === undefined) continue;
      assertString(item.id, `${collectionName}.id`);
      if (ids.has(item.id)) {
        throw new Error(`Tunniste "${item.id}" esiintyy maailmassa useammin kuin kerran.`);
      }
      ids.add(item.id);
    }
  }

  const characterIds = new Set(worldState.characters.map(({ id }) => id));
  const factionIds = new Set(worldState.factions.map(({ id }) => id));
  const locationIds = new Set(worldState.locations.map(({ id }) => id));
  const actorIds = new Set([...characterIds, ...factionIds]);
  const subjectIds = new Set([...actorIds, ...locationIds]);
  const resourceIds = new Set(worldState.resources.map(({ id }) => id));
  const eventIds = new Set(worldState.events.map(({ id }) => id));

  for (const relation of worldState.relations) {
    assertString(relation.sourceId, `Suhteen ${relation.id} sourceId`);
    assertString(relation.targetId, `Suhteen ${relation.id} targetId`);
    if (!subjectIds.has(relation.sourceId) || !subjectIds.has(relation.targetId)) {
      throw new Error(`Suhde ${relation.id} viittaa tuntemattomaan entiteettiin.`);
    }
    if (relation.sourceId === relation.targetId) {
      throw new Error(`Suhteen ${relation.id} osapuolet eivät voi olla samat.`);
    }
    assertNumber(relation.value, `Suhteen ${relation.id} value`, { min: -100, max: 100 });
    assertString(relation.reason, `Suhteen ${relation.id} reason`);
  }

  const relationPairs = new Set();
  for (const relation of worldState.relations) {
    const pair = `${relation.sourceId}\u0000${relation.targetId}`;
    if (relationPairs.has(pair)) {
      throw new Error(`Suhde ${relation.sourceId} → ${relation.targetId} on määritelty useammin kuin kerran.`);
    }
    relationPairs.add(pair);
  }

  for (const character of worldState.characters) {
    assertReference(character.locationId, locationIds, `Hahmon ${character.id} locationId`);
    assertNumber(character.goal.progress, `Hahmon ${character.id} goal.progress`, { min: 0, max: 100 });
    for (const factionId of character.factionIds) {
      assertReference(factionId, factionIds, `Hahmon ${character.id} factionIds`);
    }
  }

  for (const faction of worldState.factions) {
    assertReference(faction.locationId, locationIds, `Ryhmän ${faction.id} locationId`);
    if (faction.goal?.progress !== undefined) {
      assertNumber(faction.goal.progress, `Ryhmän ${faction.id} goal.progress`, { min: 0, max: 100 });
    }
  }

  for (const need of worldState.needs) {
    assertReference(need.ownerId, actorIds, `Tarpeen ${need.id} ownerId`, false);
    assertReference(need.resourceId, resourceIds, `Tarpeen ${need.id} resourceId`);
  }

  for (const resource of worldState.resources) {
    assertReference(resource.ownerId, actorIds, `Resurssin ${resource.id} ownerId`);
    assertReference(resource.locationId, locationIds, `Resurssin ${resource.id} locationId`);
  }

  for (const secret of worldState.secrets) {
    for (const subjectId of secret.subjectIds) {
      assertReference(subjectId, subjectIds, `Salaisuuden ${secret.id} subjectIds`, false);
    }
    for (const characterId of secret.knownByIds) {
      assertReference(characterId, characterIds, `Salaisuuden ${secret.id} knownByIds`, false);
    }
  }

  for (const debt of worldState.debts) {
    assertReference(debt.debtorId, actorIds, `Velan ${debt.id} debtorId`, false);
    assertReference(debt.creditorId, actorIds, `Velan ${debt.id} creditorId`, false);
    if (debt.debtorId === debt.creditorId) {
      throw new Error(`Velan ${debt.id} velallinen ja velkoja eivät voi olla sama osapuoli.`);
    }
  }

  for (const conflict of worldState.conflicts) {
    assertString(conflict.type, `Konfliktin ${conflict.id} type`);
    assertStringArray(conflict.partyIds, `Konfliktin ${conflict.id} partyIds`);
    if (conflict.partyIds.length < 2 || new Set(conflict.partyIds).size !== conflict.partyIds.length) {
      throw new Error(`Konfliktilla ${conflict.id} pitää olla vähintään kaksi eri osapuolta.`);
    }
    for (const partyId of conflict.partyIds) {
      assertReference(partyId, actorIds, `Konfliktin ${conflict.id} partyIds`, false);
    }
    assertString(conflict.reason, `Konfliktin ${conflict.id} reason`);
    assertReference(conflict.locationId, locationIds, `Konfliktin ${conflict.id} locationId`, false);
    assertNumber(conflict.urgency, `Konfliktin ${conflict.id} urgency`, { min: 0, max: 100 });
    assertStringArray(conflict.sourceIds, `Konfliktin ${conflict.id} sourceIds`);
    for (const sourceId of conflict.sourceIds) {
      if (!ids.has(sourceId)) {
        throw new Error(`Konfliktin ${conflict.id} lähde "${sourceId}" puuttuu maailmasta.`);
      }
    }
    if (conflict.status !== "unresolved" && conflict.status !== "resolved") {
      throw new Error(`Konfliktilla ${conflict.id} on tuntematon tila.`);
    }
  }

  for (const event of worldState.events) {
    assertString(event.type, `Tapahtuman ${event.id} type`);
    assertReference(event.actorId, actorIds, `Tapahtuman ${event.id} actorId`, false);
    assertReference(event.targetId, actorIds, `Tapahtuman ${event.id} targetId`, false);
    if (event.actorId === event.targetId) {
      throw new Error(`Tapahtuman ${event.id} toimija ja kohde eivät voi olla samat.`);
    }
    assertReference(event.locationId, locationIds, `Tapahtuman ${event.id} locationId`, false);
    assertStringArray(event.witnessIds, `Tapahtuman ${event.id} witnessIds`);
    for (const witnessId of event.witnessIds) {
      assertReference(witnessId, characterIds, `Tapahtuman ${event.id} witnessIds`, false);
    }
    if (!Number.isInteger(event.day) || event.day < 0) {
      throw new Error(`Tapahtuman ${event.id} day pitää olla nolla tai positiivinen kokonaisluku.`);
    }
    assertString(event.summary, `Tapahtuman ${event.id} summary`);
    assertBoolean(event.historical, `Tapahtuman ${event.id} historical`);
    assertBoolean(event.consequencesApplied, `Tapahtuman ${event.id} consequencesApplied`);
    assertStringArray(event.effects, `Tapahtuman ${event.id} effects`);
  }

  for (const memory of worldState.memories) {
    assertReference(memory.ownerId, characterIds, `Muiston ${memory.id} ownerId`, false);
    assertReference(memory.targetId, actorIds, `Muiston ${memory.id} targetId`, false);
    assertReference(memory.eventId, eventIds, `Muiston ${memory.id} eventId`, false);
    assertString(memory.type, `Muiston ${memory.id} type`);
    assertNumber(memory.strength, `Muiston ${memory.id} strength`, { min: 0, max: 100 });
    assertString(memory.reason, `Muiston ${memory.id} reason`);
    if (!Number.isInteger(memory.day) || memory.day < 0) {
      throw new Error(`Muiston ${memory.id} day pitää olla nolla tai positiivinen kokonaisluku.`);
    }
  }

  for (const fact of worldState.knowledge) {
    assertReference(fact.knowerId, characterIds, `Tiedon ${fact.id} knowerId`, false);
    assertReference(fact.eventId, eventIds, `Tiedon ${fact.id} eventId`, false);
    assertString(fact.type, `Tiedon ${fact.id} type`);
    if (fact.subjectId !== null) {
      assertReference(fact.subjectId, characterIds, `Tiedon ${fact.id} subjectId`, false);
    }
    if (!Number.isInteger(fact.day) || fact.day < 0) {
      throw new Error(`Tiedon ${fact.id} day pitää olla nolla tai positiivinen kokonaisluku.`);
    }
  }

  for (const situation of worldState.activeSituations) {
    assertString(situation.type, `Tilanteen ${situation.id} type`);
    assertString(situation.title, `Tilanteen ${situation.id} title`);
    assertStringArray(situation.partyIds, `Tilanteen ${situation.id} partyIds`);
    if (new Set(situation.partyIds).size < 2) {
      throw new Error(`Tilanteella ${situation.id} pitää olla kaksi eri osapuolta.`);
    }
    for (const partyId of situation.partyIds) {
      assertReference(partyId, actorIds, `Tilanteen ${situation.id} partyIds`, false);
    }
    assertReference(situation.locationId, locationIds, `Tilanteen ${situation.id} locationId`, false);
    assertNumber(situation.tension, `Tilanteen ${situation.id} tension`, { min: 0 });
    assertStringArray(situation.reasons, `Tilanteen ${situation.id} reasons`);
    if (situation.reasons.length === 0) {
      throw new Error(`Tilanteelta ${situation.id} puuttuvat generoinnin perustelut.`);
    }
    assertStringArray(situation.sourceIds, `Tilanteen ${situation.id} sourceIds`);
    for (const sourceId of situation.sourceIds) {
      if (!ids.has(sourceId)) {
        throw new Error(`Tilanteen ${situation.id} lähde "${sourceId}" puuttuu maailmasta.`);
      }
    }
    if (situation.status !== "active") {
      throw new Error(`Tilanteella ${situation.id} on tuntematon tila.`);
    }
    if (!Number.isInteger(situation.createdDay) || situation.createdDay < 1) {
      throw new Error(`Tilanteen ${situation.id} createdDay pitää olla positiivinen kokonaisluku.`);
    }
  }

  for (const decision of worldState.playerDecisions) {
    assertString(decision.description, `Pelaajapäätöksen ${decision.id} description`);
    if (!Number.isInteger(decision.day) || decision.day < 1) {
      throw new Error(`Pelaajapäätöksen ${decision.id} day pitää olla positiivinen kokonaisluku.`);
    }
    if (
      !Array.isArray(decision.relationChanges) ||
      !Array.isArray(decision.conflictChanges) ||
      !Array.isArray(decision.goalChanges)
    ) {
      throw new Error(`Pelaajapäätöksen ${decision.id} muutosten pitää olla taulukoita.`);
    }
  }

  for (const quest of worldState.activeQuests) {
    validateQuest(quest, actorIds, locationIds, "active");
    if (quest.resolution !== null) {
      throw new Error(`Aktiivisella tehtävällä ${quest.id} ei saa olla ratkaisua.`);
    }
  }

  for (const quest of worldState.completedQuests) {
    validateQuest(quest, actorIds, locationIds, "completed");
    assertObject(quest.resolution, `Tehtävän ${quest.id} resolution`);
    assertReference(quest.resolution.eventId, eventIds, `Tehtävän ${quest.id} resolution.eventId`, false);
  }

  try {
    JSON.stringify(worldState);
  } catch (error) {
    throw new TypeError(`worldState ei ole JSON-serialisoitava: ${error.message}`);
  }

  return true;
}

function assertReference(value, allowedIds, fieldName, nullable = true) {
  if (value === null && nullable) return;
  assertString(value, fieldName);
  if (!allowedIds.has(value)) {
    throw new Error(`${fieldName} viittaa tuntemattomaan tunnisteeseen "${value}".`);
  }
}

function validateQuest(quest, actorIds, locationIds, expectedStatus) {
  assertString(quest.type, `Tehtävän ${quest.id} type`);
  assertString(quest.title, `Tehtävän ${quest.id} title`);
  assertString(quest.description, `Tehtävän ${quest.id} description`);
  assertReference(quest.giverId, actorIds, `Tehtävän ${quest.id} giverId`, false);
  assertReference(quest.targetId, actorIds, `Tehtävän ${quest.id} targetId`, false);
  assertReference(quest.locationId, locationIds, `Tehtävän ${quest.id} locationId`, false);
  assertString(quest.situationId, `Tehtävän ${quest.id} situationId`);
  assertString(quest.situationSignature, `Tehtävän ${quest.id} situationSignature`);
  assertString(quest.templateId, `Tehtävän ${quest.id} templateId`);
  if (!Array.isArray(quest.actions) || quest.actions.length < 3) {
    throw new Error(`Tehtävällä ${quest.id} pitää olla vähintään kolme toimintatapaa.`);
  }
  const actionIds = new Set();
  for (const action of quest.actions) {
    assertString(action.id, `Tehtävän ${quest.id} action.id`);
    assertString(action.label, `Tehtävän ${quest.id} action.label`);
    assertString(action.eventType, `Tehtävän ${quest.id} action.eventType`);
    assertString(action.summary, `Tehtävän ${quest.id} action.summary`);
    if (actionIds.has(action.id)) throw new Error(`Tehtävän ${quest.id} toiminnon tunniste toistuu.`);
    actionIds.add(action.id);
  }
  if (quest.status !== expectedStatus) {
    throw new Error(`Tehtävän ${quest.id} tilan pitäisi olla ${expectedStatus}.`);
  }
  if (!Number.isInteger(quest.createdDay) || quest.createdDay < 1) {
    throw new Error(`Tehtävän ${quest.id} createdDay pitää olla positiivinen kokonaisluku.`);
  }
}
