import { Scene } from "phaser";

export class MainMenu extends Scene {
  constructor() {
    super("MainMenu");
  }

  create() {
    this.add.image(512, 384, "background");

    this.add
      .text(512, 460, "Main Menu", {
        fontFamily: "Arial Black",
        fontSize: 38,
        color: "#ffffff",
        stroke: "#000000",
        strokeThickness: 8,
        align: "center",
      })
      .setOrigin(0.5);

    // Multiplayer Button
    const multiplayerButton = this.add
      .text(512, 520, "Multiplayer", {
        fontFamily: "Arial Black",
        fontSize: 24,
        color: "#ffffff",
        stroke: "#000000",
        strokeThickness: 4,
        align: "center",
      })
      .setOrigin(0.5)
      .setInteractive();

    // Settings Button
    const settingsButton = this.add
      .text(512, 560, "Settings", {
        fontFamily: "Arial Black",
        fontSize: 24,
        color: "#ffffff",
        stroke: "#000000",
        strokeThickness: 4,
        align: "center",
      })
      .setOrigin(0.5)
      .setInteractive();

    // Multiplayer Button Click
    // Multiplayer Button Click - Start Game scene
    multiplayerButton.on("pointerdown", () => {
      this.scene.start("Game");
    });

    // Settings Button Click
    settingsButton.on("pointerdown", () => {
      this.scene.start("Settings");
      // Add navigation logic here if needed (e.g., this.scene.start('Settings'));
    });
  }
}
