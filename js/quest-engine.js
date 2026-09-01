import { applyEventConsequences } from "./consequences.js";
import { createEvent } from "./events.js";
import { applyPlayerDecision } from "./world-simulation.js";
import { assertString, createId, validateWorldState } from "./validation.js";

const MAX_ACTIVE_QUESTS = 3;

const ACTIONS = Object.freeze({
  help: action("help", "Auta pyytäjää", "helpRequest", "{giver} auttoi ratkaisemaan ongelman, joka koski osapuolta {target}."),
  mediate: action("mediate", "Sovittele", "reconciliation", "{giver} ja {target} suostuivat sovitteluyritykseen paikassa {location}."),
  acquire: action("acquire", "Hanki puuttuva resurssi", "helpRequest", "{giver} hankki puuttuvan resurssin osapuolelle {target}."),
  reveal: action("reveal", "Paljasta salaisuus", "secretReveal", "{giver} paljasti osapuolta {target} koskevan salaisuuden."),
  conceal: action("conceal", "Peitä jäljet", "betrayal", "{giver} peitti osapuolta {target} koskevat jäljet ja petti muiden luottamuksen."),
  investigate: action("investigate", "Selvitä totuus", "helpRequest", "{giver} tutki osapuolta {target} koskevan tilanteen."),
  pressure: action("pressure", "Painosta osapuolta", "threat", "{giver} painosti osapuolta {target} paikassa {location}."),
  steal: action("steal", "Varasta tarvittava", "theft", "{giver} yritti varastaa tarvitsemansa osapuolelta {target}."),
  enforce: action("enforce", "Peri velka", "debtDemand", "{giver} vaati osapuolta {target} maksamaan velkansa."),
  sabotage: action("sabotage", "Sabotoi vastapuolta", "betrayal", "{giver} sabotoi osapuolen {target} suunnitelman."),
  supportTarget: action("support-target", "Asetu kohteen puolelle", "factionClash", "{target} sai tukea kiistassa osapuolta {giver} vastaan."),
});

export const QUEST_TEMPLATES = Object.freeze([
  questTemplate("recover-resource", "missingResource", ["missingResource", "resourceScarcity"],
    "Kadonnut resurssi", "{giver} tarvitsee apua: {reason}", [ACTIONS.acquire, ACTIONS.mediate, ACTIONS.steal]),
  questTemplate("settle-debt", "unpaidDebt", ["unpaidDebt"],
    "Erääntynyt velka", "Ratkaise osapuolten {giver} ja {target} välinen velka.", [ACTIONS.mediate, ACTIONS.enforce, ACTIONS.help]),
  questTemplate("expose-secret", "secret", ["dangerousSecret"],
    "Vaarallinen salaisuus", "{giver} tietää jotakin osapuolesta {target}.", [ACTIONS.reveal, ACTIONS.conceal, ACTIONS.investigate]),
  questTemplate("mediate-feud", "mediation", ["hostility", "enemiesInProximity"],
    "Katkera vihollisuus", "Estä osapuolten {giver} ja {target} välisen vihan kärjistyminen.", [ACTIONS.mediate, ACTIONS.help, ACTIONS.pressure]),
  questTemplate("faction-struggle", "faction", ["conflictingGoals"],
    "Valtataistelu", "{giver} ja {target} tavoittelevat ristiriitaisia päämääriä.", [ACTIONS.mediate, ACTIONS.supportTarget, ACTIONS.sabotage]),
  questTemplate("question-witnesses", "investigation", ["witnessedEvent"],
    "Todistajien kertomukset", "Selvitä, mitä paikassa {location} todella tapahtui.", [ACTIONS.investigate, ACTIONS.reveal, ACTIONS.conceal]),
  questTemplate("resolve-fallout", "fallout", ["eventFallout", "unresolvedPastEvent"],
    "Tapahtuman jälkiseuraukset", "Aiempi tapahtuma ajaa osapuolet {giver} ja {target} vastakkain.", [ACTIONS.mediate, ACTIONS.investigate, ACTIONS.pressure]),
  questTemplate("protect-threatened", "protection", ["threat", "robbery", "theft"],
    "Uhattu osapuoli", "Suojele osapuolta {target} paikassa {location}.", [ACTIONS.help, ACTIONS.pressure, ACTIONS.conceal]),
  questTemplate("find-compromise", "compromise", ["brokenPromise"],
    "Rikottu lupaus", "{giver} vaatii osapuolta {target} vastaamaan rikotusta lupauksesta.", [ACTIONS.mediate, ACTIONS.enforce, ACTIONS.help]),
  questTemplate("investigate-situation", "investigation", null,
    "Selvitä tilanne", "Tutki jännittynyttä tilannetta paikassa {location}: {reason}", [ACTIONS.investigate, ACTIONS.mediate, ACTIONS.supportTarget]),
]);

