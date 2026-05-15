const { generateRoomCode } = require("../utils/codeGenerator");
const { createInitialStats } = require("./statsEngine");

const rooms = new Map();

const GENDER_META = {
  hombre: { label: "Hombre", glow: "#66d9e8" },
  mujer: { label: "Mujer", glow: "#ff8cc6" },
  otro: { label: "Otro", glow: "#c4a7ff" },
};

function normalizeGender(gender) {
  return Object.keys(GENDER_META).includes(gender) ? gender : "otro";
}

function createNarrativeState() {
  return {
    educationPath: null,
    hasPartner: false,
    married: false,
    hasChildren: false,
    triedWeed: false,
    quitWeed: false,
    partyReputation: 0,
    riskySideHustle: false,
    caughtAtWork: false,
    scandals: 0,
  };
}

function createPlayer({ clientId, playerName, gender, socketId }) {
  return {
    id: clientId,
    socketId,
    name: playerName.trim().slice(0, 24),
    gender: normalizeGender(gender),
    genderLabel: GENDER_META[normalizeGender(gender)].label,
    tokenGlow: GENDER_META[normalizeGender(gender)].glow,
    connected: true,
    position: 0,
    finished: false,
    stats: createInitialStats(),
    narrativeState: createNarrativeState(),
    timeline: [],
    legacyScore: null,
    finalSummary: null,
  };
}

function serializeRoom(room) {
  return {
    id: room.id,
    status: room.status,
    phase: room.phase,
    hostId: room.hostId,
    maxPlayers: room.maxPlayers,
    currentRound: room.currentRound,
    totalRounds: room.totalRounds,
    turnNumber: room.turnNumber || 0,
    activePlayerId: room.activePlayerId || null,
    activePlayerIndex: room.activePlayerIndex || 0,
    boardSize: room.boardSize || 30,
    board: room.board || [],
    diceRoll: room.diceRoll || null,
    currentEvent: room.currentEvent,
    players: Array.from(room.players.values()).map((player) => ({
      id: player.id,
      name: player.name,
      gender: player.gender,
      genderLabel: player.genderLabel,
      tokenGlow: player.tokenGlow,
      connected: player.connected,
      position: player.position || 0,
      finished: Boolean(player.finished),
      stats: player.stats,
      narrativeState: player.narrativeState,
      timeline: player.timeline,
      legacyScore: player.legacyScore,
      finalSummary: player.finalSummary,
    })),
    decisionsCount: room.decisions ? room.decisions.size : 0,
    roundResults: room.roundResults || [],
    lastResult: room.lastResult || null,
    processingAction: Boolean(room.processingAction),
    createdAt: room.createdAt,
  };
}

function createRoom({ clientId, playerName, gender, maxPlayers = 6, socketId }) {
  const id = generateRoomCode(new Set(rooms.keys()));
  const player = createPlayer({ clientId, playerName, gender, socketId });
  const room = {
    id,
    status: "waiting",
    phase: "lobby",
    hostId: player.id,
    maxPlayers,
    players: new Map([[player.id, player]]),
    currentRound: 0,
    totalRounds: 0,
    turnNumber: 0,
    activePlayerId: null,
    activePlayerIndex: 0,
    boardSize: 30,
    board: [],
    diceRoll: null,
    currentEvent: null,
    decisions: new Map(),
    roundResults: [],
    lastResult: null,
    processingAction: false,
    createdAt: new Date().toISOString(),
  };

  rooms.set(id, room);
  return room;
}

function joinRoom({ roomId, clientId, playerName, gender, socketId }) {
  const room = rooms.get(roomId.toUpperCase());

  if (!room) {
    throw new Error("La sala no existe.");
  }

  const existingPlayer = room.players.get(clientId);

  if (existingPlayer) {
    existingPlayer.socketId = socketId;
    existingPlayer.connected = true;
    existingPlayer.name = playerName.trim().slice(0, 24) || existingPlayer.name;
    existingPlayer.gender = normalizeGender(gender || existingPlayer.gender);
    existingPlayer.genderLabel = GENDER_META[existingPlayer.gender].label;
    existingPlayer.tokenGlow = GENDER_META[existingPlayer.gender].glow;
    return room;
  }

  if (room.status !== "waiting") {
    throw new Error("La partida ya ha empezado.");
  }

  if (room.players.size >= room.maxPlayers) {
    throw new Error("La sala esta llena.");
  }

  const player = createPlayer({ clientId, playerName, gender, socketId });
  room.players.set(player.id, player);
  return room;
}

function getRoom(roomId) {
  return rooms.get(roomId.toUpperCase());
}

function markDisconnected(socketId) {
  const affectedRooms = [];

  for (const room of rooms.values()) {
    let roomChanged = false;

    for (const player of room.players.values()) {
      if (player.socketId === socketId) {
        player.connected = false;
        roomChanged = true;
      }
    }

    if (roomChanged) {
      affectedRooms.push(room);
    }
  }

  return affectedRooms;
}

module.exports = {
  createRoom,
  joinRoom,
  getRoom,
  markDisconnected,
  serializeRoom,
  GENDER_META,
};
