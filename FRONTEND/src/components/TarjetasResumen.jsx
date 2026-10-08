import { formatearMoneda } from "../utils/formato";

function Tarjeta({ titulo, valor, detalle, color }) {
  return (
    <div className="rounded-xl border border-blue-100 bg-white p-4 shadow-sm">
      <div className={`mb-2 h-1 w-8 rounded-full ${color}`} />
      <p className="text-xs font-medium uppercase tracking-wide text-blue-600/70">{titulo}</p>
      <p className="mt-1 text-lg font-semibold text-blue-950">{valor}</p>
      {detalle && <p className="text-xs text-blue-600/70">{detalle}</p>}
    </div>
  );
}

function TarjetasResumen({ resumen }) {
  if (!resumen) return null;

  const { total_transacciones, monto_total, por_tipo } = resumen;
  const grupo = (tipo) => por_tipo[tipo] ?? { cantidad: 0, monto: 0 };

  return (
    <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
      <Tarjeta
        titulo="Total"
        valor={formatearMoneda(monto_total)}
        detalle={`${total_transacciones} transacciones`}
        color="bg-blue-600"
      />
      <Tarjeta
        titulo="Créditos"
        valor={formatearMoneda(grupo("CREDITO").monto)}
        detalle={`${grupo("CREDITO").cantidad} registros`}
        color="bg-emerald-500"
      />
      <Tarjeta
        titulo="Débitos"
        valor={formatearMoneda(grupo("DEBITO").monto)}
        detalle={`${grupo("DEBITO").cantidad} registros`}
        color="bg-rose-500"
      />
      <Tarjeta
        titulo="Transferencias"
        valor={formatearMoneda(grupo("TRANSFERENCIA").monto)}
        detalle={`${grupo("TRANSFERENCIA").cantidad} registros`}
        color="bg-sky-500"
      />
    </div>
  );
}

export default TarjetasResumen;
