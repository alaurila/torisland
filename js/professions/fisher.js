import { Profession } from "./profession.js";

export class FisherProfession extends Profession {
  constructor() {
    super({ id: "fisher", name: "kalastaja", description: "Pyytää kalaa rannikoilta, joilta ja järviltä." });
  }
}

export const fisherProfession = new FisherProfession();
