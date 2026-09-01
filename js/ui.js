import { PROFESSIONS } from "./professions/index.js";
import { GOALS } from "./goals.js";

/**
 * Vastaa DOM-päivityksistä ja käyttöliittymän tapahtumista.
 */
export function createUi(document) {
  const statusElement = document.querySelector("#app-status");
  const headingElement = document.querySelector("#world-heading");
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
  const tabButtons = [...document.querySelectorAll("[data-tab-target]")];
  const tabPanels = [...document.querySelectorAll("[data-tab-panel]")];
  const locationDirectory = document.querySelector("#location-directory");
  const guildDirectory = document.querySelector("#guild-directory");
  const peopleDirectory = document.querySelector("#people-directory");
  const personDetail = document.querySelector("#person-detail");
  const addCharacterButton = document.querySelector("#add-character");
  let currentWorldState = null;
  let selectedPersonId = null;

  for (const button of tabButtons) {
    button.addEventListener("click", () => activateTab(button.dataset.tabTarget));
  }

  document.addEventListener("click", (event) => {
    const link = event.target.closest?.("a[data-person-id]");
    if (!link || !currentWorldState) return;
    event.preventDefault();
    selectedPersonId = link.dataset.personId;
    activateTab("people");
    renderPersonDetail(personDetail, currentWorldState, selectedPersonId);
    updateSelectedPersonLinks(document, selectedPersonId);
  });

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

    bindCharacterUpdate(handler) {
      personDetail?.addEventListener("submit", (event) => {
        const form = event.target.closest?.("form[data-character-id]");
        if (!form) return;
        event.preventDefault();
        const aliases = form.elements.aliases.value
          .split(",")
          .map((alias) => alias.trim())
          .filter(Boolean);
        handler(form.dataset.characterId, {
          firstName: form.elements.firstName.value.trim(),
          lastName: form.elements.lastName.value.trim(),
          race: form.elements.race.value.trim(),
          age: Number(form.elements.age.value),
          aliases,
          professionId: form.elements.professionId.value,
          factionId: form.elements.factionId.value || null,
        });
      });
    },

    bindCharacterCreation(handler) {
      addCharacterButton?.addEventListener("click", handler);
    },

    bindCharacterGoalUpdate(handler) {
      personDetail?.addEventListener("submit", (event) => {
        const form = event.target.closest?.("form[data-goal-character-id]");
        if (!form) return;
        event.preventDefault();
        handler(form.dataset.goalCharacterId, form.elements.goalType.value);
      });
    },

    showPerson(personId) {
      if (!currentWorldState) return;
      selectedPersonId = personId;
      activateTab("people");
      renderPeopleDirectory(peopleDirectory, currentWorldState, selectedPersonId);
      renderPersonDetail(personDetail, currentWorldState, selectedPersonId);
      updateSelectedPersonLinks(document, selectedPersonId);
    },

    renderWorldSummary(worldState) {
      currentWorldState = worldState;
      selectedPersonId ??= worldState.characters[0]?.id ?? null;
      if (headingElement) {
        headingElement.textContent = `Päivä ${worldState.day} — pieni maailma herää`;
      }

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
      renderEventCards(
        eventsElement,
        [...worldState.events].reverse().slice(0, 8),
        entities,
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
      renderLocationDirectory(locationDirectory, worldState);
      renderGuildDirectory(guildDirectory, worldState);
      renderPeopleDirectory(peopleDirectory, worldState, selectedPersonId);
      renderPersonDetail(personDetail, worldState, selectedPersonId);
    },
  };

  function activateTab(tabName) {
    for (const panel of tabPanels) panel.hidden = panel.dataset.tabPanel !== tabName;
    for (const button of tabButtons) {
      const selected = button.dataset.tabTarget === tabName;
      button.classList.toggle("is-active", selected);
      button.setAttribute("aria-selected", String(selected));
    }
  }
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

function renderEventCards(element, events, entities) {
  if (!element) return;
  element.classList.add("event-list");
  element.replaceChildren(
    ...events.map((event) => {
      const item = element.ownerDocument.createElement("li");
      item.className = "event-card";

      const meta = element.ownerDocument.createElement("div");
      meta.className = "event-meta";
      const day = element.ownerDocument.createElement("span");
      day.className = "event-day";
      day.textContent = event.historical ? "Ennen alkua" : `Päivä ${event.day}`;
      meta.append(day);

      const location = entities.get(event.locationId);
      if (location) {
        const place = element.ownerDocument.createElement("span");
        place.className = "event-location";
        place.textContent = `⌖ ${location.name}`;
        meta.append(place);
      }

      const summary = element.ownerDocument.createElement("p");
      summary.className = "event-summary";
      summary.textContent = event.summary;
      item.append(meta, summary);

      if (event.effects.length > 0) {
        const effectHeading = element.ownerDocument.createElement("p");
        effectHeading.className = "event-effect-heading";
        effectHeading.textContent = "Seuraukset";
        const effects = element.ownerDocument.createElement("ul");
        effects.className = "event-effects";
        for (const effect of event.effects) {
          const effectItem = element.ownerDocument.createElement("li");
          effectItem.textContent = effect;
          effects.append(effectItem);
        }
        item.append(effectHeading, effects);
      }

      return item;
    }),
  );
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

function renderLocationDirectory(element, worldState) {
  if (!element) return;
  element.replaceChildren(
    ...worldState.locations.map((location) => {
      const people = worldState.characters.filter(({ locationId }) => locationId === location.id);
      return directoryCard(
        element.ownerDocument,
        location.name,
        `${location.description} Turvallisuus ${location.safety}/100.`,
        people,
        "Ei hahmoja tässä lokaatiossa.",
      );
    }),
  );
}

function renderGuildDirectory(element, worldState) {
  if (!element) return;
  element.replaceChildren(
    ...worldState.factions.map((faction) => {
      const members = worldState.characters.filter(({ factionIds }) => factionIds.includes(faction.id));
      return directoryCard(
        element.ownerDocument,
        faction.name,
        `${faction.description} Tavoite: ${faction.goal?.label ?? "ei tavoitetta"}.`,
        members,
        "Ei tunnettuja jäseniä.",
      );
    }),
  );
}

function directoryCard(document, titleText, descriptionText, people, emptyText) {
  const card = document.createElement("article");
  card.className = "directory-card";
  const title = document.createElement("h3");
  title.textContent = titleText;
  const description = document.createElement("p");
  description.textContent = descriptionText;
  const list = document.createElement("ul");
  list.className = "linked-list";
  if (people.length === 0) {
    const empty = document.createElement("li");
    empty.className = "muted";
    empty.textContent = emptyText;
    list.append(empty);
  } else {
    for (const person of people) {
      const item = document.createElement("li");
      item.append(createPersonLink(document, person));
      list.append(item);
    }
  }
  card.append(title, description, list);
  return card;
}

function renderPeopleDirectory(element, worldState, selectedPersonId) {
  if (!element) return;
  element.replaceChildren(
    ...worldState.characters.map((person) => createPersonLink(element.ownerDocument, person)),
  );
  updateSelectedPersonLinks(element.ownerDocument, selectedPersonId);
}

function createPersonLink(document, person) {
  const link = document.createElement("a");
  link.className = "person-link";
  link.href = `#person-${person.id}`;
  link.dataset.personId = person.id;
  link.textContent = `${person.name} · ${person.role}`;
  return link;
}

function updateSelectedPersonLinks(document, selectedPersonId) {
  for (const link of document.querySelectorAll("a[data-person-id]")) {
    link.classList.toggle("is-selected", link.dataset.personId === selectedPersonId);
  }
}

function renderPersonDetail(element, worldState, personId) {
  if (!element) return;
  const person = worldState.characters.find(({ id }) => id === personId);
  if (!person) {
    element.replaceChildren();
    return;
  }
  const entities = new Map(
    [...worldState.characters, ...worldState.locations, ...worldState.factions]
      .map((entity) => [entity.id, entity]),
  );
  const location = entities.get(person.locationId);
  const guilds = person.factionIds.map((id) => entities.get(id)?.name).filter(Boolean);
  const profession = PROFESSIONS.find(({ id }) => id === person.professionId);
  const relations = worldState.relations
    .filter(({ sourceId, targetId }) => sourceId === person.id || targetId === person.id)
    .sort((left, right) => Math.abs(right.value) - Math.abs(left.value))
    .map((relation) => {
      const otherId = relation.sourceId === person.id ? relation.targetId : relation.sourceId;
      const direction = relation.sourceId === person.id ? "→" : "←";
      return relationRow(element.ownerDocument, entities.get(otherId), direction, relation);
    });
  const memories = worldState.memories
    .filter(({ ownerId }) => ownerId === person.id)
    .map((memory) => `${memory.reason} Voimakkuus ${memory.strength}/100.`);
  const knowledge = worldState.knowledge
    .filter(({ knowerId }) => knowerId === person.id)
    .map((fact) => {
      const event = worldState.events.find(({ id }) => id === fact.eventId);
      return fact.type === "witnessKnown"
        ? `Tietää, että ${entities.get(fact.subjectId)?.name ?? "joku"} todisti tapahtuman: ${event?.summary ?? "tuntematon tapahtuma"}`
        : `Tietää tapahtumasta: ${event?.summary ?? "tuntematon tapahtuma"}`;
    });
  const debts = worldState.debts
    .filter(({ debtorId, creditorId }) => debtorId === person.id || creditorId === person.id)
    .map((debt) => debt.description);
  const conflicts = worldState.conflicts
    .filter(({ partyIds, status }) => status === "unresolved" && partyIds.includes(person.id))
    .map((conflict) => `${conflict.reason} Kiireellisyys ${conflict.urgency}/100.`);

  const heading = element.ownerDocument.createElement("header");
  heading.className = "person-heading";
  const eyebrow = element.ownerDocument.createElement("p");
  eyebrow.className = "label";
  eyebrow.textContent = person.role;
  const title = element.ownerDocument.createElement("h2");
  title.id = `person-${person.id}`;
  title.textContent = person.name;
  const meta = element.ownerDocument.createElement("p");
  meta.className = "person-meta";
  meta.textContent = `${person.race} · ${person.age} vuotta · ${location?.name ?? "Ei sijaintia"} · ${guilds.join(", ") || "Ei kiltaa"}`;
  heading.append(eyebrow, title, meta);

  element.replaceChildren(
    heading,
    identityForm(element.ownerDocument, person, worldState.factions),
    statusBlock(element.ownerDocument, "Ammatti", [profession?.describe() ?? person.role]),
    statusBlock(element.ownerDocument, "Lisänimet ja aliakset", person.aliases),
    statusBlock(element.ownerDocument, "Ominaisuudet", person.traits),
    statusBlock(element.ownerDocument, "Tavoite", [
      `${person.goal.label} — eteneminen ${person.goal.progress}/100, prioriteetti ${person.goal.priority}/100`,
    ]),
    goalForm(element.ownerDocument, person),
    statusBlock(element.ownerDocument, "Suhteet", relations, true),
    statusBlock(element.ownerDocument, "Muistot", memories),
    statusBlock(element.ownerDocument, "Tiedot", knowledge),
    statusBlock(element.ownerDocument, "Velat", debts),
    statusBlock(element.ownerDocument, "Aktiiviset konfliktit", conflicts),
  );
}

function identityForm(document, person, factions) {
  const details = document.createElement("details");
  details.className = "identity-editor";
  const summary = document.createElement("summary");
  summary.textContent = "✎ Muokkaa identiteettiä";
  const form = document.createElement("form");
  form.className = "identity-form";
  form.dataset.characterId = person.id;
  const fields = document.createElement("div");
  fields.className = "identity-fields";
  fields.append(
    identityField(document, "Etunimi", "firstName", person.firstName, true),
    identityField(document, "Sukunimi", "lastName", person.lastName, true),
    identityField(document, "Rotu", "race", person.race, true),
    identityNumberField(document, "Ikä", "age", person.age, 18),
    identityField(document, "Lisänimet pilkuilla", "aliases", person.aliases.join(", "), false),
    professionField(document, person.professionId),
    factionField(document, factions, person.factionIds[0] ?? null),
  );
  const submit = document.createElement("button");
  submit.type = "submit";
  submit.className = "primary-button";
  submit.textContent = "Tallenna identiteetti";
  form.append(fields, submit);
  details.append(summary, form);
  return details;
}

function identityField(document, labelText, name, value, required) {
  const label = document.createElement("label");
  label.className = "identity-field";
  const text = document.createElement("span");
  text.textContent = labelText;
  const input = document.createElement("input");
  input.type = "text";
  input.name = name;
  input.value = value;
  input.required = required;
  input.autocomplete = "off";
  label.append(text, input);
  return label;
}

function identityNumberField(document, labelText, name, value, minimum) {
  const label = document.createElement("label");
  label.className = "identity-field";
  const text = document.createElement("span");
  text.textContent = labelText;
  const input = document.createElement("input");
  input.type = "number";
  input.name = name;
  input.value = String(value);
  input.min = String(minimum);
  input.step = "1";
  input.required = true;
  label.append(text, input);
  return label;
}

function professionField(document, selectedProfessionId) {
  const label = document.createElement("label");
  label.className = "identity-field";
  const text = document.createElement("span");
  text.textContent = "Ammatti";
  const select = document.createElement("select");
  select.name = "professionId";
  for (const profession of PROFESSIONS) {
    const option = document.createElement("option");
    option.value = profession.id;
    option.textContent = profession.name;
    option.title = profession.description;
    option.selected = profession.id === selectedProfessionId;
    select.append(option);
  }
  label.append(text, select);
  return label;
}

function factionField(document, factions, selectedFactionId) {
  const label = document.createElement("label");
  label.className = "identity-field";
  const text = document.createElement("span");
  text.textContent = "Kilta";
  const select = document.createElement("select");
  select.name = "factionId";
  const noFaction = document.createElement("option");
  noFaction.value = "";
  noFaction.textContent = "Ei kiltaa";
  noFaction.selected = selectedFactionId === null;
  select.append(noFaction);
  for (const faction of factions) {
    const option = document.createElement("option");
    option.value = faction.id;
    option.textContent = faction.name;
    option.selected = faction.id === selectedFactionId;
    select.append(option);
  }
  label.append(text, select);
  return label;
}

function goalForm(document, person) {
  const details = document.createElement("details");
  details.className = "identity-editor goal-editor";
  const summary = document.createElement("summary");
  summary.textContent = "◎ Muokkaa tavoitetta";
  const form = document.createElement("form");
  form.className = "identity-form";
  form.dataset.goalCharacterId = person.id;
  const label = document.createElement("label");
  label.className = "identity-field";
  const labelText = document.createElement("span");
  labelText.textContent = "Uusi tavoite";
  const select = document.createElement("select");
  select.name = "goalType";
  for (const goal of GOALS) {
    const option = document.createElement("option");
    option.value = goal.type;
    option.textContent = goal.label;
    option.selected = goal.type === person.goal.type;
    select.append(option);
  }
  label.append(labelText, select);
  const warning = document.createElement("p");
  warning.className = "form-note";
  warning.textContent = "Tavoitteen vaihtaminen nollaa nykyisen etenemisen.";
  const submit = document.createElement("button");
  submit.type = "submit";
  submit.className = "primary-button";
  submit.textContent = "Vaihda tavoite";
  form.append(label, warning, submit);
  details.append(summary, form);
  return details;
}

function relationRow(document, other, direction, relation) {
  const fragment = document.createDocumentFragment();
  if (other && "role" in other) fragment.append(createPersonLink(document, other));
  else fragment.append(document.createTextNode(other?.name ?? "Tuntematon"));
  fragment.append(document.createTextNode(
    ` ${direction} ${signed(relation.value)} — ${relation.reason}`,
  ));
  return fragment;
}

function statusBlock(document, titleText, items, nodes = false) {
  const section = document.createElement("section");
  section.className = "status-block";
  const title = document.createElement("h3");
  title.textContent = titleText;
  const list = document.createElement("ul");
  list.className = "linked-list";
  if (items.length === 0) {
    const item = document.createElement("li");
    item.className = "muted";
    item.textContent = "Ei tietoja.";
    list.append(item);
  } else {
    for (const value of items) {
      const item = document.createElement("li");
      if (nodes) item.append(value);
      else item.textContent = value;
      list.append(item);
    }
  }
  section.append(title, list);
  return section;
}
