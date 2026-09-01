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
  const relationCountElement = document.querySelector("#relation-count");
  const relationsElement = document.querySelector("#relation-summary");
  const conflictCountElement = document.querySelector("#conflict-count");
  const conflictsElement = document.querySelector("#conflict-summary");
  const eventCountElement = document.querySelector("#event-count");
  const eventsElement = document.querySelector("#event-summary");
  const situationCountElement = document.querySelector("#situation-count");
  const situationsElement = document.querySelector("#situation-summary");
  const advanceButton = document.querySelector("#advance-day");

  return {
    setStatus(message) {
      if (statusElement) {
        statusElement.textContent = message;
      }
    },

    bindAdvance(handler) {
      advanceButton?.addEventListener("click", handler);
    },

    renderWorldSummary(worldState) {
      if (headingElement) {
        headingElement.textContent = `Päivä ${worldState.day} — pieni maailma herää`;
      }

      setText(characterCountElement, `${worldState.characters.length} hahmoa`);
      setText(locationCountElement, `${worldState.locations.length} lokaatiota`);
      setText(factionCountElement, `${worldState.factions.length} ryhmää`);
      setText(relationCountElement, `${worldState.relations.length} suhdetta`);
      const unresolvedConflicts = worldState.conflicts.filter(
        ({ status }) => status === "unresolved",
      );
      setText(conflictCountElement, `${unresolvedConflicts.length} ratkaisematonta`);
      setText(eventCountElement, `${worldState.events.length} tapahtumaa`);
      setText(situationCountElement, `${worldState.activeSituations.length} aktiivista`);

      renderSummaryList(
        charactersElement,
        worldState.characters,
        (character) => `${character.name}, ${character.role} — haluaa ${character.goal.label}`,
      );
      renderSummaryList(locationsElement, worldState.locations, (location) => location.name);
      renderSummaryList(factionsElement, worldState.factions, (faction) => faction.name);
      const entities = new Map(
        [...worldState.characters, ...worldState.locations, ...worldState.factions].map(
          (entity) => [entity.id, entity],
        ),
      );
      renderSummaryList(
        relationsElement,
        [...worldState.relations]
          .sort((left, right) => Math.abs(right.value) - Math.abs(left.value))
          .slice(0, 6),
        (relation) => {
          const source = entities.get(relation.sourceId)?.name ?? "Tuntematon";
          const target = entities.get(relation.targetId)?.name ?? "tuntematon";
          const value = relation.value > 0 ? `+${relation.value}` : relation.value;
          return `${source} → ${target}: ${value}. ${relation.reason}`;
        },
      );
      renderSummaryList(
        conflictsElement,
        [...unresolvedConflicts].sort((left, right) => right.urgency - left.urgency),
        (conflict) => {
          const location = entities.get(conflict.locationId)?.name ?? "Tuntematon paikka";
          return `${conflict.reason} Kiireellisyys ${conflict.urgency}/100 — ${location}`;
        },
      );
      renderSummaryList(
        eventsElement,
        [...worldState.events].reverse().slice(0, 8),
        (event) => {
          const when = event.historical ? "Ennen alkua" : `Päivä ${event.day}`;
          const effects = event.effects.length > 0
            ? ` Seuraukset: ${event.effects.join("; ")}.`
            : "";
          return `${when}: ${event.summary}${effects}`;
        },
      );
      renderSummaryList(
        situationsElement,
        worldState.activeSituations,
        (situation) =>
          `${situation.title} — jännite ${situation.tension}. Perusteet: ${situation.reasons.join(" ")}`,
      );
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
