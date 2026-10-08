const BASE_URL = "http://localhost:5000/api/transacciones";

export async function obtenerTransacciones() {
  const respuesta = await fetch(`${BASE_URL}/`);
  return respuesta.json();
}

export async function crearTransaccion(datos) {
  const respuesta = await fetch(`${BASE_URL}/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(datos),
  });
  return respuesta.json();
}

export async function actualizarTransaccion(id, datos) {
  const respuesta = await fetch(`${BASE_URL}/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(datos),
  });
  return respuesta.json();
}

export async function eliminarTransaccion(id) {
  const respuesta = await fetch(`${BASE_URL}/${id}`, {
    method: "DELETE",
  });
  return respuesta.json();
}
