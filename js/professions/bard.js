import { Profession } from "./profession.js";

export class BardProfession extends Profession {
  constructor() {
    super({ id: "bard", name: "kiertelevä laulaja", description: "Viihdyttää yleisöä ja kuljettaa uutisia paikasta toiseen." });
  }
}

export const bardProfession = new BardProfession();
