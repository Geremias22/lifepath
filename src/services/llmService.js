const STAT_KEYS = ["dinero", "vida", "carrera", "relaciones", "reputacion"];
const OPENAI_CHAT_URL = "https://api.openai.com/v1/chat/completions";
const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models";
const {
  GAME_DIRECTION,
  EVENT_GENERATION_RULES,
  CONSEQUENCE_RULES,
  FINAL_SUMMARY_RULES,
} = require("../prompts/lifepathPrompts");

function isOpenAiEnabled() {
  return process.env.LLM_PROVIDER === "openai" && Boolean(process.env.OPENAI_API_KEY);
}

function isGeminiEnabled() {
  return process.env.LLM_PROVIDER === "gemini" && Boolean(process.env.GEMINI_API_KEY);
}

function getOpenAiModel() {
  return process.env.OPENAI_MODEL || "gpt-4.1-nano";
}

function getGeminiModel() {
  return process.env.GEMINI_MODEL || "gemini-2.5-flash-lite";
}

function shouldGenerateConsequences() {
  return process.env.LLM_GENERATE_CONSEQUENCES === "true";
}

function shouldGenerateFinals() {
  return process.env.LLM_GENERATE_FINALS === "true";
}

function formatEffects(effects) {
  const entries = Object.entries(effects)
    .filter(([, value]) => value !== 0)
    .map(([key, value]) => `${key} ${value > 0 ? "+" : ""}${value}`);

  return entries.join(", ");
}

function getRecentTimeline(player, limit = 6) {
  return player.timeline.slice(-limit).map((item) => ({
    turn: item.turn,
    position: item.position,
    stat: item.stat,
    event: item.event,
    decision: item.decision,
    changes: item.changes,
    flag: item.flag,
  }));
}

function normalizeEffects(effects = {}) {
  return STAT_KEYS.reduce((safeEffects, key) => {
    const rawValue = Number(effects[key] || 0);
    safeEffects[key] = Math.max(-18, Math.min(18, Math.round(rawValue)));
    return safeEffects;
  }, {});
}

function makeOptionId(index) {
  return `llm-option-${index + 1}`;
}

function normalizeOptions(options, fallbackOptions) {
  if (!Array.isArray(options) || options.length < 2) {
    return fallbackOptions;
  }

  return options.slice(0, 3).map((option, index) => ({
    id: option.id || makeOptionId(index),
    text: String(option.text || fallbackOptions[index]?.text || `Decision ${index + 1}`).slice(0, 120),
    effects: normalizeEffects(option.effects || fallbackOptions[index]?.effects),
    flag: String(option.flag || `llm_choice_${index + 1}`).slice(0, 40),
  }));
}

function extractResponseText(data) {
  if (typeof data.output_text === "string") {
    return data.output_text;
  }

  const textItems = [];

  for (const outputItem of data.output || []) {
    for (const contentItem of outputItem.content || []) {
      if (contentItem.type === "output_text" && contentItem.text) {
        textItems.push(contentItem.text);
      }
    }
  }

  return textItems.join("");
}

async function requestJson({ schemaName, schema, system, user }) {
  if (isGeminiEnabled()) {
    return requestGeminiJson({ schema, system, user });
  }

  if (isOpenAiEnabled()) {
    return requestOpenAiJson({ schemaName, schema, system, user });
  }

  throw new Error(`No API key configured for provider ${process.env.LLM_PROVIDER || "local"}.`);
}

async function requestOpenAiJson({ schemaName, schema, system, user }) {
  const response = await fetch(OPENAI_CHAT_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: getOpenAiModel(),
      messages: [
        {
          role: "system",
          content: `${system} Responde siempre en JSON.`,
        },
        {
          role: "user",
          content: JSON.stringify(user),
        },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: schemaName,
          schema,
          strict: true,
        },
      },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenAI API error ${response.status}: ${errorText}`);
  }

  const data = await response.json();
  const text = data.choices?.[0]?.message?.content || extractResponseText(data);

  if (!text) {
    throw new Error("OpenAI no devolvio texto parseable.");
  }

  return JSON.parse(text);
}

async function requestGeminiJson({ schema, system, user }) {
  const url = `${GEMINI_API_URL}/${encodeURIComponent(getGeminiModel())}:generateContent?key=${process.env.GEMINI_API_KEY}`;
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      systemInstruction: {
        parts: [{ text: `${system} Responde siempre con JSON puro, sin markdown.` }],
      },
      contents: [
        {
          role: "user",
          parts: [{ text: JSON.stringify(user) }],
        },
      ],
      generationConfig: {
        temperature: 0.9,
        responseMimeType: "application/json",
        responseSchema: toGeminiSchema(schema),
      },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Gemini API error ${response.status}: ${errorText}`);
  }

  const data = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.map((part) => part.text || "").join("") || "";

  if (!text) {
    throw new Error("Gemini no devolvio texto parseable.");
  }

  return JSON.parse(text);
}

