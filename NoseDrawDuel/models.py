

from app import db
from datetime import datetime

class GameSession(db.Model):
    """Model to track multiplayer game sessions."""
    id = db.Column(db.Integer, primary_key=True)
    player1_name = db.Column(db.String(100), nullable=False, default="Player 1")
    player2_name = db.Column(db.String(100), nullable=False, default="Player 2")
    current_question = db.Column(db.String(500))
    player1_score = db.Column(db.Float, default=0.0)
    player2_score = db.Column(db.Float, default=0.0)
    current_turn = db.Column(db.Integer, default=1)  # 1 for player1, 2 for player2
    game_status = db.Column(db.String(20), default='waiting')  # waiting, player1_turn, player2_turn, finished
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def to_dict(self):
        """Convert session to dictionary for JSON responses."""
        return {
            'id': self.id,
            'player1_name': self.player1_name,
            'player2_name': self.player2_name,
            'current_question': self.current_question,
            'player1_score': self.player1_score,
            'player2_score': self.player2_score,
            'current_turn': self.current_turn,
            'game_status': self.game_status
        }

