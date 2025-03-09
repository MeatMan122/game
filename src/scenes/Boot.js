import { Scene } from "phaser";

export class Boot extends Scene {
  constructor() {
    super("Boot");
  }

  preload() {
    //  The Boot Scene is typically used to load in any assets you require for your Preloader, such as a game logo or background.
    //  The smaller the file size of the assets, the better, as the Boot Scene itself has no preloader.

    this.load.image("background", "assets/bg.png");
  }

  create() {
    // Initialize global settings object on the game instance
    if (!this.game.settings) {
      this.game.settings = {
        musicVolume: 0.5, // Default: 50%
        soundVolume: 0.5, // Default: 50%
      };
    }
    this.scene.start("Preloader");
  }
}
