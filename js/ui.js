/**
 * Vastaa DOM-päivityksistä ja käyttöliittymän tapahtumista.
 */
export function createUi(document) {
  const statusElement = document.querySelector("#app-status");

  return {
    setStatus(message) {
      if (statusElement) {
        statusElement.textContent = message;
      }
    },
  };
}
