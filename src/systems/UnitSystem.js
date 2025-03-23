import { UNIT_TYPES, UNIT_CONFIGS } from "../configs/UnitConfigs";
import { GRID, UNIT, UI } from "../configs/Constants";
import { Warrior } from "../units/Warrior";
import { Archer } from "../units/Archer";
import { UnitGroup } from "../units/UnitGroup";

export class UnitSystem {
    constructor(scene) {
        this.scene = scene;
        // For tracking existing units/groups selected on the board
        this.selectedUnitGroup = null;
        this.unitButtons = new Map();
        this.nextUnitId = 1;
        this.unitsById = new Map(); // Track all units by their ID
        this.nextGroupId = 1;
        this.unitGroups = new Map(); // Map of groupId to array of unit IDs
        
        // Setup global input handlers for unit repositioning
        this.setupGlobalInputHandlers();
    }
    
    setupGlobalInputHandlers() {
        // Add global mouse move handler for unit repositioning
        this.scene.input.on('pointermove', (pointer) => {
            this.handlePointerMove(pointer);
        });
        
        // Add global click handler for unit placement
        this.scene.input.on('pointerdown', (pointer) => {
            // Ignore clicks in UI area
            if (pointer.y > this.scene.scale.height - UI.PANEL_HEIGHT) return;
            
            // Only process left clicks
            if (pointer.leftButtonDown()) {
                this.handleGlobalClick(pointer);
            }
        });
        
        // Add T key handler for unit rotation
        this.scene.input.keyboard.on('keydown-T', () => {
            if (this.selectedUnitGroup && this.selectedUnitGroup.isRepositioning) {
                // Toggle the rotation
                this.selectedUnitGroup.toggleRotation();
                
                // Force an immediate update of unit positions based on current pointer
                const pointer = this.scene.input.activePointer;
                this.selectedUnitGroup.followPointer(pointer, this.scene.gridSystem);
            }
        });
    }
    
    handlePointerMove(pointer) {
        // If a unit group is selected for repositioning, update its position
        if (this.selectedUnitGroup && this.selectedUnitGroup.isRepositioning) {
            this.selectedUnitGroup.followPointer(pointer, this.scene.gridSystem);
        }
    }
    
    handleGlobalClick(pointer) {
        // Ignore double-clicks - those should be handled by the Unit component
        if (pointer.event && pointer.event.detail > 1) {
            return;
        }
        
        // If we have a selected unit group that's repositioning, attempt to place it
        if (this.selectedUnitGroup && this.selectedUnitGroup.isRepositioning) {
            const { snappedX, snappedY, gridX, gridY } = this.scene.gridSystem.getGridPositionFromPointer(pointer, this.scene.cameras.main);
            
            // Try to place the unit group
            const success = this.selectedUnitGroup.placeAtPosition(
                gridX, gridY, snappedX, snappedY, this, this.scene.gridSystem
            );
            
            if (success) {
                this.clearUnitSelection();
            }
        }
        
        console.groupEnd();
    }

    registerButton(unitType, button) {
        this.unitButtons.set(unitType, button);
    }

    getUnitsPerPlacement(unitType) {
        return UNIT_CONFIGS[unitType].unitsPerPlacement;
    }

    // Helper to create the appropriate unit type
    createUnitInstance(unitType) {
        let unit = null;
        switch (unitType) {
            case UNIT_TYPES.WARRIOR:
                unit = new Warrior(this.scene);
                break;
            case UNIT_TYPES.ARCHER:
                unit = new Archer(this.scene);
                break;
            default:
                console.error('Unknown unit type:', unitType);
                return null;
        }
        unit.isVertical = false;
        // Assign ID and track the unit
        this.assignUnitId(unit);
        unit.roundCreated = this.scene.currentRound;
        
        return unit;
    }
    
    // Select a unit group
    selectUnitGroup(group) {
        
        // If we already have a selected group that's repositioning, ignore
        if (this.selectedUnitGroup && this.selectedUnitGroup.isRepositioning) {
            return;
        }
        
        // Deselect current group if any
        if (this.selectedUnitGroup) {
            this.selectedUnitGroup.setSelected(false);
        }
        
        // Set new selected group
        this.selectedUnitGroup = group;
        
        // Mark as selected
        if (group) {
            group.setSelected(true);
        }
    }
    
    // Start repositioning a unit group
    startRepositioningGroup(group) {
        if (!group || !group.canReposition) {
            return;
        }
        
        // Select the group first (if not already selected)
        this.selectUnitGroup(group);
        
        // Set repositioning state
        group.setRepositioning(true);
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

    createUnits(unitType) {
        const units = [];
        const unitsPerPlacement = this.getUnitsPerPlacement(unitType);
        for (let i = 0; i < unitsPerPlacement; i++) {
            const unit = this.createUnitInstance(
                unitType
            );
            if (!unit) continue;
            units.push(unit);
        }

        // Add the group
        this.addUnitGroup(units);

        return units;
    }
    
    // unit: Unit
    // snappedX/Y positions from gridSystem.snapToGrid
    positionUnit(unit, snappedX, snappedY) {
        const unitsPerPlacement = this.getUnitsPerPlacement(unit.unitType);
        const { gridX, gridY } = this.scene.gridSystem.worldToGrid(snappedX, snappedY);
        
        // Store the unit orientation before checking position
        const isVertical = unit.isVertical;
        
        // Check if positions are available based on rotation
        if (!this.scene.gridSystem.isValidUnoccupiedPosition(gridX, gridY, unitsPerPlacement, isVertical)) {
            return null;
        }
        
        //get all units in group
        const unitIds = this.unitGroups.get(unit.groupId);
        const units = unitIds.map(unitId => this.unitsById.get(unitId));
        
        // set position of all units (which should be deployment zone on create)
        units.forEach((unit, i) => {
            unit.setPosition(
                snappedX + (isVertical ? 0 : i * GRID.CELL_SIZE),
                snappedY + (isVertical ? i * GRID.CELL_SIZE : 0)
            );
            unit.setAlpha(1);
            unit.isRepositioning = false;
            // Ensure unit keeps its orientation
            unit.isVertical = isVertical;
        });
        
        return units;
    }

    clearUnitSelection() {
        if (this.selectedUnitGroup) {
            // Reset states for the group
            this.selectedUnitGroup.setRepositioning(false);
            this.selectedUnitGroup.setSelected(false);
        }
        this.selectedUnitGroup = null;
    }

    isPositionOccupied(gridX, gridY) {
        return Array.from(this.unitsById.values())
            .some(unit => {
                return (unit.gridX === gridX && unit.gridY === gridY)
                    && !unit.isRepositioning;
            })
    }

    getUnitGroup(gridX, gridY) {
        const unit = Array.from(this.unitsById.values())
            .find(unit => unit.gridX === gridX && unit.gridY === gridY);

        if (!unit || unit.groupId === null) return null;

        const groupUnits = Array.from(this.unitsById.values())
            .filter(u => u.groupId === unit.groupId);

        return new UnitGroup({
            units: groupUnits,
            unitType: unit.unitType,
            canReposition: groupUnits.every(u => u.roundCreated === this.scene.currentRound),
            gridPositions: groupUnits.map(u => ({
                gridX: u.gridX,
                gridY: u.gridY
            })),
            isVertical: unit.isVertical,
            isRepositioning: false
        });
    }

    // Group management methods
    addUnitGroup(units) {
        const groupId = this.nextGroupId++;
        const unitIds = [];

        for (let unit of units) {
            unit.groupId = groupId;
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