import {
  createCharacter,
  createDebt,
  createFaction,
  createLocation,
  createNeed,
  createResource,
  createSecret,
  createWorldState,
} from "./world-state.js";
import { createRelation } from "./relations.js";
import { assertWorldHasStorySeeds, createConflict } from "./conflicts.js";
import { createId, validateWorldState } from "./validation.js";
import { createEvent } from "./events.js";

export const WORLD_LIMITS = Object.freeze({
  characters: 10,
  locations: 5,
  factions: 3,
});

const CHARACTER_NAMES = [
  "Maija",
  "Rurik",
  "Elina",
  "Torsten",
  "Lyyti",
  "Soren",
  "Kaarna",
  "Vilja",
  "Osmo",
  "Aila",
];

const ROLES = [
  "kauppias",
  "palkkasoturi",
  "kylänvanhin",
  "parantaja",
  "satamavahti",
  "kartantekijä",
  "seppä",
  "sanansaattaja",
  "majatalonpitäjä",
  "aarteenetsijä",
];

const TRAITS = [
  "ahne",
  "rohkea",
  "varovainen",
  "uskollinen",
  "ovela",
  "ylpeä",
  "antelias",
  "epäluuloinen",
  "kärsivällinen",
  "kunnianhimoinen",
  "rehellinen",
  "utelias",
];

const GOALS = [
  { type: "gainWealth", label: "rikastua" },
  { type: "protectCommunity", label: "suojella yhteisöä" },
  { type: "uncoverSecret", label: "paljastaa vanha salaisuus" },
  { type: "gainInfluence", label: "kasvattaa vaikutusvaltaansa" },
  { type: "repayDebt", label: "maksaa vaarallinen velka" },
  { type: "findPerson", label: "löytää kadonnut läheinen" },
  { type: "restoreHonor", label: "palauttaa maineensa" },
  { type: "secureTrade", label: "turvata kauppareitti" },
  { type: "masterCraft", label: "valmistaa mestariteos" },
  { type: "leaveTown", label: "päästä pois kaupungista" },
];

const LOCATION_DEFINITIONS = [
  {
    name: "Jokisatama",
    description: "Vilkas satama, jossa laillinen kauppa ja salakuljetus sekoittuvat.",
    tags: ["satama", "kauppa"],
    safety: -10,
  },
  {
    name: "Majatalo Kuunkehrä",
    description: "Matkalaisten, juorujen ja hiljaisten sopimusten kohtaamispaikka.",
    tags: ["majatalo", "kohtaamispaikka"],
    safety: 25,
  },
  {
    name: "Vanha kaivos",
    description: "Hylätty kaivos, jonka suljetuissa tunneleissa liikkuu yhä joku.",
    tags: ["raunio", "vaarallinen"],
    safety: -60,
  },
  {
    name: "Kivikylä",
    description: "Muurien suojaama kylä ja alueen hallinnon keskus.",
    tags: ["kylä", "hallinto"],
    safety: 45,
  },
  {
    name: "Sumumetsä",
    description: "Tiheä metsä, jonka polut vaihtavat paikkaa kulkijan selän takana.",
    tags: ["metsä", "mysteeri"],
    safety: -35,
  },
];

const FACTION_DEFINITIONS = [
  {
    name: "Vartijat",
    description: "Ylläpitävät järjestystä ja valvovat jokisataman liikennettä.",
    traits: ["järjestelmällinen", "epäluuloinen"],
    goal: { type: "maintainOrder", label: "kitkeä alueen rikollisuus", priority: 85 },
  },
  {
    name: "Salakuljettajat",
    description: "Salainen verkosto, joka siirtää tavaraa vartijoiden ohi.",
    traits: ["salainen", "hajautettu"],
    goal: { type: "controlTrade", label: "hallita laitonta kauppaa", priority: 80 },
  },
  {
    name: "Kauppiaiden kilta",
    description: "Varakkaiden kauppiaiden liitto, joka tavoittelee vakaita reittejä.",
    traits: ["vauras", "vaikutusvaltainen"],
    goal: { type: "secureTrade", label: "turvata alueen kauppa", priority: 75 },
  },
];

/**
 * Luo pienen maailman. Oletuskoko on helppo hahmottaa, mutta asetukset tukevat
 * suoraan MVP-tavoitteen enimmäiskokoa 10 hahmoa, 5 lokaatiota ja 3 ryhmää.
 */
