import { useEffect, useState } from "react";
import {
  actualizarTransaccion,
  crearTransaccion,
  eliminarTransaccion,
  obtenerResumen,
  obtenerTransacciones,
} from "../api/transacciones";
import TarjetasResumen from "../components/TarjetasResumen";
import { formatearDecimal, formatearMoneda } from "../utils/formato";

const TIPOS = ["CREDITO", "DEBITO", "TRANSFERENCIA"];

const FORMULARIO_VACIO = { codigo: "", tipo: "CREDITO", monto: "", impacto: "" };

// Un color por tipo: antes DEBITO y TRANSFERENCIA se veían iguales.
const ESTILO_TIPO = {
  CREDITO: "bg-emerald-100 text-emerald-700",
  DEBITO: "bg-rose-100 text-rose-700",
  TRANSFERENCIA: "bg-sky-100 text-sky-700",
};

const CLASE_INPUT =
  "mt-1 w-full rounded-md border border-blue-200 px-3 py-2 text-sm text-blue-950 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100";

function Transacciones() {
  const [transacciones, setTransacciones] = useState([]);
  const [resumen, setResumen] = useState(null);
  const [formulario, setFormulario] = useState(FORMULARIO_VACIO);
  const [editandoId, setEditandoId] = useState(null);
  const [confirmandoId, setConfirmandoId] = useState(null);
  const [filtroTipo, setFiltroTipo] = useState("TODOS");
  const [busqueda, setBusqueda] = useState("");
  const [cargando, setCargando] = useState(true);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState("");
  const [exito, setExito] = useState("");

  async function cargarDatos() {
    try {
      const [lista, datosResumen] = await Promise.all([
        obtenerTransacciones(),
        obtenerResumen(),
      ]);
      setTransacciones(lista);
      setResumen(datosResumen);
    } catch (e) {
      setError(e.message);
    } finally {
      setCargando(false);
    }
  }

  useEffect(() => {
    cargarDatos();
  }, []);

  // El mensaje de éxito desaparece solo a los 3 segundos.
  useEffect(() => {
    if (!exito) return;
    const temporizador = setTimeout(() => setExito(""), 3000);
    return () => clearTimeout(temporizador);
  }, [exito]);

  function manejarCambio(evento) {
    const { name, value } = evento.target;
    const valor = name === "codigo" ? value.toUpperCase() : value;
    setFormulario((anterior) => ({ ...anterior, [name]: valor }));
  }

  function editar(transaccion) {
    setEditandoId(transaccion.id);
    setConfirmandoId(null);
    setError("");
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
    setError("");
    try {
      await eliminarTransaccion(id);
      if (id === editandoId) cancelarEdicion();
      setExito("Transacción eliminada");
      await cargarDatos();
    } catch (e) {
      setError(e.message);
    } finally {
      setConfirmandoId(null);
    }
  }

  async function enviarFormulario(evento) {
    evento.preventDefault();
    setError("");
    setEnviando(true);

    const datos = {
      codigo: formulario.codigo.trim(),
      tipo: formulario.tipo,
      monto: Number(formulario.monto),
      impacto: Number(formulario.impacto),
    };

    try {
      if (editandoId) {
        await actualizarTransaccion(editandoId, datos);
        setExito(`Transacción ${datos.codigo} actualizada`);
      } else {
        await crearTransaccion(datos);
        setExito(`Transacción ${datos.codigo} creada`);
      }
      cancelarEdicion();
      await cargarDatos();
    } catch (e) {
      setError(e.message);
    } finally {
      setEnviando(false);
    }
  }

  // Filtro calculado a partir del estado: no se guarda una segunda lista.
  const transaccionesVisibles = transacciones.filter(
    (t) =>
      (filtroTipo === "TODOS" || t.tipo === filtroTipo) &&
      t.codigo.toLowerCase().includes(busqueda.trim().toLowerCase())
  );

  return (
    <div className="min-h-screen bg-linear-to-b from-blue-50 to-white px-4 py-10">
      <div className="mx-auto max-w-4xl">
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

        <TarjetasResumen resumen={resumen} />

        <form
          onSubmit={enviarFormulario}
          className={`mt-6 grid grid-cols-1 gap-4 rounded-xl border bg-white p-6 shadow-md shadow-blue-900/5 sm:grid-cols-2 ${
            editandoId ? "border-amber-300 ring-2 ring-amber-100" : "border-blue-100"
          }`}
        >
          <h2 className="text-base font-semibold text-blue-950 sm:col-span-2">
            {editandoId ? `Editando ${formulario.codigo}` : "Nueva transacción"}
          </h2>

          <div>
            <label className="block text-sm font-medium text-blue-950">Código</label>
            <input
              name="codigo"
              value={formulario.codigo}
              onChange={manejarCambio}
              placeholder="T005"
              required
              className={CLASE_INPUT}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-blue-950">Tipo</label>
            <select
              name="tipo"
              value={formulario.tipo}
              onChange={manejarCambio}
              className={CLASE_INPUT}
            >
              {TIPOS.map((tipo) => (
                <option key={tipo} value={tipo}>
                  {tipo}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-blue-950">Monto</label>
            <input
              name="monto"
              type="number"
              min="1"
              step="1"
              value={formulario.monto}
              onChange={manejarCambio}
              required
              className={CLASE_INPUT}
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
              className={CLASE_INPUT}
            />
          </div>

          {error && (
            <p className="rounded-md bg-red-50 px-3 py-2 text-sm font-medium text-red-600 sm:col-span-2">
              {error}
            </p>
          )}
          {exito && (
            <p className="rounded-md bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-700 sm:col-span-2">
              {exito}
            </p>
          )}

          <div className="flex gap-2 sm:col-span-2">
            <button
              type="submit"
              disabled={enviando}
              className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {enviando ? "Guardando..." : editandoId ? "Guardar cambios" : "Crear transacción"}
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

        <div className="mt-8 flex flex-wrap gap-3">
          <input
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar por código..."
            className="min-w-0 flex-1 rounded-md border border-blue-200 bg-white px-3 py-2 text-sm text-blue-950 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          />
          <select
            value={filtroTipo}
            onChange={(e) => setFiltroTipo(e.target.value)}
            className="rounded-md border border-blue-200 bg-white px-3 py-2 text-sm text-blue-950 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          >
            <option value="TODOS">Todos los tipos</option>
            {TIPOS.map((tipo) => (
              <option key={tipo} value={tipo}>
                {tipo}
              </option>
            ))}
          </select>
        </div>

        <div className="mt-4 overflow-x-auto rounded-xl border border-blue-100 bg-white shadow-md shadow-blue-900/5">
          <table className="w-full">
            <thead className="bg-blue-700 text-left text-sm text-white">
              <tr>
                <th className="px-4 py-3 font-medium">Código</th>
                <th className="px-4 py-3 font-medium">Tipo</th>
                <th className="px-4 py-3 text-right font-medium">Monto</th>
                <th className="px-4 py-3 text-right font-medium">Impacto</th>
                <th className="px-4 py-3 font-medium">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {cargando && (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center text-sm text-blue-600/70">
                    Cargando transacciones...
                  </td>
                </tr>
              )}

              {!cargando && transaccionesVisibles.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center text-sm text-blue-600/70">
                    {transacciones.length === 0
                      ? "Aún no hay transacciones. Crea la primera con el formulario."
                      : "Ninguna transacción coincide con el filtro."}
                  </td>
                </tr>
              )}

              {transaccionesVisibles.map((transaccion) => (
                <tr
                  key={transaccion.id}
                  className={`border-t border-blue-50 text-sm text-blue-950 ${
                    transaccion.id === editandoId ? "bg-amber-50" : "hover:bg-blue-50/60"
                  }`}
                >
                  <td className="px-4 py-2 font-medium">{transaccion.codigo}</td>
                  <td className="px-4 py-2">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        ESTILO_TIPO[transaccion.tipo] ?? "bg-gray-100 text-gray-700"
                      }`}
                    >
                      {transaccion.tipo}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-right tabular-nums">
                    {formatearMoneda(transaccion.monto)}
                  </td>
                  <td
                    className={`px-4 py-2 text-right tabular-nums ${
                      transaccion.impacto < 0 ? "text-rose-600" : ""
                    }`}
                  >
                    {formatearDecimal(transaccion.impacto)}
                  </td>
                  <td className="whitespace-nowrap px-4 py-2">
                    {confirmandoId === transaccion.id ? (
                      <>
                        <span className="mr-2 text-xs text-blue-950">¿Eliminar?</span>
                        <button
                          onClick={() => eliminar(transaccion.id)}
                          className="mr-2 font-medium text-red-600 hover:underline"
                        >
                          Sí
                        </button>
                        <button
                          onClick={() => setConfirmandoId(null)}
                          className="font-medium text-blue-600 hover:underline"
                        >
                          No
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => editar(transaccion)}
                          className="mr-3 font-medium text-blue-600 hover:text-blue-800 hover:underline"
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => setConfirmandoId(transaccion.id)}
                          className="font-medium text-red-500 hover:text-red-700 hover:underline"
                        >
                          Eliminar
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default Transacciones;
