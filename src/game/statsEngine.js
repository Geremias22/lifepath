const STAT_KEYS = ["dinero", "vida", "carrera", "relaciones", "reputacion"];

function createInitialStats() {
  return {
    dinero: 45,
    vida: 65,
    carrera: 40,
    relaciones: 60,
    reputacion: 50,
  };
}

function clampStat(value) {
  return Math.max(0, Math.min(100, value));
}

function applyEffects(stats, effects) {
  const nextStats = { ...stats };

  for (const key of STAT_KEYS) {
    nextStats[key] = clampStat((nextStats[key] || 0) + (effects[key] || 0));
  }

  return nextStats;
}

function calculateLegacyScore(stats) {
  return Math.round(
    stats.dinero * 0.15 +
      stats.vida * 0.25 +
      stats.carrera * 0.2 +
      stats.relaciones * 0.25 +
      stats.reputacion * 0.15
  );
}

module.exports = {
  STAT_KEYS,
  createInitialStats,
  applyEffects,
  calculateLegacyScore,
};
