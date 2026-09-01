import { Profession } from "./profession.js";

export class ElderProfession extends Profession {
  constructor() {
    super({ id: "elder", name: "kylänvanhin", description: "Edustaa yhteisöä ja ratkaisee sen kiistoja." });
  }
}

export const elderProfession = new ElderProfession();
