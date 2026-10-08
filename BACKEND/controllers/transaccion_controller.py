from models import transaccion_model


def listar_transacciones():
    transacciones = transaccion_model.obtener_todas()
    return [t.dict() for t in transacciones], 200


def obtener_transaccion(id):
    transaccion = transaccion_model.obtener_por_id(id)
    if transaccion is None:
        return {"error": "Transaccion no encontrada"}, 404
    return transaccion.dict(), 200


def crear_transaccion(datos):
    try:
        if datos.get("monto", 0) < 0:
            return {"error": "El monto no puede ser negativo"}, 400
        nueva = transaccion_model.crear(datos)
        return nueva.dict(), 201
    except Exception as e:
        return {"error": str(e)}, 400


def actualizar_transaccion(id, datos):
    try:
        if datos.get("monto", 0) < 0:
            return {"error": "El monto no puede ser negativo"}, 400
        actualizada = transaccion_model.actualizar(id, datos)
        return actualizada.dict(), 200
    except Exception as e:
        return {"error": str(e)}, 400


def eliminar_transaccion(id):
    try:
        transaccion_model.eliminar(id)
        return {"mensaje": "Transaccion eliminada"}, 200
    except Exception as e:
        return {"error": str(e)}, 400

