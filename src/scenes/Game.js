import { Scene } from "phaser";
import { UnitButton } from "../ui/components/UnitButton";
import { GridSystem } from "../systems/GridSystem";
import { ResourceSystem } from "../systems/ResourceSystem";
import { UnitSystem } from "../systems/UnitSystem";
import { UNIT_TYPES, UNIT_CONFIGS } from "../configs/UnitConfigs";
import { GRID, UI, TERRITORY, GAME, CAMERA } from "../configs/Constants";

export class Game extends Scene {
  constructor() {
    super("Game");

    // Properties initialized with values
    this.previewUnit = null;
    this.gridGraphics = null;
    this.unitButtons = new Map();
    this.currentRound = 1;

    // Systems (initialized in create())
    this.gridSystem = null;
    this.resourceSystem = null;
    this.unitSystem = null;

    // Game elements (initialized in create() and other methods)
    this.gameContainer = null;
    this.uiCamera = null;
    this.wasd = null;

    // Unit buttons (initialized in createButtons())
    this.ArcherButton = null;
    this.warriorButton = null;
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
    uiContainer.setDepth(GAME.UI.MENU.DEPTH);

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
      onClick: () =>this.handleCreateUnitButtonClick(unitType)
    });
    button.setDepth(GAME.UI.BUTTON.DEPTH);
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

    // Mouse move handler
    this.input.on('pointermove', (pointer) => {
      const selectedGroup = this.unitSystem.selectedUnitGroup;

      // If a unit group is selected for repositioning, move it with the cursor
      if (selectedGroup) {
        const { snappedX, snappedY, gridX, gridY } = this.gridSystem.getGridPositionFromPointer(pointer, this.cameras.main);
        const isVertical = selectedGroup.isVertical;
        const unitCount = selectedGroup.units.length;

        // Check if the new position is valid
        const canPlace = this.gridSystem.getTerritoryAt(gridY) === 'player' &&
          this.gridSystem.isValidUnoccupiedPosition(gridX, gridY, unitCount, isVertical);

        // Update unit positions to follow cursor
        selectedGroup.units.forEach((unit, index) => {
          unit.setPosition(
            snappedX + (isVertical ? 0 : index * GRID.CELL_SIZE),
            snappedY + (isVertical ? index * GRID.CELL_SIZE : 0)
          );

          // Set visual feedback based on placement validity
          unit.setAlpha(canPlace ? 0.5 : 0.3);
        });
      }
    });

    // Click handler
    this.input.on('pointerdown', (pointer) => {
      if (pointer.y > this.scale.height - UI.PANEL_HEIGHT) return;

      const { snappedX, snappedY, gridX, gridY } = this.gridSystem.getGridPositionFromPointer(pointer, this.cameras.main);

      const selectedGroup = this.unitSystem.selectedUnitGroup;

      if (!selectedGroup) return;
      // Check if all units in the line can be placed
      let canPlace = this.gridSystem.isValidUnoccupiedPosition(
          gridX,
          gridY,
          selectedGroup.units.length,
          selectedGroup.isVertical
        );

      if (canPlace) {
          this.unitSystem.positionUnit(selectedGroup.units[0], snappedX, snappedY);
      } else {
        this.gridSystem.showInvalidPlacementFeedback(this.unitSystem.selectedUnitGroup.units);
      }
    });

    // Right-click handler
    this.input.on('pointerdown', (pointer) => {
      if (pointer.rightButtonDown()) {
        this.unitSystem.clearAllSelections();
      }
    });

    // Zoom handler
    this.input.on('wheel', (pointer, gameObjects, deltaX, deltaY, deltaZ) => {
      const zoom = this.cameras.main.zoom;
      if (deltaY > 0) {
        this.cameras.main.setZoom(Math.max(CAMERA.MIN_ZOOM, zoom - CAMERA.ZOOM_STEP));
      } else {
        this.cameras.main.setZoom(Math.min(CAMERA.MAX_ZOOM, zoom + CAMERA.ZOOM_STEP));
      }
    });

    // Add T key handler for unit rotation
    this.input.keyboard.on('keydown-T', () => {
      // this.unitSystem.toggleRotation();
    });
  }

  disableBrowserContextMenu() {
    // Disable the browser's default context menu that appears on right-click
    this.game.canvas.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      return false;
    }, false);
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
