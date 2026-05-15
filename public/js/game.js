const stageLabel = document.querySelector("#stage-label");
const roundLabel = document.querySelector("#round-label");
const ageLabel = document.querySelector("#age-label");
const eventTitle = document.querySelector("#event-title");
const eventDescription = document.querySelector("#event-description");
const rollButton = document.querySelector("#roll-button");
const diceDisplay = document.querySelector("#dice-display");
const dice3d = document.querySelector("#dice-3d");
const actionLoading = document.querySelector("#action-loading");
const boardGrid = document.querySelector("#board-grid");
const optionsGrid = document.querySelector("#options-grid");
const statsGrid = document.querySelector("#stats-grid");
const playersPanel = document.querySelector("#players-panel");
const resultsPanel = document.querySelector("#results-panel");
const resultsList = document.querySelector("#results-list");
const nextTurnButton = document.querySelector("#next-turn-button");
const finalPanel = document.querySelector("#final-panel");
const finalList = document.querySelector("#final-list");
const timelinePanel = document.querySelector("#timeline-panel");
const timelineList = document.querySelector("#timeline-list");
const gameNotice = document.querySelector("#game-notice");
const sidePanel = document.querySelector("#side-panel");
const sidePanelToggle = document.querySelector("#side-panel-toggle");
const sidePanelBackdrop = document.querySelector("#side-panel-backdrop");
const floatingActionDock = document.querySelector("#floating-action-dock");
const rollButtonSlot = document.querySelector("#roll-button-slot");
const nextTurnButtonSlot = document.querySelector("#next-turn-button-slot");
const { socket, emitAck } = window.lifePathSocket;
let currentRoom = null;
let pendingAction = false;
let diceThrowTimer = null;
let rejoiningRoom = false;
const mobileActionsQuery = window.matchMedia("(max-width: 820px)");

const STAT_LABELS = {
  dinero: "Dinero",
  vida: "Vida",
  carrera: "Carrera",
  relaciones: "Relaciones",
  reputacion: "Reputacion",
};

function getRoomId() {
  const params = new URLSearchParams(window.location.search);
  return params.get("room") || window.lifePathSession.get().roomId;
}

function getMe(room) {
  const session = window.lifePathSession.get();
  return room.players.find((player) => player.id === session.clientId);
}

function getActivePlayer(room) {
  return room.players.find((player) => player.id === room.activePlayerId);
}

function isMyTurn(room) {
  const session = window.lifePathSession.get();
  return room.activePlayerId === session.clientId;
}

function renderStats(player) {
  if (!player) return;

  statsGrid.innerHTML = Object.entries(STAT_LABELS)
    .map(([key, label]) => {
      const value = player.stats[key];
      return `
        <div class="stat stat-${key}">
          <div class="stat-label"><span>${label}</span><span>${value}</span></div>
          <div class="bar"><span style="width:${value}%"></span></div>
        </div>
      `;
    })
    .join("");
}

function renderBoard(room) {
  if (!room.board || room.board.length === 0) {
    boardGrid.innerHTML = "";
    return;
  }

  boardGrid.innerHTML = room.board
    .map((square) => {
      const playersHere = room.players.filter((player) => player.position === square.position);
      const isActive = room.activePlayerId && playersHere.some((player) => player.id === room.activePlayerId);
      const marks = playersHere
        .map((player) => `<span class="token" style="--token-glow:${player.tokenGlow || "#c4a7ff"}" title="${player.name}">${player.name.slice(0, 1).toUpperCase()}</span>`)
        .join("");

      return `
        <div class="board-cell stat-bg-${square.stat} ${isActive ? "is-active" : ""}" title="${square.label}">
          <strong>${square.position}</strong>
          <small>${square.label}</small>
          <div class="tokens">${marks}</div>
        </div>
      `;
    })
    .join("");
}

function setRolling(isRolling) {
  dice3d.classList.toggle("rolling", isRolling);
}

function startDiceThrow() {
  clearTimeout(diceThrowTimer);
  setRolling(true);
  diceThrowTimer = setTimeout(() => {
    setRolling(false);
  }, 1100);
}

function stopDiceThrow() {
  clearTimeout(diceThrowTimer);
  setRolling(false);
}