export function createQuestEngine({ maxActiveQuests = MAX_ACTIVE_QUESTS } = {}) {
  if (!Number.isInteger(maxActiveQuests) || maxActiveQuests < 1) {
    throw new RangeError("maxActiveQuests pitää olla positiivinen kokonaisluku.");
  }

  return {
    formQuests(worldState, situations = worldState.activeSituations) {
      const activeBySignature = new Map(
        worldState.activeQuests.map((quest) => [quest.situationSignature, quest]),
      );
      const completedSignatures = new Set(
        worldState.completedQuests.map(({ situationSignature }) => situationSignature),
      );
      const quests = [...worldState.activeQuests].slice(0, maxActiveQuests);

      for (const situation of situations) {
        const signature = situationSignature(situation);
        if (completedSignatures.has(signature)) continue;
        const existing = activeBySignature.get(signature);
        if (existing) {
          existing.situationId = situation.id;
          continue;
        }
        if (quests.length >= maxActiveQuests) continue;
        const template = QUEST_TEMPLATES.find((candidate) => isQuestTemplateEligible(candidate, situation));
        if (template) quests.push(createQuest(worldState, situation, template));
      }

      worldState.activeQuests = quests;
      validateWorldState(worldState);
      return quests;
    },

    resolveQuest(worldState, questId, actionId) {
      return resolveQuest(worldState, questId, actionId);
    },
  };
}

export function isQuestTemplateEligible(template, situation) {
  return (
    (!template.requirements.situationTypes ||
      template.requirements.situationTypes.includes(situation.type)) &&
    situation.tension >= template.requirements.minimumTension
  );
}

export function renderTemplate(text, values) {
  return text.replace(/\{(giver|target|location|reason)\}/g, (_, key) => values[key] ?? "");
}

function createQuest(worldState, situation, template) {
  const entities = entityMap(worldState);
  const giver = entities.get(situation.partyIds[0]);
  const target = entities.get(situation.partyIds[1]);
  const location = entities.get(situation.locationId);
  const values = {
    giver: giver.name,
    target: target.name,
    location: location.name,
    reason: situation.reasons[0],
  };
  const conflictId = situation.sourceIds.find((id) =>
    worldState.conflicts.some((conflict) => conflict.id === id)) ?? null;

  return {
    id: createId("quest"),
    type: template.type,
    title: renderTemplate(template.titleTemplate, values),
    description: renderTemplate(template.textTemplate, values),
    giverId: giver.id,
    targetId: target.id,
    locationId: location.id,
    situationId: situation.id,
    situationSignature: situationSignature(situation),
    conflictId,
    templateId: template.id,
    actions: template.actions.map((questAction) => ({
      ...questAction,
      summary: renderTemplate(questAction.summaryTemplate, values),
    })),
    status: "active",
    createdDay: worldState.day,
    resolution: null,
  };
}

function resolveQuest(worldState, questId, actionId) {
  assertString(questId, "questId");
  assertString(actionId, "actionId");
  const questIndex = worldState.activeQuests.findIndex(({ id }) => id === questId);
  if (questIndex < 0) throw new Error(`Aktiivista tehtävää ${questId} ei löytynyt.`);
  const quest = worldState.activeQuests[questIndex];
  const selectedAction = quest.actions.find(({ id }) => id === actionId);
  if (!selectedAction) throw new Error(`Tehtävän toimintoa ${actionId} ei löytynyt.`);

  applyPlayerDecision(worldState, {
    description: `Pelaaja ratkaisi tehtävän "${quest.title}": ${selectedAction.label}.`,
  });
  const witnesses = worldState.characters
    .filter((character) =>
      character.locationId === quest.locationId &&
      character.id !== quest.giverId &&
      character.id !== quest.targetId)
    .slice(0, 2)
    .map(({ id }) => id);
  const event = createEvent({
    type: selectedAction.eventType,
    actorId: quest.giverId,
    targetId: quest.targetId,
    locationId: quest.locationId,
    witnessIds: witnesses,
    day: worldState.day,
    summary: selectedAction.summary,
    templateId: `quest-action-${selectedAction.id}`,
    conflictId: quest.conflictId,
  });
  worldState.events.push(event);
  applyEventConsequences(worldState, event);

  quest.status = "completed";
  quest.resolution = {
    actionId: selectedAction.id,
    label: selectedAction.label,
    eventId: event.id,
    day: worldState.day,
  };
  worldState.activeQuests.splice(questIndex, 1);
  worldState.completedQuests.push(quest);
  worldState.activeSituations = worldState.activeSituations.filter(
    ({ id }) => id !== quest.situationId,
  );
  validateWorldState(worldState);
  return { quest, event };
}

function questTemplate(id, type, situationTypes, titleTemplate, textTemplate, actions) {
  return Object.freeze({
    id: `quest-template-${id}`,
    type,
    requirements: Object.freeze({ situationTypes, minimumTension: 20 }),
    participants: Object.freeze(["giver", "target"]),
    titleTemplate,
    textTemplate,
    actions: Object.freeze(actions),
  });
}

function action(id, label, eventType, summaryTemplate) {
  return Object.freeze({ id, label, eventType, summaryTemplate });
}

function situationSignature(situation) {
  return `${situation.type}:${[...situation.partyIds].sort().join(":")}`;
}

function entityMap(worldState) {
  return new Map(
    [...worldState.characters, ...worldState.factions, ...worldState.locations]
      .map((entity) => [entity.id, entity]),
  );
}
