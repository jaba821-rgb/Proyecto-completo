from db import db


def obtener_todas():
    return db.transaccion.find_many(order={"id": "desc"})


def obtener_por_id(id):
    return db.transaccion.find_unique(where={"id": id})


def crear(datos):
    return db.transaccion.create(data=datos)


def actualizar(id, datos):
    return db.transaccion.update(where={"id": id}, data=datos)


def eliminar(id):
    return db.transaccion.delete(where={"id": id})
