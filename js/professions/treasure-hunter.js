import { Profession } from "./profession.js";

export class TreasureHunterProfession extends Profession {
  constructor() {
    super({ id: "treasure-hunter", name: "aarteenetsijä", description: "Etsii unohdettuja aarteita ja kadonneita paikkoja." });
  }
}

export const treasureHunterProfession = new TreasureHunterProfession();
