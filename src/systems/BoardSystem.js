export class BoardSystem {
    constructor(scene) {
        this.scene = scene;
        this.gridWidth = scene.GRID_WIDTH;
        this.gridHeight = scene.GRID_HEIGHT;
        this.cellSize = scene.CELL_SIZE;
        
        // 2D array to store unit IDs at each grid position
        this.boardState = Array(this.gridHeight).fill().map(() => 
            Array(this.gridWidth).fill(null)
        );
    }

    // Add a unit to the board at the specified grid position
    addUnit(unitId, gridX, gridY) {
        if (!this.isValidGridPosition(gridX, gridY)) return false;
        
        // Check if position is already occupied
        if (this.boardState[gridY][gridX] !== null) return false;
        
        this.boardState[gridY][gridX] = unitId;
        return true;
    }

    // Remove a unit from the board at the specified grid position
    removeUnit(gridX, gridY) {
        if (!this.isValidGridPosition(gridX, gridY)) return false;
        
        this.boardState[gridY][gridX] = null;
        return true;
    }

    // Get the unit at a specific grid position
    getUnitAt(gridX, gridY) {
        if (!this.isValidGridPosition(gridX, gridY)) return null;
        const unitId = this.boardState[gridY][gridX];
        return unitId ? this.scene.unitSystem.getUnitById(unitId) : null;
    }

    // Check if a grid position is valid
    isValidGridPosition(gridX, gridY) {
        return gridX >= 0 && gridX < this.gridWidth && 
               gridY >= 0 && gridY < this.gridHeight;
    }

    // Check if a range of grid positions is available
    arePositionsAvailable(gridX, gridY, length, isVertical = false) {
        for (let i = 0; i < length; i++) {
            const currentX = gridX + (isVertical ? 0 : i);
            const currentY = gridY + (isVertical ? i : 0);
            if (!this.isValidGridPosition(currentX, currentY) || 
                this.boardState[currentY][currentX] !== null) {
                return false;
            }
        }
        return true;
    }

    // Move a unit from one position to another
    moveUnit(fromX, fromY, toX, toY) {
        const unit = this.getUnitAt(fromX, fromY);
        if (!unit) return false;

        // Remove from old position
        this.removeUnit(fromX, fromY);
        
        // Add to new position
        return this.addUnit(unit.id, toX, toY);
    }

    // Get all units in a group starting at a position
    getUnitGroup(gridX, gridY) {
        const unit = this.getUnitAt(gridX, gridY);
        if (!unit) return null;

        // Determine if the group is vertical or horizontal
        const nextUnit = this.getUnitAt(gridX, gridY + 1);
        const isVertical = nextUnit?.unitType === unit.unitType;

        // Find the start of the group
        let startX = gridX;
        let startY = gridY;
        
        if (isVertical) {
            while (startY > 0) {
                const prevUnit = this.getUnitAt(startX, startY - 1);
                if (!prevUnit || prevUnit.unitType !== unit.unitType) break;
                startY--;
            }
        } else {
            while (startX > 0) {
                const prevUnit = this.getUnitAt(startX - 1, startY);
                if (!prevUnit || prevUnit.unitType !== unit.unitType) break;
                startX--;
            }
        }

        const group = {
            units: [],
            unitType: unit.unitType,
            gridPositions: [],
            isVertical
        };

        // Find all units in the line
        let currentX = startX;
        let currentY = startY;
        while (isVertical ? currentY < this.gridHeight : currentX < this.gridWidth) {
            const currentUnit = this.getUnitAt(currentX, currentY);
            if (!currentUnit || currentUnit.unitType !== unit.unitType) break;
            
            group.units.push(currentUnit);
            group.gridPositions.push({ x: currentX, y: currentY });
            
            if (isVertical) {
                currentY++;
            } else {
                currentX++;
            }
        }

        return group;
    }

    // Remove an entire unit group from the board
    removeUnitGroup(group) {
        if (!group) return false;
        group.gridPositions.forEach(pos => {
            this.removeUnit(pos.x, pos.y);
        });
        return true;
    }
} 