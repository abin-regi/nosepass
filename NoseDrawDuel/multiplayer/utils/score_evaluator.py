import logging
from image_recognizer import ImageRecognizer
from PIL import Image, ImageDraw, ImageFont
import os
import numpy as np
from cnn_evaluator import evaluate_with_cnn

class ScoreEvaluator:
    """
    Utility class for evaluating and comparing player scores in multiplayer mode.
    """
    
    def __init__(self):
        self.image_recognizer = ImageRecognizer()
        self.logger = logging.getLogger(__name__)
    
    def evaluate_drawing(self, drawing_data, target_shape):
        """
        Evaluate a single drawing against the target shape.
        
        Args:
            drawing_data: Base64 encoded image data of the drawing
            target_shape: String description of the target shape
            
        Returns:
            float: Score between 0 and 100
        """
        try:
            # Preprocess and decode image as needed, then use CNN evaluator
            import base64
            import io
            from PIL import Image
            if drawing_data.startswith('data:image'):
                drawing_data = drawing_data.split(',')[1]
            image_bytes = base64.b64decode(drawing_data)
            image = Image.open(io.BytesIO(image_bytes))
            # Preprocess for CNN (28x28)
            from recognizer import ImageRecognizer
            user_img = ImageRecognizer().preprocess(image, size=(28, 28))
            score = evaluate_with_cnn(user_img, target_shape)
            self.logger.debug(f"Drawing evaluated with score: {score}")
            return score
        except Exception as e:
            self.logger.error(f"Error evaluating drawing: {e}")
            return 0.0
    
    def compare_players(self, player1_score, player2_score):
        """
        Compare two player scores and determine the winner.
        
        Args:
            player1_score: Float score for player 1
            player2_score: Float score for player 2
            
        Returns:
            dict: Contains winner information and score difference
        """
        try:
            score_diff = abs(player1_score - player2_score)
            
            result = {
                'player1_score': player1_score,
                'player2_score': player2_score,
                'score_difference': score_diff
            }
            
            if player1_score > player2_score:
                result['winner'] = 1
                result['winner_name'] = 'Player 1'
            elif player2_score > player1_score:
                result['winner'] = 2
                result['winner_name'] = 'Player 2'
            else:
                result['winner'] = 'tie'
                result['winner_name'] = 'Tie Game'
            
            # Determine if it's a close game (within 10 points)
            result['close_game'] = score_diff <= 10.0
            
            self.logger.debug(f"Score comparison result: {result}")
            return result
            
        except Exception as e:
            self.logger.error(f"Error comparing player scores: {e}")
            return {
                'winner': 'error',
                'winner_name': 'Error',
                'player1_score': 0,
                'player2_score': 0,
                'score_difference': 0,
                'close_game': False
            }
    
    def calculate_performance_feedback(self, score):
        """
        Generate encouraging feedback based on score, and assign stars.
        """
        feedback_levels = [
            (90, "Amazing! Perfect nose!", "🌟", 3),
            (80, "Great job! Almost perfect!", "🎉", 2),
            (70, "Good work! Keep practicing!", "👍", 2),
            (60, "Nice try! You're getting better!", "😊", 1),
            (50, "Good effort! Practice makes perfect!", "💪", 1),
            (0, "Keep trying! You can do it!", "🌈", 0)
        ]
        for threshold, message, emoji, stars in feedback_levels:
            if score >= threshold:
                return {
                    'message': message,
                    'emoji': emoji,
                    'score': score,
                    'stars': stars
                }
        # Fallback
        return {
            'message': "Keep trying! You can do it!",
            'emoji': "🌈",
            'score': score,
            'stars': 0
        }
