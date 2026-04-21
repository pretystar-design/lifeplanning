from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from config import Config

db = SQLAlchemy()

def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)
    
    CORS(app)
    db.init_app(app)
    
    from app.routes import auth, goals, dashboard, habits, budgets
    app.register_blueprint(auth.bp)
    app.register_blueprint(goals.bp)
    app.register_blueprint(dashboard.bp)
    app.register_blueprint(habits.bp)
    app.register_blueprint(budgets.bp)
    
    with app.app_context():
        db.create_all()
    
    return app