function setActionLoading(isLoading, message = "Cargando...") {
  actionLoading.classList.toggle("hidden", !isLoading);
  const text = actionLoading.querySelector("strong");
  if (text) text.textContent = message;
}

function setDiceValue(value) {
  const safeValue = Number(value);
  dice3d.dataset.value = safeValue >= 1 && safeValue <= 6 ? String(safeValue) : "1";
}

function renderPlayers(room) {
  const activePlayer = getActivePlayer(room);

  playersPanel.innerHTML = room.players
    .map((player) => {
      const badges = [
        player.id === activePlayer?.id ? '<span class="badge">Turno</span>' : "",
        player.finished ? '<span class="badge done">Meta</span>' : "",
      ].join("");

      return `
        <div class="player-row">
          <div>
            <strong>${player.name}</strong>
            <span class="muted">${player.genderLabel || "Otro"} · Casilla ${player.position}/${room.boardSize}</span>
          </div>
          <span>${badges}</span>
        </div>
      `;
    })
    .join("");
}

function renderEffects(effects) {
  return Object.entries(effects)
    .map(([key, value]) => `<span class="badge effect ${value < 0 ? "negative" : ""}">${STAT_LABELS[key]} ${value > 0 ? "+" : ""}${value}</span>`)
    .join("");
}

async function rollDice() {
  if (pendingAction) return;
  pendingAction = true;
  rollButton.disabled = true;
  rollButton.textContent = "Tirando...";
  startDiceThrow();
  setActionLoading(false);
  gameNotice.textContent = "Generando tu casilla...";

  const session = window.lifePathSession.get();
  const response = await emitAck("game:roll", {
    roomId: currentRoom.id,
    clientId: session.clientId,
  });

  pendingAction = false;
  stopDiceThrow();
  setActionLoading(false);

  if (!response.ok) {
    gameNotice.textContent = response.error;
    rollButton.disabled = false;
    rollButton.textContent = "Tirar dado";
    return;
  }

  renderRoom(response.room);
}

async function chooseOption(optionId) {
  if (pendingAction) return;
  pendingAction = true;
  optionsGrid.querySelectorAll("button").forEach((button) => {
    button.disabled = true;
  });
  gameNotice.textContent = "Resolviendo consecuencia...";
  stopDiceThrow();
  setActionLoading(true, "Generando consecuencia...");

  const session = window.lifePathSession.get();
  const response = await emitAck("game:decision", {
    roomId: currentRoom.id,
    clientId: session.clientId,
    optionId,
  });

  pendingAction = false;
  stopDiceThrow();
  setActionLoading(false);

  if (!response.ok) {
    gameNotice.textContent = response.error;
    renderRoom(currentRoom);
    return;
  }

  renderRoom(response.room);
}

function renderRoll(room) {
  const activePlayer = getActivePlayer(room);
  const mine = isMyTurn(room);

  resultsPanel.classList.add("hidden");
  finalPanel.classList.add("hidden");
  timelinePanel.classList.remove("hidden");
  rollButton.classList.toggle("hidden", !mine);
  nextTurnButton.classList.add("hidden");
  rollButton.disabled = !mine || pendingAction || room.processingAction;
  rollButton.textContent = pendingAction || room.processingAction ? "Procesando..." : "Tirar dado";
  optionsGrid.innerHTML = "";
  diceDisplay.textContent = room.diceRoll || "-";
  setDiceValue(room.diceRoll);
  setActionLoading(false);
  stageLabel.textContent = "Dado";
  roundLabel.textContent = `Turno ${room.turnNumber}`;
  ageLabel.textContent = `Meta ${room.boardSize}`;
  eventTitle.textContent = mine ? "Es tu turno" : `Turno de ${activePlayer?.name || "otro jugador"}`;
  eventDescription.textContent = mine
    ? "Tira el dado, avanza por el tablero y caeras en una decision marcada por el color de la casilla."
    : "Espera a que el jugador activo tire el dado y resuelva su decision.";
  gameNotice.textContent = room.processingAction ? "La partida esta procesando una accion." : "";
}

