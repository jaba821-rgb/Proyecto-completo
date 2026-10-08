const BASE_URL = "http://localhost:5000/api/transacciones";

// Una sola función hace todas las peticiones: si algo falla (servidor apagado o
// respuesta con código de error), lanza un Error con un mensaje legible.
async function peticion(ruta, opciones = {}) {
  let respuesta;
  try {
    respuesta = await fetch(`${BASE_URL}${ruta}`, {
      headers: { "Content-Type": "application/json" },
      ...opciones,
    });
  } catch {
    throw new Error("No se pudo conectar con el servidor. ¿Está encendido el backend?");
  }

  const datos = await respuesta.json().catch(() => ({}));
  if (!respuesta.ok) {
    throw new Error(datos.error || `Error ${respuesta.status}`);
  }
  return datos;
}

export function obtenerTransacciones() {
  return peticion("/");
}

export function obtenerResumen() {
  return peticion("/resumen");
}

export function crearTransaccion(datos) {
  return peticion("/", { method: "POST", body: JSON.stringify(datos) });
}

export function actualizarTransaccion(id, datos) {
  return peticion(`/${id}`, { method: "PUT", body: JSON.stringify(datos) });
}

export function eliminarTransaccion(id) {
  return peticion(`/${id}`, { method: "DELETE" });
}
