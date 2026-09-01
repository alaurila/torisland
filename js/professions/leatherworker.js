import { Profession } from "./profession.js";

export class LeatherworkerProfession extends Profession {
  constructor() {
    super({ id: "leatherworker", name: "nahkuri", description: "Valmistaa nahasta varusteita, satuloita ja suojuksia." });
  }
}

export const leatherworkerProfession = new LeatherworkerProfession();
