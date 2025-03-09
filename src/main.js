import { Boot } from "./scenes/Boot";
import { Game } from "./scenes/Game";
import { GameOver } from "./scenes/GameOver";
import { MainMenu } from "./scenes/MainMenu";
import { Preloader } from "./scenes/Preloader";
import { Settings } from "./scenes/Settings";

//  Find out more information about the Game Config at:
//  https://newdocs.phaser.io/docs/3.70.0/Phaser.Types.Core.GameConfig
const config = {
  type: Phaser.AUTO,
  width: 1024,
  height: 768, 
  parent: "game-container",
  backgroundColor: "#028af8",
  scale: {
    mode: Phaser.Scale.FIT, // Scales to fit the container while maintaining aspect ratio
    autoCenter: Phaser.Scale.CENTER_BOTH,
    // Limit to browser window dimensions to prevent scrolling
  },
  // Add physics for unit placement
  physics: {
    default: 'arcade',
    arcade: {
      debug: false
    }
  },
  scene: [Boot, Preloader, MainMenu, Game, GameOver, Settings],
};

export default new Phaser.Game(config);
