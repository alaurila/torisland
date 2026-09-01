import { Profession } from "./profession.js";

export class ScribeProfession extends Profession {
  constructor() {
    super({ id: "scribe", name: "kirjuri", description: "Laatii sopimuksia, kopioi tekstejä ja ylläpitää arkistoja." });
  }
}

export const scribeProfession = new ScribeProfession();
