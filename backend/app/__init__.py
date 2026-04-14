from flask import Flask
from flasgger import Swagger
from .extensions import db, migrate, jwt, bcrypt, cors, socketio, token_blocklist
from .config import config_by_name


def create_app(config_name=None):
    app = Flask(__name__)

    if config_name is None:
        import os
        config_name = os.getenv('FLASK_ENV', 'development')

    app.config.from_object(config_by_name[config_name])

    # Extensions
    db.init_app(app)
    migrate.init_app(app, db)
    jwt.init_app(app)
    bcrypt.init_app(app)
    cors.init_app(app)
    socketio.init_app(app, cors_allowed_origins="*", async_mode='eventlet')

    # Register blueprints
    from .routes.auth import auth_bp
    from .routes.listings import listings_bp
    from .routes.offers import offers_bp
    from .routes.likes import likes_bp
    from .routes.notifications import notifications_bp
    from .routes.profile import profile_bp
    from .routes.admin import admin_bp
    from .routes.stats import stats_bp

    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(listings_bp, url_prefix='/api/listings')
    app.register_blueprint(offers_bp, url_prefix='/api/offers')
    app.register_blueprint(likes_bp, url_prefix='/api/likes')
    app.register_blueprint(notifications_bp, url_prefix='/api/notifications')
    app.register_blueprint(profile_bp, url_prefix='/api/profile')
    app.register_blueprint(admin_bp, url_prefix='/api/admin')
    app.register_blueprint(stats_bp, url_prefix='/api/admin/stats')

    # Swagger / OpenAPI
    swagger_config = {
        "headers": [],
        "specs": [{
            "endpoint": 'apispec',
            "route": '/apispec.json',
            "rule_filter": lambda rule: True,
            "model_filter": lambda tag: True,
        }],
        "static_url_path": "/flasgger_static",
        "swagger_ui": True,
        "specs_route": "/api/docs/"
    }

    swagger_template = {
        "swagger": "2.0",
        "info": {
            "title": "AvtoRaqam.uz API",
            "description": "O'zbekiston avtomobil raqamlari savdo platformasi REST API. Mobile app va web client integratsiyasi uchun to'liq dokumentatsiya.",
            "version": "1.0.0",
            "contact": {
                "name": "AvtoRaqam Support",
                "email": "support@avtoraqam.uz"
            }
        },
        "host": "localhost:8090",
        "basePath": "/api",
        "schemes": ["http", "https"],
        "securityDefinitions": {
            "Bearer": {
                "type": "apiKey",
                "name": "Authorization",
                "in": "header",
                "description": "JWT Bearer token. Format: 'Bearer <token>'"
            }
        },
        "tags": [
            {"name": "Auth", "description": "Autentifikatsiya va ro'yxatdan o'tish"},
            {"name": "Listings", "description": "E'lonlar (raqamlar)"},
            {"name": "Offers", "description": "Takliflar"},
            {"name": "Likes", "description": "Yoqtirishlar"},
            {"name": "Profile", "description": "Foydalanuvchi profili"},
            {"name": "Notifications", "description": "Bildirishnomalar"},
            {"name": "Admin", "description": "Admin paneli (admin/superadmin)"}
        ]
    }

    Swagger(app, config=swagger_config, template=swagger_template)

    # JWT token blacklist check (in-memory)
    @jwt.token_in_blocklist_loader
    def check_if_token_revoked(jwt_header, jwt_payload):
        jti = jwt_payload['jti']
        return jti in token_blocklist

    return app
