import { Profession } from "./profession.js";

export class MinerProfession extends Profession {
  constructor() {
    super({ id: "miner", name: "kaivostyöläinen", description: "Louhii maan alta malmia, kiveä ja harvinaisia mineraaleja." });
  }
}

export const minerProfession = new MinerProfession();
