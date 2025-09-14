## Requerimiento: Manejo de Variantes de Productos en Cotizaciones

Al momento de **cotizar un producto**, el sistema debe mostrar no solo el producto principal, sino también sus **variantes**, para que el usuario pueda seleccionar una de ellas.  

### Esquema de la colección `productos` en MongoDB

Cada producto debe tener un campo `variantes` que almacene un arreglo de objetos con los datos de cada variante, por ejemplo:  


{
  "_id": "68c5d55b7ea40e3aa2a49086",
  "name": "KIT PARA REPARACIÓN DE FUGAS CON PRESION",
  "description": "Reparación",
  "variantes": [
    {
      "codigo": "SPU0612",
      "descripcion": "Kit de reparación 15cm",
      "precio": 190,
      "unidad": "KIT"
    },
    {
      "codigo": "SPU0412",
      "descripcion": "Kit de reparación 15cm",
      "precio": 320,
      "unidad": "KIT"
    }
  ]
}

### Modelo en Mongoose

import mongoose from "mongoose";

const VarianteSchema = new mongoose.Schema({
  codigo: { type: String, required: true },
  descripcion: { type: String, required: true },
  precio: { type: Number, required: true },
  unidad: { type: String, required: true }
});

const ProductoSchema = new mongoose.Schema({
  nombre: { type: String, required: true },
  categoria: { type: String },
  variantes: [VarianteSchema]
});

export default mongoose.model("Producto", ProductoSchema);
Flujo en el Frontend (Next.js)

### Cuando el usuario busque un producto en el formulario de cotización, el sistema debe:

Mostrar un menú desplegable o modal con las variantes disponibles.
Permitir al usuario elegir una variante.
Al seleccionar la variante:
Se debe insertar en la tabla de ítems de la cotización la información de esa variante (código, descripción, precio, unidad).

### Guardado en Cotizaciones
El backend debe aceptar y guardar en la colección cotizaciones la información de la variante seleccionada, no solo del producto padre.
Esto garantiza que la cotización siempre apunte a una versión específica del producto.