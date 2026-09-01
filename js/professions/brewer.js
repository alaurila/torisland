import { Profession } from "./profession.js";

export class BrewerProfession extends Profession {
  constructor() {
    super({ id: "brewer", name: "panimomestari", description: "Panee olutta, simaa ja muita paikallisia juomia." });
  }
}

export const brewerProfession = new BrewerProfession();
