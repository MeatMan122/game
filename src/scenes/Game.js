import { Scene } from "phaser";
import { UnitButton } from "../ui/components/UnitButton";
import { GridSystem } from "../systems/GridSystem";
import { ResourceSystem } from "../systems/ResourceSystem";
import { UnitSystem } from "../systems/UnitSystem";
import { BoardSystem } from "../systems/BoardSystem";
import { UnitConfigs } from "../configs/UnitConfigs";

export class Game extends Scene {
  constructor() {
    super("Game");
    this.CELL_SIZE = 32; // Size of each grid cell in pixels
    
    // Calculate grid dimensions based on available space and desired aspect ratio
    const BASE_PADDING = 120; // Base padding value
    const EXTRA_BOTTOM = 130; // Additional bottom padding for UI (250 - 120)
    
    this.GRID_WIDTH = 75; // Number of cells horizontally
    this.GRID_HEIGHT = 75; // Number of cells vertically
    this.GRID_PADDING = {
      top: BASE_PADDING,
      right: BASE_PADDING,
      bottom: BASE_PADDING + EXTRA_BOTTOM,
      left: BASE_PADDING
    };

    // UI constants
    this.BUTTON_PADDING = 50;
    this.BUTTON_SPACING = 70;
    this.BUTTON_SIZE = 50;

    // Territory constants
    this.NO_MANS_LAND_HEIGHT = 9; // Height of no-man's land in cells
    this.TERRITORY_HEIGHT = Math.floor((this.GRID_HEIGHT - this.NO_MANS_LAND_HEIGHT) / 2); // Height of each player's territory
    
    this.UI_HEIGHT = 100; // Height of the UI panel
    this.previewUnit = null; // Preview unit that follows cursor
    this.gridGraphics = null; // Graphics object for the grid
    this.unitButtons = new Map(); // Store unit buttons
    
    // Resource management
    this.STARTING_GOLD = 500;
    this.gold = this.STARTING_GOLD;
  }

  create() {
    // Initialize systems
    this.gridSystem = new GridSystem(this);
    this.resourceSystem = new ResourceSystem(this);
    this.unitSystem = new UnitSystem(this);
    this.boardSystem = new BoardSystem(this);

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
    this.cameras.main.setBackgroundColor('#028af8');
    this.cameras.main.setBounds(0, 0, worldSize.width, worldSize.height);
    this.cameras.main.setZoom(1);
    this.cameras.main.centerOn(worldSize.width / 2, worldSize.height / 2);

    // Create UI camera
    this.uiCamera = this.cameras.add(0, 0, this.scale.width, this.scale.height);
    this.uiCamera.setScroll(0, 0);
    this.uiCamera.transparent = true;

    // Enable WASD controls
    this.wasd = this.input.keyboard.addKeys({
      up: Phaser.Input.Keyboard.KeyCodes.W,
      down: Phaser.Input.Keyboard.KeyCodes.S,
      left: Phaser.Input.Keyboard.KeyCodes.A,
      right: Phaser.Input.Keyboard.KeyCodes.D
    });
  }

