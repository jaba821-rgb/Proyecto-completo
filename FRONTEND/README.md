# FRONTEND — React + Vite + Tailwind CSS

Esta es una aplicación **independiente**. No sabe que existe Python, Flask ni Prisma: solo sabe
hacer peticiones HTTP a `http://localhost:5000` y dibujar lo que reciba. Se enciende sola, con
sus propios comandos, en un puerto distinto al del backend.

---

## ¿Por qué Node.js?

React, Vite y Tailwind son herramientas que corren sobre **Node.js** (un motor para ejecutar
JavaScript fuera del navegador). `npm` (Node Package Manager) es el instalador de paquetes que
viene incluido con Node — es el "pip" del mundo JavaScript.

### Instalar Node.js

1. Entra a <https://nodejs.org/> y descarga la versión **LTS** (la recomendada, más estable).
2. Instala con las opciones por defecto (siguiente, siguiente, siguiente).
3. Verifica que quedó instalado abriendo una terminal nueva:

   ```powershell
   node -v
   npm -v
   ```

   Deberías ver un número de versión en cada comando (por ejemplo `v22.x.x` y `10.x.x`).

---

## Estructura de carpetas (lo más simple posible)

```
FRONTEND/
├── index.html            # La única página HTML; React "monta" la app adentro
├── package.json           # Lista de dependencias y comandos (equivalente a requirements.txt)
├── vite.config.js          # Configuración de Vite (incluye el plugin de Tailwind)
└── src/
    ├── main.jsx            # Punto de entrada: monta <App /> dentro del HTML
    ├── App.jsx             # Componente raíz: por ahora solo muestra la página de Transacciones
    ├── index.css           # Un solo import: @import "tailwindcss";
    ├── api/
    │   └── transacciones.js   # Todas las llamadas fetch() al backend, en un solo lugar
    └── pages/
        └── Transacciones.jsx  # La única "página": tabla + formulario del CRUD completo
```

**El paralelismo con el backend** (para que se les quede grabado en clase):

| Backend (Flask) | Frontend (React) | Rol |
|---|---|---|
| `routes/` | `api/` | El punto de contacto con "el otro lado" (URLs / fetch) |
| `controllers/` | `pages/` | Qué hacer con los datos y qué mostrar |
| `models/` (habla con Prisma) | — | No aplica: el frontend nunca toca la base de datos directamente |

Como el CRUD es de **una sola tabla** (`Transaccion`), hay una sola página. Si más adelante se
agregan más tablas, cada una tendría su propio archivo en `pages/` y su propio archivo en `api/`.

---

## Instalación y ejecución

Parado **dentro de la carpeta `FRONTEND`**:

```powershell
cd "MisProyectosPython\Proyecto_Completo\FRONTEND"
npm install
npm run dev
```

`npm install` lee `package.json` y descarga las dependencias (React, Vite, Tailwind) a la carpeta
`node_modules/` (no se sube a git — por eso pesa "cero" en el repositorio). `npm run dev` levanta
el servidor de desarrollo, normalmente en <http://localhost:5173>.

> ⚠️ Para que la pantalla realmente muestre datos, el **backend** debe estar corriendo en el
> puerto 5000 (ver [`../BACKEND/README.md`](../BACKEND/README.md)) y el contenedor Docker
> `empresa` encendido. El frontend no arranca la base de datos ni el backend por su cuenta.

---

## Resumen rápido (copiar y pegar)

```powershell
cd "MisProyectosPython\Proyecto_Completo\FRONTEND"
npm install
npm run dev
```

Abre <http://localhost:5173> en el navegador.

---

## ¿Qué hace `pages/Transacciones.jsx`?

1. Al cargar la página, pide la lista de transacciones al backend (`obtenerTransacciones()`) y
   las pinta en una tabla.
2. El formulario de arriba crea una transacción nueva (`crearTransaccion`) o, si se presionó
   "Editar" en una fila, actualiza esa transacción (`actualizarTransaccion`).
3. El botón "Eliminar" de cada fila llama a `eliminarTransaccion(id)`.
4. Si el backend responde con un error (por ejemplo, `monto` negativo — la misma validación que
   vimos en la Semana 3 y en la Semana 4), se muestra en rojo debajo del formulario.

Todo el CRUD vive en un solo archivo a propósito, para que en clase se pueda seguir el flujo de
datos de principio a fin sin saltar entre muchos componentes.
