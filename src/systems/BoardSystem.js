export class BoardSystem {
    constructor(scene) {
        this.scene = scene;
        this.gridWidth = scene.GRID_WIDTH;
        this.gridHeight = scene.GRID_HEIGHT;
        this.cellSize = scene.CELL_SIZE;
        
        // 2D array to store unit IDs at each grid position
        this.boardState = Array(this.gridHeight).fill(null)
            .map(() => Array(this.gridWidth).fill(null));
        this.nextGroupId = 1;
        this.unitGroups = new Map(); // Map of groupId to array of unit IDs
    }

    // Add a unit to the board at the specified grid position
    addUnit(unitId, gridX, gridY) {
        if (!this.isValidGridPosition(gridX, gridY)) return false;
        
        // Check if position is already occupied
        if (this.boardState[gridY][gridX] !== null) return false;
        
        const unit = this.scene.unitSystem.getUnitById(unitId);
        if (unit) {
            unit.updateGridPosition(gridX, gridY);
        }
        
        this.boardState[gridY][gridX] = unitId;
        return true;
    }

    // Remove a unit from the board at the specified grid position
    removeUnit(gridX, gridY) {
        if (!this.isValidGridPosition(gridX, gridY)) return false;
        
        const unitId = this.boardState[gridY][gridX];
        if (unitId !== null) {
            const unit = this.scene.unitSystem.getUnitById(unitId);
            if (unit) {
                unit.updateGridPosition(null, null);
            }
        }
        
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

        // If the unit has a groupId, return all units in that group
        if (unit.groupId !== null) {
            const groupUnits = this.unitGroups.get(unit.groupId) || [];
            return {
                units: groupUnits.map(id => this.scene.unitSystem.getUnitById(id)),
                unitType: unit.unitType,
                gridPositions: groupUnits.map(id => {
                    const u = this.scene.unitSystem.getUnitById(id);
                    return u.getGridPosition();
                }),
                isVertical: unit.isVertical
            };
        }

        return null;
    }

    // Add a group of units to the board
    addUnitGroup(units, positions) {
        const groupId = this.nextGroupId++;
        const unitIds = [];

        for (let i = 0; i < units.length; i++) {
            const unit = units[i];
            const pos = positions[i];
            
            unit.groupId = groupId;
            this.addUnit(unit.id, pos.gridX, pos.gridY);
            unitIds.push(unit.id);
        }

        this.unitGroups.set(groupId, unitIds);
        return groupId;
    }

    // Remove a unit group from the board
    removeUnitGroup(group) {
        if (!group || group.units.length === 0) return false;
        
        const groupId = group.units[0].groupId;
        if (groupId === null) return false;

        // Remove all units in the group from the board state
        group.units.forEach(unit => {
            if (unit.gridX !== null && unit.gridY !== null) {
                this.removeUnit(unit.gridX, unit.gridY);
            }
        });

        // Clear group tracking
        this.unitGroups.delete(groupId);
        return true;
    }
} 