  createUnitSelectionMenu() {
    // Create a container for UI elements
    const uiContainer = this.add.container(0, 0);
    uiContainer.setDepth(100);
    
    // Add background panel
    const menuBg = this.add.rectangle(
      0, 
      this.scale.height - this.UI_HEIGHT, 
      this.scale.width, 
      this.UI_HEIGHT, 
      0x333333, 
      0.8
    );
    menuBg.setOrigin(0, 0);
    
    // Create gold counter
    const goldText = this.resourceSystem.createGoldCounter(
      this.scale.width - this.BUTTON_PADDING,
      this.scale.height - this.UI_HEIGHT / 2
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
    this.ArcherButton = this.createUnitButton('archer', this.BUTTON_PADDING, this.BUTTON_SPACING, this.BUTTON_SIZE);
    this.warriorButton = this.createUnitButton('warrior', this.BUTTON_PADDING + this.BUTTON_SPACING, this.BUTTON_SPACING, this.BUTTON_SIZE);
    
    uiContainer.add([this.ArcherButton.container, this.warriorButton.container]);
  }

  createUnitButton(unitType, x, y, size) {
    const button = new UnitButton(this, {
      x: x,
      y: this.scale.height - this.UI_HEIGHT / 2,
      size: size,
      color: UnitConfigs.getColor(unitType),
      name: `${unitType}\n(${UnitConfigs.getCost(unitType)} gold)`,
      onClick: (isSelected) => {
        if (isSelected) {
          if (this.resourceSystem.canAfford(unitType)) {
            this.unitSystem.setActivePlacementType(unitType);
          } else {
            button.setSelected(false);
            this.resourceSystem.showInsufficientGoldFeedback();
          }
        } else {
          this.unitSystem.clearPlacementSelection();
        }
      }
    });
    button.setDepth(101);
    this.unitSystem.registerButton(unitType, button);
    return button;
  }

  setupInputHandlers() {
    // Mouse move handler
    this.input.on('pointermove', (pointer) => {
      const placementType = this.unitSystem.getActivePlacementType();
      const selectedGroup = this.unitSystem.selectedUnitGroup;
      
      if ((placementType || selectedGroup) && !this.unitSystem.previewUnits.length) {
        const unitType = placementType || selectedGroup.unitType;
        this.unitSystem.createPreviewUnit(unitType, 0, 0);
      }

      if (this.unitSystem.previewUnits.length > 0) {
        const worldPoint = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
        const { snappedX, snappedY } = this.gridSystem.snapToGrid(worldPoint.x, worldPoint.y);
        const { gridX, gridY } = this.gridSystem.worldToGrid(snappedX, snappedY);
        
        const unitType = placementType || selectedGroup?.unitType;
        const unitsPerPlacement = UnitConfigs.getUnitsPerPlacement(unitType);
        const isVertical = this.unitSystem.previewUnits[0]?.isVertical || false;
        
        // Check if all units in the line can be placed
        let isValidPosition = true;
        
        // Check grid boundaries and territory
        for (let i = 0; i < unitsPerPlacement; i++) {
          const currentGridX = gridX + (isVertical ? 0 : i);
          const currentGridY = gridY + (isVertical ? i : 0);
          if (!this.gridSystem.isValidGridPosition(currentGridX, currentGridY) || 
              this.gridSystem.getTerritoryAt(currentGridY) !== 'player') {
            isValidPosition = false;
            break;
          }
        }

        // Check if positions are available
        if (isValidPosition) {
          isValidPosition = this.boardSystem.arePositionsAvailable(
            gridX, 
            gridY, 
            unitsPerPlacement, 
            isVertical
          );
        }
        
        this.unitSystem.updatePreviewPosition(snappedX, snappedY, isValidPosition);
      }
    });

    // Click handler
    this.input.on('pointerdown', (pointer) => {
      console.log('1. pointerdown:', { pointer });
      if (pointer.y > this.scale.height - this.UI_HEIGHT) return;

      const worldPoint = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
      const { snappedX, snappedY } = this.gridSystem.snapToGrid(worldPoint.x, worldPoint.y);
      const { gridX, gridY } = this.gridSystem.worldToGrid(snappedX, snappedY);

      const placementType = this.unitSystem.getActivePlacementType();
      const selectedGroup = this.unitSystem.selectedUnitGroup;
      
      if (!placementType && !selectedGroup) return;

      const unitType = placementType || selectedGroup.unitType;
      const unitsPerPlacement = UnitConfigs.getUnitsPerPlacement(unitType);
      const isVertical = this.unitSystem.previewUnits[0]?.isVertical || false;
      
      // Check if all units in the line can be placed
      let canPlace = true;
      
      // Check territory and available positions
      if (this.gridSystem.getTerritoryAt(gridY) !== 'player') {
        canPlace = false;
      } else {
        canPlace = this.boardSystem.arePositionsAvailable(
          gridX, 
          gridY, 
          unitsPerPlacement, 
          isVertical
        );
      }

      if (canPlace) {
        if (selectedGroup) {
          // Move existing group
          this.unitSystem.moveSelectedGroup(snappedX, snappedY);
        } else if (this.resourceSystem.deductCost(placementType)) {
          // Place new units
          this.unitSystem.placeUnit(placementType, snappedX, snappedY);
          this.unitSystem.clearPlacementSelection();
        }
      } else {
        this.gridSystem.showInvalidPlacementFeedback(this.unitSystem.previewUnits);
      }
    });

    // Right-click handler
    this.input.on('pointerdown', (pointer) => {
      if (pointer.rightButtonDown()) {
        this.unitSystem.clearAllSelections(); // DTB - we need to override the default right-click behavior
      }
    });

    // Zoom handler
    this.input.on('wheel', (pointer, gameObjects, deltaX, deltaY, deltaZ) => {
      const zoom = this.cameras.main.zoom;
      if (deltaY > 0) {
        this.cameras.main.setZoom(Math.max(0.5, zoom - 0.1));
      } else {
        this.cameras.main.setZoom(Math.min(2, zoom + 0.1));
      }
    });

    // Add T key handler for unit rotation
    this.input.keyboard.on('keydown-T', () => {
      this.unitSystem.toggleRotation();
    });
  }

  update() {
    // Camera movement with WASD keys
    const camera = this.cameras.main;
    const speed = 16;

    if (this.wasd.left.isDown) {
      camera.scrollX -= speed;
    }
    if (this.wasd.right.isDown) {
      camera.scrollX += speed;
    }
    if (this.wasd.up.isDown) {
      camera.scrollY -= speed;
    }
    if (this.wasd.down.isDown) {
      camera.scrollY += speed;
    }
  }
}
