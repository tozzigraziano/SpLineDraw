/**
 * SpLine Draw MECSPE 2026 - Fanuc Robot Trajectory Designer
 * Based on SpLine Draw Pro v1.0
 * 
 * Simplified version for MECSPE 2026 fair
 * Fanuc only, 0-100mm grid, FTP send
 */

class SpLineDrawMECSPE {
    constructor() {
        console.log('🚀 SpLine Draw MECSPE 2026 - Fanuc');
        
        this.initializeSettings();
        this.initializeState();
        this.initializeElements();
        this.initializeCanvases();
        this.initializeEventListeners();
        
        // Initial render
        setTimeout(() => {
            this.resizeCanvases();
            this.drawGrid();
            this.updateUI();
            this.applyInterfaceSettings();
        }, 50);
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // Initialization
    // ═══════════════════════════════════════════════════════════════════════════

    initializeSettings() {
        const saved = localStorage.getItem('splineDrawMECSPE2026Settings');
        const defaults = {
            // Work plane
            workPlane: 'XY',
            
            // Grid
            minAxis1: 0,
            maxAxis1: 100,
            minAxis2: 0,
            maxAxis2: 100,
            gridSize: 10,
            snapSize: 1,
            enableSnap: true,
            
            // Path processing
            smoothingFactor: 0.5,
            minPointDistance: 2,
            maxPointDistance: 10,
            curvatureThreshold: 0.1,
            
            // Speeds
            defaultPathSpeed: 50,
            defaultTransitionSpeed: 100,
            
            // Export - always Fanuc
            robotType: 'fanuc',
            
            // FANUC specific
            fanucConfig: 'N U T, 0, 0, 0',
            fanucW: 180,
            fanucP: 0,
            fanucR: 45,
            fanucUF: 3,
            fanucUT: 2,
            fanucOutputEnabled: false,
            fanucOutputId: 1,
            
            // FTP
            ftpHost: '192.168.0.11',
            ftpPort: 21,
            ftpUser: 'anonymous',
            ftpPassword: 'anonymous',
            ftpRemotePath: '/md:',
            postUploadCommand: 'http://192.168.0.11/KCL/SET PORT DOUT[1] = ON',
            
            // Colors
            pathColor: '#666666',
            processedColor: '#00ff88',
            
            // Interface
            showSidePanel: false,
            playbackBar: 'hidden',
            cleanView: true
        };
        
        this.settings = saved ? { ...defaults, ...JSON.parse(saved) } : defaults;
    }

    initializeState() {
        // Current tool (always path in MECSPE edition)
        this.currentTool = 'path';
        
        // Drawing state
        this.isDrawing = false;
        this.currentRawPath = []; // Raw points during drawing
        
        // Paths (layers)
        this.paths = []; // Array of path objects
        this.activePathIndex = -1; // Currently selected path
        
        // Transitions between paths
        this.transitions = []; // Array of transition definitions
        
        // Reference shapes
        this.shapes = [];
        
        // Selection state
        this.selectedPoints = new Set();
        this.hoveredPoint = null; // { pathIndex, pointIndex }
        this.lastSelectedPoint = null; // For shift+click range selection
        
        // Animation state
        this.isAnimating = false;
        this.isPaused = false;
        this.animationProgress = 0;
        this.animationStartTime = 0;
        this.animationPausedTime = 0;
        this.totalPathLength = 0;
        this.pathSegments = []; // Precomputed segments for smooth animation
        
        // Program management (single program in MECSPE edition)
        this.currentProgramIndex = 1;
        this.programs = {};
        
        // Path colors for layers
        this.layerColors = [
            '#00ff88', '#ff6b6b', '#4ecdc4', '#ffe66d', 
            '#95e1d3', '#f38181', '#aa96da', '#fcbad3',
            '#a8d8ea', '#ff9a8b', '#88d8b0', '#ffeaa7'
        ];
    }

    initializeElements() {
        // Canvases
        this.gridCanvas = document.getElementById('gridCanvas');
        this.shapeCanvas = document.getElementById('shapeCanvas');
        this.pathCanvas = document.getElementById('pathCanvas');
        this.previewCanvas = document.getElementById('previewCanvas');
        this.animationCanvas = document.getElementById('animationCanvas');
        this.canvasContainer = document.getElementById('canvasContainer');
        
        // Modals
        this.settingsModal = document.getElementById('settingsModal');
        this.transitionModal = document.getElementById('transitionModal');
        
        // Buttons
        this.settingsBtn = document.getElementById('settingsBtn');
        this.saveBtn = document.getElementById('saveBtn');
        this.loadBtn = document.getElementById('loadBtn');
        this.fileInput = document.getElementById('fileInput');
        this.sendFtpBtn = document.getElementById('sendFtpBtn');
        
        // FTP Modal
        this.ftpModal = document.getElementById('ftpModal');
        this.ftpStatusIcon = document.getElementById('ftpStatusIcon');
        this.ftpStatusText = document.getElementById('ftpStatusText');
        this.ftpDetails = document.getElementById('ftpDetails');
        this.ftpCloseBtn = document.getElementById('ftpCloseBtn');
        this.ftpTestBtn = document.getElementById('ftpTestBtn');
        
        // Tools (always path)
        this.toolButtons = document.querySelectorAll('.tool-btn');
        
        // Playback
        this.playBtn = document.getElementById('playBtn');
        this.pauseBtn = document.getElementById('pauseBtn');
        this.stopBtn = document.getElementById('stopBtn');
        this.progressSlider = document.getElementById('progressSlider');
        this.timeDisplay = document.getElementById('timeDisplay');
        
        // Coordinates
        this.coordinatesDisplay = document.getElementById('coordinates');
        
        // Tabs
        this.tabButtons = document.querySelectorAll('.tab-btn');
        
        // Layers
        this.layersList = document.getElementById('layersList');
        this.addLayerBtn = document.getElementById('addLayerBtn');
        this.totalPathsCount = document.getElementById('totalPathsCount');
        this.totalPointsCount = document.getElementById('totalPointsCount');
        
        // Points
        this.pointsTableBody = document.getElementById('pointsTableBody');
        this.pointsPathSelect = document.getElementById('pointsPathSelect');
        this.bulkVelocityInput = document.getElementById('bulkVelocity');
        this.applyVelocityBtn = document.getElementById('applyVelocityBtn');
        this.selectAllPoints = document.getElementById('selectAllPoints');
        
        // Transitions
        this.transitionsList = document.getElementById('transitionsList');
        this.defaultTransitionOffset = document.getElementById('defaultTransitionOffset');
        this.defaultTransitionVelocity = document.getElementById('defaultTransitionVelocity');
        
        // Settings inputs
        this.settingsInputs = {
            minAxis1: document.getElementById('minAxis1'),
            maxAxis1: document.getElementById('maxAxis1'),
            minAxis2: document.getElementById('minAxis2'),
            maxAxis2: document.getElementById('maxAxis2'),
            gridSize: document.getElementById('gridSize'),
            snapSize: document.getElementById('snapSize'),
            enableSnap: document.getElementById('enableSnap'),
            smoothingFactor: document.getElementById('smoothingFactor'),
            smoothingValue: document.getElementById('smoothingValue'),
            minPointDistance: document.getElementById('minPointDistance'),
            maxPointDistance: document.getElementById('maxPointDistance'),
            curvatureThreshold: document.getElementById('curvatureThreshold'),
            defaultPathSpeed: document.getElementById('defaultPathSpeed'),
            defaultTransitionSpeed: document.getElementById('defaultTransitionSpeed'),
            pathColor: document.getElementById('pathColor'),
            processedColor: document.getElementById('processedColor'),
            // FANUC specific
            fanucConfig: document.getElementById('fanucConfig'),
            fanucW: document.getElementById('fanucW'),
            fanucP: document.getElementById('fanucP'),
            fanucR: document.getElementById('fanucR'),
            fanucUF: document.getElementById('fanucUF'),
            fanucUT: document.getElementById('fanucUT'),
            fanucOutputEnabled: document.getElementById('fanucOutputEnabled'),
            fanucOutputId: document.getElementById('fanucOutputId'),
            // FTP
            ftpHost: document.getElementById('ftpHost'),
            ftpPort: document.getElementById('ftpPort'),
            ftpUser: document.getElementById('ftpUser'),
            ftpPassword: document.getElementById('ftpPassword'),
            ftpRemotePath: document.getElementById('ftpRemotePath'),
            postUploadCommand: document.getElementById('postUploadCommand'),
            // Interface
            showSidePanel: document.getElementById('showSidePanel'),
            playbackBar: document.getElementById('playbackBar'),
            cleanView: document.getElementById('cleanView')
        };
    }

    initializeCanvases() {
        this.gridCtx = this.gridCanvas.getContext('2d');
        this.shapeCtx = this.shapeCanvas.getContext('2d');
        this.pathCtx = this.pathCanvas.getContext('2d');
        this.previewCtx = this.previewCanvas.getContext('2d');
        this.animationCtx = this.animationCanvas.getContext('2d');
    }

    initializeEventListeners() {
        // Window resize
        window.addEventListener('resize', () => this.resizeCanvases());
        
        // Settings modal
        this.settingsBtn.addEventListener('click', () => this.openSettings());
        document.querySelectorAll('.close-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.target.closest('.modal').classList.remove('active');
            });
        });
        document.getElementById('saveSettings').addEventListener('click', () => this.saveSettings());
        document.getElementById('resetSettings').addEventListener('click', () => this.resetSettings());
        
        // Smoothing slider
        this.settingsInputs.smoothingFactor.addEventListener('input', (e) => {
            this.settingsInputs.smoothingValue.textContent = e.target.value;
        });
        
        // Tool selection (always path in MECSPE)
        this.toolButtons.forEach(btn => {
            btn.addEventListener('click', () => this.selectTool(btn.dataset.tool));
        });
        
        // File operations
        this.saveBtn.addEventListener('click', () => this.saveProject());
        this.loadBtn.addEventListener('click', () => this.fileInput.click());
        this.fileInput.addEventListener('change', (e) => this.loadProject(e));
        
        // FTP Send
        this.sendFtpBtn.addEventListener('click', () => this.sendFTP());
        
        // FTP Modal close
        this.ftpCloseBtn.addEventListener('click', () => {
            this.ftpModal.classList.remove('active');
        });
        
        // FTP Test connection
        this.ftpTestBtn.addEventListener('click', () => this.testFtpConnection());
        
        // Playback
        this.playBtn.addEventListener('click', () => this.startAnimation());
        this.pauseBtn.addEventListener('click', () => this.pauseAnimation());
        this.stopBtn.addEventListener('click', () => this.stopAnimation());
        this.progressSlider.addEventListener('input', (e) => {
            this.seekAnimation(e.target.value / 1000);
        });
        
        // Tabs
        this.tabButtons.forEach(btn => {
            btn.addEventListener('click', () => this.switchTab(btn.dataset.tab));
        });
        
        // Layers
        this.addLayerBtn.addEventListener('click', () => this.addEmptyPath());
        
        // Points
        this.applyVelocityBtn.addEventListener('click', () => this.applyBulkVelocity());
        this.selectAllPoints.addEventListener('change', (e) => this.toggleSelectAll(e.target.checked));
        this.pointsPathSelect.addEventListener('change', () => this.updatePointsTable());
        
        // Clear buttons in toolbar
        const clearPathsBtn = document.getElementById('clearPathsBtn');
        if (clearPathsBtn) {
            clearPathsBtn.addEventListener('click', () => this.clearAllPaths());
        }
        
        // Undo last path button
        const undoPathBtn = document.getElementById('undoPathBtn');
        if (undoPathBtn) {
            undoPathBtn.addEventListener('click', () => this.undoLastPath());
        }
        
        // Clean view toggle button
        const cleanViewBtn = document.getElementById('cleanViewBtn');
        if (cleanViewBtn) {
            cleanViewBtn.addEventListener('click', () => {
                this.settings.cleanView = !this.settings.cleanView;
                localStorage.setItem('splineDrawMECSPE2026Settings', JSON.stringify(this.settings));
                cleanViewBtn.querySelector('.material-symbols-outlined').textContent = 
                    this.settings.cleanView ? 'visibility_off' : 'visibility';
                this.redrawPaths();
            });
            // Set initial icon state
            cleanViewBtn.querySelector('.material-symbols-outlined').textContent = 
                this.settings.cleanView ? 'visibility_off' : 'visibility';
        }
        
        // Canvas events - Mouse
        this.pathCanvas.addEventListener('mousedown', (e) => this.handleMouseDown(e));
        this.pathCanvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        this.pathCanvas.addEventListener('mouseup', (e) => this.handleMouseUp(e));
        this.pathCanvas.addEventListener('mouseleave', (e) => this.handleMouseLeave(e));
        
        // Global mouse up to handle drawing outside canvas
        document.addEventListener('mouseup', (e) => {
            if (this.isDrawing) {
                this.handleMouseUp(e);
            }
        });
        
        // Canvas events - Touch
        this.pathCanvas.addEventListener('touchstart', (e) => this.handleTouchStart(e), { passive: false });
        this.pathCanvas.addEventListener('touchmove', (e) => this.handleTouchMove(e), { passive: false });
        this.pathCanvas.addEventListener('touchend', (e) => this.handleTouchEnd(e), { passive: false });
        this.pathCanvas.addEventListener('touchcancel', (e) => this.handleTouchEnd(e), { passive: false });
        
        // Prevent default touch behaviors on canvas (zoom, scroll)
        this.canvasContainer.addEventListener('touchstart', (e) => e.preventDefault(), { passive: false });
        this.canvasContainer.addEventListener('touchmove', (e) => e.preventDefault(), { passive: false });
        
        // Modal click outside
        [this.settingsModal, this.transitionModal, this.ftpModal].forEach(modal => {
            if (modal) {
                modal.addEventListener('click', (e) => {
                    if (e.target === modal) {
                        modal.classList.remove('active');
                    }
                });
            }
        });
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // Canvas Management
    // ═══════════════════════════════════════════════════════════════════════════

    resizeCanvases() {
        const rect = this.canvasContainer.getBoundingClientRect();
        const width = rect.width;
        const height = rect.height;
        
        [this.gridCanvas, this.shapeCanvas, this.pathCanvas, 
         this.previewCanvas, this.animationCanvas].forEach(canvas => {
            canvas.width = width;
            canvas.height = height;
        });
        
        this.canvasWidth = width;
        this.canvasHeight = height;
        
        this.calculateScale();
        this.drawGrid();
        this.redrawAll();
    }

    calculateScale() {
        const rangeX = this.settings.maxAxis1 - this.settings.minAxis1;
        const rangeY = this.settings.maxAxis2 - this.settings.minAxis2;
        
        const scaleX = this.canvasWidth / rangeX;
        const scaleY = this.canvasHeight / rangeY;
        
        // Use uniform scale for 1:1 aspect ratio
        this.scale = Math.min(scaleX, scaleY) * 0.9; // 90% to leave margin
        
        // Calculate offsets to center the grid
        this.offsetX = (this.canvasWidth - rangeX * this.scale) / 2;
        this.offsetY = (this.canvasHeight - rangeY * this.scale) / 2;
    }

    worldToScreen(x, y) {
        const screenX = this.offsetX + (x - this.settings.minAxis1) * this.scale;
        const screenY = this.offsetY + (this.settings.maxAxis2 - y) * this.scale;
        return { x: screenX, y: screenY };
    }

    screenToWorld(screenX, screenY) {
        const rect = this.pathCanvas.getBoundingClientRect();
        const canvasX = screenX - rect.left;
        const canvasY = screenY - rect.top;
        
        const worldX = this.settings.minAxis1 + (canvasX - this.offsetX) / this.scale;
        const worldY = this.settings.maxAxis2 - (canvasY - this.offsetY) / this.scale;
        
        return { x: worldX, y: worldY };
    }

    snapToGrid(x, y) {
        if (!this.settings.enableSnap) return { x, y };
        
        const snap = this.settings.snapSize;
        return {
            x: Math.round(x / snap) * snap,
            y: Math.round(y / snap) * snap
        };
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // Grid Drawing
    // ═══════════════════════════════════════════════════════════════════════════

    drawGrid() {
        const ctx = this.gridCtx;
        ctx.clearRect(0, 0, this.canvasWidth, this.canvasHeight);
        
        // Background
        ctx.fillStyle = '#1e1e1e';
        ctx.fillRect(0, 0, this.canvasWidth, this.canvasHeight);
        
        const gridSize = this.settings.gridSize;
        const majorStep = gridSize * 5;
        
        // Minor grid lines
        ctx.strokeStyle = '#2a2a2a';
        ctx.lineWidth = 0.5;
        ctx.beginPath();
        
        for (let x = this.settings.minAxis1; x <= this.settings.maxAxis1; x += gridSize) {
            const screen = this.worldToScreen(x, 0);
            ctx.moveTo(screen.x, this.offsetY);
            ctx.lineTo(screen.x, this.canvasHeight - this.offsetY);
        }
        
        for (let y = this.settings.minAxis2; y <= this.settings.maxAxis2; y += gridSize) {
            const screen = this.worldToScreen(0, y);
            ctx.moveTo(this.offsetX, screen.y);
            ctx.lineTo(this.canvasWidth - this.offsetX, screen.y);
        }
        
        ctx.stroke();
        
        // Major grid lines
        ctx.strokeStyle = '#383838';
        ctx.lineWidth = 1;
        ctx.beginPath();
        
        for (let x = this.settings.minAxis1; x <= this.settings.maxAxis1; x += majorStep) {
            const screen = this.worldToScreen(x, 0);
            ctx.moveTo(screen.x, this.offsetY);
            ctx.lineTo(screen.x, this.canvasHeight - this.offsetY);
        }
        
        for (let y = this.settings.minAxis2; y <= this.settings.maxAxis2; y += majorStep) {
            const screen = this.worldToScreen(0, y);
            ctx.moveTo(this.offsetX, screen.y);
            ctx.lineTo(this.canvasWidth - this.offsetX, screen.y);
        }
        
        ctx.stroke();
        
        // Axes
        const zeroScreen = this.worldToScreen(0, 0);
        
        ctx.strokeStyle = '#505050';
        ctx.lineWidth = 2;
        ctx.beginPath();
        
        // Y axis (vertical)
        if (0 >= this.settings.minAxis1 && 0 <= this.settings.maxAxis1) {
            ctx.moveTo(zeroScreen.x, this.offsetY);
            ctx.lineTo(zeroScreen.x, this.canvasHeight - this.offsetY);
        }
        
        // X axis (horizontal)
        if (0 >= this.settings.minAxis2 && 0 <= this.settings.maxAxis2) {
            ctx.moveTo(this.offsetX, zeroScreen.y);
            ctx.lineTo(this.canvasWidth - this.offsetX, zeroScreen.y);
        }
        
        ctx.stroke();
        
        // Labels
        this.drawGridLabels();
    }

    drawGridLabels() {
        const ctx = this.gridCtx;
        const axes = this.getAxisLabels();
        
        ctx.fillStyle = '#707070';
        ctx.font = '11px Segoe UI';
        
        const majorStep = this.settings.gridSize * 5;
        
        // X axis labels
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        
        for (let x = this.settings.minAxis1; x <= this.settings.maxAxis1; x += majorStep) {
            if (x === 0) continue;
            const screen = this.worldToScreen(x, this.settings.minAxis2);
            ctx.fillText(x.toString(), screen.x, screen.y + 5);
        }
        
        // Y axis labels
        ctx.textAlign = 'right';
        ctx.textBaseline = 'middle';
        
        for (let y = this.settings.minAxis2; y <= this.settings.maxAxis2; y += majorStep) {
            if (y === 0) continue;
            const screen = this.worldToScreen(this.settings.minAxis1, y);
            ctx.fillText(y.toString(), screen.x - 5, screen.y);
        }
        
        // Axis names
        ctx.fillStyle = '#a0a0a0';
        ctx.font = 'bold 14px Segoe UI';
        
        // X axis name
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        const xLabelPos = this.worldToScreen(this.settings.maxAxis1, this.settings.minAxis2);
        ctx.fillText(axes.x, xLabelPos.x - 15, xLabelPos.y + 5);
        
        // Y axis name
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        const yLabelPos = this.worldToScreen(this.settings.minAxis1, this.settings.maxAxis2);
        ctx.fillText(axes.y, yLabelPos.x + 5, yLabelPos.y + 15);
    }

    getAxisLabels() {
        const plane = this.settings.workPlane;
        switch (plane) {
            case 'XY': return { x: 'X', y: 'Y' };
            case 'YZ': return { x: 'Y', y: 'Z' };
            case 'XZ': return { x: 'X', y: 'Z' };
            default: return { x: 'X', y: 'Y' };
        }
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // Mouse Handling
    // ═══════════════════════════════════════════════════════════════════════════

    handleMouseDown(e) {
        const world = this.screenToWorld(e.clientX, e.clientY);
        const snapped = this.snapToGrid(world.x, world.y);
        
        if (this.currentTool === 'path') {
            this.isDrawing = true;
            this.currentRawPath = [{ x: snapped.x, y: snapped.y, time: Date.now() }];
            this.drawPreviewPath();
        }
    }

    handleMouseMove(e) {
        const world = this.screenToWorld(e.clientX, e.clientY);
        const snapped = this.snapToGrid(world.x, world.y);
        
        // Update coordinates display
        this.updateCoordinates(snapped);
        
        if (this.isDrawing && this.currentTool === 'path') {
            // Add point if moved enough
            const lastPoint = this.currentRawPath[this.currentRawPath.length - 1];
            const dist = Math.hypot(snapped.x - lastPoint.x, snapped.y - lastPoint.y);
            
            if (dist >= 1) { // Minimum 1mm between raw points
                this.currentRawPath.push({ x: snapped.x, y: snapped.y, time: Date.now() });
                this.drawPreviewPath();
            }
        }
    }

    handleMouseUp(e) {
        if (this.isDrawing && this.currentTool === 'path') {
            this.isDrawing = false;
            
            if (this.currentRawPath.length >= 2) {
                // Process the raw path
                const processedPath = this.processPath(this.currentRawPath);
                
                // Check for points outside grid boundaries
                const outsidePoints = processedPath.filter(p => 
                    p.x < this.settings.minAxis1 || p.x > this.settings.maxAxis1 ||
                    p.y < this.settings.minAxis2 || p.y > this.settings.maxAxis2
                );
                
                const insidePoints = processedPath.filter(p => 
                    p.x >= this.settings.minAxis1 && p.x <= this.settings.maxAxis1 &&
                    p.y >= this.settings.minAxis2 && p.y <= this.settings.maxAxis2
                );
                
                if (outsidePoints.length > 0) {
                    // Show confirmation dialog
                    const totalPoints = processedPath.length;
                    const outsideCount = outsidePoints.length;
                    const insideCount = insidePoints.length;
                    
                    if (insideCount === 0) {
                        // All points are outside - cannot add path
                        alert(`⚠️ Tutti i ${totalPoints} punti sono fuori dalla griglia.\n\nIl percorso non può essere aggiunto.`);
                        this.previewCtx.clearRect(0, 0, this.canvasWidth, this.canvasHeight);
                        this.currentRawPath = [];
                        return;
                    }
                    
                    const confirmed = confirm(
                        `⚠️ ${outsideCount} punti su ${totalPoints} sono fuori dalla griglia.\n\n` +
                        `• Punti dentro: ${insideCount}\n` +
                        `• Punti fuori: ${outsideCount}\n\n` +
                        `Vuoi confermare l'inserimento?\n` +
                        `(I punti fuori verranno rimossi)`
                    );
                    
                    if (!confirmed) {
                        // User cancelled - don't add path
                        this.previewCtx.clearRect(0, 0, this.canvasWidth, this.canvasHeight);
                        this.currentRawPath = [];
                        return;
                    }
                    
                    // User confirmed - use only inside points
                    // Filter raw points too (approximate matching)
                    const filteredRawPath = this.currentRawPath.filter(p =>
                        p.x >= this.settings.minAxis1 && p.x <= this.settings.maxAxis1 &&
                        p.y >= this.settings.minAxis2 && p.y <= this.settings.maxAxis2
                    );
                    
                    // Create new path object with filtered points
                    const newPath = {
                        id: Date.now(),
                        name: `Percorso ${this.paths.length + 1}`,
                        rawPoints: filteredRawPath.length >= 2 ? filteredRawPath : [...this.currentRawPath],
                        processedPoints: insidePoints,
                        color: this.layerColors[this.paths.length % this.layerColors.length],
                        visible: true,
                        locked: false,
                        velocity: this.settings.defaultPathSpeed
                    };
                    
                    this.paths.push(newPath);
                    this.activePathIndex = this.paths.length - 1;
                } else {
                    // All points inside - add normally
                    const newPath = {
                        id: Date.now(),
                        name: `Percorso ${this.paths.length + 1}`,
                        rawPoints: [...this.currentRawPath],
                        processedPoints: processedPath,
                        color: this.layerColors[this.paths.length % this.layerColors.length],
                        visible: true,
                        locked: false,
                        velocity: this.settings.defaultPathSpeed
                    };
                    
                    this.paths.push(newPath);
                    this.activePathIndex = this.paths.length - 1;
                }
                
                this.updateLayersList();
                this.updatePointsTable();
                this.updateTransitionsList();
                this.redrawPaths();
            }
            
            // Clear preview
            this.previewCtx.clearRect(0, 0, this.canvasWidth, this.canvasHeight);
            this.currentRawPath = [];
        }
    }

    handleMouseLeave(e) {
        // Continue drawing even if mouse leaves canvas
        if (this.isDrawing) {
            // Update with last known position
            const world = this.screenToWorld(e.clientX, e.clientY);
            const snapped = this.snapToGrid(world.x, world.y);
            this.currentRawPath.push({ x: snapped.x, y: snapped.y, time: Date.now() });
        }
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // Touch Handling
    // ═══════════════════════════════════════════════════════════════════════════

    getTouchPosition(e) {
        const touch = e.touches[0] || e.changedTouches[0];
        return { clientX: touch.clientX, clientY: touch.clientY };
    }

    handleTouchStart(e) {
        e.preventDefault();
        const touch = this.getTouchPosition(e);
        
        // Simulate mouse event
        this.handleMouseDown({ clientX: touch.clientX, clientY: touch.clientY });
    }

    handleTouchMove(e) {
        e.preventDefault();
        const touch = this.getTouchPosition(e);
        
        // Simulate mouse event
        this.handleMouseMove({ clientX: touch.clientX, clientY: touch.clientY });
    }

    handleTouchEnd(e) {
        e.preventDefault();
        const touch = this.getTouchPosition(e);
        
        // Simulate mouse event
        this.handleMouseUp({ clientX: touch.clientX, clientY: touch.clientY });
    }

    updateCoordinates(point) {
        if (!this.coordinatesDisplay) return;
        const axes = this.getAxisLabels();
        this.coordinatesDisplay.textContent = 
            `${axes.x}: ${point.x.toFixed(1)} | ${axes.y}: ${point.y.toFixed(1)}`;
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // Path Processing
    // ═══════════════════════════════════════════════════════════════════════════

    processPath(rawPoints) {
        if (rawPoints.length < 2) return [];
        
        // Step 1: Apply smoothing
        let points = this.smoothPath(rawPoints);
        
        // Step 2: Adaptive resampling based on curvature
        points = this.adaptiveResample(points);
        
        // Step 3: Add velocity to each point
        points = points.map(p => ({
            ...p,
            velocity: this.settings.defaultPathSpeed
        }));
        
        return points;
    }

    // Reprocess all paths with current settings (preserving velocities where possible)
    reprocessAllPaths() {
        this.paths.forEach(path => {
            if (!path.rawPoints || path.rawPoints.length < 2) return;
            
            // Store old velocities by position (approximate matching)
            const oldVelocities = new Map();
            if (path.processedPoints) {
                path.processedPoints.forEach(p => {
                    const key = `${Math.round(p.x * 10)}_${Math.round(p.y * 10)}`;
                    oldVelocities.set(key, p.velocity);
                });
            }
            
            // Reprocess with new settings
            let points = this.smoothPath(path.rawPoints);
            points = this.adaptiveResample(points);
            
            // Restore velocities where possible, use default for new points
            path.processedPoints = points.map(p => {
                const key = `${Math.round(p.x * 10)}_${Math.round(p.y * 10)}`;
                return {
                    ...p,
                    velocity: oldVelocities.get(key) || this.settings.defaultPathSpeed
                };
            });
        });
        
        // Update UI
        this.updateLayerList();
        this.updatePointsTable();
        this.redrawPaths();
        this.refreshAnimationPath();
    }

    smoothPath(points) {
        const factor = this.settings.smoothingFactor;
        if (factor === 0 || points.length < 3) return [...points];
        
        const smoothed = [{ ...points[0] }];
        
        for (let i = 1; i < points.length - 1; i++) {
            const prev = points[i - 1];
            const curr = points[i];
            const next = points[i + 1];
            
            smoothed.push({
                x: curr.x * (1 - factor) + (prev.x + next.x) / 2 * factor,
                y: curr.y * (1 - factor) + (prev.y + next.y) / 2 * factor
            });
        }
        
        smoothed.push({ ...points[points.length - 1] });
        
        return smoothed;
    }

    adaptiveResample(points) {
        if (points.length < 2) return points;
        
        const minDist = this.settings.minPointDistance;
        const maxDist = this.settings.maxPointDistance;
        const curvatureThreshold = this.settings.curvatureThreshold;
        
        // Minimum segment length to consider for curvature (ignore noise)
        const minSegmentForCurvature = minDist * 1.5;
        
        // First pass: calculate curvature using wider window to filter noise
        const pointsWithCurvature = points.map((p, i) => {
            let curvature = 0;
            
            if (i > 0 && i < points.length - 1) {
                // Find significant previous point (not too close)
                let prevIdx = i - 1;
                let prevDist = Math.hypot(points[prevIdx].x - p.x, points[prevIdx].y - p.y);
                while (prevIdx > 0 && prevDist < minSegmentForCurvature) {
                    prevIdx--;
                    prevDist = Math.hypot(points[prevIdx].x - p.x, points[prevIdx].y - p.y);
                }
                
                // Find significant next point (not too close)
                let nextIdx = i + 1;
                let nextDist = Math.hypot(points[nextIdx].x - p.x, points[nextIdx].y - p.y);
                while (nextIdx < points.length - 1 && nextDist < minSegmentForCurvature) {
                    nextIdx++;
                    nextDist = Math.hypot(points[nextIdx].x - p.x, points[nextIdx].y - p.y);
                }
                
                // Only calculate curvature if both segments are significant
                if (prevDist >= minSegmentForCurvature && nextDist >= minSegmentForCurvature) {
                    curvature = this.calculateCurvature(points[prevIdx], p, points[nextIdx]);
                }
            }
            return { ...p, curvature, index: i };
        });
        
        // Second pass: identify TRUE corner points (local maxima of curvature)
        const cornerIndices = new Set();
        for (let i = 1; i < pointsWithCurvature.length - 1; i++) {
            const curr = pointsWithCurvature[i];
            if (curr.curvature <= curvatureThreshold) continue;
            
            // Check if this is a local maximum (peak of curvature)
            const prev = pointsWithCurvature[i - 1];
            const next = pointsWithCurvature[i + 1];
            
            if (curr.curvature >= prev.curvature && curr.curvature >= next.curvature) {
                cornerIndices.add(i);
            }
        }
        
        // Third pass: build result with proper point distribution
        const result = [{ ...pointsWithCurvature[0] }];
        
        for (let i = 1; i < pointsWithCurvature.length; i++) {
            const prev = result[result.length - 1];
            const curr = pointsWithCurvature[i];
            const dist = Math.hypot(curr.x - prev.x, curr.y - prev.y);
            
            const isCorner = cornerIndices.has(i);
            const isNearCorner = cornerIndices.has(i - 1) || cornerIndices.has(i + 1);
            
            // Determine target spacing
            let targetDist;
            if (isCorner) {
                targetDist = minDist * 0.5; // Very dense at corners
            } else if (isNearCorner) {
                targetDist = minDist; // Dense near corners
            } else {
                targetDist = maxDist; // Sparse on straight sections
            }
            
            // Add interpolated points if segment is too long
            if (dist > targetDist) {
                const numSegments = Math.ceil(dist / targetDist);
                for (let j = 1; j < numSegments; j++) {
                    const t = j / numSegments;
                    result.push({
                        x: prev.x + (curr.x - prev.x) * t,
                        y: prev.y + (curr.y - prev.y) * t,
                        curvature: 0
                    });
                }
            }
            
            // Add current point (skip if too close and not important)
            const lastPoint = result[result.length - 1];
            const distToLast = Math.hypot(curr.x - lastPoint.x, curr.y - lastPoint.y);
            
            if (isCorner || distToLast >= minDist) {
                result.push({ ...curr });
            }
        }
        
        // Ensure last point is included
        const lastOriginal = pointsWithCurvature[pointsWithCurvature.length - 1];
        const lastResult = result[result.length - 1];
        if (Math.hypot(lastOriginal.x - lastResult.x, lastOriginal.y - lastResult.y) > 0.01) {
            result.push({ ...lastOriginal });
        }
        
        return result;
    }

    calculateCurvature(p1, p2, p3) {
        // Calculate angle change at p2 (returns 0-1, where 1 is 180° turn)
        const v1 = { x: p2.x - p1.x, y: p2.y - p1.y };
        const v2 = { x: p3.x - p2.x, y: p3.y - p2.y };
        
        const len1 = Math.hypot(v1.x, v1.y);
        const len2 = Math.hypot(v2.x, v2.y);
        
        if (len1 === 0 || len2 === 0) return 0;
        
        // Normalize vectors
        const n1 = { x: v1.x / len1, y: v1.y / len1 };
        const n2 = { x: v2.x / len2, y: v2.y / len2 };
        
        // Dot product gives cos(angle)
        const dot = n1.x * n2.x + n1.y * n2.y;
        
        // Clamp to avoid floating point issues with acos
        const clampedDot = Math.max(-1, Math.min(1, dot));
        
        // Angle in radians (0 = same direction, PI = opposite direction)
        const angle = Math.acos(clampedDot);
        
        // Normalize to 0-1 range
        return angle / Math.PI;
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // Drawing
    // ═══════════════════════════════════════════════════════════════════════════

    drawPreviewPath() {
        const ctx = this.previewCtx;
        ctx.clearRect(0, 0, this.canvasWidth, this.canvasHeight);
        
        if (this.currentRawPath.length < 2) return;
        
        // Draw raw path (semi-transparent)
        ctx.strokeStyle = this.settings.pathColor;
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.setLineDash([5, 5]);
        
        ctx.beginPath();
        const start = this.worldToScreen(this.currentRawPath[0].x, this.currentRawPath[0].y);
        ctx.moveTo(start.x, start.y);
        
        for (let i = 1; i < this.currentRawPath.length; i++) {
            const point = this.worldToScreen(this.currentRawPath[i].x, this.currentRawPath[i].y);
            ctx.lineTo(point.x, point.y);
        }
        
        ctx.stroke();
        ctx.setLineDash([]);
    }

    redrawPaths() {
        const ctx = this.pathCtx;
        ctx.clearRect(0, 0, this.canvasWidth, this.canvasHeight);
        
        // Refresh animation if running (paths changed)
        if (this.isAnimating && !this.isPaused) {
            this.refreshAnimationPath();
        }
        
        this.paths.forEach((path, index) => {
            if (!path.visible) return;
            
            const isClean = this.settings.cleanView;
            
            // Draw raw path (dimmed) - as simple lines
            if (!isClean && path.rawPoints && path.rawPoints.length >= 2) {
                ctx.strokeStyle = this.hexToRgba(path.color, 0.3);
                ctx.lineWidth = 1;
                ctx.setLineDash([3, 3]);
                
                ctx.beginPath();
                const start = this.worldToScreen(path.rawPoints[0].x, path.rawPoints[0].y);
                ctx.moveTo(start.x, start.y);
                
                for (let i = 1; i < path.rawPoints.length; i++) {
                    const point = this.worldToScreen(path.rawPoints[i].x, path.rawPoints[i].y);
                    ctx.lineTo(point.x, point.y);
                }
                ctx.stroke();
                ctx.setLineDash([]);
            }
            
            // Draw processed path as SPLINE (Catmull-Rom)
            if (path.processedPoints && path.processedPoints.length >= 2) {
                ctx.strokeStyle = path.color;
                ctx.lineWidth = index === this.activePathIndex ? 3 : 2;
                ctx.lineCap = 'round';
                ctx.lineJoin = 'round';
                
                // Draw spline curve
                this.drawSplineCurve(ctx, path.processedPoints);
                
                // Draw control points (skip in clean view)
                if (!isClean) {
                path.processedPoints.forEach((point, pIndex) => {
                    const screen = this.worldToScreen(point.x, point.y);
                    
                    ctx.beginPath();
                    ctx.arc(screen.x, screen.y, 3, 0, Math.PI * 2);
                    ctx.fillStyle = index === this.activePathIndex ? '#ffffff' : path.color;
                    ctx.fill();
                    
                    // Start point marker
                    if (pIndex === 0) {
                        ctx.beginPath();
                        ctx.arc(screen.x, screen.y, 6, 0, Math.PI * 2);
                        ctx.strokeStyle = '#00ff88';
                        ctx.lineWidth = 2;
                        ctx.stroke();
                    }
                    
                    // End point marker
                    if (pIndex === path.processedPoints.length - 1) {
                        ctx.beginPath();
                        ctx.rect(screen.x - 4, screen.y - 4, 8, 8);
                        ctx.strokeStyle = '#ff6b6b';
                        ctx.lineWidth = 2;
                        ctx.stroke();
                    }
                });
                }
            }
        });
        
        // Draw transitions between paths (skip in clean view)
        if (!this.settings.cleanView) {
            this.drawTransitions(ctx);
        }
    }

    // Draw transition paths between consecutive paths
    drawTransitions(ctx) {
        if (this.paths.length < 2 || this.transitions.length === 0) return;
        
        this.ensureTransitions();
        
        for (let i = 0; i < this.transitions.length; i++) {
            const fromPath = this.paths[i];
            const toPath = this.paths[i + 1];
            
            if (!fromPath?.visible || !toPath?.visible) continue;
            if (!fromPath?.processedPoints?.length || !toPath?.processedPoints?.length) continue;
            
            const transition = this.transitions[i];
            const transitionPoints = this.calculateTransitionPoints(fromPath, toPath, transition);
            
            if (transitionPoints.length < 2) continue;
            
            // Draw transition line (dashed orange)
            ctx.strokeStyle = '#ff9500';
            ctx.lineWidth = 2;
            ctx.setLineDash([6, 4]);
            ctx.lineCap = 'round';
            
            ctx.beginPath();
            const start = this.worldToScreen(transitionPoints[0].x, transitionPoints[0].y);
            ctx.moveTo(start.x, start.y);
            
            for (let j = 1; j < transitionPoints.length; j++) {
                const point = this.worldToScreen(transitionPoints[j].x, transitionPoints[j].y);
                ctx.lineTo(point.x, point.y);
            }
            ctx.stroke();
            ctx.setLineDash([]);
            
            // Draw transition points
            transitionPoints.forEach((point, pIndex) => {
                const screen = this.worldToScreen(point.x, point.y);
                
                // Draw diamond shape for transition points
                ctx.beginPath();
                ctx.moveTo(screen.x, screen.y - 5);
                ctx.lineTo(screen.x + 5, screen.y);
                ctx.lineTo(screen.x, screen.y + 5);
                ctx.lineTo(screen.x - 5, screen.y);
                ctx.closePath();
                
                ctx.fillStyle = pIndex === transitionPoints.length - 1 ? '#00ff88' : '#ff9500';
                ctx.fill();
                ctx.strokeStyle = '#ffffff';
                ctx.lineWidth = 1;
                ctx.stroke();
            });
        }
    }

    // Calculate actual world coordinates for transition points
    calculateTransitionPoints(fromPath, toPath, transition) {
        const points = [];
        const endPoint = fromPath.processedPoints[fromPath.processedPoints.length - 1];
        const startPoint = toPath.processedPoints[0];
        
        // Process each transition point
        // Structure: [Uscita (index 0), ...Intermedi, Ingresso (N-2), Partenza (N-1)]
        transition.points.forEach((tp, index) => {
            let basePoint;
            
            if (index === 0) {
                // Punto Uscita: relative to end of fromPath
                basePoint = endPoint;
            } else {
                // All other points (Intermedi, Ingresso, Partenza): relative to start of toPath
                basePoint = startPoint;
            }
            
            // Apply offsets based on work plane
            const worldPoint = this.applyTransitionOffset(basePoint, tp);
            points.push(worldPoint);
        });
        
        return points;
    }

    // Apply offset to a base point based on work plane
    applyTransitionOffset(basePoint, transitionPoint) {
        // Get base coordinates
        let x = basePoint.x;
        let y = basePoint.y;
        let z = basePoint.z || 0;
        
        // Apply offsets based on work plane mapping
        // For XY plane: canvas X = world X, canvas Y = world Y, Z is perpendicular
        // For YZ plane: canvas X = world Y, canvas Y = world Z, X is perpendicular
        // For XZ plane: canvas X = world X, canvas Y = world Z, Y is perpendicular
        
        switch (this.settings.workPlane) {
            case 'XY':
                x += transitionPoint.offsetX;
                y += transitionPoint.offsetY;
                z += transitionPoint.offsetZ;
                break;
            case 'YZ':
                // Canvas X = Y, Canvas Y = Z
                y += transitionPoint.offsetX; // X offset affects Y
                z += transitionPoint.offsetY; // Y offset affects Z
                x += transitionPoint.offsetZ; // Z offset affects X (perpendicular)
                break;
            case 'XZ':
                // Canvas X = X, Canvas Y = Z
                x += transitionPoint.offsetX;
                z += transitionPoint.offsetY; // Y offset affects Z
                y += transitionPoint.offsetZ; // Z offset affects Y (perpendicular)
                break;
        }
        
        return { x, y, z, velocity: transitionPoint.velocity };
    }

    // Draw a Catmull-Rom spline through the given points
    drawSplineCurve(ctx, points) {
        if (points.length < 2) return;
        
        ctx.beginPath();
        
        const screenPoints = points.map(p => this.worldToScreen(p.x, p.y));
        
        if (points.length === 2) {
            // Just draw a line for 2 points
            ctx.moveTo(screenPoints[0].x, screenPoints[0].y);
            ctx.lineTo(screenPoints[1].x, screenPoints[1].y);
        } else {
            // Catmull-Rom spline
            ctx.moveTo(screenPoints[0].x, screenPoints[0].y);
            
            for (let i = 0; i < screenPoints.length - 1; i++) {
                const p0 = screenPoints[Math.max(0, i - 1)];
                const p1 = screenPoints[i];
                const p2 = screenPoints[Math.min(screenPoints.length - 1, i + 1)];
                const p3 = screenPoints[Math.min(screenPoints.length - 1, i + 2)];
                
                // Draw curve segment with multiple line segments for smoothness
                const segments = 20;
                for (let t = 1; t <= segments; t++) {
                    const tt = t / segments;
                    const point = this.catmullRom(p0, p1, p2, p3, tt);
                    ctx.lineTo(point.x, point.y);
                }
            }
        }
        
        ctx.stroke();
    }

    // Catmull-Rom spline interpolation
    catmullRom(p0, p1, p2, p3, t) {
        const t2 = t * t;
        const t3 = t2 * t;
        
        // Catmull-Rom coefficients
        const tension = 0.5;
        
        const x = tension * (
            (2 * p1.x) +
            (-p0.x + p2.x) * t +
            (2 * p0.x - 5 * p1.x + 4 * p2.x - p3.x) * t2 +
            (-p0.x + 3 * p1.x - 3 * p2.x + p3.x) * t3
        );
        
        const y = tension * (
            (2 * p1.y) +
            (-p0.y + p2.y) * t +
            (2 * p0.y - 5 * p1.y + 4 * p2.y - p3.y) * t2 +
            (-p0.y + 3 * p1.y - 3 * p2.y + p3.y) * t3
        );
        
        return { x, y };
    }

    // Get point on spline at parameter t (0-1 for entire path)
    getSplinePoint(points, t) {
        if (points.length < 2) return points[0] || { x: 0, y: 0 };
        if (points.length === 2) {
            return {
                x: points[0].x + (points[1].x - points[0].x) * t,
                y: points[0].y + (points[1].y - points[0].y) * t
            };
        }
        
        // Find which segment we're in
        const totalSegments = points.length - 1;
        const segmentT = t * totalSegments;
        const segmentIndex = Math.min(Math.floor(segmentT), totalSegments - 1);
        const localT = segmentT - segmentIndex;
        
        const p0 = points[Math.max(0, segmentIndex - 1)];
        const p1 = points[segmentIndex];
        const p2 = points[Math.min(points.length - 1, segmentIndex + 1)];
        const p3 = points[Math.min(points.length - 1, segmentIndex + 2)];
        
        return this.catmullRom(p0, p1, p2, p3, localT);
    }

    redrawShapes() {
        const ctx = this.shapeCtx;
        ctx.clearRect(0, 0, this.canvasWidth, this.canvasHeight);
        
        this.shapes.forEach(shape => {
            ctx.strokeStyle = this.settings.shapeColor;
            ctx.lineWidth = 1;
            ctx.setLineDash([4, 4]);
            
            if (shape.type === 'rectangle') {
                const topLeft = this.worldToScreen(shape.x, shape.y + shape.height);
                const width = shape.width * this.scale;
                const height = shape.height * this.scale;
                ctx.strokeRect(topLeft.x, topLeft.y, width, height);
            } else if (shape.type === 'circle') {
                const center = this.worldToScreen(shape.x, shape.y);
                const radius = shape.radius * this.scale;
                ctx.beginPath();
                ctx.arc(center.x, center.y, radius, 0, Math.PI * 2);
                ctx.stroke();
            }
            
            ctx.setLineDash([]);
        });
    }

    redrawAll() {
        this.redrawPaths();
        this.redrawShapes();
        this.drawPointHighlights();
    }

    // Draw highlights for hovered and selected points
    drawPointHighlights() {
        const ctx = this.previewCtx;
        ctx.clearRect(0, 0, this.canvasWidth, this.canvasHeight);
        
        // Draw selected points (yellow)
        this.selectedPoints.forEach(pointKey => {
            const [pathIdx, pointIdx] = pointKey.split('-').map(Number);
            const path = this.paths[pathIdx];
            if (!path || !path.processedPoints || !path.processedPoints[pointIdx]) return;
            
            const point = path.processedPoints[pointIdx];
            const screen = this.worldToScreen(point.x, point.y);
            
            // Outer glow
            ctx.beginPath();
            ctx.arc(screen.x, screen.y, 14, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(255, 200, 0, 0.2)';
            ctx.fill();
            
            // Ring
            ctx.beginPath();
            ctx.arc(screen.x, screen.y, 10, 0, Math.PI * 2);
            ctx.strokeStyle = '#ffcc00';
            ctx.lineWidth = 3;
            ctx.stroke();
            
            // Center dot
            ctx.beginPath();
            ctx.arc(screen.x, screen.y, 4, 0, Math.PI * 2);
            ctx.fillStyle = '#ffcc00';
            ctx.fill();
        });
        
        // Draw hovered point (cyan) - on top of selected
        if (this.hoveredPoint) {
            const path = this.paths[this.hoveredPoint.pathIndex];
            if (path && path.processedPoints && path.processedPoints[this.hoveredPoint.pointIndex]) {
                const point = path.processedPoints[this.hoveredPoint.pointIndex];
                const screen = this.worldToScreen(point.x, point.y);
                
                // Outer glow
                ctx.shadowColor = '#00ffff';
                ctx.shadowBlur = 20;
                
                ctx.beginPath();
                ctx.arc(screen.x, screen.y, 16, 0, Math.PI * 2);
                ctx.fillStyle = 'rgba(0, 255, 255, 0.15)';
                ctx.fill();
                
                ctx.shadowBlur = 0;
                
                // Ring
                ctx.beginPath();
                ctx.arc(screen.x, screen.y, 12, 0, Math.PI * 2);
                ctx.strokeStyle = '#00ffff';
                ctx.lineWidth = 3;
                ctx.stroke();
                
                // Inner ring
                ctx.beginPath();
                ctx.arc(screen.x, screen.y, 8, 0, Math.PI * 2);
                ctx.strokeStyle = 'rgba(0, 255, 255, 0.5)';
                ctx.lineWidth = 2;
                ctx.stroke();
                
                // Center dot
                ctx.beginPath();
                ctx.arc(screen.x, screen.y, 4, 0, Math.PI * 2);
                ctx.fillStyle = '#00ffff';
                ctx.fill();
            }
        }
    }

    hexToRgba(hex, alpha) {
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }

    clearAllPaths() {
        if (this.paths.length === 0) return;
        if (confirm('Eliminare tutti i percorsi?')) {
            this.paths = [];
            this.transitions = [];
            this.activePathIndex = -1;
            this.updateLayersList();
            this.updatePointsTable();
            this.updateTransitionsList();
            this.redrawPaths();
        }
    }

    undoLastPath() {
        if (this.paths.length === 0) return;
        this.paths.pop();
        this.transitions = [];
        this.activePathIndex = this.paths.length - 1;
        this.updateLayersList();
        this.updatePointsTable();
        this.updateTransitionsList();
        this.redrawPaths();
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // UI Updates
    // ═══════════════════════════════════════════════════════════════════════════

    selectTool(tool) {
        this.currentTool = tool;
        this.toolButtons.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tool === tool);
        });
    }

    switchTab(tabId) {
        this.tabButtons.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tab === tabId);
        });
        
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.toggle('active', content.id === `${tabId}-tab`);
        });
        
        // Update content based on tab
        if (tabId === 'points') {
            this.updatePointsTable();
        } else if (tabId === 'transitions') {
            this.updateTransitionsList();
        }
    }

    updateUI() {
        this.updateLayersList();
        this.updateTransitionsList();
    }

    updateLayersList() {
        this.layersList.innerHTML = '';
        
        this.paths.forEach((path, index) => {
            const item = document.createElement('div');
            item.className = `layer-item ${index === this.activePathIndex ? 'active' : ''} ${!path.visible ? 'layer-hidden' : ''}`;
            item.innerHTML = `
                <div class="layer-color" style="background: ${path.color}"></div>
                <div class="layer-info">
                    <div class="layer-name">${path.name}</div>
                    <div class="layer-points">${path.processedPoints?.length || 0} punti</div>
                </div>
                <div class="layer-actions">
                    <button class="layer-btn visibility-btn" data-action="visibility" data-index="${index}" title="${path.visible ? 'Nascondi' : 'Mostra'}">
                        <span class="material-symbols-outlined">${path.visible ? 'visibility' : 'visibility_off'}</span>
                    </button>
                    <button class="layer-btn delete-btn" data-action="delete" data-index="${index}" title="Elimina">
                        <span class="material-symbols-outlined">delete</span>
                    </button>
                </div>
            `;
            
            // Click to select
            item.addEventListener('click', (e) => {
                if (!e.target.closest('.layer-btn')) {
                    this.activePathIndex = index;
                    this.updateLayersList();
                    this.redrawPaths();
                }
            });
            
            // Button actions
            item.querySelectorAll('.layer-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    const action = btn.dataset.action;
                    const idx = parseInt(btn.dataset.index);
                    
                    // Double-check we have valid path
                    if (idx < 0 || idx >= this.paths.length) return;
                    
                    if (action === 'visibility') {
                        this.paths[idx].visible = !this.paths[idx].visible;
                        this.updateLayersList();
                        this.redrawPaths();
                    } else if (action === 'delete') {
                        this.deletePath(idx);
                    }
                });
            });
            
            this.layersList.appendChild(item);
        });
        
        // Update stats
        const totalPoints = this.paths.reduce((sum, p) => sum + (p.processedPoints?.length || 0), 0);
        this.totalPathsCount.textContent = `${this.paths.length} percorsi`;
        this.totalPointsCount.textContent = `${totalPoints} punti totali`;
        
        // Update path select in points tab
        this.updatePathSelect();
    }

    updatePathSelect() {
        this.pointsPathSelect.innerHTML = '<option value="all">Tutti i percorsi</option>';
        this.paths.forEach((path, index) => {
            const option = document.createElement('option');
            option.value = index;
            option.textContent = path.name;
            this.pointsPathSelect.appendChild(option);
        });
    }

    updatePointsTable() {
        this.pointsTableBody.innerHTML = '';
        
        const selectedPath = this.pointsPathSelect.value;
        const pathsToShow = selectedPath === 'all' 
            ? this.paths 
            : [this.paths[parseInt(selectedPath)]].filter(Boolean);
        
        let globalPointIndex = 0;
        pathsToShow.forEach((path, localPathIdx) => {
            if (!path.processedPoints) return;
            
            // Get actual path index in this.paths
            const pathIdx = selectedPath === 'all' ? localPathIdx : parseInt(selectedPath);
            
            path.processedPoints.forEach((point, idx) => {
                const row = document.createElement('tr');
                const pointKey = `${pathIdx}-${idx}`;
                const isSelected = this.selectedPoints.has(pointKey);
                
                if (isSelected) {
                    row.classList.add('selected');
                }
                
                row.dataset.pathIndex = pathIdx;
                row.dataset.pointIndex = idx;
                
                row.innerHTML = `
                    <td><input type="checkbox" data-path="${pathIdx}" data-point="${idx}" ${isSelected ? 'checked' : ''}></td>
                    <td>${++globalPointIndex}</td>
                    <td>${point.x.toFixed(2)}</td>
                    <td>${point.y.toFixed(2)}</td>
                    <td><input type="number" value="${point.velocity || this.settings.defaultPathSpeed}" min="0" step="5" class="velocity-input" data-path="${pathIdx}" data-point="${idx}"></td>
                `;
                
                // Hover events for highlighting
                row.addEventListener('mouseenter', () => {
                    this.hoveredPoint = { pathIndex: pathIdx, pointIndex: idx };
                    this.drawPointHighlights();
                });
                
                row.addEventListener('mouseleave', () => {
                    this.hoveredPoint = null;
                    this.drawPointHighlights();
                });
                
                // Touch events for mobile
                row.addEventListener('touchstart', () => {
                    this.hoveredPoint = { pathIndex: pathIdx, pointIndex: idx };
                    this.drawPointHighlights();
                });
                
                // Checkbox change for selection
                const checkbox = row.querySelector('input[type="checkbox"]');
                checkbox.addEventListener('change', (e) => {
                    if (e.target.checked) {
                        this.selectedPoints.add(pointKey);
                        row.classList.add('selected');
                    } else {
                        this.selectedPoints.delete(pointKey);
                        row.classList.remove('selected');
                    }
                    this.drawPointHighlights();
                });
                
                this.pointsTableBody.appendChild(row);
            });
        });
        
        // Add velocity input listeners
        this.pointsTableBody.querySelectorAll('.velocity-input').forEach(input => {
            input.addEventListener('change', (e) => {
                const pathIdx = parseInt(e.target.dataset.path);
                const pointIdx = parseInt(e.target.dataset.point);
                if (this.paths[pathIdx] && this.paths[pathIdx].processedPoints[pointIdx]) {
                    this.paths[pathIdx].processedPoints[pointIdx].velocity = parseFloat(e.target.value);
                    // Refresh animation if running
                    this.refreshAnimationPath();
                }
            });
        });
        
        // Draw initial highlights for selected points
        this.drawPointHighlights();
    }

    updateTransitionsList() {
        this.transitionsList.innerHTML = '';
        
        if (this.paths.length < 2) {
            this.transitionsList.innerHTML = '<p class="info-text">Aggiungi almeno 2 percorsi per visualizzare i raccordi.</p>';
            return;
        }
        
        // Ensure we have transitions for all path pairs
        this.ensureTransitions();
        
        // Show transitions between consecutive paths
        for (let i = 0; i < this.paths.length - 1; i++) {
            const fromPath = this.paths[i];
            const toPath = this.paths[i + 1];
            const transition = this.transitions[i];
            
            const item = document.createElement('div');
            item.className = 'transition-item';
            item.dataset.index = i;
            
            // Build points list HTML
            // Structure: [Uscita, ...Intermedi, Ingresso, Partenza]
            // Uscita (index 0): relativo a fine percorso precedente
            // Ingresso (index N-2): relativo a inizio percorso successivo
            // Partenza (index N-1): offset 0,0,0 fisso
            const pointsHtml = transition.points.map((point, pIndex) => {
                const isLast = pIndex === transition.points.length - 1;
                const isSecondLast = pIndex === transition.points.length - 2;
                const isFirst = pIndex === 0;
                const isIntermediate = !isFirst && !isSecondLast && !isLast;
                
                let pointName, refText, isFixed = false;
                
                if (isFirst) {
                    pointName = 'Punto Uscita';
                    refText = `da fine "${fromPath.name}"`;
                } else if (isSecondLast) {
                    pointName = 'Punto Ingresso';
                    refText = `da inizio "${toPath.name}"`;
                } else if (isLast) {
                    pointName = 'Punto Partenza Percorso';
                    refText = `inizio "${toPath.name}"`;
                    isFixed = true;
                } else {
                    // Intermediate points - count them
                    let intermediateNum = 0;
                    for (let k = 1; k < pIndex; k++) {
                        if (k < transition.points.length - 2) intermediateNum++;
                    }
                    intermediateNum++;
                    pointName = `Intermedio ${intermediateNum}`;
                    refText = `da inizio "${toPath.name}"`;
                }
                
                const canRemove = isIntermediate;
                
                return `
                    <div class="transition-point ${!canRemove ? 'required' : ''}" data-point-index="${pIndex}">
                        <div class="point-header">
                            <span class="point-label">${pointName}</span>
                            <span class="point-ref">${refText}</span>
                            ${canRemove ? `<button class="btn-icon remove-point-btn" data-point="${pIndex}" title="Rimuovi"><span class="material-symbols-outlined">close</span></button>` : ''}
                        </div>
                        <div class="point-offsets">
                            <div class="offset-input">
                                <label>X:</label>
                                <input type="number" class="offset-x" value="${point.offsetX}" step="1" data-point="${pIndex}" ${isFixed ? 'disabled' : ''}> mm
                            </div>
                            <div class="offset-input">
                                <label>Y:</label>
                                <input type="number" class="offset-y" value="${point.offsetY}" step="1" data-point="${pIndex}" ${isFixed ? 'disabled' : ''}> mm
                            </div>
                            <div class="offset-input">
                                <label>Z:</label>
                                <input type="number" class="offset-z" value="${point.offsetZ}" step="1" data-point="${pIndex}" ${isFixed ? 'disabled' : ''}> mm
                            </div>
                            <div class="offset-input">
                                <label>Vel:</label>
                                <input type="number" class="offset-vel" value="${point.velocity}" step="10" min="1" data-point="${pIndex}" ${isFixed ? 'disabled' : ''}> mm/s
                            </div>
                        </div>
                    </div>
                `;
            }).join('');
            
            item.innerHTML = `
                <div class="transition-header">
                    <span class="transition-title">${fromPath.name} → ${toPath.name}</span>
                    <button class="btn btn-small add-point-btn" title="Aggiungi punto intermedio">
                        <span class="material-symbols-outlined">add</span>
                        Intermedio
                    </button>
                </div>
                <div class="transition-points">
                    ${pointsHtml}
                </div>
            `;
            
            // Add event listeners
            this.setupTransitionItemEvents(item, i);
            
            this.transitionsList.appendChild(item);
        }
        
        // Redraw to show transitions on canvas
        this.redrawPaths();
    }

    // Ensure transitions array matches path pairs
    ensureTransitions() {
        const requiredCount = Math.max(0, this.paths.length - 1);
        const defaultOffset = parseFloat(this.defaultTransitionOffset?.value) || 50;
        const defaultVelocity = parseFloat(this.defaultTransitionVelocity?.value) || 100;
        const offsetAxis = this.getPerpendicularAxis();
        
        // Create or update transitions array
        while (this.transitions.length < requiredCount) {
            const transIndex = this.transitions.length;
            const transition = this.createDefaultTransition(defaultOffset, defaultVelocity, offsetAxis);
            transition.from = transIndex;     // Path index this transition starts from
            transition.to = transIndex + 1;   // Path index this transition goes to
            this.transitions.push(transition);
        }
        
        // Trim excess transitions
        if (this.transitions.length > requiredCount) {
            this.transitions.length = requiredCount;
        }
    }

    // Get the perpendicular axis based on work plane
    getPerpendicularAxis() {
        switch (this.settings.workPlane) {
            case 'XY': return 'Z';
            case 'YZ': return 'X';
            case 'XZ': return 'Y';
            default: return 'Z';
        }
    }

    // Create default transition with 3 required points: Uscita, Ingresso, Partenza
    createDefaultTransition(offset, velocity, axis) {
        // Punto Uscita: da fine percorso precedente con offset
        const pointUscita = { offsetX: 0, offsetY: 0, offsetZ: 0, velocity };
        // Punto Ingresso: da inizio percorso successivo con offset
        const pointIngresso = { offsetX: 0, offsetY: 0, offsetZ: 0, velocity };
        // Punto Partenza: inizio percorso successivo, offset fisso 0,0,0
        const pointPartenza = { offsetX: 0, offsetY: 0, offsetZ: 0, velocity };
        
        // Set offset on perpendicular axis for Uscita and Ingresso
        if (axis === 'X') {
            pointUscita.offsetX = offset;
            pointIngresso.offsetX = offset;
        } else if (axis === 'Y') {
            pointUscita.offsetY = offset;
            pointIngresso.offsetY = offset;
        } else {
            pointUscita.offsetZ = offset;
            pointIngresso.offsetZ = offset;
        }
        
        return { points: [pointUscita, pointIngresso, pointPartenza] };
    }

    // Setup event listeners for a transition item
    setupTransitionItemEvents(item, transitionIndex) {
        // Add point button
        item.querySelector('.add-point-btn').addEventListener('click', () => {
            this.addTransitionPoint(transitionIndex);
        });
        
        // Remove point buttons
        item.querySelectorAll('.remove-point-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const pointIndex = parseInt(btn.dataset.point);
                this.removeTransitionPoint(transitionIndex, pointIndex);
            });
        });
        
        // Offset inputs (skip disabled ones)
        item.querySelectorAll('.offset-x:not([disabled]), .offset-y:not([disabled]), .offset-z:not([disabled]), .offset-vel:not([disabled])').forEach(input => {
            input.addEventListener('change', (e) => {
                const pointIndex = parseInt(input.dataset.point);
                const transition = this.transitions[transitionIndex];
                if (!transition || !transition.points[pointIndex]) return;
                
                if (input.classList.contains('offset-x')) {
                    transition.points[pointIndex].offsetX = parseFloat(input.value) || 0;
                } else if (input.classList.contains('offset-y')) {
                    transition.points[pointIndex].offsetY = parseFloat(input.value) || 0;
                } else if (input.classList.contains('offset-z')) {
                    transition.points[pointIndex].offsetZ = parseFloat(input.value) || 0;
                } else if (input.classList.contains('offset-vel')) {
                    transition.points[pointIndex].velocity = parseFloat(input.value) || 100;
                }
                
                this.redrawPaths();
            });
        });
    }

    // Add intermediate point to transition (inserted between Uscita and Ingresso)
    addTransitionPoint(transitionIndex) {
        const transition = this.transitions[transitionIndex];
        if (!transition) return;
        
        const defaultVelocity = parseFloat(this.defaultTransitionVelocity?.value) || 100;
        const defaultOffset = parseFloat(this.defaultTransitionOffset?.value) || 50;
        const axis = this.getPerpendicularAxis();
        
        // Create new intermediate point with default offset
        const newPoint = { offsetX: 0, offsetY: 0, offsetZ: 0, velocity: defaultVelocity };
        
        // Copy offset from Ingresso point as starting suggestion
        const ingressoIndex = transition.points.length - 2;
        const ingressoPoint = transition.points[ingressoIndex];
        newPoint.offsetX = ingressoPoint.offsetX;
        newPoint.offsetY = ingressoPoint.offsetY;
        newPoint.offsetZ = ingressoPoint.offsetZ;
        
        // Insert before Ingresso (which is second-to-last, before Partenza)
        // Position: after Uscita (0) and any existing intermediates, before Ingresso
        transition.points.splice(ingressoIndex, 0, newPoint);
        
        this.updateTransitionsList();
    }

    // Remove intermediate point from transition
    removeTransitionPoint(transitionIndex, pointIndex) {
        const transition = this.transitions[transitionIndex];
        if (!transition) return;
        
        // Can only remove intermediate points (not Uscita at 0, Ingresso at N-2, Partenza at N-1)
        const isFirst = pointIndex === 0;
        const isSecondLast = pointIndex === transition.points.length - 2;
        const isLast = pointIndex === transition.points.length - 1;
        
        if (isFirst || isSecondLast || isLast) return; // Can't remove required points
        
        transition.points.splice(pointIndex, 1);
        this.updateTransitionsList();
    }

    addEmptyPath() {
        const newPath = {
            id: Date.now(),
            name: `Percorso ${this.paths.length + 1}`,
            rawPoints: [],
            processedPoints: [],
            color: this.layerColors[this.paths.length % this.layerColors.length],
            visible: true,
            locked: false,
            velocity: this.settings.defaultPathSpeed
        };
        
        this.paths.push(newPath);
        this.activePathIndex = this.paths.length - 1;
        this.updateLayersList();
    }

    deletePath(index) {
        if (confirm(`Eliminare "${this.paths[index].name}"?`)) {
            this.paths.splice(index, 1);
            
            // Adjust transitions - remove affected ones, ensureTransitions will rebuild
            this.transitions = [];
            
            if (this.activePathIndex >= this.paths.length) {
                this.activePathIndex = this.paths.length - 1;
            }
            this.updateLayersList();
            this.updateTransitionsList();
            this.redrawPaths();
        }
    }

    applyBulkVelocity() {
        const velocity = parseFloat(this.bulkVelocityInput.value);
        if (isNaN(velocity) || velocity <= 0) {
            alert('Inserisci una velocità valida');
            return;
        }
        
        const checkboxes = this.pointsTableBody.querySelectorAll('input[type="checkbox"]:checked');
        checkboxes.forEach(cb => {
            const pathIdx = parseInt(cb.dataset.path);
            const pointIdx = parseInt(cb.dataset.point);
            if (this.paths[pathIdx] && this.paths[pathIdx].processedPoints[pointIdx]) {
                this.paths[pathIdx].processedPoints[pointIdx].velocity = velocity;
            }
        });
        
        this.updatePointsTable();
        
        // Refresh animation if running
        this.refreshAnimationPath();
    }

    toggleSelectAll(checked) {
        const checkboxes = this.pointsTableBody.querySelectorAll('input[type="checkbox"]');
        checkboxes.forEach(cb => {
            cb.checked = checked;
            const pointKey = `${cb.dataset.path}-${cb.dataset.point}`;
            const row = cb.closest('tr');
            
            if (checked) {
                this.selectedPoints.add(pointKey);
                row.classList.add('selected');
            } else {
                this.selectedPoints.delete(pointKey);
                row.classList.remove('selected');
            }
        });
        
        this.drawPointHighlights();
    }

    handleSelectionClick(e) {
        const world = this.screenToWorld(e.clientX, e.clientY);
        const pointTolerance = 8 / this.scale; // Tolerance for point selection
        const lineTolerance = 5 / this.scale;  // Tolerance for line selection
        
        // First: check if clicking on a specific point
        for (let i = 0; i < this.paths.length; i++) {
            const path = this.paths[i];
            if (!path.visible || !path.processedPoints) continue;
            
            for (let j = 0; j < path.processedPoints.length; j++) {
                const point = path.processedPoints[j];
                const dist = Math.hypot(point.x - world.x, point.y - world.y);
                
                if (dist < pointTolerance) {
                    const pointKey = `${i}-${j}`;
                    
                    if (e.shiftKey && this.lastSelectedPoint) {
                        // Shift+click: select range from last selected to this point
                        const [lastPath, lastPoint] = this.lastSelectedPoint.split('-').map(Number);
                        
                        if (lastPath === i) {
                            // Same path - select range of points
                            const startIdx = Math.min(lastPoint, j);
                            const endIdx = Math.max(lastPoint, j);
                            
                            for (let k = startIdx; k <= endIdx; k++) {
                                this.selectedPoints.add(`${i}-${k}`);
                            }
                        } else {
                            // Different paths - select all points between paths
                            const startPathIdx = Math.min(lastPath, i);
                            const endPathIdx = Math.max(lastPath, i);
                            
                            for (let p = startPathIdx; p <= endPathIdx; p++) {
                                const pathObj = this.paths[p];
                                if (!pathObj || !pathObj.processedPoints) continue;
                                
                                let startJ = 0;
                                let endJ = pathObj.processedPoints.length - 1;
                                
                                if (p === lastPath) {
                                    startJ = (lastPath < i) ? lastPoint : 0;
                                    endJ = (lastPath < i) ? pathObj.processedPoints.length - 1 : lastPoint;
                                } else if (p === i) {
                                    startJ = (i < lastPath) ? j : 0;
                                    endJ = (i < lastPath) ? pathObj.processedPoints.length - 1 : j;
                                }
                                
                                for (let k = startJ; k <= endJ; k++) {
                                    this.selectedPoints.add(`${p}-${k}`);
                                }
                            }
                        }
                    } else if (e.ctrlKey) {
                        // Ctrl+click: toggle single point (add/remove from selection)
                        if (this.selectedPoints.has(pointKey)) {
                            this.selectedPoints.delete(pointKey);
                        } else {
                            this.selectedPoints.add(pointKey);
                        }
                    } else {
                        // Normal click: select only this point
                        this.selectedPoints.clear();
                        this.selectedPoints.add(pointKey);
                    }
                    
                    // Remember last selected point for shift+click range selection
                    this.lastSelectedPoint = pointKey;
                    
                    this.activePathIndex = i;
                    this.updateLayersList();
                    this.updatePointsTable();
                    this.drawPointHighlights();
                    this.switchTab('points');
                    return;
                }
            }
        }
        
        // Second: check if clicking on a path line (between points)
        for (let i = 0; i < this.paths.length; i++) {
            const path = this.paths[i];
            if (!path.visible || !path.processedPoints || path.processedPoints.length < 2) continue;
            
            // Check distance to each line segment
            for (let j = 0; j < path.processedPoints.length - 1; j++) {
                const p1 = path.processedPoints[j];
                const p2 = path.processedPoints[j + 1];
                
                const dist = this.pointToLineDistance(world, p1, p2);
                
                if (dist < lineTolerance) {
                    // Clicked on path line - select entire path
                    if (!e.ctrlKey) {
                        this.selectedPoints.clear();
                    }
                    
                    // Add all points of this path to selection
                    path.processedPoints.forEach((_, idx) => {
                        this.selectedPoints.add(`${i}-${idx}`);
                    });
                    
                    // Set last selected as last point of path
                    this.lastSelectedPoint = `${i}-${path.processedPoints.length - 1}`;
                    
                    this.activePathIndex = i;
                    this.updateLayersList();
                    this.updatePointsTable();
                    this.drawPointHighlights();
                    this.switchTab('points');
                    return;
                }
            }
        }
        
        // Clicked on empty space - clear selection (unless Ctrl held)
        if (!e.ctrlKey) {
            this.selectedPoints.clear();
            this.lastSelectedPoint = null;
            this.updatePointsTable();
            this.drawPointHighlights();
        }
    }

    // Calculate distance from point to line segment
    pointToLineDistance(point, lineStart, lineEnd) {
        const A = point.x - lineStart.x;
        const B = point.y - lineStart.y;
        const C = lineEnd.x - lineStart.x;
        const D = lineEnd.y - lineStart.y;
        
        const dot = A * C + B * D;
        const lenSq = C * C + D * D;
        
        let param = -1;
        if (lenSq !== 0) {
            param = dot / lenSq;
        }
        
        let xx, yy;
        
        if (param < 0) {
            xx = lineStart.x;
            yy = lineStart.y;
        } else if (param > 1) {
            xx = lineEnd.x;
            yy = lineEnd.y;
        } else {
            xx = lineStart.x + param * C;
            yy = lineStart.y + param * D;
        }
        
        return Math.hypot(point.x - xx, point.y - yy);
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // Transitions
    // ═══════════════════════════════════════════════════════════════════════════

    openTransitionEditor(index) {
        // TODO: Implement transition editor modal
        console.log('Opening transition editor for index:', index);
    }

    editTransition(index) {
        // TODO: Implement transition editing
        console.log('Editing transition at index:', index);
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // Settings
    // ═══════════════════════════════════════════════════════════════════════════

    openSettings() {
        // Populate settings form
        Object.keys(this.settingsInputs).forEach(key => {
            const input = this.settingsInputs[key];
            if (!input) return;
            
            if (input.type === 'checkbox') {
                input.checked = this.settings[key];
            } else if (input.id === 'smoothingValue') {
                input.textContent = this.settings.smoothingFactor;
            } else {
                input.value = this.settings[key];
            }
        });
        
        this.settingsModal.classList.add('active');
    }

    saveSettings() {
        // Store old processing parameters to detect changes
        const oldSmoothing = this.settings.smoothingFactor;
        const oldMinDist = this.settings.minPointDistance;
        const oldMaxDist = this.settings.maxPointDistance;
        const oldCurvature = this.settings.curvatureThreshold;
        
        // Read values from form
        Object.keys(this.settingsInputs).forEach(key => {
            const input = this.settingsInputs[key];
            if (!input || input.id === 'smoothingValue') return;
            
            if (input.type === 'checkbox') {
                this.settings[key] = input.checked;
            } else if (input.type === 'number' || input.type === 'range') {
                this.settings[key] = parseFloat(input.value);
            } else {
                this.settings[key] = input.value;
            }
        });
        
        // Save to localStorage
        localStorage.setItem('splineDrawMECSPE2026Settings', JSON.stringify(this.settings));
        
        // Check if processing parameters changed
        const processingChanged = 
            oldSmoothing !== this.settings.smoothingFactor ||
            oldMinDist !== this.settings.minPointDistance ||
            oldMaxDist !== this.settings.maxPointDistance ||
            oldCurvature !== this.settings.curvatureThreshold;
        
        // Reprocess all paths if processing parameters changed
        if (processingChanged && this.paths.length > 0) {
            this.reprocessAllPaths();
        }
        
        // Redraw
        this.calculateScale();
        this.drawGrid();
        this.redrawAll();
        
        // Apply interface settings
        this.applyInterfaceSettings();
        
        this.settingsModal.classList.remove('active');
    }

    resetSettings() {
        if (confirm('Ripristinare le impostazioni predefinite?')) {
            localStorage.removeItem('splineDrawMECSPE2026Settings');
            this.initializeSettings();
            this.openSettings(); // Refresh form
            this.calculateScale();
            this.drawGrid();
            this.redrawAll();
            this.applyInterfaceSettings();
        }
    }

    applyInterfaceSettings() {
        // Side panel visibility
        const sidePanel = document.getElementById('sidePanel');
        if (sidePanel) {
            sidePanel.style.display = this.settings.showSidePanel ? '' : 'none';
        }
        
        // Playback bar visibility
        const playbackSection = document.querySelector('.playback-group')?.closest('.toolbar-section');
        if (playbackSection) {
            playbackSection.style.display = this.settings.playbackBar === 'hidden' ? 'none' : '';
        }
        
        // Recalculate canvas dimensions after layout change
        requestAnimationFrame(() => this.resizeCanvases());
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // Save / Load Project
    // ═══════════════════════════════════════════════════════════════════════════

    saveProject() {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
        const fileName = `MECSPE2026_${timestamp}`;
        
        const projectData = {
            version: '3.0-MECSPE',
            timestamp: new Date().toISOString(),
            projectName: 'SpLinePath',
            settings: this.settings,
            paths: this.paths,
            shapes: this.shapes,
            transitions: this.transitions
        };
        
        const dataStr = JSON.stringify(projectData, null, 2);
        const blob = new Blob([dataStr], { type: 'application/json' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `${fileName}.json`;
        link.click();
        URL.revokeObjectURL(link.href);
        
        console.log(`Project saved: ${fileName}.json`);
    }

    loadProject(event) {
        const file = event.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = JSON.parse(e.target.result);
                
                // Validate
                if (!data.version) {
                    throw new Error('File non valido');
                }
                
                // Load settings
                if (data.settings) {
                    this.settings = { ...this.settings, ...data.settings };
                    localStorage.setItem('splineDrawMECSPE2026Settings', JSON.stringify(this.settings));
                }
                
                // Load MECSPE format
                if (data.paths) {
                    this.paths = data.paths;
                    this.shapes = data.shapes || [];
                    this.transitions = data.transitions || [];
                }
                // Legacy v3.0 format support
                else if (data.version === '3.0' && data.programs) {
                    const programIndex = data.currentProgramIndex || 1;
                    const program = data.programs[programIndex];
                    if (program) {
                        this.paths = program.paths || [];
                        this.shapes = program.shapes || [];
                        this.transitions = program.transitions || [];
                    }
                }
                
                this.activePathIndex = this.paths.length > 0 ? 0 : -1;
                
                // Update everything
                this.calculateScale();
                this.drawGrid();
                this.updateUI();
                this.redrawAll();
                
                alert('Progetto caricato con successo!');
                
            } catch (error) {
                alert('Errore nel caricamento: ' + error.message);
            }
        };
        
        reader.readAsText(file);
        event.target.value = '';
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // Export Robot Code
    // ═══════════════════════════════════════════════════════════════════════════

    exportRobotCode() {
        // Always FANUC in MECSPE edition
        const robotType = 'fanuc';
        
        // Collect all points from all visible paths in order
        const allPoints = [];
        const visiblePaths = this.paths.filter(p => p.visible && p.processedPoints);
        
        // Get approach/exit offset from settings (use same as transition offset)
        const approachOffset = parseFloat(this.defaultTransitionOffset?.value) || 50;
        const approachVelocity = parseFloat(this.defaultTransitionVelocity?.value) || 100;
        const offsetAxis = this.getPerpendicularAxis();
        
        visiblePaths.forEach((path, visIdx) => {
            const pathIndex = this.paths.indexOf(path);
            
            // Add APPROACH point before first path
            if (visIdx === 0 && path.processedPoints.length > 0) {
                const firstPoint = path.processedPoints[0];
                const approachPoint = this.calculateApproachExitPoint(firstPoint, approachOffset, offsetAxis);
                allPoints.push({
                    type: 'approach',
                    x: approachPoint.x,
                    y: approachPoint.y,
                    z: approachPoint.z,
                    velocity: approachVelocity
                });
            }
            
            // Add transition before path (except first visible path)
            if (visIdx > 0) {
                const prevPath = visiblePaths[visIdx - 1];
                const prevPathIndex = this.paths.indexOf(prevPath);
                
                const transitionIndex = prevPathIndex;
                const transition = this.transitions[transitionIndex];
                
                if (transition && prevPath.processedPoints && path.processedPoints) {
                    const transitionPoints = this.calculateTransitionPoints(prevPath, path, transition);
                    
                    transitionPoints.forEach((tp, tpIdx) => {
                        allPoints.push({
                            type: 'transition',
                            x: tp.x,
                            y: tp.y,
                            z: tp.z,
                            velocity: tp.velocity || this.settings.defaultTransitionSpeed,
                            transitionIndex: transitionIndex,
                            pointIndex: tpIdx
                        });
                    });
                }
            }
            
            // Add path points (only those inside the grid area)
            path.processedPoints.forEach((point, idx) => {
                if (point.x < this.settings.minAxis1 || point.x > this.settings.maxAxis1 ||
                    point.y < this.settings.minAxis2 || point.y > this.settings.maxAxis2) {
                    return;
                }
                
                allPoints.push({
                    type: 'path',
                    x: point.x,
                    y: point.y,
                    z: point.z || 0,
                    velocity: point.velocity || path.velocity,
                    pathIndex,
                    pointIndex: idx
                });
            });
            
            // Add EXIT point after last path
            if (visIdx === visiblePaths.length - 1 && path.processedPoints.length > 0) {
                const lastPoint = path.processedPoints[path.processedPoints.length - 1];
                const exitPoint = this.calculateApproachExitPoint(lastPoint, approachOffset, offsetAxis);
                allPoints.push({
                    type: 'exit',
                    x: exitPoint.x,
                    y: exitPoint.y,
                    z: exitPoint.z,
                    velocity: approachVelocity
                });
            }
        });
        
        if (allPoints.length === 0) {
            return null;
        }
        
        // Warning for excessive points
        if (allPoints.length > 500) {
            const proceed = confirm(
                `⚠️ Attenzione: il programma contiene ${allPoints.length} punti.\n\n` +
                `Programmi con più di 500 punti possono causare:\n` +
                `- Rallentamenti del controller (MOTN-632 SPL:Speed Reduced)\n` +
                `- Errori di pianificazione (MOTN-633 SPL:VAJ Limit)\n` +
                `- Problemi di memoria sul controller\n\n` +
                `Suggerimenti: aumenta Min Point Distance o Max Point Distance nelle impostazioni.\n\n` +
                `Vuoi continuare comunque?`
            );
            if (!proceed) return null;
        }
        
        // Always use SpLinePath as program name
        const programName = 'SPLINEPATH';
        const code = this.generateFanucCode(programName, allPoints);
        
        return code;
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // FTP Send
    // ═══════════════════════════════════════════════════════════════════════════

    async sendFTP() {
        // Generate the code
        const code = this.exportRobotCode();
        if (!code) {
            if (this.paths.filter(p => p.visible && p.processedPoints).length === 0) {
                alert('Nessun percorso da inviare');
            }
            return;
        }
        
        const ftpHost = this.settings.ftpHost || '192.168.1.1';
        const ftpPort = this.settings.ftpPort || 21;
        const ftpUser = this.settings.ftpUser || 'anonymous';
        const ftpPassword = this.settings.ftpPassword || '';
        const ftpRemotePath = this.settings.ftpRemotePath || 'md:';
        const fileName = 'SpLinePath.ls';
        
        // Show FTP modal
        this.ftpModal.classList.add('active');
        this.ftpStatusIcon.textContent = 'hourglass_empty';
        this.ftpStatusIcon.style.color = 'var(--warning)';
        this.ftpStatusText.textContent = 'Preparazione file...';
        this.ftpDetails.innerHTML = `<p>File: <strong>${fileName}</strong></p><p>Destinazione: <strong>${ftpHost}:${ftpPort}${ftpRemotePath}</strong></p>`;
        
        try {
            this.ftpStatusText.textContent = 'Invio FTP in corso...';
            this.ftpStatusIcon.textContent = 'sync';
            
            const response = await fetch('/api/ftp-upload', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ftpHost,
                    ftpPort,
                    ftpUser,
                    ftpPassword,
                    ftpRemotePath,
                    fileName,
                    fileContent: code
                })
            });
            
            const result = await response.json();
            
            if (result.success) {
                this.ftpStatusIcon.textContent = 'check_circle';
                this.ftpStatusIcon.style.color = 'var(--accent-primary)';
                this.ftpStatusText.textContent = 'File inviato con successo!';
                this.ftpDetails.innerHTML += `<p class="text-accent" style="margin-top: 8px;">✓ ${result.message}</p>`;
                
                // Send post-upload HTTP command if configured
                await this.sendPostUploadCommand();
            } else {
                throw new Error(result.error || 'Errore sconosciuto');
            }
        } catch (error) {
            console.error('FTP Error:', error);
            
            this.ftpStatusIcon.textContent = 'error';
            this.ftpStatusIcon.style.color = 'var(--danger)';
            this.ftpStatusText.textContent = 'Errore invio FTP';
            this.ftpDetails.innerHTML += `
                <p style="color: var(--danger); margin-top: 8px;">Errore: ${error.message}</p>
                <p style="margin-top: 8px; color: var(--text-secondary);">Il file verrà scaricato localmente.</p>
            `;
            
            // Fallback: download locally
            const blob = new Blob([code], { type: 'text/plain' });
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = fileName;
            link.click();
            URL.revokeObjectURL(link.href);
        }
    }

    async testFtpConnection() {
        const ftpHost = this.settings.ftpHost || '192.168.1.1';
        const ftpPort = this.settings.ftpPort || 21;
        const ftpUser = this.settings.ftpUser || 'anonymous';
        const ftpPassword = this.settings.ftpPassword || '';
        const ftpRemotePath = this.settings.ftpRemotePath || 'md:';
        
        const testBtn = document.getElementById('ftpTestBtn');
        const originalHTML = testBtn.innerHTML;
        testBtn.innerHTML = '<span class="material-symbols-outlined" style="font-size: 16px;">sync</span> Connessione...';
        testBtn.disabled = true;
        
        try {
            const response = await fetch('/api/ftp-test', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ftpHost, ftpPort, ftpUser, ftpPassword, ftpRemotePath })
            });
            
            const result = await response.json();
            
            if (result.success) {
                testBtn.innerHTML = '<span class="material-symbols-outlined" style="font-size: 16px;">check_circle</span> Connesso!';
                testBtn.style.color = 'var(--accent-primary)';
                setTimeout(() => {
                    testBtn.innerHTML = originalHTML;
                    testBtn.style.color = '';
                }, 3000);
            } else {
                throw new Error(result.error);
            }
        } catch (error) {
            testBtn.innerHTML = '<span class="material-symbols-outlined" style="font-size: 16px;">error</span> Errore';
            testBtn.style.color = 'var(--danger)';
            alert(`Test FTP fallito:\n${error.message}`);
            setTimeout(() => {
                testBtn.innerHTML = originalHTML;
                testBtn.style.color = '';
            }, 3000);
        } finally {
            testBtn.disabled = false;
        }
    }

    async sendPostUploadCommand() {
        const commandUrl = this.settings.postUploadCommand;
        if (!commandUrl || commandUrl.trim() === '') return;
        
        try {
            this.ftpDetails.innerHTML += `<p style="margin-top: 8px;">Invio comando: <strong>${commandUrl}</strong>...</p>`;
            
            const response = await fetch('/api/http-command', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url: commandUrl.trim() })
            });
            
            const result = await response.json();
            
            if (result.success) {
                this.ftpDetails.innerHTML += `<p class="text-accent">✓ Comando inviato</p>`;
            } else {
                this.ftpDetails.innerHTML += `<p style="color: var(--warning);">⚠ Comando fallito: ${result.error}</p>`;
            }
        } catch (error) {
            this.ftpDetails.innerHTML += `<p style="color: var(--warning);">⚠ Comando fallito: ${error.message}</p>`;
        }
    }

    // Calculate approach or exit point with offset on perpendicular axis
    calculateApproachExitPoint(basePoint, offset, axis) {
        let x = basePoint.x;
        let y = basePoint.y;
        let z = basePoint.z || 0;
        
        // Apply offset on perpendicular axis based on work plane
        switch (this.settings.workPlane) {
            case 'XY':
                z += offset; // Z is perpendicular to XY
                break;
            case 'YZ':
                x += offset; // X is perpendicular to YZ (but in canvas coords)
                break;
            case 'XZ':
                y += offset; // Y is perpendicular to XZ (but in canvas coords)
                break;
        }
        
        return { x, y, z };
    }

    generateFanucCode(name, points) {
        // Get FANUC parameters
        const config = this.settings.fanucConfig || 'N U T, 0, 0, 0';
        const W = this.settings.fanucW || -180;
        const P = this.settings.fanucP || 0;
        const R = this.settings.fanucR || 0;
        const UF = this.settings.fanucUF || 0;
        const UT = this.settings.fanucUT || 1;
        const outputEnabled = this.settings.fanucOutputEnabled || false;
        const outputId = this.settings.fanucOutputId || 1;
        
        // Helper function to check if two points are at same position
        // FANUC SPLINE: "MOTN-635 SPL: Zero move" if two consecutive points are at same position
        const samePosition = (p1, p2) => {
            if (!p1 || !p2) return false;
            const tolerance = 0.5; // 0.5mm tolerance to avoid MOTN-635 SPL: Zero move
            return Math.abs(p1.x - p2.x) < tolerance &&
                   Math.abs(p1.y - p2.y) < tolerance &&
                   Math.abs((p1.z || 0) - (p2.z || 0)) < tolerance;
        };
        
        // Filter out duplicate consecutive points and mark points that need FINE
        // (if next point was duplicate, this point needs FINE to stop precisely)
        const filteredPoints = [];
        points.forEach((point, idx) => {
            if (idx === 0) {
                filteredPoints.push({ ...point, needsFine: false });
            } else {
                const prevPoint = filteredPoints[filteredPoints.length - 1];
                if (samePosition(prevPoint, point)) {
                    // Duplicate found - mark previous point as needing FINE
                    prevPoint.needsFine = true;
                } else {
                    filteredPoints.push({ ...point, needsFine: false });
                }
            }
        });
        
        // Separate points by type and path
        const pathGroups = [];
        let currentGroup = null;
        let currentPathIndex = -1;
        let approachPoint = null;
        let exitPoint = null;
        
        filteredPoints.forEach(point => {
            if (point.type === 'approach') {
                approachPoint = point;
            } else if (point.type === 'exit') {
                exitPoint = point;
            } else if (point.type === 'path') {
                if (point.pathIndex !== currentPathIndex) {
                    currentGroup = { type: 'path', pathIndex: point.pathIndex, points: [] };
                    pathGroups.push(currentGroup);
                    currentPathIndex = point.pathIndex;
                }
                currentGroup.points.push(point);
            } else if (point.type === 'transition') {
                if (!currentGroup || currentGroup.type !== 'transition' || currentGroup.transitionIndex !== point.transitionIndex) {
                    currentGroup = { type: 'transition', transitionIndex: point.transitionIndex, points: [] };
                    pathGroups.push(currentGroup);
                }
                currentGroup.points.push(point);
            }
        });
        
        // Build motion lines (/MN section)
        let motionLines = [];
        let positionData = [];
        let pointIndex = 1;
        let lineNum = 1;
        let pathNum = 0;
        
        // Approach point - Joint move (J) with % speed
        if (approachPoint) {
            const termination = approachPoint.needsFine ? 'FINE' : 'CNT100';
            motionLines.push(`   ${lineNum}:J P[${pointIndex}] 100% ${termination}    ;`);
            positionData.push({
                idx: pointIndex,
                x: approachPoint.x,
                y: approachPoint.y,
                z: approachPoint.z
            });
            pointIndex++;
            lineNum++;
        }
        
        // Helper: calculate angle between 3 points (returns degrees 0-180)
        // 180 = straight line, 0 = full reversal
        const angleBetween = (p1, p2, p3) => {
            const v1x = p1.x - p2.x, v1y = p1.y - p2.y;
            const v2x = p3.x - p2.x, v2y = p3.y - p2.y;
            const len1 = Math.hypot(v1x, v1y);
            const len2 = Math.hypot(v2x, v2y);
            if (len1 < 0.01 || len2 < 0.01) return 180; // degenerate, treat as straight
            const dot = (v1x * v2x + v1y * v2y) / (len1 * len2);
            return Math.acos(Math.max(-1, Math.min(1, dot))) * 180 / Math.PI;
        };

        // FANUC SPLINE: split path into sub-segments at sharp corners
        // Sharp corners (angle < 60°) cause "SPL: Invalid Set of Points" errors
        // because the controller can't plan a smooth spline through cusps.
        const splitPathAtSharpCorners = (points, minAngle = 60) => {
            if (points.length < 4) return [points]; // too few points, single segment
            
            // Find split indices (sharp corner points)
            const splitIndices = [];
            for (let i = 1; i < points.length - 1; i++) {
                const angle = angleBetween(points[i - 1], points[i], points[i + 1]);
                if (angle < minAngle) {
                    splitIndices.push(i);
                }
            }
            
            if (splitIndices.length === 0) return [points]; // no sharp corners
            
            // Split into sub-segments
            const segments = [];
            let start = 0;
            for (const splitIdx of splitIndices) {
                // Include the split point in both segments (end of current, start of next)
                if (splitIdx > start) {
                    segments.push(points.slice(start, splitIdx + 1));
                }
                start = splitIdx; // next segment starts at split point
            }
            // Add remaining points
            if (start < points.length) {
                segments.push(points.slice(start));
            }
            
            return segments;
        };

        // Process path groups
        pathGroups.forEach((group, groupIdx) => {
            if (group.type === 'path') {
                pathNum++;
                
                // Split path at sharp corners to avoid "SPL: Invalid Set of Points"
                const subSegments = splitPathAtSharpCorners(group.points);
                const hasMultipleSegments = subSegments.length > 1;
                
                if (hasMultipleSegments) {
                    console.log(`ℹ️ Path ${pathNum}: split into ${subSegments.length} sub-segments at sharp corners for FANUC SPLINE compatibility.`);
                }
                
                // Add comment for path start
                motionLines.push(`   ${lineNum}:  --eg:Path ${pathNum} Start ;`);
                lineNum++;
                
                subSegments.forEach((segment, segIdx) => {
                    const isFirstSegment = (segIdx === 0);
                    const isLastSegment = (segIdx === subSegments.length - 1);
                    
                    // FANUC SPLINE requires minimum 3 consecutive S instructions (INTP-737)
                    // A segment needs at least 4 points: 1st as L + 3 as S
                    const useSpline = segment.length >= 4;
                    
                    if (!useSpline && segment.length > 1) {
                        console.warn(`⚠️ Path ${pathNum} seg ${segIdx + 1}: only ${segment.length} points, using linear (L) movements.`);
                    }
                    
                    const lastSegIdx = segment.length - 1;
                    
                    segment.forEach((point, pIdx) => {
                        const vel = Math.round(point.velocity || this.settings.defaultPathSpeed);
                        const isLastPointInSegment = (pIdx === lastSegIdx);
                        const isLastPointInPath = isLastSegment && isLastPointInSegment;
                        
                        if (pIdx === 0) {
                            // First point of segment: Linear move (L) with FINE
                            motionLines.push(`   ${lineNum}:L P[${pointIndex}] ${vel}mm/sec FINE    ;`);
                            
                            // Output ON only after first point of first segment
                            if (isFirstSegment && outputEnabled) {
                                lineNum++;
                                motionLines.push(`   ${lineNum}:  DO[${outputId}]=ON ;`);
                            }
                            
                            positionData.push({
                                idx: pointIndex,
                                x: point.x,
                                y: point.y,
                                z: point.z || 0
                            });
                            pointIndex++;
                            lineNum++;
                        } else if (useSpline) {
                            // Spline move (S) - FINE only on last point of segment
                            const termination = isLastPointInSegment ? 'FINE' : 'CNT100';
                            motionLines.push(`   ${lineNum}:S P[${pointIndex}] ${vel}mm/sec ${termination}    ;`);
                            
                            positionData.push({
                                idx: pointIndex,
                                x: point.x,
                                y: point.y,
                                z: point.z || 0
                            });
                            pointIndex++;
                            lineNum++;
                        } else {
                            // Fallback: Linear move (L)
                            const termination = isLastPointInSegment ? 'FINE' : 'CNT100';
                            motionLines.push(`   ${lineNum}:L P[${pointIndex}] ${vel}mm/sec ${termination}    ;`);
                            
                            positionData.push({
                                idx: pointIndex,
                                x: point.x,
                                y: point.y,
                                z: point.z || 0
                            });
                            pointIndex++;
                            lineNum++;
                        }
                    });
                });
                
                // Output OFF after path complete
                if (outputEnabled) {
                    motionLines.push(`   ${lineNum}:  DO[${outputId}]=OFF ;`);
                    lineNum++;
                }
                
                // Add comment for path end
                motionLines.push(`   ${lineNum}:  --eg:Path ${pathNum} End ;`);
                lineNum++;
                
            } else if (group.type === 'transition') {
                // Transition points - Linear moves (use FINE if point had duplicate removed after it)
                group.points.forEach((point, pIdx) => {
                    const vel = Math.round(point.velocity || this.settings.defaultTransitionSpeed);
                    const termination = point.needsFine ? 'FINE' : 'CNT100';
                    motionLines.push(`   ${lineNum}:L P[${pointIndex}] ${vel}mm/sec ${termination}    ;`);
                    positionData.push({
                        idx: pointIndex,
                        x: point.x,
                        y: point.y,
                        z: point.z || 0
                    });
                    pointIndex++;
                    lineNum++;
                });
            }
        });
        
        // Exit point - Joint move (J) for fast return
        if (exitPoint) {
            motionLines.push(`   ${lineNum}:J P[${pointIndex}] 100% CNT100    ;`);
            positionData.push({
                idx: pointIndex,
                x: exitPoint.x,
                y: exitPoint.y,
                z: exitPoint.z
            });
            pointIndex++;
            lineNum++;
        }
        
        // Build the complete LS file
        const now = new Date();
        const dateStr = now.toISOString().slice(2, 10).replace(/-/g, '-');
        const timeStr = now.toTimeString().slice(0, 8).replace(/:/g, ':');
        
        let code = `/PROG  ${name.toUpperCase()}
/ATTR
OWNER		= MNEDITOR;
COMMENT		= "SpLine Draw MECSPE 2026";
PROG_SIZE	= 0;
CREATE		= DATE ${dateStr}  TIME ${timeStr};
MODIFIED	= DATE ${dateStr}  TIME ${timeStr};
FILE_NAME	= ;
VERSION		= 0;
LINE_COUNT	= ${motionLines.length};
MEMORY_SIZE	= 0;
PROTECT		= READ_WRITE;
TCD:  STACK_SIZE	= 0,
      TASK_PRIORITY	= 50,
      TIME_SLICE	= 0,
      BUSY_LAMP_OFF	= 0,
      ABORT_REQUEST	= 0,
      PAUSE_REQUEST	= 0;
DEFAULT_GROUP	= 1,*,*,*,*;
CONTROL_CODE	= 00000000 00000000;
LOCAL_REGISTERS	= 0,0,0;
/MN
`;
        
        // Add motion lines
        code += motionLines.join('\n') + '\n';
        
        // Add position data
        code += '/POS\n';
        
        positionData.forEach(pos => {
            // Format numbers with proper spacing (like FANUC style)
            const xStr = pos.x.toFixed(3).padStart(10);
            const yStr = pos.y.toFixed(3).padStart(10);
            const zStr = pos.z.toFixed(3).padStart(10);
            const wStr = W.toFixed(3).padStart(10);
            const pStr = P.toFixed(3).padStart(10);
            const rStr = R.toFixed(3).padStart(10);
            
            code += `P[${pos.idx}]{
   GP1:
	UF : ${UF}, UT : ${UT},		CONFIG : '${config}',
	X =${xStr}  mm,	Y =${yStr}  mm,	Z =${zStr}  mm,
	W =${wStr} deg,	P =${pStr} deg,	R =${rStr} deg
};
`;
        });
        
        code += '/END\n';
        
        return code;
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // Animation (Smooth interpolated playback)
    // ═══════════════════════════════════════════════════════════════════════════

    buildAnimationPath() {
        // Build a continuous spline path with distance information for smooth animation
        this.animationSplinePoints = [];
        this.totalPathLength = 0;
        
        // Sample the spline at high resolution for smooth animation
        const samplesPerSegment = 50;
        
        this.paths.forEach((path, pathIndex) => {
            if (!path.visible || !path.processedPoints || path.processedPoints.length < 2) return;
            
            const points = path.processedPoints;
            const totalSamples = (points.length - 1) * samplesPerSegment;
            
            let prevPoint = null;
            
            for (let i = 0; i <= totalSamples; i++) {
                const t = i / totalSamples;
                const point = this.getSplinePoint(points, t);
                
                // Interpolate velocity
                const segmentIndex = Math.min(Math.floor(t * (points.length - 1)), points.length - 2);
                const localT = (t * (points.length - 1)) - segmentIndex;
                const v1 = points[segmentIndex].velocity || this.settings.defaultPathSpeed;
                const v2 = points[Math.min(segmentIndex + 1, points.length - 1)].velocity || this.settings.defaultPathSpeed;
                const velocity = v1 + (v2 - v1) * localT;
                
                if (prevPoint) {
                    const length = Math.hypot(point.x - prevPoint.x, point.y - prevPoint.y);
                    this.totalPathLength += length;
                }
                
                this.animationSplinePoints.push({
                    x: point.x,
                    y: point.y,
                    velocity: velocity,
                    distance: this.totalPathLength,
                    pathIndex: pathIndex
                });
                
                prevPoint = point;
            }
        });
        
        // Calculate total animation time based on velocity
        this.totalAnimationTime = 0;
        for (let i = 1; i < this.animationSplinePoints.length; i++) {
            const p1 = this.animationSplinePoints[i - 1];
            const p2 = this.animationSplinePoints[i];
            const dist = p2.distance - p1.distance;
            const avgVel = (p1.velocity + p2.velocity) / 2;
            this.totalAnimationTime += dist / avgVel;
        }
    }

    startAnimation() {
        if (this.paths.length === 0) {
            alert('Nessun percorso da animare');
            return;
        }
        
        // Build animation path
        this.buildAnimationPath();
        
        if (!this.animationSplinePoints || this.animationSplinePoints.length === 0) {
            alert('Nessun punto da animare');
            return;
        }
        
        this.isAnimating = true;
        this.isPaused = false;
        this.animationStartTime = performance.now();
        this.animationPausedTime = 0;
        this.animationProgress = 0;
        this.lastAnimationBuildTime = performance.now();
        
        this.playBtn.style.display = 'none';
        this.pauseBtn.style.display = 'flex';
        this.pauseBtn.querySelector('.material-symbols-outlined').textContent = 'pause';
        
        this.animateFrame();
    }

    // Rebuild animation path if data changed (call this when paths/velocities change)
    refreshAnimationPath() {
        if (!this.isAnimating) return;
        
        // Save current progress
        const currentProgress = this.animationProgress;
        
        // Rebuild path
        this.buildAnimationPath();
        
        // Restore progress (adjusted if path length changed significantly)
        this.animationProgress = Math.min(currentProgress, 0.999);
        this.animationStartTime = performance.now() - (this.animationProgress * this.totalAnimationTime * 1000);
    }

    pauseAnimation() {
        if (this.isPaused) {
            // Resume
            this.isPaused = false;
            this.animationStartTime = performance.now() - (this.animationProgress * this.totalAnimationTime * 1000);
            this.pauseBtn.querySelector('.material-symbols-outlined').textContent = 'pause';
            this.animateFrame();
        } else {
            // Pause
            this.isPaused = true;
            this.pauseBtn.querySelector('.material-symbols-outlined').textContent = 'play_arrow';
        }
    }

    stopAnimation() {
        this.isAnimating = false;
        this.isPaused = false;
        this.animationProgress = 0;
        this.progressSlider.value = 0;
        this.timeDisplay.textContent = '00:00';
        
        this.playBtn.style.display = 'flex';
        this.pauseBtn.style.display = 'none';
        
        this.animationCtx.clearRect(0, 0, this.canvasWidth, this.canvasHeight);
    }

    seekAnimation(progress) {
        this.animationProgress = progress;
        this.animationStartTime = performance.now() - (progress * this.totalAnimationTime * 1000);
        this.drawAnimationFrame(progress);
    }

    animateFrame() {
        if (!this.isAnimating || this.isPaused) return;
        
        const currentTime = performance.now();
        
        // Rebuild animation path every 500ms to catch changes
        if (currentTime - this.lastAnimationBuildTime > 500) {
            this.refreshAnimationPath();
            this.lastAnimationBuildTime = currentTime;
        }
        
        const elapsedTime = (currentTime - this.animationStartTime) / 1000; // in seconds
        
        this.animationProgress = this.totalAnimationTime > 0 ? elapsedTime / this.totalAnimationTime : 0;
        
        if (this.animationProgress >= 1) {
            this.animationProgress = 0;
            this.animationStartTime = performance.now();
        }
        
        this.progressSlider.value = this.animationProgress * 1000;
        this.drawAnimationFrame(this.animationProgress);
        
        requestAnimationFrame(() => this.animateFrame());
    }

    drawAnimationFrame(progress) {
        const ctx = this.animationCtx;
        ctx.clearRect(0, 0, this.canvasWidth, this.canvasHeight);
        
        if (!this.animationSplinePoints || this.animationSplinePoints.length === 0) return;
        
        // Calculate current distance along the spline
        const currentDistance = progress * this.totalPathLength;
        
        // Find current position on spline using binary search
        let currentPos = null;
        let lowIdx = 0;
        let highIdx = this.animationSplinePoints.length - 1;
        
        while (lowIdx < highIdx - 1) {
            const midIdx = Math.floor((lowIdx + highIdx) / 2);
            if (this.animationSplinePoints[midIdx].distance <= currentDistance) {
                lowIdx = midIdx;
            } else {
                highIdx = midIdx;
            }
        }
        
        // Interpolate between the two nearest points
        const p1 = this.animationSplinePoints[lowIdx];
        const p2 = this.animationSplinePoints[highIdx];
        const segmentLength = p2.distance - p1.distance;
        
        if (segmentLength > 0) {
            const t = (currentDistance - p1.distance) / segmentLength;
            currentPos = {
                x: p1.x + (p2.x - p1.x) * t,
                y: p1.y + (p2.y - p1.y) * t
            };
        } else {
            currentPos = { x: p1.x, y: p1.y };
        }
        
        const screen = this.worldToScreen(currentPos.x, currentPos.y);
        
        // Draw spline trail (fading curve behind the tool)
        this.drawSplineTrail(ctx, progress);
        
        // Draw tool indicator with glow effect
        ctx.shadowColor = '#ff00ff';
        ctx.shadowBlur = 15;
        
        ctx.beginPath();
        ctx.arc(screen.x, screen.y, 6, 0, Math.PI * 2);
        ctx.fillStyle = '#ff00ff';
        ctx.fill();
        
        ctx.shadowBlur = 0;
        
        // Outer ring
        ctx.beginPath();
        ctx.arc(screen.x, screen.y, 10, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(255, 0, 255, 0.5)';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // Pulsing outer ring
        const pulse = Math.sin(performance.now() / 200) * 0.3 + 0.7;
        ctx.beginPath();
        ctx.arc(screen.x, screen.y, 14, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(255, 0, 255, ${pulse * 0.3})`;
        ctx.lineWidth = 1;
        ctx.stroke();
        
        // Update time display
        const currentTimeSeconds = progress * this.totalAnimationTime;
        const mins = Math.floor(currentTimeSeconds / 60);
        const secs = Math.floor(currentTimeSeconds % 60);
        const totalMins = Math.floor(this.totalAnimationTime / 60);
        const totalSecs = Math.floor(this.totalAnimationTime % 60);
        
        this.timeDisplay.textContent = 
            `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')} / ${totalMins.toString().padStart(2, '0')}:${totalSecs.toString().padStart(2, '0')}`;
    }

    drawSplineTrail(ctx, progress) {
        // Draw a fading spline trail showing recent path
        if (!this.animationSplinePoints || this.animationSplinePoints.length < 2) return;
        
        const trailLength = 0.08; // 8% of total path as trail
        const startProgress = Math.max(0, progress - trailLength);
        const startDistance = startProgress * this.totalPathLength;
        const endDistance = progress * this.totalPathLength;
        
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        
        // Find points in trail range
        const trailPoints = this.animationSplinePoints.filter(p => 
            p.distance >= startDistance && p.distance <= endDistance
        );
        
        if (trailPoints.length < 2) return;
        
        // Draw trail with gradient fade
        ctx.beginPath();
        
        for (let i = 0; i < trailPoints.length; i++) {
            const point = trailPoints[i];
            const screen = this.worldToScreen(point.x, point.y);
            
            if (i === 0) {
                ctx.moveTo(screen.x, screen.y);
            } else {
                ctx.lineTo(screen.x, screen.y);
            }
        }
        
        // Create gradient for trail
        if (trailPoints.length >= 2) {
            const startScreen = this.worldToScreen(trailPoints[0].x, trailPoints[0].y);
            const endScreen = this.worldToScreen(trailPoints[trailPoints.length - 1].x, trailPoints[trailPoints.length - 1].y);
            
            const gradient = ctx.createLinearGradient(startScreen.x, startScreen.y, endScreen.x, endScreen.y);
            gradient.addColorStop(0, 'rgba(255, 0, 255, 0.1)');
            gradient.addColorStop(0.5, 'rgba(255, 0, 255, 0.5)');
            gradient.addColorStop(1, 'rgba(255, 0, 255, 1)');
            
            ctx.strokeStyle = gradient;
            ctx.lineWidth = 3;
            ctx.stroke();
        }
    }
}

// Initialize application
document.addEventListener('DOMContentLoaded', () => {
    window.app = new SpLineDrawMECSPE();
});
