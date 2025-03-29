import { Scene } from "phaser";
import { Button } from "../ui/components/Button";
import { GridSystem } from "../systems/GridSystem";
import { ResourceSystem } from "../systems/ResourceSystem";
import { UnitSystem } from "../systems/UnitSystem";
import { FogOfWarSystem } from "../systems/FogOfWarSystem";
import { TestPanel } from "../ui/components/TestPanel";
import { CountdownTimer } from "../ui/components/CountdownTimer";
import { UNIT_TYPES, UNIT_CONFIGS } from "../configs/UnitConfigs";
import { GRID, UI, TERRITORY, GAME, CAMERA, DEPTH, PLAYERS, TIMER, PHASE, RESOURCES } from "../configs/Constants";
import { OpeningPhaseMenu } from '../ui/components/OpeningPhaseMenu';
import { PowerupMenu } from '../ui/components/PowerupMenu';

/**
 * Main game scene that handles the core gameplay loop.
 * Manages game state, systems, UI, and phase transitions.
 * 
 * @class
 * @extends Phaser.Scene
 * @property {boolean} isTestingMode - Whether the game is in testing mode
 * @property {string} currentPlayer - The current active player
 * @property {string} currentPhase - The current game phase
 * @property {Phaser.GameObjects.Container} gameContainer - Container for game objects
 * @property {GridSystem} gridSystem - System for managing the game grid
 * @property {ResourceSystem} resourceSystem - System for managing player resources
 * @property {UnitSystem} unitSystem - System for managing game units
 * @property {TestPanel} testPanel - Panel for testing functionality
 * @property {CountdownTimer} countdownTimer - Timer for round phases
 */
export class Game extends Scene {
  /**
   * Creates a new Game scene instance.
   */
  constructor() {
    super("Game");
    this.isTestingMode = false; // Default value
    this.currentPlayer = PLAYERS.PLAYER_ONE; // Track current player
    this.currentPhase = PHASE.OPENING;
    // Properties initialized with values
    this.previewUnit = null;
    this.gridGraphics = null;
    this.unitButtons = new Map();
    this.currentRound = 0;

    // Systems (initialized in create())
    this.gridSystem = null;
    this.resourceSystem = null;
    this.unitSystem = null;
    this.fogOfWarSystem = null;
    this.testPanel = null;

    // Game elements (initialized in create() and other methods)
    this.gameContainer = null;
    this.uiCamera = null;
    this.wasd = null;

    // Unit buttons (initialized in createButtons())
    this.ArcherButton = null;
    this.warriorButton = null;

    // Timer element
    this.countdownTimer = null;
  }

  /**
   * Initializes scene data from scene.start parameters.
   * @param {Object} data - Scene initialization data
   * @param {boolean} [data.isTestingMode=false] - Whether to enable testing mode
   */
  init(data) {
    // Override default with data from scene.start
    this.isTestingMode = data.isTestingMode || false;
  }

  /**
   * Creates game systems, UI elements, and sets up input handlers.
   */
  create() {
    // Initialize systems
    this.gridSystem = new GridSystem(this);
    this.resourceSystem = new ResourceSystem(this);
    this.unitSystem = new UnitSystem(this);
    this.fogOfWarSystem = new FogOfWarSystem(this);

    // Create game world container
    this.gameContainer = this.add.container(0, 0);

    // Set up cameras
    const worldSize = this.gridSystem.getWorldSize();
    this.setupCameras(worldSize);

    // Set up keybindings
    this.setupKeybindings();

    // Create grid
    this.gridSystem.create(this.gameContainer);
    
    // Create fog of war
    this.fogOfWarSystem.create(this.gameContainer);

    // Create countdown timer and ready button
    this.createCountdownTimer();

    // Create UI
    this.createUnitSelectionMenu();

    
    // Disable browser context menu on right click
    this.disableBrowserContextMenu();
    
    // Set up input handlers
    this.setupInputHandlers();
      // Create test panel if in testing mode
      if (this.isTestingMode) {
        this.testPanel = new TestPanel(this);
        // Tell main camera to ignore TestPanel's container
        this.cameras.main.ignore(this.testPanel.container);
        //DTB: THIS SHOULD BE THE OPENING PHASE IN A TRUE TEST, BUT WE WANT TO SEE IT ALL.
        // this.handleRoundPhaseChange(PHASE.PLANNING);
        this.handleRoundPhaseChange(PHASE.OPENING);
      } else {
        this.handleRoundPhaseChange(PHASE.OPENING);
      }
  }

