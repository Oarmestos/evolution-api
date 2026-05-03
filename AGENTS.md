# Evolution API - Guías para Agentes de IA

Este documento proporciona pautas completas para los agentes de IA (Claude, GPT, Cursor, etc.) que trabajan con el código base de Evolution API.

## Descripción General del Proyecto

**Evolution API** es una plataforma de API de WhatsApp multi-inquilino (multi-tenant) lista para producción, construida con Node.js, TypeScript y Express.js. Soporta múltiples proveedores de WhatsApp e integraciones extensas con chatbots, sistemas CRM y plataformas de mensajería.

## Estructura del Proyecto y Organización de Módulos

### Directorios Principales
- **`src/`** – Código fuente TypeScript con arquitectura modular
  - `api/controllers/` – Manejadores de rutas HTTP (capa delgada)
  - `api/services/` – Lógica de negocio (funcionalidad principal)
  - `api/routes/` – Definiciones de rutas Express (patrón RouterBroker)
  - `api/integrations/` – Integraciones con servicios externos
    - `channel/` – Proveedores de WhatsApp (Baileys, Business API, Evolution)
    - `chatbot/` – Integraciones de IA/Bot (OpenAI, Dify, Typebot, Chatwoot)
    - `event/` – Sistemas de eventos (WebSocket, RabbitMQ, SQS, NATS, Pusher)
    - `storage/` – Almacenamiento de archivos (S3, MinIO)
  - `dto/` – Objetos de Transferencia de Datos (clases simples, sin decoradores)
  - `guards/` – Middleware de autenticación/autorización
  - `types/` – Definiciones de tipos TypeScript
  - `repository/` – Capa de acceso a datos (Prisma)
- **`prisma/`** – Esquemas de base de datos y migraciones
  - `postgresql-schema.prisma` / `mysql-schema.prisma` – Esquemas específicos por proveedor
  - `postgresql-migrations/` / `mysql-migrations/` – Migraciones específicas por proveedor
- **`config/`** – Configuración del entorno y de la aplicación
- **`utils/`** – Utilidades compartidas y funciones auxiliares
- **`validate/`** – Esquemas de validación JSONSchema7
- **`exceptions/`** – Clases personalizadas de excepciones HTTP
- **`cache/`** – Implementaciones de caché en Redis y local

### Construcción y Despliegue
- **`dist/`** – Salida de construcción (no editar directamente)
- **`public/`** – Activos estáticos y archivos multimedia
- **`Docker*`**, **`docker-compose*.yaml`** – Contenedorización y stack de desarrollo local

## Comandos de Construcción, Prueba y Desarrollo

### Flujo de Desarrollo
```bash
# Servidor de desarrollo con hot reload
npm run dev:server

# Ejecución directa para pruebas
npm start

# Construcción de producción y ejecución
npm run build
npm run start:prod
```

### Calidad del Código
```bash
# Linting y formateo
npm run lint        # ESLint con auto-fix
npm run lint:check  # Solo verificación de ESLint

# Commit con commits convencionales
npm run commit      # Commit interactivo con Commitizen
```

### Gestión de Base de Datos
```bash
# Establecer el proveedor de base de datos primero (CRÍTICO)
export DATABASE_PROVIDER=postgresql  # o mysql

# Generar cliente Prisma
npm run db:generate

# Migraciones de desarrollo (con sincronización de proveedor)
npm run db:migrate:dev      # Unix/Mac
npm run db:migrate:dev:win  # Windows

# Despliegue en producción
npm run db:deploy      # Unix/Mac
npm run db:deploy:win  # Windows

# Herramientas de base de datos
npm run db:studio      # Abrir Prisma Studio
```

### Desarrollo con Docker
```bash
# Iniciar servicios locales (Redis, PostgreSQL, etc.)
docker-compose up -d

# Stack de desarrollo completo
docker-compose -f docker-compose.dev.yaml up -d
```

## Estándares de Codificación y Patrones de Arquitectura

### Estilo de Código (Aplicado por ESLint + Prettier)
- **Modo estricto de TypeScript** con cobertura completa de tipos
- **Sangría de 2 espacios**, comillas simples, comas finales
- **Límite de línea de 120 caracteres**
- **Orden de importación** mediante `simple-import-sort`
- **Nombramiento de archivos**: `feature.kind.ts` (ej., `whatsapp.baileys.service.ts`)
- **Convenciones de nombres**:
  - Clases: `PascalCase`
  - Funciones/variables: `camelCase`
  - Constantes: `UPPER_SNAKE_CASE`
  - Archivos: `kebab-case.type.ts`

