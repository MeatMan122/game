export class GridSystem {
    constructor(scene) {
        this.scene = scene;
        this.CELL_SIZE = 32;
        this.GRID_WIDTH = 75;
        this.GRID_HEIGHT = 75;
        this.BASE_PADDING = 120;
        this.EXTRA_BOTTOM = 130;
        
        this.GRID_PADDING = {
            top: this.BASE_PADDING,
            right: this.BASE_PADDING,
            bottom: this.BASE_PADDING + this.EXTRA_BOTTOM,
            left: this.BASE_PADDING
        };

        this.NO_MANS_LAND_HEIGHT = 9;
        this.TERRITORY_HEIGHT = Math.floor((this.GRID_HEIGHT - this.NO_MANS_LAND_HEIGHT) / 2);
        
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
            width: this.CELL_SIZE * this.GRID_WIDTH + this.GRID_PADDING.left + this.GRID_PADDING.right,
            height: this.CELL_SIZE * this.GRID_HEIGHT + this.GRID_PADDING.top + this.GRID_PADDING.bottom
        };
    }

    snapToGrid(worldX, worldY) {
        const snappedX = Math.floor((worldX - this.GRID_PADDING.left) / this.CELL_SIZE) * this.CELL_SIZE + this.CELL_SIZE / 2 + this.GRID_PADDING.left;
        const snappedY = Math.floor((worldY - this.GRID_PADDING.top) / this.CELL_SIZE) * this.CELL_SIZE + this.CELL_SIZE / 2 + this.GRID_PADDING.top;
        
        return { snappedX, snappedY };
    }

    worldToGrid(worldX, worldY) {
        const gridX = Math.floor((worldX - this.GRID_PADDING.left) / this.CELL_SIZE);
        const gridY = Math.floor((worldY - this.GRID_PADDING.top) / this.CELL_SIZE);
        
        return { gridX, gridY };
    }

    isValidGridPosition(gridX, gridY) {
        return gridX >= 0 && 
               gridX < this.GRID_WIDTH &&
               gridY >= 0 && 
               gridY < this.GRID_HEIGHT;
    }

    getTerritoryAt(gridY) {
        if (gridY < this.TERRITORY_HEIGHT) {
            return 'ai';
        } else if (gridY >= this.TERRITORY_HEIGHT && gridY < this.TERRITORY_HEIGHT + this.NO_MANS_LAND_HEIGHT) {
            return 'no-mans-land';
        } else {
            return 'player';
        }
    }

    drawTerritories() {
        const graphics = this.gridGraphics;
        
        // Calculate territory boundaries
        const aiTerritoryY = this.GRID_PADDING.top;
        const noMansLandY = this.GRID_PADDING.top + (this.TERRITORY_HEIGHT * this.CELL_SIZE);
        const playerTerritoryY = noMansLandY + (this.NO_MANS_LAND_HEIGHT * this.CELL_SIZE);
        
        // Draw AI territory (top) - Light red
        graphics.fillStyle(0xff0000, 0.1);
        graphics.fillRect(
            this.GRID_PADDING.left,
            aiTerritoryY,
            this.GRID_WIDTH * this.CELL_SIZE,
            this.TERRITORY_HEIGHT * this.CELL_SIZE
        );

        // Draw no-man's land (middle) - Light yellow
        graphics.fillStyle(0xffff00, 0.1);
        graphics.fillRect(
            this.GRID_PADDING.left,
            noMansLandY,
            this.GRID_WIDTH * this.CELL_SIZE,
            this.NO_MANS_LAND_HEIGHT * this.CELL_SIZE
        );

        // Draw player territory (bottom) - Light blue
        graphics.fillStyle(0x0000ff, 0.1);
        graphics.fillRect(
            this.GRID_PADDING.left,
            playerTerritoryY,
            this.GRID_WIDTH * this.CELL_SIZE,
            this.TERRITORY_HEIGHT * this.CELL_SIZE
        );

        // Draw territory borders
        graphics.lineStyle(2, 0xffffff, 0.8);
        
        // No-man's land borders
        graphics.beginPath();
        graphics.moveTo(this.GRID_PADDING.left, noMansLandY);
        graphics.lineTo(this.GRID_PADDING.left + this.GRID_WIDTH * this.CELL_SIZE, noMansLandY);
        graphics.moveTo(this.GRID_PADDING.left, playerTerritoryY);
        graphics.lineTo(this.GRID_PADDING.left + this.GRID_WIDTH * this.CELL_SIZE, playerTerritoryY);
        graphics.strokePath();
    }

    drawGridLines() {
        this.gridGraphics.lineStyle(1, 0x666666, 0.8);

        // Draw vertical lines
        for (let x = 0; x <= this.GRID_WIDTH * this.CELL_SIZE; x += this.CELL_SIZE) {
            this.gridGraphics.moveTo(x + this.GRID_PADDING.left, this.GRID_PADDING.top);
            this.gridGraphics.lineTo(x + this.GRID_PADDING.left, this.GRID_HEIGHT * this.CELL_SIZE + this.GRID_PADDING.top);
        }

        // Draw horizontal lines
        for (let y = 0; y <= this.GRID_HEIGHT * this.CELL_SIZE; y += this.CELL_SIZE) {
            this.gridGraphics.moveTo(this.GRID_PADDING.left, y + this.GRID_PADDING.top);
            this.gridGraphics.lineTo(this.GRID_WIDTH * this.CELL_SIZE + this.GRID_PADDING.left, y + this.GRID_PADDING.top);
        }

        this.gridGraphics.strokePath();
    }

    showInvalidPlacementFeedback(x, y) {
        const feedback = this.scene.add.rectangle(x, y, this.CELL_SIZE, this.CELL_SIZE, 0xff0000, 0.3);
        this.scene.gameContainer.add(feedback);
        this.scene.tweens.add({
            targets: feedback,
            alpha: 0,
            duration: 300,
            onComplete: () => feedback.destroy()
        });
    }
} 