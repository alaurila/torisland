/**
 * Muuntaa rakenteisen tarinadatan käyttäjälle näytettäväksi tekstiksi.
 */
export function createTextGenerator() {
  return {
    renderSituation(situation) {
      return situation?.title ?? "Nimetön tilanne";
    },
  };
}
