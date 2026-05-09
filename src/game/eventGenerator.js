const BOARD_SIZE = 30;

const STAT_META = {
  dinero: { label: "Dinero", color: "#f4d06f" },
  vida: { label: "Vida", color: "#66d9e8" },
  carrera: { label: "Carrera", color: "#e76f51" },
  relaciones: { label: "Relaciones", color: "#a7f3d0" },
  reputacion: { label: "Reputacion", color: "#c4a7ff" },
};

const STAT_SEQUENCE = [
  "carrera",
  "relaciones",
  "dinero",
  "vida",
  "reputacion",
  "dinero",
  "carrera",
  "vida",
  "relaciones",
  "reputacion",
  "carrera",
  "dinero",
  "vida",
  "relaciones",
  "reputacion",
  "dinero",
  "vida",
  "carrera",
  "relaciones",
  "reputacion",
  "carrera",
  "dinero",
  "relaciones",
  "vida",
  "reputacion",
  "dinero",
  "carrera",
  "vida",
  "relaciones",
  "reputacion",
];

const EVENTS_BY_STAT = {
  dinero: [
    {
      id: "money-seed",
      title: "Una inversion llama a la puerta",
      descriptions: {
        default:
          "Aparece una oportunidad financiera tentadora. No es una ruina segura ni una victoria garantizada, pero pide una decision clara.",
        ambitious_start:
          "Tu ambicion inicial atrae una oportunidad de inversion mas grande de lo normal. Tambien trae mas presion.",
        free_spirit_start:
          "Una propuesta flexible encaja con tu deseo de libertad, aunque tus ahorros no estan precisamente blindados.",
      },
      options: [
        {
          id: "safe-plan",
          text: "Invertir poco y proteger la estabilidad",
          effects: { dinero: 6, vida: 2, carrera: 0, relaciones: 0, reputacion: 1 },
          flag: "careful_money",
        },
        {
          id: "bold-bet",
          text: "Apostar fuerte por el crecimiento",
          effects: { dinero: 15, vida: -8, carrera: 5, relaciones: -3, reputacion: 3 },
          flag: "risk_money",
        },
        {
          id: "share-profit",
          text: "Montarlo con alguien de confianza",
          effects: { dinero: 7, vida: 1, carrera: 2, relaciones: 8, reputacion: 4 },
          flag: "shared_money",
        },
      ],
    },
    {
      id: "side-hustle-after-party",
      title: "Un negocio raro a las 4:37",
      descriptions: {
        default:
          "Sales de Wolf con el movil al 3%, una idea absurda y alguien diciendote que hay dinero facil. Suena a plan brillante durante exactamente siete minutos.",
        risky_side_hustle:
          "Ya has probado atajos raros antes, y ahora el universo vuelve con otro folleto moralmente pegajoso.",
      },
      options: [
        {
          id: "legal-pop-up",
          text: "Montar un pop-up legal de camisetas feas pero virales",
          effects: { dinero: 9, vida: -2, carrera: 5, relaciones: 3, reputacion: 4 },
          flag: "legal_hustle",
        },
        {
          id: "shady-hustle",
          text: "Meterte en trapicheos sin preguntar demasiado",
          effects: { dinero: 16, vida: -10, carrera: -4, relaciones: -6, reputacion: -14 },
          flag: "risky_side_hustle",
        },
        {
          id: "walk-home",
          text: "Irte a casa antes de que la idea tenga nombre",
          effects: { dinero: -1, vida: 7, carrera: 0, relaciones: 1, reputacion: 3 },
          flag: "dodged_bad_idea",
        },
      ],
    },
    {
      id: "money-crack",
      title: "Gasto inesperado",
      descriptions: {
        default:
          "Un golpe economico altera tus planes. La forma de responder puede convertir el problema en una pista sobre quien eres.",
        careful_money:
          "Tu prudencia anterior suaviza el impacto, pero aun asi debes elegir que sacrificas.",
        risk_money:
          "La apuesta fuerte del pasado hace que este gasto duela mas de lo previsto.",
      },
      options: [
        {
          id: "cut-back",
          text: "Recortar gastos sin pedir ayuda",
          effects: { dinero: 4, vida: -5, carrera: 0, relaciones: -2, reputacion: 0 },
          flag: "self_reliant",
        },
        {
          id: "ask-help",
          text: "Pedir apoyo y devolverlo con tiempo",
          effects: { dinero: 2, vida: 3, carrera: 0, relaciones: 7, reputacion: 2 },
          flag: "accepted_help",
        },
        {
          id: "quick-income",
          text: "Aceptar un trabajo extra agotador",
          effects: { dinero: 10, vida: -9, carrera: 4, relaciones: -4, reputacion: 1 },
          flag: "overworked",
        },
      ],
    },
  ],
  vida: [
    {
      id: "life-balance",
      title: "El cuerpo empieza a hablar",
      descriptions: {
        default:
          "Notas que tu ritmo vital tiene consecuencias. Puedes ignorarlo, corregirlo o cambiar de prioridades.",
        overworked:
          "El trabajo extra que aceptaste pasa factura. La decision ya no es teorica, es fisica.",
        ambitious_start:
          "La ambicion te ha llevado lejos, pero tu bienestar pide entrar en la conversacion.",
      },
      options: [
        {
          id: "rest",
          text: "Bajar el ritmo y recuperar energia",
          effects: { dinero: -4, vida: 14, carrera: -2, relaciones: 4, reputacion: 1 },
          flag: "protected_health",
        },
        {
          id: "push",
          text: "Seguir apretando un poco mas",
          effects: { dinero: 6, vida: -12, carrera: 7, relaciones: -4, reputacion: 2 },
          flag: "ignored_health",
        },
        {
          id: "routine",
          text: "Crear una rutina sostenible",
          effects: { dinero: -1, vida: 9, carrera: 3, relaciones: 2, reputacion: 3 },
          flag: "healthy_routine",
        },
      ],
    },
    {
      id: "first-smoke-party",
      title: "La noche del porro filosofico",
      descriptions: {
        default:
          "En una fiesta alguien saca un porro y de repente todo el mundo parece tener una teoria sobre la vida, la UAB y las luces del lavabo.",
        tried_weed:
          "La escena se repite, pero esta vez ya sabes que el porro puede ser anecdota o costumbre.",
        quit_weed:
          "Te ofrecen otra vez. La diferencia es que ahora sabes por que habias parado.",
      },
      options: [
        {
          id: "try-weed",
          text: "Probar y convertirte en filosofo de sofa por una noche",
          effects: { dinero: -2, vida: -3, carrera: -1, relaciones: 5, reputacion: -1 },
          flag: "tried_weed",
        },
        {
          id: "say-no",
          text: "Pasar y reirte viendo el documental mental de los demas",
          effects: { dinero: 0, vida: 4, carrera: 1, relaciones: 1, reputacion: 3 },
          flag: "stayed_clear",
        },
        {
          id: "party-too-hard",
          text: "Mezclar fiesta, cero agua y decisiones discutibles",
          effects: { dinero: -6, vida: -12, carrera: -4, relaciones: 4, reputacion: -5 },
          flag: "party_excess",
        },
      ],
    },
    {
      id: "quit-or-sink",
      title: "La resaca ya no hace gracia",
      descriptions: {
        default:
          "Lo que empezo como broma empieza a aparecer en momentos donde no tocaba. La vida te pasa factura con letra pequena.",
        risky_side_hustle:
          "Ademas de fumar, te has acercado a ambientes raros. La linea entre anecdotas y problemas se esta borrando.",
      },
      options: [
        {
          id: "quit-smoking",
          text: "Dejar de fumar y ordenar tu cabeza",
          effects: { dinero: 3, vida: 13, carrera: 4, relaciones: 2, reputacion: 5 },
          flag: "quit_weed",
        },
        {
          id: "double-down",
          text: "Negarlo todo y seguir como si el lunes no existiera",
          effects: { dinero: -4, vida: -13, carrera: -6, relaciones: -3, reputacion: -5 },
          flag: "denied_problem",
        },
        {
          id: "ask-friend",
          text: "Pedir ayuda a un amigo antes de liarla mas",
          effects: { dinero: 0, vida: 9, carrera: 1, relaciones: 8, reputacion: 2 },
          flag: "asked_help_substances",
        },
      ],
    },
    {
      id: "life-meaning",
      title: "Una pausa con preguntas",
      descriptions: {
        default:
          "Un momento de silencio te obliga a revisar si la vida que llevas se parece a la que querias.",
        free_spirit_start:
          "Tu busqueda de libertad vuelve con fuerza: no quieres una vida correcta, quieres una vida propia.",
        community_start:
          "Tus vinculos te ayudan a hacerte una pregunta dificil sin sentirte solo.",
      },
      options: [
        {
          id: "therapy",
          text: "Pedir ayuda profesional y ordenar tus ideas",
          effects: { dinero: -5, vida: 13, carrera: 1, relaciones: 2, reputacion: 1 },
          flag: "inner_work",
        },
        {
          id: "escape-trip",
          text: "Hacer un viaje impulsivo para despejarte",
          effects: { dinero: -9, vida: 9, carrera: -2, relaciones: 3, reputacion: 2 },
          flag: "escape_trip",
        },
        {
          id: "stay-course",
          text: "No tocar nada y confiar en que pase",
          effects: { dinero: 2, vida: -6, carrera: 2, relaciones: -2, reputacion: 0 },
          flag: "avoided_change",
        },
      ],
    },
  ],
  carrera: [
    {
      id: "career-door",
      title: "Una puerta profesional",
      descriptions: {
        default:
          "Se abre una posibilidad que puede acelerar tu carrera, aunque nada viene gratis.",
        ambitious_start:
          "La decision ambiciosa del principio hace que te vean como alguien preparado para una apuesta mayor.",
        protected_health:
          "Tu energia recuperada te permite mirar esta oportunidad con mas claridad que antes.",
      },
      options: [
        {
          id: "promotion",
          text: "Aceptar mas responsabilidad",
          effects: { dinero: 8, vida: -6, carrera: 14, relaciones: -3, reputacion: 5 },
          flag: "career_climb",
        },
        {
          id: "learn",
          text: "Formarte antes de saltar",
          effects: { dinero: -6, vida: -2, carrera: 13, relaciones: 0, reputacion: 4 },
          flag: "trained_skill",
        },
        {
          id: "side-project",
          text: "Crear algo propio en paralelo",
          effects: { dinero: -5, vida: -5, carrera: 11, relaciones: 2, reputacion: 6 },
          flag: "indie_project",
        },
      ],
    },
    {
      id: "uab-or-work",
      title: "UAB o nomina",
      descriptions: {
        default:
          "Llega la decision clasica: entrar en la UAB con mochila, apuntes y cafe malo, o empezar a trabajar y aprender a base de jefe y Excel.",
        tried_weed:
          "La UAB suena a libertad, cesped y algun jueves que empieza con clase y acaba regular.",
      },
      options: [
        {
          id: "go-uab",
          text: "Ir a la UAB y prometer que este semestre si organizas los apuntes",
          effects: { dinero: -8, vida: 2, carrera: 13, relaciones: 7, reputacion: 3 },
          flag: "uab_student",
        },
        {
          id: "start-work",
          text: "Ponerte a trabajar y madurar por las malas",
          effects: { dinero: 10, vida: -4, carrera: 8, relaciones: -2, reputacion: 2 },
          flag: "early_worker",
        },
        {
          id: "half-half",
          text: "Intentar estudiar y trabajar, confiando en una agenda que no existe",
          effects: { dinero: 5, vida: -10, carrera: 12, relaciones: -4, reputacion: 4 },
          flag: "study_work_grind",
        },
      ],
    },
    {
      id: "caught-at-work",
      title: "Recursos Humanos huele drama",
      descriptions: {
        default:
          "En el trabajo notan que algo no cuadra: llegadas tarde, ojos de haber debatido con una farola y rendimiento irregular.",
        tried_weed:
          "Alguien en el trabajo sospecha que la fiesta y los porros estan invadiendo horario laboral.",
        party_excess:
          "La resaca ha fichado contigo y ya tiene silla propia.",
      },
      options: [
        {
          id: "clean-up",
          text: "Reconocerlo, cortar el descontrol y salvar el puesto",
          effects: { dinero: 1, vida: 10, carrera: 6, relaciones: 1, reputacion: 5 },
          flag: "cleaned_up_work",
        },
        {
          id: "deny-work",
          text: "Negarlo con una seguridad que no convence ni al ficus",
          effects: { dinero: -6, vida: -5, carrera: -12, relaciones: -2, reputacion: -8 },
          flag: "caught_at_work",
        },
        {
          id: "change-job",
          text: "Cambiar de trabajo y venderlo como reinvencion personal",
          effects: { dinero: -4, vida: 3, carrera: 3, relaciones: 0, reputacion: 1 },
          flag: "career_reset",
        },
      ],
    },
    {
      id: "career-ethics",
      title: "Atajo profesional",
      descriptions: {
        default:
          "Alguien te ofrece un atajo que puede mejorar tu posicion, pero el precio moral no esta del todo escondido.",
        influence_start:
          "Tu facilidad para moverte entre oportunidades hace este atajo especialmente tentador.",
        career_climb:
          "Ahora que estas subiendo, una decision dudosa podria acelerar aun mas la escalada.",
      },
      options: [
        {
          id: "transparent",
          text: "Rechazar el atajo y hacerlo transparente",
          effects: { dinero: -3, vida: 2, carrera: 3, relaciones: 4, reputacion: 13 },
          flag: "clean_reputation",
        },
        {
          id: "take-shortcut",
          text: "Usarlo sin dejar rastro",
          effects: { dinero: 8, vida: -4, carrera: 12, relaciones: -4, reputacion: -14 },
          flag: "dark_shortcut",
        },
        {
          id: "redirect",
          text: "Convertirlo en una oportunidad para el equipo",
          effects: { dinero: 3, vida: 1, carrera: 7, relaciones: 7, reputacion: 8 },
          flag: "team_builder",
        },
      ],
    },
  ],
  relaciones: [
    {
      id: "relationship-call",
      title: "Alguien importante te necesita",
      descriptions: {
        default:
          "Una persona cercana atraviesa un momento dificil. Tu respuesta dira cuanto espacio ocupan los demas en tu vida.",
        community_start:
          "Elegiste poner los vinculos en el centro, y ahora esa decision se vuelve concreta.",
        ignored_health:
          "Llegas con poca energia, pero aun asi alguien cercano te necesita.",
      },
      options: [
        {
          id: "show-up",
          text: "Estar presente aunque tengas que reorganizarte",
          effects: { dinero: -2, vida: 4, carrera: -3, relaciones: 14, reputacion: 4 },
          flag: "showed_up",
        },
        {
          id: "send-money",
          text: "Ayudar economicamente sin implicarte demasiado",
          effects: { dinero: -8, vida: -1, carrera: 1, relaciones: 6, reputacion: 2 },
          flag: "distant_help",
        },
        {
          id: "postpone",
          text: "Prometer que iras mas adelante",
          effects: { dinero: 2, vida: -2, carrera: 3, relaciones: -9, reputacion: -2 },
          flag: "postponed_people",
        },
      ],
    },
    {
      id: "first-relationship",
      title: "Primera relacion seria",
      descriptions: {
        default:
          "Conoces a alguien que te gusta de verdad. No solo 'me contesta stories', sino de hablar de planes y asustarse un poco.",
      },
      options: [
        {
          id: "start-relationship",
          text: "Apostar por la relacion y dejar de hacerte el interesante",
          effects: { dinero: -2, vida: 9, carrera: -1, relaciones: 14, reputacion: 3 },
          flag: "started_relationship",
        },
        {
          id: "keep-casual",
          text: "Mantenerlo casual porque compromiso suena a examen sorpresa",
          effects: { dinero: 1, vida: 2, carrera: 3, relaciones: 2, reputacion: -1 },
          flag: "casual_dating",
        },
        {
          id: "ghost",
          text: "Desaparecer y culpar al algoritmo",
          effects: { dinero: 0, vida: -4, carrera: 1, relaciones: -10, reputacion: -6 },
          flag: "ghosted_someone",
        },
      ],
    },
    {
      id: "marriage-crossroad",
      title: "Anillo o puerta de emergencia",
      descriptions: {
        default:
          "La relacion ya no cabe en 'vamos viendo'. Alguien pone sobre la mesa casarse, dejarlo o seguir eternamente en modo demo.",
        party_excess:
          "Despues de varias noches raras, la relacion pide claridad con menos humo y mas verdad.",
      },
      options: [
        {
          id: "marry",
          text: "Casarte y aceptar que el Excel de invitados sera una guerra",
          effects: { dinero: -12, vida: 9, carrera: -1, relaciones: 16, reputacion: 6 },
          flag: "got_married",
        },
        {
          id: "break-up",
          text: "Dejarlo antes de convertir dudas en hipoteca emocional",
          effects: { dinero: 1, vida: -6, carrera: 4, relaciones: -12, reputacion: -1 },
          flag: "ended_relationship",
        },
        {
          id: "delay-marriage",
          text: "Aplazarlo y prometer hablarlo despues de otra crisis",
          effects: { dinero: 2, vida: -3, carrera: 2, relaciones: -4, reputacion: 0 },
          flag: "delayed_commitment",
        },
      ],
    },
    {
      id: "children-question",
      title: "La pregunta de tener hijos",
      descriptions: {
        default:
          "La vida se pone intensa: aparece la conversacion de hijos. Nadie sabe si esta preparado, pero todo el mundo opina como si tuviera un podcast.",
      },
      options: [
        {
          id: "have-children",
          text: "Tener hijos y descubrir el modo dificil con amor incluido",
          effects: { dinero: -14, vida: 5, carrera: -5, relaciones: 15, reputacion: 5 },
          flag: "had_children",
        },
        {
          id: "childfree",
          text: "Elegir no tener hijos y defenderlo en cada comida familiar",
          effects: { dinero: 8, vida: 6, carrera: 5, relaciones: -3, reputacion: 2 },
          flag: "childfree_path",
        },
        {
          id: "not-yet",
          text: "Dejarlo para mas adelante, como si el calendario no tuviera opiniones",
          effects: { dinero: 3, vida: 1, carrera: 3, relaciones: -2, reputacion: 0 },
          flag: "postponed_children",
        },
      ],
    },
    {
      id: "relationship-choice",
      title: "Un vinculo cambia de forma",
      descriptions: {
        default:
          "Una amistad, una pareja o un lazo familiar ya no funciona igual. Puedes cuidarlo, soltarlo o evitar la conversacion.",
        showed_up:
          "Tu presencia anterior abrio una confianza nueva, pero tambien pide honestidad.",
        postponed_people:
          "Haber dejado a alguien esperando hace que esta conversacion llegue con mas peso.",
      },
      options: [
        {
          id: "honest-talk",
          text: "Hablar claro aunque sea incomodo",
          effects: { dinero: 0, vida: 5, carrera: -1, relaciones: 9, reputacion: 3 },
          flag: "honest_bonds",
        },
        {
          id: "avoid",
          text: "Evitar el conflicto y seguir como si nada",
          effects: { dinero: 1, vida: -5, carrera: 2, relaciones: -8, reputacion: -1 },
          flag: "avoided_bonds",
        },
        {
          id: "let-go",
          text: "Aceptar que ese vinculo necesita distancia",
          effects: { dinero: 0, vida: 6, carrera: 1, relaciones: -4, reputacion: 2 },
          flag: "let_go",
        },
      ],
    },
  ],
  reputacion: [
    {
      id: "reputation-spotlight",
      title: "El foco publico",
      descriptions: {
        default:
          "Una decision tuya se vuelve visible. Lo que era privado ahora tambien construye una imagen publica.",
        clean_reputation:
          "Tu transparencia anterior hace que la gente espere coherencia de ti.",
        dark_shortcut:
          "El atajo oscuro del pasado vuelve como sombra justo cuando mas ojos miran.",
      },
      options: [
        {
          id: "own-story",
          text: "Contar tu version con honestidad",
          effects: { dinero: -1, vida: 3, carrera: 2, relaciones: 3, reputacion: 12 },
          flag: "owned_story",
        },
        {
          id: "spin",
          text: "Maquillar la historia para salir mejor",
          effects: { dinero: 5, vida: -4, carrera: 5, relaciones: -3, reputacion: -10 },
          flag: "public_spin",
        },
        {
          id: "silence",
          text: "Guardar silencio y dejar que pase",
          effects: { dinero: 1, vida: -1, carrera: 0, relaciones: -1, reputacion: -4 },
          flag: "public_silence",
        },
      ],
    },
    {
      id: "wolf-night",
      title: "Noche en Wolf",
      descriptions: {
        default:
          "Vas a Wolf diciendo 'solo una copa'. La frase dura menos que la bateria del movil. Alguien graba algo y manana puede ser mito o problema.",
        party_excess:
          "Tu historial de fiesta ya tiene trailer. Esta noche puede ser la secuela que nadie pidio.",
      },
      options: [
        {
          id: "legend-night",
          text: "Ser el alma de la noche sin cruzar demasiadas lineas",
          effects: { dinero: -6, vida: -3, carrera: 0, relaciones: 10, reputacion: 6 },
          flag: "wolf_legend",
        },
        {
          id: "viral-mess",
          text: "Hacer algo viral que tu yo del lunes va a denunciar",
          effects: { dinero: -8, vida: -8, carrera: -3, relaciones: 4, reputacion: -12 },
          flag: "public_scandal",
        },
        {
          id: "go-home-wolf",
          text: "Irte pronto y convertirte en leyenda de autocontrol",
          effects: { dinero: 0, vida: 6, carrera: 2, relaciones: -1, reputacion: 4 },
          flag: "left_party_early",
        },
      ],
    },
    {
      id: "reputation-legacy",
      title: "La huella que dejas",
      descriptions: {
        default:
          "Alguien te ofrece participar en algo con impacto real. La pregunta es cuanto estas dispuesto a entregar.",
        team_builder:
          "Haber compartido oportunidades antes hace que ahora te inviten a liderar algo mas grande.",
        shared_money:
          "La confianza construida alrededor del dinero te abre una puerta social inesperada.",
      },
      options: [
        {
          id: "public-good",
          text: "Usar tu influencia para un proyecto social",
          effects: { dinero: -7, vida: 6, carrera: 3, relaciones: 7, reputacion: 15 },
          flag: "public_good",
        },
        {
          id: "personal-brand",
          text: "Convertirlo en marca personal",
          effects: { dinero: 9, vida: -2, carrera: 8, relaciones: -2, reputacion: 5 },
          flag: "personal_brand",
        },
        {
          id: "step-back",
          text: "Ceder el protagonismo a otras personas",
          effects: { dinero: -2, vida: 5, carrera: 0, relaciones: 8, reputacion: 8 },
          flag: "shared_credit",
        },
      ],
    },
  ],
};

