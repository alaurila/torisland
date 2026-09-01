import { Profession } from "./profession.js";

export class PriestProfession extends Profession {
  constructor() {
    super({ id: "priest", name: "pappi", description: "Hoitaa pyhiä menoja ja neuvoo hengellisissä asioissa." });
  }
}

export const priestProfession = new PriestProfession();
