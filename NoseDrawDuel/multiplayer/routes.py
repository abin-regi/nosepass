from flask import render_template, request, jsonify, session
from . import multiplayer_bp
import random
import base64
import io
from PIL import Image as PILImage
from cnn_evaluator import evaluate_with_cnn
from recognizer import ImageRecognizer

# In-memory game sessions (no database needed)
game_sessions = {}

# Sample questions for children
QUESTIONS = [
    {"question": "Draw the number 0", "answer": "0"},
    {"question": "Draw the number 1", "answer": "1"},
    {"question": "Draw the number 2", "answer": "2"},
    {"question": "Draw the number 3", "answer": "3"},
    {"question": "Draw the number 4", "answer": "4"},
    {"question": "What is 2 + 2?", "answer": "4"},
    {"question": "What is 3 + 2?", "answer": "5"},
    {"question": "How many sides does a triangle have?", "answer": "3"},
    {"question": "How many legs does a spider have?", "answer": "8"},
    {"question": "What is 5 + 4?", "answer": "9"}
]


@multiplayer_bp.route('/')
def multiplayer_game():
    """Main multiplayer game page."""
    return render_template('multiplayer.html')

@multiplayer_bp.route('/start_game', methods=['POST'])
def start_game():
    """Start a new multiplayer game session."""
    try:
        data = request.get_json()
        player1_name = data.get('player1_name', 'Player 1')
        player2_name = data.get('player2_name', 'Player 2')
        
        # Create new game session
        current_q = random.choice(QUESTIONS)
        session_id = str(random.randint(100000, 999999))
        
        game_sessions[session_id] = {
            'player1_name': player1_name,
            'player2_name': player2_name,
            'current_question': current_q["question"],
            'current_answer': current_q["answer"],
            'player1_score': 0.0,
            'player2_score': 0.0,
            'current_turn': 1,
            'game_status': 'player1_turn'
        }
        
        # Store session ID in Flask session
        session['game_session_id'] = session_id
        
        return jsonify({
            'success': True,
            'session_id': session_id,
            'current_question': current_q["question"],
            'current_turn': 1,
            'game_status': 'player1_turn'
        })
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@multiplayer_bp.route('/get_game_state')
def get_game_state():
    """Get current game state."""
    try:
        session_id = session.get('game_session_id')
        if not session_id or session_id not in game_sessions:
            return jsonify({'success': False, 'error': 'No active game session'})
        
        return jsonify({
            'success': True,
            'game_state': game_sessions[session_id]
        })
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

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

@multiplayer_bp.route('/submit_drawing', methods=['POST'])
def submit_drawing():
    """Submit a player's drawing for scoring."""
    try:
        session_id = session.get('game_session_id')
        if not session_id or session_id not in game_sessions:
            return jsonify({'success': False, 'error': 'No active game session'})
        
        game_session = game_sessions[session_id]
        
        data = request.get_json()
        drawing_data = data.get('drawing_data')
        player = data.get('player', 1)
        
        if not drawing_data:
            return jsonify({'success': False, 'error': 'No drawing data provided'})
        
        # Get the correct answer for this question
        correct_answer = game_session['current_answer']
        
        # Convert base64 to PIL Image
        if drawing_data.startswith('data:image'):
            drawing_data = drawing_data.split(',')[1]
        image_bytes = base64.b64decode(drawing_data)
        pil_image = PILImage.open(io.BytesIO(image_bytes))
        pil_image.save(f'debug_received_canvas_player{player}.png')  # Save for inspection
        # Calculate similarity score using recognizer
        print(f'Player {player} submitting PIL image for scoring.')
        score = float(evaluate_with_cnn(pil_image, correct_answer))
        score = score * 3.43
        stars = get_stars(score)
        print(f'Player {player} score for target "{correct_answer}": {score} ({stars} stars)')
        
        # Update player score
        if player == 1:
            game_session['player1_score'] = score
            game_session['player1_stars'] = stars
            game_session['current_turn'] = 2
            game_session['game_status'] = 'player2_turn'
        else:
            game_session['player2_score'] = score
            game_session['player2_stars'] = stars
            game_session['game_status'] = 'finished'
        
        # Determine winner if game is finished
        winner = None
        if game_session['game_status'] == 'finished':
            if game_session['player1_score'] > game_session['player2_score']:
                winner = 1
            elif game_session['player2_score'] > game_session['player1_score']:
                winner = 2
            else:
                winner = 'tie'
        
        return jsonify({
            'success': True,
            'score': round(score, 1),
            'stars': stars,
            'game_status': game_session['game_status'],
            'current_turn': game_session['current_turn'],
            'winner': winner,
            'player1_score': round(game_session['player1_score'], 1),
            'player2_score': round(game_session['player2_score'], 1),
            'player1_stars': game_session.get('player1_stars', 0),
            'player2_stars': game_session.get('player2_stars', 0)
        })
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@multiplayer_bp.route('/next_question', methods=['POST'])
def next_question():
    """Start a new round with a different question."""
    try:
        session_id = session.get('game_session_id')
        if not session_id or session_id not in game_sessions:
            return jsonify({'success': False, 'error': 'No active game session'})
        
        game_session = game_sessions[session_id]
        
        # Reset for new round
        next_q = random.choice(QUESTIONS)
        game_session['current_question'] = next_q["question"]
        game_session['current_answer'] = next_q["answer"]
        game_session['player1_score'] = 0.0
        game_session['player2_score'] = 0.0
        game_session['current_turn'] = 1
        game_session['game_status'] = 'player1_turn'
        
        return jsonify({
            'success': True,
            'current_question': game_session['current_question'],
            'game_status': game_session['game_status'],
            'current_turn': game_session['current_turn']
        })
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@multiplayer_bp.route('/end_game', methods=['POST'])
def end_game():
    """End the current game session."""
    try:
        session_id = session.get('game_session_id')
        if session_id and session_id in game_sessions:
            # Remove the game session
            del game_sessions[session_id]
        
        # Clear the session
        session.pop('game_session_id', None)
        
        return jsonify({'success': True})
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500
