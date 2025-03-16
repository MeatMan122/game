import { UNIT_TYPES, UNIT_CONFIGS } from "../configs/UnitConfigs";
import { GRID, UNIT } from "../configs/Constants";
import { Warrior } from "../units/Warrior";
import { Archer } from "../units/Archer";

export class UnitSystem {
    constructor(scene) {
        this.scene = scene;
        // For tracking which unit type is ready for placement (from button selection)
        this.activePlacementType = null;
        // For tracking existing units/groups selected on the board
        this.selectedUnitGroup = null;
        this.unitButtons = new Map();
        this.nextUnitId = 1;
        this.unitsById = new Map(); // Track all units by their ID
        this.nextGroupId = 1;
        this.unitGroups = new Map(); // Map of groupId to array of unit IDs
    }

    registerButton(unitType, button) {
        this.unitButtons.set(unitType, button);
    }

    getUnitsPerPlacement(unitType) {
        return UNIT_CONFIGS[unitType].unitsPerPlacement;
    }

    // Helper to create the appropriate unit type
    createUnitInstance(unitType, x, y) {
        switch(unitType) {
            case UNIT_TYPES.WARRIOR:
                return new Warrior(this.scene, x, y);
            case UNIT_TYPES.ARCHER:
                return new Archer(this.scene, x, y);
            default:
                console.error('Unknown unit type:', unitType);
                return null;
        }
    }

    // Helper to assign an ID to a unit
    assignUnitId(unit) {
        const id = this.nextUnitId++;
        unit.id = id;
        this.unitsById.set(id, unit);
        return id;
    }

    // Helper to get a unit by ID
    getUnitById(id) {
        return this.unitsById.get(id);
    }

    

    placeUnit(unitType, x, y) {
        console.log('8. UnitSystem.placeUnit called:', { unitType, x, y });
        const units = [];
        const unitsPerPlacement = this.getUnitsPerPlacement(unitType);
        const { gridX, gridY } = this.scene.gridSystem.worldToGrid(x, y);
        const isVertical =  false;
        
        // Check if positions are available based on rotation
        if (!this.scene.gridSystem.arePositionsAvailable(gridX, gridY, unitsPerPlacement, isVertical)) {
            console.log('9. Position not available for placement');
            return null;
        }

        console.log('9. Creating unit instances');
        const positions = [];
        // Create and place units based on rotation
        for (let i = 0; i < unitsPerPlacement; i++) {
            const unit = this.createUnitInstance(
                unitType,
                x + (isVertical ? 0 : i * GRID.CELL_SIZE),
                y + (isVertical ? i * GRID.CELL_SIZE : 0)
            );

            if (!unit) continue;

            unit.isVertical = isVertical;
            
            // Assign ID and track the unit
            this.assignUnitId(unit);
            units.push(unit);

            // Store position for group placement
            positions.push({
                gridX: gridX + (isVertical ? 0 : i),
                gridY: gridY + (isVertical ? i : 0)
            });

            // Set up click handler
            unit.sprite.on('pointerdown', (pointer) => {
                if (pointer.rightButtonDown()) return;
                
                const { snappedX, snappedY } = this.scene.gridSystem.getGridPositionFromPointer(pointer, this.scene.cameras.main);
                
                // Clear unit selection but keep placement selection
                this.clearUnitSelection();
                
                // Get the unit group using unit's groupId
                const group = this.getUnitGroup(unit.getGridPosition().gridX, unit.getGridPosition().gridY);
                
                if (group) {
                    this.selectedUnitGroup = group;
                    
                }
            });
        }

        console.log('10. Adding units to group');
        // Add the group
        this.addUnitGroup(units, positions);

        console.log('11. Unit placement complete');
        return units;
    }

    moveSelectedGroup(x, y) {
        if (!this.selectedUnitGroup) return;

        const { gridX, gridY } = this.scene.gridSystem.worldToGrid(x, y);
        const unitsPerPlacement = this.getUnitsPerPlacement(this.selectedUnitGroup.unitType);
        const isVertical = this.selectedUnitGroup.isVertical;

        // Check if new positions are available
        if (!this.scene.gridSystem.arePositionsAvailable(gridX, gridY, unitsPerPlacement, isVertical)) {
            return;
        }
        
        // Remove the group
        this.removeUnitGroup(this.selectedUnitGroup);
        
        // Then destroy the units and clean up tracking
        this.selectedUnitGroup.units.forEach(unit => {
            this.unitsById.delete(unit.id);
            unit.destroy();
        });

        // Place units at new positions
        this.placeUnit(this.selectedUnitGroup.unitType, x, y);

        this.clearSelection();
    }


    setActivePlacementType(unitType) {
        console.log('2a. Setting active placement type:', { unitType });
        this.activePlacementType = unitType;
        this.clearUnitSelection(); // Clear any selected units on the board
    }

    getActivePlacementType() {
        return this.activePlacementType;
    }

    clearPlacementSelection() {
        this.activePlacementType = null;
    }

    clearUnitSelection() {
        this.selectedUnitGroup = null;
    }

    clearAllSelections() {
        this.clearPlacementSelection();
        this.clearUnitSelection();
    }

    clearSelection() {
        this.clearAllSelections();
    }


    // Check if a position is occupied by any unit
    isPositionOccupied(gridX, gridY) {
        return Array.from(this.unitsById.values())
            .some(unit => unit.gridX === gridX && unit.gridY === gridY);
    }

    getUnitGroup(gridX, gridY) {
        const unit = Array.from(this.unitsById.values())
            .find(unit => unit.gridX === gridX && unit.gridY === gridY);
        
        if (!unit || unit.groupId === null) return null;

        const groupUnits = Array.from(this.unitsById.values())
            .filter(u => u.groupId === unit.groupId);

        return {
            units: groupUnits,
            unitType: unit.unitType,
            gridPositions: groupUnits.map(u => ({
                gridX: u.gridX,
                gridY: u.gridY
            })),
            isVertical: unit.isVertical
        };
    }

    // Group management methods
    addUnitGroup(units, positions) {
        const groupId = this.nextGroupId++;
        const unitIds = [];

        for (let i = 0; i < units.length; i++) {
            const unit = units[i];
            const pos = positions[i];
            
            unit.groupId = groupId;
            unit.updateGridPosition(pos.gridX, pos.gridY);
            unitIds.push(unit.id);
        }

        this.unitGroups.set(groupId, unitIds);
        return groupId;
    }

    removeUnitGroup(group) {
        if (!group || group.units.length === 0) return false;
        
        const groupId = group.units[0].groupId;
        if (groupId === null) return false;

        // Update unit positions
        group.units.forEach(unit => {
            unit.updateGridPosition(null, null);
        });

        // Clear group tracking
        this.unitGroups.delete(groupId);
        return true;
    }
} 