import { Profession } from "./profession.js";

export class SailorProfession extends Profession {
  constructor() {
    super({ id: "sailor", name: "merimies", description: "Kuljettaa aluksia ja lasteja vaarallisilla vesillä." });
  }
}

export const sailorProfession = new SailorProfession();
