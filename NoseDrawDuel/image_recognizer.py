import os
import logging
import numpy as np
from PIL import Image
import cv2
# REMOVE: from skimage.metrics import structural_similarity as ssim
# REMOVE: from sklearn.metrics.pairwise import cosine_similarity

# Add import for CNN evaluator
from cnn_evaluator import evaluate_with_cnn

logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

class ImageRecognizer:
    def __init__(self, reference_path='static/assets/reference_templates'):
        self.reference_path = reference_path

    def preprocess(self, image, size=(100, 100)):
        """Simple preprocessing: convert to grayscale, resize, and normalize"""
        if not isinstance(image, Image.Image):
            raise ValueError("Input must be a PIL Image.")
        img = image.convert('L')
        img = img.resize(size, Image.Resampling.LANCZOS)
        arr = np.array(img, dtype=np.float32) / 255.0
        return arr

    def load_reference(self, character, size=(100, 100)):
        path = os.path.join(self.reference_path, f'{character}.png')
        if not os.path.exists(path):
            logger.error(f"Reference template not found: {path}")
            return None
        img = Image.open(path)
        return self.preprocess(img, size)

    def evaluate_drawing(self, drawn_image, correct_answer):
        try:
            # Preprocess image as needed for CNN (e.g., grayscale, resize to 28x28)
            user_img = self.preprocess(drawn_image, size=(28, 28))
            # Call CNN evaluator (returns percentage score)
            percentage = evaluate_with_cnn(user_img, correct_answer)
            return float(percentage)
        except Exception as e:
            logger.error(f"Recognition error: {e}")
            return 0.0

    def compare_with_shapes(self, image_data):
        """Compare drawing with multiple shape templates and return best match using CNN evaluator"""
        try:
            import base64
            import io
            if image_data.startswith('data:image'):
                image_data = image_data.split(',')[1]
            image_bytes = base64.b64decode(image_data)
            image = Image.open(io.BytesIO(image_bytes))
            best_score = 0
            best_shape = None
            for shape_name in ['A', 'O', '1', '2', '3', 'circle', 'triangle', 'square']:
                # Preprocess for CNN
                user_img = self.preprocess(image, size=(28, 28))
                score = evaluate_with_cnn(user_img, shape_name)
                if score > best_score:
                    best_score = score
                    best_shape = shape_name
            return best_score, best_shape
        except Exception as e:
            logger.error(f"Shape comparison error: {e}")
            return 0.0, None