import os
import logging
from flask import Flask, render_template, request, jsonify
from werkzeug.middleware.proxy_fix import ProxyFix
import json
import base64
from PIL import Image
import io
from recognizer import ImageRecognizer
from cnn_evaluator import evaluate_with_cnn

# Configure logging
logging.basicConfig(level=logging.DEBUG)

# Create the app
app = Flask(__name__)
app.secret_key = os.environ.get("SESSION_SECRET", "nosedraw_secret_key_for_development")
app.wsgi_app = ProxyFix(app.wsgi_app, x_proto=1, x_host=1)

# Initialize image recognizer
recognizer = ImageRecognizer()

# Load questions
with open('questions.json', 'r') as f:
    questions_data = json.load(f)

# Register the multiplayer blueprint from NoseDrawDuel
from NoseDrawDuel.multiplayer import multiplayer_bp
app.register_blueprint(multiplayer_bp, url_prefix='/multiplayer')

def get_stars(score):
    if score >= 80:
        return 5
    elif score >= 60:
        return 4
    elif score >= 40:
        return 3
    elif score >= 20:
        return 2
    elif score >= 7:
        return 1
    else:
        return 0

@app.route('/')
def home():
    return render_template('home.html')

@app.route('/play')
def play():
    return render_template('index.html')

@app.route('/questions')
def get_questions():
    """Get all questions for the game"""
    return jsonify(questions_data)

@app.route('/evaluate', methods=['POST'])
def evaluate_drawing():
    """Evaluate the drawn image against the correct answer"""
    try:
        data = request.get_json()
        
        if not data or 'image' not in data or 'answer' not in data:
            return jsonify({'error': 'Missing image or answer data'}), 400
        
        # Decode base64 image
        image_data = data['image'].split(',')[1]  # Remove data:image/png;base64, prefix
        image_bytes = base64.b64decode(image_data)
        
        # Convert to PIL Image
        image = Image.open(io.BytesIO(image_bytes))
        
        # Get the correct answer and level
        correct_answer = data['answer'].upper()
        level = data.get('level', 1)
        
        # Evaluate the drawing
        similarity_score = evaluate_with_cnn(image, correct_answer)
        similarity_score = similarity_score * 3.43  # Scale score as in multiplayer
        stars = get_stars(similarity_score)
        # Use the scaled similarity_score for correctness
        is_correct = similarity_score >= 20
        response = {
            'is_correct': bool(is_correct),
            'stars': stars,
            'score': similarity_score,
            'level': level,
            'feedback': 'Great job!' if is_correct else 'Try again! You can do it!'
        }
        app.logger.info(f"Evaluated drawing for '{correct_answer}' (Level {level}): stars={stars}, correct={is_correct}")
        return jsonify(response)
        
    except Exception as e:
        app.logger.error(f"Error evaluating drawing: {str(e)}")
        return jsonify({'error': 'Failed to evaluate drawing'}), 500

@app.route('/health')
def health_check():
    """Health check endpoint"""
    return jsonify({'status': 'healthy', 'service': 'NoseDraw'})

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
