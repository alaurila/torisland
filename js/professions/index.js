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
]);

const PROFESSIONS_BY_ID = new Map(PROFESSIONS.map((profession) => [profession.id, profession]));

export function getProfession(professionId) {
  return PROFESSIONS_BY_ID.get(professionId) ?? null;
}
