const { getBoard, getBoardSize, buildEventForLanding } = require("./eventGenerator");
const { applyEffects, calculateLegacyScore } = require("./statsEngine");
const { updateNarrativeState } = require("./narrativeState");
const llmService = require("../services/llmService");

function getPlayers(room) {
  return Array.from(room.players.values());
}

function getActivePlayer(room) {
  const players = getPlayers(room);
  return players[room.activePlayerIndex] || players[0];
}

function startGame(room) {
  const players = getPlayers(room);

  for (const player of players) {
    player.position = 0;
    player.finished = false;
    if (player.narrativeState) {
      player.narrativeState.hasPartner = false;
      player.narrativeState.married = false;
      player.narrativeState.hasChildren = false;
      player.narrativeState.triedWeed = false;
      player.narrativeState.quitWeed = false;
      player.narrativeState.partyReputation = 0;
      player.narrativeState.riskySideHustle = false;
      player.narrativeState.caughtAtWork = false;
      player.narrativeState.scandals = 0;
      player.narrativeState.educationPath = null;
    }
    player.timeline = [];
    player.legacyScore = null;
    player.finalSummary = null;
  }

  room.status = "playing";
  room.phase = "roll";
  room.board = getBoard();
  room.boardSize = getBoardSize();
  room.activePlayerIndex = 0;
  room.activePlayerId = players[0]?.id || null;
  room.turnNumber = 1;
  room.diceRoll = null;
  room.currentEvent = null;
  room.lastResult = null;
  room.roundResults = [];
}

async function rollDice(room, playerId, onRolled) {
  if (room.processingAction) {
    throw new Error("La partida esta procesando una accion.");
  }

  if (room.status !== "playing" || room.phase !== "roll") {
    throw new Error("Ahora no toca tirar el dado.");
  }

  const player = getActivePlayer(room);

  if (!player || player.id !== playerId) {
    throw new Error("No es tu turno.");
  }

  room.processingAction = true;

  try {
    const roll = Math.floor(Math.random() * 6) + 1;
    const nextPosition = Math.min(room.boardSize, player.position + roll);
    const square = room.board[nextPosition - 1];

    player.position = nextPosition;
    room.diceRoll = roll;
    const baseEvent = buildEventForLanding(player, square, roll);

    if (typeof onRolled === "function") {
      onRolled();
    }

    room.currentEvent = await llmService.generateDecisionEvent({
      player,
      event: baseEvent,
      room,
    });
    room.phase = "decision";
    room.lastResult = null;

    return room.currentEvent;
  } finally {
    room.processingAction = false;
  }
}

async function submitDecision(room, playerId, optionId) {
  if (room.processingAction) {
    throw new Error("La partida esta procesando una accion.");
  }

  if (room.status !== "playing" || room.phase !== "decision") {
    throw new Error("La sala no esta esperando una decision.");
  }

  const player = getActivePlayer(room);

  if (!player || player.id !== playerId) {
    throw new Error("No es tu turno.");
  }

  const option = room.currentEvent.options.find((item) => item.id === optionId);

  if (!option) {
    throw new Error("Decision no valida.");
  }

  room.processingAction = true;

  try {
    const generated = await llmService.generateRoundNarrative({
      player,
      event: room.currentEvent,
      option,
    });

    player.stats = applyEffects(player.stats, generated.effects);
    player.finished = player.position >= room.boardSize;
    updateNarrativeState(player, generated.futureFlag || option.flag);
    player.timeline.push({
      turn: room.turnNumber,
      position: player.position,
      stage: room.currentEvent.stage,
      stat: room.currentEvent.stat,
      event: room.currentEvent.title,
      decision: option.text,
      consequence: generated.narrative,
      changes: generated.effects,
      flag: generated.futureFlag || option.flag,
    });

    const result = {
      playerId,
      playerName: player.name,
      position: player.position,
      stat: room.currentEvent.stat,
      statLabel: room.currentEvent.stage,
      optionText: option.text,
    narrative: generated.narrative,
    effects: generated.effects,
    stats: player.stats,
    flag: generated.futureFlag || option.flag,
    narrativeState: player.narrativeState,
    finished: player.finished,
  };

    room.lastResult = result;
    room.roundResults = [result];
    room.phase = "turnResult";

    return result;
  } finally {
    room.processingAction = false;
  }
}

async function advanceTurn(room, playerId) {
  if (room.processingAction) {
    throw new Error("La partida esta procesando una accion.");
  }

  if (room.status !== "playing" || room.phase !== "turnResult") {
    throw new Error("Aun no se puede pasar el turno.");
  }

  const activePlayer = getActivePlayer(room);

  if (activePlayer && activePlayer.id !== playerId && room.hostId !== playerId) {
    throw new Error("Solo el jugador activo o el host pueden pasar turno.");
  }

  if (getPlayers(room).every((player) => player.finished)) {
    return finishGame(room);
  }

  const players = getPlayers(room);
  let nextIndex = room.activePlayerIndex;

  do {
    nextIndex = (nextIndex + 1) % players.length;
  } while (players[nextIndex].finished);

  room.activePlayerIndex = nextIndex;
  room.activePlayerId = players[nextIndex].id;
  room.turnNumber += 1;
  room.phase = "roll";
  room.diceRoll = null;
  room.currentEvent = null;
  room.lastResult = null;
  room.roundResults = [];

  return room;
}

async function finishGame(room) {
  room.status = "finished";
  room.phase = "final";
  room.activePlayerId = null;
  room.diceRoll = null;
  room.currentEvent = null;
  room.lastResult = null;
  room.roundResults = [];

  const players = getPlayers(room);

  for (const player of players) {
    const legacyScore = calculateLegacyScore(player.stats);
    player.legacyScore = legacyScore;
    player.finalSummary = await llmService.generateFinalSummary({ player, legacyScore });
  }

  return room;
}

module.exports = {
  startGame,
  rollDice,
  submitDecision,
  advanceTurn,
  finishGame,
};
