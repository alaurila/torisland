import { Profession } from "./profession.js";

export class CarpenterProfession extends Profession {
  constructor() {
    super({ id: "carpenter", name: "puuseppä", description: "Rakentaa kalusteita, ovia ja puisia rakennuksia." });
  }
}

export const carpenterProfession = new CarpenterProfession();
