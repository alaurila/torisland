import { Profession } from "./profession.js";

export class MercenaryProfession extends Profession {
  constructor() {
    super({ id: "mercenary", name: "palkkasoturi", description: "Myy taistelutaitonsa maksavalle asiakkaalle." });
  }
}

export const mercenaryProfession = new MercenaryProfession();
