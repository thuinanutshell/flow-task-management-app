import os
from app import create_app

# Create app instance
config_name = os.getenv("FLASK_CONFIG", "development")
app = create_app(config_name)

if __name__ == "__main__":
    app.run(
        host="0.0.0.0", port=int(os.getenv("PORT", 5001)), debug=app.config["DEBUG"]
    )
