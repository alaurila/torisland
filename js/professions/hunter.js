import { Profession } from "./profession.js";

export class HunterProfession extends Profession {
  constructor() {
    super({ id: "hunter", name: "metsästäjä", description: "Jäljittää riistaa ja tuntee ympäröivät erämaat." });
  }
}

export const hunterProfession = new HunterProfession();
