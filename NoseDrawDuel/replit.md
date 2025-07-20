# Multiplayer Nose Drawing Game

## Overview

This is a Flask-based web application that implements a multiplayer "Nose Drawing Game" designed for children with disabilities or special needs, particularly those with motor impairments, aged 6-12. The application extends an existing single-player nose drawing game with a 2-player mode where children can take turns drawing different nose shapes on the same computer.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Backend Architecture
- **Framework**: Flask web framework with modular blueprint architecture
- **Database**: SQLAlchemy ORM with SQLite as the default database (configurable via environment variables)
- **Session Management**: Flask sessions for tracking game state
- **Image Processing**: OpenCV and scikit-image for drawing comparison and scoring

### Frontend Architecture
- **Templates**: Jinja2 templating engine with Bootstrap 5 for responsive design
- **Styling**: Custom CSS with child-friendly design using Google Fonts (Comic Neue, Fredoka One)
- **JavaScript**: Vanilla JavaScript for interactive game mechanics, canvas drawing, and camera integration
- **Accessibility**: Keyboard navigation support and large, colorful UI elements

### Modular Design
- **Blueprint Pattern**: Multiplayer functionality is encapsulated in a separate Flask blueprint (`multiplayer/`)
- **Component Separation**: Clear separation between routes, models, templates, and static assets

## Key Components

### Core Application (`app.py`)
- Flask application factory with database configuration
- Blueprint registration for modular multiplayer functionality
- SQLAlchemy database initialization with automatic table creation

### Database Models (`models.py`)
- **GameSession**: Tracks multiplayer game sessions with player names, scores, current turn, and game status
- **Session States**: `waiting`, `player1_turn`, `player2_turn`, `finished`

### Image Recognition System (`image_recognizer.py`)
- **ImageRecognizer Class**: Handles drawing comparison using computer vision
- **Preprocessing**: Converts drawings to grayscale, resizes, and applies binary thresholding
- **Similarity Calculation**: Uses structural similarity (SSIM) for scoring drawings

### Multiplayer Module (`multiplayer/`)
- **Routes**: Game flow management, session creation, drawing submission
- **Templates**: Child-friendly UI with accessibility features
- **Static Assets**: CSS and JavaScript for interactive gameplay
- **Utilities**: Score evaluation and player comparison logic

## Data Flow

### Game Session Flow
1. **Setup**: Players enter names and start a new game session
2. **Turn-Based Play**: Players alternate drawing responses to prompts
3. **Evaluation**: Drawings are processed and scored using computer vision
4. **Comparison**: Scores are compared to determine round winners
5. **Session Management**: Game state is persisted in the database

### Image Processing Pipeline
1. **Capture**: Drawing data captured from HTML5 canvas
2. **Preprocessing**: Base64 image converted to OpenCV format
3. **Normalization**: Grayscale conversion, resizing, and binary thresholding
4. **Comparison**: Structural similarity analysis against target shapes
5. **Scoring**: Similarity score calculation (0-100 scale)

## External Dependencies

### Python Packages
- **Flask**: Web framework and session management
- **SQLAlchemy**: Database ORM and migrations
- **OpenCV**: Computer vision and image processing
- **scikit-image**: Advanced image analysis (SSIM calculation)
- **NumPy**: Numerical computing for image arrays

### Frontend Libraries
- **Bootstrap 5**: Responsive UI framework
- **Google Fonts**: Child-friendly typography (Comic Neue, Fredoka One)
- **Font Awesome**: Icon library for enhanced UI

### Browser APIs
- **HTML5 Canvas**: Drawing surface for player input
- **MediaDevices API**: Camera access for potential face tracking
- **FaceDetector API**: Optional browser-based face detection

## Deployment Strategy

### Environment Configuration
- **Database**: Configurable via `DATABASE_URL` environment variable (defaults to SQLite)
- **Security**: Session secret configurable via `SESSION_SECRET` environment variable
- **Development Mode**: Debug mode enabled in development with hot reloading

### Database Strategy
- **Development**: SQLite for simplicity and portability
- **Production**: PostgreSQL support via environment configuration
- **Schema Management**: Automatic table creation on application startup

### Accessibility Considerations
- **Child-Friendly Design**: Large buttons, colorful interface, rounded corners
- **Motor Impairment Support**: Keyboard navigation, large click targets
- **Visual Design**: High contrast colors, clear typography, intuitive layout
- **Responsive Design**: Works across different screen sizes and devices

### Performance Optimizations
- **Database**: Connection pooling and ping checks for reliability
- **Image Processing**: Standardized image sizes for consistent processing
- **Session Management**: Lightweight session storage for game state
- **Static Assets**: Organized asset structure for efficient loading