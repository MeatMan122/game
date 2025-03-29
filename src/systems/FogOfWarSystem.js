import { FOG_OF_WAR, GRID, TERRITORY, PLAYERS, DEPTH } from '../configs/Constants';

/**
 * System for managing the fog of war effect.
 * Creates a semi-transparent overlay that obscures the opponent's side of the battlefield.
 * 
 * @class
 * @property {import('../scenes/Game').Game} scene - The scene this system belongs to
 * @property {Phaser.GameObjects.Rectangle} playerTwoFogRectangle - Rectangle for player one's view of player two's territory
 * @property {Phaser.GameObjects.Rectangle} playerOneFogRectangle - Rectangle for player two's view of player one's territory
 * @property {boolean} enabled - Whether fog of war is currently enabled
 */
export class FogOfWarSystem {
    /**
     * Creates a new FogOfWarSystem instance.
     * @param {import('../scenes/Game').Game} scene - The scene this system belongs to
     */
    constructor(scene) {
        this.scene = scene;
        this.playerTwoFogRectangle = null;
        this.playerOneFogRectangle = null;
        this.enabled = true;
    }

    /**
     * Creates the fog of war rectangles.
     * @param {Phaser.GameObjects.Container} container - Container to add fog rectangles to
     */
    create(container) {
        // Calculate territory boundaries
        const playerTwoTerritoryY = GRID.PADDING.TOP;
        const noMansLandY = GRID.PADDING.TOP + (TERRITORY.TERRITORY_HEIGHT * GRID.CELL_SIZE);
        const playerOneTerritoryY = noMansLandY + (TERRITORY.NO_MANS_LAND_HEIGHT * GRID.CELL_SIZE);
        
        // Create fog rectangle for player two's territory (when viewed by player one)
        this.playerTwoFogRectangle = this.scene.add.rectangle(
            GRID.PADDING.LEFT + (GRID.WIDTH * GRID.CELL_SIZE) / 2, // center x
            playerTwoTerritoryY + (TERRITORY.TERRITORY_HEIGHT * GRID.CELL_SIZE) / 2, // center y
            GRID.WIDTH * GRID.CELL_SIZE, // width
            TERRITORY.TERRITORY_HEIGHT * GRID.CELL_SIZE, // height
            FOG_OF_WAR.COLOR,
            FOG_OF_WAR.ALPHA
        );
        this.playerTwoFogRectangle.setDepth(DEPTH.FOG_OF_WAR);
        
        // Create fog rectangle for player one's territory (when viewed by player two)
        this.playerOneFogRectangle = this.scene.add.rectangle(
            GRID.PADDING.LEFT + (GRID.WIDTH * GRID.CELL_SIZE) / 2, // center x
            playerOneTerritoryY + (TERRITORY.TERRITORY_HEIGHT * GRID.CELL_SIZE) / 2, // center y
            GRID.WIDTH * GRID.CELL_SIZE, // width
            TERRITORY.TERRITORY_HEIGHT * GRID.CELL_SIZE, // height
            FOG_OF_WAR.COLOR,
            FOG_OF_WAR.ALPHA
        );
        this.playerOneFogRectangle.setDepth(DEPTH.FOG_OF_WAR);
        
        // Add to container
        container.add([this.playerTwoFogRectangle, this.playerOneFogRectangle]);
        
        // Update visibility based on current player
        this.updateVisibility();
    }
    
    /**
     * Toggles fog of war on or off.
     * @param {boolean} [enabled] - Whether to enable fog of war; if not provided, toggles current state
     */
    toggle(enabled) {
        if (enabled !== undefined) {
            this.enabled = enabled;
        } else {
            this.enabled = !this.enabled;
        }
        this.updateVisibility();
    }
    
    /**
     * Updates fog of war visibility based on current player and enabled state.
     */
    updateVisibility() {
        if (!this.playerOneFogRectangle || !this.playerTwoFogRectangle) return;
        
        const currentPlayer = this.scene.currentPlayer;
        
        if (this.enabled) {
            // Show fog on opponent's side only
            this.playerTwoFogRectangle.setVisible(currentPlayer === PLAYERS.PLAYER_ONE);
            this.playerOneFogRectangle.setVisible(currentPlayer === PLAYERS.PLAYER_TWO);
        } else {
            // Hide fog completely when disabled
            this.playerTwoFogRectangle.setVisible(false);
            this.playerOneFogRectangle.setVisible(false);
        }
    }
} 