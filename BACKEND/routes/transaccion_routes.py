from flask import Blueprint, jsonify, request

from controllers import transaccion_controller as controller

transaccion_bp = Blueprint("transacciones", __name__)


@transaccion_bp.route("/", methods=["GET"])
def listar():
    data, status = controller.listar_transacciones()
    return jsonify(data), status


@transaccion_bp.route("/<int:id>", methods=["GET"])
def obtener(id):
    data, status = controller.obtener_transaccion(id)
    return jsonify(data), status


@transaccion_bp.route("/", methods=["POST"])
def crear():
    data, status = controller.crear_transaccion(request.get_json())
    return jsonify(data), status


@transaccion_bp.route("/<int:id>", methods=["PUT"])
def actualizar(id):
    data, status = controller.actualizar_transaccion(id, request.get_json())
    return jsonify(data), status


@transaccion_bp.route("/<int:id>", methods=["DELETE"])
def eliminar(id):
    data, status = controller.eliminar_transaccion(id)
    return jsonify(data), status


