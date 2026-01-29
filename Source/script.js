class SplineGenerator {
    constructor() {
        console.log('🚀 SplineGenerator v2.1 - Multi-Path System with Fixed Loading! 🚀');
        console.log('Timestamp:', new Date().toISOString());
        
        // Initialize in correct order
        this.initializeSettings();
        this.initializeElements();
        this.initializeCanvases();
        this.initializeEventListeners();
        
        this.currentTool = 'spline';
        this.isDrawing = false;
        this.isMouseDown = false;
        this.splinePoints = [];
        this.shapes = [];
        this.lastSampleTime = 0;
        this.selectedPoints = new Set(); // Track selected points
        this.lastSelectedIndex = -1; // For shift selection
        this.lastSnapIndicator = null; // For snap indicator cleanup
        this.hoveredPointIndex = -1; // Track hovered point for tooltip
        this.tooltipTimeout = null; // Timeout for tooltip delay
        
        // Reference path for visual aid when creating new paths
        this.referencePath = null; // Previous path to show as reference
        this.showReferencePath = false; // Flag to show/hide reference path
        
        // Animation properties
        this.isAnimating = false;
        this.isPaused = false;
        this.animationProgress = 0;
        this.animationStartTime = 0;
        this.animationRequestId = null;
        this.totalAnimationTime = 0;
        this.pausedTime = 0;
        
        // Draw grid after everything is initialized
        setTimeout(() => {
            this.drawGrid();
            this.updateTableHeaders();
            this.loadDarkModePreference();
            console.log('Grid drawn and dark mode loaded');
            console.log('Grid drawn');
        }, 100);
    }

    initializeElements() {
        console.log('Initializing elements...');
        
        // Canvas elements
        this.gridCanvas = document.getElementById('gridCanvas');
        this.shapeCanvas = document.getElementById('shapeCanvas');
        this.splineCanvas = document.getElementById('splineCanvas');
        this.animationCanvas = document.getElementById('animationCanvas');
        
        if (!this.gridCanvas || !this.shapeCanvas || !this.splineCanvas || !this.animationCanvas) {
            console.error('Canvas elements not found!');
            return;
        }
        
        // UI elements
        this.settingsModal = document.getElementById('settingsModal');
        this.coordinatesDisplay = document.getElementById('coordinates');
        
        // Buttons
        this.settingsBtn = document.getElementById('settingsBtn');
        this.saveBtn = document.getElementById('saveBtn');
        this.loadBtn = document.getElementById('loadBtn');
        this.fileInput = document.getElementById('fileInput');
        this.clearSplineBtn = document.getElementById('clearSplineBtn');
        this.clearShapesBtn = document.getElementById('clearShapesBtn');
        this.toolButtons = document.querySelectorAll('.tool-btn');
        this.saveSettingsBtn = document.getElementById('saveSettings');
        this.resetSettingsBtn = document.getElementById('resetSettings');
        this.closeBtn = document.querySelector('.close');
        
        // Animation buttons
        this.playBtn = document.getElementById('playBtn');
        this.pauseBtn = document.getElementById('pauseBtn');
        this.stopBtn = document.getElementById('stopBtn');
        this.timeDisplay = document.getElementById('timeDisplay');
        this.speedSlider = document.getElementById('speedSlider');
        this.speedDisplay = document.getElementById('speedDisplay');
        this.progressSlider = document.getElementById('progressSlider');
        
        // Export elements
        this.robotType = document.getElementById('robotType');
        this.exportBtn = document.getElementById('exportBtn');
        
        // Program naming elements
        this.programBasename = document.getElementById('programBasename');
        this.programIndex = document.getElementById('programIndex');
        this.copyBtn = document.getElementById('copyBtn');
        this.programDescription = document.getElementById('programDescription');
        
        // Dark mode button
        this.darkModeBtn = document.getElementById('darkModeBtn');
        
        // Side panel elements
        this.tabButtons = document.querySelectorAll('.tab-btn');
        this.splineTableBody = document.getElementById('splineTableBody');
        this.shapesTableBody = document.getElementById('shapesTableBody');
        this.selectAllPointsBtn = document.getElementById('selectAllPoints');
        this.bulkVelocityInput = document.getElementById('bulkVelocity');
        this.applyBulkVelocityBtn = document.getElementById('applyBulkVelocity');
        this.bulkTransformXInput = document.getElementById('bulkX');
        this.applySetBulkXBtn = document.getElementById('setBulkX');
        this.applyOffsetBulkXBtn = document.getElementById('offsetBulkX');
        this.bulkTransformYInput = document.getElementById('bulkY');
        this.applySetBulkYBtn = document.getElementById('setBulkY');
        this.applyOffsetBulkYBtn = document.getElementById('offsetBulkY');
        this.deleteSelectedBtn = document.getElementById('deleteSelectedBtn');
        this.pointCountDisplay = document.getElementById('pointCount');
        this.selectedCountDisplay = document.getElementById('selectedCount');
        this.shapesCountDisplay = document.getElementById('shapesCount');
        this.splineLengthDisplay = document.getElementById('splineLength');
        this.selectSequenceBtn = document.getElementById('selectSequenceBtn');
        this.sequencesContainer = document.getElementById('sequencesContainer');
        this.sequencesCountDisplay = document.getElementById('sequencesCount');
        this.refreshSequencesBtn = document.getElementById('refreshSequencesBtn');
        
        console.log('Elements initialized successfully');
    }

    // Get theme colors
    getThemeColors() {
        const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
        return {
            canvasBg: isDark ? '#1e1e1e' : '#ffffff',
            gridColor: isDark ? '#404040' : '#e8e8e8',
            axisColor: isDark ? '#606060' : '#333333',
            textColor: isDark ? '#e0e0e0' : '#333333',
            pointBorder: isDark ? '#e0e0e0' : '#333',
            pointFill: isDark ? '#404040' : 'white'
        };
    }

    initializeSettings() {
        this.settings = {
            minX: -100,
            maxX: 100,
            minY: -100,
            maxY: 100,
            gridSize: 10,
            snapSize: 1,
            enableSnap: true,
            pixelsPerMm: 1,
            samplingDistance: 2,
            splineSmoothing: 0.5,
            splineColor: '#ff0000',
            shapeColor: '#0066cc',
            xAxisLabel: 'X',
            yAxisLabel: 'Y',
            basename: 'program',
            maxProgramNum: 999
        };
        this.loadSettingsFromStorage();
        this.updateSettingsUI();
        
        // Initialize multiple paths storage
        this.programPaths = {}; // Object to store multiple paths indexed by program number
        this.currentProgramIndex = 1; // Currently selected program index
        
        // Playback control state
        this.playbackSpeed = 1.0;
        this.isManualSeeking = false;
        
        // Selection box state
        this.isSelectDragging = false;
        this.selectBoxStart = null;
        this.selectBoxEnd = null;
    }

    initializeCanvases() {
        console.log('Initializing canvases...');
        
        if (!this.gridCanvas || !this.shapeCanvas || !this.splineCanvas || !this.animationCanvas) {
            console.error('Cannot initialize canvases - elements not found');
            console.log('gridCanvas:', this.gridCanvas);
            console.log('shapeCanvas:', this.shapeCanvas);
            console.log('splineCanvas:', this.splineCanvas);
            console.log('animationCanvas:', this.animationCanvas);
            return;
        }
        
        [this.gridCanvas, this.shapeCanvas, this.splineCanvas, this.animationCanvas].forEach(canvas => {
            if (canvas) {
                canvas.style.display = 'block';
                canvas.style.position = 'absolute';
                canvas.style.top = '0';
                canvas.style.left = '0';
                
                // Disable pointer events on animation canvas
                if (canvas === this.animationCanvas) {
                    canvas.style.pointerEvents = 'none';
                    console.log('Disabled pointer events on animation canvas');
                }
            }
        });
        
        this.gridCtx = this.gridCanvas.getContext('2d');
        this.shapeCtx = this.shapeCanvas.getContext('2d');
        this.splineCtx = this.splineCanvas.getContext('2d');
        this.animationCtx = this.animationCanvas.getContext('2d');
        
        // Set canvas size
        this.canvasWidth = 1200;
        this.canvasHeight = 800;
        
        [this.gridCanvas, this.shapeCanvas, this.splineCanvas, this.animationCanvas].forEach(canvas => {
            canvas.width = this.canvasWidth;
            canvas.height = this.canvasHeight;
        });
        
        this.centerX = this.canvasWidth / 2;
        this.centerY = this.canvasHeight / 2;
        
        console.log('Canvases initialized successfully');
        console.log('Final splineCanvas check:', this.splineCanvas);
        console.log('SplineCanvas ID:', this.splineCanvas?.id);
    }

    initializeEventListeners() {
        console.log('Initializing event listeners...');
        
        // Check if elements exist before adding listeners
        if (this.settingsBtn) {
            this.settingsBtn.addEventListener('click', () => this.openSettings());
        }
        
        if (this.closeBtn) {
            this.closeBtn.addEventListener('click', () => this.closeSettings());
        }
        
        if (this.saveSettingsBtn) {
            this.saveSettingsBtn.addEventListener('click', () => this.saveSettings());
        }
        
        if (this.resetSettingsBtn) {
            this.resetSettingsBtn.addEventListener('click', () => this.resetSettings());
        }
        
        // Tool selection
        if (this.toolButtons) {
            this.toolButtons.forEach(btn => {
                btn.addEventListener('click', (e) => {
                    // Find the button element (might be clicked on the icon inside)
                    const button = e.target.closest('.tool-btn');
                    if (button) {
                        this.selectTool(button.dataset.tool);
                    }
                });
            });
        }
        
        // File buttons
        if (this.saveBtn) {
            this.saveBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.saveProject();
            });
        }
        
        if (this.loadBtn) {
            this.loadBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.fileInput.click();
            });
        }
        
        if (this.fileInput) {
            this.fileInput.addEventListener('change', (e) => this.loadProject(e));
        }
        
        // Dark mode toggle
        if (this.darkModeBtn) {
            this.darkModeBtn.addEventListener('click', () => this.toggleDarkMode());
        }
        
        // Clear buttons
        if (this.clearSplineBtn) {
            this.clearSplineBtn.addEventListener('click', () => this.clearSpline());
        }
        
        if (this.clearShapesBtn) {
            this.clearShapesBtn.addEventListener('click', () => this.clearShapes());
        }
        
        // Animation buttons
        if (this.playBtn) {
            this.playBtn.addEventListener('click', () => this.startAnimation());
        }
        
        if (this.pauseBtn) {
            this.pauseBtn.addEventListener('click', () => this.pauseAnimation());
        }
        
        if (this.stopBtn) {
            this.stopBtn.addEventListener('click', () => this.stopAnimation());
        }
        
        // Speed control
        if (this.speedSlider) {
            this.speedSlider.addEventListener('input', (e) => {
                this.playbackSpeed = parseFloat(e.target.value);
                this.speedDisplay.textContent = `${this.playbackSpeed.toFixed(2)}x`;
            });
            
            // Mouse wheel support for speed slider
            this.speedSlider.addEventListener('wheel', (e) => {
                e.preventDefault();
                const delta = e.deltaY > 0 ? -0.05 : 0.05;
                const newValue = Math.max(0.05, Math.min(2, this.playbackSpeed + delta));
                this.speedSlider.value = newValue;
                this.playbackSpeed = newValue;
                this.speedDisplay.textContent = `${this.playbackSpeed.toFixed(2)}x`;
            });
        }
        
        // Progress control
        if (this.progressSlider) {
            this.progressSlider.addEventListener('input', (e) => {
                this.isManualSeeking = true;
                const progress = parseFloat(e.target.value) / 1000; // 0 to 1
                this.seekToProgress(progress);
            });
            
            this.progressSlider.addEventListener('change', () => {
                this.isManualSeeking = false;
            });
            
            // Mouse wheel support for progress slider
            this.progressSlider.addEventListener('wheel', (e) => {
                e.preventDefault();
                const delta = e.deltaY > 0 ? -10 : 10; // Move by 10 units (out of 1000)
                const newValue = Math.max(0, Math.min(1000, parseInt(this.progressSlider.value) + delta));
                this.progressSlider.value = newValue;
                this.isManualSeeking = true;
                const progress = newValue / 1000;
                this.seekToProgress(progress);
                setTimeout(() => { this.isManualSeeking = false; }, 100);
            });
        }
        
        // Export button
        if (this.exportBtn) {
            this.exportBtn.addEventListener('click', () => this.exportRobotCode());
        }
        
        // Program index change
        if (this.programIndex) {
            this.programIndex.addEventListener('change', (e) => {
                this.loadPathFromIndex(e.target.value);
            });
        }
        
        // Copy program button
        if (this.copyBtn) {
            this.copyBtn.addEventListener('click', () => this.showCopyDialog());
        }
        
        // Program description change
        if (this.programDescription) {
            this.programDescription.addEventListener('input', () => this.saveCurrentDescription());
            this.programDescription.addEventListener('blur', () => this.saveCurrentDescription());
        }
        
        // Canvas events
        if (this.splineCanvas) {
            console.log('Adding mouse events to canvas');
            console.log('Canvas element:', this.splineCanvas);
            console.log('Canvas getBoundingClientRect:', this.splineCanvas.getBoundingClientRect());
            
            this.splineCanvas.addEventListener('mousedown', (e) => this.handleMouseDown(e));
            this.splineCanvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
            this.splineCanvas.addEventListener('mouseup', (e) => this.handleMouseUp(e));
            
            // Don't end drawing when mouse leaves canvas - allow continuation
            this.splineCanvas.addEventListener('mouseleave', (e) => {
                console.log('Mouse left canvas, but continuing drawing...');
                // Hide tooltip when mouse leaves canvas
                this.hidePointTooltip();
                // Don't call handleMouseUp here to allow drawing continuation
            });
            
            // Global events to continue drawing outside canvas
            document.addEventListener('mousemove', (e) => {
                if (this.isMouseDown) {
                    this.handleMouseMove(e);
                }
            });
            
            document.addEventListener('mouseup', (e) => {
                if (this.isMouseDown) {
                    this.handleMouseUp(e);
                }
            });
            
            // Test click event
            this.splineCanvas.addEventListener('click', (e) => {
                console.log('Click event received on canvas!', e);
            });
        } else {
            console.error('splineCanvas not found!');
        }
        
        // Tab events
        if (this.tabButtons) {
            this.tabButtons.forEach(btn => {
                btn.addEventListener('click', (e) => this.switchTab(e.target.dataset.tab));
            });
        }
        
        // Side panel events
        if (this.selectAllPointsBtn) {
            this.selectAllPointsBtn.addEventListener('change', (e) => this.toggleSelectAllPoints(e.target.checked));
        }
        
        if (this.applyBulkVelocityBtn) {
            this.applyBulkVelocityBtn.addEventListener('click', () => this.applyBulkVelocity());
        }
        
        if (this.applyOffsetBulkXBtn) {
            this.applyOffsetBulkXBtn.addEventListener('click', () => this.offsetBulkX());
        }
        
        if (this.applySetBulkXBtn) {
            this.applySetBulkXBtn.addEventListener('click', () => this.setBulkX());
        }
        
        if (this.applyOffsetBulkYBtn) {
            this.applyOffsetBulkYBtn.addEventListener('click', () => this.offsetBulkY());
        }
        
        if (this.applySetBulkYBtn) {
            this.applySetBulkYBtn.addEventListener('click', () => this.setBulkY());
        }
                
        if (this.deleteSelectedBtn) {
            this.deleteSelectedBtn.addEventListener('click', () => this.deleteSelectedPoints());
        }
        
        // Event listener per il checkbox "Seleziona tutto"
        const selectAllCheckbox = document.getElementById('selectAllPoints');
        if (selectAllCheckbox) {
            selectAllCheckbox.addEventListener('change', (e) => {
                if (e.target.checked) {
                    this.selectAllPoints();
                } else {
                    this.clearSelection();
                }
            });
        }
        
        // Sequence selection button
        if (this.selectSequenceBtn) {
            this.selectSequenceBtn.addEventListener('click', () => this.selectCurrentSequence());
        }
        
        // Refresh sequences button
        if (this.refreshSequencesBtn) {
            this.refreshSequencesBtn.addEventListener('click', () => this.updateSequencesView());
        }
        
        // Settings inputs
        const smoothingSlider = document.getElementById('splineSmoothing');
        if (smoothingSlider) {
            smoothingSlider.addEventListener('input', (e) => {
                const smoothingValue = document.getElementById('smoothingValue');
                if (smoothingValue) {
                    smoothingValue.textContent = e.target.value;
                }
            });
        }
        
        // Axis label validation
        const xAxisSelect = document.getElementById('xAxisLabel');
        const yAxisSelect = document.getElementById('yAxisLabel');
        
        if (xAxisSelect && yAxisSelect) {
            const validateAxisLabels = () => {
                const xValue = xAxisSelect.value;
                const yValue = yAxisSelect.value;
                
                if (xValue === yValue) {
                    // Reset to different values
                    if (xValue === 'X') {
                        yAxisSelect.value = 'Y';
                    } else if (xValue === 'Y') {
                        yAxisSelect.value = 'Z';
                    } else {
                        yAxisSelect.value = 'X';
                    }
                    alert('Le etichette degli assi devono essere diverse!');
                }
            };
            
            xAxisSelect.addEventListener('change', validateAxisLabels);
            yAxisSelect.addEventListener('change', validateAxisLabels);
        }
        
        // Modal background click
        if (this.settingsModal) {
            this.settingsModal.addEventListener('click', (e) => {
                if (e.target === this.settingsModal) {
                    this.closeSettings();
                }
            });
        }
        
        console.log('Event listeners initialized');
    }

    // Grid drawing
    drawGrid() {
        console.log('Drawing grid...');
        
        if (!this.gridCtx) {
            console.error('Grid context not available');
            return;
        }
        
        // Clear canvas with theme background
        const themeColors = this.getThemeColors();
        this.gridCtx.clearRect(0, 0, this.canvasWidth, this.canvasHeight);
        this.gridCtx.fillStyle = themeColors.canvasBg;
        this.gridCtx.fillRect(0, 0, this.canvasWidth, this.canvasHeight);
        
        // Calculate scale: how many pixels per mm
        const totalRangeX = this.settings.maxX - this.settings.minX;
        const totalRangeY = this.settings.maxY - this.settings.minY;
        const scaleX = this.canvasWidth / totalRangeX;
        const scaleY = this.canvasHeight / totalRangeY;
        
        // Use the smaller scale to ensure 1:1 aspect ratio (square pixels)
        const scale = Math.min(scaleX, scaleY);
        
        // Calculate the actual used dimensions with uniform scale
        const usedWidth = totalRangeX * scale;
        const usedHeight = totalRangeY * scale;
        
        // Center the content in the canvas
        const offsetX = (this.canvasWidth - usedWidth) / 2;
        const offsetY = (this.canvasHeight - usedHeight) / 2;
        
        console.log(`Original scales: ${scaleX.toFixed(2)}px/mm (X), ${scaleY.toFixed(2)}px/mm (Y)`);
        console.log(`Uniform scale: ${scale.toFixed(2)}px/mm`);
        console.log(`Offset: X=${offsetX.toFixed(1)}px, Y=${offsetY.toFixed(1)}px`);
        
        // Calculate position of X=0 and Y=0 axes with uniform scale and centering
        const zeroX = offsetX + (0 - this.settings.minX) * scale;
        const zeroY = offsetY + (this.settings.maxY - 0) * scale;
        
        // Secondary grid lines (fine grid)
        this.gridCtx.strokeStyle = themeColors.gridColor;
        this.gridCtx.lineWidth = 0.5;
        this.gridCtx.beginPath();
        
        // Vertical lines
        for (let x = this.settings.minX; x <= this.settings.maxX; x += this.settings.gridSize) {
            const canvasX = offsetX + (x - this.settings.minX) * scale;
            this.gridCtx.moveTo(canvasX, offsetY);
            this.gridCtx.lineTo(canvasX, offsetY + usedHeight);
        }
        
        // Horizontal lines  
        for (let y = this.settings.minY; y <= this.settings.maxY; y += this.settings.gridSize) {
            const canvasY = offsetY + (this.settings.maxY - y) * scale;
            this.gridCtx.moveTo(offsetX, canvasY);
            this.gridCtx.lineTo(offsetX + usedWidth, canvasY);
        }
        
        this.gridCtx.stroke();
        
        // Major grid lines (every 5 grid units)
        const majorStep = this.settings.gridSize * 5;
        this.gridCtx.strokeStyle = themeColors.gridColor;
        this.gridCtx.lineWidth = 1;
        this.gridCtx.beginPath();
        
        // Major vertical lines
        for (let x = this.settings.minX; x <= this.settings.maxX; x += majorStep) {
            if (x % majorStep === 0) {
                const canvasX = offsetX + (x - this.settings.minX) * scale;
                this.gridCtx.moveTo(canvasX, offsetY);
                this.gridCtx.lineTo(canvasX, offsetY + usedHeight);
            }
        }
        
        // Major horizontal lines
        for (let y = this.settings.minY; y <= this.settings.maxY; y += majorStep) {
            if (y % majorStep === 0) {
                const canvasY = offsetY + (this.settings.maxY - y) * scale;
                this.gridCtx.moveTo(offsetX, canvasY);
                this.gridCtx.lineTo(offsetX + usedWidth, canvasY);
            }
        }
        
        this.gridCtx.stroke();
        
        // Main axes (X=0, Y=0) - only if they're within the visible range
        this.gridCtx.strokeStyle = themeColors.axisColor;
        this.gridCtx.lineWidth = 2;
        this.gridCtx.beginPath();
        
        // Y axis (X=0) - draw only if X=0 is within range
        if (0 >= this.settings.minX && 0 <= this.settings.maxX) {
            this.gridCtx.moveTo(zeroX, offsetY);
            this.gridCtx.lineTo(zeroX, offsetY + usedHeight);
        }
        
        // X axis (Y=0) - draw only if Y=0 is within range
        if (0 >= this.settings.minY && 0 <= this.settings.maxY) {
            this.gridCtx.moveTo(offsetX, zeroY);
            this.gridCtx.lineTo(offsetX + usedWidth, zeroY);
        }
        
        this.gridCtx.stroke();
        
        // Draw labels for both minor and major grid lines
        this.drawGridLabels(scale, scale, zeroX, zeroY, offsetX, offsetY, usedWidth, usedHeight, themeColors);
        
        console.log('Grid drawing completed');
    }
    
    drawGridLabels(scaleX, scaleY, zeroX, zeroY, offsetX, offsetY, usedWidth, usedHeight, themeColors) {
        // Set up text style
        this.gridCtx.fillStyle = themeColors.textColor;
        this.gridCtx.font = '11px Arial';
        
        // X axis labels (horizontal)
        this.gridCtx.textAlign = 'center';
        this.gridCtx.textBaseline = 'top';
        
        for (let x = this.settings.minX; x <= this.settings.maxX; x += this.settings.gridSize) {
            if (x !== 0) { // Skip zero, we'll handle it separately
                const canvasX = offsetX + (x - this.settings.minX) * scaleX;
                let labelY;
                
                if (0 >= this.settings.minY && 0 <= this.settings.maxY) {
                    // Zero line is visible, place labels on it
                    labelY = zeroY + 4;
                } else {
                    // Zero line not visible, place at bottom of used area
                    labelY = offsetY + usedHeight - 15;
                }
                
                // Major labels (darker, with "mm")
                if (x % (this.settings.gridSize * 5) === 0) {
                    this.gridCtx.fillStyle = themeColors.textColor;
                    this.gridCtx.font = 'bold 12px Arial';
                    this.gridCtx.fillText(x + 'mm', canvasX, labelY);
                } else {
                    // Minor labels (lighter)
                    this.gridCtx.fillStyle = themeColors.textColor;
                    this.gridCtx.font = '10px Arial';
                    this.gridCtx.fillText(x.toString(), canvasX, labelY);
                }
            }
        }
        
        // Y axis labels (vertical)
        this.gridCtx.textAlign = 'right';
        this.gridCtx.textBaseline = 'middle';
        
        for (let y = this.settings.minY; y <= this.settings.maxY; y += this.settings.gridSize) {
            if (y !== 0) { // Skip zero, we'll handle it separately
                const canvasY = offsetY + (this.settings.maxY - y) * scaleY;
                let labelX;
                
                if (0 >= this.settings.minX && 0 <= this.settings.maxX) {
                    // Zero line is visible, place labels on it
                    labelX = zeroX - 4;
                } else {
                    // Zero line not visible, place at left of used area
                    labelX = offsetX - 4;
                }
                
                // Major labels (darker, with "mm")
                if (y % (this.settings.gridSize * 5) === 0) {
                    this.gridCtx.fillStyle = themeColors.textColor;
                    this.gridCtx.font = 'bold 12px Arial';
                    this.gridCtx.fillText(y + 'mm', labelX, canvasY);
                } else {
                    // Minor labels (lighter)
                    this.gridCtx.fillStyle = themeColors.textColor;
                    this.gridCtx.font = '10px Arial';
                    this.gridCtx.fillText(y.toString(), labelX, canvasY);
                }
            }
        }
        
        // Origin label (0,0) - only if origin is visible
        if (0 >= this.settings.minX && 0 <= this.settings.maxX && 0 >= this.settings.minY && 0 <= this.settings.maxY) {
            this.gridCtx.fillStyle = themeColors.textColor;
            this.gridCtx.font = 'bold 14px Arial';
            this.gridCtx.textAlign = 'right';
            this.gridCtx.textBaseline = 'bottom';
            this.gridCtx.fillText('0', zeroX - 6, zeroY - 6);
            
            // Draw small markers at origin
            this.gridCtx.strokeStyle = themeColors.textColor;
            this.gridCtx.lineWidth = 2;
            this.gridCtx.beginPath();
            // X axis marker
            this.gridCtx.moveTo(zeroX - 5, zeroY);
            this.gridCtx.lineTo(zeroX + 5, zeroY);
            // Y axis marker
            this.gridCtx.moveTo(zeroX, zeroY - 5);
            this.gridCtx.lineTo(zeroX, zeroY + 5);
            this.gridCtx.stroke();
        }
        
        // Draw axis labels
        this.drawAxisLabels(zeroX, zeroY, themeColors);
    }
    
    drawAxisLabels(zeroX, zeroY, themeColors) {
        this.gridCtx.fillStyle = themeColors.textColor;
        this.gridCtx.font = 'bold 16px Arial';
        
        // X axis label (horizontal axis) - position at right end
        this.gridCtx.textAlign = 'center';
        this.gridCtx.textBaseline = 'middle';
        
        let xLabelX = this.canvasWidth - 20;
        let xLabelY = zeroY;
        
        // If zero line is not visible, place at bottom
        if (!(0 >= this.settings.minY && 0 <= this.settings.maxY)) {
            xLabelY = this.canvasHeight - 20;
        }
        
        this.gridCtx.fillText(this.settings.xAxisLabel, xLabelX, xLabelY);
        
        // Y axis label (vertical axis) - position at top end
        this.gridCtx.textAlign = 'center';
        this.gridCtx.textBaseline = 'middle';
        
        let yLabelX = zeroX;
        let yLabelY = 20;
        
        // If zero line is not visible, place at left
        if (!(0 >= this.settings.minX && 0 <= this.settings.maxX)) {
            yLabelX = 20;
        }
        
        this.gridCtx.fillText(this.settings.yAxisLabel, yLabelX, yLabelY);
    }
    
    updateTableHeaders() {
        // Update spline table headers
        const splineTable = document.getElementById('splineTable');
        if (splineTable) {
            const headers = splineTable.querySelectorAll('thead th');
            if (headers.length >= 4) {
                // Index 0: checkbox, 1: ID, 2: Z/X, 3: X/Y, 4: Velocity, 5: Actions
                headers[2].textContent = `${this.settings.xAxisLabel} (mm)`;
                headers[3].textContent = `${this.settings.yAxisLabel} (mm)`;
            }
        }
        
        // Update shapes table headers
        const shapesTable = document.getElementById('shapesTable');
        if (shapesTable) {
            const headers = shapesTable.querySelectorAll('thead th');
            if (headers.length >= 5) {
                headers[2].textContent = `Posizione ${this.settings.xAxisLabel} (mm)`;
                headers[3].textContent = `Posizione ${this.settings.yAxisLabel} (mm)`;
            }
        }

        const transfXLabel = document.getElementById('bulkXLabel');
        if (transfXLabel){
            transfXLabel.textContent = `${this.settings.xAxisLabel} selezionati:`
        }

        const transfYLabel = document.getElementById('bulkYLabel');
        if (transfYLabel){
            transfYLabel.textContent = `${this.settings.yAxisLabel} selezionati:`
        }
    }

    // Coordinate conversion
    screenToWorld(screenX, screenY) {
        const rect = this.splineCanvas.getBoundingClientRect();
        const canvasX = screenX - rect.left;
        const canvasY = screenY - rect.top;
        
        const totalRangeX = this.settings.maxX - this.settings.minX;
        const totalRangeY = this.settings.maxY - this.settings.minY;
        const scaleX = this.canvasWidth / totalRangeX;
        const scaleY = this.canvasHeight / totalRangeY;
        
        // Use uniform scale to maintain 1:1 aspect ratio
        const scale = Math.min(scaleX, scaleY);
        
        // Calculate the actual used dimensions with uniform scale
        const usedWidth = totalRangeX * scale;
        const usedHeight = totalRangeY * scale;
        
        // Center the content in the canvas
        const offsetX = (this.canvasWidth - usedWidth) / 2;
        const offsetY = (this.canvasHeight - usedHeight) / 2;
        
        // Allow conversion even when mouse is outside the canvas bounds
        // This enables drawing continuation when mouse exits the canvas area
        const worldX = this.settings.minX + ((canvasX - offsetX) / scale);
        const worldY = this.settings.maxY - ((canvasY - offsetY) / scale);
        
        return { x: worldX, y: worldY };
    }

    worldToScreen(worldX, worldY) {
        const totalRangeX = this.settings.maxX - this.settings.minX;
        const totalRangeY = this.settings.maxY - this.settings.minY;
        const scaleX = this.canvasWidth / totalRangeX;
        const scaleY = this.canvasHeight / totalRangeY;
        
        // Use uniform scale to maintain 1:1 aspect ratio
        const scale = Math.min(scaleX, scaleY);
        
        // Calculate the actual used dimensions with uniform scale
        const usedWidth = totalRangeX * scale;
        const usedHeight = totalRangeY * scale;
        
        // Center the content in the canvas
        const offsetX = (this.canvasWidth - usedWidth) / 2;
        const offsetY = (this.canvasHeight - usedHeight) / 2;
        
        const canvasX = offsetX + (worldX - this.settings.minX) * scale;
        const canvasY = offsetY + (this.settings.maxY - worldY) * scale;
        
        return { x: canvasX, y: canvasY };
    }

    // Snap coordinates to grid
    snapToGrid(worldPos) {
        if (!this.settings.enableSnap) {
            return worldPos;
        }
        
        const snapSize = this.settings.snapSize;
        const snappedX = Math.round(worldPos.x / snapSize) * snapSize;
        const snappedY = Math.round(worldPos.y / snapSize) * snapSize;
        
        return { 
            x: parseFloat(snappedX.toFixed(2)), 
            y: parseFloat(snappedY.toFixed(2)) 
        };
    }

    // Get mouse position with snap applied and clamped to graph limits
    getMousePosition(e) {
        const rawPos = this.screenToWorld(e.clientX, e.clientY);
        const snappedPos = this.snapToGrid(rawPos);
        return this.clampToGraphLimits(snappedPos);
    }

    // Mouse event handlers
    handleMouseDown(e) {
        this.isMouseDown = true;
        const worldPos = this.getMousePosition(e);
        
        if (this.currentTool === 'select') {
            this.handleSelectClick(e);
        } else if (this.currentTool === 'spline') {
            this.startSpline(worldPos);
        } else {
            this.startShape(worldPos);
        }
    }

    handleSelectClick(e) {
        const rect = this.splineCanvas.getBoundingClientRect();
        const canvasX = e.clientX - rect.left;
        const canvasY = e.clientY - rect.top;
        
        // Find point under mouse cursor
        const clickedPointIndex = this.findPointUnderMouse(canvasX, canvasY);
        
        if (clickedPointIndex !== -1) {
            // Point clicked - handle selection
            if (e.shiftKey && this.lastSelectedIndex !== -1) {
                // Shift selection: select range
                const start = Math.min(this.lastSelectedIndex, clickedPointIndex);
                const end = Math.max(this.lastSelectedIndex, clickedPointIndex);
                
                for (let i = start; i <= end; i++) {
                    this.selectedPoints.add(i);
                    const cb = document.querySelector(`.point-checkbox[data-index="${i}"]`);
                    if (cb) cb.checked = true;
                }
            } else if (e.ctrlKey) {
                // Ctrl selection: toggle single point
                if (this.selectedPoints.has(clickedPointIndex)) {
                    this.selectedPoints.delete(clickedPointIndex);
                    const cb = document.querySelector(`.point-checkbox[data-index="${clickedPointIndex}"]`);
                    if (cb) cb.checked = false;
                } else {
                    this.selectedPoints.add(clickedPointIndex);
                    const cb = document.querySelector(`.point-checkbox[data-index="${clickedPointIndex}"]`);
                    if (cb) cb.checked = true;
                }
            } else {
                // Normal selection: select only this point
                this.selectedPoints.clear();
                this.selectedPoints.add(clickedPointIndex);
                
                // Update all checkboxes
                document.querySelectorAll('.point-checkbox').forEach((checkbox, index) => {
                    checkbox.checked = (index === clickedPointIndex);
                });
            }
            
            this.lastSelectedIndex = clickedPointIndex;
            this.updateSelectedCount();
            this.updateTableSelection();
            this.highlightSelectedPoints();
            this.scrollToPointInTable(clickedPointIndex);
        } else {
            // Clicked on empty space - start selection box
            if (!e.ctrlKey) {
                this.selectedPoints.clear();
                document.querySelectorAll('.point-checkbox').forEach(checkbox => {
                    checkbox.checked = false;
                });
                this.updateSelectedCount();
                this.updateTableSelection();
                this.highlightSelectedPoints();
            }
            
            // Start drag selection
            this.isSelectDragging = true;
            this.selectBoxStart = { x: canvasX, y: canvasY };
            this.selectBoxEnd = { x: canvasX, y: canvasY };
        }
    }

    handleMouseMove(e) {
        const rawWorldPos = this.screenToWorld(e.clientX, e.clientY);
        const snappedWorldPos = this.getMousePosition(e);
        
        // Update coordinates display (show both raw and snapped if different)
        if (this.settings.enableSnap && 
            (Math.abs(rawWorldPos.x - snappedWorldPos.x) > 0.01 || 
             Math.abs(rawWorldPos.y - snappedWorldPos.y) > 0.01)) {
            this.updateCoordinates(rawWorldPos, snappedWorldPos);
        } else {
            this.updateCoordinates(snappedWorldPos);
        }
        
        // Handle selection box dragging
        if (this.isSelectDragging && this.currentTool === 'select') {
            const rect = this.splineCanvas.getBoundingClientRect();
            const canvasX = e.clientX - rect.left;
            const canvasY = e.clientY - rect.top;
            this.selectBoxEnd = { x: canvasX, y: canvasY };
            this.drawSelectionBox();
            return;
        }
        
        if (this.isMouseDown && this.currentTool !== 'select') {
            if (this.currentTool === 'spline' && this.isDrawing) {
                this.continueSampling(snappedWorldPos);
            } else if (this.currentTool !== 'spline') {
                this.updateShapePreview(snappedWorldPos);
            }
        }
        
        // Draw snap indicator
        this.drawSnapIndicator(snappedWorldPos);
        
        // Handle point tooltip
        this.handlePointTooltip(e);
    }

    handlePointTooltip(e) {
        // Don't show tooltip while drawing
        if (this.isMouseDown) {
            this.hidePointTooltip();
            if (this.tooltipTimeout) {
                clearTimeout(this.tooltipTimeout);
                this.tooltipTimeout = null;
            }
            return;
        }
        
        const rect = this.splineCanvas.getBoundingClientRect();
        const canvasX = e.clientX - rect.left;
        const canvasY = e.clientY - rect.top;
        
        // Find point under mouse cursor
        const hoveredPointIndex = this.findPointUnderMouse(canvasX, canvasY);
        
        if (hoveredPointIndex !== -1) {
            // If hovering over a different point, cancel previous timeout
            if (this.hoveredPointIndex !== hoveredPointIndex) {
                this.hidePointTooltip();
                if (this.tooltipTimeout) {
                    clearTimeout(this.tooltipTimeout);
                }
                
                this.hoveredPointIndex = hoveredPointIndex;
                
                // Set timeout for showing tooltip after 200ms
                this.tooltipTimeout = setTimeout(() => {
                    this.showPointTooltip(hoveredPointIndex, e.clientX, e.clientY);
                }, 200);
            }
        } else {
            // Not hovering over any point
            this.hoveredPointIndex = -1;
            this.hidePointTooltip();
            if (this.tooltipTimeout) {
                clearTimeout(this.tooltipTimeout);
                this.tooltipTimeout = null;
            }
        }
    }

    findPointUnderMouse(canvasX, canvasY) {
        const tolerance = 8; // pixels
        
        for (let i = 0; i < this.splinePoints.length; i++) {
            const point = this.splinePoints[i];
            const screenPos = this.worldToScreen(point.x, point.y);
            
            const distance = Math.sqrt(
                Math.pow(canvasX - screenPos.x, 2) + 
                Math.pow(canvasY - screenPos.y, 2)
            );
            
            if (distance <= tolerance) {
                return i;
            }
        }
        
        return -1;
    }

    showPointTooltip(pointIndex, screenX, screenY) {
        if (!this.pointTooltip) {
            this.pointTooltip = document.createElement('div');
            this.pointTooltip.className = 'point-tooltip';
            this.pointTooltip.style.cssText = `
                position: fixed;
                background: rgba(0, 0, 0, 0.8);
                color: white;
                padding: 4px 8px;
                border-radius: 4px;
                font-size: 12px;
                pointer-events: none;
                z-index: 1000;
                white-space: nowrap;
            `;
            document.body.appendChild(this.pointTooltip);
        }
        
        const point = this.splinePoints[pointIndex];
        this.pointTooltip.textContent = `Punto ${pointIndex + 1}: ${this.settings.xAxisLabel}=${point.x.toFixed(1)}, ${this.settings.yAxisLabel}=${point.y.toFixed(1)} mm, v=${point.velocity} mm/s`;
        this.pointTooltip.style.display = 'block';
        this.pointTooltip.style.left = (screenX + 10) + 'px';
        this.pointTooltip.style.top = (screenY - 25) + 'px';
    }

    hidePointTooltip() {
        if (this.pointTooltip) {
            this.pointTooltip.style.display = 'none';
        }
        if (this.tooltipTimeout) {
            clearTimeout(this.tooltipTimeout);
            this.tooltipTimeout = null;
        }
    }

    handleMouseUp(e) {
        // Handle selection box completion
        if (this.isSelectDragging && this.currentTool === 'select') {
            this.finishSelectionBox(e);
            this.isSelectDragging = false;
            this.selectBoxStart = null;
            this.selectBoxEnd = null;
            this.splineCtx.clearRect(0, 0, this.canvasWidth, this.canvasHeight);
            this.drawSpline();
            this.highlightSelectedPoints();
            return;
        }
        
        if (this.isMouseDown && this.currentTool !== 'select') {
            const worldPos = this.getMousePosition(e);
            
            if (this.currentTool === 'spline') {
                this.endSpline();
            } else {
                this.finishShape(worldPos);
            }
        }
        
        this.isMouseDown = false;
        this.isDrawing = false;
        this.clearSnapIndicator();
    }

    // Spline functionality
    startSpline(worldPos) {
        if (!this.isDrawing) {
            // Handle reference path when starting to draw a new spline
            if (this.splinePoints.length > 0) {
                // Store existing spline as reference before clearing
                this.referencePath = [...this.splinePoints];
                this.showReferencePath = true;
                console.log(`Starting new spline: storing current path with ${this.referencePath.length} points as reference`);
            }
            
            // Clear any existing animation when starting a new spline
            if (this.animationCtx) {
                this.animationCtx.clearRect(0, 0, this.canvasWidth, this.canvasHeight);
            }
            
            this.splinePoints = [worldPos];
            this.isDrawing = true;
            this.lastSampleTime = Date.now();
            
            // Redraw to show new point with reference path
            this.drawSpline();
        } else {
            // Single click adds point
            this.splinePoints.push(worldPos);
            this.drawSpline();
        }
        this.updateSplineTable();
    }

    continueSampling(worldPos) {
        const now = Date.now();
        const lastPoint = this.splinePoints[this.splinePoints.length - 1];
        const distance = Math.sqrt(
            Math.pow(worldPos.x - lastPoint.x, 2) + 
            Math.pow(worldPos.y - lastPoint.y, 2)
        );
        
        // If distance is large (mouse moved quickly), interpolate intermediate points
        if (distance > this.settings.samplingDistance * 3) {
            // Calculate how many intermediate points we need
            const numPoints = Math.ceil(distance / this.settings.samplingDistance);
            
            // Add intermediate points
            for (let i = 1; i < numPoints; i++) {
                const t = i / numPoints;
                const interpolatedPoint = {
                    x: lastPoint.x + (worldPos.x - lastPoint.x) * t,
                    y: lastPoint.y + (worldPos.y - lastPoint.y) * t,
                    velocity: 30 // Default velocity for interpolated points
                };
                this.splinePoints.push(interpolatedPoint);
            }
        }
        
        // Always add the current point if it's far enough from the last point
        if (distance >= this.settings.samplingDistance) {
            this.splinePoints.push(worldPos);
            this.drawSpline();
            this.updateSplineTable();
        }
    }

    endSpline() {
        this.isDrawing = false;
        
        // Hide reference path when finishing drawing
        if (this.showReferencePath) {
            this.showReferencePath = false;
            this.drawSpline(); // Redraw without reference path
        }
    }

    clampToGraphLimits(worldPos) {
        // Clamp coordinates strictly to the graph limits without any margin
        // This prevents drawing outside the defined graph area
        return {
            x: Math.max(this.settings.minX, Math.min(this.settings.maxX, worldPos.x)),
            y: Math.max(this.settings.minY, Math.min(this.settings.maxY, worldPos.y))
        };
    }

    drawSpline() {
        // Clear canvas first
        this.splineCtx.clearRect(0, 0, this.canvasWidth, this.canvasHeight);
        
        // Draw reference path first (if enabled)
        if (this.showReferencePath && this.referencePath && this.referencePath.length >= 2) {
            console.log(`Drawing reference path with ${this.referencePath.length} points`);
            this.drawReferencePath();
        }
        
        // Return early if no current spline points to draw
        if (this.splinePoints.length < 2) {
            // If we have exactly 1 point, draw it
            if (this.splinePoints.length === 1) {
                this.splineCtx.fillStyle = this.settings.splineColor;
                const screenPos = this.worldToScreen(this.splinePoints[0].x, this.splinePoints[0].y);
                this.splineCtx.beginPath();
                this.splineCtx.arc(screenPos.x, screenPos.y, 3, 0, 2 * Math.PI);
                this.splineCtx.fill();
            }
            return;
        }
        
        this.splineCtx.strokeStyle = this.settings.splineColor;
        this.splineCtx.lineWidth = 2;
        this.splineCtx.lineCap = 'round';
        this.splineCtx.lineJoin = 'round';
        
        this.splineCtx.beginPath();
        
        if (this.splinePoints.length === 2) {
            // Simple line for two points
            const start = this.worldToScreen(this.splinePoints[0].x, this.splinePoints[0].y);
            const end = this.worldToScreen(this.splinePoints[1].x, this.splinePoints[1].y);
            this.splineCtx.moveTo(start.x, start.y);
            this.splineCtx.lineTo(end.x, end.y);
        } else {
            // Smooth spline for multiple points
            this.drawSmoothSpline();
        }
        
        this.splineCtx.stroke();
        
        // Draw points
        this.splineCtx.fillStyle = this.settings.splineColor;
        this.splinePoints.forEach(point => {
            const screenPos = this.worldToScreen(point.x, point.y);
            this.splineCtx.beginPath();
            this.splineCtx.arc(screenPos.x, screenPos.y, 3, 0, 2 * Math.PI);
            this.splineCtx.fill();
        });
    }

    drawSmoothSpline() {
        const points = this.splinePoints.map(p => this.worldToScreen(p.x, p.y));
        
        this.splineCtx.moveTo(points[0].x, points[0].y);
        
        for (let i = 1; i < points.length - 1; i++) {
            const cp1x = points[i].x + (points[i + 1].x - points[i - 1].x) * this.settings.splineSmoothing * 0.2;
            const cp1y = points[i].y + (points[i + 1].y - points[i - 1].y) * this.settings.splineSmoothing * 0.2;
            const cp2x = points[i + 1].x - (points[i + 2] ? points[i + 2].x - points[i].x : 0) * this.settings.splineSmoothing * 0.2;
            const cp2y = points[i + 1].y - (points[i + 2] ? points[i + 2].y - points[i].y : 0) * this.settings.splineSmoothing * 0.2;
            
            this.splineCtx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, points[i + 1].x, points[i + 1].y);
        }
        
        if (points.length > 2) {
            this.splineCtx.lineTo(points[points.length - 1].x, points[points.length - 1].y);
        }
    }

    drawReferencePath() {
        if (!this.referencePath || this.referencePath.length < 2) return;
        
        // Save current context settings
        const originalStrokeStyle = this.splineCtx.strokeStyle;
        const originalLineWidth = this.splineCtx.lineWidth;
        const originalGlobalAlpha = this.splineCtx.globalAlpha;
        
        // Set reference path style (light/transparent)
        this.splineCtx.strokeStyle = this.settings.splineColor;
        this.splineCtx.lineWidth = 1;
        this.splineCtx.globalAlpha = 0.3; // Make it transparent
        this.splineCtx.setLineDash([5, 5]); // Dashed line
        
        this.splineCtx.beginPath();
        
        if (this.referencePath.length === 2) {
            // Simple line for two points
            const start = this.worldToScreen(this.referencePath[0].x, this.referencePath[0].y);
            const end = this.worldToScreen(this.referencePath[1].x, this.referencePath[1].y);
            this.splineCtx.moveTo(start.x, start.y);
            this.splineCtx.lineTo(end.x, end.y);
        } else {
            // Smooth spline for multiple points
            this.drawSmoothReferenceSpline();
        }
        
        this.splineCtx.stroke();
        
        // Draw reference points as small circles
        this.splineCtx.fillStyle = this.settings.splineColor;
        this.splineCtx.globalAlpha = 0.2;
        this.referencePath.forEach(point => {
            const screenPos = this.worldToScreen(point.x, point.y);
            this.splineCtx.beginPath();
            this.splineCtx.arc(screenPos.x, screenPos.y, 2, 0, 2 * Math.PI);
            this.splineCtx.fill();
        });
        
        // Restore context settings
        this.splineCtx.strokeStyle = originalStrokeStyle;
        this.splineCtx.lineWidth = originalLineWidth;
        this.splineCtx.globalAlpha = originalGlobalAlpha;
        this.splineCtx.setLineDash([]); // Reset to solid line
    }

    drawSmoothReferenceSpline() {
        const points = this.referencePath.map(p => this.worldToScreen(p.x, p.y));
        
        this.splineCtx.moveTo(points[0].x, points[0].y);
        
        for (let i = 1; i < points.length - 1; i++) {
            const cp1x = points[i].x + (points[i + 1].x - points[i - 1].x) * this.settings.splineSmoothing * 0.2;
            const cp1y = points[i].y + (points[i + 1].y - points[i - 1].y) * this.settings.splineSmoothing * 0.2;
            const cp2x = points[i + 1].x - (points[i + 2] ? points[i + 2].x - points[i].x : 0) * this.settings.splineSmoothing * 0.2;
            const cp2y = points[i + 1].y - (points[i + 2] ? points[i + 2].y - points[i].y : 0) * this.settings.splineSmoothing * 0.2;
            
            this.splineCtx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, points[i + 1].x, points[i + 1].y);
        }
        
        if (points.length > 2) {
            this.splineCtx.lineTo(points[points.length - 1].x, points[points.length - 1].y);
        }
    }

    // Shape functionality
    startShape(worldPos) {
        this.tempShape = {
            type: this.currentTool,
            start: worldPos,
            end: worldPos
        };
    }

    updateShapePreview(worldPos) {
        if (!this.tempShape) return;
        
        this.tempShape.end = worldPos;
        this.redrawShapes();
        this.drawShapePreview();
    }

    finishShape(worldPos) {
        if (!this.tempShape) return;
        
        this.tempShape.end = worldPos;
        this.shapes.push({ ...this.tempShape });
        this.tempShape = null;
        this.redrawShapes();
        this.updateShapesTable();
    }

    drawShapePreview() {
        if (!this.tempShape) return;
        
        this.shapeCtx.strokeStyle = this.settings.shapeColor;
        this.shapeCtx.fillStyle = this.settings.shapeColor + '20';
        this.shapeCtx.lineWidth = 2;
        this.shapeCtx.setLineDash([5, 5]);
        
        this.drawSingleShape(this.tempShape);
        this.shapeCtx.setLineDash([]);
    }

    redrawShapes() {
        this.shapeCtx.clearRect(0, 0, this.canvasWidth, this.canvasHeight);
        this.shapeCtx.strokeStyle = this.settings.shapeColor;
        this.shapeCtx.fillStyle = this.settings.shapeColor + '20';
        this.shapeCtx.lineWidth = 2;
        
        this.shapes.forEach(shape => this.drawSingleShape(shape));
    }

    drawSingleShape(shape) {
        const start = this.worldToScreen(shape.start.x, shape.start.y);
        const end = this.worldToScreen(shape.end.x, shape.end.y);
        
        this.shapeCtx.beginPath();
        
        switch (shape.type) {
            case 'rectangle':
                const width = end.x - start.x;
                const height = end.y - start.y;
                this.shapeCtx.rect(start.x, start.y, width, height);
                this.shapeCtx.fill();
                this.shapeCtx.stroke();
                break;
                
            case 'circle':
                const radius = Math.sqrt(
                    Math.pow(end.x - start.x, 2) + 
                    Math.pow(end.y - start.y, 2)
                );
                this.shapeCtx.arc(start.x, start.y, radius, 0, 2 * Math.PI);
                this.shapeCtx.fill();
                this.shapeCtx.stroke();
                break;
        }
    }

    // Tool selection
    selectTool(tool) {
        this.currentTool = tool;
        this.toolButtons.forEach(btn => btn.classList.remove('active'));
        document.querySelector(`[data-tool="${tool}"]`).classList.add('active');
        
        // Update cursor based on tool
        let cursor = 'crosshair';
        switch(tool) {
            case 'select':
                cursor = 'default';
                break;
            case 'spline':
                cursor = 'crosshair';
                break;
            case 'rectangle':
            case 'circle':
                cursor = 'crosshair';
                break;
        }
        this.splineCanvas.style.cursor = cursor;
    }

    // Side Panel Management
    switchTab(tabId) {
        // Update tab buttons
        this.tabButtons.forEach(btn => btn.classList.remove('active'));
        document.querySelector(`[data-tab="${tabId}"]`).classList.add('active');
        
        // Update tab content
        document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
        document.getElementById(tabId).classList.add('active');
        
        // Update sequences view when switching to sequences tab
        if (tabId === 'sequences-tab') {
            this.updateSequencesView();
        }
    }

    // Identify velocity sequences in spline points
    identifySequences() {
        const sequences = [];
        if (this.splinePoints.length === 0) return sequences;
        
        let currentSequence = {
            startIndex: 0,
            endIndex: 0,
            velocity: this.splinePoints[0].velocity || 30,
            points: [0]
        };
        
        for (let i = 1; i < this.splinePoints.length; i++) {
            const currentVelocity = this.splinePoints[i].velocity || 30;
            
            if (Math.abs(currentVelocity - currentSequence.velocity) < 0.01) {
                // Same velocity, extend current sequence
                currentSequence.endIndex = i;
                currentSequence.points.push(i);
            } else {
                // Different velocity, save current sequence and start new one
                sequences.push(currentSequence);
                currentSequence = {
                    startIndex: i,
                    endIndex: i,
                    velocity: currentVelocity,
                    points: [i]
                };
            }
        }
        
        // Add last sequence
        sequences.push(currentSequence);
        
        return sequences;
    }
    
    // Select current sequence based on selected points
    selectCurrentSequence() {
        if (this.selectedPoints.size === 0) {
            alert('Seleziona almeno un punto per identificare la sequenza!');
            return;
        }
        
        // Get the first selected point
        const firstSelected = Math.min(...Array.from(this.selectedPoints));
        const targetVelocity = this.splinePoints[firstSelected].velocity || 30;
        
        // Find the sequence containing this point
        const sequences = this.identifySequences();
        const sequence = sequences.find(seq => seq.points.includes(firstSelected));
        
        if (sequence) {
            // Clear current selection
            this.selectedPoints.clear();
            
            // Select all points in the sequence
            sequence.points.forEach(index => {
                this.selectedPoints.add(index);
            });
            
            this.updateSplineTable();
            this.updateSelectionInfo();
            this.highlightSelectedPoints();
            
            console.log(`Selected sequence with velocity ${sequence.velocity} mm/s (${sequence.points.length} points)`);
        }
    }
    
    // Update sequences view
    updateSequencesView() {
        if (!this.sequencesContainer) return;
        
        const sequences = this.identifySequences();
        this.sequencesContainer.innerHTML = '';
        
        if (sequences.length === 0) {
            this.sequencesContainer.innerHTML = '<p style="padding: 20px; text-align: center; color: var(--text-secondary);">Nessuna sequenza disponibile</p>';
            if (this.sequencesCountDisplay) {
                this.sequencesCountDisplay.textContent = '0 sequenze';
            }
            return;
        }
        
        sequences.forEach((seq, seqIndex) => {
            const sequenceCard = document.createElement('div');
            sequenceCard.className = 'sequence-card';
            sequenceCard.dataset.seqIndex = seqIndex;
            
            // Calculate sequence length and duration using spline curve sampling
            let sequenceLength = 0;
            let duration = 0;
            
            for (let i = seq.startIndex; i < seq.endIndex; i++) {
                const velocity = this.splinePoints[i].velocity || 30;
                // Use the same method as animation for consistency
                const segmentLength = this.calculateSplineSegmentLength(i);
                sequenceLength += segmentLength;
                duration += segmentLength / velocity; // seconds
            }
            
            sequenceCard.innerHTML = `
                <div class="sequence-header">
                    <div class="sequence-title">
                        <span class="sequence-number">Sequenza ${seqIndex + 1}</span>
                        <div class="sequence-velocity-edit">
                            <input type="number" class="sequence-velocity-input" data-seq-index="${seqIndex}" value="${seq.velocity.toFixed(1)}" min="0" step="0.1" title="Velocità (mm/s)">
                            <span class="velocity-unit">mm/s</span>
                        </div>
                    </div>
                    <button class="btn btn-small sequence-select" data-seq-index="${seqIndex}">
                        <span class="material-symbols-outlined">select_all</span> Seleziona
                    </button>
                </div>
                <div class="sequence-info">
                    <span><strong>Punti:</strong> ${seq.points.length} (ID ${seq.startIndex + 1} - ${seq.endIndex + 1})</span>
                    <span><strong>Lunghezza:</strong> ${sequenceLength.toFixed(1)} mm</span>
                    <span><strong>Durata:</strong> ${duration.toFixed(2)} s</span>
                </div>
            `;
            
            this.sequencesContainer.appendChild(sequenceCard);
        });
        
        // Update count
        if (this.sequencesCountDisplay) {
            this.sequencesCountDisplay.textContent = `${sequences.length} sequenz${sequences.length === 1 ? 'a' : 'e'}`;
        }
        
        // Add event listeners for select buttons
        document.querySelectorAll('.sequence-select').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const seqIndex = parseInt(e.currentTarget.dataset.seqIndex);
                this.selectSequence(seqIndex);
            });
        });
        
        // Add event listeners for velocity inputs
        document.querySelectorAll('.sequence-velocity-input').forEach(input => {
            input.addEventListener('change', (e) => {
                const seqIndex = parseInt(e.target.dataset.seqIndex);
                const newVelocity = parseFloat(e.target.value);
                if (!isNaN(newVelocity) && newVelocity >= 0) {
                    this.updateSequenceVelocity(seqIndex, newVelocity);
                }
            });
            
            input.addEventListener('blur', (e) => {
                const value = parseFloat(e.target.value);
                if (isNaN(value) || value < 0) {
                    const seqIndex = parseInt(e.target.dataset.seqIndex);
                    const sequences = this.identifySequences();
                    if (sequences[seqIndex]) {
                        e.target.value = sequences[seqIndex].velocity.toFixed(1);
                    }
                }
            });
        });
        
        // Add hover highlight functionality for sequence cards
        document.querySelectorAll('.sequence-card').forEach(card => {
            card.addEventListener('mouseenter', (e) => {
                const seqIndex = parseInt(e.currentTarget.dataset.seqIndex);
                this.highlightSequenceInTable(seqIndex, true);
                this.highlightSequenceOnCanvas(seqIndex);
            });
            
            card.addEventListener('mouseleave', (e) => {
                const seqIndex = parseInt(e.currentTarget.dataset.seqIndex);
                this.highlightSequenceInTable(seqIndex, false);
                this.clearSequenceHighlightOnCanvas();
            });
        });
    }
    
    // Update velocity for all points in a sequence
    updateSequenceVelocity(seqIndex, newVelocity) {
        const sequences = this.identifySequences();
        if (seqIndex < 0 || seqIndex >= sequences.length) return;
        
        const sequence = sequences[seqIndex];
        
        // Update velocity for all points in the sequence
        sequence.points.forEach(pointIndex => {
            this.splinePoints[pointIndex].velocity = newVelocity;
        });
        
        // Update the spline table to reflect changes
        this.updateSplineTable();
        
        // Refresh sequences view to update duration
        this.updateSequencesView();
        
        console.log(`Updated sequence ${seqIndex + 1} velocity to ${newVelocity} mm/s`);
    }
    
    // Highlight sequence rows in the table
    highlightSequenceInTable(seqIndex, highlight) {
        const sequences = this.identifySequences();
        if (seqIndex < 0 || seqIndex >= sequences.length) return;
        
        const sequence = sequences[seqIndex];
        
        // Find all table rows for this sequence
        document.querySelectorAll('#splineTableBody tr').forEach((row, rowIndex) => {
            if (sequence.points.includes(rowIndex)) {
                if (highlight) {
                    row.classList.add('sequence-highlighted');
                } else {
                    row.classList.remove('sequence-highlighted');
                }
            }
        });
    }
    
    // Select a specific sequence by index
    selectSequence(seqIndex) {
        const sequences = this.identifySequences();
        if (seqIndex < 0 || seqIndex >= sequences.length) return;
        
        const sequence = sequences[seqIndex];
        
        // Clear current selection
        this.selectedPoints.clear();
        
        // Select all points in the sequence
        sequence.points.forEach(index => {
            this.selectedPoints.add(index);
        });
        
        // Switch to spline tab to show selection
        this.switchTab('spline-tab');
        
        this.updateSplineTable();
        this.updateSelectionInfo();
        this.highlightSelectedPoints();
        
        console.log(`Selected sequence ${seqIndex + 1} with ${sequence.points.length} points`);
    }

    updateSplineTable() {
        if (!this.splineTableBody) return;
        
        this.splineTableBody.innerHTML = '';
        
        // Get sequences to apply visual grouping
        const sequences = this.identifySequences();
        // Use semi-transparent colors that work in both light and dark modes
        const sequenceColors = [
            'rgba(102, 126, 234, 0.1)',  // blue
            'rgba(234, 102, 126, 0.1)',  // red
            'rgba(102, 234, 126, 0.1)',  // green
            'rgba(234, 200, 102, 0.1)',  // yellow
            'rgba(200, 102, 234, 0.1)'   // purple
        ];
        
        this.splinePoints.forEach((point, index) => {
            if (!point.velocity) point.velocity = 30; // Default velocity in mm/s
            point.id = index + 1; // Always update ID to match current position

            const row = document.createElement('tr');
            const isSelected = this.selectedPoints.has(index);
            if (isSelected) row.classList.add('selected');
            
            // Find which sequence this point belongs to
            const seqIndex = sequences.findIndex(seq => seq.points.includes(index));
            if (seqIndex >= 0) {
                row.dataset.sequenceIndex = seqIndex;
                row.style.setProperty('--sequence-color', sequenceColors[seqIndex % sequenceColors.length]);
                row.classList.add('sequence-row');
            }

            row.innerHTML = `
                <td><input type="checkbox" class="point-checkbox" data-index="${index}" ${isSelected ? 'checked' : ''}></td>
                <td>${point.id}</td>
                <td><input type="number" class="coord-input" data-index="${index}" data-coord="y" value="${point.y.toFixed(2)}" step="0.1"></td>
                <td><input type="number" class="coord-input" data-index="${index}" data-coord="x" value="${point.x.toFixed(2)}" step="0.1"></td>
                <td><input type="number" class="velocity-input" data-index="${index}" value="${point.velocity}" min="0" step="0.1"></td>
                <td>
                    <button class="btn-mini edit" onclick="window.splineApp.focusPoint(${index})">📍</button>
                    <button class="btn-mini" onclick="window.splineApp.removePoint(${index})">🗑️</button>
                </td>
            `;
        
            this.splineTableBody.appendChild(row);
        });
        
        // Add hover event listeners for sequence rows
        document.querySelectorAll('.sequence-row').forEach(row => {
            row.addEventListener('mouseenter', (e) => {
                const seqIndex = parseInt(e.currentTarget.dataset.sequenceIndex);
                if (!isNaN(seqIndex)) {
                    this.highlightSequenceOnCanvas(seqIndex);
                }
            });
            
            row.addEventListener('mouseleave', () => {
                this.clearSequenceHighlightOnCanvas();
            });
        });
        
        // Add event listeners for velocity inputs
        document.querySelectorAll('.velocity-input').forEach(input => {
            input.addEventListener('change', (e) => {
                const index = parseInt(e.target.dataset.index);
                const value = parseFloat(e.target.value);
                if (!isNaN(value) && value >= 0) {
                    this.splinePoints[index].velocity = value;
                }
            });
            
            // Add validation on blur
            input.addEventListener('blur', (e) => {
                const value = parseFloat(e.target.value);
                if (isNaN(value) || value < 0) {
                    const index = parseInt(e.target.dataset.index);
                    e.target.value = this.splinePoints[index].velocity || 30;
                }
            });
        });
        
        // Add event listeners for coordinate inputs
        document.querySelectorAll('.coord-input').forEach(input => {
            input.addEventListener('change', (e) => {
                const index = parseInt(e.target.dataset.index);
                const coord = e.target.dataset.coord;
                const value = parseFloat(e.target.value);
                
                if (!isNaN(value)) {
                    // Update the point coordinates
                    this.splinePoints[index][coord] = value;
                    
                    // Redraw the spline and shapes
                    this.drawSpline();
                    this.highlightSelectedPoints();
                }
            });
            
            // Add input validation on blur
            input.addEventListener('blur', (e) => {
                const value = parseFloat(e.target.value);
                if (isNaN(value)) {
                    const index = parseInt(e.target.dataset.index);
                    const coord = e.target.dataset.coord;
                    e.target.value = this.splinePoints[index][coord].toFixed(2);
                }
            });
        });
        
        // Add event listeners for checkboxes with shift selection
        document.querySelectorAll('.point-checkbox').forEach(checkbox => {
            checkbox.addEventListener('click', (e) => this.handlePointSelection(e));
        });
        
        this.updatePointCount();
        this.updateSelectedCount();
        this.updateSplineLength();
        this.highlightSelectedPoints();
        
        // Update sequences view if sequences tab is active
        const sequencesTab = document.getElementById('sequences-tab');
        if (sequencesTab && sequencesTab.classList.contains('active')) {
            this.updateSequencesView();
        }
    }

    updatePointCount() {
        const pointCountElement = document.getElementById('pointCount');
        if (pointCountElement) {
            pointCountElement.textContent = `${this.splinePoints.length} punti`;
        }
    }

    updateSplineLength() {
        const splineLengthElement = document.getElementById('splineLength');
        if (splineLengthElement) {
            const length = this.splinePoints.length >= 2 ? this.calculateSplineLength() : 0;
            splineLengthElement.textContent = `Lunghezza: ${length.toFixed(1)} mm`;
        }
    }

    updateSelectedCount() {
        const selectedCountElement = document.getElementById('selectedCount');
        if (selectedCountElement) {
            selectedCountElement.textContent = `${this.selectedPoints.size} selezionati`;
        }
        
        // Update select all checkbox
        const selectAllCheckbox = document.getElementById('selectAllPoints');
        if (selectAllCheckbox) {
            if (this.splinePoints.length === 0) {
                selectAllCheckbox.checked = false;
                selectAllCheckbox.indeterminate = false;
            } else if (this.selectedPoints.size === this.splinePoints.length) {
                selectAllCheckbox.checked = true;
                selectAllCheckbox.indeterminate = false;
            } else if (this.selectedPoints.size > 0) {
                selectAllCheckbox.checked = false;
                selectAllCheckbox.indeterminate = true;
            } else {
                selectAllCheckbox.checked = false;
                selectAllCheckbox.indeterminate = false;
            }
        }
    }

    updateShapesTable() {
        if (!this.shapesTableBody) return;
        
        this.shapesTableBody.innerHTML = '';
        
        this.shapes.forEach((shape, index) => {
            if (!shape.id) shape.id = index + 1;
            
            const dimensions = this.getShapeDimensions(shape);
            const position = this.getShapePosition(shape);
            
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${shape.id}</td>
                <td>${shape.type === 'rectangle' ? 'Rettangolo' : 'Cerchio'}</td>
                <td><input type="number" class="shape-coord-input" data-index="${index}" data-coord="x" value="${position.x.toFixed(2)}" step="0.1"></td>
                <td><input type="number" class="shape-coord-input" data-index="${index}" data-coord="y" value="${position.y.toFixed(2)}" step="0.1"></td>
                <td>${this.getEditableDimensions(shape, index)}</td>
                <td>
                    <button class="btn-mini edit" onclick="window.splineApp.focusShape(${index})">📍</button>
                    <button class="btn-mini" onclick="window.splineApp.removeShape(${index})">🗑️</button>
                </td>
            `;
            this.shapesTableBody.appendChild(row);
        });
        
        // Add event listeners for shape coordinate inputs
        document.querySelectorAll('.shape-coord-input').forEach(input => {
            input.addEventListener('input', (e) => {
                const index = parseInt(e.target.dataset.index);
                const coord = e.target.dataset.coord;
                const value = parseFloat(e.target.value);
                
                if (!isNaN(value)) {
                    this.updateShapePosition(index, coord, value);
                }
            });
            
            input.addEventListener('change', (e) => {
                const index = parseInt(e.target.dataset.index);
                const coord = e.target.dataset.coord;
                const value = parseFloat(e.target.value);
                
                if (!isNaN(value)) {
                    this.updateShapePosition(index, coord, value);
                }
            });
            
            input.addEventListener('blur', (e) => {
                const value = parseFloat(e.target.value);
                if (isNaN(value)) {
                    const index = parseInt(e.target.dataset.index);
                    const coord = e.target.dataset.coord;
                    const position = this.getShapePosition(this.shapes[index]);
                    e.target.value = position[coord].toFixed(2);
                }
            });
        });
        
        // Add event listeners for shape dimension inputs
        document.querySelectorAll('.shape-dimension-input').forEach(input => {
            input.addEventListener('input', (e) => {
                const index = parseInt(e.target.dataset.index);
                const dimension = e.target.dataset.dimension;
                const value = parseFloat(e.target.value);
                
                if (!isNaN(value) && value > 0) {
                    this.updateShapeDimension(index, dimension, value);
                }
            });
            
            input.addEventListener('change', (e) => {
                const index = parseInt(e.target.dataset.index);
                const dimension = e.target.dataset.dimension;
                const value = parseFloat(e.target.value);
                
                if (!isNaN(value) && value > 0) {
                    this.updateShapeDimension(index, dimension, value);
                }
            });
        });
        
        this.updateShapesCount();
    }

    getShapeDimensions(shape) {
        const width = Math.abs(shape.end.x - shape.start.x);
        const height = Math.abs(shape.end.y - shape.start.y);
        
        if (shape.type === 'rectangle') {
            return `${width.toFixed(1)} × ${height.toFixed(1)} mm`;
        } else if (shape.type === 'circle') {
            const radius = Math.sqrt(width * width + height * height);
            return `⌀ ${(radius * 2).toFixed(1)} mm`;
        }
        return '';
    }

    getEditableDimensions(shape, index) {
        const width = Math.abs(shape.end.x - shape.start.x);
        const height = Math.abs(shape.end.y - shape.start.y);
        
        if (shape.type === 'rectangle') {
            return `<input type="number" class="shape-dimension-input" data-index="${index}" data-dimension="width" value="${width.toFixed(1)}" min="0.1" step="0.1" style="width:45px"> × 
                    <input type="number" class="shape-dimension-input" data-index="${index}" data-dimension="height" value="${height.toFixed(1)}" min="0.1" step="0.1" style="width:45px"> mm`;
        } else if (shape.type === 'circle') {
            // Per i cerchi, il raggio è la distanza tra start e end
            const radius = Math.sqrt(width * width + height * height);
            const diameter = radius * 2;
            return `⌀ <input type="number" class="shape-dimension-input" data-index="${index}" data-dimension="diameter" value="${diameter.toFixed(1)}" min="0.1" step="0.1" style="width:55px"> mm`;
        }
        return '';
    }

    getShapePosition(shape) {
        if (shape.type === 'rectangle') {
            // Per i rettangoli, restituiamo la posizione dell'angolo di partenza (start)
            return {
                x: shape.start.x,
                y: shape.start.y
            };
        } else if (shape.type === 'circle') {
            return shape.start; // Center of circle
        }
        return { x: 0, y: 0 };
    }

    updatePointCount() {
        if (this.pointCountDisplay) {
            this.pointCountDisplay.textContent = `${this.splinePoints.length} punti`;
        }
    }

    handlePointSelection(e) {
        const checkbox = e.target;
        const index = parseInt(checkbox.dataset.index);
        const isShiftPressed = e.shiftKey;
        
        if (isShiftPressed && this.lastSelectedIndex !== -1) {
            // Shift selection: select range
            const start = Math.min(this.lastSelectedIndex, index);
            const end = Math.max(this.lastSelectedIndex, index);
            
            // For shift selection, we always extend the current selection
            // (don't clear unless Ctrl is explicitly held to modify behavior)
            
            // Select range
            for (let i = start; i <= end; i++) {
                this.selectedPoints.add(i);
                const cb = document.querySelector(`.point-checkbox[data-index="${i}"]`);
                if (cb) cb.checked = true;
            }
        } else {
            // Normal selection
            if (checkbox.checked) {
                this.selectedPoints.add(index);
            } else {
                this.selectedPoints.delete(index);
            }
        }
        
        this.lastSelectedIndex = index;
        this.updateSelectedCount();
        this.updateTableSelection();
        this.highlightSelectedPoints();
    }

    updateTableSelection() {
        // Update row styling based on selection
        document.querySelectorAll('#splineTableBody tr').forEach((row, index) => {
            if (this.selectedPoints.has(index)) {
                row.classList.add('selected');
            } else {
                row.classList.remove('selected');
            }
        });
    }

    scrollToPointInTable(pointIndex) {
        // Find the table row for this point
        const tableRow = document.querySelector(`#splineTableBody tr:nth-child(${pointIndex + 1})`);
        if (!tableRow) return;
        
        // Find the table container
        const tableContainer = document.querySelector('.table-container');
        if (!tableContainer) return;
        
        // Calculate scroll position to center the row in view
        const rowTop = tableRow.offsetTop;
        const rowHeight = tableRow.offsetHeight;
        const containerHeight = tableContainer.clientHeight;
        const scrollTop = rowTop - (containerHeight / 2) + (rowHeight / 2);
        
        // Smooth scroll to the row
        tableContainer.scrollTo({
            top: Math.max(0, scrollTop),
            behavior: 'smooth'
        });
        
        console.log(`Scrolled to point ${pointIndex + 1} in table`);
    }

    highlightSelectedPoints() {
        // Redraw spline to clear previous highlights
        this.drawSpline();
        
        // Highlight selected points on canvas
        if (this.selectedPoints.size > 0) {
            this.splineCtx.save();
            this.splineCtx.strokeStyle = '#ff6600';
            this.splineCtx.fillStyle = '#ff6600';
            this.splineCtx.lineWidth = 3;
            
            this.selectedPoints.forEach(index => {
                if (index < this.splinePoints.length) {
                    const point = this.splinePoints[index];
                    const screenPos = this.worldToScreen(point.x, point.y);
                    
                    // Draw selection ring
                    this.splineCtx.beginPath();
                    this.splineCtx.arc(screenPos.x, screenPos.y, 8, 0, 2 * Math.PI);
                    this.splineCtx.stroke();
                    
                    // Draw filled center
                    this.splineCtx.beginPath();
                    this.splineCtx.arc(screenPos.x, screenPos.y, 4, 0, 2 * Math.PI);
                    this.splineCtx.fill();
                }
            });
            
            this.splineCtx.restore();
        }
    }

    highlightSequenceOnCanvas(seqIndex) {
        const sequences = this.identifySequences();
        if (seqIndex < 0 || seqIndex >= sequences.length) return;
        
        const sequence = sequences[seqIndex];
        
        // Redraw to clear previous highlights
        this.drawSpline();
        
        // Draw highlight for sequence points
        this.splineCtx.save();
        this.splineCtx.strokeStyle = '#667eea';
        this.splineCtx.fillStyle = '#667eea';
        this.splineCtx.lineWidth = 2;
        
        sequence.points.forEach(index => {
            if (index < this.splinePoints.length) {
                const point = this.splinePoints[index];
                const screenPos = this.worldToScreen(point.x, point.y);
                
                // Draw highlight ring
                this.splineCtx.beginPath();
                this.splineCtx.arc(screenPos.x, screenPos.y, 10, 0, 2 * Math.PI);
                this.splineCtx.stroke();
                
                // Draw filled center
                this.splineCtx.beginPath();
                this.splineCtx.arc(screenPos.x, screenPos.y, 5, 0, 2 * Math.PI);
                this.splineCtx.fill();
            }
        });
        
        this.splineCtx.restore();
        
        // Re-highlight selected points if any
        if (this.selectedPoints.size > 0) {
            this.splineCtx.save();
            this.splineCtx.strokeStyle = '#ff6600';
            this.splineCtx.fillStyle = '#ff6600';
            this.splineCtx.lineWidth = 3;
            
            this.selectedPoints.forEach(index => {
                if (index < this.splinePoints.length) {
                    const point = this.splinePoints[index];
                    const screenPos = this.worldToScreen(point.x, point.y);
                    
                    this.splineCtx.beginPath();
                    this.splineCtx.arc(screenPos.x, screenPos.y, 8, 0, 2 * Math.PI);
                    this.splineCtx.stroke();
                    
                    this.splineCtx.beginPath();
                    this.splineCtx.arc(screenPos.x, screenPos.y, 4, 0, 2 * Math.PI);
                    this.splineCtx.fill();
                }
            });
            
            this.splineCtx.restore();
        }
    }

    clearSequenceHighlightOnCanvas() {
        this.drawSpline();
        this.highlightSelectedPoints();
    }
    
    drawSelectionBox() {
        if (!this.selectBoxStart || !this.selectBoxEnd) return;
        
        // Clear and redraw spline
        this.splineCtx.clearRect(0, 0, this.canvasWidth, this.canvasHeight);
        this.drawSpline();
        this.highlightSelectedPoints();
        
        // Draw selection rectangle
        this.splineCtx.save();
        this.splineCtx.strokeStyle = '#667eea';
        this.splineCtx.fillStyle = 'rgba(102, 126, 234, 0.1)';
        this.splineCtx.lineWidth = 2;
        this.splineCtx.setLineDash([5, 5]);
        
        const x = Math.min(this.selectBoxStart.x, this.selectBoxEnd.x);
        const y = Math.min(this.selectBoxStart.y, this.selectBoxEnd.y);
        const width = Math.abs(this.selectBoxEnd.x - this.selectBoxStart.x);
        const height = Math.abs(this.selectBoxEnd.y - this.selectBoxStart.y);
        
        this.splineCtx.fillRect(x, y, width, height);
        this.splineCtx.strokeRect(x, y, width, height);
        this.splineCtx.restore();
    }
    
    finishSelectionBox(e) {
        if (!this.selectBoxStart || !this.selectBoxEnd) return;
        
        const minX = Math.min(this.selectBoxStart.x, this.selectBoxEnd.x);
        const maxX = Math.max(this.selectBoxStart.x, this.selectBoxEnd.x);
        const minY = Math.min(this.selectBoxStart.y, this.selectBoxEnd.y);
        const maxY = Math.max(this.selectBoxStart.y, this.selectBoxEnd.y);
        
        // Find all points within the selection box
        const pointsInBox = [];
        this.splinePoints.forEach((point, index) => {
            const screenPos = this.worldToScreen(point.x, point.y);
            if (screenPos.x >= minX && screenPos.x <= maxX &&
                screenPos.y >= minY && screenPos.y <= maxY) {
                pointsInBox.push(index);
            }
        });
        
        // Select the points
        if (!e.ctrlKey) {
            this.selectedPoints.clear();
        }
        
        pointsInBox.forEach(index => {
            this.selectedPoints.add(index);
        });
        
        // Update checkboxes
        document.querySelectorAll('.point-checkbox').forEach((checkbox, index) => {
            checkbox.checked = this.selectedPoints.has(index);
        });
        
        this.updateSelectedCount();
        this.updateTableSelection();
    }

    updateSelectedCount() {
        if (this.selectedCountDisplay) {
            this.selectedCountDisplay.textContent = `${this.selectedPoints.size} selezionati`;
        }
        
        // Show/hide delete button based on selection
        if (this.deleteSelectedBtn) {
            if (this.selectedPoints.size > 0) {
                this.deleteSelectedBtn.style.display = 'inline-flex';
            } else {
                this.deleteSelectedBtn.style.display = 'none';
            }
        }
    }

    updateShapesCount() {
        if (this.shapesCountDisplay) {
            this.shapesCountDisplay.textContent = `${this.shapes.length} geometrie`;
        }
    }

    toggleSelectAllPoints(selectAll) {
        if (selectAll) {
            // Select all points
            this.selectedPoints.clear();
            for (let i = 0; i < this.splinePoints.length; i++) {
                this.selectedPoints.add(i);
            }
        } else {
            // Deselect all points
            this.selectedPoints.clear();
        }
        
        // Update checkboxes
        document.querySelectorAll('.point-checkbox').forEach((checkbox, index) => {
            checkbox.checked = selectAll;
        });
        
        this.updateSelectedCount();
        this.updateTableSelection();
        this.highlightSelectedPoints();
    }

    applyBulkVelocity() {
        const velocity = parseFloat(this.bulkVelocityInput.value);
        if (isNaN(velocity) || velocity < 0) {
            alert('Inserire una velocità valida (mm/s)');
            return;
        }
        
        if (this.selectedPoints.size === 0) {
            alert('Selezionare almeno un punto');
            return;
        }
        
        this.selectedPoints.forEach(index => {
            if (index < this.splinePoints.length) {
                this.splinePoints[index].velocity = velocity;
            }
        });
        
        // Deselect all points after applying velocity
        this.selectedPoints.clear();
        
        // Update checkboxes in table
        document.querySelectorAll('.point-checkbox').forEach(checkbox => {
            checkbox.checked = false;
        });
        
        // Update displays and graphics
        this.updateSelectedCount();
        this.updateTableSelection();
        this.highlightSelectedPoints();
        this.updateSplineTable();
        this.bulkVelocityInput.value = '';
    }

    offsetBulkX(){
        const xValue = parseFloat(this.bulkTransformXInput.value);
        if (isNaN(xValue) || xValue == 0) {
            alert('Inserire un valore valido');
            return;
        }
        
        if (this.selectedPoints.size === 0) {
            alert('Selezionare almeno un punto');
            return;
        }

        this.selectedPoints.forEach(index => {
            if (index < this.splinePoints.length) {
                this.splinePoints[index].x += xValue;
            }
        });
        
        // Deselect all points after applying xValue
        this.selectedPoints.clear();
        
        // Update checkboxes in table
        document.querySelectorAll('.point-checkbox').forEach(checkbox => {
            checkbox.checked = false;
        });
        
        // Update displays and graphics
        this.updateSelectedCount();
        this.updateTableSelection();
        this.highlightSelectedPoints();
        this.updateSplineTable();
        this.bulkVelocityInput.value = '';
    }

    setBulkX(){
        const xValue = parseFloat(this.bulkTransformXInput.value);
        if (isNaN(xValue)) {
            alert('Inserire un valore valido');
            return;
        }
        
        if (this.selectedPoints.size === 0) {
            alert('Selezionare almeno un punto');
            return;
        }

        this.selectedPoints.forEach(index => {
            if (index < this.splinePoints.length) {
                this.splinePoints[index].x = xValue;
            }
        });
        
        // Deselect all points after applying xValue
        this.selectedPoints.clear();
        
        // Update checkboxes in table
        document.querySelectorAll('.point-checkbox').forEach(checkbox => {
            checkbox.checked = false;
        });
        
        // Update displays and graphics
        this.updateSelectedCount();
        this.updateTableSelection();
        this.highlightSelectedPoints();
        this.updateSplineTable();
        this.bulkVelocityInput.value = '';
    }

    offsetBulkY(){
        const yValue = parseFloat(this.bulkTransformYInput.value);
        if (isNaN(yValue) || yValue == 0) {
            alert('Inserire un valore valido');
            return;
        }
        
        if (this.selectedPoints.size === 0) {
            alert('Selezionare almeno un punto');
            return;
        }

        this.selectedPoints.forEach(index => {
            if (index < this.splinePoints.length) {
                this.splinePoints[index].y += yValue;
            }
        });
        
        // Deselect all points after applying xValue
        this.selectedPoints.clear();
        
        // Update checkboxes in table
        document.querySelectorAll('.point-checkbox').forEach(checkbox => {
            checkbox.checked = false;
        });
        
        // Update displays and graphics
        this.updateSelectedCount();
        this.updateTableSelection();
        this.highlightSelectedPoints();
        this.updateSplineTable();
        this.bulkVelocityInput.value = '';
    }

    setBulkY(){
        const yValue = parseFloat(this.bulkTransformYInput.value);
        if (isNaN(yValue)) {
            alert('Inserire un valore valido');
            return;
        }
        
        if (this.selectedPoints.size === 0) {
            alert('Selezionare almeno un punto');
            return;
        }

        this.selectedPoints.forEach(index => {
            if (index < this.splinePoints.length) {
                this.splinePoints[index].y = yValue;
            }
        });
        
        // Deselect all points after applying xValue
        this.selectedPoints.clear();
        
        // Update checkboxes in table
        document.querySelectorAll('.point-checkbox').forEach(checkbox => {
            checkbox.checked = false;
        });
        
        // Update displays and graphics
        this.updateSelectedCount();
        this.updateTableSelection();
        this.highlightSelectedPoints();
        this.updateSplineTable();
        this.bulkVelocityInput.value = '';
    }

    deleteSelectedPoints() {
        if (this.selectedPoints.size === 0) {
            alert('Selezionare almeno un punto da eliminare');
            return;
        }
        
        const count = this.selectedPoints.size;
        const confirmMessage = count === 1 ? 
            'Eliminare il punto selezionato?' : 
            `Eliminare ${count} punti selezionati?`;
        
        if (!confirm(confirmMessage)) {
            return;
        }
        
        // Convert Set to sorted array (descending order to avoid index shifting)
        const indicesToDelete = Array.from(this.selectedPoints).sort((a, b) => b - a);
        
        // Remove points from highest index to lowest to avoid index shifting issues
        indicesToDelete.forEach(index => {
            if (index < this.splinePoints.length) {
                this.splinePoints.splice(index, 1);
            }
        });
        
        // Clear selection
        this.selectedPoints.clear();
        this.lastSelectedIndex = -1;
        
        // Update displays and graphics
        this.updateSelectedCount();
        this.updateSplineTable();
        this.highlightSelectedPoints();
        this.drawSpline();
        this.updateSplineLength();
        this.updatePointCount();
        
        // Save current path data
        this.saveCurrentPathToIndex();
        
        console.log(`Deleted ${count} points`);
    }

    removePoint(index) {
        if (confirm('Rimuovere questo punto?')) {
            this.splinePoints.splice(index, 1);
            
            // Update selected points after removal
            const newSelectedPoints = new Set();
            this.selectedPoints.forEach(selectedIndex => {
                if (selectedIndex < index) {
                    newSelectedPoints.add(selectedIndex);
                } else if (selectedIndex > index) {
                    newSelectedPoints.add(selectedIndex - 1);
                }
                // Skip the removed index
            });
            this.selectedPoints = newSelectedPoints;
            
            this.drawSpline();
            this.updateSplineTable();
        }
    }

    removeSelectedPoints() {
        if (this.selectedPoints.size === 0) {
            alert('Nessun punto selezionato');
            return;
        }
        
        if (confirm(`Rimuovere ${this.selectedPoints.size} punti selezionati?`)) {
            // Convert to array and sort in descending order to avoid index shifting
            const sortedIndices = Array.from(this.selectedPoints).sort((a, b) => b - a);
            
            sortedIndices.forEach(index => {
                this.splinePoints.splice(index, 1);
            });
            
            this.selectedPoints.clear();
            this.lastSelectedIndex = null;
            this.drawSpline();
            this.updateSplineTable();
        }
    }

    removeShape(index) {
        if (confirm('Rimuovere questa geometria?')) {
            this.shapes.splice(index, 1);
            this.redrawShapes();
            this.updateShapesTable();
        }
    }

    focusPoint(index) {
        // Highlight point on canvas (temporary visual feedback)
        const point = this.splinePoints[index];
        const screenPos = this.worldToScreen(point.x, point.y);
        
        this.splineCtx.save();
        this.splineCtx.strokeStyle = '#ff0000';
        this.splineCtx.lineWidth = 3;
        this.splineCtx.beginPath();
        this.splineCtx.arc(screenPos.x, screenPos.y, 8, 0, 2 * Math.PI);
        this.splineCtx.stroke();
        this.splineCtx.restore();
        
        setTimeout(() => this.drawSpline(), 1000);
    }

    focusShape(index) {
        // Highlight shape on canvas (temporary visual feedback)
        const shape = this.shapes[index];
        const start = this.worldToScreen(shape.start.x, shape.start.y);
        const end = this.worldToScreen(shape.end.x, shape.end.y);
        
        this.shapeCtx.save();
        this.shapeCtx.strokeStyle = '#ff0000';
        this.shapeCtx.lineWidth = 4;
        this.shapeCtx.setLineDash([5, 5]);
        this.shapeCtx.beginPath();
        
        if (shape.type === 'rectangle') {
            const width = end.x - start.x;
            const height = end.y - start.y;
            this.shapeCtx.rect(start.x, start.y, width, height);
        } else if (shape.type === 'circle') {
            const radius = Math.sqrt(Math.pow(end.x - start.x, 2) + Math.pow(end.y - start.y, 2));
            this.shapeCtx.arc(start.x, start.y, radius, 0, 2 * Math.PI);
        }
        
        this.shapeCtx.stroke();
        this.shapeCtx.restore();
        
        setTimeout(() => this.redrawShapes(), 1000);
    }

    // Snap indicator
    drawSnapIndicator(worldPos) {
        if (!this.settings.enableSnap) return;
        
        // Clear previous indicator
        this.clearSnapIndicator();
        
        // Draw snap indicator on spline canvas (temporary overlay)
        const screenPos = this.worldToScreen(worldPos.x, worldPos.y);
        
        this.splineCtx.save();
        this.splineCtx.strokeStyle = '#ff6600';
        this.splineCtx.fillStyle = '#ff6600';
        this.splineCtx.lineWidth = 1;
        this.splineCtx.setLineDash([2, 2]);
        
        // Draw crosshair
        this.splineCtx.beginPath();
        this.splineCtx.moveTo(screenPos.x - 8, screenPos.y);
        this.splineCtx.lineTo(screenPos.x + 8, screenPos.y);
        this.splineCtx.moveTo(screenPos.x, screenPos.y - 8);
        this.splineCtx.lineTo(screenPos.x, screenPos.y + 8);
        this.splineCtx.stroke();
        
        // Draw small circle
        this.splineCtx.setLineDash([]);
        this.splineCtx.beginPath();
        this.splineCtx.arc(screenPos.x, screenPos.y, 3, 0, 2 * Math.PI);
        this.splineCtx.fill();
        
        this.splineCtx.restore();
        
        // Store indicator position to clear it later
        this.lastSnapIndicator = { x: screenPos.x, y: screenPos.y };
    }

    clearSnapIndicator() {
        if (this.lastSnapIndicator) {
            // Instead of clearRect (which might erase parts of the spline),
            // redraw the spline to remove the indicator
            this.drawSpline();
            this.lastSnapIndicator = null;
        }
    }

    // Utility functions
    updateCoordinates(worldPos, snappedPos = null) {
        if (snappedPos && this.settings.enableSnap) {
            this.coordinatesDisplay.textContent = 
                `${this.settings.xAxisLabel}: ${worldPos.x.toFixed(1)} mm → ${snappedPos.x.toFixed(1)} mm, ${this.settings.yAxisLabel}: ${worldPos.y.toFixed(1)} mm → ${snappedPos.y.toFixed(1)} mm`;
        } else {
            this.coordinatesDisplay.textContent = 
                `${this.settings.xAxisLabel}: ${worldPos.x.toFixed(1)} mm, ${this.settings.yAxisLabel}: ${worldPos.y.toFixed(1)} mm`;
        }
    }

    clearSpline() {
        if (confirm('Eliminare tutti i punti della spline?')) {
            // Save current path before clearing
            this.saveCurrentPathToIndex();
            
            this.splinePoints = [];
            this.selectedPoints.clear();
            this.lastSelectedIndex = null;
            
            // Stop any running animation
            this.stopAnimation();
            
            // Clear the spline canvas
            this.splineCtx.clearRect(0, 0, this.canvasWidth, this.canvasHeight);
            
            // Clear the animation canvas
            this.animationCtx.clearRect(0, 0, this.canvasWidth, this.canvasHeight);
            
            this.updateSplineTable();
            
            // Update saved path with cleared data
            this.saveCurrentPathToIndex();
        }
    }

    clearShapes() {
        if (confirm('Eliminare tutte le geometrie?')) {
            // Save current path before clearing
            this.saveCurrentPathToIndex();
            
            this.shapes = [];
            
            // Clear the shapes canvas
            this.shapeCtx.clearRect(0, 0, this.canvasWidth, this.canvasHeight);
            
            this.updateShapesTable();
            
            // Update saved path with cleared data
            this.saveCurrentPathToIndex();
        }
    }

    // Generate timestamp for filename
    generateTimestamp() {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        const seconds = String(now.getSeconds()).padStart(2, '0');
        return `${year}${month}${day}_${hours}${minutes}${seconds}`;
    }

    async saveProject() {
        // Save current path to current index before saving
        this.saveCurrentPathToIndex();
        
        // Get project name from settings with timestamp
        const projectName = this.settings.basename;
        const timestamp = this.generateTimestamp();
        const fileName = `${projectName}_${timestamp}`;
        
        const projectData = {
            version: '2.0', // Updated version for multi-path support
            timestamp: new Date().toISOString(),
            projectName: projectName,
            currentProgramIndex: this.currentProgramIndex,
            settings: this.settings,
            programPaths: this.programPaths // All paths indexed by program number
        };
        
        const dataStr = JSON.stringify(projectData, null, 2);
        
        // Direct download to Downloads folder (no folder selection)
        this.downloadFile(dataStr, `${fileName}.json`, 'application/json');
        console.log(`Project downloaded: ${fileName}.json with ${Object.keys(this.programPaths).length} program paths`);
    }

    // Helper function for file download
    downloadFile(content, filename, contentType) {
        const dataBlob = new Blob([content], { type: contentType });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(dataBlob);
        link.download = filename;
        link.click();
        URL.revokeObjectURL(link.href);
    }

    loadProject(event) {
        const file = event.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const projectData = JSON.parse(e.target.result);
                
                console.log('Loading project data:', projectData);
                
                // Validate project data - support both v1.0 and v2.0 formats
                if (!projectData.version) {
                    throw new Error('File non valido: versione mancante');
                }
                
                // For v2.0+ check for programPaths, for v1.0 check for splinePoints/shapes
                if (projectData.version === '2.0') {
                    if (!projectData.programPaths && !projectData.settings) {
                        throw new Error('File non valido: dati del progetto v2.0 mancanti');
                    }
                } else {
                    if (!projectData.splinePoints || !projectData.shapes) {
                        throw new Error('File non valido: dati del progetto v1.0 mancanti');
                    }
                }
                
                // Clear everything before loading new project
                this.splinePoints = [];
                this.shapes = [];
                this.selectedPoints.clear();
                this.lastSelectedIndex = null;
                this.lastSnapIndicator = null;
                this.programPaths = {}; // Clear all program paths
                
                // Clear all canvases
                this.clearAllCanvases();
                
                // Load data from project
                if (projectData.settings) {
                    // Merge settings ensuring all new properties are included
                    this.settings = { 
                        ...this.settings, 
                        ...projectData.settings,
                        // Ensure new settings have defaults if not present
                        xAxisLabel: projectData.settings.xAxisLabel || 'X',
                        yAxisLabel: projectData.settings.yAxisLabel || 'Y',
                        basename: projectData.settings.basename || projectData.projectName || 'program',
                        maxProgramNum: projectData.settings.maxProgramNum || 999
                    };
                    this.updateSettingsUI();
                    this.saveSettingsToStorage();
                }
                
                // Check if this is the new multi-path format (version 2.0+)
                if (projectData.version === '2.0' && projectData.programPaths) {
                    // New format: load all program paths
                    this.programPaths = projectData.programPaths;
                    this.currentProgramIndex = projectData.currentProgramIndex || 1;
                    
                    // Set program index selector
                    if (this.programIndex) {
                        this.programIndex.value = this.currentProgramIndex;
                    }
                    
                    // Load the current program path
                    this.loadPathFromIndex(this.currentProgramIndex);
                    
                    console.log(`Multi-path project loaded with ${Object.keys(this.programPaths).length} program paths`);
                } else {
                    // Legacy format: convert single path to multi-path format
                    const legacyIndex = projectData.programIndex || 1;
                    
                    this.programPaths[legacyIndex] = {
                        splinePoints: projectData.splinePoints || [],
                        shapes: projectData.shapes || [],
                        description: ''
                    };
                    
                    this.currentProgramIndex = legacyIndex;
                    this.splinePoints = projectData.splinePoints || [];
                    this.shapes = projectData.shapes || [];
                    
                    // Clear description for legacy projects
                    if (this.programDescription) {
                        this.programDescription.value = '';
                    }
                    
                    // Set program index selector
                    if (this.programIndex) {
                        this.programIndex.value = legacyIndex;
                    }
                    
                    console.log(`Legacy project converted to multi-path format at index ${legacyIndex}`);
                }
                
                // Redraw everything with updated settings
                this.drawGrid();
                this.updateTableHeaders();
                this.drawSpline();
                this.redrawShapes();
                this.updateSplineTable();
                this.updateShapesTable();
                
                alert('Progetto caricato con successo!');
                
            } catch (error) {
                alert('Errore nel caricamento del file: ' + error.message);
            }
        };
        
        reader.readAsText(file);
        
        // Reset file input
        event.target.value = '';
    }

    // Settings functionality
    openSettings() {
        this.settingsModal.style.display = 'block';
    }

    closeSettings() {
        this.settingsModal.style.display = 'none';
    }

    showCopyDialog() {
        const currentIndex = this.currentProgramIndex;
        const maxNum = this.settings.maxProgramNum;
        
        // Build list of available slots
        const availableSlots = [];
        for (let i = 1; i <= maxNum; i++) {
            if (i !== currentIndex) {
                availableSlots.push(i);
            }
        }
        
        // Create a simple prompt with available slots
        let message = `Copia il programma ${currentIndex} nello slot:\n\n`;
        message += `Inserisci un numero da 1 a ${maxNum} (eccetto ${currentIndex}):`;
        
        const targetSlot = prompt(message);
        
        if (targetSlot === null) {
            // User cancelled
            return;
        }
        
        const targetIndex = parseInt(targetSlot);
        
        // Validate input
        if (isNaN(targetIndex) || targetIndex < 1 || targetIndex > maxNum) {
            alert(`Numero non valido. Inserisci un numero da 1 a ${maxNum}.`);
            return;
        }
        
        if (targetIndex === currentIndex) {
            alert('Non puoi copiare un programma su se stesso!');
            return;
        }
        
        // Check if target slot has content
        const targetHasContent = this.programPaths[targetIndex] && 
            (this.programPaths[targetIndex].splinePoints?.length > 0 || 
             this.programPaths[targetIndex].shapes?.length > 0);
        
        if (targetHasContent) {
            const overwrite = confirm(`Lo slot ${targetIndex} contiene già un programma. Vuoi sovrascriverlo?`);
            if (!overwrite) {
                return;
            }
        }
        
        // Perform the copy
        this.copyProgramToSlot(targetIndex);
        
        alert(`Programma copiato con successo nello slot ${targetIndex}!`);
    }

    copyProgramToSlot(targetIndex) {
        const currentIndex = this.currentProgramIndex;
        
        // Deep copy current program data
        const currentData = {
            splinePoints: JSON.parse(JSON.stringify(this.splinePoints)),
            shapes: JSON.parse(JSON.stringify(this.shapes)),
            description: this.programDescription ? this.programDescription.value : ''
        };
        
        // Save to target slot
        this.programPaths[targetIndex] = currentData;
        
        console.log(`Program copied from slot ${currentIndex} to slot ${targetIndex}`);
    }

    updateCanvasScaling() {
        // Clear all canvases to ensure clean redraw
        if (this.gridCtx) {
            this.gridCtx.clearRect(0, 0, this.canvasWidth, this.canvasHeight);
        }
        if (this.shapeCtx) {
            this.shapeCtx.clearRect(0, 0, this.canvasWidth, this.canvasHeight);
        }
        if (this.splineCtx) {
            this.splineCtx.clearRect(0, 0, this.canvasWidth, this.canvasHeight);
        }
        if (this.animationCtx) {
            this.animationCtx.clearRect(0, 0, this.canvasWidth, this.canvasHeight);
        }
    }

    saveSettings() {
        this.settings.minX = parseInt(document.getElementById('minX').value);
        this.settings.maxX = parseInt(document.getElementById('maxX').value);
        this.settings.minY = parseInt(document.getElementById('minY').value);
        this.settings.maxY = parseInt(document.getElementById('maxY').value);
        this.settings.gridSize = parseInt(document.getElementById('gridSize').value);
        this.settings.snapSize = parseFloat(document.getElementById('snapSize').value);
        this.settings.enableSnap = document.getElementById('enableSnap').checked;
        this.settings.pixelsPerMm = parseFloat(document.getElementById('pixelsPerMm').value);
        this.settings.samplingDistance = parseFloat(document.getElementById('samplingDistance').value);
        this.settings.splineSmoothing = parseFloat(document.getElementById('splineSmoothing').value);
        this.settings.splineColor = document.getElementById('splineColor').value;
        this.settings.shapeColor = document.getElementById('shapeColor').value;
        this.settings.xAxisLabel = document.getElementById('xAxisLabel').value;
        this.settings.yAxisLabel = document.getElementById('yAxisLabel').value;
        this.settings.basename = document.getElementById('basename').value;
        this.settings.maxProgramNum = parseInt(document.getElementById('maxProgramNum').value);
        
        // Validate that X and Y axis labels are different
        if (this.settings.xAxisLabel === this.settings.yAxisLabel) {
            alert('Le etichette degli assi devono essere diverse!');
            return;
        }
        
        // Update canvas dimensions and scaling for new ranges
        this.updateCanvasScaling();
        
        this.saveSettingsToStorage();
        this.drawGrid();
        this.updateTableHeaders();
        this.redrawShapes();
        this.drawSpline();
        
        // Clear and redraw animation if any spline exists
        if (this.animationCtx) {
            this.animationCtx.clearRect(0, 0, this.canvasWidth, this.canvasHeight);
        }
        
        // Update program naming UI
        this.updateProgramNamingUI();
        
        this.closeSettings();
    }

    resetSettings() {
        this.settings = {
            minX: -100,
            maxX: 100,
            minY: -100,
            maxY: 100,
            gridSize: 10,
            snapSize: 1,
            enableSnap: true,
            pixelsPerMm: 1,
            samplingDistance: 2,
            splineSmoothing: 0.5,
            splineColor: '#ff0000',
            shapeColor: '#0066cc',
            xAxisLabel: 'X',
            yAxisLabel: 'Y',
            basename: 'program',
            maxProgramNum: 999
        };
        this.updateSettingsUI();
        this.saveSettingsToStorage();
        this.drawGrid();
        this.updateTableHeaders();
        this.redrawShapes();
        this.drawSpline();
    }

    updateSettingsUI() {
        console.log('Updating settings UI...');
        
        const elements = {
            'minX': this.settings.minX,
            'maxX': this.settings.maxX,
            'minY': this.settings.minY,
            'maxY': this.settings.maxY,
            'gridSize': this.settings.gridSize,
            'snapSize': this.settings.snapSize,
            'pixelsPerMm': this.settings.pixelsPerMm,
            'samplingDistance': this.settings.samplingDistance,
            'splineSmoothing': this.settings.splineSmoothing,
            'splineColor': this.settings.splineColor,
            'shapeColor': this.settings.shapeColor,
            'xAxisLabel': this.settings.xAxisLabel,
            'yAxisLabel': this.settings.yAxisLabel,
            'basename': this.settings.basename,
            'maxProgramNum': this.settings.maxProgramNum
        };
        
        for (const [id, value] of Object.entries(elements)) {
            const element = document.getElementById(id);
            if (element) {
                element.value = value;
            }
        }
        
        // Handle checkbox separately
        const enableSnapElement = document.getElementById('enableSnap');
        if (enableSnapElement) {
            enableSnapElement.checked = this.settings.enableSnap;
        }
        
        // Update program naming UI
        this.updateProgramNamingUI();
        
        const smoothingValue = document.getElementById('smoothingValue');
        if (smoothingValue) {
            smoothingValue.textContent = this.settings.splineSmoothing;
        }
        
        console.log('Settings UI updated');
    }

    updateProgramNamingUI() {
        // Update basename display
        if (this.programBasename) {
            this.programBasename.textContent = this.settings.basename || 'program';
        }
        
        // Update program index options and sync with current index
        if (this.programIndex) {
            const currentValue = this.currentProgramIndex || 1;
            this.programIndex.innerHTML = '';
            
            for (let i = 1; i <= this.settings.maxProgramNum; i++) {
                const option = document.createElement('option');
                option.value = i;
                option.textContent = i;
                if (i === currentValue) {
                    option.selected = true;
                }
                this.programIndex.appendChild(option);
            }
            
            // Ensure the selector shows the current index
            this.programIndex.value = currentValue;
        }
    }

    // Save current path to the selected program index
    saveCurrentPathToIndex() {
        const programIndex = this.currentProgramIndex || 1;
        const description = this.programDescription ? this.programDescription.value : '';
        this.programPaths[programIndex] = {
            splinePoints: [...this.splinePoints],
            shapes: [...this.shapes],
            description: description
        };
        console.log(`Path saved to program index ${programIndex}`, {
            splinePoints: this.splinePoints.length,
            shapes: this.shapes.length,
            description: description
        });
    }
    
    // Save current description
    saveCurrentDescription() {
        const programIndex = this.currentProgramIndex || 1;
        const description = this.programDescription ? this.programDescription.value : '';
        if (!this.programPaths[programIndex]) {
            this.programPaths[programIndex] = {
                splinePoints: [],
                shapes: [],
                description: description
            };
        } else {
            this.programPaths[programIndex].description = description;
        }
        console.log(`Description saved for program ${programIndex}`);
    }

    // Load path from the selected program index
    loadPathFromIndex(programIndex) {
        const targetIndex = parseInt(programIndex);
        
        // Save current path to the CURRENT index before switching (not the target)
        if (this.currentProgramIndex !== targetIndex) {
            this.saveCurrentPathToIndex();
        }
        
        if (this.programPaths[targetIndex]) {
            // Load the selected path
            this.splinePoints = [...this.programPaths[targetIndex].splinePoints];
            this.shapes = [...this.programPaths[targetIndex].shapes];
            
            // Load description
            if (this.programDescription) {
                this.programDescription.value = this.programPaths[targetIndex].description || '';
            }
            
            console.log(`Path loaded from program index ${targetIndex}`, {
                splinePointsLoaded: this.splinePoints.length,
                shapesLoaded: this.shapes.length,
                description: this.programPaths[targetIndex].description,
                allSavedPaths: Object.keys(this.programPaths)
            });
        } else {
            // Initialize empty path for new index
            this.splinePoints = [];
            this.shapes = [];
            
            // Clear description
            if (this.programDescription) {
                this.programDescription.value = '';
            }
            
            console.log(`New empty path created for program index ${targetIndex}`);
        }
        
        // Clear selections
        this.selectedPoints.clear();
        this.lastSelectedIndex = null;
        this.lastSnapIndicator = null;
        
        // Update current index AFTER loading
        this.currentProgramIndex = targetIndex;
        
        // Redraw everything
        this.clearAllCanvases();
        this.drawGrid();
        this.drawSpline();
        this.redrawShapes();
        this.updateSplineTable();
        this.updateShapesTable();
    }

    // Clear all canvases
    clearAllCanvases() {
        this.splineCtx.clearRect(0, 0, this.canvasWidth, this.canvasHeight);
        this.shapeCtx.clearRect(0, 0, this.canvasWidth, this.canvasHeight);
        this.animationCtx.clearRect(0, 0, this.canvasWidth, this.canvasHeight);
    }

    saveSettingsToStorage() {
        try {
            localStorage.setItem('splineGenerator_settings', JSON.stringify(this.settings));
            console.log('Settings saved to storage');
        } catch (e) {
            console.error('Error saving settings:', e);
        }
    }

    loadSettingsFromStorage() {
        try {
            const saved = localStorage.getItem('splineGenerator_settings');
            if (saved) {
                this.settings = { ...this.settings, ...JSON.parse(saved) };
                console.log('Settings loaded from storage');
            }
        } catch (e) {
            console.error('Error loading settings:', e);
        }
    }

    updateShapePosition(index, coord, value) {
        const shape = this.shapes[index];
        if (!shape) return;
        
        const currentPosition = this.getShapePosition(shape);
        const deltaX = coord === 'x' ? value - currentPosition.x : 0;
        const deltaY = coord === 'y' ? value - currentPosition.y : 0;
        
        console.log(`Updating shape ${index} position: ${coord} = ${value}, delta: ${deltaX}, ${deltaY}`);
        
        if (shape.type === 'rectangle') {
            // Per i rettangoli: spostiamo entrambi i punti per mantenere le dimensioni
            shape.start.x += deltaX;
            shape.start.y += deltaY;
            shape.end.x += deltaX;
            shape.end.y += deltaY;
        } else if (shape.type === 'circle') {
            // For circles: move start (center), keep radius by updating end
            const radius = Math.sqrt(
                Math.pow(shape.end.x - shape.start.x, 2) + 
                Math.pow(shape.end.y - shape.start.y, 2)
            );
            shape.start.x += deltaX;
            shape.start.y += deltaY;
            // Update end to maintain radius
            shape.end.x = shape.start.x + radius;
            shape.end.y = shape.start.y;
        }
        
        this.redrawShapes();
        // Don't call updateShapesTable() to avoid recursion - table will be updated when input loses focus
    }

    updateShapeDimension(index, dimension, value) {
        const shape = this.shapes[index];
        if (!shape) return;
        
        console.log(`Updating shape ${index} dimension: ${dimension} = ${value}`);
        
        if (shape.type === 'rectangle') {
            // Per i rettangoli: start è l'angolo, end è l'angolo opposto
            // Manteniamo start fisso e cambiamo end per ridimensionare
            if (dimension === 'width') {
                // Cambia solo la coordinata X di end mantenendo la larghezza
                const direction = shape.end.x > shape.start.x ? 1 : -1;
                shape.end.x = shape.start.x + (value * direction);
            } else if (dimension === 'height') {
                // Cambia solo la coordinata Y di end mantenendo l'altezza
                const direction = shape.end.y > shape.start.y ? 1 : -1;
                shape.end.y = shape.start.y + (value * direction);
            }
        } else if (shape.type === 'circle' && dimension === 'diameter') {
            // Per i cerchi: start è il centro, end definisce il raggio
            const radius = value / 2;
            // Manteniamo start come centro del cerchio
            const center = { x: shape.start.x, y: shape.start.y };
            // end rappresenta un punto sul raggio (distanza = raggio)
            shape.end.x = center.x + radius;
            shape.end.y = center.y; // punto sulla linea orizzontale per semplicità
        }
        
        this.redrawShapes();
        // Don't call updateShapesTable() to avoid recursion - table will be updated when input loses focus
    }

    getShapeCenter(shape) {
        return {
            x: (shape.start.x + shape.end.x) / 2,
            y: (shape.start.y + shape.end.y) / 2
        };
    }
    
    // Animation methods
    formatTime(milliseconds) {
        const totalSeconds = Math.floor(milliseconds / 1000);
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        const centiseconds = Math.floor((milliseconds % 1000) / 10);
        return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${centiseconds.toString().padStart(2, '0')}`;
    }
    
    updateTimeDisplay(elapsedTime) {
        if (this.timeDisplay) {
            const current = this.formatTime(elapsedTime);
            const total = this.formatTime(this.totalAnimationTime);
            this.timeDisplay.textContent = `${current} / ${total}`;
        }
    }
    
    calculateTotalAnimationTime() {
        if (this.splinePoints.length < 2) return 0;
        
        let totalTime = 0;
        for (let i = 0; i < this.splinePoints.length - 1; i++) {
            const velocity = this.splinePoints[i].velocity || 30; // mm/s
            const segmentLength = this.calculateSplineSegmentLength(i);
            totalTime += segmentLength / velocity; // seconds
        }
        
        return totalTime * 1000; // Convert to milliseconds
    }
    
    startAnimation() {
        if (this.splinePoints.length < 2) {
            alert('Aggiungi almeno 2 punti alla spline per avviare l\'animazione!');
            return;
        }
        
        this.isAnimating = true;
        
        if (!this.isPaused) {
            // Starting fresh animation - clear previous animation
            this.animationCtx.clearRect(0, 0, this.canvasWidth, this.canvasHeight);
            this.animationProgress = 0;
            this.totalAnimationTime = this.calculateTotalAnimationTime();
            this.virtualElapsedTime = 0;
            this.updateTimeDisplay(0);
        } else {
            // Resuming from pause
            this.isPaused = false;
        }
        
        // Set start time for real time tracking
        this.animationStartTime = performance.now();
        this.lastFrameTime = this.animationStartTime;
        
        // Update button visibility
        this.playBtn.style.display = 'none';
        this.pauseBtn.style.display = 'inline-block';
        
        this.animate();
    }
    
    pauseAnimation() {
        this.isPaused = true;
        this.isAnimating = false;
        
        if (this.animationRequestId) {
            cancelAnimationFrame(this.animationRequestId);
            this.animationRequestId = null;
        }
        
        // Update button visibility
        this.playBtn.style.display = 'inline-block';
        this.pauseBtn.style.display = 'none';
    }
    
    stopAnimation() {
        this.isAnimating = false;
        this.isPaused = false;
        this.animationProgress = 0;
        this.virtualElapsedTime = 0;
        
        if (this.animationRequestId) {
            cancelAnimationFrame(this.animationRequestId);
            this.animationRequestId = null;
        }
        
        // Clear animation canvas
        this.animationCtx.clearRect(0, 0, this.canvasWidth, this.canvasHeight);
        
        // Reset time display
        this.updateTimeDisplay(0);
        
        // Reset progress slider
        if (this.progressSlider) {
            this.progressSlider.value = 0;
        }
        
        // Update button visibility
        this.playBtn.style.display = 'inline-block';
        this.pauseBtn.style.display = 'none';
    }
    
    seekToProgress(progress) {
        // Calculate elapsed time based on progress (0 to 1)
        const targetTime = progress * this.totalAnimationTime;
        
        // Update virtual elapsed time
        this.virtualElapsedTime = targetTime;
        
        // Reset frame time for smooth continuation
        if (this.isAnimating) {
            this.lastFrameTime = performance.now();
        }
        
        // Clear and redraw at new position
        this.animationCtx.clearRect(0, 0, this.canvasWidth, this.canvasHeight);
        
        const position = this.calculateAnimationPosition(targetTime);
        if (position) {
            this.drawAnimatedSpline(position.segmentIndex, position.progress);
            this.drawPositionIndicator(position.x, position.y);
        }
        
        this.updateTimeDisplay(targetTime);
    }
    
    animate() {
        if (!this.isAnimating) return;
        
        const currentTime = performance.now();
        const deltaTime = currentTime - this.lastFrameTime;
        this.lastFrameTime = currentTime;
        
        // Advance virtual time based on real delta time and playback speed
        this.virtualElapsedTime += deltaTime * this.playbackSpeed;
        
        // Update time display
        this.updateTimeDisplay(this.virtualElapsedTime);
        
        // Update progress slider (if not manually seeking)
        if (!this.isManualSeeking && this.progressSlider && this.totalAnimationTime > 0) {
            const progress = Math.min(1, this.virtualElapsedTime / this.totalAnimationTime);
            this.progressSlider.value = Math.round(progress * 1000);
        }
        
        // Clear animation canvas
        this.animationCtx.clearRect(0, 0, this.canvasWidth, this.canvasHeight);
        
        // Calculate current position based on velocity
        const position = this.calculateAnimationPosition(this.virtualElapsedTime);
        
        if (position) {
            // Draw animated spline up to current position
            this.drawAnimatedSpline(position.segmentIndex, position.progress);
            
            // Draw position indicator
            this.drawPositionIndicator(position.x, position.y);
        }
        
        // Continue animation if not finished
        if (this.virtualElapsedTime < this.totalAnimationTime) {
            this.animationRequestId = requestAnimationFrame(() => this.animate());
        } else {
            // Animation finished - show complete spline and final position
            this.isAnimating = false;
            
            // Draw complete animated spline
            if (this.splinePoints.length >= 2) {
                this.drawAnimatedSpline(this.splinePoints.length - 2, 1);
                const lastPoint = this.splinePoints[this.splinePoints.length - 1];
                this.drawPositionIndicator(lastPoint.x, lastPoint.y);
            }
            
            // Update button visibility but keep the animation displayed
            this.playBtn.style.display = 'inline-block';
            this.pauseBtn.style.display = 'none';
        }
    }
    
    calculateAnimationPosition(elapsedTime) {
        if (this.splinePoints.length < 2) return null;
        
        // Calculate total spline length for proper timing
        const totalSplineLength = this.calculateSplineLength();
        
        // Calculate how far along the spline we should be based on time
        let currentTime = 0;
        let targetDistance = 0;
        
        // First, find the target distance based on elapsed time
        for (let i = 0; i < this.splinePoints.length - 1; i++) {
            const p1 = this.splinePoints[i];
            const velocity = p1.velocity || 30; // mm/s
            const segmentLength = this.calculateSplineSegmentLength(i);
            const segmentTime = (segmentLength / velocity) * 1000; // milliseconds
            
            if (elapsedTime <= currentTime + segmentTime) {
                const segmentProgress = (elapsedTime - currentTime) / segmentTime;
                targetDistance += segmentLength * segmentProgress;
                break;
            }
            
            currentTime += segmentTime;
            targetDistance += segmentLength;
        }
        
        // Now find the position at the target distance along the spline
        return this.getPositionAtDistance(targetDistance);
    }
    
    calculateSplineLength() {
        if (this.splinePoints.length < 2) return 0;
        
        let totalLength = 0;
        for (let i = 0; i < this.splinePoints.length - 1; i++) {
            totalLength += this.calculateSplineSegmentLength(i);
        }
        return totalLength;
    }
    
    calculateSplineSegmentLength(segmentIndex) {
        if (segmentIndex >= this.splinePoints.length - 1) return 0;
        
        const p1 = this.splinePoints[segmentIndex];
        const p2 = this.splinePoints[segmentIndex + 1];
        
        if (this.splinePoints.length === 2) {
            // Simple line distance
            return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
        }
        
        // For spline segments, approximate length by sampling the curve
        const samples = 20;
        let length = 0;
        let prevPoint = this.getSplinePointAt(segmentIndex, 0);
        
        for (let i = 1; i <= samples; i++) {
            const t = i / samples;
            const currentPoint = this.getSplinePointAt(segmentIndex, t);
            length += Math.sqrt(
                Math.pow(currentPoint.x - prevPoint.x, 2) + 
                Math.pow(currentPoint.y - prevPoint.y, 2)
            );
            prevPoint = currentPoint;
        }
        
        return length;
    }
    
    getSplinePointAt(segmentIndex, t) {
        if (this.splinePoints.length === 2) {
            // Linear interpolation for 2 points
            const p1 = this.splinePoints[0];
            const p2 = this.splinePoints[1];
            return {
                x: p1.x + (p2.x - p1.x) * t,
                y: p1.y + (p2.y - p1.y) * t
            };
        }
        
        // Bezier curve calculation for spline segments
        const i = segmentIndex;
        const points = this.splinePoints;
        
        if (i === 0) {
            // First segment
            const p0 = points[0];
            const p1 = points[1];
            const p2 = points[2] || points[1];
            
            const cp1x = p0.x + (p1.x - p0.x) * this.settings.splineSmoothing * 0.2;
            const cp1y = p0.y + (p1.y - p0.y) * this.settings.splineSmoothing * 0.2;
            const cp2x = p1.x - (p2.x - p0.x) * this.settings.splineSmoothing * 0.2;
            const cp2y = p1.y - (p2.y - p0.y) * this.settings.splineSmoothing * 0.2;
            
            return this.bezierPoint(p0, {x: cp1x, y: cp1y}, {x: cp2x, y: cp2y}, p1, t);
        } else if (i >= points.length - 2) {
            // Last segment
            const p0 = points[i - 1] || points[i];
            const p1 = points[i];
            const p2 = points[i + 1];
            
            const cp1x = p1.x + (p2.x - p0.x) * this.settings.splineSmoothing * 0.2;
            const cp1y = p1.y + (p2.y - p0.y) * this.settings.splineSmoothing * 0.2;
            const cp2x = p2.x - (p2.x - p1.x) * this.settings.splineSmoothing * 0.2;
            const cp2y = p2.y - (p2.y - p1.y) * this.settings.splineSmoothing * 0.2;
            
            return this.bezierPoint(p1, {x: cp1x, y: cp1y}, {x: cp2x, y: cp2y}, p2, t);
        } else {
            // Middle segments
            const p0 = points[i - 1];
            const p1 = points[i];
            const p2 = points[i + 1];
            const p3 = points[i + 2];
            
            const cp1x = p1.x + (p2.x - p0.x) * this.settings.splineSmoothing * 0.2;
            const cp1y = p1.y + (p2.y - p0.y) * this.settings.splineSmoothing * 0.2;
            const cp2x = p2.x - (p3.x - p1.x) * this.settings.splineSmoothing * 0.2;
            const cp2y = p2.y - (p3.y - p1.y) * this.settings.splineSmoothing * 0.2;
            
            return this.bezierPoint(p1, {x: cp1x, y: cp1y}, {x: cp2x, y: cp2y}, p2, t);
        }
    }
    
    bezierPoint(p0, p1, p2, p3, t) {
        const u = 1 - t;
        const tt = t * t;
        const uu = u * u;
        const uuu = uu * u;
        const ttt = tt * t;
        
        return {
            x: uuu * p0.x + 3 * uu * t * p1.x + 3 * u * tt * p2.x + ttt * p3.x,
            y: uuu * p0.y + 3 * uu * t * p1.y + 3 * u * tt * p2.y + ttt * p3.y
        };
    }
    
    getPositionAtDistance(targetDistance) {
        if (this.splinePoints.length < 2) return null;
        
        let currentDistance = 0;
        
        for (let i = 0; i < this.splinePoints.length - 1; i++) {
            const segmentLength = this.calculateSplineSegmentLength(i);
            
            if (currentDistance + segmentLength >= targetDistance) {
                // Target is in this segment
                const segmentProgress = (targetDistance - currentDistance) / segmentLength;
                const position = this.getSplinePointAt(i, segmentProgress);
                
                return {
                    x: position.x,
                    y: position.y,
                    segmentIndex: i,
                    progress: segmentProgress
                };
            }
            
            currentDistance += segmentLength;
        }
        
        // Return last point if beyond total distance
        const lastPoint = this.splinePoints[this.splinePoints.length - 1];
        return {
            x: lastPoint.x,
            y: lastPoint.y,
            segmentIndex: this.splinePoints.length - 2,
            progress: 1
        };
    }
    
    drawAnimatedSpline(currentSegmentIndex, segmentProgress) {
        if (this.splinePoints.length < 2) return;
        
        this.animationCtx.strokeStyle = '#ff6600';
        this.animationCtx.lineWidth = 4;
        this.animationCtx.lineCap = 'round';
        this.animationCtx.lineJoin = 'round';
        
        this.animationCtx.beginPath();
        
        if (this.splinePoints.length === 2) {
            // Simple line for two points
            const p1 = this.splinePoints[0];
            const p2 = this.splinePoints[1];
            
            const currentX = p1.x + (p2.x - p1.x) * segmentProgress;
            const currentY = p1.y + (p2.y - p1.y) * segmentProgress;
            
            const screenP1 = this.worldToScreen(p1.x, p1.y);
            const screenCurrent = this.worldToScreen(currentX, currentY);
            
            this.animationCtx.moveTo(screenP1.x, screenP1.y);
            this.animationCtx.lineTo(screenCurrent.x, screenCurrent.y);
        } else {
            // Draw smooth spline up to current position
            const points = this.splinePoints.map(p => this.worldToScreen(p.x, p.y));
            
            this.animationCtx.moveTo(points[0].x, points[0].y);
            
            // Draw completed segments
            for (let i = 1; i < Math.min(currentSegmentIndex + 1, points.length - 1); i++) {
                const cp1x = points[i].x + (points[i + 1].x - points[i - 1].x) * this.settings.splineSmoothing * 0.2;
                const cp1y = points[i].y + (points[i + 1].y - points[i - 1].y) * this.settings.splineSmoothing * 0.2;
                const cp2x = points[i + 1].x - (points[i + 2] ? points[i + 2].x - points[i].x : 0) * this.settings.splineSmoothing * 0.2;
                const cp2y = points[i + 1].y - (points[i + 2] ? points[i + 2].y - points[i].y : 0) * this.settings.splineSmoothing * 0.2;
                
                if (i <= currentSegmentIndex) {
                    // Complete segment
                    this.animationCtx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, points[i + 1].x, points[i + 1].y);
                }
            }
            
            // Draw partial current segment if needed
            if (currentSegmentIndex < this.splinePoints.length - 1 && segmentProgress > 0) {
                const currentPoint = this.getSplinePointAt(currentSegmentIndex, segmentProgress);
                const screenCurrent = this.worldToScreen(currentPoint.x, currentPoint.y);
                
                // Draw curve up to current position
                const i = currentSegmentIndex + 1;
                if (i < points.length - 1) {
                    const cp1x = points[i].x + (points[i + 1].x - points[i - 1].x) * this.settings.splineSmoothing * 0.2;
                    const cp1y = points[i].y + (points[i + 1].y - points[i - 1].y) * this.settings.splineSmoothing * 0.2;
                    const cp2x = points[i + 1].x - (points[i + 2] ? points[i + 2].x - points[i].x : 0) * this.settings.splineSmoothing * 0.2;
                    const cp2y = points[i + 1].y - (points[i + 2] ? points[i + 2].y - points[i].y : 0) * this.settings.splineSmoothing * 0.2;
                    
                    // Sample the bezier curve up to the current progress
                    const samples = Math.ceil(segmentProgress * 20);
                    for (let s = 1; s <= samples; s++) {
                        const t = (s / 20) / segmentProgress;
                        if (t > 1) break;
                        
                        const samplePoint = this.getSplinePointAt(currentSegmentIndex, t * segmentProgress);
                        const screenSample = this.worldToScreen(samplePoint.x, samplePoint.y);
                        this.animationCtx.lineTo(screenSample.x, screenSample.y);
                    }
                }
            }
        }
        
        this.animationCtx.stroke();
    }
    
    drawPositionIndicator(worldX, worldY) {
        const screenPos = this.worldToScreen(worldX, worldY);
        const themeColors = this.getThemeColors();
        
        // Draw outer circle (theme border)
        this.animationCtx.fillStyle = themeColors.pointFill;
        this.animationCtx.strokeStyle = themeColors.pointBorder;
        this.animationCtx.lineWidth = 2;
        this.animationCtx.beginPath();
        this.animationCtx.arc(screenPos.x, screenPos.y, 8, 0, 2 * Math.PI);
        this.animationCtx.fill();
        this.animationCtx.stroke();
        
        // Draw inner circle (orange)
        this.animationCtx.fillStyle = '#ff6600';
        this.animationCtx.beginPath();
        this.animationCtx.arc(screenPos.x, screenPos.y, 5, 0, 2 * Math.PI);
        this.animationCtx.fill();
    }
    
    // Robot code export methods
    exportRobotCode() {
        // Save current path before checking
        this.saveCurrentPathToIndex();
        
        // Check if there are any programs with data
        const hasAnyData = Object.keys(this.programPaths).some(key => {
            const path = this.programPaths[key];
            return path && path.splinePoints && path.splinePoints.length >= 2;
        });
        
        if (!hasAnyData) {
            alert('Aggiungi almeno 2 punti alla spline in almeno un programma per esportare!');
            return;
        }
        
        const robotType = this.robotType ? this.robotType.value : 'kuka';
        
        switch (robotType) {
            case 'kuka':
                this.exportKukaCode();
                break;
            case 'fanuc':
                alert('Esportazione FANUC non ancora implementata');
                break;
            case 'abb':
                alert('Esportazione ABB non ancora implementata');
                break;
            case 'motoman':
                alert('Esportazione MOTOMAN non ancora implementata');
                break;
            default:
                alert('Tipo di robot non supportato');
        }
    }
    
    async exportKukaCode() {
        // Save current path before exporting
        this.saveCurrentPathToIndex();
        
        try {
            // Load templates
            let templates;
            try {
                templates = await this.loadKukaTemplates();
                console.log('Using templates from templates folder');
            } catch (error) {
                console.log('Using embedded templates (templates folder not accessible)');
                templates = this.getEmbeddedKukaTemplates();
            }
            
            // Generate project JSON
            const timestamp = this.generateTimestamp();
            const projectData = {
                version: "2.0",
                timestamp: timestamp,
                settings: this.settings,
                programPaths: this.programPaths,
                currentProgramIndex: this.currentProgramIndex
            };
            const projectContent = JSON.stringify(projectData, null, 2);
            
            // Collect all programs to export
            const programsToExport = [];
            for (const [index, pathData] of Object.entries(this.programPaths)) {
                if (pathData && pathData.splinePoints && pathData.splinePoints.length >= 2) {
                    let projectName = `${this.settings.basename}${index}`;
                    // Ensure valid filename for KUKA (only letters, numbers, underscore)
                    projectName = projectName.replace(/[^a-zA-Z0-9_]/g, '_');
                    
                    programsToExport.push({
                        index: index,
                        name: projectName,
                        pathData: pathData
                    });
                }
            }
            
            if (programsToExport.length === 0) {
                alert('Nessun programma valido da esportare!');
                return;
            }
            
            // Create ZIP file with all programs
            await this.createAndDownloadZipAllPrograms(programsToExport, templates, projectContent, timestamp);
            
        } catch (error) {
            console.error('Error during KUKA export:', error);
            alert('Errore durante l\'esportazione: ' + error.message);
        }
    }

    async createAndDownloadZipAllPrograms(programsToExport, templates, projectContent, timestamp) {
        try {
            // Check if JSZip is available
            if (typeof JSZip === 'undefined') {
                alert('Libreria JSZip non disponibile. Impossibile creare il file ZIP.');
                return;
            }

            const zip = new JSZip();
            
            // Add all programs to ZIP
            for (const program of programsToExport) {
                // Temporarily set splinePoints to generate code for this specific program
                const originalPoints = this.splinePoints;
                this.splinePoints = program.pathData.splinePoints;
                
                // Get description for this program
                const description = program.pathData.description || '';
                
                // Generate files content for this program
                const datContent = this.generateKukaDatFromTemplate(program.name, templates.dat);
                const srcContent = this.generateKukaSrcFromTemplate(program.name, templates.src, description);
                
                // Restore original points
                this.splinePoints = originalPoints;
                
                // Add to ZIP
                zip.file(`${program.name}.dat`, datContent);
                zip.file(`${program.name}.src`, srcContent);
            }
            
            // Add project JSON to ZIP
            zip.file(`${this.settings.basename}_project_${timestamp}.json`, projectContent);
            
            // Generate ZIP blob
            const zipBlob = await zip.generateAsync({type: "blob"});
            
            // Direct download to Downloads folder
            const zipName = `${this.settings.basename}_all_programs_${timestamp}.zip`;
            this.downloadFile(zipBlob, zipName, 'application/zip');
            
            console.log(`Exported ${programsToExport.length} program(s) to ${zipName}`);
            
        } catch (error) {
            console.error('Error creating ZIP:', error);
            alert('Errore durante la creazione del file ZIP: ' + error.message);
        }
    }

    async createAndDownloadZip(projectName, datContent, srcContent, projectContent, timestamp) {
        try {
            // Check if JSZip is available
            if (typeof JSZip === 'undefined') {
                // Fallback to individual files if JSZip is not available
                await this.fallbackToIndividualFiles(projectName, datContent, srcContent, projectContent);
                return;
            }

            const zip = new JSZip();
            
            // Add files to ZIP
            zip.file(`${projectName}.dat`, datContent);
            zip.file(`${projectName}.src`, srcContent);
            zip.file(`${projectName}_project_${timestamp}.json`, projectContent);
            
            // Generate ZIP blob
            const zipBlob = await zip.generateAsync({type: "blob"});
            
            // Direct download to Downloads folder (no folder selection)
            this.downloadFile(zipBlob, `${projectName}_robot_export_${timestamp}.zip`, 'application/zip');
            
        } catch (error) {
            console.error('Error creating ZIP:', error);
            // Fallback to individual files
            await this.fallbackToIndividualFiles(projectName, datContent, srcContent, projectContent);
        }
    }

    async fallbackToIndividualFiles(projectName, datContent, srcContent, projectContent) {
        try {
            const timestamp = this.generateTimestamp();
            
            // Direct download to Downloads folder (no folder selection)
            this.downloadFile(datContent, `${projectName}.dat`, 'text/plain');
            this.downloadFile(srcContent, `${projectName}.src`, 'text/plain');
            this.downloadFile(projectContent, `${projectName}_project_${timestamp}.json`, 'application/json');
            
        } catch (error) {
            console.error('Fallback to individual files failed:', error);
            alert('Errore durante l\'esportazione dei file individuali');
        }
    }
    
    getEmbeddedKukaTemplates() {
        return {
            dat: `&ACCESS RVO
&REL 35
&PARAM DISKPATH = KRC:\\R1\\Program\\Support Programs
DEFDAT  {{PROJECT_NAME}} PUBLIC

; positions from SpLine Generator
DECL FRAME pSpl[{{NUM_POINTS}}]
{{FRAME_POSITIONS}}

; speed data from SpLine Generator
DECL CP cpSpl[{{NUM_POINTS}}]
{{SPL_SPEED_DATA}}

; calculated points
DECL E6POS pMove[{{NUM_POINTS}}]
{{MOVE_POSITIONS}}

; calculated speed data
DECL CP cpMove[{{NUM_POINTS}}]
{{MOVE_SPEED_DATA}}
ENDDAT`,
            src: `DEF {{PROJECT_NAME}}(lp0: IN, lTool: IN, lBase: IN, rSpeedFactor: IN)
    E6POS lp0
    FRAME lTool, lBase
    INT liIdx
    REAL rSpeedFactor
    
    ; Calculate positions and speed relative to base
    FOR liIdx = 1 TO {{NUM_POINTS}}
        pMove[liIdx] = pToolOffset(lp0, pSpl[liIdx].X, pSpl[liIdx].Y, pSpl[liIdx].Z, 0, 0, 0)
        cpMove[liIdx] = cpSpl[liIdx]
        cpMove[liIdx].CP = cpSpl[liIdx].CP * rSpeedFactor
    ENDFOR
    
    $TOOL=lTool
    $BASE=lBase
    
{{SPLINE_POINTS}}
END`
        };
    }
    
    async loadKukaTemplates() {
        try {
            // Check if we're running from a web server
            if (window.location.protocol === 'file:') {
                throw new Error('File protocol detected, using embedded templates');
            }
            
            const [datResponse, srcResponse] = await Promise.all([
                fetch('./templates/kuka_template.dat?v3.7'),
                fetch('./templates/kuka_template.src?v3.7')
            ]);
            
            if (!datResponse.ok || !srcResponse.ok) {
                throw new Error('Template files not found');
            }
            
            const dat = await datResponse.text();
            const src = await srcResponse.text();
            
            console.log('Templates loaded from files');
            return { dat, src };
        } catch (error) {
            throw new Error('Failed to load template files: ' + error.message);
        }
    }
    
    generateKukaDatFromTemplate(projectName, template) {
        const numPoints = this.splinePoints.length;
        
        // Generate FRAME positions using axis labels and MOVE positions (all zeros)
        let framePositions = '';
        let movePositions = '';
        let splSpeedData = '';
        let moveSpeedData = '';
        let splinePointIndex = 1;
        for (let i = 0; i < this.splinePoints.length; i++) {
            const point = this.splinePoints[i];
            
            // Use the configured axis labels
            const xAxisLabel = this.settings.xAxisLabel || 'X';
            const yAxisLabel = this.settings.yAxisLabel || 'Y';
            
            // Map canvas coordinates to KUKA coordinates based on axis labels
            let kukaX = 0.0, kukaY = 0.0, kukaZ = 0.0;
            
            // Map horizontal canvas coordinate (point.x) to KUKA axis
            if (xAxisLabel === 'X') {
                kukaX = point.x;
            } else if (xAxisLabel === 'Y') {
                kukaY = point.x;
            } else if (xAxisLabel === 'Z') {
                kukaZ = point.x;
            }
            
            // Map vertical canvas coordinate (point.y) to KUKA axis
            if (yAxisLabel === 'X') {
                kukaX = point.y;
            } else if (yAxisLabel === 'Y') {
                kukaY = point.y;
            } else if (yAxisLabel === 'Z') {
                kukaZ = point.y;
            }
            
            // Convert velocity from mm/s to m/s (divide by 1000)
            const velocity = (point.velocity || 30);
            const velocityInMetersPerSec = velocity / 1000;
            
            framePositions += `pSpl[${splinePointIndex}]={X ${kukaX.toFixed(1)},Y ${kukaY.toFixed(1)},Z ${kukaZ.toFixed(1)},A 0.0,B 0.0,C 0.0}\n`;
            movePositions += `pMove[${splinePointIndex}]={X 0.0,Y 0.0,Z 0.0,A 0.0,B 0.0,C 0.0,S 0,T 0,E1 0.0,E2 0.0,E3 0.0,E4 0.0,E5 0.0,E6 0.0}\n`;
            splSpeedData += `cpSpl[${splinePointIndex}]={CP ${velocityInMetersPerSec.toFixed(4)},ORI1 45.0000,ORI2 45.0000}\n`;
            moveSpeedData += `cpMove[${splinePointIndex}]={CP 0.0,ORI1 0.0,ORI2 0.0}\n`;

            splinePointIndex ++;
        }
        
        // Replace template variables
        return template
            .replace(/\{\{PROJECT_NAME\}\}/g, projectName)
            .replace(/\{\{NUM_POINTS\}\}/g, numPoints.toString())
            .replace(/\{\{FRAME_POSITIONS\}\}/g, framePositions.trim())
            .replace(/\{\{MOVE_POSITIONS\}\}/g, movePositions.trim())
            .replace(/\{\{SPL_SPEED_DATA\}\}/g, splSpeedData.trim())
            .replace(/\{\{MOVE_SPEED_DATA\}\}/g, moveSpeedData.trim());
    }
    
    generateKukaSrcFromTemplate(projectName, template, description = '') {
        const numPoints = this.splinePoints.filter(p => p.type !== "wait").length;
        
        // Generate description comment if available
        let descriptionComment = '';
        if (description && description.trim()) {
            const lines = description.trim().split('\n');
            descriptionComment = '; Description:\n';
            lines.forEach(line => {
                descriptionComment += `; ${line}\n`;
            });
            descriptionComment += ';\n';
        }
        
        // Generate spline points using cpMove array for velocity
        let splinePoints = '';
        let firstSplinePoint = true;
        let splinePointIndex = 1;
        for (let i = 0; i < this.splinePoints.length; i++) {
            const point = this.splinePoints[i];
            
            if (firstSplinePoint) {
                splinePoints += '    SPLINE\n';
                splinePoints += `        SPL pMove[${splinePointIndex}] WITH $ORI_TYPE = #CONSTANT, $VEL = cpMove[${splinePointIndex}]\n`;
            } else {
                splinePoints += `        SPL pMove[${splinePointIndex}] WITH $VEL = cpMove[${splinePointIndex}]\n`;
            }
            firstSplinePoint = false;

            splinePointIndex ++;
        }
        splinePoints += '    ENDSPLINE\n';
        
        // Replace template variables
        let result = template
            .replace(/\{\{PROJECT_NAME\}\}/g, projectName)
            .replace(/\{\{NUM_POINTS\}\}/g, numPoints.toString())
            .replace(/\{\{SPLINE_POINTS\}\}/g, splinePoints.trim());
        
        // Insert description comment after the first line (DEF line)
        if (descriptionComment) {
            const lines = result.split('\n');
            if (lines.length > 0) {
                lines.splice(1, 0, descriptionComment.trimEnd());
                result = lines.join('\n');
            }
        }
        
        return result;
    }
    
    generateKukaDatFile(projectName) {
        const numPoints = this.splinePoints.length;
        
        let content = `&ACCESS RVO
&REL 35
&PARAM DISKPATH = KRC:\\R1\\Program\\Support Programs
DEFDAT  ${projectName} PUBLIC

; positions from SpLine Generator
DECL FRAME pSpl[${numPoints}]
`;
        
        // Add FRAME positions
        for (let i = 0; i < this.splinePoints.length; i++) {
            const point = this.splinePoints[i];
            content += `pSpl[${i + 1}]={X ${point.x.toFixed(1)},Y ${point.y.toFixed(1)},Z 0.0,A 0.0,B 0.0,C 0.0}\n`;
        }
        
        content += `
; calculated points
DECL E6POS pMove[${numPoints}]
`;
        
        // Add E6POS positions with default values (all zeros)
        for (let i = 0; i < this.splinePoints.length; i++) {
            content += `pMove[${i + 1}]={X 0.0,Y 0.0,Z 0.0,A 0.0,B 0.0,C 0.0,S 0,T 0,E1 0.0,E2 0.0,E3 0.0,E4 0.0,E5 0.0,E6 0.0}\n`;
        }
        
        content += 'ENDDAT\n';
        
        return content;
    }
    
    generateKukaSrcFile(projectName) {
        const numPoints = this.splinePoints.length;
        
        let content = `DEF ${projectName}(lp0: IN, lTool: IN, lBase: IN)
    E6POS lp0
    FRAME lTool, lBase
    INT liIdx
    
    ; Calculate positions relative to base
    FOR liIdx = 1 TO ${numPoints}
        pMove[liIdx] = pToolOffset(lp0, pSpl[liIdx].X, pSpl[liIdx].Y, pSpl[liIdx].Z, 0, 0, 0)
    ENDFOR
    
    $TOOL=lTool
    $BASE=lBase
    
    SPLINE
`;
        
        // Add spline points
        for (let i = 0; i < this.splinePoints.length; i++) {
            const point = this.splinePoints[i];
            const velocity = (point.velocity || 30) / 1000; // Convert mm/s to m/s
            
            if (i === 0) {
                content += `        SPL pMove[${i + 1}] WITH $ORI_TYPE = #CONSTANT, $VEL = {CP ${velocity.toFixed(3)},ORI1 45.0000,ORI2 45.0000}\n`;
            } else {
                content += `        SPL pMove[${i + 1}] WITH $VEL = {CP ${velocity.toFixed(3)},ORI1 45.0000,ORI2 45.0000}\n`;
            }
        }
        
        content += `    ENDSPLINE
END\n`;
        
        return content;
    }
    
    downloadFile(content, fileName, mimeType) {
        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    // Dark Mode Management
    toggleDarkMode() {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        
        this.setTheme(newTheme);
        this.saveDarkModePreference(newTheme);
    }

    setTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        
        // Update button icon
        const icon = this.darkModeBtn.querySelector('.material-symbols-outlined');
        if (icon) {
            icon.textContent = theme === 'dark' ? 'light_mode' : 'dark_mode';
        }
        
        // Update button title
        this.darkModeBtn.title = theme === 'dark' ? 'Modalità chiara' : 'Modalità scura';
        
        // Redraw canvas with new theme
        this.drawGrid();
        this.drawSpline();
        this.redrawShapes();
    }

    loadDarkModePreference() {
        // Check for saved preference, otherwise use dark mode as default
        const savedTheme = localStorage.getItem('spline-generator-theme');
        
        if (savedTheme) {
            this.setTheme(savedTheme);
        } else {
            // Use dark mode as default
            this.setTheme('dark');
        }
    }

    saveDarkModePreference(theme) {
        localStorage.setItem('spline-generator-theme', theme);
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, initializing SplineGenerator...');
    
    try {
        const app = new SplineGenerator();
        console.log('SplineGenerator initialized successfully');
        
        // Make app globally accessible for debugging and HTML onclick handlers
        window.splineApp = app;
        window.splineGenerator = app;
    } catch (error) {
        console.error('Error initializing SplineGenerator:', error);
    }
});

// Fallback initialization if DOMContentLoaded already fired
if (document.readyState === 'loading') {
    // Still loading, wait for DOMContentLoaded
} else {
    // Already loaded, initialize immediately
    console.log('DOM already loaded, initializing SplineGenerator...');
    try {
        const app = new SplineGenerator();
        console.log('SplineGenerator initialized successfully');
        window.splineApp = app;
    } catch (error) {
        console.error('Error initializing SplineGenerator:', error);
    }
}