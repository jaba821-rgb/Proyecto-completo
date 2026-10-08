# Reporte de cambios — CRUD de Transacciones

**Autor:** Javier Berrocal
**Proyecto base:** CRUD de Transacciones (Flask + Prisma / React + Vite + Tailwind), entregado por el profesor.
**Objetivo:** hacer mejoras pequeñas de diseño y de funcionamiento, manteniendo la arquitectura original en capas (`routes → controllers → models`).

---

## 1. Resumen

| # | Capa | Cambio | Tipo |
|---|------|--------|------|
| 1 | Backend · controller | Validación centralizada en una sola función `validar_datos` | Funcionamiento / diseño de código |
| 2 | Backend · controller + model | Detección de código duplicado (respuesta 409) | Funcionamiento |
| 3 | Backend · controller | 404 al editar o eliminar algo que no existe; 500 para errores internos | Funcionamiento |
| 4 | Backend · controller + route | Nuevo endpoint `GET /api/transacciones/resumen` | Funcionamiento |
| 5 | Backend · app | Errores 404/405 en JSON en lugar de HTML | Funcionamiento |
| 6 | Frontend · api | Función única `peticion()` que maneja los errores | Diseño de código |
| 7 | Frontend · componentes | Tarjetas de resumen (total, créditos, débitos, transferencias) | Diseño visual |
| 8 | Frontend · página | Búsqueda por código y filtro por tipo | Funcionamiento |
| 9 | Frontend · página | Confirmación antes de eliminar | Funcionamiento / UX |
| 10 | Frontend · página | Estados de carga, de envío, de éxito y de lista vacía | UX |
| 11 | Frontend · página | Montos en pesos colombianos, un color por tipo, fila en edición resaltada, diseño adaptable a celular | Diseño visual |

---

## 2. Cambios en el backend

### 2.1 Validación centralizada (`controllers/transaccion_controller.py`)

**Antes:** `crear_transaccion` y `actualizar_transaccion` repetían la misma línea y solo revisaban que el monto no fuera negativo:

```python
if datos.get("monto", 0) < 0:
    return {"error": "El monto no puede ser negativo"}, 400
```

Esto tenía varios problemas:

- Si faltaba `codigo` o `tipo`, el error llegaba desde Prisma con un mensaje técnico.
- Se podía guardar cualquier texto como `tipo` (por ejemplo `"HOLA"`).
- Si `monto` llegaba como texto, la comparación `< 0` generaba una excepción.
- El cliente podía mandar campos extra, como `id`, y se pasaban directo a la base de datos.

**Ahora:** existe una función `validar_datos(datos)` que devuelve una tupla `(datos_limpios, error)` y que hace lo siguiente:

1. Verifica que el cuerpo sea un JSON (un diccionario).
2. Lista los campos obligatorios que faltan.
3. Normaliza los datos: quita espacios y pasa `codigo` y `tipo` a mayúsculas.
4. Comprueba que `tipo` pertenezca a `TIPOS_VALIDOS`.
5. Comprueba que `monto` sea un **entero mayor que cero** (una transacción de $0 no tiene sentido) y que `impacto` sea numérico.
6. Construye un diccionario nuevo **solo con los 4 campos permitidos** (lista blanca).

**Conceptos aplicados:**

