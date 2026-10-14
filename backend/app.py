"""
ATLAS+MONITORING Flask Application Server
Hosts REST API endpoints and static frontend single-page application.
Configures CORS, database initialization, and DSA telemetry.
"""

import os
from pathlib import Path
from flask import Flask, send_from_directory, jsonify
from flask_cors import CORS
from .routes import api_bp
from .services import services

# Paths
BASE_DIR = Path(__file__).resolve().parent.parent
FRONTEND_DIR = BASE_DIR / "frontend"

app = Flask(__name__, static_folder=str(FRONTEND_DIR))
CORS(app)

# Register API Blueprint
app.register_blueprint(api_bp)


# ==============================================================================
# STATIC FRONTEND & SPA SERVING
# ==============================================================================

@app.route("/", methods=["GET"])
def serve_index():
    """Serves the Vanilla HTML/CSS/JS Single-Page Application."""
    if (FRONTEND_DIR / "index.html").exists():
        return send_from_directory(str(FRONTEND_DIR), "index.html")
    return jsonify({
        "project": "ATLAS+MONITORING",
        "status": "OPERATIONAL",
        "message": "Frontend index.html ready to build."
    })


@app.route("/<path:path>", methods=["GET"])
def serve_static_or_spa(path):
    """Serves static assets (css, js, images) or falls back to index.html for SPA routes."""
    file_path = FRONTEND_DIR / path
    if file_path.exists() and file_path.is_file():
        return send_from_directory(str(FRONTEND_DIR), path)
    # SPA client-side fallback
    if (FRONTEND_DIR / "index.html").exists():
        return send_from_directory(str(FRONTEND_DIR), "index.html")
    return jsonify({"error": "Resource not found", "path": path}), 404


# Initialize on startup
with app.app_context():
    print("[ATLAS+MONITORING] Initializing database and DSA structures...")
    services.initialize_system()
    print("[ATLAS+MONITORING] Ready! Serving at http://127.0.0.1:5000")


if __name__ == "__main__":
    port = int(os.getenv("PORT", 5000))
    app.run(host="127.0.0.1", port=port, debug=False)
