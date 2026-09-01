import { Profession } from "./profession.js";

export class MessengerProfession extends Profession {
  constructor() {
    super({ id: "messenger", name: "sanansaattaja", description: "Kuljettaa viestejä vaarallistenkin rajojen yli." });
  }
}

export const messengerProfession = new MessengerProfession();
