import { Scene } from "phaser";
import { DEPTH } from "../configs/Constants";

export class MainMenu extends Scene {
  constructor() {
    super("MainMenu");
  }

  create() {
    this.add.image(512, 384, "background").setDepth(DEPTH.BACKGROUND);

    this.add
      .text(512, 460, "Main Menu", {
        fontFamily: "Arial Black",
        fontSize: 38,
        color: "#ffffff",
        stroke: "#000000",
        strokeThickness: 8,
        align: "center",
      })
      .setOrigin(0.5)
      .setDepth(DEPTH.UI_ELEMENTS);

    // Testing Button
    const testBattleButton = this.add
      .text(512, 520, "Test Battle", {
        fontFamily: "Arial Black",
        fontSize: 24,
        color: "#ffffff",
        stroke: "#000000",
        strokeThickness: 4,
        align: "center",
      })
      .setOrigin(0.5)
      .setInteractive()
      .setDepth(DEPTH.UI_ELEMENTS);

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
      .setInteractive()
      .setDepth(DEPTH.UI_ELEMENTS);

    // Testing Button Click
    testBattleButton.on("pointerdown", () => {
      this.scene.start("Game", { isTestingMode: true });
    });

    // Settings Button Click
    settingsButton.on("pointerdown", () => {
      this.scene.start("Settings");
      // Add navigation logic here if needed (e.g., this.scene.start('Settings'));
    });
  }
}
