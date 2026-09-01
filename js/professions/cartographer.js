import { Profession } from "./profession.js";

export class CartographerProfession extends Profession {
  constructor() {
    super({ id: "cartographer", name: "kartantekijä", description: "Kartoittaa reittejä ja tuntemattomia seutuja." });
  }
}

export const cartographerProfession = new CartographerProfession();