export function generateWorld(
  { characterCount = 6, locationCount = 3, factionCount = 2 } = {},
  random = Math.random,
) {
  assertCount("characterCount", characterCount, 4, WORLD_LIMITS.characters);
  assertCount("locationCount", locationCount, 1, WORLD_LIMITS.locations);
  assertCount("factionCount", factionCount, 2, WORLD_LIMITS.factions);
  if (typeof random !== "function") throw new TypeError("random pitää olla funktio.");

  const worldState = createWorldState();
  const locationDefinitions = sample(LOCATION_DEFINITIONS, locationCount, random);

  worldState.locations = locationDefinitions.map((definition) => createLocation(definition));
  worldState.factions = sample(FACTION_DEFINITIONS, factionCount, random).map(
    (definition, index) =>
      createFaction({
        ...definition,
        locationId: worldState.locations[index % worldState.locations.length].id,
      }),
  );

  const names = sample(CHARACTER_NAMES, characterCount, random);
  const roles = sample(ROLES, characterCount, random);
  const goals = sample(GOALS, characterCount, random);

  worldState.characters = names.map((name, index) => {
    const faction = worldState.factions[index % worldState.factions.length];
    const belongsToFaction = index < worldState.factions.length || random() < 0.7;

    return createCharacter({
      name,
      role: roles[index],
      locationId: pick(worldState.locations, random).id,
      factionIds: belongsToFaction ? [faction.id] : [],
      traits: sample(TRAITS, 3, random),
      goal: {
        ...goals[index],
        priority: 55 + Math.floor(random() * 41),
        progress: 0,
      },
    });
  });

  generateSharedHistory(worldState, random);
  generateInitialConflicts(worldState);

  validateWorldState(worldState);
  assertWorldHasStorySeeds(worldState);
  return worldState;
}

function generateInitialConflicts(worldState) {
  const [debtor, creditor, investigator] = worldState.characters;
  const [firstFaction, secondFaction] = worldState.factions;
  const debt = worldState.debts[0];
  const conflictLocation = worldState.locations.find(({ id }) => id === debtor.locationId);

  worldState.conflicts.push(
    createConflict({
      type: "unpaidDebt",
      partyIds: [debtor.id, creditor.id],
      reason: debt.description,
      locationId: conflictLocation.id,
      urgency: 70,
      sourceIds: [debt.id],
    }),
  );

  const missingShipment = createResource({
    name: "Kadonnut lääkelähetys",
    type: "medicine",
    quantity: 0,
    ownerId: firstFaction.id,
    locationId: conflictLocation.id,
    scarce: true,
  });
  const medicineNeed = createNeed({
    ownerId: investigator.id,
    type: "medicine",
    priority: 85,
    resourceId: missingShipment.id,
  });
  worldState.resources.push(missingShipment);
  worldState.needs.push(medicineNeed);
  worldState.conflicts.push(
    createConflict({
      type: "missingResource",
      partyIds: [investigator.id, firstFaction.id],
      reason: `${investigator.name} tarvitsee lääkkeitä, mutta ryhmän ${firstFaction.name} lähetys on kadonnut.`,
      locationId: conflictLocation.id,
      urgency: 85,
      sourceIds: [missingShipment.id, medicineNeed.id],
    }),
  );

  worldState.conflicts.push(
    createConflict({
      type: "conflictingGoals",
      partyIds: [firstFaction.id, secondFaction.id],
      reason: `${firstFaction.name} haluaa ${firstFaction.goal.label}, mutta ${secondFaction.name} pyrkii ${secondFaction.goal.label}.`,
      locationId: firstFaction.locationId,
      urgency: 75,
      sourceIds: [firstFaction.id, secondFaction.id],
    }),
  );
}

