/**
 * SpLine Draw Pro - Multi-Path Robot Trajectory Designer
 * Version 1.0
 * 
 * Professional application for designing brazing robot paths
 * with multi-layer support and adaptive point density
 */

class SpLineDrawPro {
    constructor() {
        console.log('🚀 SpLine Draw Pro v1.0 - Multi-Path System');
        
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
        }, 50);
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // Initialization
    // ═══════════════════════════════════════════════════════════════════════════

    initializeSettings() {
        const saved = localStorage.getItem('splineDrawProSettings');
        const defaults = {
            // Work plane
            workPlane: 'XY',
            
            // Grid
            minAxis1: -100,
            maxAxis1: 100,
            minAxis2: -100,
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
            defaultPathSpeed: 30,
            defaultTransitionSpeed: 100,
            
            // Export
            robotType: 'kuka',
            basename: 'program',
            maxProgramNum: 999,
            
            // KUKA specific
            kukaS: 2,
            kukaT: 35,
            kukaA: 0,
            kukaB: 0,
            kukaC: 0,
            kukaTool: 1,
            kukaBase: 1,
            kukaOutputEnabled: false,
            kukaOutputId: 1,
            
            // FANUC specific
            fanucConfig: 'N U T, 0, 0, 0',
            fanucW: -180,
            fanucP: 0,
            fanucR: 0,
            fanucUF: 0,
            fanucUT: 1,
            fanucOutputEnabled: false,
            fanucOutputId: 1,
            
            // Colors
            pathColor: '#666666',
            processedColor: '#00ff88',
            shapeColor: '#4a90d9'
        };
        
        this.settings = saved ? { ...defaults, ...JSON.parse(saved) } : defaults;
    }

    initializeState() {
        // Current tool
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
        
        // Program management
        this.currentProgramIndex = 1;
        this.programs = {}; // Store multiple programs
        
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
        this.importDxfBtn = document.getElementById('importDxfBtn');
        this.dxfFileInput = document.getElementById('dxfFileInput');
        this.exportBtn = document.getElementById('exportBtn');
        this.robotType = document.getElementById('robotType');
        
        // Tools
        this.toolButtons = document.querySelectorAll('.tool-btn');
        
        // Program
        this.programBasename = document.getElementById('programBasename');
        this.programIndex = document.getElementById('programIndex');
        
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
        
        // Shapes
        this.shapesTableBody = document.getElementById('shapesTableBody');
        this.clearShapesBtn = document.getElementById('clearShapesBtn');
        
        // Settings inputs
        this.settingsInputs = {
            workPlane: document.getElementById('workPlane'),
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
            robotType: document.getElementById('robotType'),
            basename: document.getElementById('basename'),
            maxProgramNum: document.getElementById('maxProgramNum'),
            pathColor: document.getElementById('pathColor'),
            processedColor: document.getElementById('processedColor'),
            shapeColor: document.getElementById('shapeColor'),
            // KUKA specific
            kukaS: document.getElementById('kukaS'),
            kukaT: document.getElementById('kukaT'),
            kukaA: document.getElementById('kukaA'),
            kukaB: document.getElementById('kukaB'),
            kukaC: document.getElementById('kukaC'),
            kukaTool: document.getElementById('kukaTool'),
            kukaBase: document.getElementById('kukaBase'),
            kukaOutputEnabled: document.getElementById('kukaOutputEnabled'),
            kukaOutputId: document.getElementById('kukaOutputId'),
            // FANUC specific
            fanucConfig: document.getElementById('fanucConfig'),
            fanucW: document.getElementById('fanucW'),
            fanucP: document.getElementById('fanucP'),
            fanucR: document.getElementById('fanucR'),
            fanucUF: document.getElementById('fanucUF'),
            fanucUT: document.getElementById('fanucUT'),
            fanucOutputEnabled: document.getElementById('fanucOutputEnabled'),
            fanucOutputId: document.getElementById('fanucOutputId')
        };
        
        // Robot-specific parameter containers
        this.kukaParams = document.getElementById('kukaParams');
        this.fanucParams = document.getElementById('fanucParams');
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
        
        // Work plane change
        this.settingsInputs.workPlane.addEventListener('change', () => this.updateAxisLabels());
        
        // Robot type change - show/hide specific params
        this.settingsInputs.robotType.addEventListener('change', () => this.updateRobotParams());
        
        // Tool selection
        this.toolButtons.forEach(btn => {
            btn.addEventListener('click', () => this.selectTool(btn.dataset.tool));
        });
        
        // File operations
        this.saveBtn.addEventListener('click', () => this.saveProject());
        this.loadBtn.addEventListener('click', () => this.fileInput.click());
        this.fileInput.addEventListener('change', (e) => this.loadProject(e));
        
        // DXF Import
        this.importDxfBtn.addEventListener('click', () => this.dxfFileInput.click());
        this.dxfFileInput.addEventListener('change', (e) => this.importDxf(e));
        
        // Export
        this.exportBtn.addEventListener('click', () => this.exportRobotCode());
        
        // Program index change
        this.programIndex.addEventListener('change', (e) => {
            this.switchProgram(parseInt(e.target.value));
        });
        
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
        
        // Shapes
        this.clearShapesBtn.addEventListener('click', () => this.clearShapes());
        
        // Clear buttons in toolbar
        const clearPathsBtn = document.getElementById('clearPathsBtn');
        if (clearPathsBtn) {
            clearPathsBtn.addEventListener('click', () => this.clearAllPaths());
        }
        
        const clearShapesBtn2 = document.getElementById('clearShapesBtn2');
        if (clearShapesBtn2) {
            clearShapesBtn2.addEventListener('click', () => this.clearShapes());
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
        [this.settingsModal, this.transitionModal].forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    modal.classList.remove('active');
                }
            });
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
        } else if (this.currentTool === 'select') {
            this.handleSelectionClick(e);
        } else if (this.currentTool === 'rectangle' || this.currentTool === 'circle') {
            this.startShapeDrawing(e, snapped);
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
        } else if (this.isDrawingShape) {
            this.updateShapePreview(snapped);
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
        } else if (this.isDrawingShape) {
            this.finishShapeDrawing();
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
            
            if (isCorner || distToLast >= minDist * 0.3) {
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
            
            // Draw raw path (dimmed) - as simple lines
            if (path.rawPoints && path.rawPoints.length >= 2) {
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
                
                // Draw control points
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
        });
        
        // Draw transitions between paths
        this.drawTransitions(ctx);
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
                
                // Draw coordinates tooltip
                ctx.font = 'bold 12px Consolas, monospace';
                ctx.textAlign = 'left';
                ctx.textBaseline = 'bottom';
                
                const text = `(${point.x.toFixed(1)}, ${point.y.toFixed(1)})`;
                const textWidth = ctx.measureText(text).width;
                
                // Background
                const tooltipX = screen.x + 18;
                const tooltipY = screen.y - 8;
                
                ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
                ctx.fillRect(tooltipX - 4, tooltipY - 14, textWidth + 8, 18);
                
                // Border
                ctx.strokeStyle = '#00ffff';
                ctx.lineWidth = 1;
                ctx.strokeRect(tooltipX - 4, tooltipY - 14, textWidth + 8, 18);
                
                // Text
                ctx.fillStyle = '#00ffff';
                ctx.fillText(text, tooltipX, tooltipY);
            }
        }
    }

    hexToRgba(hex, alpha) {
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // Shapes
    // ═══════════════════════════════════════════════════════════════════════════

    startShapeDrawing(e, point) {
        this.isDrawingShape = true;
        this.shapeStart = point;
        this.currentShape = {
            type: this.currentTool,
            x: point.x,
            y: point.y
        };
    }

    updateShapePreview(point) {
        const ctx = this.previewCtx;
        ctx.clearRect(0, 0, this.canvasWidth, this.canvasHeight);
        
        ctx.strokeStyle = this.settings.shapeColor;
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 4]);
        
        if (this.currentTool === 'rectangle') {
            const start = this.worldToScreen(this.shapeStart.x, this.shapeStart.y);
            const end = this.worldToScreen(point.x, point.y);
            const width = end.x - start.x;
            const height = end.y - start.y;
            ctx.strokeRect(start.x, start.y, width, height);
        } else if (this.currentTool === 'circle') {
            const center = this.worldToScreen(this.shapeStart.x, this.shapeStart.y);
            const radius = Math.hypot(point.x - this.shapeStart.x, point.y - this.shapeStart.y) * this.scale;
            ctx.beginPath();
            ctx.arc(center.x, center.y, radius, 0, Math.PI * 2);
            ctx.stroke();
        }
        
        ctx.setLineDash([]);
    }

    finishShapeDrawing() {
        if (!this.isDrawingShape) return;
        
        this.isDrawingShape = false;
        this.previewCtx.clearRect(0, 0, this.canvasWidth, this.canvasHeight);
        
        const world = this.screenToWorld(event.clientX, event.clientY);
        const snapped = this.snapToGrid(world.x, world.y);
        
        if (this.currentTool === 'rectangle') {
            const width = Math.abs(snapped.x - this.shapeStart.x);
            const height = Math.abs(snapped.y - this.shapeStart.y);
            
            if (width > 1 && height > 1) {
                this.shapes.push({
                    type: 'rectangle',
                    x: Math.min(this.shapeStart.x, snapped.x),
                    y: Math.min(this.shapeStart.y, snapped.y),
                    width,
                    height
                });
            }
        } else if (this.currentTool === 'circle') {
            const radius = Math.hypot(snapped.x - this.shapeStart.x, snapped.y - this.shapeStart.y);
            
            if (radius > 1) {
                this.shapes.push({
                    type: 'circle',
                    x: this.shapeStart.x,
                    y: this.shapeStart.y,
                    radius
                });
            }
        }
        
        this.redrawShapes();
        this.updateShapesTable();
    }

    clearShapes() {
        if (this.shapes.length === 0) return;
        if (confirm('Eliminare tutte le geometrie di riferimento?')) {
            this.shapes = [];
            this.redrawShapes();
            this.updateShapesTable();
        }
    }

    clearAllPaths() {
        if (this.paths.length === 0) return;
        if (confirm('Eliminare tutti i percorsi?')) {
            this.paths = [];
            this.activePathIndex = -1;
            this.updateLayersList();
            this.updatePointsTable();
            this.redrawPaths();
        }
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
        } else if (tabId === 'shapes') {
            this.updateShapesTable();
        }
    }

    updateUI() {
        this.updateLayersList();
        this.updateTransitionsList();
        this.updateProgramSelector();
        this.programBasename.textContent = this.settings.basename;
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

    updateShapesTable() {
        this.shapesTableBody.innerHTML = '';
        
        this.shapes.forEach((shape, index) => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${shape.type === 'rectangle' ? 'Rettangolo' : 'Cerchio'}</td>
                <td>${shape.x.toFixed(1)}</td>
                <td>${shape.y.toFixed(1)}</td>
                <td>${shape.type === 'rectangle' ? `${shape.width.toFixed(1)} x ${shape.height.toFixed(1)}` : `R ${shape.radius.toFixed(1)}`}</td>
                <td>
                    <button class="layer-btn" data-index="${index}" title="Elimina">
                        <span class="material-symbols-outlined">delete</span>
                    </button>
                </td>
            `;
            
            row.querySelector('.layer-btn').addEventListener('click', () => {
                this.shapes.splice(index, 1);
                this.redrawShapes();
                this.updateShapesTable();
            });
            
            this.shapesTableBody.appendChild(row);
        });
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
        
        this.updateAxisLabels();
        this.updateRobotParams();
        this.settingsModal.classList.add('active');
    }
    
    // Show/hide robot-specific parameters based on selected robot type
    updateRobotParams() {
        const robotType = this.settingsInputs.robotType.value;
        
        // Hide all robot params first
        if (this.kukaParams) {
            this.kukaParams.style.display = robotType === 'kuka' ? 'block' : 'none';
        }
        if (this.fanucParams) {
            this.fanucParams.style.display = robotType === 'fanuc' ? 'block' : 'none';
        }
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
        localStorage.setItem('splineDrawProSettings', JSON.stringify(this.settings));
        
        // Update UI
        this.programBasename.textContent = this.settings.basename;
        this.updateProgramSelector();
        
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
        
        this.settingsModal.classList.remove('active');
    }

    resetSettings() {
        if (confirm('Ripristinare le impostazioni predefinite?')) {
            localStorage.removeItem('splineDrawProSettings');
            this.initializeSettings();
            this.openSettings(); // Refresh form
            this.calculateScale();
            this.drawGrid();
            this.redrawAll();
        }
    }

    updateAxisLabels() {
        const plane = this.settingsInputs.workPlane.value;
        let axis1, axis2;
        
        switch (plane) {
            case 'XY': axis1 = 'X'; axis2 = 'Y'; break;
            case 'YZ': axis1 = 'Y'; axis2 = 'Z'; break;
            case 'XZ': axis1 = 'X'; axis2 = 'Z'; break;
        }
        
        document.getElementById('minAxis1Label').textContent = `Min ${axis1} (mm):`;
        document.getElementById('maxAxis1Label').textContent = `Max ${axis1} (mm):`;
        document.getElementById('minAxis2Label').textContent = `Min ${axis2} (mm):`;
        document.getElementById('maxAxis2Label').textContent = `Max ${axis2} (mm):`;
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // Program Management
    // ═══════════════════════════════════════════════════════════════════════════

    updateProgramSelector() {
        this.programIndex.innerHTML = '';
        for (let i = 1; i <= Math.min(this.settings.maxProgramNum, 99); i++) {
            const option = document.createElement('option');
            option.value = i;
            option.textContent = i;
            if (i === this.currentProgramIndex) option.selected = true;
            this.programIndex.appendChild(option);
        }
    }

    saveCurrentProgram() {
        this.programs[this.currentProgramIndex] = {
            paths: JSON.parse(JSON.stringify(this.paths)),
            shapes: JSON.parse(JSON.stringify(this.shapes)),
            transitions: JSON.parse(JSON.stringify(this.transitions))
        };
    }

    switchProgram(index) {
        // Save current
        this.saveCurrentProgram();
        
        // Load new
        this.currentProgramIndex = index;
        const program = this.programs[index];
        
        if (program) {
            this.paths = JSON.parse(JSON.stringify(program.paths));
            this.shapes = JSON.parse(JSON.stringify(program.shapes));
            this.transitions = JSON.parse(JSON.stringify(program.transitions));
        } else {
            this.paths = [];
            this.shapes = [];
            this.transitions = [];
        }
        
        this.activePathIndex = this.paths.length > 0 ? 0 : -1;
        this.updateUI();
        this.redrawAll();
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // Save / Load Project
    // ═══════════════════════════════════════════════════════════════════════════

    saveProject() {
        this.saveCurrentProgram();
        
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
        const fileName = `${this.settings.basename}_${timestamp}`;
        
        const projectData = {
            version: '3.0',
            timestamp: new Date().toISOString(),
            projectName: this.settings.basename,
            currentProgramIndex: this.currentProgramIndex,
            settings: this.settings,
            programs: this.programs
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
                    localStorage.setItem('splineDrawProSettings', JSON.stringify(this.settings));
                }
                
                // Load programs (v3.0 format)
                if (data.version === '3.0' && data.programs) {
                    this.programs = data.programs;
                    this.currentProgramIndex = data.currentProgramIndex || 1;
                    
                    const program = this.programs[this.currentProgramIndex];
                    if (program) {
                        this.paths = program.paths || [];
                        this.shapes = program.shapes || [];
                        this.transitions = program.transitions || [];
                    }
                }
                // Legacy support (v2.0)
                else if (data.version === '2.0' && data.programPaths) {
                    Object.entries(data.programPaths).forEach(([idx, program]) => {
                        this.programs[idx] = {
                            paths: program.splinePoints ? [{
                                id: Date.now(),
                                name: 'Percorso 1',
                                rawPoints: [],
                                processedPoints: program.splinePoints,
                                color: this.layerColors[0],
                                visible: true,
                                locked: false,
                                velocity: this.settings.defaultPathSpeed
                            }] : [],
                            shapes: program.shapes || [],
                            transitions: []
                        };
                    });
                    this.currentProgramIndex = data.currentProgramIndex || 1;
                    const program = this.programs[this.currentProgramIndex];
                    if (program) {
                        this.paths = program.paths;
                        this.shapes = program.shapes;
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
    // DXF Import
    // ═══════════════════════════════════════════════════════════════════════════

    importDxf(event) {
        const file = event.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const dxfContent = e.target.result;
                const entities = this.parseDxf(dxfContent);
                
                if (entities.length === 0) {
                    alert('Nessuna entità trovata nel file DXF');
                    return;
                }
                
                // Get bounding box of all entities
                const bounds = this.getDxfBounds(entities);
                
                // Calculate scale and offset to fit in grid area with margin
                const gridWidth = this.settings.maxAxis1 - this.settings.minAxis1;
                const gridHeight = this.settings.maxAxis2 - this.settings.minAxis2;
                const dxfWidth = bounds.maxX - bounds.minX;
                const dxfHeight = bounds.maxY - bounds.minY;
                
                // Scale to fit with 10% margin
                const margin = 0.1;
                const scaleX = (gridWidth * (1 - margin * 2)) / dxfWidth;
                const scaleY = (gridHeight * (1 - margin * 2)) / dxfHeight;
                const scale = Math.min(scaleX, scaleY);
                
                // Calculate offset to center
                const centerDxfX = (bounds.minX + bounds.maxX) / 2;
                const centerDxfY = (bounds.minY + bounds.maxY) / 2;
                const centerGridX = (this.settings.minAxis1 + this.settings.maxAxis1) / 2;
                const centerGridY = (this.settings.minAxis2 + this.settings.maxAxis2) / 2;
                
                // Transform and create paths from entities
                const transformPoint = (x, y) => ({
                    x: centerGridX + (x - centerDxfX) * scale,
                    y: centerGridY + (y - centerDxfY) * scale
                });
                
                // Group entities into paths
                let pathsCreated = 0;
                
                entities.forEach(entity => {
                    let points = [];
                    
                    if (entity.type === 'LINE') {
                        const start = transformPoint(entity.start.x, entity.start.y);
                        const end = transformPoint(entity.end.x, entity.end.y);
                        points = [start, end];
                    }
                    else if (entity.type === 'POLYLINE' || entity.type === 'LWPOLYLINE') {
                        points = entity.vertices.map(v => transformPoint(v.x, v.y));
                        // Close polyline if needed
                        if (entity.closed && points.length > 2) {
                            points.push({ ...points[0] });
                        }
                    }
                    else if (entity.type === 'CIRCLE') {
                        const center = transformPoint(entity.center.x, entity.center.y);
                        const radius = entity.radius * scale;
                        // Approximate circle with points
                        const segments = Math.max(24, Math.round(radius * 2));
                        for (let i = 0; i <= segments; i++) {
                            const angle = (i / segments) * Math.PI * 2;
                            points.push({
                                x: center.x + Math.cos(angle) * radius,
                                y: center.y + Math.sin(angle) * radius
                            });
                        }
                    }
                    else if (entity.type === 'ARC') {
                        const center = transformPoint(entity.center.x, entity.center.y);
                        const radius = entity.radius * scale;
                        const startAngle = entity.startAngle * Math.PI / 180;
                        const endAngle = entity.endAngle * Math.PI / 180;
                        // Calculate arc length in degrees
                        let angleDiff = endAngle - startAngle;
                        if (angleDiff < 0) angleDiff += Math.PI * 2;
                        const segments = Math.max(8, Math.round(angleDiff / (Math.PI / 12)));
                        for (let i = 0; i <= segments; i++) {
                            const angle = startAngle + (i / segments) * angleDiff;
                            points.push({
                                x: center.x + Math.cos(angle) * radius,
                                y: center.y + Math.sin(angle) * radius
                            });
                        }
                    }
                    else if (entity.type === 'ELLIPSE') {
                        const center = transformPoint(entity.center.x, entity.center.y);
                        const majorLen = Math.hypot(entity.majorAxis.x, entity.majorAxis.y) * scale;
                        const minorLen = majorLen * entity.ratio;
                        const rotation = Math.atan2(entity.majorAxis.y, entity.majorAxis.x);
                        const startParam = entity.startParam || 0;
                        const endParam = entity.endParam || Math.PI * 2;
                        let paramDiff = endParam - startParam;
                        if (paramDiff <= 0) paramDiff += Math.PI * 2;
                        const segments = Math.max(24, Math.round(paramDiff * 12));
                        for (let i = 0; i <= segments; i++) {
                            const param = startParam + (i / segments) * paramDiff;
                            // Parametric ellipse
                            const ex = majorLen * Math.cos(param);
                            const ey = minorLen * Math.sin(param);
                            // Rotate by ellipse rotation
                            const rx = ex * Math.cos(rotation) - ey * Math.sin(rotation);
                            const ry = ex * Math.sin(rotation) + ey * Math.cos(rotation);
                            points.push({
                                x: center.x + rx,
                                y: center.y + ry
                            });
                        }
                    }
                    else if (entity.type === 'SPLINE') {
                        // Approximate spline with control points
                        if (entity.controlPoints && entity.controlPoints.length > 0) {
                            points = entity.controlPoints.map(v => transformPoint(v.x, v.y));
                        } else if (entity.fitPoints && entity.fitPoints.length > 0) {
                            points = entity.fitPoints.map(v => transformPoint(v.x, v.y));
                        }
                    }
                    
                    // Create path if we have enough points
                    if (points.length >= 2) {
                        // Add velocity to points
                        const processedPoints = points.map(p => ({
                            x: p.x,
                            y: p.y,
                            velocity: this.settings.defaultPathSpeed
                        }));
                        
                        const newPath = {
                            id: Date.now() + pathsCreated,
                            name: `DXF ${entity.type} ${pathsCreated + 1}`,
                            rawPoints: [...processedPoints],
                            processedPoints: processedPoints,
                            color: this.layerColors[(this.paths.length + pathsCreated) % this.layerColors.length],
                            visible: true,
                            locked: false,
                            velocity: this.settings.defaultPathSpeed
                        };
                        
                        this.paths.push(newPath);
                        pathsCreated++;
                    }
                });
                
                if (pathsCreated > 0) {
                    this.activePathIndex = this.paths.length - 1;
                    this.transitions = []; // Reset transitions
                    
                    this.updateLayersList();
                    this.updatePointsTable();
                    this.updateTransitionsList();
                    this.redrawPaths();
                    
                    alert(`Importati ${pathsCreated} percorsi dal file DXF`);
                } else {
                    alert('Nessun percorso creato dal file DXF');
                }
                
            } catch (error) {
                console.error('Errore DXF:', error);
                alert('Errore nell\'importazione del DXF: ' + error.message);
            }
        };
        
        reader.readAsText(file);
        event.target.value = '';
    }

    parseDxf(content) {
        const entities = [];
        const lines = content.split(/\r?\n/);
        let i = 0;
        
        console.log('DXF Parser: Totale linee:', lines.length);
        
        // Helper to get next group code/value pair
        const nextPair = () => {
            if (i >= lines.length - 1) return null;
            const code = parseInt(lines[i].trim());
            const value = lines[i + 1] ? lines[i + 1].trim() : '';
            i += 2;
            return { code, value };
        };
        
        // Helper to peek current pair without advancing
        const peekPair = () => {
            if (i >= lines.length - 1) return null;
            const code = parseInt(lines[i].trim());
            const value = lines[i + 1] ? lines[i + 1].trim() : '';
            return { code, value };
        };
        
        // Find ENTITIES section - search for "ENTITIES" as section name
        let foundEntities = false;
        while (i < lines.length - 1) {
            const line = lines[i].trim();
            const nextLine = lines[i + 1] ? lines[i + 1].trim() : '';
            
            // Look for SECTION followed by ENTITIES
            if (line === '0' && nextLine === 'SECTION') {
                i += 2;
                // Check if next pair is (2, ENTITIES)
                const pair = peekPair();
                if (pair && pair.code === 2 && pair.value === 'ENTITIES') {
                    i += 2; // Skip past the ENTITIES name
                    foundEntities = true;
                    console.log('DXF Parser: Trovata sezione ENTITIES alla linea', i);
                    break;
                }
            } else {
                i++;
            }
        }
        
        if (!foundEntities) {
            console.log('DXF Parser: Sezione ENTITIES non trovata, cerco entità direttamente...');
            
            // Debug: mostra alcune linee del file per capire il formato
            console.log('DXF Parser: Prime 20 linee del file:');
            for (let j = 0; j < Math.min(40, lines.length); j++) {
                console.log(`  ${j}: "${lines[j]}"`);
            }
            
            // Cerca tutte le occorrenze di "0" seguito da tipo entità
            i = 0;
            const entityTypes = ['LINE', 'CIRCLE', 'ARC', 'POLYLINE', 'LWPOLYLINE', 'SPLINE', 'ELLIPSE', 
                                 'POINT', 'SOLID', '3DFACE', 'TEXT', 'MTEXT', 'INSERT', 'HATCH', 
                                 'DIMENSION', 'LEADER', 'TRACE', '3DSOLID', 'REGION', 'BODY'];
            
            while (i < lines.length - 1) {
                const line = lines[i].trim();
                const nextLine = lines[i + 1] ? lines[i + 1].trim() : '';
                
                // Cerca "0" seguito da un tipo di entità noto
                if (line === '0' && entityTypes.includes(nextLine)) {
                    console.log('DXF Parser: Trovata prima entità', nextLine, 'alla linea', i);
                    foundEntities = true;
                    break;
                }
                
                // Cerca anche "ENTITIES" come valore su una linea (alcuni formati)
                if (nextLine === 'ENTITIES' || line === 'ENTITIES') {
                    console.log('DXF Parser: Trovato ENTITIES alla linea', i);
                    // Cerca la prossima entità
                    i++;
                    continue;
                }
                
                i++;
            }
        }
        
        if (!foundEntities) {
            console.log('DXF Parser: Nessuna entità trovata nel file');
            
            // Ultimo tentativo: cerca qualsiasi coordinata nel file
            console.log('DXF Parser: Cerco coordinate nel file...');
            let foundCoords = false;
            for (let j = 0; j < lines.length - 1; j++) {
                const code = parseInt(lines[j].trim());
                if (code === 10 || code === 11) {
                    console.log(`DXF Parser: Trovato codice coordinata ${code} alla linea ${j}: ${lines[j+1]}`);
                    foundCoords = true;
                    if (foundCoords) break;
                }
            }
            
            return entities;
        }
        
        // Parse entities
        let currentEntity = null;
        let vertexList = [];
        let controlPoints = [];
        let fitPoints = [];
        
        while (i < lines.length - 1) {
            const pair = nextPair();
            if (!pair) break;
            
            // End of ENTITIES section
            if (pair.code === 0 && pair.value === 'ENDSEC') {
                console.log('DXF Parser: Fine sezione ENTITIES');
                break;
            }
            if (pair.code === 0 && pair.value === 'EOF') {
                console.log('DXF Parser: Fine file');
                break;
            }
            
            // New entity
            if (pair.code === 0) {
                // Save previous entity
                if (currentEntity) {
                    if (currentEntity.type === 'POLYLINE' || currentEntity.type === 'LWPOLYLINE') {
                        currentEntity.vertices = [...vertexList];
                    }
                    if (currentEntity.type === 'SPLINE') {
                        currentEntity.controlPoints = [...controlPoints];
                        currentEntity.fitPoints = [...fitPoints];
                    }
                    if (this.isValidEntity(currentEntity)) {
                        entities.push(currentEntity);
                        console.log('DXF Parser: Salvata entità', currentEntity.type);
                    }
                }
                
                vertexList = [];
                controlPoints = [];
                fitPoints = [];
                
                // Start new entity
                if (pair.value === 'LINE') {
                    currentEntity = { type: 'LINE', start: { x: 0, y: 0 }, end: { x: 0, y: 0 } };
                }
                else if (pair.value === 'POLYLINE') {
                    currentEntity = { type: 'POLYLINE', vertices: [], closed: false };
                }
                else if (pair.value === 'LWPOLYLINE') {
                    currentEntity = { type: 'LWPOLYLINE', vertices: [], closed: false };
                }
                else if (pair.value === 'CIRCLE') {
                    currentEntity = { type: 'CIRCLE', center: { x: 0, y: 0 }, radius: 0 };
                }
                else if (pair.value === 'ARC') {
                    currentEntity = { type: 'ARC', center: { x: 0, y: 0 }, radius: 0, startAngle: 0, endAngle: 360 };
                }
                else if (pair.value === 'SPLINE') {
                    currentEntity = { type: 'SPLINE', controlPoints: [], fitPoints: [], closed: false };
                }
                else if (pair.value === 'ELLIPSE') {
                    currentEntity = { type: 'ELLIPSE', center: { x: 0, y: 0 }, majorAxis: { x: 0, y: 0 }, ratio: 1, startParam: 0, endParam: Math.PI * 2 };
                }
                else if (pair.value === 'VERTEX') {
                    // Part of POLYLINE - add new vertex
                    vertexList.push({ x: 0, y: 0 });
                }
                else if (pair.value === 'SEQEND') {
                    // End of POLYLINE vertices - don't reset currentEntity
                    continue;
                }
                else {
                    // Unknown entity type - keep currentEntity for VERTEX handling
                    if (pair.value !== 'VERTEX' && pair.value !== 'SEQEND') {
                        currentEntity = null;
                    }
                }
                continue;
            }
            
            // Parse entity properties
            if (!currentEntity) continue;
            
            // LINE
            if (currentEntity.type === 'LINE') {
                if (pair.code === 10) currentEntity.start.x = parseFloat(pair.value);
                if (pair.code === 20) currentEntity.start.y = parseFloat(pair.value);
                if (pair.code === 11) currentEntity.end.x = parseFloat(pair.value);
                if (pair.code === 21) currentEntity.end.y = parseFloat(pair.value);
            }
            // CIRCLE
            else if (currentEntity.type === 'CIRCLE') {
                if (pair.code === 10) currentEntity.center.x = parseFloat(pair.value);
                if (pair.code === 20) currentEntity.center.y = parseFloat(pair.value);
                if (pair.code === 40) currentEntity.radius = parseFloat(pair.value);
            }
            // ARC
            else if (currentEntity.type === 'ARC') {
                if (pair.code === 10) currentEntity.center.x = parseFloat(pair.value);
                if (pair.code === 20) currentEntity.center.y = parseFloat(pair.value);
                if (pair.code === 40) currentEntity.radius = parseFloat(pair.value);
                if (pair.code === 50) currentEntity.startAngle = parseFloat(pair.value);
                if (pair.code === 51) currentEntity.endAngle = parseFloat(pair.value);
            }
            // ELLIPSE
            else if (currentEntity.type === 'ELLIPSE') {
                if (pair.code === 10) currentEntity.center.x = parseFloat(pair.value);
                if (pair.code === 20) currentEntity.center.y = parseFloat(pair.value);
                if (pair.code === 11) currentEntity.majorAxis.x = parseFloat(pair.value);
                if (pair.code === 21) currentEntity.majorAxis.y = parseFloat(pair.value);
                if (pair.code === 40) currentEntity.ratio = parseFloat(pair.value);
                if (pair.code === 41) currentEntity.startParam = parseFloat(pair.value);
                if (pair.code === 42) currentEntity.endParam = parseFloat(pair.value);
            }
            // LWPOLYLINE
            else if (currentEntity.type === 'LWPOLYLINE') {
                if (pair.code === 70) currentEntity.closed = (parseInt(pair.value) & 1) !== 0;
                if (pair.code === 10) {
                    vertexList.push({ x: parseFloat(pair.value), y: 0 });
                }
                if (pair.code === 20 && vertexList.length > 0) {
                    vertexList[vertexList.length - 1].y = parseFloat(pair.value);
                }
            }
            // POLYLINE
            else if (currentEntity.type === 'POLYLINE') {
                if (pair.code === 70) currentEntity.closed = (parseInt(pair.value) & 1) !== 0;
            }
            // SPLINE
            else if (currentEntity.type === 'SPLINE') {
                if (pair.code === 70) currentEntity.closed = (parseInt(pair.value) & 1) !== 0;
                if (pair.code === 10) controlPoints.push({ x: parseFloat(pair.value), y: 0 });
                if (pair.code === 20 && controlPoints.length > 0) {
                    controlPoints[controlPoints.length - 1].y = parseFloat(pair.value);
                }
                if (pair.code === 11) fitPoints.push({ x: parseFloat(pair.value), y: 0 });
                if (pair.code === 21 && fitPoints.length > 0) {
                    fitPoints[fitPoints.length - 1].y = parseFloat(pair.value);
                }
            }
            
            // VERTEX coordinates (for POLYLINE)
            if (vertexList.length > 0) {
                const lastVertex = vertexList[vertexList.length - 1];
                if (pair.code === 10) lastVertex.x = parseFloat(pair.value);
                if (pair.code === 20) lastVertex.y = parseFloat(pair.value);
            }
        }
        
        // Don't forget last entity
        if (currentEntity) {
            if (currentEntity.type === 'POLYLINE' || currentEntity.type === 'LWPOLYLINE') {
                currentEntity.vertices = [...vertexList];
            }
            if (currentEntity.type === 'SPLINE') {
                currentEntity.controlPoints = [...controlPoints];
                currentEntity.fitPoints = [...fitPoints];
            }
            if (this.isValidEntity(currentEntity)) {
                entities.push(currentEntity);
                console.log('DXF Parser: Salvata ultima entità', currentEntity.type);
            }
        }
        
        console.log('DXF Parser: Totale entità trovate:', entities.length);
        return entities;
    }

    isValidEntity(entity) {
        if (!entity) return false;
        
        if (entity.type === 'LINE') {
            return entity.start.x !== undefined && entity.start.y !== undefined &&
                   entity.end.x !== undefined && entity.end.y !== undefined;
        }
        if (entity.type === 'CIRCLE' || entity.type === 'ARC') {
            return entity.center.x !== undefined && entity.center.y !== undefined && entity.radius > 0;
        }
        if (entity.type === 'ELLIPSE') {
            return entity.center.x !== undefined && entity.center.y !== undefined &&
                   (entity.majorAxis.x !== 0 || entity.majorAxis.y !== 0);
        }
        if (entity.type === 'POLYLINE' || entity.type === 'LWPOLYLINE') {
            return entity.vertices && entity.vertices.length >= 2;
        }
        if (entity.type === 'SPLINE') {
            return (entity.controlPoints && entity.controlPoints.length >= 2) ||
                   (entity.fitPoints && entity.fitPoints.length >= 2);
        }
        return false;
    }

    getDxfBounds(entities) {
        let minX = Infinity, minY = Infinity;
        let maxX = -Infinity, maxY = -Infinity;
        
        const updateBounds = (x, y) => {
            minX = Math.min(minX, x);
            minY = Math.min(minY, y);
            maxX = Math.max(maxX, x);
            maxY = Math.max(maxY, y);
        };
        
        entities.forEach(entity => {
            if (entity.type === 'LINE') {
                updateBounds(entity.start.x, entity.start.y);
                updateBounds(entity.end.x, entity.end.y);
            }
            else if (entity.type === 'CIRCLE') {
                updateBounds(entity.center.x - entity.radius, entity.center.y - entity.radius);
                updateBounds(entity.center.x + entity.radius, entity.center.y + entity.radius);
            }
            else if (entity.type === 'ARC') {
                // Simplified: use full circle bounds
                updateBounds(entity.center.x - entity.radius, entity.center.y - entity.radius);
                updateBounds(entity.center.x + entity.radius, entity.center.y + entity.radius);
            }
            else if (entity.type === 'ELLIPSE') {
                const majorLen = Math.hypot(entity.majorAxis.x, entity.majorAxis.y);
                const minorLen = majorLen * entity.ratio;
                const maxR = Math.max(majorLen, minorLen);
                updateBounds(entity.center.x - maxR, entity.center.y - maxR);
                updateBounds(entity.center.x + maxR, entity.center.y + maxR);
            }
            else if (entity.type === 'POLYLINE' || entity.type === 'LWPOLYLINE') {
                entity.vertices.forEach(v => updateBounds(v.x, v.y));
            }
            else if (entity.type === 'SPLINE') {
                if (entity.controlPoints) {
                    entity.controlPoints.forEach(v => updateBounds(v.x, v.y));
                }
                if (entity.fitPoints) {
                    entity.fitPoints.forEach(v => updateBounds(v.x, v.y));
                }
            }
        });
        
        // Handle case where no valid bounds found
        if (minX === Infinity) {
            minX = minY = 0;
            maxX = maxY = 100;
        }
        
        return { minX, minY, maxX, maxY };
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // Export Robot Code
    // ═══════════════════════════════════════════════════════════════════════════

    exportRobotCode() {
        const robotType = this.settings.robotType;
        
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
                
                // Find the transition between these two visible paths
                // Transitions are indexed by position (transition[i] connects path[i] to path[i+1])
                const transitionIndex = prevPathIndex; // Transition index = from path index
                const transition = this.transitions[transitionIndex];
                
                if (transition && prevPath.processedPoints && path.processedPoints) {
                    // Calculate actual world coordinates for transition points
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
                // Skip points outside the grid boundaries
                if (point.x < this.settings.minAxis1 || point.x > this.settings.maxAxis1 ||
                    point.y < this.settings.minAxis2 || point.y > this.settings.maxAxis2) {
                    return; // Skip this point
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
            alert('Nessun punto da esportare');
            return;
        }
        
        let code = '';
        const programName = `${this.settings.basename}${this.currentProgramIndex}`;
        
        switch (robotType) {
            case 'kuka':
                code = this.generateKukaCode(programName, allPoints);
                break;
            case 'fanuc':
                code = this.generateFanucCode(programName, allPoints);
                break;
            case 'abb':
                code = this.generateAbbCode(programName, allPoints);
                break;
            case 'yaskawa':
                code = this.generateYaskawaCode(programName, allPoints);
                break;
        }
        
        // Download
        const blob = new Blob([code], { type: 'text/plain' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        
        // Set file extension based on robot type
        let extension = '.src'; // default KUKA
        if (robotType === 'fanuc') extension = '.ls';
        else if (robotType === 'abb') extension = '.mod';
        else if (robotType === 'yaskawa') extension = '.jbi';
        
        link.download = `${programName}${extension}`;
        link.click();
        URL.revokeObjectURL(link.href);
    }

    generateKukaCode(name, points) {
        const axes = this.getAxisLabels();
        
        // Get KUKA parameters
        const kukaS = this.settings.kukaS || 2;
        const kukaT = this.settings.kukaT || 35;
        const kukaA = this.settings.kukaA || 0;
        const kukaB = this.settings.kukaB || 0;
        const kukaC = this.settings.kukaC || 0;
        const outputEnabled = this.settings.kukaOutputEnabled || false;
        const outputId = this.settings.kukaOutputId || 1;
        
        // Helper to format E6POS
        const formatE6POS = (coords) => {
            return `{X ${coords.x.toFixed(3)}, Y ${coords.y.toFixed(3)}, Z ${coords.z.toFixed(3)}, A ${kukaA.toFixed(1)}, B ${kukaB.toFixed(1)}, C ${kukaC.toFixed(1)}, S ${kukaS}, T ${kukaT}}`;
        };
        
        // Separate points by type and path
        const pathGroups = [];
        let currentGroup = null;
        let currentPathIndex = -1;
        let approachPoint = null;
        let exitPoint = null;
        
        points.forEach(point => {
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
                // Transitions go into their own group
                if (!currentGroup || currentGroup.type !== 'transition' || currentGroup.transitionIndex !== point.transitionIndex) {
                    currentGroup = { type: 'transition', transitionIndex: point.transitionIndex, points: [] };
                    pathGroups.push(currentGroup);
                }
                currentGroup.points.push(point);
            }
        });
        
        // Count total points for declarations
        let totalPathPoints = 0;
        let totalTransitionPoints = 0;
        pathGroups.forEach(g => {
            if (g.type === 'path') totalPathPoints += g.points.length;
            else totalTransitionPoints += g.points.length;
        });
        
        let code = `DEF ${name}()\n`;
        code += `    ; Generated by SpLine Draw Pro\n`;
        code += `    ; ${new Date().toISOString()}\n`;
        code += `    ; Work Plane: ${this.settings.workPlane}\n`;
        code += `    ; Path points: ${totalPathPoints}\n`;
        code += `    ; Transition points: ${totalTransitionPoints}\n`;
        code += `    ; Approach point: ${approachPoint ? 'Yes' : 'No'}\n`;
        code += `    ; Exit point: ${exitPoint ? 'Yes' : 'No'}\n`;
        if (outputEnabled) {
            code += `    ; Output $OUT[${outputId}] enabled for path start/end\n`;
        }
        code += `\n`;
        
        // Declarations
        if (totalPathPoints > 0) {
            code += `    DECL E6POS SP[${totalPathPoints}]    ; Spline path points\n`;
            code += `    DECL REAL SPVEL[${totalPathPoints}]  ; Spline velocities\n`;
        }
        if (totalTransitionPoints > 0) {
            code += `    DECL E6POS TP[${totalTransitionPoints}]    ; Transition points\n`;
            code += `    DECL REAL TPVEL[${totalTransitionPoints}]  ; Transition velocities\n`;
        }
        if (approachPoint) {
            code += `    DECL E6POS AP    ; Approach point\n`;
            code += `    DECL REAL APVEL  ; Approach velocity\n`;
        }
        if (exitPoint) {
            code += `    DECL E6POS EP    ; Exit point\n`;
            code += `    DECL REAL EPVEL  ; Exit velocity\n`;
        }
        code += `\n`;
        
        // Define approach point
        if (approachPoint) {
            const coords = this.pointToKukaCoords(approachPoint);
            code += `    ; --- Approach point ---\n`;
            code += `    AP = ${formatE6POS(coords)}\n`;
            code += `    APVEL = ${((approachPoint.velocity || this.settings.defaultTransitionSpeed) / 1000).toFixed(3)}\n\n`;
        }
        
        // Define exit point
        if (exitPoint) {
            const coords = this.pointToKukaCoords(exitPoint);
            code += `    ; --- Exit point ---\n`;
            code += `    EP = ${formatE6POS(coords)}\n`;
            code += `    EPVEL = ${((exitPoint.velocity || this.settings.defaultTransitionSpeed) / 1000).toFixed(3)}\n\n`;
        }
        
        // Define path points
        let spIdx = 1;
        let tpIdx = 1;
        
        pathGroups.forEach(group => {
            if (group.type === 'path') {
                code += `    ; --- Path ${group.pathIndex + 1} points ---\n`;
                group.points.forEach(point => {
                    const coords = this.pointToKukaCoords(point);
                    code += `    SP[${spIdx}] = ${formatE6POS(coords)}\n`;
                    code += `    SPVEL[${spIdx}] = ${((point.velocity || this.settings.defaultPathSpeed) / 1000).toFixed(3)}\n`;
                    point._spIdx = spIdx;
                    spIdx++;
                });
                code += `\n`;
            } else {
                code += `    ; --- Transition ${group.transitionIndex + 1} points ---\n`;
                group.points.forEach(point => {
                    const coords = this.pointToKukaCoords(point);
                    code += `    TP[${tpIdx}] = ${formatE6POS(coords)}\n`;
                    code += `    TPVEL[${tpIdx}] = ${((point.velocity || this.settings.defaultTransitionSpeed) / 1000).toFixed(3)}\n`;
                    point._tpIdx = tpIdx;
                    tpIdx++;
                });
                code += `\n`;
            }
        });
        
        // Movement sequence
        code += `    ; ========================================\n`;
        code += `    ; Movement Sequence\n`;
        code += `    ; ========================================\n\n`;
        
        // Set TOOL and BASE
        const kukaTool = this.settings.kukaTool || 1;
        const kukaBase = this.settings.kukaBase || 1;
        code += `    ; Tool and Base setup\n`;
        code += `    $TOOL = TOOL_DATA[${kukaTool}]\n`;
        code += `    $BASE = BASE_DATA[${kukaBase}]\n\n`;
        
        // Approach movement (PTP to approach point, then SLIN to first path point)
        if (approachPoint) {
            code += `    ; Approach sequence\n`;
            code += `    PTP AP    ; Move to approach point (PTP)\n`;
        }
        
        let isFirstPath = true;
        
        pathGroups.forEach((group, groupIndex) => {
            if (group.type === 'path') {
                const pathNum = group.pathIndex + 1;
                
                if (isFirstPath) {
                    // Move to first point of first path
                    if (approachPoint) {
                        // SLIN from approach point to first path point
                        code += `    SLIN SP[${group.points[0]._spIdx}] WITH $VEL.CP = APVEL    ; Enter path\n\n`;
                    } else {
                        // PTP to first point if no approach point
                        code += `    ; Approach Path ${pathNum}\n`;
                        code += `    PTP SP[${group.points[0]._spIdx}]\n\n`;
                    }
                    isFirstPath = false;
                }
                
                // Output ON before SPLINE (if enabled)
                if (outputEnabled) {
                    code += `    ; Output ON - Path ${pathNum}\n`;
                    code += `    WAIT SEC 0.0\n`;
                    code += `    $OUT[${outputId}] = TRUE\n\n`;
                }
                
                // Spline block for this path
                code += `    ; Path ${pathNum} - SPLINE\n`;
                code += `    SPLINE\n`;
                
                group.points.forEach(point => {
                    code += `        SPL SP[${point._spIdx}] WITH $VEL.CP = SPVEL[${point._spIdx}]\n`;
                });
                
                code += `    ENDSPLINE\n`;
                
                // Output OFF after ENDSPLINE (if enabled)
                if (outputEnabled) {
                    code += `\n    ; Output OFF - Path ${pathNum}\n`;
                    code += `    WAIT SEC 0.0\n`;
                    code += `    $OUT[${outputId}] = FALSE\n`;
                }
                
                code += `\n`;
                
            } else {
                // Transition - use SLIN without blending
                const transNum = group.transitionIndex + 1;
                code += `    ; Transition ${transNum} - SLIN (no blending)\n`;
                
                group.points.forEach(point => {
                    code += `    SLIN TP[${point._tpIdx}] WITH $VEL.CP = TPVEL[${point._tpIdx}]\n`;
                });
                
                code += `\n`;
            }
        });
        
        // Exit movement (SLIN to exit point)
        if (exitPoint) {
            code += `    ; Exit sequence\n`;
            code += `    SLIN EP WITH $VEL.CP = EPVEL    ; Exit from last path\n\n`;
        }
        
        code += `END\n`;
        
        return code;
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

    // Convert point to KUKA coordinates based on work plane
    pointToKukaCoords(point) {
        let x, y, z;
        
        switch (this.settings.workPlane) {
            case 'XY':
                x = point.x;
                y = point.y;
                z = point.z || 0;
                break;
            case 'YZ':
                x = point.z || 0;
                y = point.x;
                z = point.y;
                break;
            case 'XZ':
                x = point.x;
                y = point.z || 0;
                z = point.y;
                break;
            default:
                x = point.x;
                y = point.y;
                z = point.z || 0;
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
        const samePosition = (p1, p2) => {
            if (!p1 || !p2) return false;
            const tolerance = 0.001; // 1 micron tolerance
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
        
        // Process path groups
        pathGroups.forEach((group, groupIdx) => {
            if (group.type === 'path') {
                pathNum++;
                
                // Add comment for path start
                motionLines.push(`   ${lineNum}:  --eg:Path ${pathNum} Start ;`);
                lineNum++;
                
                const lastPathIdx = group.points.length - 1;
                
                group.points.forEach((point, pIdx) => {
                    const vel = Math.round(point.velocity || this.settings.defaultPathSpeed);
                    const isLastPoint = (pIdx === lastPathIdx);
                    
                    if (pIdx === 0) {
                        // First point of path: Linear move (L) with FINE to position at start
                        motionLines.push(`   ${lineNum}:L P[${pointIndex}] ${vel}mm/sec FINE    ;`);
                        
                        // Output ON after reaching first point (before starting spline)
                        if (outputEnabled) {
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
                    } else {
                        // Subsequent points: Spline move (S)
                        // Use FINE for last point or if duplicate was removed, otherwise CNT100
                        const termination = (isLastPoint || point.needsFine) ? 'FINE' : 'CNT100';
                        motionLines.push(`   ${lineNum}:S P[${pointIndex}] ${vel}mm/sec ${termination}    ;`);
                        
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
COMMENT		= "SpLine Draw Pro";
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

    generateAbbCode(name, points) {
        return `! ABB RAPID export - Coming soon\n! ${name}`;
    }

    generateYaskawaCode(name, points) {
        return `; YASKAWA export - Coming soon\n; ${name}`;
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
    window.app = new SpLineDrawPro();
});
