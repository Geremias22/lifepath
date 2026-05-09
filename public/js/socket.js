(function () {
  const socketUrl = window.LIFEPATH_CONFIG?.socketUrl || "";
  const socket = socketUrl ? io(socketUrl) : io();

  function emitAck(eventName, payload) {
    return new Promise((resolve) => {
      socket.emit(eventName, payload, resolve);
    });
  }

  window.lifePathSocket = {
    socket,
    emitAck,
  };
})();
