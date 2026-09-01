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
  const generateSituationButton = document.querySelector("#generate-situation");
  const questCountElement = document.querySelector("#quest-count");
  const questsElement = document.querySelector("#quest-summary");

  return {
    setStatus(message) {
      if (statusElement) {
        statusElement.textContent = message;
      }
    },

    bindAdvance(handler) {
      advanceButton?.addEventListener("click", handler);
    },

    bindSituationGeneration(handler) {
      generateSituationButton?.addEventListener("click", handler);
    },

    bindQuestResolution(handler) {
      questsElement?.addEventListener("click", (event) => {
        const button = event.target.closest?.("button[data-quest-id][data-action-id]");
        if (button) handler(button.dataset.questId, button.dataset.actionId);
      });
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
      setText(
        questCountElement,
        `${worldState.activeQuests.length} aktiivista · ${worldState.completedQuests.length} tehty`,
      );

      const entities = new Map(
        [...worldState.characters, ...worldState.locations, ...worldState.factions].map(
          (entity) => [entity.id, entity],
        ),
      );

      renderSummaryList(
        charactersElement,
        worldState.characters,
        (character) => {
          const relations = worldState.relations
            .filter(({ sourceId }) => sourceId === character.id)
            .sort((left, right) => Math.abs(right.value) - Math.abs(left.value))
            .slice(0, 2)
            .map((relation) => `${entities.get(relation.targetId)?.name}: ${signed(relation.value)}`)
            .join(", ");
          return `${character.name}, ${character.role} — tavoite ${character.goal.progress}/100. Suhteet: ${relations || "ei merkittäviä"}.`;
        },
      );
      renderSummaryList(locationsElement, worldState.locations, (location) => location.name);
      renderSummaryList(factionsElement, worldState.factions, (faction) => faction.name);
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
        (situation) => {
          const partyIds = new Set(situation.partyIds);
          const relationEvidence = worldState.relations
            .filter(({ sourceId, targetId }) => partyIds.has(sourceId) && partyIds.has(targetId))
            .slice(0, 3)
            .map((relation) =>
              `${entities.get(relation.sourceId)?.name} → ${entities.get(relation.targetId)?.name} ${signed(relation.value)}`)
            .join(", ");
          return `${situation.title} — jännite ${situation.tension}. Perusteet: ${situation.reasons.join(" ")} Suhdearvot: ${relationEvidence || "ei suoraa suhdetta"}.`;
        },
      );
      renderQuestCards(questsElement, worldState.activeQuests);
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

function renderQuestCards(element, quests) {
  if (!element) return;
  element.replaceChildren(
    ...quests.map((quest) => {
      const card = element.ownerDocument.createElement("article");
      card.className = "quest-card";
      const title = element.ownerDocument.createElement("h3");
      title.textContent = quest.title;
      const description = element.ownerDocument.createElement("p");
      description.textContent = quest.description;
      const actions = element.ownerDocument.createElement("div");
      actions.className = "quest-actions";
      for (const questAction of quest.actions) {
        const button = element.ownerDocument.createElement("button");
        button.type = "button";
        button.className = "secondary-button";
        button.dataset.questId = quest.id;
        button.dataset.actionId = questAction.id;
        button.textContent = questAction.label;
        actions.append(button);
      }
      card.append(title, description, actions);
      return card;
    }),
  );
}

function signed(value) {
  return value > 0 ? `+${value}` : `${value}`;
}
