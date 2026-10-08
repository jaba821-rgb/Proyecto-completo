import { useEffect, useState } from "react";
import {
  actualizarTransaccion,
  crearTransaccion,
  eliminarTransaccion,
  obtenerTransacciones,
} from "../api/transacciones";

const FORMULARIO_VACIO = { codigo: "", tipo: "CREDITO", monto: "", impacto: "" };

function Transacciones() {
  const [transacciones, setTransacciones] = useState([]);
  const [formulario, setFormulario] = useState(FORMULARIO_VACIO);
  const [editandoId, setEditandoId] = useState(null);
  const [error, setError] = useState("");

  async function cargarTransacciones() {
    const datos = await obtenerTransacciones();
    setTransacciones(datos);
  }

  useEffect(() => {
    cargarTransacciones();
  }, []);

  function manejarCambio(evento) {
    const { name, value } = evento.target;
    setFormulario((anterior) => ({ ...anterior, [name]: value }));
  }

  function editar(transaccion) {
    setEditandoId(transaccion.id);
    setFormulario({
      codigo: transaccion.codigo,
      tipo: transaccion.tipo,
      monto: transaccion.monto,
      impacto: transaccion.impacto,
    });
  }

  function cancelarEdicion() {
    setEditandoId(null);
    setFormulario(FORMULARIO_VACIO);
  }

  async function eliminar(id) {
    await eliminarTransaccion(id);
    await cargarTransacciones();
  }

  async function enviarFormulario(evento) {
    evento.preventDefault();
    setError("");

    const datos = {
      codigo: formulario.codigo,
      tipo: formulario.tipo,
      monto: Number(formulario.monto),
      impacto: Number(formulario.impacto),
    };

    const respuesta = editandoId
      ? await actualizarTransaccion(editandoId, datos)
      : await crearTransaccion(datos);

    if (respuesta.error) {
      setError(respuesta.error);
      return;
    }

    cancelarEdicion();
    await cargarTransacciones();
  }

  return (
    <div className="min-h-screen bg-linear-to-b from-blue-50 to-white px-4 py-10">
      <div className="mx-auto max-w-3xl">
        <div className="flex items-center gap-3">
          <div className="h-10 w-1.5 rounded-full bg-blue-600" />
          <div>
            <h1 className="text-2xl font-semibold text-blue-950">
              CRUD de Transacciones
            </h1>
            <p className="text-sm text-blue-600/70">
              Frontend (React + Vite + Tailwind) hablando con (Flask) por HTTP/JSON.
            </p>
          </div>
        </div>

        <form
          onSubmit={enviarFormulario}
          className="mt-6 grid grid-cols-2 gap-4 rounded-xl border border-blue-100 bg-white p-6 shadow-md shadow-blue-900/5"
        >
          <div>
            <label className="block text-sm font-medium text-blue-950">Código</label>
            <input
              name="codigo"
              value={formulario.codigo}
              onChange={manejarCambio}
              placeholder="T005"
              required
              className="mt-1 w-full rounded-md border border-blue-200 px-3 py-2 text-sm text-blue-950 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-blue-950">Tipo</label>
            <select
              name="tipo"
              value={formulario.tipo}
              onChange={manejarCambio}
              className="mt-1 w-full rounded-md border border-blue-200 px-3 py-2 text-sm text-blue-950 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            >
              <option value="CREDITO">CREDITO</option>
              <option value="DEBITO">DEBITO</option>
              <option value="TRANSFERENCIA">TRANSFERENCIA</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-blue-950">Monto</label>
            <input
              name="monto"
              type="number"
              value={formulario.monto}
              onChange={manejarCambio}
              required
              className="mt-1 w-full rounded-md border border-blue-200 px-3 py-2 text-sm text-blue-950 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-blue-950">Impacto</label>
            <input
              name="impacto"
              type="number"
              step="0.01"
              value={formulario.impacto}
              onChange={manejarCambio}
              required
              className="mt-1 w-full rounded-md border border-blue-200 px-3 py-2 text-sm text-blue-950 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>

          {error && (
            <p className="col-span-2 rounded-md bg-red-50 px-3 py-2 text-sm font-medium text-red-600">
              {error}
            </p>
          )}

          <div className="col-span-2 flex gap-2">
            <button
              type="submit"
              className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700"
            >
              {editandoId ? "Guardar cambios" : "Crear transacción"}
            </button>
            {editandoId && (
              <button
                type="button"
                onClick={cancelarEdicion}
                className="rounded-md bg-blue-50 px-4 py-2 text-sm font-medium text-blue-700 hover:bg-blue-100"
              >
                Cancelar
              </button>
            )}
          </div>
        </form>

        <table className="mt-8 w-full overflow-hidden rounded-xl border border-blue-100 bg-white shadow-md shadow-blue-900/5">
          <thead className="bg-blue-700 text-left text-sm text-white">
            <tr>
              <th className="px-4 py-3 font-medium">Código</th>
              <th className="px-4 py-3 font-medium">Tipo</th>
              <th className="px-4 py-3 font-medium">Monto</th>
              <th className="px-4 py-3 font-medium">Impacto</th>
              <th className="px-4 py-3 font-medium">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {transacciones.map((transaccion) => (
              <tr
                key={transaccion.id}
                className="border-t border-blue-50 text-sm text-blue-950 hover:bg-blue-50/60"
              >
                <td className="px-4 py-2 font-medium">{transaccion.codigo}</td>
                <td className="px-4 py-2">
                  <span
                    className={
                      transaccion.tipo === "CREDITO"
                        ? "rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700"
                        : "rounded-full bg-sky-100 px-2 py-0.5 text-xs font-medium text-sky-700"
                    }
                  >
                    {transaccion.tipo}
                  </span>
                </td>
                <td className="px-4 py-2">{transaccion.monto}</td>
                <td className="px-4 py-2">{transaccion.impacto}</td>
                <td className="px-4 py-2">
                  <button
                    onClick={() => editar(transaccion)}
                    className="mr-3 font-medium text-blue-600 hover:text-blue-800 hover:underline"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => eliminar(transaccion.id)}
                    className="font-medium text-red-500 hover:text-red-700 hover:underline"
                  >
                    Eliminar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default Transacciones;