function generateSharedHistory(worldState, random) {
  const [first, second, third, fourth] = worldState.characters;
  const firstFaction = worldState.factions[0];
  const secondFaction = worldState.factions[1] ?? firstFaction;

  addHistoricalRelation(
    worldState,
    first,
    second,
    60,
    `${second.name} pelasti ${first.name}n vanhan väijytyksen aikana.`,
    "rescue",
  );
  addHistoricalRelation(
    worldState,
    second,
    third,
    -45,
    `${third.name} epäonnistui ${second.name}n tärkeän lähetyksen suojelemisessa.`,
    "failedProtection",
  );
  addHistoricalRelation(
    worldState,
    third,
    fourth,
    35,
    `${fourth.name} piti ${third.name}n vaarallisen salaisuuden.`,
    "keptSecret",
  );

  for (let index = 3; index < worldState.characters.length; index += 1) {
    const source = worldState.characters[index];
    const target = worldState.characters[(index + 1) % worldState.characters.length];
    const positive = random() >= 0.5;
    addHistoricalRelation(
      worldState,
      source,
      target,
      positive ? 25 + Math.floor(random() * 36) : -25 - Math.floor(random() * 36),
      positive
        ? `${target.name} auttoi ${source.name}a vaikeana aikana.`
        : `${target.name} rikkoi ${source.name}lle antamansa lupauksen.`,
      positive ? "assistance" : "brokenPromise",
    );
  }

  for (const character of worldState.characters) {
    const location = worldState.locations.find(({ id }) => id === character.locationId);
    worldState.relations.push(
      createRelation({
        sourceId: character.id,
        targetId: location.id,
        value: 20,
        reason: `${character.name} asuu tai työskentelee paikassa ${location.name}.`,
      }),
    );

    for (const factionId of character.factionIds) {
      const faction = worldState.factions.find(({ id }) => id === factionId);
      worldState.relations.push(
        createRelation({
          sourceId: character.id,
          targetId: faction.id,
          value: 40 + Math.floor(random() * 31),
          reason: `${character.name} kuuluu ryhmään ${faction.name}.`,
        }),
      );
    }
  }

  for (const faction of worldState.factions) {
    const location = worldState.locations.find(({ id }) => id === faction.locationId);
    worldState.relations.push(
      createRelation({
        sourceId: faction.id,
        targetId: location.id,
        value: 55,
        reason: `${faction.name} toimii paikassa ${location.name}.`,
      }),
    );
  }

  if (worldState.factions.length > 1) {
    worldState.relations.push(
      createRelation({
        sourceId: firstFaction.id,
        targetId: secondFaction.id,
        value: -70,
        reason: `${firstFaction.name} ja ${secondFaction.name} kilpailevat alueen hallinnasta.`,
        dimensions: { trust: -65, respect: 20, fear: 30 },
      }),
    );
  }

  worldState.debts.push(
    createDebt({
      debtorId: first.id,
      creditorId: second.id,
      description: `${first.name} on ${second.name}lle henkensä velkaa.`,
      amount: 80,
    }),
  );
  worldState.secrets.push(
    createSecret({
      description: `${third.name} tietää ryhmän ${secondFaction.name} käyttämästä salareitistä.`,
      subjectIds: [secondFaction.id],
      knownByIds: [third.id],
      importance: 75,
    }),
  );
  worldState.events.push(
    createHistoricalEvent({
      type: "debtCreated",
      actorId: second.id,
      targetId: first.id,
      locationId: first.locationId,
      summary: `${second.name} pelasti ${first.name}n, ja heidän välilleen syntyi velka.`,
    }),
    createHistoricalEvent({
      type: "secretDiscovered",
      actorId: third.id,
      targetId: secondFaction.id,
      locationId: third.locationId,
      summary: `${third.name} löysi ryhmän ${secondFaction.name} salaisen reitin.`,
    }),
  );
}

function addHistoricalRelation(worldState, source, target, value, reason, eventType) {
  worldState.relations.push(
    createRelation({ sourceId: source.id, targetId: target.id, value, reason }),
  );
  worldState.events.push(
    createHistoricalEvent({
      type: eventType,
      actorId: target.id,
      targetId: source.id,
      locationId: source.locationId,
      summary: reason,
    }),
  );
}

function createHistoricalEvent({ type, actorId, targetId, locationId, summary }) {
  return createEvent({
    id: createId("event"),
    type,
    actorId,
    targetId,
    locationId,
    witnessIds: [],
    day: 0,
    summary,
    historical: true,
  });
}

function sample(values, count, random) {
  const remaining = [...values];
  const selected = [];

  while (selected.length < count) {
    const index = Math.floor(random() * remaining.length);
    selected.push(remaining.splice(index, 1)[0]);
  }

  return selected;
}

function pick(values, random) {
  return values[Math.floor(random() * values.length)];
}

function assertCount(name, value, min, max) {
  if (!Number.isInteger(value) || value < min || value > max) {
    throw new RangeError(`${name} pitää olla kokonaisluku väliltä ${min}...${max}.`);
  }
}
