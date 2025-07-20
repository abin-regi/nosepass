/**
 * NoseDraw Game Application
 * Main game logic and UI management
 */
class NoseDrawGame {
    constructor() {
        this.noseTracker = new NoseTracker();
        this.questions = [];
        this.currentQuestionIndex = 0;
        this.currentLevel = 1;
        this.isDrawing = false;
        this.faceDetected = false;
        this.hasDrawnContent = false;
        
        // Canvas elements
        this.drawingCanvas = document.getElementById('drawing-canvas');
        this.drawingCtx = this.drawingCanvas.getContext('2d');
        
        // UI elements
        this.startCameraBtn = document.getElementById('start-camera');
        this.startDrawingBtn = document.getElementById('start-drawing');
        this.stopDrawingBtn = document.getElementById('stop-drawing');
        this.clearCanvasBtn = document.getElementById('clear-canvas');
        this.submitDrawingBtn = document.getElementById('submit-drawing');
        this.speakQuestionBtn = document.getElementById('speak-question');
        this.showHintBtn = document.getElementById('show-hint');
        
        this.statusMessage = document.getElementById('status-message');
        this.hintArea = document.getElementById('hint-area');
        this.hintText = document.getElementById('hint-text');
        this.progressText = document.getElementById('progress-text');
        this.questionText = document.getElementById('question-text');
        this.currentLevelSpan = document.getElementById('current-level');
        this.progressBar = document.getElementById('progress-bar');
        this.drawingStatus = document.getElementById('drawing-status');
        this.noseStatus = document.getElementById('nose-status');
        
        // Modals
        this.resultsModal = new bootstrap.Modal(document.getElementById('resultsModal'));
        this.nextQuestionBtn = document.getElementById('next-question');
        this.tryAgainBtn = document.getElementById('try-again');
        
        this.initializeGame();
    }
    
    async initializeGame() {
        console.log('Initializing NoseDraw Game...');
        
        // Load questions
        await this.loadQuestions();
        
        // Set up event listeners
        this.setupEventListeners();
        
        // Set up nose tracker callbacks
        this.setupNoseTracker();
        
        // Initialize drawing canvas
        this.initializeCanvas();
        
        // Display first question
        this.displayCurrentQuestion();
        
        // Initialize speech synthesis voices
        this.initializeSpeechSynthesis();
        
        console.log('Game initialized successfully');
        this.updateStatus('Welcome! Click "Start Camera" to begin.', 'info');
        
        // Auto-speak welcome message
        setTimeout(() => {
            this.speak('Welcome to NoseDraw! Start your camera to begin the fun learning adventure!');
        }, 1000);
    }
    
    async loadQuestions() {
        try {
            const response = await fetch('/questions');
            const data = await response.json();
            this.questions = data.questions;
            console.log(`Loaded ${this.questions.length} questions`);
        } catch (error) {
            console.error('Error loading questions:', error);
            this.questions = [
                { id: 1, question: "What is the first letter?", answer: "A", level: 1 }
            ];
        }
    }
    
    setupEventListeners() {
        this.startCameraBtn.addEventListener('click', () => this.startCamera());
        this.startDrawingBtn.addEventListener('click', () => this.startDrawing());
        this.stopDrawingBtn.addEventListener('click', () => this.stopDrawing());
        this.clearCanvasBtn.addEventListener('click', () => this.clearCanvas());
        this.submitDrawingBtn.addEventListener('click', () => this.submitDrawing());
        this.speakQuestionBtn.addEventListener('click', () => this.speakQuestion());
        this.showHintBtn.addEventListener('click', () => this.showHint());
        
        this.nextQuestionBtn.addEventListener('click', () => this.nextQuestion());
        this.tryAgainBtn.addEventListener('click', () => this.tryAgain());
    }
    
    setupNoseTracker() {
        this.noseTracker.setNoseMoveCallback((currentPos, lastPos) => {
            if (this.isDrawing) {
                this.drawLine(lastPos, currentPos);
            }
        });
        
        this.noseTracker.setFaceDetectedCallback((detected) => {
            this.faceDetected = detected;
            this.updateNoseStatus(detected);
            this.updateDrawingControls();
        });
    }
    
    initializeCanvas() {
        this.drawingCtx.strokeStyle = '#007bff';
        this.drawingCtx.lineWidth = 4;
        this.drawingCtx.lineCap = 'round';
        this.drawingCtx.lineJoin = 'round';
        this.clearCanvas();
    }
    
    displayCurrentQuestion() {
        if (this.currentQuestionIndex < this.questions.length) {
            const question = this.questions[this.currentQuestionIndex];
            this.questionText.textContent = question.question;
            this.currentLevel = question.level;
            this.currentLevelSpan.textContent = this.currentLevel;
            
            // Update progress bar
            const progress = ((this.currentQuestionIndex + 1) / this.questions.length) * 100;
            this.progressBar.style.width = `${progress}%`;
            this.progressText.textContent = `${Math.round(progress)}%`;
            
            // Show hint button if hint is available
            if (question.hint) {
                this.showHintBtn.style.display = 'inline-block';
                this.hintText.textContent = question.hint;
            } else {
                this.showHintBtn.style.display = 'none';
            }
            
            // Hide hint area initially
            this.hintArea.style.display = 'none';
            
            console.log(`Displaying question ${question.id}: ${question.question}`);
        }
    }
    
