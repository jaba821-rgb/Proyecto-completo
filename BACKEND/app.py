from flask import Flask, jsonify
from flask_cors import CORS

from db import db
from routes.transaccion_routes import transaccion_bp

app = Flask(__name__)
CORS(app)

db.connect()

app.register_blueprint(transaccion_bp, url_prefix="/api/transacciones")


# Por defecto Flask responde estos errores con HTML; una API debe responder siempre JSON.
@app.errorhandler(404)
def ruta_no_encontrada(error):
    return jsonify({"error": "Ruta no encontrada"}), 404


@app.errorhandler(405)
def metodo_no_permitido(error):
    return jsonify({"error": "Método HTTP no permitido en esta ruta"}), 405


if __name__ == "__main__":
    app.run(debug=True, port=5000)
