import { Scene } from "phaser";

// Note on Global Settings:
// Phaser doesn't have a built-in global state system. We initialize a settings object
// on the game instance (this.game.settings) in Boot.js to share settings across scenes.
// All scenes can access and modify this.game.settings to read/write global settings
// like volume.

export class Settings extends Scene {
  constructor() {
    super("Settings");
  }

  create() {
    // Background
    this.add.image(512, 384, "background");

    // Title
    this.add
      .text(512, 300, "Settings", {
        fontFamily: "Arial Black",
        fontSize: 38,
        color: "#ffffff",
        stroke: "#000000",
        strokeThickness: 8,
        align: "center",
      })
      .setOrigin(0.5);

    // Music Volume Label
    this.add
      .text(512, 360, "Music Volume", {
        fontFamily: "Arial Black",
        fontSize: 24,
        color: "#ffffff",
        stroke: "#000000",
        strokeThickness: 4,
        align: "center",
      })
      .setOrigin(0.5);

    // Music Volume Slider
    const musicSlider = this.add
      .rectangle(512, 400, 200, 20, 0x666666)
      .setOrigin(0.5)
      .setInteractive();

    const musicHandle = this.add
      .rectangle(
        512 + (this.game.settings.musicVolume * 200 - 100),
        400,
        10,
        30,
        0xffffff
      )
      .setOrigin(0.5)
      .setInteractive();

    musicHandle.setData("dragging", false);
    // Snap handle to click position on slider
    musicSlider.on("pointerdown", (pointer) => {
      let newX = Phaser.Math.Clamp(pointer.x, 412, 612);
      musicHandle.x = newX;
      this.game.settings.musicVolume = (newX - 412) / 200;
    });
    // Start dragging on handle click
    musicHandle.on("pointerdown", () => musicHandle.setData("dragging", true));
    // Stop dragging only on pointer up, anywhere
    this.input.on("pointerup", () => musicHandle.setData("dragging", false));
    this.input.on("pointermove", (pointer) => {
      if (musicHandle.getData("dragging")) {
        let newX = Phaser.Math.Clamp(pointer.x, 412, 612);
        musicHandle.x = newX;
        this.game.settings.musicVolume = (newX - 412) / 200;
      }
    });

    // Sound Volume Label
    this.add
      .text(512, 460, "Sound Volume", {
        fontFamily: "Arial Black",
        fontSize: 24,
        color: "#ffffff",
        stroke: "#000000",
        strokeThickness: 4,
        align: "center",
      })
      .setOrigin(0.5);

    // Sound Volume Slider
    const soundSlider = this.add
      .rectangle(512, 500, 200, 20, 0x666666)
      .setOrigin(0.5)
      .setInteractive();

    const soundHandle = this.add
      .rectangle(
        512 + (this.game.settings.soundVolume * 200 - 100),
        500,
        10,
        30,
        0xffffff
      )
      .setOrigin(0.5)
      .setInteractive();

    soundHandle.setData("dragging", false);
    // Snap handle to click position on slider
    soundSlider.on("pointerdown", (pointer) => {
      let newX = Phaser.Math.Clamp(pointer.x, 412, 612);
      soundHandle.x = newX;
      this.game.settings.soundVolume = (newX - 412) / 200;
    });
    // Start dragging on handle click
    soundHandle.on("pointerdown", () => soundHandle.setData("dragging", true));
    // Stop dragging only on pointer up, anywhere
    this.input.on("pointerup", () => soundHandle.setData("dragging", false));
    this.input.on("pointermove", (pointer) => {
      if (soundHandle.getData("dragging")) {
        let newX = Phaser.Math.Clamp(pointer.x, 412, 612);
        soundHandle.x = newX;
        this.game.settings.soundVolume = (newX - 412) / 200;
      }
    });

    // Back Button
    const backButton = this.add
      .text(512, 600, "Back", {
        fontFamily: "Arial Black",
        fontSize: 24,
        color: "#ffffff",
        stroke: "#000000",
        strokeThickness: 4,
        align: "center",
      })
      .setOrigin(0.5)
      .setInteractive();

    backButton.on("pointerdown", () => {
      this.scene.start("MainMenu");
    });
  }
}