### Patrones de Arquitectura

#### Patrón de Capa de Servicio
```typescript
export class ExampleService {
  constructor(private readonly waMonitor: WAMonitoringService) {}
  
  private readonly logger = new Logger('ExampleService');
  
  public async create(instance: InstanceDto, data: ExampleDto) {
    // Lógica de negocio aquí
    return { example: { ...instance, data } };
  }
  
  public async find(instance: InstanceDto): Promise<ExampleDto | null> {
    try {
      const result = await this.waMonitor.waInstances[instance.instanceName].findData();
      return result || null; // Retornar null si no se encuentra (patrón Evolution)
    } catch (error) {
      this.logger.error('Error al buscar datos:', error);
      return null; // Retornar null en caso de error (patrón Evolution)
    }
  }
}
```

#### Patrón de Controlador (Capa Delgada)
```typescript
export class ExampleController {
  constructor(private readonly exampleService: ExampleService) {}
  
  public async createExample(instance: InstanceDto, data: ExampleDto) {
    return this.exampleService.create(instance, data);
  }
}
```

#### Patrón RouterBroker
```typescript
export class ExampleRouter extends RouterBroker {
  constructor(...guards: any[]) {
    super();
    this.router.post(this.routerPath('create'), ...guards, async (req, res) => {
      const response = await this.dataValidate<ExampleDto>({
        request: req,
        schema: exampleSchema, // JSONSchema7
        ClassRef: ExampleDto,
        execute: (instance, data) => controller.createExample(instance, data),
      });
      res.status(201).json(response);
    });
  }
}
```

#### Patrón DTO (Clases Simples)
```typescript
// CORRECTO - Patrón Evolution API (sin decoradores)
export class ExampleDto {
  name: string;
  description?: string;
  enabled: boolean;
}

// INCORRECTO - No usar decoradores de class-validator
export class BadExampleDto {
  @IsString() // ❌ Evolution API no usa decoradores
  name: string;
}
```

#### Patrón de Validación (JSONSchema7)
```typescript
import { JSONSchema7 } from 'json-schema';
import { v4 } from 'uuid';

export const exampleSchema: JSONSchema7 = {
  $id: v4(),
  type: 'object',
  properties: {
    name: { type: 'string' },
    description: { type: 'string' },
    enabled: { type: 'boolean' },
  },
  required: ['name', 'enabled'],
};
```

## Arquitectura Multi-Inquilino (Multi-Tenant)

### Aislamiento de Instancias
- **CRÍTICO**: Todas las operaciones deben estar restringidas por `instanceName` o `instanceId`
- **Consultas a la base de datos**: Incluir siempre `where: { instanceId: ... }`
- **Autenticación**: Validar la propiedad de la instancia antes de las operaciones
- **Aislamiento de datos**: Separación completa entre instancias de inquilinos

### Gestión de Instancias de WhatsApp
```typescript
// Acceder a la instancia a través de WAMonitoringService
const waInstance = this.waMonitor.waInstances[instance.instanceName];
if (!waInstance) {
  throw new NotFoundException(`Instancia ${instance.instanceName} no encontrada`);
}
```

## Patrones de Base de Datos

### Soporte Multi-Proveedor
- **PostgreSQL**: Usa `@db.Integer`, `@db.JsonB`, `@default(now())`
- **MySQL**: Usa `@db.Int`, `@db.Json`, `@default(now())`
- **Entorno**: Configurar `DATABASE_PROVIDER=postgresql` o `mysql`
- **Migraciones**: Carpetas específicas por proveedor auto-seleccionadas

### Patrón de Repositorio Prisma
```typescript
// Usar siempre PrismaRepository para operaciones de base de datos
const result = await this.prismaRepository.instance.findUnique({
  where: { name: instanceName },
});
```

## Patrones de Integración

### Integración de Canales (Proveedores de WhatsApp)
- **Baileys**: WhatsApp Web con autenticación por código QR
- **Business API**: WhatsApp Business API oficial de Meta
- **Evolution API**: Integración personalizada de WhatsApp
- **Patrón**: Extender las clases base de servicio de canal

### Integración de Chatbot
- **Clases base**: Extender `BaseChatbotService` y `BaseChatbotController`
- **Sistema de disparadores**: Soporte para palabras clave, regex y disparadores avanzados
- **Gestión de sesiones**: Manejar el estado de la conversación por usuario
- **Integraciones disponibles**: EvolutionBot, OpenAI, Dify, Typebot, Chatwoot, Flowise, N8N, EvoAI

