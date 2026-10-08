# BACKEND — API en capas (Flask + Prisma)

Este es un servidor **independiente**. No sabe que existe un frontend: solo recibe peticiones
HTTP y responde con JSON. Reutiliza **la misma base de datos MySQL** que creamos en la
[Semana 3 (`Mysql_Prisma`)](../../Semana_3/Mysql_Prisma/README.md): el mismo contenedor Docker
`empresa`, la misma base `empresa_db`, la misma tabla `Transaccion`.

---

## La arquitectura en capas (explicada simple)

Cuando llega una petición, pasa por 3 capas, cada una con **una sola responsabilidad**:

```
routes/          →  controllers/        →  models/
"las puertas"       "el cerebro"            "quien le habla a la base de datos"

¿Qué URL es?        ¿Qué hay que hacer?     Ejecuta el CRUD contra Prisma
¿Qué método HTTP?    ¿Es un dato válido?     (find_many, create, update, delete)
```

1. **`routes/transaccion_routes.py`** — define las URLs (`/api/transacciones/...`) y el método
   HTTP (GET, POST, PUT, DELETE). No tiene lógica: solo recibe la petición y se la pasa al
   controller correcto.
2. **`controllers/transaccion_controller.py`** — tiene la lógica de negocio: valida los datos
   (por ejemplo, que `monto` no sea negativo — el mismo blindaje que vimos en la Semana 3 con el
   *setter* de POO), atrapa errores con `try/except` (igual que en la Semana 4) y decide qué
   código HTTP responder (200 OK, 201 Creado, 400 Error, 404 No encontrado).
3. **`models/transaccion_model.py`** — es la **única** capa que importa el cliente de Prisma
   (`db.py`). Solo sabe hacer CRUD contra la tabla `Transaccion`. Si mañana cambiamos de MySQL a
   otra base de datos, solo se toca este archivo.

`app.py` es el punto de arranque: crea la aplicación Flask, activa CORS (para que el navegador
donde corre el frontend, en otro puerto, pueda llamar a esta API), conecta la base de datos y
registra las rutas.

---

## Endpoints disponibles

| Método | Ruta | Qué hace |
|---|---|---|
| GET | `/api/transacciones/` | Lista todas las transacciones |
| GET | `/api/transacciones/<id>` | Obtiene una transacción por id |
| POST | `/api/transacciones/` | Crea una transacción (body JSON: `codigo`, `tipo`, `monto`, `impacto`) |
| PUT | `/api/transacciones/<id>` | Actualiza una transacción existente |
| DELETE | `/api/transacciones/<id>` | Elimina una transacción |

---

## Requisitos previos

1. **Docker Desktop** instalado y abierto — <https://www.docker.com/products/docker-desktop/>
2. **Python 3** — <https://www.python.org/downloads/>
3. El contenedor `empresa` de la Semana 3 ya debe existir (se creó allá). Si no lo tienes,
   créalo siguiendo el [README de `Mysql_Prisma`](../../Semana_3/Mysql_Prisma/README.md).

---

## Paso 0 — Enciende la base de datos

```powershell
docker start empresa
```

> Espera unos 10-20 segundos: MySQL tarda un poco en estar listo.

---

## Paso 1 — Instala las dependencias de Python

Parado **dentro de la carpeta `BACKEND`**:

```powershell
cd "MisProyectosPython\Proyecto_Completo\BACKEND"
pip install -r requirements.txt
```

> 🛟 ¿Error de permisos (`Failed to write executable`)? Instala a tu usuario:
> ```powershell
> pip install --user -r requirements.txt
> ```

---

## Paso 2 — Sincroniza el esquema y genera el cliente de Prisma

```powershell
prisma db push
```

Como es la **misma base** de la Semana 3, verás *"The database is already in sync with the
Prisma schema"* — es normal, solo está generando el cliente Python para este proyecto.

---

## Paso 3 — Enciende el servidor

```powershell
python app.py
```

Verás algo como `Running on http://127.0.0.1:5000`. Déjalo corriendo en esta terminal — este es
**un servidor aparte**, no depende del frontend para funcionar. Puedes probarlo directamente:

```powershell
curl http://localhost:5000/api/transacciones/
```

Deberías ver las 4 transacciones (`T001`–`T004`) que ya existían desde la Semana 3.

---

## Resumen rápido (copiar y pegar)

```powershell
docker start empresa
cd "MisProyectosPython\Proyecto_Completo\BACKEND"
pip install -r requirements.txt
prisma db push
python app.py
```

---

## Archivos de esta carpeta

| Archivo/carpeta | Para qué sirve |
|---|---|
| `schema.prisma` | Define la conexión a MySQL y la forma de la tabla `Transaccion` (la misma de la Semana 3). |
| `.env` | `DATABASE_URL` — a dónde conectarse (mismo contenedor `empresa`). |
| `db.py` | Crea la única instancia del cliente de Prisma que usa todo el backend. |
| `models/transaccion_model.py` | Capa de datos: CRUD contra la tabla `Transaccion`. |
| `controllers/transaccion_controller.py` | Capa de lógica: validaciones, manejo de errores, códigos de respuesta. |
| `routes/transaccion_routes.py` | Capa de rutas: mapea URLs + métodos HTTP a funciones del controller. |
| `app.py` | Arranca el servidor Flask en el puerto 5000. |

---

## Problemas comunes

- **`Can't reach database server at localhost:3306`:** el contenedor `empresa` no está corriendo.
  Ejecuta `docker start empresa` y espera ~15 segundos.
- **`Environment variable not found: DATABASE_URL`:** corre los comandos **dentro** de la carpeta
  `BACKEND` (donde está el `.env`).
- **`prisma` no se reconoce:** revisa la sección "Problemas comunes" del
  [README de `Mysql_Prisma`](../../Semana_3/Mysql_Prisma/README.md) — es el mismo detalle de PATH.
