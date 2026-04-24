# Prueba: Mensajes de Lista (Catálogo Virtual)

Esta prueba permite enviar un menú interactivo a los clientes, ideal para mostrar categorías de productos o servicios en una tienda virtual.

## 🚀 Detalles de la Petición

- **Endpoint:** `POST /message/sendList`
- **Autenticación:** Requiere `apikey` global en el header.

### Estructura del JSON (Ejemplo Tienda)

```json
{
  "number": "57XXXXXXXXXX",
  "options": {
    "title": "🏪 Mi Tienda Virtual",
    "description": "Selecciona una categoría para ver nuestros productos:",
    "buttonText": "Ver Catálogo",
    "footerText": "Mente en Equilibrio",
    "sections": [
      {
        "title": "Categorías Principales",
        "rows": [
          { 
            "title": "📚 Libros Digitales", 
            "description": "Guías de meditación y psicología", 
            "rowId": "cat_1" 
          },
          { 
            "title": "🧘 Cursos Online", 
            "description": "Aprende a controlar la ansiedad", 
            "rowId": "cat_2" 
          }
        ]
      },
      {
        "title": "Ayuda",
        "rows": [
          { 
            "title": "💬 Hablar con Soporte", 
            "description": "Atención personalizada", 
            "rowId": "soporte" 
          }
        ]
      }
    ]
  }
}
```

## 🎯 Resultado Esperado
El cliente recibirá un mensaje con un botón. Al presionarlo, se desplegará una lista elegante con las opciones configuradas. Es la forma más eficiente de guiar al usuario sin que tenga que escribir comandos.
