import { merchantProfession } from "./merchant.js";
import { mercenaryProfession } from "./mercenary.js";
import { elderProfession } from "./elder.js";
import { healerProfession } from "./healer.js";
import { guardProfession } from "./guard.js";
import { cartographerProfession } from "./cartographer.js";
import { blacksmithProfession } from "./blacksmith.js";
import { messengerProfession } from "./messenger.js";
import { innkeeperProfession } from "./innkeeper.js";
import { treasureHunterProfession } from "./treasure-hunter.js";
import { farmerProfession } from "./farmer.js";
import { fisherProfession } from "./fisher.js";
import { hunterProfession } from "./hunter.js";
import { bakerProfession } from "./baker.js";
import { brewerProfession } from "./brewer.js";
import { carpenterProfession } from "./carpenter.js";
import { masonProfession } from "./mason.js";
import { tailorProfession } from "./tailor.js";
import { leatherworkerProfession } from "./leatherworker.js";
import { sailorProfession } from "./sailor.js";
import { shipwrightProfession } from "./shipwright.js";
import { priestProfession } from "./priest.js";
import { scribeProfession } from "./scribe.js";
import { alchemistProfession } from "./alchemist.js";
import { minerProfession } from "./miner.js";
import { woodcutterProfession } from "./woodcutter.js";
import { bardProfession } from "./bard.js";
import { thiefProfession } from "./thief.js";
import { magistrateProfession } from "./magistrate.js";
import { stablemasterProfession } from "./stablemaster.js";

export const PROFESSIONS = Object.freeze([
  merchantProfession,
  mercenaryProfession,
  elderProfession,
  healerProfession,
  guardProfession,
  cartographerProfession,
  blacksmithProfession,
  messengerProfession,
  innkeeperProfession,
  treasureHunterProfession,
  farmerProfession,
  fisherProfession,
  hunterProfession,
  bakerProfession,
  brewerProfession,
  carpenterProfession,
  masonProfession,
  tailorProfession,
  leatherworkerProfession,
  sailorProfession,
  shipwrightProfession,
  priestProfession,
  scribeProfession,
  alchemistProfession,
  minerProfession,
  woodcutterProfession,
  bardProfession,
  thiefProfession,
  magistrateProfession,
  stablemasterProfession,
]);

const PROFESSIONS_BY_ID = new Map(PROFESSIONS.map((profession) => [profession.id, profession]));

export function getProfession(professionId) {
  return PROFESSIONS_BY_ID.get(professionId) ?? null;
}