### Integración de Eventos
- **Eventos internos**: EventEmitter2 para eventos de la aplicación
- **Eventos externos**: WebSocket, RabbitMQ, SQS, NATS, Pusher
- **Entrega de webhooks**: Entrega confiable con lógica de reintento

## Guías de Pruebas

### Estado Actual
- **Sin suite de pruebas formal** implementada actualmente
- **Pruebas manuales** son el enfoque principal
- **Pruebas de integración** en el entorno de desarrollo

### Estrategia de Pruebas
```typescript
// Colocar pruebas en el directorio test/ como *.test.ts
// Ejecutar: npm test (monitorea test/all.test.ts)

describe('ExampleService', () => {
  it('debería crear un ejemplo', async () => {
    // Simular dependencias externas
    // Probar lógica de negocio
    // Asegurar el comportamiento esperado
  });
});
```

### Enfoque Recomendado
- Centrarse en la **lógica de negocio crítica** en los servicios
- **Simular dependencias externas** (APIs de WhatsApp, bases de datos)
- **Pruebas de integración** para los endpoints de la API
- **Pruebas manuales** para los flujos de conexión de WhatsApp

## Guías de Commit y Pull Request

### Commits Convencionales (Aplicados por commitlint)
```bash
# Usar herramienta interactiva de commit
npm run commit

# Formato del commit: tipo(alcance): asunto (máx 100 caracteres)
# Tipos: feat, fix, docs, style, refactor, perf, test, chore, ci, build, revert, security
```

### Ejemplos
- `feat(api): agregar endpoint de estado de mensaje de WhatsApp`
- `fix(baileys): resolver problema de tiempo de espera de conexión`
- `docs(readme): actualizar instrucciones de instalación`
- `refactor(service): extraer lógica común de validación de mensajes`

### Requisitos de Pull Request
- **Descripción clara** de los cambios y la motivación
- **Issues vinculados** si aplica
- **Impacto en la migración** (especificar proveedor de base de datos)
- **Pasos de prueba local** con capturas de pantalla/logs
- **Cambios disruptivos** claramente documentados

## Seguridad y Configuración

### Configuración del Entorno
```bash
# Copiar archivo de ejemplo de entorno
cp .env.example .env

# NUNCA subir secretos al control de versiones
# Establecer DATABASE_PROVIDER antes de los comandos de base de datos
export DATABASE_PROVIDER=postgresql  # o mysql
```

### Mejores Prácticas de Seguridad
- **Autenticación por clave de API** a través del encabezado `apikey`
- **Validación de entrada** con JSONSchema7
- **Limitación de tasa** en todos los endpoints
- **Validación de firma de webhook**
- **Control de acceso basado en instancias**
- **Valores predeterminados seguros** para todas las configuraciones

### Reporte de Vulnerabilidades
- Ver `SECURITY.md` para el proceso de reporte de vulnerabilidades de seguridad
- Contacto: `contato@evolution-api.com`

## Estándares de Comunicación

### Requisitos de Idioma
- **Comunicación con el usuario**: Responder siempre en **Español**
- **Código/comentarios**: Inglés para documentación técnica
- **Respuestas de la API**: Inglés para consistencia
- **Mensajes de error**: Español para errores de cara al usuario

### Estándares de Documentación
- **Comentarios en línea**: Documentar lógica de negocio compleja
- **Documentación de la API**: Documentar todos los endpoints públicos
- **Guías de integración**: Documentar nuevos patrones de integración
- **Guías de migración**: Documentar cambios en el esquema de la base de datos

## Rendimiento y Escalabilidad

### Estrategia de Caché
- **Redis primario**: Caché distribuido para producción
- **Node-cache de respaldo**: Caché local cuando Redis no está disponible
- **Estrategia TTL**: Expiración de caché adecuada por tipo de dato
- **Invalidación de caché**: Invalidación adecuada ante cambios en los datos

### Gestión de Conexiones
- **Base de datos**: Agrupación de conexiones Prisma (pooling)
- **WhatsApp**: Una conexión por instancia con gestión del ciclo de vida
- **Redis**: Agrupación de conexiones y lógica de reintento
- **APIs externas**: Limitación de tasa y reintento con retroceso exponencial

### Monitoreo y Observabilidad
- **Registro estructurado**: Registrador Pino con IDs de correlación
- **Seguimiento de errores**: Escenarios de error exhaustivos
- **Verificaciones de salud**: Estado de la instancia y monitoreo de conexión
- **Telemetría**: Análisis de uso (solo datos no sensibles)
