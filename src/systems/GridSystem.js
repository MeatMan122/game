import { GRID, TERRITORY, TERRITORY_COLORS, GRID_STYLE, ANIMATION } from '../configs/Constants';

export class GridSystem {
    constructor(scene) {
        this.scene = scene;
        this.gridGraphics = null;
    }

    create(gameContainer) {
        this.gridGraphics = this.scene.add.graphics();
        gameContainer.add(this.gridGraphics);
        
        this.drawTerritories();
        this.drawGridLines();
        
        return this.gridGraphics;
    }

    getWorldSize() {
        return {
            width: GRID.CELL_SIZE * GRID.WIDTH + GRID.PADDING.LEFT + GRID.PADDING.RIGHT,
            height: GRID.CELL_SIZE * GRID.HEIGHT + GRID.PADDING.TOP + GRID.PADDING.BOTTOM
        };
    }

    snapToGrid(worldX, worldY) {
        const snappedX = Math.floor((worldX - GRID.PADDING.LEFT) / GRID.CELL_SIZE) * GRID.CELL_SIZE + GRID.CELL_SIZE / 2 + GRID.PADDING.LEFT;
        const snappedY = Math.floor((worldY - GRID.PADDING.TOP) / GRID.CELL_SIZE) * GRID.CELL_SIZE + GRID.CELL_SIZE / 2 + GRID.PADDING.TOP;
        
        return { snappedX, snappedY };
    }

    worldToGrid(worldX, worldY) {
        const gridX = Math.floor((worldX - GRID.PADDING.LEFT) / GRID.CELL_SIZE);
        const gridY = Math.floor((worldY - GRID.PADDING.TOP) / GRID.CELL_SIZE);
        
        return { gridX, gridY };
    }

    isValidGridPosition(gridX, gridY) {
        return gridX >= 0 && 
               gridX < GRID.WIDTH &&
               gridY >= 0 && 
               gridY < GRID.HEIGHT;
    }

    // Check if a range of grid positions is available
    arePositionsAvailable(gridX, gridY, length, isVertical = false) {
        for (let i = 0; i < length; i++) {
            const currentX = gridX + (isVertical ? 0 : i);
            const currentY = gridY + (isVertical ? i : 0);
            
            if (!this.isValidGridPosition(currentX, currentY) || 
                this.scene.unitSystem.isPositionOccupied(currentX, currentY)) {
                return false;
            }
        }
        return true;
    }

    getTerritoryAt(gridY) {
        if (gridY < TERRITORY.TERRITORY_HEIGHT) {
            return 'ai';
        } else if (gridY >= TERRITORY.TERRITORY_HEIGHT && gridY < TERRITORY.TERRITORY_HEIGHT + TERRITORY.NO_MANS_LAND_HEIGHT) {
            return 'no-mans-land';
        } else {
            return 'player';
        }
    }

    drawTerritories() {
        const graphics = this.gridGraphics;
        
        // Calculate territory boundaries
        const aiTerritoryY = GRID.PADDING.TOP;
        const noMansLandY = GRID.PADDING.TOP + (TERRITORY.TERRITORY_HEIGHT * GRID.CELL_SIZE);
        const playerTerritoryY = noMansLandY + (TERRITORY.NO_MANS_LAND_HEIGHT * GRID.CELL_SIZE);
        
        // Draw AI territory (top)
        graphics.fillStyle(TERRITORY_COLORS.AI.color, TERRITORY_COLORS.AI.alpha);
        graphics.fillRect(
            GRID.PADDING.LEFT,
            aiTerritoryY,
            GRID.WIDTH * GRID.CELL_SIZE,
            TERRITORY.TERRITORY_HEIGHT * GRID.CELL_SIZE
        );

        // Draw no-man's land (middle)
        graphics.fillStyle(TERRITORY_COLORS.NO_MANS_LAND.color, TERRITORY_COLORS.NO_MANS_LAND.alpha);
        graphics.fillRect(
            GRID.PADDING.LEFT,
            noMansLandY,
            GRID.WIDTH * GRID.CELL_SIZE,
            TERRITORY.NO_MANS_LAND_HEIGHT * GRID.CELL_SIZE
        );

        // Draw player territory (bottom)
        graphics.fillStyle(TERRITORY_COLORS.PLAYER.color, TERRITORY_COLORS.PLAYER.alpha);
        graphics.fillRect(
            GRID.PADDING.LEFT,
            playerTerritoryY,
            GRID.WIDTH * GRID.CELL_SIZE,
            TERRITORY.TERRITORY_HEIGHT * GRID.CELL_SIZE
        );

        // Draw territory borders
        graphics.lineStyle(GRID_STYLE.TERRITORY_BORDER_WIDTH, GRID_STYLE.TERRITORY_BORDER_COLOR, GRID_STYLE.TERRITORY_BORDER_ALPHA);
        
        // No-man's land borders
        graphics.beginPath();
        graphics.moveTo(GRID.PADDING.LEFT, noMansLandY);
        graphics.lineTo(GRID.PADDING.LEFT + GRID.WIDTH * GRID.CELL_SIZE, noMansLandY);
        graphics.moveTo(GRID.PADDING.LEFT, playerTerritoryY);
        graphics.lineTo(GRID.PADDING.LEFT + GRID.WIDTH * GRID.CELL_SIZE, playerTerritoryY);
        graphics.strokePath();
    }

    drawGridLines() {
        this.gridGraphics.lineStyle(GRID_STYLE.LINE_WIDTH, GRID_STYLE.LINE_COLOR, GRID_STYLE.LINE_ALPHA);

        // Draw vertical lines
        for (let x = 0; x <= GRID.WIDTH * GRID.CELL_SIZE; x += GRID.CELL_SIZE) {
            this.gridGraphics.moveTo(x + GRID.PADDING.LEFT, GRID.PADDING.TOP);
            this.gridGraphics.lineTo(x + GRID.PADDING.LEFT, GRID.HEIGHT * GRID.CELL_SIZE + GRID.PADDING.TOP);
        }

        // Draw horizontal lines
        for (let y = 0; y <= GRID.HEIGHT * GRID.CELL_SIZE; y += GRID.CELL_SIZE) {
            this.gridGraphics.moveTo(GRID.PADDING.LEFT, y + GRID.PADDING.TOP);
            this.gridGraphics.lineTo(GRID.WIDTH * GRID.CELL_SIZE + GRID.PADDING.LEFT, y + GRID.PADDING.TOP);
        }

        this.gridGraphics.strokePath();
    }

    showInvalidPlacementFeedback(units) {
        units.forEach(unit => {
            const feedback = this.scene.add.rectangle(
                unit.sprite.x, 
                unit.sprite.y, 
                GRID.CELL_SIZE, 
                GRID.CELL_SIZE, 
                0xff0000, 
                0.3
            );
            this.scene.gameContainer.add(feedback);
            this.scene.tweens.add({
                targets: feedback,
                alpha: 0,
                duration: ANIMATION.FEEDBACK_DURATION,
                onComplete: () => feedback.destroy()
            });
        });
    }
} 