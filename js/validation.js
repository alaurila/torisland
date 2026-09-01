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
  "completedQuests",
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
    for (const factionId of character.factionIds) {
      assertReference(factionId, factionIds, `Hahmon ${character.id} factionIds`);
    }
  }

  for (const faction of worldState.factions) {
    assertReference(faction.locationId, locationIds, `Ryhmän ${faction.id} locationId`);
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
