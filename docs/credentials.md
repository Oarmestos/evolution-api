# Credenciales del Sistema - Avri

Este archivo contiene la información necesaria para acceder y gestionar tu instancia local de Avri API.

> [!IMPORTANT]
> Mantén este archivo en un lugar seguro. No compartas la API Key ni la contraseña de la base de datos con personas no autorizadas.

## 🌐 Acceso al Servidor
- **URL Base de la API:** `http://localhost:8080`
- **Panel de Control (Manager):** `http://localhost:8080/manager`
- **Documentación Interactiva (Swagger):** `http://localhost:8080/docs`

## 🔑 Seguridad y Autenticación
- **Global API Key:** `429683C4C977415CAAFCCE10F7D57E11`
  *(Esta es la clave que debes poner en Swagger en el botón "Authorize" o en el Login del Manager)*.

## 🐘 Base de Datos (PostgreSQL)
- **Host:** `localhost`
- **Puerto:** `5432`
- **Usuario:** `postgres`
- **Contraseña:** `admin123`
- **Nombre de la BD:** `avri_db`

## 🌐 Portal SaaS (Nuevo)
- **URL de Inicio:** `http://localhost:8080/index.html`
- **URL de Login:** `http://localhost:8080/login.html`
- **URL de Dashboard:** `http://localhost:8080/dashboard.html`

## 🔐 Cuenta Super-Administrador
- **Email:** `owner@evolution.com`
- **Contraseña:** `owner123`
- **Rol:** Acceso Total (Multi-tenant Admin).

## 📊 Dashboard y Métricas (Infraestructura)
- **Endpoint de Métricas:** `http://localhost:8080/metrics`
- **Usuario:** `owner`
- **Contraseña:** `owner123`

## 📲 Instancias de WhatsApp
- **Aislamiento:** Ahora las instancias están vinculadas a un `userId`.
- **Manager Técnico:** Sigue disponible en `/manager` para configuraciones avanzadas del administrador.
