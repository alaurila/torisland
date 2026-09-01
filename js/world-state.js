import {
  assertBoolean,
  assertNumber,
  assertObject,
  assertOptionalId,
  assertString,
  assertStringArray,
  createId,
  validateWorldState,
} from "./validation.js";

/**
 * Luo uuden, JSON-muotoon serialisoitavan maailmantilan.
 *
 * Tietomalli ei sisällä metodeja, Date-olioita tai muita arvoja, jotka eivät
 * säily sellaisinaan JSON-muunnoksessa.
 */
export function createWorldState({ day = 1 } = {}) {
  const worldState = {
    day,
    characters: [],
    locations: [],
    factions: [],
    relations: [],
    needs: [],
    resources: [],
    secrets: [],
    debts: [],
    conflicts: [],
    memories: [],
    knowledge: [],
    events: [],
    activeSituations: [],
    activeQuests: [],
    completedQuests: [],
    playerDecisions: [],
  };

  validateWorldState(worldState);
  return worldState;
}

/**
 * Luo hahmon, jolla on kolme ominaisuutta ja yksi rakenteinen tavoite.
 */
export function createCharacter({
  id = createId("character"),
  name,
  role,
  locationId = null,
  factionIds = [],
  traits = [],
  goal = null,
} = {}) {
  assertString(id, "character.id");
  assertString(name, "character.name");
  assertString(role, "character.role");
  assertOptionalId(locationId, "character.locationId");
  assertStringArray(factionIds, "character.factionIds");
  assertStringArray(traits, "character.traits", { length: 3 });
  assertObject(goal, "character.goal");

  return {
    id,
    name,
    role,
    locationId,
    factionIds: [...factionIds],
    traits: [...traits],
    goal: { progress: 0, ...goal },
  };
}

/**
 * Luo paikan, johon hahmot, ryhmät, tapahtumat ja resurssit voidaan liittää.
 */
export function createLocation({
  id = createId("location"),
  name,
  description = "",
  tags = [],
  safety = 0,
} = {}) {
  assertString(id, "location.id");
  assertString(name, "location.name");
  if (typeof description !== "string") throw new TypeError("location.description pitää olla merkkijono.");
  assertStringArray(tags, "location.tags");
  assertNumber(safety, "location.safety", { min: -100, max: 100 });

  return {
    id,
    name,
    description,
    tags: [...tags],
    safety,
  };
}

/**
 * Luo ryhmän ja sen perusidentiteetin. Jäsenyydet säilytetään hahmoilla.
 */
export function createFaction({
  id = createId("faction"),
  name,
  description = "",
  locationId = null,
  traits = [],
  goal = null,
} = {}) {
  assertString(id, "faction.id");
  assertString(name, "faction.name");
  if (typeof description !== "string") throw new TypeError("faction.description pitää olla merkkijono.");
  assertOptionalId(locationId, "faction.locationId");
  assertStringArray(traits, "faction.traits");
  if (goal !== null) assertObject(goal, "faction.goal");

  return {
    id,
    name,
    description,
    locationId,
    traits: [...traits],
    goal: goal ? { progress: 0, ...goal } : null,
  };
}

/**
 * Luo toimijan tarpeen. ownerId voi viitata esimerkiksi hahmoon tai ryhmään.
 */
export function createNeed({
  id = createId("need"),
  ownerId,
  type,
  priority = 50,
  resourceId = null,
  fulfilled = false,
} = {}) {
  assertString(id, "need.id");
  assertString(ownerId, "need.ownerId");
  assertString(type, "need.type");
  assertNumber(priority, "need.priority", { min: 0, max: 100 });
  assertOptionalId(resourceId, "need.resourceId");
  assertBoolean(fulfilled, "need.fulfilled");

  return {
    id,
    ownerId,
    type,
    priority,
    resourceId,
    fulfilled,
  };
}

/**
 * Luo maailman resurssin tai esineen.
 */
export function createResource({
  id = createId("resource"),
  name,
  type,
  quantity = 1,
  ownerId = null,
  locationId = null,
  scarce = false,
} = {}) {
  assertString(id, "resource.id");
  assertString(name, "resource.name");
  assertString(type, "resource.type");
  assertNumber(quantity, "resource.quantity", { min: 0 });
  assertOptionalId(ownerId, "resource.ownerId");
  assertOptionalId(locationId, "resource.locationId");
  assertBoolean(scarce, "resource.scarce");

  return {
    id,
    name,
    type,
    quantity,
    ownerId,
    locationId,
    scarce,
  };
}

/**
 * Luo salaisuuden ja tiedon siitä, keitä se koskee ja ketkä tuntevat sen.
 */
export function createSecret({
  id = createId("secret"),
  description,
  subjectIds = [],
  knownByIds = [],
  importance = 50,
  revealed = false,
} = {}) {
  assertString(id, "secret.id");
  assertString(description, "secret.description");
  assertStringArray(subjectIds, "secret.subjectIds");
  assertStringArray(knownByIds, "secret.knownByIds");
  assertNumber(importance, "secret.importance", { min: 0, max: 100 });
  assertBoolean(revealed, "secret.revealed");

  return {
    id,
    description,
    subjectIds: [...subjectIds],
    knownByIds: [...knownByIds],
    importance,
    revealed,
  };
}

/**
 * Luo kahden osapuolen välisen velan.
 */
export function createDebt({
  id = createId("debt"),
  debtorId,
  creditorId,
  description,
  amount = 1,
  dueDay = null,
  settled = false,
} = {}) {
  assertString(id, "debt.id");
  assertString(debtorId, "debt.debtorId");
  assertString(creditorId, "debt.creditorId");
  if (debtorId === creditorId) throw new Error("Velallinen ja velkoja eivät voi olla sama osapuoli.");
  assertString(description, "debt.description");
  assertNumber(amount, "debt.amount", { min: 0 });
  if (dueDay !== null && (!Number.isInteger(dueDay) || dueDay < 1)) {
    throw new RangeError("debt.dueDay pitää olla positiivinen kokonaisluku tai null.");
  }
  assertBoolean(settled, "debt.settled");

  return {
    id,
    debtorId,
    creditorId,
    description,
    amount,
    dueDay,
    settled,
  };
}
