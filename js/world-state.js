/**
 * Luo uuden, JSON-muotoon serialisoitavan maailmantilan.
 *
 * Tietomalli ei sisällä metodeja, Date-olioita tai muita arvoja, jotka eivät
 * säily sellaisinaan JSON-muunnoksessa.
 */
export function createWorldState({ day = 1 } = {}) {
  return {
    day,
    characters: [],
    locations: [],
    factions: [],
    relations: [],
    needs: [],
    resources: [],
    secrets: [],
    debts: [],
    memories: [],
    knowledge: [],
    events: [],
    activeSituations: [],
    completedQuests: [],
  };
}

/**
 * Luo hahmon. Tavoite voi olla null, kunnes maailman generaattori antaa sen.
 */
export function createCharacter({
  id,
  name,
  role,
  locationId = null,
  factionIds = [],
  traits = [],
  goal = null,
}) {
  return {
    id,
    name,
    role,
    locationId,
    factionIds: [...factionIds],
    traits: [...traits],
    goal: goal ? { ...goal } : null,
  };
}

/**
 * Luo paikan, johon hahmot, ryhmät, tapahtumat ja resurssit voidaan liittää.
 */
export function createLocation({
  id,
  name,
  description = "",
  tags = [],
  safety = 0,
}) {
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
  id,
  name,
  description = "",
  locationId = null,
  traits = [],
  goal = null,
}) {
  return {
    id,
    name,
    description,
    locationId,
    traits: [...traits],
    goal: goal ? { ...goal } : null,
  };
}

/**
 * Luo toimijan tarpeen. ownerId voi viitata esimerkiksi hahmoon tai ryhmään.
 */
export function createNeed({
  id,
  ownerId,
  type,
  priority = 50,
  resourceId = null,
  fulfilled = false,
}) {
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
  id,
  name,
  type,
  quantity = 1,
  ownerId = null,
  locationId = null,
  scarce = false,
}) {
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
  id,
  description,
  subjectIds = [],
  knownByIds = [],
  importance = 50,
  revealed = false,
}) {
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
  id,
  debtorId,
  creditorId,
  description,
  amount = 1,
  dueDay = null,
  settled = false,
}) {
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
