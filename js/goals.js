export const GOALS = Object.freeze([
  Object.freeze({ type: "gainWealth", label: "rikastua" }),
  Object.freeze({ type: "protectCommunity", label: "suojella yhteisöä" }),
  Object.freeze({ type: "uncoverSecret", label: "paljastaa vanha salaisuus" }),
  Object.freeze({ type: "gainInfluence", label: "kasvattaa vaikutusvaltaansa" }),
  Object.freeze({ type: "repayDebt", label: "maksaa vaarallinen velka" }),
  Object.freeze({ type: "findPerson", label: "löytää kadonnut läheinen" }),
  Object.freeze({ type: "restoreHonor", label: "palauttaa maineensa" }),
  Object.freeze({ type: "secureTrade", label: "turvata kauppareitti" }),
  Object.freeze({ type: "masterCraft", label: "valmistaa mestariteos" }),
  Object.freeze({ type: "leaveTown", label: "päästä pois kaupungista" }),
]);

const GOALS_BY_TYPE = new Map(GOALS.map((goal) => [goal.type, goal]));

export function getGoal(goalType) {
  return GOALS_BY_TYPE.get(goalType) ?? null;
}