    async startCamera() {
        try {
            this.updateStatus('Starting camera...', 'info');
            this.startCameraBtn.disabled = true;
            
            await this.noseTracker.startCamera();
            
            this.updateStatus('Camera started! Position your face in view.', 'success');
            this.startCameraBtn.textContent = 'Camera Active';
            this.startCameraBtn.classList.remove('btn-success');
            this.startCameraBtn.classList.add('btn-secondary');
            
        } catch (error) {
            console.error('Camera error:', error);
            this.updateStatus('Error: ' + error.message, 'danger');
            this.startCameraBtn.disabled = false;
        }
    }
    
    startDrawing() {
        if (!this.faceDetected) {
            this.updateStatus('Please position your face in front of the camera first.', 'warning');
            return;
        }
        
        this.isDrawing = true;
        this.updateDrawingControls();
        this.updateStatus('Drawing started! Move your nose to draw.', 'success');
        this.drawingStatus.textContent = 'Drawing active';
        this.drawingStatus.className = 'badge bg-warning drawing-active';
        
        // Add visual feedback to canvas
        this.drawingCanvas.classList.add('success-animation');
        setTimeout(() => {
            this.drawingCanvas.classList.remove('success-animation');
        }, 600);
    }
    
    stopDrawing() {
        this.isDrawing = false;
        this.updateDrawingControls();
        this.updateStatus('Drawing stopped. You can submit or continue drawing.', 'info');
        this.drawingStatus.textContent = 'Drawing paused';
        this.drawingStatus.className = 'badge bg-secondary';
    }
    
    clearCanvas() {
        this.drawingCtx.clearRect(0, 0, this.drawingCanvas.width, this.drawingCanvas.height);
        this.drawingCtx.fillStyle = 'white';
        this.drawingCtx.fillRect(0, 0, this.drawingCanvas.width, this.drawingCanvas.height);
        this.updateStatus('Canvas cleared. Ready to draw again.', 'info');
        
        // Reset drawing state
        this.hasDrawnContent = false;
        this.updateDrawingControls();
    }
    
    drawLine(fromPos, toPos) {
        this.drawingCtx.beginPath();
        this.drawingCtx.moveTo(fromPos.x, fromPos.y);
        this.drawingCtx.lineTo(toPos.x, toPos.y);
        this.drawingCtx.stroke();
        
        // Mark that we have drawn content
        this.hasDrawnContent = true;
        this.updateDrawingControls();
    }
    