function renderDecision(room) {
  const event = room.currentEvent;
  const mine = isMyTurn(room);

  resultsPanel.classList.add("hidden");
  finalPanel.classList.add("hidden");
  rollButton.classList.add("hidden");
  nextTurnButton.classList.add("hidden");
  diceDisplay.textContent = room.diceRoll || "-";
  setDiceValue(room.diceRoll);
  stopDiceThrow();
  setActionLoading(pendingAction || room.processingAction, "Generando consecuencia...");
  stageLabel.textContent = event.stage;
  roundLabel.textContent = `Turno ${room.turnNumber}`;
  ageLabel.textContent = `Casilla ${event.position} · ${event.generatedBy || "local"}`;
  eventTitle.textContent = event.title;
  eventDescription.textContent = event.description;

  optionsGrid.innerHTML = event.options
    .map((option) => `<button class="option-button stat-border-${event.stat}" ${mine && !pendingAction && !room.processingAction ? "" : "disabled"} data-option="${option.id}">${option.text}</button>`)
    .join("");

  optionsGrid.querySelectorAll("button").forEach((button) => {
    button.addEventListener("click", () => chooseOption(button.dataset.option));
  });

  const sourceNotice = event.generatedBy === "local" && event.llmError ? `${event.llmError} ` : "";
  gameNotice.textContent = room.processingAction
    ? "La partida esta procesando una accion."
    : mine
      ? sourceNotice
      : `${sourceNotice}No es tu turno. Estas viendo la decision del jugador activo.`;
}

function renderResults(room) {
  const session = window.lifePathSession.get();
  const me = getMe(room);
  const activePlayer = room.lastResult ? room.players.find((player) => player.id === room.lastResult.playerId) : getActivePlayer(room);
  const canPass = room.hostId === session.clientId || room.lastResult?.playerId === session.clientId;

  resultsPanel.classList.remove("hidden");
  finalPanel.classList.add("hidden");
  rollButton.classList.add("hidden");
  nextTurnButton.classList.remove("hidden");
  optionsGrid.innerHTML = "";
  diceDisplay.textContent = room.diceRoll || "-";
  setDiceValue(room.diceRoll);
  stopDiceThrow();
  setActionLoading(pendingAction || room.processingAction, "Preparando siguiente turno...");
  stageLabel.textContent = room.lastResult?.statLabel || "Resultado";
  roundLabel.textContent = `Turno ${room.turnNumber}`;
  ageLabel.textContent = `Casilla ${room.lastResult?.position || activePlayer?.position || 0}`;
  eventTitle.textContent = `${activePlayer?.name || "Jugador"} resolvió su turno`;
  eventDescription.textContent = room.lastResult?.narrative || "";
  nextTurnButton.disabled = !canPass || pendingAction || room.processingAction;
  nextTurnButton.textContent = canPass ? "Siguiente turno" : "Esperando al jugador activo";
  gameNotice.textContent = "";

  resultsList.innerHTML = room.lastResult
    ? `
      <article class="result-item">
        <strong>${room.lastResult.playerName}</strong>
        <p class="muted">${room.lastResult.optionText}</p>
        <div class="effect-list">${renderEffects(room.lastResult.effects)}</div>
      </article>
    `
    : "";

  renderStats(me);
}

function renderTimeline(player) {
  if (!player || player.timeline.length === 0) {
    timelineList.innerHTML = '<p class="muted">Tu linea temporal empezara con la primera decision.</p>';
    return;
  }

  timelineList.innerHTML = player.timeline
    .slice()
    .reverse()
    .map((item) => `
      <article class="timeline-item stat-border-${item.stat}">
        <strong>Turno ${item.turn} - Casilla ${item.position} - ${item.stage}</strong>
        <p class="muted">${item.decision}</p>
      </article>
    `)
    .join("");
}

