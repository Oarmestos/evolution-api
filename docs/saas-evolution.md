# Avri SaaS Evolution - Hoja de Roadmap (Estrategia Multi-tenancy)

Este documento detalla la arquitectura y el plan de transformación de **Avri** en una plataforma SaaS comercial, basada en los principios de aislamiento y privacidad multiusuario.

## 1. Arquitectura Multi-tenancy (Multiusuario)
Siguiendo los estándares de la industria (como Shopify o Slack), implementaremos una arquitectura de **Base de Datos Compartida con Datos de Ámbito Definido (Shared Database with Scoped Data)**.

### ¿Qué significa esto para el usuario?
- **Privacidad Total:** Cada usuario tendrá su propio espacio de trabajo. Los datos del Usuario A están aislados de los del Usuario B mediante una columna `tenant_id` (userId) en todas las tablas críticas.
- **Identidad Propia:** El sistema reconocerá al usuario mediante su login y filtrará automáticamente toda la API para que solo vea **su** información.
- **Escalabilidad:** Un solo servidor podrá atender a cientos de clientes manteniendo la integridad de los datos.

## 2. Componentes Clave del SaaS Avri

### A. Capa de Aislamiento de Datos
- **Base de Datos (Prisma):** Añadiremos modelos de `User`, `Plan` y `Subscription`.
- **Relación 1:N:** Cada instancia de WhatsApp, contacto o mensaje estará vinculado a un `User`.

### B. Autenticación y Seguridad (JWT)
- Eliminaremos la dependencia de una API Key única.
- Cada usuario tendrá su propio par de credenciales.
- Implementaremos **JWT (JSON Web Tokens)** para manejar sesiones seguras y privadas.

### C. Portal de Cliente (SaaS Experience)
- **Login/Registro:** Página de entrada para que nuevos clientes creen su cuenta.
- **Dashboard Privado:** Un panel visualmente atractivo (SaaS Dashboard) que muestre estadísticas solo del usuario logueado.
- **Gestión de Planes:** Control automático de límites según la suscripción (ej. 1 instancia en Plan Básico, 10 en Plan Pro).

## 3. Plan de Ejecución Priorizado

| Fase | Tarea Principal | Garantía de Privacidad |
| :--- | :--- | :--- |
| **Fase 1** | **Estructura Multi-tenant (Prisma)** | Crear tablas de Usuarios y vincular Instancias al `userId`. |
| **Fase 2** | **Capa de Seguridad (Auth)** | Implementar JWT y Guards que bloqueen accesos entre usuarios. |
| **Fase 3** | **Lógica de Suscripciones** | Control de límites de uso por cada "inquilino" (cliente). |
| **Fase 4** | **Frontend SaaS (Portal)** | Interfaz privada para el cliente final con métricas propias. |

---
**Nota:** Con esta estructura, Avri deja de ser una herramienta local para convertirse en una plataforma donde tú eres el dueño de la infraestructura y tus clientes disfrutan de un servicio privado, seguro y profesional.
