import {
  assertNumber,
  assertObject,
  assertString,
  createId,
} from "./validation.js";

export const RELATION_MIN = -100;
export const RELATION_MAX = 100;

const DIMENSION_NAMES = ["affection", "trust", "fear", "respect", "debt"];

/**
 * Luo suunnatun suhteen kahden maailman entiteetin välille.
 * `value` on MVP:n käyttämä kokonaisarvo. `dimensions` mahdollistaa suhteen
 * jakamisen myöhemmin useaan rinnakkaiseen arvoon.
 */
export function createRelation({
  id = createId("relation"),
  sourceId,
  targetId,
  value = 0,
  reason,
  dimensions = {},
  day = 0,
} = {}) {
  assertString(id, "relation.id");
  assertString(sourceId, "relation.sourceId");
  assertString(targetId, "relation.targetId");
  if (sourceId === targetId) throw new Error("Suhteen osapuolet eivät voi olla sama entiteetti.");
  assertRelationValue(value, "relation.value");
  assertString(reason, "relation.reason");
  assertDimensions(dimensions);
  assertDay(day, "relation.day");

  return {
    id,
    sourceId,
    targetId,
    value,
    reason,
    dimensions: Object.fromEntries(
      DIMENSION_NAMES.map((name) => [name, dimensions[name] ?? null]),
    ),
    history: [{ day, delta: value, reason }],
  };
}

export function getRelation(worldState, sourceId, targetId) {
  assertObject(worldState, "worldState");
  assertString(sourceId, "sourceId");
  assertString(targetId, "targetId");
  return worldState.relations.find(
    (relation) => relation.sourceId === sourceId && relation.targetId === targetId,
  ) ?? null;
}

/** Palauttaa suhteen arvon tai nollan, jos suhdetta ei vielä ole. */
export function relationScore(worldState, sourceId, targetId) {
  return getRelation(worldState, sourceId, targetId)?.value ?? 0;
}

/**
 * Muuttaa olemassa olevaa suhdetta ja rajaa tuloksen välille -100...+100.
 * Muutoksen syy jää suhteen historiaan ja viimeisin syy näkyy suhteessa.
 */
export function changeRelation(
  worldState,
  sourceId,
  targetId,
  delta,
  reason = "Maailman tapahtumat muuttivat suhdetta.",
) {
  assertNumber(delta, "delta");
  assertString(reason, "reason");
  const relation = getRelation(worldState, sourceId, targetId);
  if (!relation) {
    throw new Error(`Suhdetta ${sourceId} → ${targetId} ei löytynyt.`);
  }

  const previousValue = relation.value;
  relation.value = clamp(previousValue + delta, RELATION_MIN, RELATION_MAX);
  relation.reason = reason;
  relation.history.push({
    day: worldState.day,
    delta: relation.value - previousValue,
    reason,
  });
  return relation.value;
}

export function assertRelationValue(value, fieldName = "relation.value") {
  assertNumber(value, fieldName, { min: RELATION_MIN, max: RELATION_MAX });
}

function assertDimensions(dimensions) {
  assertObject(dimensions, "relation.dimensions");
  for (const name of DIMENSION_NAMES) {
    const value = dimensions[name];
    if (value !== undefined && value !== null) {
      assertRelationValue(value, `relation.dimensions.${name}`);
    }
  }
}

function assertDay(day, fieldName) {
  if (!Number.isInteger(day) || day < 0) {
    throw new RangeError(`${fieldName} pitää olla nolla tai positiivinen kokonaisluku.`);
  }
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}
