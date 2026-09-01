import {
  createCharacter,
  createFaction,
  createLocation,
  createWorldState,
} from "./world-state.js";
import { validateWorldState } from "./validation.js";

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
  assertCount("characterCount", characterCount, 1, WORLD_LIMITS.characters);
  assertCount("locationCount", locationCount, 1, WORLD_LIMITS.locations);
  assertCount("factionCount", factionCount, 1, WORLD_LIMITS.factions);
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
      },
    });
  });

  validateWorldState(worldState);
  return worldState;
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
