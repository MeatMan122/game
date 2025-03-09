import { Scene } from "phaser";
import { UnitButton } from "../ui/components/UnitButton";

export class Game extends Scene {
  constructor() {
    super("Game");
    this.CELL_SIZE = 32; // Size of each grid cell in pixels
    this.GRID_WIDTH = 75; // Number of cells horizontally
    this.GRID_HEIGHT = 75; // Number of cells vertically
    this.GRID_PADDING = {
      top: 120,
      right: 120,
      bottom: 200, // Larger bottom padding to accommodate UI
      left: 120
    }; // Padding around the grid
    this.UI_HEIGHT = 100; // Height of the UI panel
    this.selectedUnit = null; // Track which unit is selected for placement
    this.gridGraphics = null; // Graphics object for the grid
    this.unitButtons = new Map(); // Store unit buttons
  }

  create() {
    // Calculate total world size including padding
    const worldWidth = this.CELL_SIZE * this.GRID_WIDTH + this.GRID_PADDING.left + this.GRID_PADDING.right;
    const worldHeight = this.CELL_SIZE * this.GRID_HEIGHT + this.GRID_PADDING.top + this.GRID_PADDING.bottom;

    // Set up the main camera
    this.cameras.main.setBackgroundColor('#028af8');
    this.cameras.main.setBounds(0, 0, worldWidth, worldHeight);
    this.cameras.main.setZoom(1);
    this.cameras.main.centerOn(worldWidth / 2, worldHeight / 2);

    // Create UI camera
    this.uiCamera = this.cameras.add(0, 0, this.scale.width, this.scale.height);
    this.uiCamera.setScroll(0, 0);
    this.uiCamera.transparent = true;

    // Create a game world container for all game objects
    this.gameContainer = this.add.container(0, 0);
    
    // Enable camera controls
    this.wasd = this.input.keyboard.addKeys({
      up: Phaser.Input.Keyboard.KeyCodes.W,
      down: Phaser.Input.Keyboard.KeyCodes.S,
      left: Phaser.Input.Keyboard.KeyCodes.A,
      right: Phaser.Input.Keyboard.KeyCodes.D
    });
    
    // Create graphics object for the grid
    this.gridGraphics = this.add.graphics();
    this.gridGraphics.lineStyle(1, 0x666666, 0.8);
    this.gameContainer.add(this.gridGraphics);

    // Draw vertical lines (offset by padding)
    for (let x = 0; x <= this.GRID_WIDTH * this.CELL_SIZE; x += this.CELL_SIZE) {
      this.gridGraphics.moveTo(x + this.GRID_PADDING.left, this.GRID_PADDING.top);
      this.gridGraphics.lineTo(x + this.GRID_PADDING.left, this.GRID_HEIGHT * this.CELL_SIZE + this.GRID_PADDING.top);
    }

    // Draw horizontal lines (offset by padding)
    for (let y = 0; y <= this.GRID_HEIGHT * this.CELL_SIZE; y += this.CELL_SIZE) {
      this.gridGraphics.moveTo(this.GRID_PADDING.left, y + this.GRID_PADDING.top);
      this.gridGraphics.lineTo(this.GRID_WIDTH * this.CELL_SIZE + this.GRID_PADDING.left, y + this.GRID_PADDING.top);
    }

    // Render the grid
    this.gridGraphics.strokePath();

    // Create unit selection menu
    this.createUnitSelectionMenu();

    // Add mouse input for grid interaction
    this.input.on('pointerdown', (pointer) => {
      // Ignore clicks on the UI at the bottom
      if (pointer.y > this.scale.height - this.UI_HEIGHT) return;

      // Convert screen coordinates to world coordinates
      const worldPoint = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
      
      // Snap to grid (accounting for padding)
      const snappedX = Math.floor((worldPoint.x - this.GRID_PADDING.left) / this.CELL_SIZE) * this.CELL_SIZE + this.CELL_SIZE / 2 + this.GRID_PADDING.left;
      const snappedY = Math.floor((worldPoint.y - this.GRID_PADDING.top) / this.CELL_SIZE) * this.CELL_SIZE + this.CELL_SIZE / 2 + this.GRID_PADDING.top;
      
      // Check if click is within grid bounds
      if (snappedX >= this.GRID_PADDING.left && 
          snappedX <= this.GRID_WIDTH * this.CELL_SIZE + this.GRID_PADDING.left &&
          snappedY >= this.GRID_PADDING.top && 
          snappedY <= this.GRID_HEIGHT * this.CELL_SIZE + this.GRID_PADDING.top) {
        
        let unit;
        if (this.selectedUnit === 'archer') {
          unit = this.add.sprite(snappedX, snappedY, 'archer-idle', 0);
          unit.play('archer-idle');
        } else if (this.selectedUnit === 'warrior') {
          unit = this.add.sprite(snappedX, snappedY, 'warrior-idle', 0);
          unit.play('warrior-idle');
        } else {
          // Default red circle if no unit selected
          unit = this.add.circle(snappedX, snappedY, this.CELL_SIZE / 3, 0xff0000, 0.5);
        }
        this.gameContainer.add(unit);
      }
    });

    // Add camera controls
    this.input.on('wheel', (pointer, gameObjects, deltaX, deltaY, deltaZ) => {
      const zoom = this.cameras.main.zoom;
      if (deltaY > 0) {
        this.cameras.main.setZoom(Math.max(0.5, zoom - 0.1));
      } else {
        this.cameras.main.setZoom(Math.min(2, zoom + 0.1));
      }
    });
  }

