import { Profession } from "./profession.js";

export class InnkeeperProfession extends Profession {
  constructor() {
    super({ id: "innkeeper", name: "majatalonpitäjä", description: "Tarjoaa suojaa ja kuulee matkalaisten huhut." });
  }
}

export const innkeeperProfession = new InnkeeperProfession();