  update() {
    // Camera movement with WASD keys
    const camera = this.cameras.main;

    // Determine movement direction based on current player perspective
    const moveX = CAMERA.MOVE_SPEED * (this.currentPlayer === 'playerTwo' ? -1 : 1);
    const moveY = CAMERA.MOVE_SPEED * (this.currentPlayer === 'playerTwo' ? -1 : 1);

    if (this.wasd.left.isDown) {
      camera.scrollX -= moveX;
    }
    if (this.wasd.right.isDown) {
      camera.scrollX += moveX;
    }
    if (this.wasd.up.isDown) {
      camera.scrollY -= moveY;
    }
    if (this.wasd.down.isDown) {
      camera.scrollY += moveY;
    }
  }

  setupKeybindings() {
    // Enable WASD controls
    this.wasd = {
      up: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W),
      down: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S),
      left: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A),
      right: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D)
    };
  }

  setupCameras(worldSize) {
    // Set up the main camera
    this.cameras.main.setBackgroundColor(GAME.BACKGROUND_COLOR);
    this.cameras.main.setBounds(0, 0, worldSize.width, worldSize.height);

    // Set initial zoom to 0.75 (25% zoomed out from default)
    this.cameras.main.setZoom(CAMERA.DEFAULT_ZOOM);

    // Calculate player deployment zone center
    const deploymentZoneX = GRID.PADDING.LEFT + (TERRITORY.DEPLOYMENT_ZONE.PADDING + TERRITORY.DEPLOYMENT_ZONE.SIZE / 2) * GRID.CELL_SIZE;
    const playerTerritoryY = GRID.PADDING.TOP + (TERRITORY.TERRITORY_HEIGHT * 2 + TERRITORY.NO_MANS_LAND_HEIGHT) * GRID.CELL_SIZE;
    const deploymentZoneY = playerTerritoryY + (TERRITORY.TERRITORY_HEIGHT - TERRITORY.DEPLOYMENT_ZONE.SIZE) / 2 * GRID.CELL_SIZE;

    // Adjust Y position to account for the camera height at current zoom and UI space
    const cameraHeight = this.scale.height / 0.75; // height in world pixels at current zoom
    const yOffset = cameraHeight * 0.8; // move camera up by 80% of its height
    const uiOffset = UI.PANEL_HEIGHT * 1.65; // offset to account for UI space

    // Center camera on player's deployment zone with offset
    this.cameras.main.centerOn(deploymentZoneX, deploymentZoneY - yOffset + uiOffset);

    // Create UI camera
    this.uiCamera = this.cameras.add(0, 0, this.scale.width, this.scale.height);
    this.uiCamera.setScroll(0, 0);
    this.uiCamera.transparent = true;


  }

  createUnitSelectionMenu() {
    // Create a container for UI elements
    const uiContainer = this.add.container(0, 0);
    uiContainer.setDepth(DEPTH.UI_BACKGROUND);

    // Add background panel
    const menuBg = this.add.rectangle(
      0,
      this.scale.height - UI.PANEL_HEIGHT,
      this.scale.width,
      UI.PANEL_HEIGHT,
      GAME.UI.MENU.BACKGROUND.COLOR,
      GAME.UI.MENU.BACKGROUND.ALPHA
    );
    menuBg.setOrigin(0, 0);
    menuBg.setDepth(DEPTH.UI_BACKGROUND);

    // Create gold counter
    const goldText = this.resourceSystem.createGoldCounter(
      this.scale.width - UI.BUTTON.PADDING,
      this.scale.height - UI.PANEL_HEIGHT / 2
    );

    // Add base UI elements
    uiContainer.add([menuBg, goldText]);

    // Create buttons and add to UI container
    this.createButtons(uiContainer);

    // Set up UI camera to only show UI elements
    this.uiCamera.ignore(this.gameContainer);
    this.cameras.main.ignore(uiContainer);
  }

  createButtons(uiContainer) {
    // Create both buttons using the new Button component
    this.ArcherButton = this.createUnitButton(UNIT_TYPES.ARCHER, UI.BUTTON.PADDING, UI.BUTTON.SPACING, UI.BUTTON.SIZE);
    this.warriorButton = this.createUnitButton(UNIT_TYPES.WARRIOR, UI.BUTTON.PADDING + UI.BUTTON.SPACING, UI.BUTTON.SPACING, UI.BUTTON.SIZE);

    uiContainer.add([this.ArcherButton.container, this.warriorButton.container]);
  }

  createUnitButton(unitType, x, y, size) {
    const button = new Button(this, {
      x: x,
      y: this.scale.height - UI.PANEL_HEIGHT / 2,
      width: size,
      height: size,
      backgroundColor: UNIT_CONFIGS[unitType].color,
      hoverColor: UNIT_CONFIGS[unitType].color,
      isUnitStyle: true,
      showStrokeOnHover: true,
      hoverText: `${unitType}\n(${UNIT_CONFIGS[unitType].cost} gold)`,
      onClick: () => this.handleCreateUnitButtonClick(unitType),
      depth: DEPTH.UI_ELEMENTS,
      originX: 0.5,
      originY: 0.5
    });

    this.unitSystem.registerButton(unitType, button);
    return button;
  }

  handleCreateUnitButtonClick(unitType) {
    if (this.resourceSystem.canAfford(unitType)) {
      const { snappedX, snappedY } = this.gridSystem.getCoordinatesForUnitDeployment(unitType);

      // Deduct cost and place unit
      this.resourceSystem.deductCost(unitType)
      // create unit 
      const createdUnits = this.unitSystem.createUnits(unitType);
      // place unit separately
      // const placedUnits = this.unitSystem.placeUnit(unitType, snappedX, snappedY);
      const firstUnit = createdUnits.length > 0 ? createdUnits[0] : null
      if (firstUnit) {
        const placedUnits = this.unitSystem.positionUnit(firstUnit, snappedX, snappedY);
        if (!placedUnits) {
          // Refund if placement failed
          this.resourceSystem.gold += UNIT_CONFIGS[unitType].cost;
          this.resourceSystem.updateGoldDisplay();
        }
      }
    }
    else {
      this.resourceSystem.showInsufficientGoldFeedback();
    }
  }

  setupInputHandlers() {
    // Set up zoom handler
    this.input.on('wheel', (pointer, gameObjects, deltaX, deltaY, deltaZ) => {
      const zoom = this.cameras.main.zoom;
      if (deltaY > 0) {
        this.cameras.main.setZoom(Math.max(CAMERA.MIN_ZOOM, zoom - CAMERA.ZOOM_STEP));
      } else {
        this.cameras.main.setZoom(Math.min(CAMERA.MAX_ZOOM, zoom + CAMERA.ZOOM_STEP));
      }
    });

    // Right-click handler for clearing selections
    this.input.on('pointerdown', (pointer) => {
      if (pointer.rightButtonDown()) {
        // console.log('Right-click detected - clearing unit selection');
        // this.unitSystem.clearUnitSelection();
      }
    });
  }

  disableBrowserContextMenu() {
    // Disable the browser's default context menu that appears on right-click
    this.game.canvas.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      return false;
    }, false);
  }

  /**
   * Handles transitions between game phases.
   * @param {string} phase - The phase to transition to
   */
  handleRoundPhaseChange(phase) {
    switch (phase) {
      case PHASE.OPENING:
        this.currentPhase = phase;
        // Disable fog of war during opening phase
        this.fogOfWarSystem.toggle(false);
        const openingMenu = new OpeningPhaseMenu(this, {
          backgroundAlpha: 1.0 // Make background fully opaque
        });
        openingMenu.create();
        break;
      case PHASE.POWERUP:
        this.currentPhase = phase;
        // Enable fog of war during powerup phase
        this.fogOfWarSystem.toggle(true);
        this.initializeNextRound();
        break;
      case PHASE.PLANNING:
        this.currentPhase = phase;
        // Keep fog of war enabled during planning phase
        break;
      case PHASE.BATTLE:
        this.currentPhase = phase;
        // Disable fog of war during battle phase
        this.fogOfWarSystem.toggle(false);
        break;
      case PHASE.RESOLUTION:
        this.currentPhase = phase;
        // Disable fog of war during resolution phase
        this.fogOfWarSystem.toggle(false);
        break;
    }
  }

  /**
   * Initializes the next round, updating resources and UI.
   */
  initializeNextRound() {
    this.currentRound++;
    
    // Reset UI and view
    this.countdownTimer.resetReadyStatus();
    this.countdownTimer.reset();
    
    // Center on deployment zone
    const deploymentCenter = this.gridSystem.getDeploymentZoneCenter(this.currentPlayer);
    this.cameras.main.centerOn(deploymentCenter.x, deploymentCenter.y);
    
    // Calculate gold reward for this round
    // Formula: Starting Gold + (Increment * Sum of rounds)
    // For round n, this is: Starting Gold + Increment * (1 + 2 + ... + n)
    // Which simplifies to: Starting Gold + Increment * (n * (n + 1) / 2)
    const totalRoundsBonus = (this.currentRound - 1) * RESOURCES.GOLD_PER_ROUND_INCREMENT;
    const goldReward = RESOURCES.STARTING_GOLD + totalRoundsBonus;
    
    // Update resources
    if(this.currentRound > 1){
      this.resourceSystem.gold += goldReward;
    }
    else {
      this.resourceSystem.gold = goldReward;
    }
    this.resourceSystem.updateGoldDisplay();
    
    // Make sure fog of war is enabled
    this.fogOfWarSystem.toggle(true);
    
    // Update unit states and visibility
    this.unitSystem.updateAllUnitHighlights();
    
    // Show powerup menu
    const powerupMenu = new PowerupMenu(this);
    powerupMenu.create();
    
    console.log('Advanced to round:', this.currentRound, 'Gold reward:', goldReward);
  }

  switchPlayer() {
    this.currentPlayer = this.currentPlayer === PLAYERS.PLAYER_ONE ? PLAYERS.PLAYER_TWO : PLAYERS.PLAYER_ONE;
    this.changeCameraPerspective();
    
    // Update fog of war visibility for the new player
    this.fogOfWarSystem.updateVisibility();
    
    // Update all unit visibility based on new player perspective and fog of war
    this.unitSystem.updateAllUnitHighlights();
    this.resourceSystem.updateGoldDisplay();
    if (this.unitSystem.selectedUnitGroup) {
      this.unitSystem.selectedUnitGroup.setSelected(false);
    }
  }

  changeCameraPerspective() {
    // Get deployment zone center from GridSystem
    const { x: deploymentZoneX, y: deploymentZoneY } = this.gridSystem.getDeploymentZoneCenter(this.currentPlayer);

    // Get current camera settings
    const camera = this.cameras.main;

    // Calculate target scroll position
    const targetScrollX = 808; // Center point stays the same for both players

    // For player two, mirror the Y position across the world height
    const worldHeight = 2900; // Total world height
    const targetScrollY = this.currentPlayer === PLAYERS.PLAYER_ONE
      ? 1803.8  // Original player one position
      : GRID.PADDING.TOP + GRID.HEIGHT;

    // Target rotation based on current player
    const targetRotation = this.currentPlayer === PLAYERS.PLAYER_ONE ? 0 : Math.PI;

    // Animate camera movement and rotation
    this.tweens.add({
      targets: camera,
      scrollX: targetScrollX,
      scrollY: targetScrollY,
      rotation: targetRotation,
      duration: 1000,
      zoom: CAMERA.DEFAULT_ZOOM,
      ease: 'Power2'
    });
  }

  

  createCountdownTimer() {
    // Create the countdown timer component with callbacks
    this.countdownTimer = new CountdownTimer(this, {
      duration: TIMER.DEFAULT_DURATION,
      onReady: () => this.handlePlayerReady(),
      onTimeComplete: () => this.handleTimerComplete()
    });

    // Make main camera ignore timer UI
    this.cameras.main.ignore(this.countdownTimer.container);
  }
  handlePlayerReady() {
    console.log('Called handlePlayerReady')
  }
  /**
   * Handles timer completion events.
   */
  handleTimerComplete() {
    console.log('called handleTimerComplete')
    this.countdownTimer.reset();
  }

  /**
   * Starts the battle phase.
   * To be implemented with battle mechanics.
   */
  startBattle() {
    // This method will be implemented later to start the battle phase
    console.log('Both players are ready! Starting battle...');
  }

}
