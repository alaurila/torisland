import { Profession } from "./profession.js";

export class StablemasterProfession extends Profession {
  constructor() {
    super({ id: "stablemaster", name: "tallimestari", description: "Hoitaa ratsuja ja järjestää hevosia matkustajille." });
  }
}

export const stablemasterProfession = new StablemasterProfession();
