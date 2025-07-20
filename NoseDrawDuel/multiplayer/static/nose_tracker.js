/**
 * NoseTracker - Handles nose tracking using MediaPipe FaceMesh
 */
class NoseTracker {
    constructor(videoElement, canvasElement) {
        this.faceMesh = null;
        this.camera = null;
        this.isInitialized = false;
        this.isTracking = false;
        this.nosePosition = { x: 0, y: 0 };
        this.lastNosePosition = { x: 0, y: 0 };
        this.onNoseMove = null; // Callback for nose movement
        this.onFaceDetected = null; // Callback for face detection
        
        // HTML elements
        this.video = videoElement;
        this.faceCanvas = canvasElement;
        this.faceCtx = this.faceCanvas.getContext('2d');
        
        this.initializeFaceMesh();
    }
    
    initializeFaceMesh() {
        console.log('Initializing MediaPipe FaceMesh...');
        
        // Wait for MediaPipe to be loaded
        const checkMediaPipe = () => {
            if (typeof FaceMesh !== 'undefined' && typeof Camera !== 'undefined') {
                this.faceMesh = new FaceMesh({
                    locateFile: (file) => {
                        return `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`;
                    }
                });
                
                this.faceMesh.setOptions({
                    maxNumFaces: 1,
                    refineLandmarks: true,
                    minDetectionConfidence: 0.5,
                    minTrackingConfidence: 0.5
                });
                
                this.faceMesh.onResults(this.onResults.bind(this));
                
                console.log('FaceMesh initialized successfully');
                this.isInitialized = true;
            } else {
                setTimeout(checkMediaPipe, 100);
            }
        };
        
        checkMediaPipe();
    }
    
    async startCamera() {
        try {
            console.log('Starting camera for nose tracking...');
            
            if (!this.isInitialized) {
                throw new Error('FaceMesh not initialized yet');
            }
            
            // Set canvas dimensions to match video
            this.faceCanvas.width = 320;
            this.faceCanvas.height = 240;
            
            this.camera = new Camera(this.video, {
                onFrame: async () => {
                    if (this.isTracking && this.faceMesh) {
                        await this.faceMesh.send({ image: this.video });
                    }
                },
                width: 320,
                height: 240
            });
            
            await this.camera.start();
            this.isTracking = true;
            
            console.log('Nose tracking camera started successfully');
            return true;
            
        } catch (error) {
            console.error('Error starting nose tracking camera:', error);
            return false;
        }
    }
    
    stopCamera() {
        console.log('Stopping nose tracking camera...');
        
        if (this.camera) {
            this.camera.stop();
        }
        
        this.isTracking = false;
        
        // Clear face canvas
        if (this.faceCtx) {
            this.faceCtx.clearRect(0, 0, this.faceCanvas.width, this.faceCanvas.height);
        }
        
        console.log('Nose tracking camera stopped');
    }
    
    onResults(results) {
        // Clear the face canvas
        this.faceCtx.clearRect(0, 0, this.faceCanvas.width, this.faceCanvas.height);
        
        if (results.multiFaceLandmarks && results.multiFaceLandmarks.length > 0) {
            const landmarks = results.multiFaceLandmarks[0];
            
            // Get nose tip (landmark 1)
            const noseTip = landmarks[1];
            
            if (noseTip) {
                // Convert normalized coordinates to canvas coordinates
                // Mirror the X coordinate to fix front camera mirroring issue
                const x = (1 - noseTip.x) * this.faceCanvas.width;
                const y = noseTip.y * this.faceCanvas.height;
                
                this.lastNosePosition = { ...this.nosePosition };
                this.nosePosition = { x, y };
                
                // Draw nose indicator on face canvas
                this.faceCtx.fillStyle = '#ff0000';
                this.faceCtx.beginPath();
                this.faceCtx.arc(x, y, 5, 0, 2 * Math.PI);
                this.faceCtx.fill();
                
                // Call nose move callback if provided
                if (this.onNoseMove) {
                    this.onNoseMove(this.nosePosition, this.lastNosePosition);
                }
                
                // Call face detected callback
                if (this.onFaceDetected) {
                    this.onFaceDetected(true);
                }
            }
        } else {
            // No face detected
            if (this.onFaceDetected) {
                this.onFaceDetected(false);
            }
        }
    }
    
    setNoseMoveCallback(callback) {
        this.onNoseMove = callback;
    }
    
    setFaceDetectedCallback(callback) {
        this.onFaceDetected = callback;
    }
    
    isReady() {
        return this.isInitialized && this.isTracking;
    }
    
    getNosePosition() {
        return this.nosePosition;
    }
}

// Export for use in other files
window.NoseTracker = NoseTracker;