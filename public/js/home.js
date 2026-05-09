const createForm = document.querySelector("#create-form");
const joinForm = document.querySelector("#join-form");
const notice = document.querySelector("#notice");
const { emitAck } = window.lifePathSocket;

function showError(message) {
  notice.textContent = message || "";
}

function normalizeName(value) {
  return value.trim() || "Jugador";
}

function restoreFormDefaults() {
  const session = window.lifePathSession.get();

  for (const form of [createForm, joinForm]) {
    if (session.playerName) {
      const input = form.querySelector('[name="playerName"]');
      if (input) input.value = session.playerName;
    }

    if (session.gender) {
      const genderSelect = form.querySelector('[name="gender"]');
      if (genderSelect) genderSelect.value = session.gender;
    }
  }
}

createForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  showError("");

  const formData = new FormData(createForm);
  const session = window.lifePathSession.update({
    playerName: normalizeName(formData.get("playerName")),
    gender: formData.get("gender") || "otro",
  });

  const response = await emitAck("room:create", {
    clientId: session.clientId,
    playerName: session.playerName,
    gender: session.gender,
    maxPlayers: Number(formData.get("maxPlayers") || 6),
  });

  if (!response.ok) {
    showError(response.error);
    return;
  }

  window.lifePathSession.update({ roomId: response.room.id });
  window.location.href = `/lobby.html?room=${response.room.id}`;
});

restoreFormDefaults();

joinForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  showError("");

  const formData = new FormData(joinForm);
  const roomId = String(formData.get("roomId")).trim().toUpperCase();
  const session = window.lifePathSession.update({
    playerName: normalizeName(formData.get("playerName")),
    gender: formData.get("gender") || "otro",
    roomId,
  });

  const response = await emitAck("room:join", {
    roomId,
    clientId: session.clientId,
    playerName: session.playerName,
    gender: session.gender,
  });

  if (!response.ok) {
    showError(response.error);
    return;
  }

  window.location.href = `/lobby.html?room=${response.room.id}`;
});
