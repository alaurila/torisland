import { Profession } from "./profession.js";

export class BlacksmithProfession extends Profession {
  constructor() {
    super({ id: "blacksmith", name: "seppä", description: "Takoo työkaluja, aseita ja harvinaisia esineitä." });
  }
}

export const blacksmithProfession = new BlacksmithProfession();
