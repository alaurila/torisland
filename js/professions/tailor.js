import { Profession } from "./profession.js";

export class TailorProfession extends Profession {
  constructor() {
    super({ id: "tailor", name: "räätäli", description: "Ompelee ja korjaa vaatteita kaikille säädyille." });
  }
}

export const tailorProfession = new TailorProfession();
