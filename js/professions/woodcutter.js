import { Profession } from "./profession.js";

export class WoodcutterProfession extends Profession {
  constructor() {
    super({ id: "woodcutter", name: "metsuri", description: "Kaataa puita ja toimittaa rakennus- sekä polttopuuta." });
  }
}

export const woodcutterProfession = new WoodcutterProfession();
