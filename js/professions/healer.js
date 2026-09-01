import { Profession } from "./profession.js";

export class HealerProfession extends Profession {
  constructor() {
    super({ id: "healer", name: "parantaja", description: "Hoitaa sairaita ja tuntee lääkekasvit." });
  }
}

export const healerProfession = new HealerProfession();
