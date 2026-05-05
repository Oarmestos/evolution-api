# Tareas Pendientes - Evolution API

**Fecha:** 04 de Mayo de 2026  
**Estado:** En progreso

---

## ✅ Lo que hicimos hoy

### 1. Corrección de la Tienda (Store)
- **Problema:** La tienda no cargaba correctamente desde `http://localhost:5173/store/index.html?instance=finanzas`
- **Soluciones aplicadas:**
  - Removido BOM del archivo `store/index.html` que causaba error de sintaxis
  - Agregado proxy en Vite para `/store` y `/store-api` en `frontend/vite.config.ts`
  - Corregido el enlace de la tienda en `ChatHub.tsx` para usar `VITE_API_URL`
  - Agregado favicon inline para evitar error 404
  - Mejorada configuración CORS en `src/main.ts` para desarrollo localhost

### 2. Mejoras en el Backend
- Agregado endpoint `getStoreByInstance` en `theme.controller.ts`
- Mejorado `theme.service.ts` con sincronización de WhatsApp
- Corregido import dinámico en `index.router.ts` para evitar error de ESLint

### 3. Mejoras en el Frontend
- Actualizado `frontend/src/index.css` con nuevas fuentes (Inter, Montserrat, etc.)
- Modificado `Orders.tsx` y `Products.tsx` para usar rutas relativas (mejor compatibilidad con proxy Vite)

### 4. Control de Versiones
- **Commits realizados:**
  - `e123d125` - feat(store): fix store page loading and improve proxy configuration
  - `4f05dfd4` - fix(theme): correct logger call to fix TypeScript error
  - `b071d7ae` - feat(frontend): update fonts and use relative API paths
- **Push exitoso** al repositorio remoto
- **Archivo sensible descartado:** `docs/credentials.md` (no se subió al repo)

---

## 📋 Tareas para Mañana

### Prioridad Alta
- [ ] **Probar exhaustivamente la tienda** en diferentes navegadores
- [ ] **Verificar sincronización de tema** con WhatsApp (nombre, foto de perfil)
- [ ] **Revisar logs** del backend para detectar posibles errores

### Prioridad Media
- [ ] **Optimizar carga de productos** en la tienda (paginación si es necesario)
- [ ] **Mejorar manejo de errores** en el frontend de la tienda
- [ ] **Documentar API** de la tienda en Swagger

### Ideas para explorar
- [ ] Implementar carrito de compras en la tienda
- [ ] Agregar más métodos de pago
- [ ] Mejorar la interfaz de la tienda (más temas disponibles)

---

## 📝 Notas Técnicas

### Configuración actual
- **Backend:** `http://localhost:8080`
- **Frontend (Vite):** `http://localhost:5173`
- **Base de datos:** PostgreSQL en `localhost:5432`

### Archivos modificados hoy
1. `store/index.html` - Correcciones de sintaxis
2. `frontend/vite.config.ts` - Proxies agregados
3. `frontend/src/pages/ChatHub.tsx` - Icono de tienda agregado
4. `src/api/controllers/theme.controller.ts` - Nuevo endpoint
5. `src/api/services/theme.service.ts` - Lógica de sincronización
6. `src/api/routes/index.router.ts` - Ruta de la tienda
7. `src/main.ts` - Configuración CORS

### Comandos útiles para mañana
```bash
# Iniciar backend
npm run dev:server

# Iniciar frontend
cd frontend && npm run dev

# Verificar estado del repo
git status

# Ver logs del backend
# Los logs aparecen en la terminal donde corre `npm run dev:server`
```

---

## ⚠️ Recordatorios
- **NO subir** `docs/credentials.md` ni ningún archivo con credenciales
- Siempre hacer `git status` antes de hacer commit
- Probar cambios en ambos servidores (Vite y backend) antes de subir

---

**¡Buen descanso! Mañana seguimos trabajando. 🚀**