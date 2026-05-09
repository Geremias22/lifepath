# Backend Socket.IO

Esta es la parte que mantiene las salas multijugador vivas. Debe desplegarse en un host con Node.js persistente y soporte WebSocket.

## Opcion A: Koyeb

Recomendada para probar gratis porque duerme despues de 1 hora sin trafico.

1. Sube el proyecto a GitHub.
2. En Koyeb crea un nuevo Web Service desde el repositorio.
3. Elige Dockerfile si te lo pregunta.
4. Configura las variables:

```env
HOST=0.0.0.0
LLM_PROVIDER=gemini
GEMINI_MODEL=gemini-2.5-flash-lite
LLM_GENERATE_CONSEQUENCES=true
LLM_GENERATE_FINALS=true
GEMINI_API_KEY=tu_clave
CORS_ORIGIN=https://tu-frontend.vercel.app
```

5. Comprueba:

```txt
https://tu-backend.koyeb.app/health
```

## Opcion B: Render

Mas facil para empezar, pero en free tier duerme tras 15 minutos sin trafico.

1. Sube el proyecto a GitHub.
2. En Render crea un Web Service.
3. Build command:

```bash
npm ci
```

4. Start command:

```bash
npm start
```

5. Health check path:

```txt
/health
```

6. Variables:

```env
HOST=0.0.0.0
LLM_PROVIDER=gemini
GEMINI_MODEL=gemini-2.5-flash-lite
LLM_GENERATE_CONSEQUENCES=true
LLM_GENERATE_FINALS=true
GEMINI_API_KEY=tu_clave
CORS_ORIGIN=https://tu-frontend.vercel.app
```

## Validacion

El endpoint:

```txt
/health
```

debe devolver algo similar a:

```json
{
  "status": "ok",
  "app": "LifePath",
  "realtime": "socket.io",
  "provider": "gemini"
}
```

Cuando Vercel este desplegado, actualiza `CORS_ORIGIN` en el backend con el dominio exacto del frontend.
