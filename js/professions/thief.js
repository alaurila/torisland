import { Profession } from "./profession.js";

export class ThiefProfession extends Profession {
  constructor() {
    super({ id: "thief", name: "varas", description: "Hankkii elantonsa salaa, viekkaudella ja nopeilla käsillä." });
  }
}

export const thiefProfession = new ThiefProfession();
