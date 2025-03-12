import { UnitConfigs } from "../configs/UnitConfigs";
import { Warrior } from "../units/Warrior";
import { Archer } from "../units/Archer";

export class UnitSystem {
    constructor(scene) {
        this.scene = scene;
        // For tracking which unit type is ready for placement (from button selection)
        this.activePlacementType = null;
        // For tracking existing units/groups selected on the board
        this.selectedUnitGroup = null;
        this.previewUnits = []; // Array to hold preview units
        this.unitButtons = new Map();
        this.nextUnitId = 1;
        this.unitsById = new Map(); // Track all units by their ID
    }

    registerButton(unitType, button) {
        this.unitButtons.set(unitType, button);
    }

    getUnitsPerPlacement(unitType) {
        return UnitConfigs.getUnitsPerPlacement(unitType);
    }

    // Helper to create the appropriate unit type
    createUnitInstance(unitType, x, y) {
        switch(unitType) {
            case 'warrior':
                return new Warrior(this.scene, x, y);
            case 'archer':
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

    createPreviewUnit(unitType, x, y) {
        this.clearPreview();
        
        // If we have a selected group, destroy its units
        if (this.selectedUnitGroup) {
            this.selectedUnitGroup.units.forEach(unit => {
                unit.destroy();
            });
        }
        
        const unitsPerPlacement = this.getUnitsPerPlacement(unitType);
        
        // Create preview units
        for (let i = 0; i < unitsPerPlacement; i++) {
            const previewUnit = this.createUnitInstance(
                unitType,
                x + (i * this.scene.CELL_SIZE), // Start horizontal by default
                y
            );
            
            if (previewUnit) {
                previewUnit.setAlpha(0.6);
                this.previewUnits.push(previewUnit);
            }
        }
    }

    updatePreviewPosition(x, y, isValidPosition) {
        this.previewUnits.forEach((unit, index) => {
            if (unit) {
                unit.setPosition(
                    x + (unit.isVertical ? 0 : index * this.scene.CELL_SIZE),
                    y + (unit.isVertical ? index * this.scene.CELL_SIZE : 0)
                );
                unit.setAlpha(isValidPosition ? 0.6 : 0.2);
            }
        });
    }

    placeUnit(unitType, x, y) {
        const units = [];
        const unitsPerPlacement = this.getUnitsPerPlacement(unitType);
        const { gridX, gridY } = this.scene.gridSystem.worldToGrid(x, y);
        const isVertical = this.previewUnits[0]?.isVertical || false;
        
        // Check if positions are available based on rotation
        if (!this.scene.boardSystem.arePositionsAvailable(gridX, gridY, unitsPerPlacement, isVertical)) {
            return null;
        }

        const positions = [];
        // Create and place units based on rotation
        for (let i = 0; i < unitsPerPlacement; i++) {
            const unit = this.createUnitInstance(
                unitType,
                x + (isVertical ? 0 : i * this.scene.CELL_SIZE),
                y + (isVertical ? i * this.scene.CELL_SIZE : 0)
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
                
                const worldPoint = this.scene.cameras.main.getWorldPoint(pointer.x, pointer.y);
                const { snappedX, snappedY } = this.scene.gridSystem.snapToGrid(worldPoint.x, worldPoint.y);
                
                // Clear unit selection but keep placement selection
                this.clearUnitSelection();
                
                // Get the unit group using unit's groupId
                const group = this.scene.boardSystem.getUnitGroup(unit.getGridPosition().gridX, unit.getGridPosition().gridY);
                
                if (group) {
                    this.selectedUnitGroup = group;
                    // Create preview for the selected group
                    this.createPreviewUnit(group.unitType, snappedX, snappedY);
                    // Set rotation to match the original group
                    this.previewUnits.forEach(previewUnit => {
                        previewUnit.isVertical = unit.isVertical;
                    });
                    this.updatePreviewPosition(snappedX, snappedY, true);
                }
            });
        }

        // Add the group to the board system
        this.scene.boardSystem.addUnitGroup(units, positions);

        return units;
    }

    moveSelectedGroup(x, y) {
        if (!this.selectedUnitGroup) return;

        const { gridX, gridY } = this.scene.gridSystem.worldToGrid(x, y);
        const unitsPerPlacement = this.getUnitsPerPlacement(this.selectedUnitGroup.unitType);
        const isVertical = this.selectedUnitGroup.isVertical;

        // Check if new positions are available
        if (!this.scene.boardSystem.arePositionsAvailable(gridX, gridY, unitsPerPlacement, isVertical)) {
            return;
        }
        
        // Remove the group from the board state first
        this.scene.boardSystem.removeUnitGroup(this.selectedUnitGroup);
        
        // Then destroy the units and clean up tracking
        this.selectedUnitGroup.units.forEach(unit => {
            this.unitsById.delete(unit.id);
            unit.destroy();
        });

        // Place units at new positions
        this.placeUnit(this.selectedUnitGroup.unitType, x, y);

        this.clearSelection();
    }

    clearPreview() {
        this.previewUnits.forEach(unit => {
            if (unit) {
                unit.destroy();
            }
        });
        this.previewUnits = [];
    }

    setActivePlacementType(unitType) {
        this.activePlacementType = unitType;
        this.clearUnitSelection(); // Clear any selected units on the board
        
        // Update UI buttons
        this.unitButtons.forEach((button, type) => {
            button.setSelected(type === unitType);
        });
    }

    getActivePlacementType() {
        return this.activePlacementType;
    }

    clearPlacementSelection() {
        this.activePlacementType = null;
        this.clearPreview();
        
        // Update UI buttons
        this.unitButtons.forEach(button => {
            button.setSelected(false);
        });
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

    toggleRotation() {
        // Toggle rotation for all preview units
        if (this.previewUnits.length > 0) {
            this.previewUnits.forEach(unit => unit.toggleRotation());
            
            // Update preview positions with new rotation
            const firstUnit = this.previewUnits[0];
            const { x, y } = firstUnit.sprite;
            this.updatePreviewPosition(x, y, true);
        }
    }
} 