(function () {
  const socketUrl = window.LIFEPATH_CONFIG?.socketUrl || "";
  const socket = socketUrl ? io(socketUrl) : io();
  const ACK_TIMEOUT_MS = 90000;
  const CONNECT_WAIT_MS = 4000;

  function waitForConnection() {
    if (socket.connected) {
      return Promise.resolve(true);
    }

    return new Promise((resolve) => {
      const timeout = setTimeout(() => {
        cleanup();
        resolve(false);
      }, CONNECT_WAIT_MS);

      function onConnect() {
        cleanup();
        resolve(true);
      }

      function cleanup() {
        clearTimeout(timeout);
        socket.off("connect", onConnect);
      }

      socket.on("connect", onConnect);
    });
  }

  async function emitAck(eventName, payload) {
    const connected = await waitForConnection();

    if (!connected) {
      return { ok: false, error: "No se pudo conectar con el servidor de partida." };
    }

    return new Promise((resolve) => {
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
