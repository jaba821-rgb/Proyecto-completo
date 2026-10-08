from flask import Flask
from flask_cors import CORS

from db import db
from routes.transaccion_routes import transaccion_bp

app = Flask(__name__)
CORS(app)

db.connect()

app.register_blueprint(transaccion_bp, url_prefix="/api/transacciones")


if __name__ == "__main__":
    app.run(debug=True, port=5000)
