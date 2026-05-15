(function () {
  const socketUrl = window.LIFEPATH_CONFIG?.socketUrl || "";
  const socket = socketUrl ? io(socketUrl) : io();
  const ACK_TIMEOUT_MS = 90000;

  function emitAck(eventName, payload) {
    return new Promise((resolve) => {
      if (!socket.connected) {
        resolve({ ok: false, error: "Reconectando con la partida. Espera un momento y vuelve a intentarlo." });
        return;
      }

      socket.timeout(ACK_TIMEOUT_MS).emit(eventName, payload, (error, response) => {
        if (error) {
          resolve({ ok: false, error: "La accion esta tardando o se perdio la conexion. La sala se sincronizara automaticamente." });
          return;
        }

        resolve(response);
      });
    });
  }

  window.lifePathSocket = {
    socket,
    emitAck,
  };
})();
