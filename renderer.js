class PrecisionStopwatch {
    constructor() {
        this.startTime = 0;
        this.elapsedTime = 0;
        this.isRunning = false;
        this.animationFrame = null;
        
        // DOM elements
        this.timeDisplay = document.getElementById('timeDisplay');
        this.statusIndicator = document.getElementById('statusIndicator');
        this.container = document.getElementById('container');
        this.instructions = document.getElementById('instructions');
        this.exitButton = document.getElementById('exitButton');
        
        // Mouse state management
        this.mouseState = 'idle'; // 'idle', 'pressed', 'dragging', 'long-pressing'
        this.longPressTimer = null;
        this.longPressDelay = 500; // 500ms for long press
        
        // Drag detection
        this.dragStartPos = { x: 0, y: 0 };
        this.lastMousePos = { x: 0, y: 0 }; // Track last position for incremental movement
        this.dragThreshold = 5; // pixels before it's considered a drag
        this.mouseMoveHandler = null; // Store reference for cleanup
        
        // Font sizing optimization
        this.resizeObserver = null;
        this.lastTextLength = 0;
        this.cachedFontSize = null;
        
        this.init();
    }
    
    init() {
        console.log('Initializing stopwatch...');
        console.log('Container:', this.container);
        console.log('Time display:', this.timeDisplay);
        console.log('Exit button:', this.exitButton);
        console.log('Status indicator:', this.statusIndicator);
        console.log('Instructions:', this.instructions);
        
        this.updateDisplay();
        this.bindEvents();
        this.updateState('stopped');
        this.setupDynamicFontSizing();
    }
    
    setupDynamicFontSizing() {
        console.log('Setting up dynamic font sizing...');
        
        // Initial sizing
        this.adjustFontSize();
        
        // Listen for Electron window resize events
        if (window.electronAPI && window.electronAPI.onWindowResized) {
            console.log('✅ Electron resize events enabled');
            window.electronAPI.onWindowResized(() => {
                console.log('🔵 Electron window resize event fired');
                this.cachedFontSize = null;
                setTimeout(() => this.adjustFontSize(), 10);
            });
        } else {
            console.log('❌ Electron resize events not available');
        }
        
        // Set up resize observer for the container
        if (window.ResizeObserver) {
            console.log('✅ ResizeObserver enabled');
            this.resizeObserver = new ResizeObserver((entries) => {
                console.log('🟡 ResizeObserver triggered, entries:', entries.length);
                this.cachedFontSize = null;
                this.adjustFontSize();
            });
            this.resizeObserver.observe(this.container);
        } else {
            console.log('❌ ResizeObserver not available');
        }
        
        // Fallback: listen for window resize events
        window.addEventListener('resize', () => {
            console.log('🟢 Window resize event fired');
            this.cachedFontSize = null;
            this.adjustFontSize();
        });
        
        console.log('Font sizing setup complete');
    }
    
    adjustFontSize() {
        // Use cached font size if available and no resize occurred
        if (this.cachedFontSize !== null) {
            this.timeDisplay.style.fontSize = this.cachedFontSize + 'px';
            return;
        }
        
        // Get actual container dimensions
        const containerRect = this.container.getBoundingClientRect();
        const containerWidth = containerRect.width - 40; // Account for padding and exit button
        const containerHeight = containerRect.height - 60; // Account for padding, status indicator, and instructions
        
        // Ensure we have valid dimensions
        if (containerWidth <= 0 || containerHeight <= 0) {
            setTimeout(() => this.adjustFontSize(), 50);
            return;
        }
        
        // Calculate font size to fill 80% of available space
        const targetWidth = containerWidth * 0.8;
        const targetHeight = containerHeight * 0.8;
        
        // Get current text content for measurement
        const currentText = this.timeDisplay.textContent || '00.00';
        
        // Create a temporary element to measure text with exact styles
        const tempElement = document.createElement('div');
        tempElement.style.position = 'absolute';
        tempElement.style.visibility = 'hidden';
        tempElement.style.whiteSpace = 'nowrap';
        tempElement.style.fontFamily = window.getComputedStyle(this.timeDisplay).fontFamily;
        tempElement.style.fontWeight = window.getComputedStyle(this.timeDisplay).fontWeight;
        tempElement.style.letterSpacing = window.getComputedStyle(this.timeDisplay).letterSpacing;
        tempElement.textContent = currentText;
        document.body.appendChild(tempElement);
        
        // Binary search for optimal font size
        let minSize = 12;
        let maxSize = Math.min(targetWidth * 0.8, targetHeight * 1.2); // Reasonable max based on target area
        let optimalSize = minSize;
        
        for (let i = 0; i < 25; i++) { // More iterations for better precision
            const fontSize = (minSize + maxSize) / 2;
            tempElement.style.fontSize = fontSize + 'px';
            
            const textWidth = tempElement.offsetWidth;
            const textHeight = tempElement.offsetHeight;
            
            if (textWidth <= targetWidth && textHeight <= targetHeight) {
                optimalSize = fontSize;
                minSize = fontSize;
            } else {
                maxSize = fontSize;
            }
            
            if (maxSize - minSize < 0.5) break;
        }
        
        // Clean up temporary element
        document.body.removeChild(tempElement);
        
        // Set final font size with a small buffer and cache it
        this.cachedFontSize = Math.max(12, Math.floor(optimalSize * 0.95));
        this.timeDisplay.style.fontSize = this.cachedFontSize + 'px';
        
        console.log('Font size adjusted to:', this.cachedFontSize, 'px for container:', containerWidth, 'x', containerHeight);
    }
    
    bindEvents() {
        // Mouse events
        this.container.addEventListener('mousedown', this.handleMouseDown.bind(this));
        this.container.addEventListener('mouseup', this.handleMouseUp.bind(this));
        this.container.addEventListener('mouseleave', this.handleMouseLeave.bind(this));
        
        // Touch events
        this.container.addEventListener('touchstart', this.handleMouseDown.bind(this));
        this.container.addEventListener('touchend', this.handleMouseUp.bind(this));
        this.container.addEventListener('touchcancel', this.handleMouseLeave.bind(this));
        
        // Debug hover events
        this.container.addEventListener('mouseenter', () => {
            console.log('Container mouse enter - exit button should appear');
        });
        
        this.container.addEventListener('mouseleave', () => {
            console.log('Container mouse leave - exit button should disappear');
        });
        
        // Exit button events (check if it exists first)
        if (this.exitButton) {
            console.log('Exit button found, adding event listeners');
            this.exitButton.addEventListener('click', this.handleExit.bind(this));
            this.exitButton.addEventListener('mousedown', (e) => e.stopPropagation());
            this.exitButton.addEventListener('mouseup', (e) => e.stopPropagation());
            
            // Debug exit button hover
            this.exitButton.addEventListener('mouseenter', () => {
                console.log('Exit button hovered');
            });
        } else {
            console.warn('Exit button not found in DOM');
        }
        
        // Keyboard events
        document.addEventListener('keydown', this.handleKeyDown.bind(this));
        
        // Prevent context menu
        this.container.addEventListener('contextmenu', (e) => e.preventDefault());
    }
    
    handleMouseDown(e) {
        e.preventDefault();
        
        // Don't start any actions if clicking on exit button
        if (e.target.closest('.exit-button')) return;
        
        // Set mouse state to pressed
        this.mouseState = 'pressed';
        
        // Store initial position (use screenX/Y for window movement)
        this.dragStartPos = { x: e.screenX, y: e.screenY };
        this.lastMousePos = { x: e.screenX, y: e.screenY };
        
        // Start long press timer
        this.longPressTimer = setTimeout(() => {
            if (this.mouseState === 'pressed') {
                this.mouseState = 'long-pressing';
                this.container.classList.add('long-pressing');
                console.log('Long press detected - resetting stopwatch');
                this.reset();
            }
        }, this.longPressDelay);
        
        // Add mouse move listener
        this.mouseMoveHandler = this.handleMouseMove.bind(this);
        document.addEventListener('mousemove', this.mouseMoveHandler);
        
        // Add document mouse up listener to handle mouse up outside container
        this.documentMouseUpHandler = this.handleDocumentMouseUp.bind(this);
        document.addEventListener('mouseup', this.documentMouseUpHandler, { once: true });
    }
    
    handleMouseMove(e) {
        if (this.mouseState !== 'pressed' && this.mouseState !== 'dragging') return;
        
        // Calculate movement from start position
        const deltaX = e.screenX - this.dragStartPos.x;
        const deltaY = e.screenY - this.dragStartPos.y;
        const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
        
        // If we've moved beyond the threshold, start dragging
        if (distance > this.dragThreshold && this.mouseState === 'pressed') {
            this.mouseState = 'dragging';
            
            // Cancel long press since we're dragging
            if (this.longPressTimer) {
                clearTimeout(this.longPressTimer);
                this.longPressTimer = null;
            }
            
            // Remove long-pressing visual feedback
            this.container.classList.remove('long-pressing');
            
            console.log('Drag started');
        }
        
        // If we're in dragging state, move the window
        if (this.mouseState === 'dragging' && window.electronAPI && window.electronAPI.moveWindow) {
            // Calculate incremental movement from last mouse position
            const incrementalDeltaX = e.screenX - this.lastMousePos.x;
            const incrementalDeltaY = e.screenY - this.lastMousePos.y;
            
            // Only move if there's actual movement
            if (incrementalDeltaX !== 0 || incrementalDeltaY !== 0) {
                console.log(`Moving window by: (${incrementalDeltaX}, ${incrementalDeltaY})`);
                window.electronAPI.moveWindow(incrementalDeltaX, incrementalDeltaY);
                
                // Update last mouse position for next movement
                this.lastMousePos = { x: e.screenX, y: e.screenY };
            }
        }
    }
    
    handleDocumentMouseUp(e) {
        this.handleMouseUp(e);
    }
    
    handleMouseLeave(e) {
        // Clean up drag state when mouse leaves container
        this.cleanupMouseState();
    }
    
    handleMouseUp(e) {
        // Only trigger click if we're still in pressed state (no drag, no long press)
        if (this.mouseState === 'pressed') {
            this.handleClick();
        }
        
        // Clean up mouse state
        this.cleanupMouseState();
    }
    
    cleanupMouseState() {
        // Clear long press timer
        if (this.longPressTimer) {
            clearTimeout(this.longPressTimer);
            this.longPressTimer = null;
        }
        
        // Remove event listeners
        if (this.mouseMoveHandler) {
            document.removeEventListener('mousemove', this.mouseMoveHandler);
            this.mouseMoveHandler = null;
        }
        
        if (this.documentMouseUpHandler) {
            document.removeEventListener('mouseup', this.documentMouseUpHandler);
            this.documentMouseUpHandler = null;
        }
        
        // Remove visual feedback
        this.container.classList.remove('long-pressing');
        
        // Reset mouse state
        this.mouseState = 'idle';
        this.dragStartPos = { x: 0, y: 0 };
        this.lastMousePos = { x: 0, y: 0 };
        
        console.log('Mouse state cleaned up');
    }
    
    handleClick() {
        if (!this.isRunning) {
            // Start or resume
            this.start();
        } else {
            // Stop/pause
            this.stop();
        }
    }
    
    handleKeyDown(e) {
        switch(e.code) {
            case 'Space':
                e.preventDefault();
                this.handleClick();
                break;
            case 'KeyR':
                this.reset();
                break;
            case 'Escape':
                this.handleExit();
                break;
        }
    }
    
    handleExit() {
        // Close the application using the secure API
        if (window.electronAPI) {
            window.electronAPI.closeWindow();
        } else {
            // Fallback for development
            window.close();
        }
    }
    
    start() {
        if (this.elapsedTime === 0) {
            // Starting fresh
            this.startTime = performance.now();
        } else {
            // Resuming from pause
            this.startTime = performance.now() - this.elapsedTime;
        }
        
        this.isRunning = true;
        this.updateState('running');
        this.animate();
    }
    
    stop() {
        this.isRunning = false;
        this.updateState('paused');
        
        if (this.animationFrame) {
            cancelAnimationFrame(this.animationFrame);
            this.animationFrame = null;
        }
    }
    
    reset() {
        this.isRunning = false;
        this.elapsedTime = 0;
        this.startTime = 0;
        this.updateState('stopped');
        this.updateDisplay();
        
        if (this.animationFrame) {
            cancelAnimationFrame(this.animationFrame);
            this.animationFrame = null;
        }
    }
    
    animate() {
        if (!this.isRunning) return;
        
        this.elapsedTime = performance.now() - this.startTime;
        this.updateDisplay();
        
        this.animationFrame = requestAnimationFrame(() => this.animate());
    }
    
    updateDisplay() {
        const seconds = this.elapsedTime / 1000;
        const formattedTime = this.formatTime(seconds);
        this.timeDisplay.textContent = formattedTime;
        
        // Only adjust font size if the text length changed (different format)
        if (formattedTime.length !== this.lastTextLength) {
            this.lastTextLength = formattedTime.length;
            this.cachedFontSize = null; // Clear cache when text format changes
            requestAnimationFrame(() => this.adjustFontSize());
        }
    }
    
    formatTime(seconds) {
        // Format to show seconds with 2 decimal places
        const roundedSeconds = Math.round(seconds * 100) / 100;
        
        if (roundedSeconds >= 60) {
            // Show minutes:seconds.hundredths for times over 1 minute
            const minutes = Math.floor(roundedSeconds / 60);
            const remainingSeconds = roundedSeconds % 60;
            return `${minutes}:${remainingSeconds.toFixed(2).padStart(5, '0')}`;
        } else {
            // Show seconds.hundredths for times under 1 minute
            return roundedSeconds.toFixed(2).padStart(5, '0');
        }
    }
    
    updateState(state) {
        // Remove all state classes
        this.container.classList.remove('running', 'paused', 'stopped');
        this.statusIndicator.classList.remove('running', 'paused', 'stopped');
        
        // Add current state class
        this.container.classList.add(state);
        this.statusIndicator.classList.add(state);
        
        // Update instructions text
        switch(state) {
            case 'stopped':
                this.instructions.textContent = 'Click to start • Long press to reset • Esc to exit';
                break;
            case 'running':
                this.instructions.textContent = 'Click to stop • Long press to reset • Esc to exit';
                break;
            case 'paused':
                this.instructions.textContent = 'Click to resume • Long press to reset • Esc to exit';
                break;
        }
    }
}

// Initialize the stopwatch when the page loads
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, initializing stopwatch...');
    window.stopwatch = new PrecisionStopwatch();
});

// Backup initialization if DOMContentLoaded already fired
if (document.readyState === 'complete' || document.readyState === 'interactive') {
    console.log('DOM already ready, initializing stopwatch...');
    window.stopwatch = new PrecisionStopwatch();
}

// Handle window focus/blur for performance
let wasRunning = false;

window.addEventListener('blur', () => {
    // Optionally pause when window loses focus
    // Uncomment if you want this behavior:
    // if (window.stopwatch && window.stopwatch.isRunning) {
    //     wasRunning = true;
    //     window.stopwatch.pause();
    // }
});

window.addEventListener('focus', () => {
    // Optionally resume when window gains focus
    // if (window.stopwatch && wasRunning && window.stopwatch.isPaused) {
    //     window.stopwatch.resume();
    //     wasRunning = false;
    // }
});