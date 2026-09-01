import { Profession } from "./profession.js";

export class AlchemistProfession extends Profession {
  constructor() {
    super({ id: "alchemist", name: "alkemisti", description: "Tutkii aineita ja valmistaa rohtoja, myrkkyjä sekä seoksia." });
  }
}

export const alchemistProfession = new AlchemistProfession();