function getBoard() {
  return STAT_SEQUENCE.map((stat, index) => ({
    position: index + 1,
    stat,
    label: STAT_META[stat].label,
    color: STAT_META[stat].color,
  }));
}

function getBoardSize() {
  return BOARD_SIZE;
}

function getFlags(player) {
  return new Set(player.timeline.map((item) => item.flag).filter(Boolean));
}

function chooseDescription(event, flags) {
  const matchingFlag = Object.keys(event.descriptions).find((key) => key !== "default" && flags.has(key));
  return event.descriptions[matchingFlag] || event.descriptions.default;
}

function pickStatEvent(stat, player, position) {
  const state = player.narrativeState || {};
  const events = EVENTS_BY_STAT[stat];
  const contextualEvent = events.find((event) => {
    if (event.id === "first-relationship") return stat === "relaciones" && !state.hasPartner;
    if (event.id === "marriage-crossroad") return stat === "relaciones" && state.hasPartner && !state.married;
    if (event.id === "children-question") return stat === "relaciones" && state.married && !state.hasChildren;
    if (event.id === "uab-or-work") return stat === "carrera" && !state.educationPath;
    if (event.id === "caught-at-work") return stat === "carrera" && state.triedWeed && !state.caughtAtWork;
    if (event.id === "first-smoke-party") return stat === "vida" && !state.triedWeed;
    if (event.id === "quit-or-sink") return stat === "vida" && state.triedWeed && !state.quitWeed;
    if (event.id === "wolf-night") return stat === "reputacion" && state.partyReputation < 2;
    if (event.id === "side-hustle-after-party") return stat === "dinero" && (state.triedWeed || state.partyReputation > 0);
    return false;
  });

  if (contextualEvent) {
    return contextualEvent;
  }

  const historyOffset = player.timeline.length + position;
  return events[historyOffset % events.length];
}

function buildEventForLanding(player, square, roll) {
  const flags = getFlags(player);
  const baseEvent = pickStatEvent(square.stat, player, square.position);
  const firstTurnPrefix = player.timeline.length === 0 ? "Tu primera casilla marca el arranque de la partida. " : "";

  return {
    id: `${baseEvent.id}-${square.position}`,
    stage: square.label,
    stat: square.stat,
    title: player.timeline.length === 0 ? `Primer giro: ${baseEvent.title}` : baseEvent.title,
    description: `${firstTurnPrefix}${chooseDescription(baseEvent, flags)}`,
    position: square.position,
    roll,
    color: square.color,
    options: baseEvent.options,
  };
}

module.exports = {
  STAT_META,
  getBoard,
  getBoardSize,
  buildEventForLanding,
};
