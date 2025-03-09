import { Scene } from "phaser";

export class Game extends Scene {
  constructor() {
    super("Game");
  }

  create() {
    // Add background (assuming it's preloaded, e.g., in Preloader.js)
    this.add.image(512, 384, "background");

    // Create graphics object for the grid
    const gridGraphics = this.add.graphics();

    // Set grid line style (gray, 1px wide)
    gridGraphics.lineStyle(1, 0x666666); // Gray lines

    // Draw vertical lines (every 100px from 0 to 1024)
    for (let x = 0; x <= 1024; x += 100) {
      gridGraphics.moveTo(x, 0);
      gridGraphics.lineTo(x, 768);
    }

    // Draw horizontal lines (every 100px from 0 to 768)
    for (let y = 0; y <= 768; y += 100) {
      gridGraphics.moveTo(0, y);
      gridGraphics.lineTo(1024, y);
    }

    // Render the grid
    gridGraphics.strokePath();
  }

  // Note: update method can be added later for unit movement if needed
}
