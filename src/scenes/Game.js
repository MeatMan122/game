import { Scene } from "phaser";
import { UnitButton } from "../ui/components/UnitButton";
import { GridSystem } from "../systems/GridSystem";
import { ResourceSystem } from "../systems/ResourceSystem";
import { UnitSystem } from "../systems/UnitSystem";
import { TestPanel } from "../ui/components/TestPanel";
import { UNIT_TYPES, UNIT_CONFIGS } from "../configs/UnitConfigs";
import { GRID, UI, TERRITORY, GAME, CAMERA, DEPTH } from "../configs/Constants";

/** @type {Phaser.Scene} */
export class Game extends Scene {
  constructor() {
    super("Game");
    this.isTestingMode = false; // Default value
    // Properties initialized with values
    this.previewUnit = null;
    this.gridGraphics = null;
    this.unitButtons = new Map();
    this.currentRound = 1;

    // Systems (initialized in create())
    this.gridSystem = null;
    this.resourceSystem = null;
    this.unitSystem = null;
    this.testPanel = null;

    // Game elements (initialized in create() and other methods)
    this.gameContainer = null;
    this.uiCamera = null;
    this.wasd = null;

    // Unit buttons (initialized in createButtons())
    this.ArcherButton = null;
    this.warriorButton = null;
  }

  init(data) {
    // Override default with data from scene.start
    this.isTestingMode = data.isTestingMode || false;
  }

  create() {
    // Initialize systems
    this.gridSystem = new GridSystem(this);
    this.resourceSystem = new ResourceSystem(this);
    this.unitSystem = new UnitSystem(this);

    // Create game world container
    this.gameContainer = this.add.container(0, 0);

    // Set up cameras
    const worldSize = this.gridSystem.getWorldSize();
    this.setupCameras(worldSize);

    // Create grid
    this.gridSystem.create(this.gameContainer);

    // Create UI
    this.createUnitSelectionMenu();

    // Create test panel if in testing mode
    if (this.isTestingMode) {
      this.testPanel = new TestPanel(this);
      // Tell main camera to ignore TestPanel's container
      this.cameras.main.ignore(this.testPanel.container);
    }

    // Disable browser context menu on right click
    this.disableBrowserContextMenu();

    // Set up input handlers
    this.setupInputHandlers();
  }

  setupCameras(worldSize) {
    // Set up the main camera
    this.cameras.main.setBackgroundColor(GAME.BACKGROUND_COLOR);
    this.cameras.main.setBounds(0, 0, worldSize.width, worldSize.height);

    // Set initial zoom to 0.75 (25% zoomed out from default)
    this.cameras.main.setZoom(0.75);

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

    // Enable WASD controls
    this.wasd = {
      up: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W),
      down: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S),
      left: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A),
      right: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D)
    };
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
    this.ArcherButton = this.createUnitButton(UNIT_TYPES.ARCHER, UI.BUTTON.PADDING, UI.BUTTON.SPACING, UI.BUTTON.SIZE);
    this.warriorButton = this.createUnitButton(UNIT_TYPES.WARRIOR, UI.BUTTON.PADDING + UI.BUTTON.SPACING, UI.BUTTON.SPACING, UI.BUTTON.SIZE);

    uiContainer.add([this.ArcherButton.container, this.warriorButton.container]);
  }

  createUnitButton(unitType, x, y, size) {
    const button = new UnitButton(this, {
      x: x,
      y: this.scale.height - UI.PANEL_HEIGHT / 2,
      size: size,
      color: UNIT_CONFIGS[unitType].color,
      name: `${unitType}\n(${UNIT_CONFIGS[unitType].cost} gold)`,
      onClick: () => this.handleCreateUnitButtonClick(unitType)
    });
    button.setDepth(DEPTH.UI_ELEMENTS);
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
    // Create a debounced console log function
    let lastLog = 0;
    const debouncedLog = (message, data) => {
      const now = Date.now();
      if (now - lastLog > GAME.DEBUG.LOG_DEBOUNCE) {
        console.log(message, data);
        lastLog = now;
      }
    };

    // Zoom handler
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

  //This is where we will do all logic for the next round's initialization including:
  // re-spawning units in same location as player set
  // updating unit background colors for positioning / enable/disable repositioning
  // Updating Resources
  // more?
  initializeNextRound(){
    this.currentRound++;
    this.unitSystem.updateAllUnitHighlights();
  }


  update() {
    // Camera movement with WASD keys
    const camera = this.cameras.main;

    if (this.wasd.left.isDown) {
      camera.scrollX -= CAMERA.MOVE_SPEED;
    }
    if (this.wasd.right.isDown) {
      camera.scrollX += CAMERA.MOVE_SPEED;
    }
    if (this.wasd.up.isDown) {
      camera.scrollY -= CAMERA.MOVE_SPEED;
    }
    if (this.wasd.down.isDown) {
      camera.scrollY += CAMERA.MOVE_SPEED;
    }
  }
}