function renderFinal(room) {
  const ranking = [...room.players].sort((a, b) => b.legacyScore - a.legacyScore);
  const me = getMe(room);

  resultsPanel.classList.add("hidden");
  finalPanel.classList.remove("hidden");
  timelinePanel.classList.remove("hidden");
  rollButton.classList.add("hidden");
  nextTurnButton.classList.add("hidden");
  optionsGrid.innerHTML = "";
  diceDisplay.textContent = "-";
  setDiceValue(1);
  stopDiceThrow();
  setActionLoading(false);
  stageLabel.textContent = "Meta";
  roundLabel.textContent = "Final";
  ageLabel.textContent = `${room.boardSize} casillas`;
  eventTitle.textContent = "La vida que elegiste";
  eventDescription.textContent = me?.finalSummary?.biography || "La partida ha terminado.";

  finalList.innerHTML = ranking
    .map((player, index) => `
      <article class="result-item">
        <strong>${index + 1}. ${player.name} - ${player.legacyScore} puntos</strong>
        <p>${player.finalSummary.title}</p>
        <p class="muted">${player.finalSummary.biography}</p>
      </article>
    `)
    .join("");
}

function setSidePanelOpen(isOpen) {
  sidePanel.classList.toggle("is-open", isOpen);
  sidePanelToggle.setAttribute("aria-expanded", String(isOpen));
  sidePanelBackdrop.classList.toggle("hidden", !isOpen);
}

function placeActionButtons() {
  if (mobileActionsQuery.matches) {
    if (rollButton.parentElement !== floatingActionDock) floatingActionDock.appendChild(rollButton);
    if (nextTurnButton.parentElement !== floatingActionDock) floatingActionDock.appendChild(nextTurnButton);
    return;
  }

  if (rollButton.parentElement !== rollButtonSlot) rollButtonSlot.appendChild(rollButton);
  if (nextTurnButton.parentElement !== nextTurnButtonSlot) nextTurnButtonSlot.appendChild(nextTurnButton);
}

function renderRoom(room) {
  currentRoom = room;
  const me = getMe(room);

  if (!me) {
    gameNotice.textContent = "No se encontro tu jugador en esta sala.";
    return;
  }

  renderStats(me);
  renderBoard(room);
  renderPlayers(room);
  renderTimeline(me);

  if (room.status === "finished") {
    renderFinal(room);
  } else if (room.phase === "roll") {
    renderRoll(room);
  } else if (room.phase === "decision") {
    renderDecision(room);
  } else if (room.phase === "turnResult") {
    renderResults(room);
  }
}

async function joinCurrentRoom() {
  if (rejoiningRoom) return;
  rejoiningRoom = true;

  const session = window.lifePathSession.get();
  const roomId = getRoomId();

  if (!roomId) {
    window.location.href = "/";
    return;
  }

  const response = await emitAck("room:join", {
    roomId,
    clientId: session.clientId,
    playerName: session.playerName || "Jugador",
    gender: session.gender || "otro",
  });

  rejoiningRoom = false;

  if (!response.ok) {
    gameNotice.textContent = response.error;
    return;
  }

  pendingAction = false;
  stopDiceThrow();
  setActionLoading(false);
  window.lifePathSession.update({ roomId: response.room.id });
  renderRoom(response.room);
}

sidePanelToggle.addEventListener("click", () => {
  setSidePanelOpen(!sidePanel.classList.contains("is-open"));
});

sidePanelBackdrop.addEventListener("click", () => {
  setSidePanelOpen(false);
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") setSidePanelOpen(false);
});

mobileActionsQuery.addEventListener("change", placeActionButtons);
placeActionButtons();

rollButton.addEventListener("click", rollDice);

nextTurnButton.addEventListener("click", async () => {
  if (pendingAction) return;
  pendingAction = true;
  nextTurnButton.disabled = true;
  nextTurnButton.textContent = "Pasando turno...";
  stopDiceThrow();
  setActionLoading(true, "Preparando siguiente turno...");

  const session = window.lifePathSession.get();
  const response = await emitAck("game:next-turn", {
    roomId: currentRoom.id,
    clientId: session.clientId,
  });

  pendingAction = false;
  stopDiceThrow();
  setActionLoading(false);

  if (!response.ok) {
    gameNotice.textContent = response.error;
    renderRoom(currentRoom);
  }
});

socket.on("room:update", renderRoom);
socket.on("game:turn-started", renderRoom);
socket.on("game:finished", renderRoom);
socket.on("connect", () => {
  if (currentRoom) {
    gameNotice.textContent = "Conexion recuperada. Sincronizando sala...";
  }
  joinCurrentRoom();
});
socket.on("disconnect", () => {
  gameNotice.textContent = "Conexion perdida. Intentando reconectar...";
});

joinCurrentRoom();
