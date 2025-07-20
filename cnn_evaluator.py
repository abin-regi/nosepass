import os
import numpy as np
import tensorflow as tf
from tensorflow.keras.models import load_model, Model
from PIL import Image
import requests
from sklearn.metrics.pairwise import cosine_similarity

MODEL_PATH = 'emnist_cnn_model.h5'
MODEL_URL = 'https://huggingface.co/keras-io/emnist-balanced-keras/resolve/main/emnist-balanced-keras.h5'

# Map label to index for EMNIST (0-9, A-Z)
LABEL_MAP = {str(i): i for i in range(10)}
LABEL_MAP.update({chr(ord('A')+i): 10+i for i in range(26)})

REFERENCE_PATH = 'static/assets/reference_templates'


def download_emnist_model():
    print(f"Downloading EMNIST model from {MODEL_URL} ...")
    r = requests.get(MODEL_URL)
    with open(MODEL_PATH, 'wb') as f:
        f.write(r.content)
    print("Download complete.")

def ensure_emnist_model():
    if not os.path.exists(MODEL_PATH):
        download_emnist_model()

def get_model():
    ensure_emnist_model()
    model = load_model(MODEL_PATH)
    return model, None


def preprocess_image(image, size=(28, 28)):
    # Handle both PIL Image and numpy array
    if isinstance(image, np.ndarray):
        arr = image.astype('float32') / 255.0
        arr = arr.reshape(1, 28, 28, 1)
        return arr
    # Convert RGBA to white background for PIL Image
    if image.mode == 'RGBA':
        bg = Image.new('RGBA', image.size, (255, 255, 255, 255))
        image = Image.alpha_composite(bg, image)
        image = image.convert('L')
    elif image.mode != 'L':
        image = image.convert('L')
    image = image.resize(size)
    arr = np.array(image).astype('float32') / 255.0
    arr = arr.reshape(1, 28, 28, 1)
    return arr


def get_embedding(image):
    _, embedding_model = get_model()
    arr = preprocess_image(image)
    embedding = embedding_model.predict(arr)
    return embedding


def evaluate_similarity(player_image, target_image):
    emb1 = get_embedding(player_image)
    emb2 = get_embedding(target_image)
    sim = cosine_similarity(emb1, emb2)[0, 0]
    sim = max(0.0, min(1.0, sim))
    return sim * 100  # as percentage


def get_reference_image(character, reference_path=REFERENCE_PATH):
    path = os.path.join(reference_path, f'{character}.png')
    if not os.path.exists(path):
        raise FileNotFoundError(f"Reference template not found: {path}")
    img = Image.open(path)
    return img


def evaluate_with_cnn(player_image, target_label):
    arr = preprocess_image(player_image)
    model, _ = get_model()
    preds = model.predict(arr)[0]
    target_idx = LABEL_MAP.get(target_label.upper(), None)
    if target_idx is None or target_idx >= 36:
        return 0.0
    confidence = float(preds[target_idx])
    # Improved scoring: partial credit for top-3
    top3 = np.argsort(preds)[::-1][:3]
    if target_idx == top3[0]:
        score = confidence * 100.0
    elif target_idx == top3[1]:
        score = confidence * 0.7 * 100.0
    elif target_idx == top3[2]:
        score = confidence * 0.5 * 100.0
    else:
        score = confidence * 100.0
    return score 