import { UNIT_TYPES, UNIT_CONFIGS } from "../configs/UnitConfigs";
import { GRID, UNIT } from "../configs/Constants";
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
        let lastClickTime = 0;
        unit.sprite.on('pointerdown', (pointer) => {
            if (pointer.rightButtonDown()) return;

            const currentTime = pointer.time;
            const timeSinceLastClick = currentTime - lastClickTime;

            /*
            ============================================
            ================== DOUBLE CLICK ============
            */
            // Check if this is a double-click (typically 300-500ms threshold)
            if (timeSinceLastClick < 300 && timeSinceLastClick > 0) {
                this.handleUnitDoubleClick(pointer, unit);
                return;
            }
            lastClickTime = currentTime;
            /*
           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
           ^^^^^^^^^^^^^^^^^^^^ END DOUBLE CLICK ^^^^^^^^^^^
           */
            /*
             ############################################
             ================== SINGLE  CLICK ============
             ############################################
             */
            this.handleUnitSingleClick(pointer, unit);
            /*


            if it can, then we start the repositioning process.

            if it cannot, then we need a way of visualizing the selected state that cannot be moved.
            Note: it would also be good to have a visualization of all units which CAN be repositioned.
            that way players know at a glance which units can be moved.

            */


          
        });

        // Track last click time for double-click detection
        unit.sprite.on('pointerdown', (pointer) => {

        });
        return unit;
    }

    handleUnitDoubleClick(pointer, unit) {
        //handle repositioning
        if (this.selectedUnitGroup && this.selectedUnitGroup.canReposition) {
            this.selectedUnitGroup.setRepositioning();
            // Set initial alpha for selected units
            this.selectedUnitGroup.units.forEach(unit => {
                unit.setAlpha(0.5);
            });
        }
    }

    handleUnitSingleClick(pointer, unit) {
        // Just handle selection
        const clickedUnitGroup = this.getUnitGroup(unit.getGridPosition().gridX, unit.getGridPosition().gridY);
        
        // If another unit is being repositioned, don't change selection
        if (this.selectedUnitGroup && this.selectedUnitGroup.isRepositioning &&
            this.selectedUnitGroup !== clickedUnitGroup) {
            return;
        }
        
        // Set the selected unit group
        this.selectedUnitGroup = clickedUnitGroup;
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
        // Check if positions are available based on rotation
        if (!this.scene.gridSystem.isValidUnoccupiedPosition(gridX, gridY, unitsPerPlacement, unit.isVertical)) {
            return null;
        }
        //get all units in group
        const unitIds = this.unitGroups.get(unit.groupId);
        const units = unitIds.map(unitId => this.unitsById.get(unitId));
        // set position of all units (which should be deployment zone on create)
        units.forEach((unit, i) => {
            unit.setPosition(snappedX + (unit.isVertical ? 0 : i * GRID.CELL_SIZE),
                snappedY + (unit.isVertical ? i * GRID.CELL_SIZE : 0))
            unit.setAlpha(1);
            unit.isRepositioning = false;
        })
        // this.clearUnitSelection();
        return units;
    }

    clearUnitSelection() {
        if (this.selectedUnitGroup) {
            // Reset alpha and repositioning flags for units in the group
            this.selectedUnitGroup.units.forEach(unit => {
                unit.setAlpha(1);
                unit.isRepositioning = false;
            });
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

    // DTB: This is likely cruft or needs to be refactored to fit into the simpler system of creation/deployment.
    // Getting should consist of
    // 1. Get group ID of unit under click (or pass in unit - maybe an overload)
    // 2. Get group of unit IDs from this.unitGroups
    // 3. Get individual units from this.unitsById.get(unit.unitId)
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