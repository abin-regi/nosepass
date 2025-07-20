import os
import logging
import numpy as np
from PIL import Image
import cv2
# REMOVE: from skimage.metrics import structural_similarity as ssim
# Add import for CNN evaluator
from cnn_evaluator import evaluate_with_cnn

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class ImageRecognizer:
    def __init__(self, reference_path='static/assets/reference_templates'):
        self.reference_path = reference_path

    def preprocess(self, image, size=(200, 200)):
        """Convert PIL image to grayscale, binarize, denoise, center/crop, and resize."""
        if not isinstance(image, Image.Image):
            raise ValueError("Input must be a PIL Image.")
        img = image.convert('L')  # Grayscale
        arr = np.array(img)
        # Binarize
        _, binary = cv2.threshold(arr, 127, 255, cv2.THRESH_BINARY_INV)
        # Denoise
        kernel = np.ones((3, 3), np.uint8)
        cleaned = cv2.morphologyEx(binary, cv2.MORPH_OPEN, kernel)
        cleaned = cv2.morphologyEx(cleaned, cv2.MORPH_CLOSE, kernel)
        # Center and crop
        cropped = self.center_and_crop(cleaned)
        # Resize
        cropped_img = Image.fromarray(cropped)
        cropped_img = cropped_img.resize(size, Image.Resampling.LANCZOS)
        return np.array(cropped_img)

    def center_and_crop(self, img):
        # Find largest contour
        contours, _ = cv2.findContours(img, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        if not contours:
            return img  # fallback: return as is
        largest = max(contours, key=cv2.contourArea)
        x, y, w, h = cv2.boundingRect(largest)
        # Add some padding
        pad = 10
        x = max(0, x - pad)
        y = max(0, y - pad)
        w = min(img.shape[1] - x, w + 2 * pad)
        h = min(img.shape[0] - y, h + 2 * pad)
        return img[y:y+h, x:x+w]

    def load_reference(self, character, size=(200, 200)):
        path = os.path.join(self.reference_path, f'{character}.png')
        if not os.path.exists(path):
            logger.error(f"Reference template not found: {path}")
            return None
        img = Image.open(path)
        return self.preprocess(img, size)

    def evaluate_drawing(self, drawn_image, correct_answer):
        try:
            # Preprocess image as needed for CNN (e.g., grayscale, resize to 28x28)
            user = self.preprocess(drawn_image, size=(28, 28))
            # Call CNN evaluator (returns percentage score)
            percentage = evaluate_with_cnn(user, correct_answer)
            return float(percentage)
        except Exception as e:
            logger.error(f"Recognition error: {e}")
            return 0.0 