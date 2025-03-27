import { UNIT_CONFIGS } from '../configs/UnitConfigs';
import { GRID, TERRITORY, TERRITORY_COLORS, GRID_STYLE, DEPTH, ANIMATION, PLAYERS } from '../configs/Constants';

export class GridSystem {
    constructor(scene) {
        this.scene = scene;
        this.gridGraphics = null;
        this.deploymentZoneCenterX = null;
        this.deploymentZoneCenterY = null;
    }

    create(gameContainer) {
        this.gridGraphics = this.scene.add.graphics();
        gameContainer.add(this.gridGraphics);
        this.gridGraphics.setDepth(DEPTH.BACKGROUND);

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

    getGridPositionFromPointer(pointer, camera) {
        const worldPoint = camera.getWorldPoint(pointer.x, pointer.y);
        const { snappedX, snappedY } = this.snapToGrid(worldPoint.x, worldPoint.y);
        const { gridX, gridY } = this.worldToGrid(snappedX, snappedY);

        return { worldPoint, snappedX, snappedY, gridX, gridY };
    }

    isValidGridPosition(gridX, gridY) {
        return gridX >= 0 &&
            gridX < GRID.WIDTH &&
            gridY >= 0 &&
            gridY < GRID.HEIGHT;
    }

    // Check if a range of grid positions is available
    isValidUnoccupiedPosition(gridX, gridY, length, isVertical = false) {
        for (let i = 0; i < length; i++) {
            const currentX = gridX + (isVertical ? 0 : i);
            const currentY = gridY + (isVertical ? i : 0);

            
            // Check grid bounds
            const isInBounds = this.isValidGridPosition(currentX, currentY);
            
            // Check occupation
            const isOccupied = this.scene.unitSystem.isPositionOccupied(currentX, currentY);
            
            // Check territory
            const territory = this.getTerritoryAt(currentY);
            const isPlayerTerritory = territory === this.scene.currentPlayer;

            if (!isInBounds || isOccupied || !isPlayerTerritory) {
                return false;
            }
        }
        return true;
    }

    getTerritoryAt(gridY) {
        if (gridY < TERRITORY.TERRITORY_HEIGHT) {
            return PLAYERS.PLAYER_TWO;
        } else if (gridY >= TERRITORY.TERRITORY_HEIGHT && gridY < TERRITORY.TERRITORY_HEIGHT + TERRITORY.NO_MANS_LAND_HEIGHT) {
            return 'no-mans-land';
        } else {
            return PLAYERS.PLAYER_ONE;
        }
    }

    drawTerritories() {
        const graphics = this.gridGraphics;

        // Calculate territory boundaries
        const playerTwoTerritoryY = GRID.PADDING.TOP;
        const noMansLandY = GRID.PADDING.TOP + (TERRITORY.TERRITORY_HEIGHT * GRID.CELL_SIZE);
        const playerTerritoryY = noMansLandY + (TERRITORY.NO_MANS_LAND_HEIGHT * GRID.CELL_SIZE);

        // Draw playerTwo territory (top)
        graphics.fillStyle(TERRITORY_COLORS.PLAYER_TWO.color, TERRITORY_COLORS.PLAYER_TWO.alpha);
        graphics.fillRect(
            GRID.PADDING.LEFT,
            playerTwoTerritoryY,
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

        // Draw deployment zones
        const deploymentZoneWidth = TERRITORY.DEPLOYMENT_ZONE.SIZE * GRID.CELL_SIZE;
        const deploymentZoneX = GRID.PADDING.LEFT + (TERRITORY.DEPLOYMENT_ZONE.PADDING * GRID.CELL_SIZE);

        // Draw playerTwo deployment zone (centered in playerTwo territory)
        const playerTwoDeploymentY = playerTwoTerritoryY + ((TERRITORY.TERRITORY_HEIGHT - TERRITORY.DEPLOYMENT_ZONE.SIZE) / 2) * GRID.CELL_SIZE;
        graphics.fillStyle(TERRITORY_COLORS.DEPLOYMENT.color, TERRITORY_COLORS.DEPLOYMENT.alpha);
        graphics.fillRect(
            deploymentZoneX,
            playerTwoDeploymentY,
            deploymentZoneWidth,
            deploymentZoneWidth
        );

        // Draw player deployment zone (centered in player territory)
        const playerDeploymentY = playerTerritoryY + ((TERRITORY.TERRITORY_HEIGHT - TERRITORY.DEPLOYMENT_ZONE.SIZE) / 2) * GRID.CELL_SIZE;
        graphics.fillRect(
            deploymentZoneX,
            playerDeploymentY,
            deploymentZoneWidth,
            deploymentZoneWidth
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

        // Calculate center of deployment zones and Store
        this.playerDeploymentCenterX = deploymentZoneX + (deploymentZoneWidth / 2);
        this.playerDeploymentCenterY = playerDeploymentY + (deploymentZoneWidth / 2);
        this.playerTwoDeploymentCenterX = deploymentZoneX + (deploymentZoneWidth / 2);
        this.playerTwoDeploymentCenterY = playerTwoDeploymentY + (deploymentZoneWidth / 2);
    }

    getDeploymentZoneCenter(player) {
        if (player === PLAYERS.PLAYER_ONE) {
            return { x: this.playerDeploymentCenterX, y: this.playerDeploymentCenterY };
        } else if (player === PLAYERS.PLAYER_TWO) {
            return { x: this.playerTwoDeploymentCenterX, y: this.playerTwoDeploymentCenterY };
        }
        return null;
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
            // DTB: This is a smell because we now have two kinds of highlights, one for
            // unit states and one for placement feedback. not a bad idea to have them both
            // but worth consideration
            feedback.setDepth(DEPTH.EFFECTS);
            this.scene.tweens.add({
                targets: feedback,
                alpha: 0,
                duration: ANIMATION.FEEDBACK_DURATION,
                onComplete: () => feedback.destroy()
            });
        });
    }

    getCoordinatesForUnitDeployment(unitType) {
        const currentPlayer = this.scene.currentPlayer || PLAYERS.PLAYER_ONE;
        
        // Use the pre-calculated deployment centers that were stored during grid creation
        const deploymentCenter = this.getDeploymentZoneCenter(currentPlayer);
        if (!deploymentCenter) {
            return null;
        }
        
        const centerX = deploymentCenter.x;
        const centerY = deploymentCenter.y;

        const unitSize = UNIT_CONFIGS[unitType].unitsPerPlacement || 1;
        const deploymentZoneWidth = TERRITORY.DEPLOYMENT_ZONE.SIZE * GRID.CELL_SIZE;
        const deploymentZoneX = GRID.PADDING.LEFT + (TERRITORY.DEPLOYMENT_ZONE.PADDING * GRID.CELL_SIZE);

        // Convert center to grid coordinates
        const centerGrid = this.worldToGrid(centerX, centerY);

        // Define deployment zone boundaries using the stored center as reference
        const minGridX = this.worldToGrid(deploymentZoneX, 0).gridX;
        const maxGridX = minGridX + TERRITORY.DEPLOYMENT_ZONE.SIZE - unitSize;
        
        // Calculate Y boundaries relative to the center
        const halfDeploymentSize = Math.floor(TERRITORY.DEPLOYMENT_ZONE.SIZE / 2);
        const minGridY = centerGrid.gridY - halfDeploymentSize;
        const maxGridY = centerGrid.gridY + halfDeploymentSize - (unitSize - 1);

        // Check center first
        if (this.isValidUnoccupiedPosition(centerGrid.gridX, centerGrid.gridY, unitSize)) {
            return this.snapToGrid(centerX, centerY);
        }

        // Search pattern: spiral outward from center
        const directions = [
            { dx: 0, dy: -1 },  // up
            { dx: 0, dy: 1 },   // down
            { dx: -1, dy: 0 },  // left
            { dx: 1, dy: 0 }    // right
        ];

        for (let distance = 1; distance <= Math.max(TERRITORY.DEPLOYMENT_ZONE.SIZE / 2, unitSize); distance++) {
            for (const dir of directions) {
                const testGridX = centerGrid.gridX + (dir.dx * distance);
                const testGridY = centerGrid.gridY + (dir.dy * distance);
                

                // Check if position is within deployment zone bounds
                const isWithinBounds = testGridX >= minGridX && testGridX <= maxGridX &&
                                     testGridY >= minGridY && testGridY <= maxGridY;
                                     

                if (isWithinBounds) {
                    if (this.isValidUnoccupiedPosition(testGridX, testGridY, unitSize)) {
                        const worldPos = this.snapToGrid(
                            GRID.PADDING.LEFT + (testGridX * GRID.CELL_SIZE) + (GRID.CELL_SIZE / 2),
                            GRID.PADDING.TOP + (testGridY * GRID.CELL_SIZE) + (GRID.CELL_SIZE / 2)
                        );
                        return worldPos;
                    }
                }
            }
        }

        return null;
    }
} 