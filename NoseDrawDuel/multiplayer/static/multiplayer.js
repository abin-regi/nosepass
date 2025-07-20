class MultiplayerNoseGame {
    constructor() {
        this.gameState = null;
        this.currentStream = null;
        this.timer = null;
        this.timeLeft = 30;
        this.isDrawing = false;
        this.currentCanvas = null;
        this.currentContext = null;
        this.isTracking = false;
        this.lastNosePosition = null;
        this.calibrationCount = 0;
        this.isCalibrated = false;
        this.useFallback = true; // Start with mouse fallback
        this.noseTracker1 = null;
        this.noseTracker2 = null;
        this.currentNoseTracker = null;
        
        this.initializeGame();
    }

    async initializeGame() {
        console.log('Initializing multiplayer nose game...');
        
        this.setupEventListeners();
        this.setupCanvases();
        
        // Try to initialize MediaPipe but don't wait for it
        this.initializeMediaPipe().catch(() => {
            console.log('Using mouse/touch fallback for drawing');
        });
    }

    async initializeMediaPipe() {
        try {
            console.log('Initializing nose trackers...');
            
            // Wait for MediaPipe to be available
            const waitForMediaPipe = () => {
                return new Promise((resolve) => {
                    const checkMediaPipe = () => {
                        if (typeof NoseTracker !== 'undefined' && typeof FaceMesh !== 'undefined') {
                            resolve();
                        } else {
                            setTimeout(checkMediaPipe, 100);
                        }
                    };
                    checkMediaPipe();
                });
            };
            
            await waitForMediaPipe();
            
            // Initialize nose trackers for both players
            const video1 = document.getElementById('player1-video');
            const canvas1 = document.getElementById('player1-face-canvas');
            const video2 = document.getElementById('player2-video');
            const canvas2 = document.getElementById('player2-face-canvas');
            
            this.noseTracker1 = new NoseTracker(video1, canvas1);
            this.noseTracker2 = new NoseTracker(video2, canvas2);
            
            console.log('Nose trackers initialized successfully');
            this.useFallback = false; // Switch to nose tracking
            
        } catch (error) {
            console.log('MediaPipe initialization failed, using mouse fallback:', error);
            this.useFallback = true;
        }
    }

    setupEventListeners() {
        // Setup screen buttons
        document.getElementById('start-game-btn').addEventListener('click', () => this.startGame());
        document.getElementById('next-question-btn').addEventListener('click', () => this.nextQuestion());
        document.getElementById('main-menu-btn').addEventListener('click', () => this.goToMainMenu());
        
        // Setup player-specific buttons
        document.getElementById('player1-submit-btn').addEventListener('click', () => this.submitDrawing(1));
        document.getElementById('player1-clear-btn').addEventListener('click', () => this.clearCanvas(1));
        document.getElementById('player2-submit-btn').addEventListener('click', () => this.submitDrawing(2));
        document.getElementById('player2-clear-btn').addEventListener('click', () => this.clearCanvas(2));
        
        // Enable accessibility - keyboard navigation
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                const activeElement = document.activeElement;
                if (activeElement.tagName === 'BUTTON') {
                    activeElement.click();
                }
            }
            if (e.key === 'Escape') {
                this.clearCanvas();
            }
        });
    }

    setupCanvases() {
        // Setup both canvases
        const canvas1 = document.getElementById('player1-canvas');
        const canvas2 = document.getElementById('player2-canvas');
        
        [canvas1, canvas2].forEach(canvas => {
            canvas.width = 300;
            canvas.height = 300;
            
            const ctx = canvas.getContext('2d');
            ctx.strokeStyle = '#000000';
            ctx.lineWidth = 4;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            
            // Add mouse and touch events for drawing
            this.addDrawingEvents(canvas);
        });
    }

    addDrawingEvents(canvas) {
        let isDrawing = false;
        let lastX = 0;
        let lastY = 0;
        
        // Mouse events
        canvas.addEventListener('mousedown', (e) => {
            if (this.isCurrentPlayerCanvas(canvas)) {
                isDrawing = true;
                const rect = canvas.getBoundingClientRect();
                lastX = e.clientX - rect.left;
                lastY = e.clientY - rect.top;
            }
        });
        
        canvas.addEventListener('mousemove', (e) => {
            if (isDrawing && this.isCurrentPlayerCanvas(canvas)) {
                const rect = canvas.getBoundingClientRect();
                const currentX = e.clientX - rect.left;
                const currentY = e.clientY - rect.top;
                
                this.drawLine(canvas, lastX, lastY, currentX, currentY);
                
                lastX = currentX;
                lastY = currentY;
            }
        });
        
        canvas.addEventListener('mouseup', () => {
            isDrawing = false;
        });
        
        canvas.addEventListener('mouseout', () => {
            isDrawing = false;
        });
        
        // Touch events for mobile accessibility
        canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            if (this.isCurrentPlayerCanvas(canvas)) {
                const touch = e.touches[0];
                const rect = canvas.getBoundingClientRect();
                lastX = touch.clientX - rect.left;
                lastY = touch.clientY - rect.top;
                isDrawing = true;
            }
        });
        
        canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
            if (isDrawing && this.isCurrentPlayerCanvas(canvas)) {
                const touch = e.touches[0];
                const rect = canvas.getBoundingClientRect();
                const currentX = touch.clientX - rect.left;
                const currentY = touch.clientY - rect.top;
                
                this.drawLine(canvas, lastX, lastY, currentX, currentY);
                
                lastX = currentX;
                lastY = currentY;
            }
        });
        
        canvas.addEventListener('touchend', () => {
            isDrawing = false;
        });
    }

    isCurrentPlayerCanvas(canvas) {
        if (!this.gameState) return false;
        
        const canvasId = canvas.id;
        const currentTurn = this.gameState.current_turn;
        
        return (currentTurn === 1 && canvasId === 'player1-canvas') ||
               (currentTurn === 2 && canvasId === 'player2-canvas');
    }

    drawLine(canvas, x1, y1, x2, y2) {
        const ctx = canvas.getContext('2d');
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
    }

    async startGame() {
        const player1Name = document.getElementById('player1Name').value.trim() || 'Player 1';
        const player2Name = document.getElementById('player2Name').value.trim() || 'Player 2';
        
        this.showLoading(true);
        
        try {
            const response = await fetch('/multiplayer/start_game', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    player1_name: player1Name,
                    player2_name: player2Name
                })
            });
            
            const data = await response.json();
            
            if (data.success) {
                this.gameState = {
                    current_question: data.current_question,
                    current_turn: data.current_turn,
                    game_status: data.game_status,
                    player1_name: player1Name,
                    player2_name: player2Name
                };
                
                this.updatePlayerNames(player1Name, player2Name);
                this.updateQuestion(data.current_question);
                this.switchToGameScreen();
                this.setupCamera();
                this.startPlayerTurn();
            } else {
                this.showAlert('Error starting game: ' + data.error, 'danger');
            }
        } catch (error) {
            console.error('Error starting game:', error);
            this.showAlert('Failed to start game. Please try again.', 'danger');
            
            // Reset game state on error
            this.gameState = null;
        } finally {
            this.showLoading(false);
        }
    }

    updatePlayerNames(player1Name, player2Name) {
        document.getElementById('player1-display').textContent = player1Name;
        document.getElementById('player2-display').textContent = player2Name;
        document.getElementById('result-player1-name').textContent = player1Name;
        document.getElementById('result-player2-name').textContent = player2Name;
    }

    updateQuestion(question) {
        document.getElementById('current-question').textContent = question;
    }

    switchToGameScreen() {
        document.getElementById('setup-screen').classList.add('d-none');
        document.getElementById('game-screen').classList.remove('d-none');
        document.getElementById('results-screen').classList.add('d-none');
    }

    switchToResultsScreen() {
        document.getElementById('setup-screen').classList.add('d-none');
        document.getElementById('game-screen').classList.add('d-none');
        document.getElementById('results-screen').classList.remove('d-none');
    }

    switchToSetupScreen() {
        document.getElementById('setup-screen').classList.remove('d-none');
        document.getElementById('game-screen').classList.add('d-none');
        document.getElementById('results-screen').classList.add('d-none');
    }

    async setupCamera() {
        try {
            this.currentStream = await navigator.mediaDevices.getUserMedia({ 
                video: { 
                    width: 320, 
                    height: 240,
                    facingMode: 'user'
                } 
            });
            
            this.updateCameraForCurrentPlayer();
            
            // Setup nose tracking if available
            if (!this.useFallback && this.noseTracker1 && this.noseTracker2) {
                this.setupNoseTracking();
            }
        } catch (error) {
            console.error('Error accessing camera:', error);
            this.showAlert('Camera not available. You can still draw with your mouse or finger!', 'info');
        }
    }

    updateCameraForCurrentPlayer() {
        const video1 = document.getElementById('player1-video');
        const video2 = document.getElementById('player2-video');
        
        // Reset both videos
        video1.srcObject = null;
        video2.srcObject = null;
        
        if (this.gameState && this.currentStream) {
            const currentVideo = this.gameState.current_turn === 1 ? video1 : video2;
            currentVideo.srcObject = this.currentStream;
            
            // Update visual states
            this.updatePlayerVisualStates();
            
            // Start nose tracking for current player
            this.startNoseTrackingForCurrentPlayer();
        }
    }

    updatePlayerVisualStates() {
        const player1Area = document.getElementById('player1-area');
        const player2Area = document.getElementById('player2-area');
        const canvas1 = document.getElementById('player1-canvas');
        const canvas2 = document.getElementById('player2-canvas');
        const camera1Container = document.getElementById('player1-camera-container');
        const camera2Container = document.getElementById('player2-camera-container');
        
        if (this.gameState.current_turn === 1) {
            // Player 1 active
            player1Area.classList.add('active-player');
            player2Area.classList.remove('active-player');
            player2Area.classList.add('waiting-player');
            
            canvas1.style.pointerEvents = 'auto';
            canvas2.style.pointerEvents = 'none';
            
            // Remove highlighting - keep cameras normal
            camera1Container.classList.remove('active', 'waiting');
            camera2Container.classList.remove('active', 'waiting');
            
            // Enable player 1 buttons, disable player 2
            const p1Submit = document.getElementById('player1-submit-btn');
            const p1Clear = document.getElementById('player1-clear-btn');
            const p2Submit = document.getElementById('player2-submit-btn');
            const p2Clear = document.getElementById('player2-clear-btn');
            
            if (p1Submit) p1Submit.disabled = false;
            if (p1Clear) p1Clear.disabled = false;
            if (p2Submit) p2Submit.disabled = true;
            if (p2Clear) p2Clear.disabled = true;
            
            document.getElementById('turn-display').textContent = `${this.gameState.player1_name}'s Turn`;
        } else {
            // Player 2 active
            player2Area.classList.add('active-player');
            player1Area.classList.remove('active-player');
            player1Area.classList.add('waiting-player');
            
            canvas2.style.pointerEvents = 'auto';
            canvas1.style.pointerEvents = 'none';
            
            // Remove highlighting - keep cameras normal
            camera1Container.classList.remove('active', 'waiting');
            camera2Container.classList.remove('active', 'waiting');
            
            // Enable player 2 buttons, disable player 1
            const p1Submit = document.getElementById('player1-submit-btn');
            const p1Clear = document.getElementById('player1-clear-btn');
            const p2Submit = document.getElementById('player2-submit-btn');
            const p2Clear = document.getElementById('player2-clear-btn');
            
            if (p2Submit) p2Submit.disabled = false;
            if (p2Clear) p2Clear.disabled = false;
            if (p1Submit) p1Submit.disabled = true;
            if (p1Clear) p1Clear.disabled = true;
            
            document.getElementById('turn-display').textContent = `${this.gameState.player2_name}'s Turn`;
        }
    }

    startPlayerTurn() {
        this.timeLeft = 30;
        this.updateCameraForCurrentPlayer();
        this.clearCurrentCanvas();
        this.startTimer();
        
        // Reset calibration for new player
        this.calibrationCount = 0;
        this.isCalibrated = false;
        this.lastNosePosition = null;
        this.isTracking = true;
        
        // Enable buttons for current player
        const currentPlayer = this.gameState.current_turn;
        const submitBtn = document.getElementById(`player${currentPlayer}-submit-btn`);
        const clearBtn = document.getElementById(`player${currentPlayer}-clear-btn`);
        
        if (submitBtn) submitBtn.disabled = false;
        if (clearBtn) clearBtn.disabled = false;
        
        // Add visual countdown effect
        this.addTimerEffects();
        
        // Update turn display with calibration message if using nose tracking
        const turnDisplay = document.getElementById('turn-display');
        if (turnDisplay && this.gameState) {
            const playerName = this.gameState.current_turn === 1 ? 
                this.gameState.player1_name : this.gameState.player2_name;
            
            if (!this.useFallback) {
                turnDisplay.textContent = `${playerName} - Move your nose to calibrate...`;
            } else {
                turnDisplay.textContent = `${playerName}'s Turn - Start Drawing!`;
            }
        }
    }

    startTimer() {
        this.updateTimerDisplay();
        
        this.timer = setInterval(() => {
            this.timeLeft--;
            this.updateTimerDisplay();
            
            if (this.timeLeft <= 0) {
                this.timeUp();
            } else if (this.timeLeft <= 10) {
                // Add urgency visual effects
                document.getElementById('timer-display').style.color = '#dc3545';
                document.querySelector('.timer-circle').classList.add('timer-urgent');
            }
        }, 1000);
    }

    updateTimerDisplay() {
        document.getElementById('timer-display').textContent = this.timeLeft;
        
        // Reset urgency styles when time is reset
        if (this.timeLeft > 10) {
            document.getElementById('timer-display').style.color = '#ffffff';
            document.querySelector('.timer-circle').classList.remove('timer-urgent');
        }
    }

    addTimerEffects() {
        const timerCircle = document.querySelector('.timer-circle');
        timerCircle.style.animation = 'none';
        timerCircle.offsetHeight; // Trigger reflow
        timerCircle.style.animation = 'countdown 30s linear';
    }

    timeUp() {
        clearInterval(this.timer);
        this.submitDrawing();
    }

    async submitDrawing(player = null) {
        if (!this.gameState) return;
        
        const currentPlayer = player || this.gameState.current_turn;
        
        clearInterval(this.timer);
        this.isTracking = false; // Stop nose tracking
        
        // Disable current player buttons
        const submitBtn = document.getElementById(`player${currentPlayer}-submit-btn`);
        const clearBtn = document.getElementById(`player${currentPlayer}-clear-btn`);
        
        if (submitBtn) submitBtn.disabled = true;
        if (clearBtn) clearBtn.disabled = true;
        
        this.showLoading(true);
        
        try {
            // Get the correct canvas for the player
            const canvas = document.getElementById(`player${currentPlayer}-canvas`);
            const drawingData = canvas.toDataURL('image/png');
            
            const response = await fetch('/multiplayer/submit_drawing', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    drawing_data: drawingData,
                    player: currentPlayer
                })
            });
            
            const data = await response.json();
            
            if (data.success) {
                // Update scores
                document.getElementById(`player${currentPlayer}-score`).textContent = Math.round(data.score);
                
                if (data.game_status === 'finished') {
                    this.showResults(data);
                } else {
                    // Switch to next player
                    this.gameState.current_turn = data.current_turn;
                    this.gameState.game_status = data.game_status;
                    this.startPlayerTurn();
                }
            } else {
                this.showAlert('Error submitting drawing: ' + data.error, 'danger');
            }
        } catch (error) {
            console.error('Error submitting drawing:', error);
            this.showAlert('Failed to submit drawing. Please try again.', 'danger');
            
            // Re-enable buttons on error
            const submitBtn = document.getElementById(`player${currentPlayer}-submit-btn`);
            const clearBtn = document.getElementById(`player${currentPlayer}-clear-btn`);
            
            if (submitBtn) submitBtn.disabled = false;
            if (clearBtn) clearBtn.disabled = false;
        } finally {
            this.showLoading(false);
        }
    }

    showResults(data) {
        // Update final scores
        document.getElementById('result-player1-score').textContent = data.player1_score;
        document.getElementById('result-player2-score').textContent = data.player2_score;
        
        // Determine winner and show appropriate message
        let winnerText = '';
        if (data.winner === 1) {
            winnerText = `🎉 ${this.gameState.player1_name} Wins! 🎉`;
        } else if (data.winner === 2) {
            winnerText = `🎉 ${this.gameState.player2_name} Wins! 🎉`;
        } else {
            winnerText = '🤝 It\'s a Tie! Great Job Both! 🤝';
        }
        
        document.querySelector('.winner-text').textContent = winnerText;
        
        // Add encouraging feedback
        document.getElementById('result-player1-feedback').textContent = this.getFeedback(data.player1_score);
        document.getElementById('result-player2-feedback').textContent = this.getFeedback(data.player2_score);
        
        this.switchToResultsScreen();
        
        // Add confetti effect for celebration
        this.showConfetti();
    }

    getFeedback(score) {
        if (score >= 90) return "Amazing! Perfect drawing! 🌟";
        if (score >= 80) return "Great job! Almost perfect! 🎉";
        if (score >= 70) return "Good work! Keep practicing! 👍";
        if (score >= 60) return "Nice try! You're getting better! 😊";
        if (score >= 50) return "Good effort! Practice makes perfect! 💪";
        return "Keep trying! You can do it! 🌈";
    }

    showConfetti() {
        // Simple confetti effect using CSS animation
        const confettiContainer = document.createElement('div');
        confettiContainer.className = 'confetti-container';
        confettiContainer.innerHTML = `
            <div class="confetti">🎉</div>
            <div class="confetti">🎊</div>
            <div class="confetti">⭐</div>
            <div class="confetti">🌟</div>
            <div class="confetti">🎈</div>
        `;
        
        document.body.appendChild(confettiContainer);
        
        // Remove confetti after animation
        setTimeout(() => {
            if (confettiContainer.parentNode) {
                confettiContainer.parentNode.removeChild(confettiContainer);
            }
        }, 3000);
    }

    clearCanvas(player = null) {
        if (!this.gameState) return;
        
        const currentPlayer = player || this.gameState.current_turn;
        this.clearPlayerCanvas(currentPlayer);
    }

    clearPlayerCanvas(player) {
        const canvas = document.getElementById(`player${player}-canvas`);
        
        if (canvas) {
            const ctx = canvas.getContext('2d');
            ctx.clearRect(0, 0, canvas.width, canvas.height);
        }
    }

    clearCurrentCanvas() {
        if (this.gameState) {
            this.clearPlayerCanvas(this.gameState.current_turn);
        }
    }

    async nextQuestion() {
        this.showLoading(true);
        
        try {
            const response = await fetch('/multiplayer/next_question', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                }
            });
            
            const data = await response.json();
            
            if (data.success) {
                this.gameState.current_question = data.current_question;
                this.gameState.game_status = data.game_status;
                this.gameState.current_turn = data.current_turn;
                
                this.updateQuestion(data.current_question);
                this.switchToGameScreen();
                this.startPlayerTurn();
            } else {
                this.showAlert('Error starting next question: ' + data.error, 'danger');
            }
        } catch (error) {
            console.error('Error starting next question:', error);
            this.showAlert('Failed to start next question. Please try again.', 'danger');
        } finally {
            this.showLoading(false);
        }
    }

    goToMainMenu() {
        this.endGame();
        window.location.href = '/';
    }

    async endGame() {
        try {
            await fetch('/multiplayer/end_game', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                }
            });
        } catch (error) {
            console.error('Error ending game:', error);
        }
        
        // Stop camera stream
        if (this.currentStream) {
            this.currentStream.getTracks().forEach(track => track.stop());
            this.currentStream = null;
        }
        
        // Stop nose tracking
        if (this.currentNoseTracker) {
            this.currentNoseTracker.stopCamera();
        }
        
        // Reset game state
        this.gameState = null;
        this.isTracking = false;
        clearInterval(this.timer);
    }

    setupNoseTracking() {
        if (!this.noseTracker1 || !this.noseTracker2) return;
        
        // Setup nose move callbacks for both players
        this.noseTracker1.setNoseMoveCallback((nosePos, lastPos) => {
            if (this.gameState && this.gameState.current_turn === 1 && this.isTracking) {
                this.handleNoseDrawing(nosePos, lastPos, 1);
            }
        });
        
        this.noseTracker2.setNoseMoveCallback((nosePos, lastPos) => {
            if (this.gameState && this.gameState.current_turn === 2 && this.isTracking) {
                this.handleNoseDrawing(nosePos, lastPos, 2);
            }
        });
    }

    handleNoseDrawing(nosePos, lastPos, player) {
        if (!this.isCalibrated) {
            this.calibrateNosePosition();
            return;
        }
        
        const canvas = document.getElementById(`player${player}-canvas`);
        if (!canvas) return;
        
        // Map nose position to canvas coordinates
        const canvasRect = canvas.getBoundingClientRect();
        const videoRect = document.getElementById(`player${player}-video`).getBoundingClientRect();
        
        // Scale nose position from video to canvas
        const scaleX = canvas.width / videoRect.width;
        const scaleY = canvas.height / videoRect.height;
        
        const canvasX = nosePos.x * scaleX;
        const canvasY = nosePos.y * scaleY;
        const lastCanvasX = lastPos.x * scaleX;
        const lastCanvasY = lastPos.y * scaleY;
        
        // Calculate movement distance to reduce noise
        const distance = Math.sqrt(
            Math.pow(canvasX - lastCanvasX, 2) + 
            Math.pow(canvasY - lastCanvasY, 2)
        );
        
        // Only draw if movement is significant but not too large (noise filtering)
        if (distance > 3 && distance < 30) {
            this.drawLine(canvas, lastCanvasX, lastCanvasY, canvasX, canvasY);
        }
    }

    calibrateNosePosition() {
        this.calibrationCount++;
        if (this.calibrationCount > 60) { // Calibrate for 60 frames (about 2 seconds)
            this.isCalibrated = true;
            console.log('Nose calibration complete');
            
            // Update UI to show calibration is done
            const turnDisplay = document.getElementById('turn-display');
            if (turnDisplay && this.gameState) {
                const playerName = this.gameState.current_turn === 1 ? 
                    this.gameState.player1_name : this.gameState.player2_name;
                turnDisplay.textContent = `${playerName}'s Turn - Move your nose to draw!`;
            }
        }
    }

    startNoseTrackingForCurrentPlayer() {
        if (this.useFallback || !this.noseTracker1 || !this.noseTracker2) return;
        
        // Stop previous tracking
        if (this.currentNoseTracker) {
            this.currentNoseTracker.stopCamera();
        }
        
        // Start tracking for current player
        if (this.gameState) {
            this.currentNoseTracker = this.gameState.current_turn === 1 ? 
                this.noseTracker1 : this.noseTracker2;
            
            if (this.currentNoseTracker) {
                this.currentNoseTracker.startCamera().catch(() => {
                    console.log('Nose tracking failed, using mouse fallback');
                    this.useFallback = true;
                });
            }
        }
    }

    showLoading(show) {
        const overlay = document.getElementById('loading-overlay');
        if (show) {
            overlay.classList.remove('d-none');
        } else {
            overlay.classList.add('d-none');
        }
    }

    showAlert(message, type = 'info') {
        // Create a simple alert banner
        const alertDiv = document.createElement('div');
        alertDiv.className = `alert alert-${type} alert-dismissible fade show position-fixed`;
        alertDiv.style.cssText = 'top: 20px; right: 20px; z-index: 9999; max-width: 400px;';
        alertDiv.innerHTML = `
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;
        
        document.body.appendChild(alertDiv);
        
        // Auto-remove after 5 seconds
        setTimeout(() => {
            if (alertDiv.parentNode) {
                alertDiv.parentNode.removeChild(alertDiv);
            }
        }, 5000);
    }
}

// Initialize the game when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new MultiplayerNoseGame();
});