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
    this.previewUnit = null;
    this.gridGraphics = null;
    this.unitButtons = new Map();
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
      onClick: (isSelected) => {
        console.log('1. Unit Button Clicked:', { unitType, isSelected });
          if (this.resourceSystem.canAfford(unitType)) {
            console.log('2. Can afford unit, setting active placement type');
            this.unitSystem.setActivePlacementType(unitType);

            const { snappedX, snappedY } = this.gridSystem.getCoordinatesForUnitDeployment(unitType);

            // Deduct cost and place unit
            this.resourceSystem.deductCost(unitType)
            const placedUnits = this.unitSystem.placeUnit(unitType, snappedX, snappedY);
            if (!placedUnits) {
              // Refund if placement failed
              this.resourceSystem.gold += UNIT_CONFIGS[unitType].cost;
              this.resourceSystem.updateGoldDisplay();
            }

          }
        else {
          console.log('2. Cannot afford unit');
          this.resourceSystem.showInsufficientGoldFeedback();
        }
      
    }
    });
    button.setDepth(GAME.UI.BUTTON.DEPTH);
    this.unitSystem.registerButton(unitType, button);
return button;
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
    const placementType = this.unitSystem.getActivePlacementType();
    const selectedGroup = this.unitSystem.selectedUnitGroup;

  });

  // Click handler
  this.input.on('pointerdown', (pointer) => {
    if (pointer.y > this.scale.height - UI.PANEL_HEIGHT) return;

    const { snappedX, snappedY, gridX, gridY } = this.gridSystem.getGridPositionFromPointer(pointer, this.cameras.main);

    const placementType = this.unitSystem.getActivePlacementType();
    const selectedGroup = this.unitSystem.selectedUnitGroup;

    if (!placementType && !selectedGroup) return;

    console.log('5. Attempting to place unit:', { placementType, gridX, gridY });

    const unitType = placementType || selectedGroup.unitType;
    const unitsPerPlacement = UNIT_CONFIGS[unitType].unitsPerPlacement;
    const isVertical = false;

    // Check if all units in the line can be placed
    let canPlace = true;

    // Check territory and available positions
    if (this.gridSystem.getTerritoryAt(gridY) !== 'player') {
      console.log('6. Cannot place: invalid territory');
      canPlace = false;
    } else {
      canPlace = this.gridSystem.arePositionsAvailable(
        gridX,
        gridY,
        unitsPerPlacement,
        isVertical
      );
      console.log('6. Position availability check:', { canPlace });
    }

    if (canPlace) {
      if (selectedGroup) {
        console.log('7. Moving existing group');
        this.unitSystem.moveSelectedGroup(snappedX, snappedY);
      }
    } else {
      console.log('7. Showing invalid placement feedback');
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