    async submitDrawing() {
        if (this.currentQuestionIndex >= this.questions.length) {
            this.updateStatus('No more questions available.', 'warning');
            return;
        }
        
        this.submitDrawingBtn.disabled = true;
        this.updateStatus('Evaluating your drawing...', 'info');
        
        try {
            // Get canvas image as base64
            const imageData = this.drawingCanvas.toDataURL('image/png');
            
            // Get correct answer
            const currentQuestion = this.questions[this.currentQuestionIndex];
            
            // Submit to backend
            const response = await fetch('/evaluate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    image: imageData,
                    answer: currentQuestion.answer,
                    level: this.currentLevel
                })
            });
            
            if (!response.ok) {
                throw new Error('Failed to evaluate drawing');
            }
            
            const result = await response.json();
            this.showResults(result, currentQuestion);
            
        } catch (error) {
            console.error('Evaluation error:', error);
            this.updateStatus('Error evaluating drawing. Please try again.', 'danger');
            this.submitDrawingBtn.disabled = false;
        }
    }
    
    showResults(result, question) {
        const resultsContent = document.getElementById('results-content');
        const resultsTitle = document.getElementById('resultsTitle');
        function getStarString(stars) {
            return '★'.repeat(stars) + '☆'.repeat(5 - stars);
        }
        if (result.is_correct) {
            resultsTitle.textContent = '🎉 Correct!';
            resultsTitle.className = 'modal-title text-success';
            resultsContent.innerHTML = `
                <div class="text-success mb-3">
                    <i class="fas fa-check-circle fa-3x"></i>
                </div>
                <h4>Fantastic work!</h4>
                <p>You drew "${question.answer}" perfectly!</p>
                <p class="small text-muted">
                    Stars: ${getStarString(result.stars || 0)}<br>
                    Accuracy: ${result.score !== undefined ? result.score + '%' : ''}
                </p>
            `;
            this.nextQuestionBtn.style.display = 'inline-block';
            this.tryAgainBtn.style.display = 'none';
            this.speak('Excellent! You got it right!');
        } else {
            resultsTitle.textContent = '🤔 Try Again!';
            resultsTitle.className = 'modal-title text-warning';
            resultsContent.innerHTML = `
                <div class="text-warning mb-3">
                    <i class="fas fa-redo-alt fa-3x"></i>
                </div>
                <h4>Nice try!</h4>
                <p>You're doing great! Let's try drawing it again!</p>
                <p class="small text-muted">
                    Stars: ${getStarString(result.stars || 0)}<br>
                    Accuracy: ${result.score !== undefined ? result.score + '%' : ''}
                </p>
            `;
            this.nextQuestionBtn.style.display = 'none';
            this.tryAgainBtn.style.display = 'inline-block';
            this.speak('Good try! Let\'s try again!');
        }
        this.resultsModal.show();
    }
    
    nextQuestion() {
        this.currentQuestionIndex++;
        
        if (this.currentQuestionIndex >= this.questions.length) {
            // Game completed
            this.showGameComplete();
        } else {
            this.displayCurrentQuestion();
            this.clearCanvas();
            this.resultsModal.hide();
            this.updateStatus('New question loaded! Start drawing when ready.', 'success');
            this.speakQuestion(); // Automatically speak new question
        }
    }
    
    tryAgain() {
        this.clearCanvas();
        this.resultsModal.hide();
        this.updateStatus('Try again! You can do it!', 'info');
    }
    
    showGameComplete() {
        const resultsContent = document.getElementById('results-content');
        const resultsTitle = document.getElementById('resultsTitle');
        
        resultsTitle.textContent = '🏆 Game Complete!';
        resultsTitle.className = 'modal-title text-success';
        
        resultsContent.innerHTML = `
            <div class="text-success mb-3">
                <i class="fas fa-trophy fa-3x"></i>
            </div>
            <h4>Congratulations!</h4>
            <p>You completed all ${this.questions.length} questions!</p>
            <p>You're amazing at drawing with your nose!</p>
        `;
        
        this.nextQuestionBtn.style.display = 'none';
        this.tryAgainBtn.textContent = 'Play Again';
        this.tryAgainBtn.style.display = 'inline-block';
        this.tryAgainBtn.onclick = () => this.restartGame();
        
        this.speak('Congratulations! You completed the game!');
    }
    
    restartGame() {
        this.currentQuestionIndex = 0;
        this.displayCurrentQuestion();
        this.clearCanvas();
        this.resultsModal.hide();
        this.updateStatus('Game restarted! Ready for a new challenge?', 'success');
        this.tryAgainBtn.onclick = () => this.tryAgain(); // Reset button function
    }
    
    speakQuestion() {
        if (this.currentQuestionIndex < this.questions.length) {
            const question = this.questions[this.currentQuestionIndex];
            this.speak(question.question);
        }
    }
    
    showHint() {
        if (this.currentQuestionIndex < this.questions.length) {
            const question = this.questions[this.currentQuestionIndex];
            if (question.hint) {
                this.hintArea.style.display = 'block';
                this.speak(`Here's a hint: ${question.hint}`);
            }
        }
    }
    
    speak(text) {
        // Try ResponsiveVoice first
        if (typeof responsiveVoice !== 'undefined' && responsiveVoice.voiceSupport()) {
            responsiveVoice.speak(text, "UK English Female", {
                rate: 0.8,
                pitch: 1.1,
                volume: 0.8
            });
        } 
        // Fallback to Web Speech API
        else if ('speechSynthesis' in window) {
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.rate = 0.8;
            utterance.pitch = 1.1;
            utterance.volume = 0.8;
            
            // Try to use a female voice if available
            const voices = speechSynthesis.getVoices();
            const femaleVoice = voices.find(voice => 
                voice.name.toLowerCase().includes('female') || 
                voice.name.toLowerCase().includes('woman') ||
                voice.name.toLowerCase().includes('zira') ||
                voice.name.toLowerCase().includes('sara')
            );
            
            if (femaleVoice) {
                utterance.voice = femaleVoice;
            }
            
            speechSynthesis.speak(utterance);
        } else {
            console.log('Text-to-speech not available:', text);
        }
    }
    
    updateStatus(message, type = 'info') {
        this.statusMessage.textContent = message;
        this.statusMessage.className = `alert alert-${type}`;
        console.log(`Status (${type}): ${message}`);
    }
    
    updateNoseStatus(detected) {
        if (detected) {
            this.noseStatus.textContent = 'Nose detected';
            this.noseStatus.className = 'badge bg-success nose-detected';
        } else {
            this.noseStatus.textContent = 'Nose not detected';
            this.noseStatus.className = 'badge bg-danger nose-not-detected';
        }
    }
    
    initializeSpeechSynthesis() {
        // Load voices for Web Speech API
        if ('speechSynthesis' in window) {
            const loadVoices = () => {
                const voices = speechSynthesis.getVoices();
                console.log('Available voices:', voices.map(v => v.name));
            };
            
            speechSynthesis.onvoiceschanged = loadVoices;
            loadVoices();
        }
    }
    
    updateDrawingControls() {
        const cameraActive = this.noseTracker.isReady();
        
        this.startDrawingBtn.disabled = !cameraActive || !this.faceDetected || this.isDrawing;
        this.stopDrawingBtn.disabled = !this.isDrawing;
        this.submitDrawingBtn.disabled = !cameraActive || this.isDrawing || !this.hasDrawnContent;
    }
}

// Initialize the game when the page loads
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, initializing NoseDraw Game...');
    window.noseDrawGame = new NoseDrawGame();
});
