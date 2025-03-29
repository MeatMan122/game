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

  update(time, delta) {
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
    
    // Update units during battle phase
    this.unitSystem.updateUnits(time, delta);
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
        console.log('Current Phase: ', this.currentPhase)
        this.currentPhase = phase;
        // Disable fog of war during opening phase
        this.fogOfWarSystem.toggle(false);
        const openingMenu = new OpeningPhaseMenu(this, {
          backgroundAlpha: 1.0 // Make background fully opaque
        });
        openingMenu.create();
        break;
      case PHASE.POWERUP:
        console.log('Current Phase: ', this.currentPhase)
        this.currentPhase = phase;
        // Enable fog of war during powerup phase
        this.fogOfWarSystem.toggle(true);
        this.initializeNextRound();
        break;
      case PHASE.PLANNING:
        console.log('Current Phase: ', this.currentPhase)
        this.currentPhase = phase;
        // Keep fog of war enabled during planning phase
        break;
      case PHASE.BATTLE:
        console.log('Current Phase: ', this.currentPhase)
        this.currentPhase = phase;
        // Disable fog of war during battle phase
        this.fogOfWarSystem.toggle(false);
        // Update unit visibility now that fog of war is disabled and we're in battle phase
        this.unitSystem.updateAllUnitHighlights();
        break;
      case PHASE.RESOLUTION:
        console.log('Current Phase: ', this.currentPhase)
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
    this.calculateGoldReward();
    
    // Make sure fog of war is enabled
    this.fogOfWarSystem.toggle(true);
    
    // Update unit states and visibility
    this.unitSystem.updateAllUnitHighlights();
    
    // Show powerup menu
    const powerupMenu = new PowerupMenu(this);
    powerupMenu.create();
    this.cameras.main.ignore(powerupMenu.container);
  }

  calculateGoldReward(){
    const totalRoundsBonus = (this.currentRound - 1) * RESOURCES.GOLD_PER_ROUND_INCREMENT;
    const goldReward = RESOURCES.STARTING_GOLD + totalRoundsBonus;
    
    // Update resources for ALL players, not just the current one
    if(this.currentRound > 1) {
      this.resourceSystem.addGoldToAllPlayers(goldReward);
    } else {
      this.resourceSystem.setGoldForAllPlayers(goldReward);
    }
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
    if (this.currentPhase == PHASE.PLANNING) {
      this.handleRoundPhaseChange(PHASE.BATTLE);
    }
    else if (this.currentPhase == PHASE.BATTLE && !this.thereIsAWinner()){
      this.handleRoundPhaseChange(PHASE.POWERUP);
    }
    else if (this.currentPhase == PHASE.BATTLE && this.thereIsAWinner()) {
      this.handleRoundPhaseChange(PHASE.RESOLUTION);
    }
  }

  thereIsAWinner(){
    // Will check state of player health to see if a player has <= 0 health
    // if they do, then the other player is declared the winner;
    return false;
  }

  /**
   * Handles the battle phase.
   * Sets up the battle environment and prepares units for combat.
   */
  startBattle() {
    console.log('Both players are ready! Starting battle...');
    
    // Disable fog of war during battle
    this.fogOfWarSystem.toggle(false);
    
    // Remove highlights from all units
    this.unitSystem.updateAllUnitHighlights();
    
    // Disable unit selection for repositioning
    if (this.unitSystem.selectedUnitGroup) {
      this.unitSystem.selectedUnitGroup.setSelected(false);
      this.unitSystem.clearUnitSelection();
    }
    
    // Update to battle phase
    this.handleRoundPhaseChange(PHASE.BATTLE);
  }
  
  /**
   * Handles the end of a battle when one player loses all units.
   * @param {string} winner - ID of the winning player
   */
  handleBattleEnd(winner) {
    console.log(`Battle ended! Winner: ${winner}`);
    
    // Calculate damage to losing player
    const loser = winner === 'playerOne' ? 'playerTwo' : 'playerOne';
    
    // Simplified damage calculation - can be expanded based on game design
    const damage = 20; // Fixed damage for now
    
    // Apply damage to loser's health (health system to be implemented)
    this.applyDamage(loser, damage);
    
    // Check if game is over
    if (this.checkGameOver()) {
      this.handleRoundPhaseChange(PHASE.RESOLUTION);
    } else {
      // If game not over, move to next round
      this.handleRoundPhaseChange(PHASE.POWERUP);
    }
  }
  
  /**
   * Applies damage to a player's health.
   * @param {string} player - ID of player to damage
   * @param {number} damage - Amount of damage to apply
   */
  applyDamage(player, damage) {
    // Simple health implementation - would need to be expanded
    if (!this.playerHealth) {
      this.playerHealth = {
        'playerOne': 100,
        'playerTwo': 100
      };
    }
    
    this.playerHealth[player] -= damage;
    
    // Ensure health doesn't go below 0
    if (this.playerHealth[player] < 0) {
      this.playerHealth[player] = 0;
    }
    
    console.log(`${player} took ${damage} damage. Remaining health: ${this.playerHealth[player]}`);
  }
  
  /**
   * Checks if the game is over (a player has 0 health).
   * @returns {boolean} Whether the game is over
   */
  checkGameOver() {
    return this.playerHealth['playerOne'] <= 0 || this.playerHealth['playerTwo'] <= 0;
  }

}
