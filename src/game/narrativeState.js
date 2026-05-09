function updateNarrativeState(player, flag) {
  if (!player.narrativeState || !flag) return;

  const state = player.narrativeState;

  if (flag.includes("uab_student")) state.educationPath = "uab";
  if (flag.includes("early_worker")) state.educationPath = "work";
  if (flag.includes("study_work_grind")) state.educationPath = "study_work";

  if (flag.includes("started_relationship")) state.hasPartner = true;
  if (flag.includes("ended_relationship")) {
    state.hasPartner = false;
    state.married = false;
  }
  if (flag.includes("got_married")) {
    state.hasPartner = true;
    state.married = true;
  }
  if (flag.includes("had_children")) state.hasChildren = true;
  if (flag.includes("childfree_path")) state.hasChildren = false;

  if (flag.includes("tried_weed")) state.triedWeed = true;
  if (flag.includes("quit_weed") || flag.includes("cleaned_up_work")) state.quitWeed = true;
  if (flag.includes("risky_side_hustle")) state.riskySideHustle = true;
  if (flag.includes("caught_at_work")) state.caughtAtWork = true;

  if (flag.includes("wolf_legend") || flag.includes("party_excess")) state.partyReputation += 1;
  if (flag.includes("public_scandal") || flag.includes("viral")) state.scandals += 1;
}

module.exports = { updateNarrativeState };