  createUnitSelectionMenu() {
    // Create a container for UI elements
    const uiContainer = this.add.container(0, 0);
    uiContainer.setDepth(100);
    
    // Add background panel for the unit selection menu at the bottom
    const menuBg = this.add.rectangle(
      0, 
      this.scale.height - this.UI_HEIGHT, 
      this.scale.width, 
      this.UI_HEIGHT, 
      0x333333, 
      0.8
    );
    menuBg.setOrigin(0, 0);
    
    const BUTTON_PADDING = 50; // Padding from the left edge
    const BUTTON_SPACING = 70; // Space between buttons
    const BUTTON_SIZE = 50; // Size of the unit button

    // Create archer button using the UnitButton component
    const archerButton = new UnitButton(this, {
      x: BUTTON_PADDING,
      y: this.scale.height - this.UI_HEIGHT / 2,
      size: BUTTON_SIZE,
      color: 0x00ff00,
      name: 'Archer',
      onClick: (isSelected) => {
        if (isSelected) {
          // Deselect other buttons
          this.unitButtons.forEach((button, key) => {
            if (key !== 'archer' && button.isSelected) {
              button.isSelected = false;
              button.button.setStrokeStyle(0);
            }
          });
          this.selectedUnit = 'archer';
        } else {
          this.selectedUnit = null;
        }
      }
    });
    archerButton.setDepth(101);

    // Create warrior button using the UnitButton component
    const warriorButton = new UnitButton(this, {
      x: BUTTON_PADDING + BUTTON_SPACING,
      y: this.scale.height - this.UI_HEIGHT / 2,
      size: BUTTON_SIZE,
      color: 0xff0000,
      name: 'Warrior',
      onClick: (isSelected) => {
        if (isSelected) {
          // Deselect other buttons
          this.unitButtons.forEach((button, key) => {
            if (key !== 'warrior' && button.isSelected) {
              button.isSelected = false;
              button.button.setStrokeStyle(0);
            }
          });
          this.selectedUnit = 'warrior';
        } else {
          this.selectedUnit = null;
        }
      }
    });
    warriorButton.setDepth(101);
    
    // Store buttons for future reference
    this.unitButtons.set('archer', archerButton);
    this.unitButtons.set('warrior', warriorButton);

    // Add UI elements to the container
    uiContainer.add([menuBg, archerButton.container, warriorButton.container]);
    
    // Set up UI camera to only show UI elements
    this.uiCamera.ignore(this.gameContainer);
    this.cameras.main.ignore(uiContainer);
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