- **DRY (*Don't Repeat Yourself*):** la regla se escribe una sola vez y la usan crear y actualizar.
- **Encapsulación:** es la misma idea del *setter* de POO, que protege al objeto de recibir valores inválidos, pero aplicada a la capa de lógica.
- **Constantes de negocio:** `TIPOS_VALIDOS` y `CAMPOS_OBLIGATORIOS` están arriba del archivo. Si aparece un tipo nuevo, solo se cambia allí.
- **Detalle de Python:** `bool` es subclase de `int` (`True == 1`). Por eso la función auxiliar `_es_numero` excluye los booleanos de forma explícita.

### 2.2 Código duplicado → 409 Conflict

En `schema.prisma` el campo `codigo` es `@unique`. Antes, crear un código repetido devolvía el error crudo de Prisma con código 400.

Ahora el modelo tiene `obtener_por_codigo(codigo)` y el controlador lo consulta antes de guardar:

- **Al crear:** si el código ya existe, responde `409 Conflict` con un mensaje claro.
- **Al actualizar:** solo es conflicto si el código pertenece a **otra** transacción (`otra.id != id`). Así se puede guardar una transacción sin cambiarle el código.

### 2.3 Códigos HTTP más precisos

| Situación | Antes | Ahora |
|---|---|---|
| Datos inválidos | 400 | 400 |
| Editar o eliminar un id que no existe | 400 (error de Prisma) | **404** "Transacción no encontrada" |
| Código repetido | 400 (error de Prisma) | **409** |
| Falla inesperada (por ejemplo, la base de datos caída) | 400 con el texto interno del error | **500** con un mensaje genérico; el detalle se imprime en la consola del servidor |

Enviar al cliente el texto interno de una excepción (`str(e)`) puede exponer detalles de la base de datos. Por eso ahora el detalle solo se imprime en el servidor.

### 2.4 Nuevo endpoint `GET /api/transacciones/resumen`

Devuelve estadísticas calculadas en el backend:

```json
{
  "total_transacciones": 4,
  "monto_total": 350000,
  "por_tipo": {
    "CREDITO":       { "cantidad": 2, "monto": 200000 },
    "DEBITO":        { "cantidad": 1, "monto": 100000 },
    "TRANSFERENCIA": { "cantidad": 1, "monto": 50000 }
  }
}
```

Es un ejercicio de **acumuladores**: se recorre la lista una vez y se va sumando en un diccionario por tipo. La ruta `/resumen` no choca con `/<int:id>` porque el convertidor `int` solo acepta números.

### 2.5 Respuestas de error en JSON (`app.py` y `routes`)

- Se agregaron `@app.errorhandler(404)` y `@app.errorhandler(405)`. Antes, una ruta mal escrita devolvía una página HTML; ahora la API siempre responde JSON.
- En las rutas se cambió `request.get_json()` por `request.get_json(silent=True)`. Si el cuerpo no es JSON llega `None`, y el controlador responde con un mensaje claro en lugar de una excepción.

---

## 3. Cambios en el frontend

### 3.1 Capa de API con manejo de errores (`src/api/transacciones.js`)

**Antes:** cada función repetía `fetch` + `respuesta.json()` y nunca revisaba si la respuesta era un error. Si el backend estaba apagado, la aplicación fallaba en silencio y la tabla quedaba vacía.

**Ahora:** una sola función `peticion(ruta, opciones)` hace todas las peticiones:

- Si no hay conexión, lanza `Error("No se pudo conectar con el servidor...")`.
- Si el código HTTP no es 2xx (`!respuesta.ok`), lanza un `Error` con el mensaje que mandó el backend.

Las funciones públicas (`crearTransaccion`, `eliminarTransaccion`, etc.) quedaron de una línea cada una. En la página, todos los errores se atrapan con `try / catch`, igual que el `try / except` del backend.

### 3.2 Componente `TarjetasResumen` (`src/components/TarjetasResumen.jsx`)

Muestra 4 tarjetas encima del formulario con los datos de `/resumen`. Se creó como **componente aparte** (separación de responsabilidades): la página no necesita saber cómo se dibuja una tarjeta, solo le pasa el objeto `resumen`.

### 3.3 Formato de números (`src/utils/formato.js`)

Se usan `Intl.NumberFormat("es-CO")` y dos funciones:

- `formatearMoneda`: muestra el monto como `$ 150.000`.
- `formatearDecimal`: muestra el impacto con 2 decimales.

Los números de la tabla se alinean a la derecha (`text-right tabular-nums`) para compararlos más fácil, y un impacto negativo se muestra en rojo.

### 3.4 Búsqueda y filtro

Hay un campo de texto para buscar por código y un selector de tipo. La lista visible se **calcula** a partir del estado en cada render; no se guarda una segunda copia de los datos:

```js
const transaccionesVisibles = transacciones.filter(
  (t) =>
    (filtroTipo === "TODOS" || t.tipo === filtroTipo) &&
    t.codigo.toLowerCase().includes(busqueda.trim().toLowerCase())
);
```

Es una expresión lógica con `&&` y `||`: una fila se muestra si (el filtro es "TODOS" **o** coincide el tipo) **y** el código contiene el texto buscado.

### 3.5 Confirmación al eliminar

**Antes:** un clic en "Eliminar" borraba el registro de inmediato.

**Ahora:** la fila cambia a "¿Eliminar? Sí / No". Se usa el estado `confirmandoId` para guardar qué fila está pidiendo confirmación, en lugar de la ventana nativa `confirm()` del navegador.

### 3.6 Estados de la interfaz

| Estado | Qué ve el usuario |
|---|---|
| `cargando` | "Cargando transacciones..." mientras llega la primera respuesta |
| Lista vacía | "Aún no hay transacciones..." o "Ninguna coincide con el filtro" |
| `enviando` | El botón dice "Guardando..." y se deshabilita, para evitar envíos dobles |
| `exito` | Mensaje verde ("Transacción T005 creada") que desaparece a los 3 s (`useEffect` + `setTimeout`) |
| `error` | Mensaje rojo con el texto exacto que mandó el backend |

### 3.7 Detalles visuales

- **Un color por tipo:** crédito en verde, débito en rojo y transferencia en azul. Antes débito y transferencia tenían el mismo color. Los colores se guardan en un objeto `ESTILO_TIPO` en lugar de un `if` ternario.
- **Modo edición visible:** el formulario se marca con un borde ámbar y el título "Editando T001", y la fila que se edita también se resalta.
- **Adaptable a celular:** el formulario usa 1 columna en pantallas pequeñas y 2 en grandes (`grid-cols-1 sm:grid-cols-2`), y la tabla tiene desplazamiento horizontal (`overflow-x-auto`).
- **Menos código repetido:** las opciones del `<select>` se generan desde el arreglo `TIPOS`, y las clases de los inputs están en la constante `CLASE_INPUT`.
- **Código en mayúsculas:** el campo código convierte a mayúsculas mientras se escribe.

---

## 4. Archivos modificados o creados

| Archivo | Estado |
|---|---|
| `BACKEND/app.py` | Modificado |
| `BACKEND/routes/transaccion_routes.py` | Modificado |
| `BACKEND/controllers/transaccion_controller.py` | Modificado |
| `BACKEND/models/transaccion_model.py` | Modificado |
| `FRONTEND/src/api/transacciones.js` | Modificado |
| `FRONTEND/src/pages/Transacciones.jsx` | Modificado |
| `FRONTEND/src/components/TarjetasResumen.jsx` | **Nuevo** |
| `FRONTEND/src/utils/formato.js` | **Nuevo** |

No se cambió `schema.prisma`, así que no hace falta volver a ejecutar `prisma db push`.

---

## 5. Pruebas realizadas

- `npm run build`: compila sin errores.
- `npm run lint` (oxlint): sin advertencias.
- Prueba de `validar_datos` con casos límite:

| Entrada | Resultado |
|---|---|
| `None` | "El cuerpo de la petición debe ser un JSON válido" |
| `{}` | "Faltan campos obligatorios: codigo, tipo, monto, impacto" |
| `codigo=" t9 "`, `tipo="credito"` | Se normaliza a `"T9"` / `"CREDITO"` y es válido |
| `tipo="OTRO"` | "Tipo inválido..." |
| `monto=0` | "El monto debe ser mayor que cero" |
| `monto=2.5` | "El monto debe ser un número entero" |
| `monto=True` | "El monto debe ser un número entero" |
| `impacto="x"` | "El impacto debe ser un número" |
| Con un campo extra `id=99` | Se descarta el `id` (lista blanca) |

**Pendiente:** probar con la base de datos encendida (`docker start empresa`) los flujos de crear, editar, eliminar y código duplicado, y el endpoint `/resumen`.

---

## 6. Mejoras propuestas a futuro

1. **Archivo `.env` en el repositorio:** está bien para la clase con la base de datos local, pero en un proyecto real no debe subirse a git. Lo correcto es tener un `.env.example` sin contraseñas.
2. **Modelo `Usuario`:** ya existe en `schema.prisma` pero no tiene rutas. Se podrían crear registro e inicio de sesión con contraseñas cifradas (`bcrypt`).
3. **Pruebas automáticas:** `validar_datos` es una función pura, así que es ideal para pruebas con `pytest`.
4. **Paginación:** el resumen y la lista traen todas las filas; con miles de registros convendría paginar o calcular las sumas en la base de datos.
