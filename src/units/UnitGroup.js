import { GRID } from "../configs/Constants";

export class UnitGroup {
    constructor({
        units,
        unitType,
        canReposition,
        gridPositions,
        isVertical,
        isRepositioning
    }) {
        this.units = units;
        this.unitType = unitType;
        this.canReposition = canReposition;
        this.gridPositions = gridPositions;
        this.isVertical = isVertical;
        this.isRepositioning = isRepositioning;
        this.isSelected = false;
        this.owner = units[0].owner; // Get owner from first unit in group, DTB: Remember this might have to change if we have mind control
    }

    setSelected(selected) {
        this.isSelected = selected;
        // Update all units in the group
        this.units.forEach(unit => {
            unit.setSelected(selected);
        });
    }

    setRepositioning(repositioning = true) {
        this.isRepositioning = repositioning;
        this.units.forEach(unit => {
            unit.setRepositioning(repositioning);
            // Clear invalid position state when repositioning is turned off
            if (!repositioning) {
                unit.setInvalidPosition(false);
            }
        });
    }

    clearRepositioning() {
        this.setRepositioning(false);
    }
    
    followPointer(pointer, gridSystem) {
        if (!this.isRepositioning) return;
        
        // Get the main camera from the scene
        const camera = this.units[0].scene.cameras.main;
        
        // Get the grid position from the pointer
        const { snappedX, snappedY, gridX, gridY } = gridSystem.getGridPositionFromPointer(pointer, camera);
        
        // Check if the new position is valid
        const isValid = this.isValidPlacement(gridX, gridY, gridSystem);
        
        // Update unit positions to follow cursor
        this.units.forEach((unit, index) => {
            unit.setPosition(
                snappedX + (this.isVertical ? 0 : index * GRID.CELL_SIZE),
                snappedY + (this.isVertical ? index * GRID.CELL_SIZE : 0)
            );
            
            // Set visual feedback based on placement validity
            unit.setAlpha(isValid ? 0.5 : 0.3);
            // Set invalid position state for red highlight
            unit.setInvalidPosition(!isValid);
        });
        
        return { isValid, gridX, gridY, snappedX, snappedY };
    }
    
    isValidPlacement(gridX, gridY, gridSystem) {
        // Check if in player territory and position is valid
        return gridSystem.getTerritoryAt(gridY) === 'player' &&
               gridSystem.isValidUnoccupiedPosition(gridX, gridY, this.units.length, this.isVertical);
    }
    
    placeAtPosition(gridX, gridY, snappedX, snappedY, unitSystem, gridSystem) {
        // Verify placement is valid
        if (!this.isValidPlacement(gridX, gridY, gridSystem)) {
            gridSystem.showInvalidPlacementFeedback(this.units);
            return false;
        }
        
        // Make sure first unit has the correct orientation before positioning
        this.units[0].isVertical = this.isVertical;
        
        // Position the units
        const placedUnits = unitSystem.positionUnit(this.units[0], snappedX, snappedY);
        
        if (!placedUnits) {
            return false;
        }
        
        // Clear repositioning state
        this.clearRepositioning();
        
        // Clear selection
        this.setSelected(false);
        
        // Clear the UnitSystem's selection
        if (unitSystem.selectedUnitGroup === this) {
            unitSystem.clearUnitSelection();
        }
        
        return true;
    }
    
    toggleRotation() {
        if (!this.isRepositioning) return;
        
        // Toggle the orientation state
        this.isVertical = !this.isVertical;
        
        // Update all units in the group to match this orientation
        this.units.forEach(unit => {
            unit.isVertical = this.isVertical;
        });
    }

    // Update highlights for all units in the group
    updateHighlights() {
        this.units.forEach(unit => unit.updateHighlight());
    }
} 