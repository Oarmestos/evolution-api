---
name: high-precision-coding
description: Mandatos estrictos para garantizar la integridad estructural (JSX), validación de tipos (DTOs) y limpieza de código en Evolution API.
---

# High Precision Coding Skill

Esta skill es obligatoria para garantizar que cada edición sea perfecta a nivel sintáctico y lógico, eliminando retrasos por errores de compilación o desajustes visuales.

## 1. Integridad de Estructura (JSX/HTML)

- **Regla de Oro**: Tras cada `replace_file_content` o `multi_replace`, debes verificar visualmente el balance de etiquetas.
- **Acción**: Si abres un `div` en la línea 100, asegúrate de que el cierre `</div>` esté presente y no haya sido borrado accidentalmente por el "chunk" de reemplazo.
- **Evitar Duplicados**: Ten especial cuidado con las sentencias `return (`, `export` y `import`. No deben quedar duplicadas tras la edición.

## 2. Validación de Propiedades y Tipos

- **Prohibido Adivinar**: Nunca asumas que una propiedad se llama `id`, `name` o `status`. 
- **Acción Obligatoria**: Antes de usar una propiedad de un objeto (especialmente en DTOs o Services), usa `view_file` para ver su definición exacta.
- **Ejemplo**: Si usas `InstanceDto`, verifica si es `instanceId` o `id`.

## 3. Edición Quirúrgica

- **Minimizar Chunks**: Prefiere realizar varios `replace_file_content` pequeños y precisos en lugar de un `multi_replace` gigante que pueda desalinear las líneas del archivo.
- **Contexto**: Mantén siempre al menos 3 líneas de contexto real en tus `TargetContent` para asegurar que el reemplazo caiga en el lugar exacto.

## 4. Verificación Pre-Entrega

- **Lint Mental**: Lee el código resultante como si fueras el compilador. ¿Falta un `;`? ¿Hay un `)` extra?
- **Comando de Validación**: Si la edición fue compleja, intenta ejecutar `tsc --noEmit` o `npm run lint` específicamente en la carpeta afectada (frontend o backend).

## 5. Criterios de Profesionalismo

- **Sin Placeholders**: No dejes comentarios tipo `// TODO` o `// logic here` a menos que sea una tarea de planeación aprobada.
- **Imports Limpios**: Si eliminas la última referencia a un icono o componente, elimina su `import` inmediatamente.
- **Nomenclatura**: Respeta siempre el patrón `camelCase` para variables y `PascalCase` para clases, siguiendo el `AGENTS.md` del proyecto.

---

*Seguir esta skill garantiza un flujo de trabajo sin fricciones y una plataforma estable.*
