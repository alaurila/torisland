import { Profession } from "./profession.js";

export class MasonProfession extends Profession {
  constructor() {
    super({ id: "mason", name: "kivenhakkaaja", description: "Muotoilee kiveä rakennuksiin, muureihin ja muistomerkkeihin." });
  }
}

export const masonProfession = new MasonProfession();
