import { Profession } from "./profession.js";

export class BakerProfession extends Profession {
  constructor() {
    super({ id: "baker", name: "leipuri", description: "Leipoo leipää ja valmistaa herkkuja juhliin." });
  }
}

export const bakerProfession = new BakerProfession();
