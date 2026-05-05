# Tareas Pendientes - Evolution API

**Fecha:** 05 de Mayo de 2026  
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
  - `7b559f63` - feat(store): add pagination, fix WhatsApp sync, improve error handling and Swagger docs
- **Push exitoso** al repositorio remoto
- **Archivo sensible descartado:** `docs/credentials.md` (no se subió al repo)

### 5. Mejoras del 05 de Mayo
- **Sincronización de tema con WhatsApp corregida:** El método `syncWithWhatsapp` ahora usa `instanceName` directamente, asegurando que se sincronice con la instancia correcta
- **Paginación implementada:** `getThemeByInstance` ahora soporta `page`, `limit` y devuelve metadatos de paginación
- **Manejo de errores mejorado en frontend:** `store/index.html` con botón de reintentar y mejor feedback visual
- **Documentación Swagger:** Agregada documentación básica para endpoint `/store-api/{instanceName}` con esquemas de `StoreTheme` y `Product`

---

## 📋 Tareas Pendientes

### Prioridad Alta
- [ ] **Probar exhaustivamente la tienda** en diferentes navegadores (Chrome, Firefox, Edge)
- [ ] **Verificar sincronización de tema** con WhatsApp (nombre, foto de perfil) - Configuración en UI

### Prioridad Media
- [ ] **Optimizar carga de productos** en la tienda - ✅ Completado (paginación implementada)
- [ ] **Mejorar manejo de errores** en el frontend de la tienda - ✅ Completado
- [ ] **Documentar API** de la tienda en Swagger - ✅ Completado

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

### Archivos modificados hoy (05/May)
1. `src/api/services/theme.service.ts` - Corrección de sincronización y paginación
2. `src/api/controllers/theme.controller.ts` - Documentación Swagger y soporte paginación
3. `src/api/routes/theme.router.ts` - Ruta duplicada para compatibilidad
4. `src/config/swagger.config.ts` - Esquemas para StoreTheme y Product
5. `store/index.html` - Paginación en frontend y mejor manejo de errores

### Comandos útiles
```bash
# Iniciar backend
npm run dev:server

# Iniciar frontend
cd frontend && npm run dev

# Verificar estado del repo
git status

# Ver logs del backend
# Los logs aparecen en la terminal donde corre `npm run dev:server`

# Probar tienda
# http://localhost:5173/store/index.html?instance=finanzas
```

---

## ⚠️ Recordatorios
- **NO subir** `docs/credentials.md` ni ningún archivo con credenciales
- Siempre hacer `git status` antes de hacer commit
- Probar cambios en ambos servidores (Vite y backend) antes de subir

---

**¡Buen progreso! Seguimos trabajando. 🚀**
