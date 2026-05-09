const roomManager = require("../game/roomManager");
const gameEngine = require("../game/gameEngine");

function emitRoom(io, room) {
  io.to(room.id).emit("room:update", roomManager.serializeRoom(room));
}

function registerRoomSocket(io) {
  io.on("connection", (socket) => {
    socket.on("room:create", (payload, callback) => {
      try {
        const room = roomManager.createRoom({
          ...payload,
          socketId: socket.id,
        });
        socket.join(room.id);
        callback({ ok: true, room: roomManager.serializeRoom(room) });
        emitRoom(io, room);
      } catch (error) {
        callback({ ok: false, error: error.message });
      }
    });

    socket.on("room:join", (payload, callback) => {
      try {
        const room = roomManager.joinRoom({
          ...payload,
          socketId: socket.id,
        });
        socket.join(room.id);
        callback({ ok: true, room: roomManager.serializeRoom(room) });
        emitRoom(io, room);
      } catch (error) {
        callback({ ok: false, error: error.message });
      }
    });

    socket.on("game:start", ({ roomId, clientId }, callback) => {
      try {
        const room = roomManager.getRoom(roomId);

        if (!room) throw new Error("La sala no existe.");
        if (room.hostId !== clientId) throw new Error("Solo el host puede iniciar.");
        if (room.players.size < 1) throw new Error("Hace falta al menos un jugador.");

        gameEngine.startGame(room);
        callback({ ok: true, room: roomManager.serializeRoom(room) });
        io.to(room.id).emit("game:started", roomManager.serializeRoom(room));
      } catch (error) {
        callback({ ok: false, error: error.message });
      }
    });

    socket.on("game:decision", async ({ roomId, clientId, optionId }, callback) => {
      try {
        const room = roomManager.getRoom(roomId);
        if (!room) throw new Error("La sala no existe.");

        const result = await gameEngine.submitDecision(room, clientId, optionId);
        callback({ ok: true, result, room: roomManager.serializeRoom(room) });
        emitRoom(io, room);
      } catch (error) {
        callback({ ok: false, error: error.message });
      }
    });

    socket.on("game:roll", async ({ roomId, clientId }, callback) => {
      try {
        const room = roomManager.getRoom(roomId);
        if (!room) throw new Error("La sala no existe.");

        const event = await gameEngine.rollDice(room, clientId, () => emitRoom(io, room));
        callback({ ok: true, event, room: roomManager.serializeRoom(room) });
        emitRoom(io, room);
      } catch (error) {
        callback({ ok: false, error: error.message });
      }
    });

    socket.on("game:next-turn", async ({ roomId, clientId }, callback) => {
      try {
        const room = roomManager.getRoom(roomId);

        if (!room) throw new Error("La sala no existe.");

        await gameEngine.advanceTurn(room, clientId);
        callback({ ok: true, room: roomManager.serializeRoom(room) });
        io.to(room.id).emit(room.status === "finished" ? "game:finished" : "game:turn-started", roomManager.serializeRoom(room));
      } catch (error) {
        callback({ ok: false, error: error.message });
      }
    });

    socket.on("disconnect", () => {
      roomManager.markDisconnected(socket.id);
    });
  });
}

module.exports = registerRoomSocket;
