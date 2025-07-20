# NoseDraw - Inclusive Drawing Game

## Overview

NoseDraw is an accessible web-based drawing game designed for children with motor impairments. Players use nose movement tracked via webcam to draw letters and numbers on screen, making learning inclusive and fun for those with limited hand mobility.

## User Preferences

Preferred communication style: Simple, everyday language.
Game difficulty: Progressive difficulty system - starts very easy (15% threshold) and increases with each level to maintain challenge while staying encouraging.

## System Architecture

The application follows a client-server architecture with a Flask backend and JavaScript frontend:

- **Frontend**: HTML5/CSS3/JavaScript with MediaPipe for nose tracking
- **Backend**: Python Flask REST API for image processing and evaluation
- **Image Processing**: OpenCV and scikit-image for drawing comparison
- **Real-time Tracking**: MediaPipe FaceMesh for nose position detection

## Key Components

### Frontend Architecture
- **Game Engine**: Object-oriented JavaScript classes managing game state
- **Nose Tracking**: MediaPipe FaceMesh integration for real-time nose position detection
- **Canvas Drawing**: HTML5 Canvas API for drawing functionality
- **UI Framework**: Bootstrap 5 for responsive, accessible interface
- **Accessibility Features**: Text-to-speech support via ResponsiveVoice

### Backend Architecture
- **Flask Application**: Lightweight web server handling API requests
- **Image Recognition**: Custom ImageRecognizer class for comparing drawings
- **Template Generation**: Automatic creation of reference templates for letters/numbers
- **RESTful API**: JSON-based endpoints for questions and drawing evaluation

### Core Classes
1. **NoseDrawGame**: Main game logic and UI management
2. **NoseTracker**: MediaPipe integration for nose position tracking
3. **ImageRecognizer**: Image processing and comparison algorithms

## Data Flow

1. **Game Initialization**: Load questions from JSON, initialize MediaPipe
2. **Camera Setup**: Request webcam access, start face detection
3. **Drawing Phase**: Track nose movement, draw on canvas in real-time
4. **Evaluation**: Submit canvas image to Flask backend for comparison
5. **Feedback**: Return accuracy score and progress to next level

## External Dependencies

### Frontend Libraries
- **MediaPipe FaceMesh**: Real-time face landmark detection
- **Bootstrap 5**: UI framework for responsive design
- **Font Awesome**: Icon library for visual elements
- **ResponsiveVoice**: Text-to-speech functionality

### Backend Libraries
- **Flask**: Web framework for REST API
- **OpenCV**: Image processing and computer vision
- **scikit-image**: Structural similarity comparison (SSIM)
- **Pillow (PIL)**: Image manipulation and template generation
- **NumPy**: Numerical computing support

## Deployment Strategy

The application is designed for web deployment with:

- **Development Server**: Flask development server on port 5000
- **Static Assets**: Reference templates generated automatically
- **WSGI Compatibility**: ProxyFix middleware for production deployment
- **Environment Configuration**: Session secrets via environment variables

### File Structure
- `app.py`: Main Flask application with API endpoints
- `main.py`: Application entry point
- `recognizer.py`: Image processing and template generation
- `questions.json`: Game questions and answers database
- `templates/`: HTML templates for web interface
- `static/`: CSS, JavaScript, and asset files

The architecture prioritizes accessibility and inclusivity, with high-contrast UI elements, large buttons, and multiple feedback mechanisms to ensure the game is usable by children with various motor abilities.