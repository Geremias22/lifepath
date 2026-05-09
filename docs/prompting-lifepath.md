# Prompts y rumbo creativo de LifePath

El archivo editable principal es:

```txt
src/prompts/lifepathPrompts.js
```

Modifica ese archivo para cambiar el tono, los tipos de decisiones y las ramas de vida.

## Que sabe la IA de cada jugador

Cada evento recibe:

- nombre y genero;
- posicion del tablero;
- stat de la casilla;
- stats actuales;
- ultimas decisiones;
- flags anteriores;
- estado narrativo: pareja, boda, hijos, UAB/trabajo, fiesta, porros, si lo ha dejado, escandalos, trabajo, etc.

## Ramas actuales

Relaciones:

- primera relacion;
- seguir casual;
- ghostear;
- casarse;
- dejar la relacion;
- tener hijos;
- no tener hijos;
- posponerlo.

Carrera:

- ir a la UAB;
- trabajar joven;
- estudiar y trabajar;
- ascenso;
- pillada en el trabajo por descontrol;
- reinvencion laboral.

Vida / fiesta:

- probar un porro;
- pasar del tema;
- fiesta excesiva;
- dejarlo;
- pedir ayuda;
- negar que hay problema.

Reputacion:

- noche en Wolf;
- ser leyenda social;
- liarla y hacerse viral;
- salir pronto y salvar dignidad.

Dinero:

- negocios legales raros;
- atajos turbios tratados de forma abstracta;
- rechazar malas ideas.

## Importante sobre temas polemicos

El juego puede incluir drogas, fiesta, errores y caminos turbios desde el humor, pero no debe explicar como cometer delitos ni vender sustancias. Si aparece una opcion tipo "trapicheos", debe ser abstracta y tener consecuencias sociales, legales, de reputacion o salud.

## Como hacer vidas mas distintas

Anade flags en `EVENT_GENERATION_RULES`:

```txt
famous_dj_path
single_parent_path
uab_professor_path
wolf_legend
quiet_family_life
burnout_path
public_scandal
healed_family
lonely_success
community_icon
```

Y explica como deben afectar:

```txt
Si tiene wolf_legend, los eventos de reputacion pueden tratarle como alguien conocido en la noche.
Si tiene single_parent_path, las decisiones de dinero y vida deben tener mas presion familiar.
Si tiene burnout_path, los eventos de vida deben ser mas urgentes.
Si tiene quiet_family_life, los finales deben valorar estabilidad aunque no haya fama.
```

## Como cambiar el tono

Edita `GAME_DIRECTION`.

Ejemplo mas gamberro:

```txt
LifePath debe sentirse como una comedia adulta sobre sobrevivir a la universidad, el trabajo, el amor y decisiones cuestionables.
```

Ejemplo mas serio:

```txt
LifePath debe sentirse como una novela interactiva realista sobre elecciones vitales, salud mental, familia y legado.
```

## Variables utiles

En `.env`:

```env
LLM_GENERATE_CONSEQUENCES=false
LLM_GENERATE_FINALS=false
```

Si las pones en `true`, Gemini tambien escribira consecuencias y finales, pero gastara mas llamadas.
