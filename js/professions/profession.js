/** Ammattien yhteinen äitiluokka. */
export class Profession {
  constructor({ id, name, description }) {
    if (!id || !name || !description) {
      throw new TypeError("Ammatti tarvitsee tunnisteen, nimen ja kuvauksen.");
    }
    this.id = id;
    this.name = name;
    this.description = description;
    Object.freeze(this);
  }

  describe() {
    return `${this.name}: ${this.description}`;
  }
}
