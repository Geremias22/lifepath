(function () {
  const currentScript = document.currentScript;
  const entry = currentScript?.dataset.entry;
  const params = new URLSearchParams(window.location.search);
  const rawSocketUrl = params.get("server") || window.LIFEPATH_SOCKET_URL || "";
  const socketUrl = rawSocketUrl.replace(/\/$/, "");

  window.LIFEPATH_CONFIG = {
    socketUrl,
  };

  function loadScript(src) {
    return new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = src;
      script.async = false;
      script.onload = resolve;
      script.onerror = () => reject(new Error(`No se pudo cargar ${src}`));
      document.body.appendChild(script);
    });
  }

  function showConnectionError(error) {
    const notice = document.querySelector(".notice");
    if (notice) {
      notice.textContent = "No se pudo conectar con el servidor de partida. Revisa la URL del backend.";
    }
    console.error(error);
  }

  const socketClientSrc = `${socketUrl}/socket.io/socket.io.js`;

  loadScript(socketClientSrc)
    .then(() => loadScript("/js/socket.js"))
    .then(() => {
      if (entry) return loadScript(entry);
      return undefined;
    })
    .catch(showConnectionError);
})();
