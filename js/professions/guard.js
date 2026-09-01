import { Profession } from "./profession.js";

export class GuardProfession extends Profession {
  constructor() {
    super({ id: "guard", name: "satamavahti", description: "Valvoo satamaa, kulkijoita ja lastia." });
  }
}

export const guardProfession = new GuardProfession();