function toGeminiSchema(value) {
  if (Array.isArray(value)) {
    return value.map(toGeminiSchema);
  }

  if (!value || typeof value !== "object") {
    return value;
  }

  const clean = {};

  for (const [key, nestedValue] of Object.entries(value)) {
    if (key === "additionalProperties") {
      continue;
    }

    clean[key] = toGeminiSchema(nestedValue);
  }

  return clean;
}

function publicLlmError(error) {
  const message = error.message || "";

  if (message.includes("Gemini API error")) {
    if (message.includes("project has been denied access") || message.includes("PERMISSION_DENIED")) {
      return "El proyecto de Gemini no tiene permiso para generar contenido. Usando modo local.";
    }

    if (message.includes("429")) {
      return "Gemini supero la cuota gratuita. Usando modo local.";
    }

    if (message.includes("400")) {
      return "Gemini no acepto el formato o modelo configurado. Usando modo local.";
    }

    if (message.includes("401") || message.includes("403")) {
      return "API key de Gemini invalida o sin permisos. Usando modo local.";
    }

    return "Gemini no respondio correctamente. Usando modo local.";
  }

  if (message.includes("No API key configured for provider gemini")) {
    return "Falta GEMINI_API_KEY. Usando modo local.";
  }

  if (message.includes("No API key configured for provider openai")) {
    return "Falta OPENAI_API_KEY. Usando modo local.";
  }

  if (message.includes("insufficient_quota") || message.includes("429")) {
    return "OpenAI no tiene cuota/billing activo. Usando modo local.";
  }

  if (message.includes("401")) {
    return "API key de OpenAI invalida o sin permisos. Usando modo local.";
  }

  if (message.includes("model") || message.includes("404")) {
    return "Modelo OpenAI no disponible para esta cuenta. Usando modo local.";
  }

  return "OpenAI no respondio correctamente. Usando modo local.";
}

function fallbackDecisionEvent({ player, event }) {
  return {
    ...event,
    options: event.options,
  };
}

async function generateDecisionEvent({ player, event, room }) {
  const fallback = fallbackDecisionEvent({ player, event });

  try {
    const result = await requestJson({
      schemaName: "lifepath_event",
      schema: {
        type: "object",
        additionalProperties: false,
        required: ["title", "description", "options"],
        properties: {
          title: { type: "string" },
          description: { type: "string" },
          options: {
            type: "array",
            minItems: 3,
            maxItems: 3,
            items: {
              type: "object",
              additionalProperties: false,
              required: ["text", "effects", "flag"],
              properties: {
                text: { type: "string" },
                flag: { type: "string" },
                effects: {
                  type: "object",
                  additionalProperties: false,
                  required: STAT_KEYS,
                  properties: {
                    dinero: { type: "integer", minimum: -18, maximum: 18 },
                    vida: { type: "integer", minimum: -18, maximum: 18 },
                    carrera: { type: "integer", minimum: -18, maximum: 18 },
                    relaciones: { type: "integer", minimum: -18, maximum: 18 },
                    reputacion: { type: "integer", minimum: -18, maximum: 18 },
                  },
                },
              },
            },
          },
        },
      },
      system:
        `Eres el narrador de LifePath, un juego de tablero narrativo multijugador. Genera eventos breves en espanol y exactamente 3 decisiones. El servidor manda: devuelve solo JSON valido.\n${GAME_DIRECTION}\n${EVENT_GENERATION_RULES}`,
      user: {
        playerName: player.name,
        gender: player.gender,
        genderLabel: player.genderLabel,
        position: player.position,
        boardSize: room.boardSize,
        diceRoll: event.roll,
        squareStat: event.stat,
        squareLabel: event.stage,
        currentStats: player.stats,
        narrativeState: player.narrativeState,
        recentTimeline: getRecentTimeline(player),
        narrativeContext: analyzePlayerContext(player),
        fallbackEvent: {
          title: event.title,
          description: event.description,
          options: event.options,
        },
      },
    });

    return {
      ...event,
      title: String(result.title || event.title).slice(0, 90),
      description: String(result.description || event.description).slice(0, 420),
      options: normalizeOptions(result.options, event.options),
      generatedBy: process.env.LLM_PROVIDER,
    };
  } catch (error) {
    console.warn(error.message);
    return {
      ...fallback,
      generatedBy: "local",
      llmError: publicLlmError(error),
    };
  }
}

function fallbackRoundNarrative({ player, event, option }) {
  const previousDecision = player.timeline.at(-1);
  const memory = previousDecision
    ? ` Venias de "${previousDecision.decision}", asi que esta eleccion no aparece aislada: continua esa ruta.`
    : " Es el primer giro real de tu historia.";

  return {
    title: event.title,
    narrative: `${player.name} cayo en una casilla de ${event.stage} y eligio "${option.text}".${memory} Cambios: ${formatEffects(option.effects)}.`,
    effects: normalizeEffects(option.effects),
    futureFlag: option.flag || `${event.id}_${option.id}`,
  };
}

