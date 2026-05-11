# Clean Code Architecture & Modularization

Esta skill define las reglas estrictas de modularización y limpieza de código para el proyecto Evolution API, garantizando que el código sea escalable, legible y fácil de mantener por agentes de IA y desarrolladores humanos.

## Regla de Oro: El Límite de las 500 Líneas

**Cualquier archivo que supere las 500 líneas de código DEBE ser refactorizado inmediatamente.** No hay excepciones.

### Pautas de Aplicación:
1.  **Monitoreo Proactivo**: Al abrir un archivo, verifica siempre su longitud total.
2.  **Umbral de Alerta**: Si un archivo alcanza las 450 líneas, no agregues más lógica en él; en su lugar, identifica componentes o funciones que puedan ser extraídos.
3.  **Refactorización Atómica**: Al dividir un archivo, sigue estos patrones:
    *   **Componentes de UI**: Si es un archivo de React, extrae sub-componentes a archivos individuales (ej: `BlockLibrary.tsx`, `AtomicComponents.tsx`).
    *   **Lógica de Negocio**: Extrae funciones complejas a archivos de utilidad (`utils/`) o servicios (`services/`).
    *   **Estado Complejo**: Mueve la lógica de estado a Custom Hooks (`useFeature.ts`).
    *   **Tipos y Enums**: Si el archivo contiene muchas definiciones de tipos, muévelas a un archivo `.types.ts` o `types/`.

## Estándares de Refactorización

Cuando realices una división de archivos para cumplir con el límite de líneas:
- **Mantener Nombres Claros**: El archivo principal debe actuar como orquestador, importando las piezas desglosadas.
- **Exportaciones Nombradas**: Usa exportaciones nombradas (`export const ...`) para facilitar la trazabilidad.
- **Preservar Contexto**: Asegúrate de que los JSDocs y comentarios de lógica compleja se muevan junto con el código extraído.

## Verificación
Antes de dar por terminada una tarea, valida que ninguno de los archivos creados o modificados exceda el límite establecido. Si un archivo está cerca del límite, advierte al usuario y propone una estrategia de división adicional.
