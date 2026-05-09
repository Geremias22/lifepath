const roomCode = document.querySelector("#room-code");
const playersList = document.querySelector("#players-list");
const lobbyNotice = document.querySelector("#lobby-notice");
const startButton = document.querySelector("#start-button");
const copyButton = document.querySelector("#copy-button");
const { socket, emitAck } = window.lifePathSocket;
let currentRoom = null;

function getRoomId() {
  const params = new URLSearchParams(window.location.search);
  return params.get("room") || window.lifePathSession.get().roomId;
}

function renderRoom(room) {
  const session = window.lifePathSession.get();
  currentRoom = room;
  roomCode.textContent = room.id;
  startButton.disabled = room.hostId !== session.clientId || room.status !== "waiting";
  startButton.textContent = room.hostId === session.clientId ? "Iniciar partida" : "Esperando al host";

  playersList.innerHTML = room.players
    .map((player) => {
      const tags = [
        player.id === room.hostId ? '<span class="badge">Host</span>' : "",
        player.connected ? "" : '<span class="badge">Offline</span>',
      ].join("");

      return `<div class="player-row"><strong>${player.name}</strong><span class="muted">${player.genderLabel || "Otro"}</span><span>${tags}</span></div>`;
    })
    .join("");
}

async function joinCurrentRoom() {
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

  if (!response.ok) {
    lobbyNotice.textContent = response.error;
    return;
  }

  window.lifePathSession.update({ roomId: response.room.id });
  renderRoom(response.room);
}

startButton.addEventListener("click", async () => {
  const session = window.lifePathSession.get();
  const response = await emitAck("game:start", {
    roomId: currentRoom.id,
    clientId: session.clientId,
  });

  if (!response.ok) {
    lobbyNotice.textContent = response.error;
  }
});

copyButton.addEventListener("click", async () => {
  await navigator.clipboard.writeText(currentRoom.id);
  copyButton.textContent = "Copiado";
  setTimeout(() => {
    copyButton.textContent = "Copiar codigo";
  }, 1200);
});

socket.on("room:update", renderRoom);
socket.on("game:started", (room) => {
  window.lifePathSession.update({ roomId: room.id });
  window.location.href = `/game.html?room=${room.id}`;
});

joinCurrentRoom();
