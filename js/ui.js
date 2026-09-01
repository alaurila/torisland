/**
 * Vastaa DOM-päivityksistä ja käyttöliittymän tapahtumista.
 */
export function createUi(document) {
  const statusElement = document.querySelector("#app-status");
  const headingElement = document.querySelector("#world-heading");
  const charactersElement = document.querySelector("#character-summary");
  const locationsElement = document.querySelector("#location-summary");
  const factionsElement = document.querySelector("#faction-summary");
  const characterCountElement = document.querySelector("#character-count");
  const locationCountElement = document.querySelector("#location-count");
  const factionCountElement = document.querySelector("#faction-count");

  return {
    setStatus(message) {
      if (statusElement) {
        statusElement.textContent = message;
      }
    },

    renderWorldSummary(worldState) {
      if (headingElement) {
        headingElement.textContent = `Päivä ${worldState.day} — pieni maailma herää`;
      }

      setText(characterCountElement, `${worldState.characters.length} hahmoa`);
      setText(locationCountElement, `${worldState.locations.length} lokaatiota`);
      setText(factionCountElement, `${worldState.factions.length} ryhmää`);

      renderSummaryList(
        charactersElement,
        worldState.characters,
        (character) => `${character.name}, ${character.role} — haluaa ${character.goal.label}`,
      );
      renderSummaryList(locationsElement, worldState.locations, (location) => location.name);
      renderSummaryList(factionsElement, worldState.factions, (faction) => faction.name);
    },
  };
}

function renderSummaryList(element, items, formatItem) {
  if (!element) return;
  element.replaceChildren(
    ...items.map((item) => {
      const listItem = element.ownerDocument.createElement("li");
      listItem.textContent = formatItem(item);
      return listItem;
    }),
  );
}

function setText(element, text) {
  if (element) element.textContent = text;
}
