import { Profession } from "./profession.js";

export class MerchantProfession extends Profession {
  constructor() {
    super({ id: "merchant", name: "kauppias", description: "Ostaa, myy ja järjestää kauppareittejä." });
  }
}

export const merchantProfession = new MerchantProfession();
