(function () {
  const STORAGE_KEY = "lifepath_session";

  function createClientId() {
    if (window.crypto && window.crypto.randomUUID) {
      return window.crypto.randomUUID();
    }

    return `client_${Date.now()}_${Math.random().toString(16).slice(2)}`;
  }

  function getSession() {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");

    if (!saved.clientId) {
      saved.clientId = createClientId();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(saved));
    }

    return saved;
  }

  function updateSession(nextValues) {
    const nextSession = { ...getSession(), ...nextValues };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(nextSession));
    return nextSession;
  }

  window.lifePathSession = {
    get: getSession,
    update: updateSession,
  };
})();
