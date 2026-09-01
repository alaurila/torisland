import { Profession } from "./profession.js";

export class MagistrateProfession extends Profession {
  constructor() {
    super({ id: "magistrate", name: "tuomari", description: "Tulkitsee lakia ja ratkaisee yhteisön riitoja." });
  }
}

export const magistrateProfession = new MagistrateProfession();
