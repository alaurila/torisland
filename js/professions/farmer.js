import { Profession } from "./profession.js";

export class FarmerProfession extends Profession {
  constructor() {
    super({ id: "farmer", name: "maanviljelijä", description: "Viljelee maata ja huolehtii kylän ruokahuollosta." });
  }
}

export const farmerProfession = new FarmerProfession();
