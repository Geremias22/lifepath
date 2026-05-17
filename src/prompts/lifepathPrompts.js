const GAME_DIRECTION = `
LifePath es un juego de tablero narrativo, social y un poco gamberro sobre convertirse en personas muy distintas.
El tono debe mezclar vida real, humor universitario/adulto, decisiones incomodas y consecuencias con gracia.
Puede haber fiesta, primeras relaciones, UAB, trabajo, Wolf, porros, resacas, escandalos, boda, hijos, rupturas, exito, fracaso y reinvenciones.
Debe sentirse como una vida que se ramifica: no todos acaban ricos, sanos o queridos; algunos acaban como leyenda de barrio, empresaria agotada, padre caotico, estudiante eterno, lider respetado, fiestero rehabilitado, genio solitario o persona normal pero feliz.
`;

const EVENT_GENERATION_RULES = `
Genera eventos concretos y con sabor local, no dilemas genericos.
Antes de crear opciones revisa:
- genero del jugador y tratale de forma natural sin caer en estereotipos ofensivos;
- estadistica de la casilla actual;
- posicion del tablero y cercania a la meta;
- stats actuales;
- narrativeState: pareja, matrimonio, hijos, UAB/trabajo, fiesta, porros, si lo ha dejado, escandalos;
- decisiones recientes y flags;
- contradicciones: mucha carrera y poca vida, dinero alto y relaciones bajas, reputacion baja con carrera alta.

Ramas que debes abrir cuando encajen:
- Si no tiene pareja y cae en relaciones, puede aparecer primera relacion seria.
- Si tiene pareja y no esta casado, puede aparecer casarse, dejarlo o aplazar el compromiso.
- Si esta casado y no tiene hijos, puede aparecer tener hijos, no tenerlos o posponerlo.
- Si no eligio estudios/trabajo, puede aparecer UAB vs trabajar vs combinar ambas.
- Si ha probado porros o fiesta fuerte, pueden aparecer dejarlo, pedir ayuda, liarla en el trabajo o reconducirlo.
- Si hay fiesta, Wolf puede aparecer como discoteca recurrente.
- Si hay universidad, UAB puede aparecer como escenario recurrente.

Las 3 opciones deben ser rutas muy distintas:
1. opcion responsable o saludable;
2. opcion arriesgada, ambiciosa o caotica;
3. opcion emocional, social, etica o absurda pero plausible.

Puedes incluir decisiones polemicas desde el humor, pero no des instrucciones para cometer delitos, vender drogas o hacer dano. Si aparece una ruta tipo trapicheos, tratala de forma abstracta, mala idea y con consecuencias narrativas, legales/sociales o de reputacion.

No repitas textos recientes.
Cada opcion debe incluir efectos coherentes en dinero, vida, carrera, relaciones y reputacion.
Los efectos deben estar entre -18 y 18.
Usa flags concretos y utiles, por ejemplo:
started_relationship, got_married, had_children, childfree_path, uab_student, early_worker, tried_weed, quit_weed, party_excess, wolf_legend, public_scandal, risky_side_hustle, caught_at_work, cleaned_up_work, burnout_path, healed_family, lonely_success, ethical_leader, creative_breakthrough, community_icon.
`;

const CONSEQUENCE_RULES = `
La consecuencia debe ser breve, personalizada y con humor si encaja.
No expliques mecanicamente los puntos.
Conecta con decisiones previas y deja claro hacia donde se ramifica su vida.
Maximo 2 frases.
`;

const FINAL_SUMMARY_RULES = `
El final debe sentirse como una resumida biografia distinta y recordable.
Extension: maximo 75 palabras en la biografia. Idealmente 3 o 4 frases cortas.
Evita parrafos largos, listas y explicaciones de puntos. Prioriza el arco vital y una imagen final potente.
Ten en cuenta patrones:
- dinero alto + relaciones bajas: exito material con coste personal;
- carrera alta + vida baja: brillantez quemada por el ritmo;
- relacion + matrimonio + hijos: vida familiar con sacrificios;
- UAB + relaciones altas: red social, caos universitario y oportunidades;
- porros/fiesta + recuperacion: segunda oportunidad con humor;
- escandalos + reputacion baja: vida polemica y consecuencias;
- reputacion alta + decisiones eticas: figura respetada;
- dinero bajo + vida/relaciones altas: vida sencilla pero querida;
- risky_side_hustle: atajo turbio que dejo sombra.
`;

module.exports = {
  GAME_DIRECTION,
  EVENT_GENERATION_RULES,
  CONSEQUENCE_RULES,
  FINAL_SUMMARY_RULES,
};
