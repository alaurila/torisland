import { Profession } from "./profession.js";

export class ShipwrightProfession extends Profession {
  constructor() {
    super({ id: "shipwright", name: "laivanrakentaja", description: "Rakentaa ja korjaa veneitä sekä suuria purjealuksia." });
  }
}

export const shipwrightProfession = new ShipwrightProfession();
