# Plan de Migración: Avri Frontend a React + Vite + Tailwind CSS

Este documento detalla la estrategia paso a paso para migrar la interfaz de usuario de Avri desde HTML estático/Alpine.js hacia una arquitectura moderna, robusta y escalable utilizando React, Vite y Tailwind CSS.

## 🎯 Objetivos de la Migración
1. **Estabilidad Absoluta de UI:** Eliminar los problemas de posicionamiento (como los modales) utilizando componentes de React y utilidades probadas de Tailwind CSS.
2. **Hot Module Replacement (HMR) Real:** Obtener recarga en vivo instantánea durante el desarrollo sin configuraciones complejas, gracias a Vite.
3. **Escalabilidad:** Facilitar la creación de vistas complejas (como el constructor de flujos "Flows") que serían muy difíciles de manejar con HTML puro.
4. **Separación de Responsabilidades:** Mantener el backend (Evolution API) intacto mientras el frontend opera como un cliente independiente.

---

## 🛠️ Fase 1: Configuración de la Infraestructura

1. **Inicializar Vite:**
   - Ejecutar `npm create vite@latest frontend -- --template react-ts` dentro de la carpeta raíz del proyecto.
   - Esto creará una subcarpeta `/frontend` independiente del backend.
2. **Instalar Tailwind CSS:**
   - Instalar dependencias: `npm install -D tailwindcss postcss autoprefixer`.
   - Inicializar Tailwind: `npx tailwindcss init -p`.
   - Configurar `tailwind.config.js` con la paleta de colores de Avri (dark mode nativo).
3. **Librerías Core:**
   - Enrutamiento: `react-router-dom` (Navegación SPA).
   - Iconos: `lucide-react`.
   - Estado Global: `zustand` (Para manejar el Theme, Token, y las Instancias).

---

## 🧩 Fase 2: Construcción del App Shell (Layout)

1. **Recrear el Diseño Base:**
   - Crear el componente `Sidebar.tsx` con el menú de navegación usando Tailwind.
   - Crear el componente `Header.tsx` con el selector de tema (Dark/Light).
   - Ensamblar todo en un `DashboardLayout.tsx` que utilizará el `<Outlet />` de React Router para inyectar las páginas dinámicamente.
2. **Autenticación:**
   - Migrar la lógica de login a `Login.tsx`.
   - Crear un componente de ruta protegida (`ProtectedRoute.tsx`) que verifique el token guardado en el LocalStorage/Zustand.

---

## 🚀 Fase 3: Migración de Páginas (Vistas)

Migraremos las vistas actuales a componentes funcionales de React:

1. **Dashboard / Home (`Dashboard.tsx`):**
   - Tarjetas de métricas y gráficos.
2. **Canales de Mensajería (`Channels.tsx`):**
   - Rejilla de proveedores (WhatsApp Baileys, Business API).
   - Conexión con el endpoint del servidor usando `fetch` o `axios` y useEffect.
3. **IA & Agentes (`AIAgents.tsx`):**
   - Tarjetas de ecosistema (OpenAI, Dify, etc.).
   - **Modal de Configuración:** Utilizaremos un componente de Modal propio de React o la etiqueta nativa `<dialog>` controlada por el estado de React (`useState`), garantizando un centrado perfecto y animaciones suaves usando Tailwind.
4. **Suscripción (`Billing.tsx`):**
   - Planes y progreso de uso.

---

## 🔌 Fase 4: Integración con el Backend (Evolution API)

1. **Proxy de Vite (Modo Desarrollo):**
   - Configurar `vite.config.ts` para que todas las peticiones a `/api` o `/instance` se redirijan automáticamente al servidor de Express (`localhost:8080`). Esto evita problemas de CORS.
2. **Despliegue de Producción:**
   - Al ejecutar `npm run build` en el frontend, se generará una carpeta `/frontend/dist`.
   - Configuraremos el archivo `src/main.ts` (Backend) para que sirva estáticamente la carpeta `dist` del frontend en lugar de la actual carpeta `public`.

---

## 📝 Próximos Pasos (Acción Requerida)

Si apruebas este plan, procederé inmediatamente a:
1. Detener el servidor actual.
2. Crear la carpeta `/frontend` e instalar React, Vite y Tailwind.
3. Iniciar la migración del Layout principal.

**¿Estás de acuerdo con iniciar la Fase 1?**