async function generateRoundNarrative({ player, event, option }) {
  const fallback = fallbackRoundNarrative({ player, event, option });

  if (!shouldGenerateConsequences()) {
    return fallback;
  }

  try {
    const result = await requestJson({
      schemaName: "lifepath_consequence",
      schema: {
        type: "object",
        additionalProperties: false,
        required: ["narrative", "futureFlag"],
        properties: {
          narrative: { type: "string" },
          futureFlag: { type: "string" },
        },
      },
      system:
        `Eres el narrador de LifePath. No cambies los efectos numericos: esos los controla el servidor. Devuelve solo JSON valido.\n${GAME_DIRECTION}\n${CONSEQUENCE_RULES}`,
      user: {
        playerName: player.name,
        gender: player.gender,
        genderLabel: player.genderLabel,
        currentStats: player.stats,
        narrativeState: player.narrativeState,
        recentTimeline: getRecentTimeline(player),
        narrativeContext: analyzePlayerContext(player),
        event: {
          title: event.title,
          stat: event.stat,
          stage: event.stage,
          position: event.position,
        },
        chosenOption: {
          text: option.text,
          effects: option.effects,
          flag: option.flag,
        },
      },
    });

    return {
      title: event.title,
      narrative: String(result.narrative || fallback.narrative).slice(0, 520),
      effects: normalizeEffects(option.effects),
      futureFlag: String(result.futureFlag || fallback.futureFlag).slice(0, 40),
    };
  } catch (error) {
    console.warn(error.message);
    return fallback;
  }
}

async function generateFinalSummary({ player, legacyScore }) {
  const strongestStat = Object.entries(player.stats).sort((a, b) => b[1] - a[1])[0][0];
  const titleByStat = {
    dinero: "La mente estrategica que construyo seguridad",
    vida: "El alma serena que aprendio a vivir",
    carrera: "La persona incansable que abrio su propio camino",
    relaciones: "El corazon que nunca camino en soledad",
    reputacion: "La voz respetada que dejo huella",
  };

  if (!shouldGenerateFinals()) {
    return {
      title: titleByStat[strongestStat] || "Una vida dificil de resumir",
      biography: `${player.name} llego al final del tablero tras ${player.timeline.length} decisiones. Su legado alcanza ${legacyScore} puntos y queda definido sobre todo por ${strongestStat}.`,
    };
  }

  try {
    const result = await requestJson({
      schemaName: "lifepath_final_summary",
      schema: {
        type: "object",
        additionalProperties: false,
        required: ["title", "biography"],
        properties: {
          title: { type: "string" },
          biography: { type: "string" },
        },
      },
      system:
        `Eres el narrador final de LifePath. Genera un titulo vital y una biografia final breve en espanol segun stats y decisiones. Devuelve solo JSON valido.\n${GAME_DIRECTION}\n${FINAL_SUMMARY_RULES}`,
      user: {
        playerName: player.name,
        gender: player.gender,
        genderLabel: player.genderLabel,
        finalStats: player.stats,
        narrativeState: player.narrativeState,
        legacyScore,
        timeline: getRecentTimeline(player, 12),
        narrativeContext: analyzePlayerContext(player),
      },
    });

    return {
      title: String(result.title || titleByStat[strongestStat]).slice(0, 90),
      biography: String(result.biography || "").slice(0, 600),
    };
  } catch (error) {
    console.warn(error.message);
    return {
      title: titleByStat[strongestStat] || "Una vida dificil de resumir",
      biography: `${player.name} llego al final del tablero tras ${player.timeline.length} decisiones. Su legado alcanza ${legacyScore} puntos y queda definido sobre todo por ${strongestStat}.`,
    };
  }
}

function analyzePlayerContext(player) {
  const stats = player.stats;
  const highStats = Object.entries(stats)
    .filter(([, value]) => value >= 75)
    .map(([key]) => key);
  const lowStats = Object.entries(stats)
    .filter(([, value]) => value <= 35)
    .map(([key]) => key);
  const flags = player.timeline.map((item) => item.flag).filter(Boolean);
  const recentChoices = player.timeline.slice(-4).map((item) => item.decision);

  return {
    highStats,
    lowStats,
    flags,
    recentChoices,
    narrativeState: player.narrativeState,
    possibleArcHints: buildArcHints(stats, flags),
  };
}

function buildArcHints(stats, flags) {
  const hints = [];

  if (stats.carrera >= 70 && stats.vida <= 40) hints.push("brillantez con riesgo de burnout");
  if (stats.dinero >= 70 && stats.relaciones <= 40) hints.push("exito material con soledad");
  if (stats.relaciones >= 75 && stats.reputacion >= 65) hints.push("figura comunitaria respetada");
  if (stats.reputacion <= 35 && stats.dinero >= 65) hints.push("triunfo cuestionable");
  if (flags.includes("risk_money")) hints.push("historial de apuestas arriesgadas");
  if (flags.includes("owned_story")) hints.push("tendencia a afrontar la verdad publicamente");
  if (flags.includes("career_climb")) hints.push("ascenso profesional como eje narrativo");

  return hints;
}

module.exports = {
  generateDecisionEvent,
  generateRoundNarrative,
  generateFinalSummary,
};
