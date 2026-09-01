import {
  assertNumber,
  assertOptionalId,
  assertString,
  assertStringArray,
  createId,
} from "./validation.js";

export const CONFLICT_STATUS = Object.freeze({
  UNRESOLVED: "unresolved",
  RESOLVED: "resolved",
});

/** Luo ratkaisemattoman maailman ongelman tulevien tapahtumien pohjaksi. */
export function createConflict({
  id = createId("conflict"),
  type,
  partyIds,
  reason,
  locationId,
  urgency = 50,
  sourceIds = [],
  status = CONFLICT_STATUS.UNRESOLVED,
} = {}) {
  assertString(id, "conflict.id");
  assertString(type, "conflict.type");
  assertStringArray(partyIds, "conflict.partyIds");
  if (partyIds.length < 2 || new Set(partyIds).size !== partyIds.length) {
    throw new Error("Konfliktilla pitää olla vähintään kaksi eri osapuolta.");
  }
  assertString(reason, "conflict.reason");
  assertOptionalId(locationId, "conflict.locationId");
  if (locationId === null) throw new Error("Konfliktilla pitää olla sijainti.");
  assertNumber(urgency, "conflict.urgency", { min: 0, max: 100 });
  assertStringArray(sourceIds, "conflict.sourceIds");
  if (!Object.values(CONFLICT_STATUS).includes(status)) {
    throw new Error(`Tuntematon konfliktin tila "${status}".`);
  }

  return {
    id,
    type,
    partyIds: [...partyIds],
    reason,
    locationId,
    urgency,
    sourceIds: [...sourceIds],
    status,
  };
}

/**
 * Varmistaa, että alkumaailmassa on useita erilaisia ratkaisemattomia
 * ongelmia, joista tapahtumageneraattori voi jatkaa.
 */
export function assertWorldHasStorySeeds(worldState) {
  const unresolved = worldState.conflicts.filter(
    ({ status }) => status === CONFLICT_STATUS.UNRESOLVED,
  );
  const types = new Set(unresolved.map(({ type }) => type));

  if (unresolved.length < 3) {
    throw new Error("Maailmassa pitää olla vähintään kolme ratkaisematonta konfliktia.");
  }
  if (!worldState.debts.some(({ settled }) => !settled) || !types.has("unpaidDebt")) {
    throw new Error("Maailmasta puuttuu maksamattomaan velkaan perustuva konflikti.");
  }
  if (!worldState.resources.some(({ scarce, quantity }) => scarce && quantity === 0)) {
    throw new Error("Maailmasta puuttuu kadonnut tai loppunut resurssi.");
  }
  if (!types.has("conflictingGoals")) {
    throw new Error("Maailmasta puuttuu ristiriitaisiin tavoitteisiin perustuva konflikti.");
  }

  return true;
}
