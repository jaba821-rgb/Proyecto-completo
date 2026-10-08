from models import transaccion_model

# Reglas del negocio en un solo lugar: si mañana aparece un tipo nuevo, solo se cambia aquí.
TIPOS_VALIDOS = ("CREDITO", "DEBITO", "TRANSFERENCIA")
CAMPOS_OBLIGATORIOS = ("codigo", "tipo", "monto", "impacto")


def _es_numero(valor):
    # bool es subclase de int en Python (True == 1), por eso se excluye explícitamente.
    return isinstance(valor, (int, float)) and not isinstance(valor, bool)


def validar_datos(datos):
    """Revisa y normaliza los datos de una transacción.

    Devuelve una tupla (datos_limpios, error). Si hay error, datos_limpios es None.
    Solo se copian los campos permitidos, así el cliente no puede enviar, por ejemplo, un "id".
    """
    if not isinstance(datos, dict):
        return None, "El cuerpo de la petición debe ser un JSON válido"

    faltantes = [campo for campo in CAMPOS_OBLIGATORIOS if datos.get(campo) in (None, "")]
    if faltantes:
        return None, f"Faltan campos obligatorios: {', '.join(faltantes)}"

    codigo = str(datos["codigo"]).strip().upper()
    tipo = str(datos["tipo"]).strip().upper()
    monto = datos["monto"]
    impacto = datos["impacto"]

    if not codigo:
        return None, "El código no puede estar vacío"
    if tipo not in TIPOS_VALIDOS:
        return None, f"Tipo inválido. Usa uno de: {', '.join(TIPOS_VALIDOS)}"
    if not _es_numero(monto) or int(monto) != monto:
        return None, "El monto debe ser un número entero"
    if monto <= 0:
        return None, "El monto debe ser mayor que cero"
    if not _es_numero(impacto):
        return None, "El impacto debe ser un número"

    limpios = {
        "codigo": codigo,
        "tipo": tipo,
        "monto": int(monto),
        "impacto": float(impacto),
    }
    return limpios, None


def listar_transacciones():
    transacciones = transaccion_model.obtener_todas()
    return [t.dict() for t in transacciones], 200


def obtener_transaccion(id):
    transaccion = transaccion_model.obtener_por_id(id)
    if transaccion is None:
        return {"error": "Transacción no encontrada"}, 404
    return transaccion.dict(), 200


def obtener_resumen():
    transacciones = transaccion_model.obtener_todas()
    por_tipo = {tipo: {"cantidad": 0, "monto": 0} for tipo in TIPOS_VALIDOS}

    for t in transacciones:
        # setdefault cubre registros antiguos con un tipo que ya no está en la lista.
        grupo = por_tipo.setdefault(t.tipo, {"cantidad": 0, "monto": 0})
        grupo["cantidad"] += 1
        grupo["monto"] += t.monto

    return {
        "total_transacciones": len(transacciones),
        "monto_total": sum(t.monto for t in transacciones),
        "por_tipo": por_tipo,
    }, 200


def crear_transaccion(datos):
    limpios, error = validar_datos(datos)
    if error:
        return {"error": error}, 400

    try:
        if transaccion_model.obtener_por_codigo(limpios["codigo"]):
            return {"error": f"Ya existe una transacción con el código {limpios['codigo']}"}, 409
        nueva = transaccion_model.crear(limpios)
        return nueva.dict(), 201
    except Exception as e:
        print(f"[ERROR] crear_transaccion: {e}")
        return {"error": "Error interno al crear la transacción"}, 500


def actualizar_transaccion(id, datos):
    limpios, error = validar_datos(datos)
    if error:
        return {"error": error}, 400

    try:
        if transaccion_model.obtener_por_id(id) is None:
            return {"error": "Transacción no encontrada"}, 404

        otra = transaccion_model.obtener_por_codigo(limpios["codigo"])
        if otra and otra.id != id:
            return {"error": f"Ya existe otra transacción con el código {limpios['codigo']}"}, 409

        actualizada = transaccion_model.actualizar(id, limpios)
        return actualizada.dict(), 200
    except Exception as e:
        print(f"[ERROR] actualizar_transaccion: {e}")
        return {"error": "Error interno al actualizar la transacción"}, 500


def eliminar_transaccion(id):
    try:
        if transaccion_model.obtener_por_id(id) is None:
            return {"error": "Transacción no encontrada"}, 404
        transaccion_model.eliminar(id)
        return {"mensaje": "Transacción eliminada"}, 200
    except Exception as e:
        print(f"[ERROR] eliminar_transaccion: {e}")
        return {"error": "Error interno al eliminar la transacción"}, 500
