# Despliegue de LifePath con Vercel

## Punto importante

LifePath usa Socket.IO para salas multijugador en tiempo real. Vercel Functions no pueden actuar como servidor WebSocket, asi que el despliegue gratis en Vercel solo debe usarse para el frontend si mantenemos esta arquitectura.

Para que el juego funcione con varias personas desde un link real, hay dos caminos:

1. Frontend en Vercel + backend Socket.IO en un host que soporte WebSockets.
2. Rehacer el multijugador con polling/serverless + una base de datos externa.

El camino 1 es el recomendado para esta practica porque conserva el juego actual y toca menos codigo.

## Camino recomendado

1. Despliega primero el backend Socket.IO siguiendo:

```txt
docs/deploy-backend.md
```

2. Cuando tengas la URL del backend, comprueba:

```txt
https://tu-backend/health
```

3. En Vercel crea el proyecto usando este repositorio.

4. Configura en Vercel la variable:

```env
LIFEPATH_SOCKET_URL=https://lifepath-backend-4lbj.onrender.com
```

5. Vercel ejecutara:

```bash
npm run build
```

El build genera `public/js/config.js` y el frontend cargara Socket.IO desde:

```txt
https://lifepath-backend-4lbj.onrender.com/socket.io/socket.io.js
```

6. Copia el dominio final de Vercel y ponlo en el backend:

```env
CORS_ORIGIN=https://tu-frontend.vercel.app
```

## Variables

Backend:

```env
HOST=0.0.0.0
LLM_PROVIDER=gemini
GEMINI_MODEL=gemini-2.5-flash-lite
LLM_GENERATE_CONSEQUENCES=true
LLM_GENERATE_FINALS=true
GEMINI_API_KEY=tu_clave
CORS_ORIGIN=https://tu-frontend.vercel.app
```

Frontend Vercel:

```env
LIFEPATH_SOCKET_URL=https://lifepath-backend-4lbj.onrender.com
```

## Prueba local con backend externo

Tambien puedes probarlo sin tocar Vercel abriendo:

```txt
http://localhost:3001/?server=https://tu-backend
```

Ese parametro tiene prioridad sobre `LIFEPATH_SOCKET_URL`.

## Checklist final

- `/health` del backend responde publicamente.
- `LIFEPATH_SOCKET_URL` apunta a la URL del backend sin barra final.
- `CORS_ORIGIN` del backend apunta al dominio de Vercel.
- Dos navegadores pueden crear/unirse a la misma sala.
- El dado, turnos, decisiones y Gemini se sincronizan entre jugadores.

## Camino alternativo: solo Vercel

Para usar solo Vercel habria que sustituir Socket.IO por peticiones HTTP y guardar las salas en una DB externa como Upstash Redis, Supabase o Firebase. Es viable, pero implica reescribir una parte notable del multijugador y la experiencia seria mas tipo polling que tiempo real puro.
