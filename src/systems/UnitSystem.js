import { UNIT_TYPES, UNIT_CONFIGS } from "../configs/UnitConfigs";
import { GRID, UNIT, UI, PHASE } from "../configs/Constants";
import { Warrior } from "../units/Warrior";
import { Archer } from "../units/Archer";
import { UnitGroup } from "../units/UnitGroup";
import { Button } from "../ui/components/Button";
import { Unit } from "../units/Unit";

/**
 * System for managing game units, including creation, placement, and group management.
 * Handles unit selection, repositioning, and interaction with the grid system.
 * 
 * @class
 * @property {import('../scenes/Game').Game} scene - The scene this system belongs to
 * @property {UnitGroup} selectedUnitGroup - Currently selected group of units
 * @property {Map<string, Button>} unitButtons - Map of unit type to button
 * @property {number} nextUnitId - Counter for generating unique unit IDs
 * @property {Map<number, Unit>} unitsById - Map of unit ID to unit instance
 * @property {number} nextGroupId - Counter for generating unique group IDs
 * @property {Map<number, number[]>} unitGroups - Map of group ID to array of unit IDs
 */
export class UnitSystem {
    /**
     * Creates a new UnitSystem instance.
     * @param {import('../scenes/Game').Game} scene - The scene this system belongs to
     */
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
        } else {
            // Check if we're clicking on a unit
            const { gridX, gridY } = this.scene.gridSystem.getGridPositionFromPointer(pointer, this.scene.cameras.main);
            const group = this.getUnitGroup(gridX, gridY);
            
            // Only select units that belong to the current player
            if (group && this.canPlayerInteractWithUnit(group)) {
                this.selectUnitGroup(group);
            }
        }
    }

    /**
     * Registers a button for a specific unit type.
     * @param {string} unitType - Type of unit the button creates
     * @param {Button} button - Button instance to register
     */
    registerButton(unitType, button) {
        this.unitButtons.set(unitType, button);
    }

    /**
     * Gets the number of units to create per placement.
     * @param {string} unitType - Type of unit to check
     * @returns {number} Number of units per placement
     * @private
     */
    getUnitsPerPlacement(unitType) {
        return UNIT_CONFIGS[unitType].unitsPerPlacement;
    }

    /**
     * Creates a new unit instance of the specified type.
     * @param {string} unitType - Type of unit to create
     * @returns {Unit|null} The created unit instance, or null if type is invalid
     * @private
     */
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
    
    /**
     * Checks if a player can interact with a unit.
     * @param {UnitGroup} group - The group to check
     * @returns {boolean} Whether the player can interact with the unit
     */
    canPlayerInteractWithUnit(group) {
        if (!group) return false;
        
        const canInteract = group.owner === this.scene.currentPlayer;
        return canInteract;
    }
    
    /**
     * Selects a group of units and updates visual feedback.
     * @param {UnitGroup} group - The group to select
     */
    selectUnitGroup(group) {
        // Don't allow selecting units owned by the opponent
        if (!this.canPlayerInteractWithUnit(group)) {
            return;
        }
        
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
    
    /**
     * Starts repositioning a group of units.
     * @param {UnitGroup} group - The group to reposition
     */
    startRepositioningGroup(group) {
        // Verify that the group exists, can be repositioned, and belongs to the current player
        if (!group || !group.canReposition || !this.canPlayerInteractWithUnit(group)) {
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

    /**
     * Creates a group of units of the specified type.
     * @param {string} unitType - Type of units to create
     * @returns {Unit[]} Array of created units
     */
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
            const xPos = snappedX + (isVertical ? 0 : i * GRID.CELL_SIZE);
            const yPos = snappedY + (isVertical ? i * GRID.CELL_SIZE : 0);
            
            unit.setPosition(xPos, yPos);
            unit.setAlpha(1);
            unit.isRepositioning = false;
            // Ensure unit keeps its orientation
            unit.isVertical = isVertical;
        });
        
        // Force highlights to update
        units.forEach(unit => {
            if (typeof unit.updateHighlight === 'function') {
                unit.updateHighlight();
            }
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

    /**
     * Gets a unit group at the specified grid position.
     * @param {number} gridX - Grid X coordinate
     * @param {number} gridY - Grid Y coordinate
     * @returns {UnitGroup|null} The unit group at the position, or null if none found
     */
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

    /**
     * Creates a new unit group and assigns units to it.
     * @param {Unit[]} units - Units to add to the group
     * @returns {number} ID of the created group
     */
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

    /**
     * Updates highlight states for all units.
     */
    updateAllUnitHighlights() {
        // Update highlights for all units
        Array.from(this.unitsById.values()).forEach(unit => {
            unit.updateHighlight();
        });
    }

    /**
     * Updates all units during the battle phase.
     * @param {number} time - Current game time
     * @param {number} delta - Time elapsed since last update
     */
    updateUnits(time, delta) {
        // Update all units if we're in the battle phase
        if (this.scene.currentPhase === PHASE.BATTLE) {
            this.unitsById.forEach(unit => {
                unit.update(time, delta);
            });
            
            // Check if battle is over
            this.checkBattleStatus();
        }
    }
    
    /**
     * Handles a unit's death during battle.
     * @param {Unit} unit - The unit that died
     */
    handleUnitDeath(unit) {
        // Check if there are any surviving units for this player
        this.checkBattleStatus();
    }
    
    /**
     * Checks if the battle is over by counting surviving units for each player.
     */
    checkBattleStatus() {
        let playerOneSurvivors = 0;
        let playerTwoSurvivors = 0;
        
        // Count surviving units for each player
        this.unitsById.forEach(unit => {
            if (unit.health > 0) {
                if (unit.owner === 'playerOne') {
                    playerOneSurvivors++;
                } else {
                    playerTwoSurvivors++;
                }
            }
        });
        
        // If either player has no survivors, end the battle
        if (playerOneSurvivors === 0 || playerTwoSurvivors === 0) {
            // Determine the winner
            const winner = playerOneSurvivors > 0 ? 'playerOne' : 'playerTwo';
            // Notify the game scene
            this.scene.handleBattleEnd(winner);
        }
    }

    /**
     * Checks if the battle is over by counting surviving units for each player.
     * Unlike checkBattleStatus, this method only returns the result without side effects.
     * @returns {boolean} Whether there is a winner
     */
    checkBattleStatusImmediate() {
        let playerOneSurvivors = 0;
        let playerTwoSurvivors = 0;
        
        // Count surviving units for each player
        this.unitsById.forEach(unit => {
            if (unit.health > 0) {
                if (unit.owner === 'playerOne') {
                    playerOneSurvivors++;
                } else {
                    playerTwoSurvivors++;
                }
            }
        });
        
        // If either player has no survivors, there is a winner
        return playerOneSurvivors === 0 || playerTwoSurvivors === 0;
    }
} 