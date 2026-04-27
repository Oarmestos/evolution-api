# Comandos de Desarrollo — Avri

Referencia rápida para levantar los servidores en modo desarrollo.

---

## 🖥️ Backend (Evolution API)

Servidor principal de la API. Corre en `http://localhost:8080`.

```bash
npm run dev:server
```

> Utiliza `tsx watch` para hot-reload automático al modificar archivos TypeScript.

---

## 🎨 Frontend (Avri Dashboard)

Interfaz React + Vite. Corre en `http://localhost:5173`.

```bash
npm run dev:ui
```

> Utiliza el servidor de desarrollo de Vite con HMR (Hot Module Replacement) habilitado.

---

## 🚀 Levantar ambos servicios

Abre **dos terminales** y ejecuta cada comando en una terminal separada:

| Terminal | Comando | URL |
|----------|---------|-----|
| Terminal 1 | `npm run dev:server` | http://localhost:8080 |
| Terminal 2 | `npm run dev:ui` | http://localhost:5173 |

---

## 📋 Otros comandos útiles

| Comando | Descripción |
|---------|-------------|
| `npm run build` | Compilar el proyecto para producción |
| `npm run lint` | Ejecutar ESLint con auto-fix |
| `npm run db:studio` | Abrir Prisma Studio (explorador de BD) |
| `npm run db:migrate:dev:win` | Ejecutar migraciones en Windows |
