# LifePath

Juego web multijugador narrativo inspirado en The Game of Life. Los jugadores entran en una sala, toman decisiones por rondas simultaneas y ven como cambian sus estadisticas vitales.

## Fase 1 incluida

- Servidor Node.js con Express y Socket.IO.
- Salas en memoria con codigo compartible.
- Lobby con lista de jugadores.
- Partida por turnos con dado.
- Tablero de 30 posiciones con zonas de Dinero, Vida, Carrera, Relaciones y Reputacion.
- Eventos individuales segun la casilla donde cae cada jugador.
- Decisiones ramificadas que tienen en cuenta elecciones anteriores.
- Narrativa local preparada como fallback para un futuro LLM.
- Pantalla final con resumen basico y ranking.

## Arrancar el proyecto

```bash
npm install
npm run dev
```

Luego abre:

```txt
http://localhost:3000
```

## Despliegue

El juego usa Socket.IO y salas en memoria. Para jugar online con varias personas necesitas un backend que soporte WebSockets.

La configuracion incluida permite desplegar el frontend en Vercel y apuntarlo a un backend externo con:

```env
LIFEPATH_SOCKET_URL=https://tu-backend
```

Guia completa:

```txt
docs/deploy-vercel.md
docs/deploy-backend.md
```

## Usar Gemini gratis como LLM

Opcion recomendada para esta practica si no quieres gastar dinero:

```env
LLM_PROVIDER=gemini
GEMINI_MODEL=gemini-2.5-flash-lite
LLM_GENERATE_CONSEQUENCES=false
LLM_GENERATE_FINALS=false
GEMINI_API_KEY=tu_clave_de_google_ai_studio
```

Consigue la clave gratis desde Google AI Studio. Mantente en el free tier y no actives billing si quieres evitar cargos.

En modo gratuito conviene dejar `LLM_GENERATE_CONSEQUENCES=false` y `LLM_GENERATE_FINALS=false`: asi solo se gasta una llamada IA cuando se genera el evento/decisiones de una casilla. Si lo pones todo en `true`, cada turno puede gastar 2 llamadas y los finales gastan llamadas extra.

## Modificar prompts y ramificacion

La direccion narrativa editable esta en:

```txt
src/prompts/lifepathPrompts.js
```

Guia de prompts:

```txt
docs/prompting-lifepath.md
```

El jugador elige genero al entrar. Esto cambia el brillo de la ficha y se envia al LLM como contexto narrativo.

Con API de pago puedes activar narrativa completa:

```env
LLM_GENERATE_CONSEQUENCES=true
LLM_GENERATE_FINALS=true
```

Para ahorrar llamadas, vuelve a `false`.

## Usar OpenAI como LLM

1. Crea una API key en el panel de OpenAI.
2. Copia `.env.example` a `.env` si todavia no existe.
3. Cambia estas variables:

```env
LLM_PROVIDER=openai
OPENAI_MODEL=gpt-4.1-nano
OPENAI_API_KEY=tu_clave_aqui
```

4. Reinicia el servidor con `npm run dev`.

Si `LLM_PROVIDER` queda en `local` o no hay `OPENAI_API_KEY`, el juego usa eventos locales para que no se rompa.

Modelo recomendado para pruebas baratas:

```env
OPENAI_MODEL=gpt-4.1-nano
```

Si aparece `insufficient_quota`, la clave es valida pero el proyecto de OpenAI no tiene cuota o billing activo.
