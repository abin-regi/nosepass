from flask import Blueprint

# Create the multiplayer blueprint
multiplayer_bp = Blueprint(
    'multiplayer',
    __name__,
    template_folder='templates',
    static_folder='static',
    static_url_path='/multiplayer/static'
)

# Import routes to register them with the blueprint
from . import routes
