import { GRID, DEPTH, TERRITORY_COLORS, UNIT, PHASE } from '../configs/Constants';
import { UNIT_CONFIGS } from '../configs/UnitConfigs';

/**
 * Represents a game unit that can be placed on the grid and manipulated by players.
 * Handles unit visualization, interaction, positioning, and state management.
 * 
 * @class
 * @property {import('../scenes/Game').Game} scene - The scene this unit belongs to
 * @property {string} unitType - The type of unit (e.g., 'warrior', 'archer')
 * @property {number} id - Unique identifier assigned by UnitSystem
 * @property {number} groupId - Identifier for units placed together
 * @property {Phaser.GameObjects.Sprite} sprite - The unit's main sprite
 * @property {boolean} isVertical - Whether the unit is oriented vertically
 * @property {number} gridX - Current X position on the grid
 * @property {number} gridY - Current Y position on the grid
 * @property {number} roundCreated - The round number when this unit was created
 * @property {boolean} isRepositioning - Whether the unit is being repositioned
 * @property {boolean} isSelected - Whether the unit is currently selected
 * @property {boolean} isInvalidPosition - Whether the unit is in an invalid position
 * @property {string} owner - The player who owns this unit
 * @property {number} health - Current health of the unit
 * @property {number} maxHealth - Maximum health of the unit
 * @property {number} speed - Movement speed of the unit
 * @property {number} attackPower - Attack power of the unit
 * @property {number} attackRange - Attack range of the unit
 * @property {Unit} target - Current target unit for movement/combat
 * @property {boolean} isMoving - Whether the unit is currently moving
 * @property {boolean} isAttacking - Whether the unit is currently attacking
 */
export class Unit {
    /**
     * Creates a new Unit instance.
     * @param {import('../scenes/Game').Game} scene - The scene this unit belongs to
     * @param {string} unitType - The type of unit to create
     */
    constructor(scene, unitType) {
        this.scene = scene;
        this.unitType = unitType;
        this.id = null; // Will be set by UnitSystem
        this.groupId = null; // Group identifier for units placed together
        this.sprite = null; // Will be set by createSprite
        this.isVertical = false;
        this.gridX = null; // Current grid position X
        this.gridY = null; // Current grid position Y
        this.roundCreated = null;
        this.isRepositioning = false;
        this.isSelected = false;
        this.isInvalidPosition = false; // New flag for invalid position state
        this.owner = scene.currentPlayer; // Track which player owns this unit

        // Battle attributes
        const config = UNIT_CONFIGS[unitType];
        this.maxHealth = config.health;
        this.health = config.health;
        this.speed = config.speed;
        this.attackPower = config.attackPower;
        this.attackRange = config.attackRange;
        this.target = null;
        this.isMoving = false;
        this.isAttacking = false;
        this.lastAttackTime = 0;
        this.attackCooldown = 1000; // 1 second between attacks

        // Create the sprite
        this.createSprite();
    }

    /**
     * Creates the unit's visual components including sprite, highlight, and outline.
     * Sets up interactive elements and event handlers.
     * @private
     */
    createSprite() {
        // Create a highlight background (will be visible only when unit can be repositioned)
        // scene.add.rectangle(x, y, width, height, fillColor, fillAlpha)
        this.highlightSprite = this.scene.add.rectangle(0, 0, GRID.CELL_SIZE, GRID.CELL_SIZE, TERRITORY_COLORS.NO_MANS_LAND.color, 0.4);
        this.highlightSprite.setVisible(false); // Hidden by default
        this.scene.gameContainer.add(this.highlightSprite);

        // Create selection outline (separate from highlight)
        this.outlineSprite = this.scene.add.rectangle(0, 0, GRID.CELL_SIZE, GRID.CELL_SIZE, 0x00BFFF, 0);
        this.outlineSprite.setStrokeStyle(3, 0x00BFFF); // 3px light blue outline
        this.outlineSprite.setVisible(false); // Hidden by default
        this.scene.gameContainer.add(this.outlineSprite);

        // Set highlight to a lower depth so it appears behind the unit sprite
        this.highlightSprite.setDepth(DEPTH.HIGHLIGHTS);
        this.outlineSprite.setDepth(DEPTH.SELECTION);

        // Create the unit sprite
        this.sprite = this.scene.add.sprite(0, 0, `${this.unitType}-idle`, 0);
        this.sprite.play(`${this.unitType}-idle`);
        this.sprite.setInteractive();
        this.scene.gameContainer.add(this.sprite);
        this.sprite.setDepth(DEPTH.GROUND_UNITS); // Ensure unit is above the highlight

        // Set up event handlers
        this.setupEventHandlers();

        // Update highlight visibility based on whether unit can be repositioned
        this.updateHighlight();
    }

    /**
     * Sets up event handlers for unit interaction.
     * Handles clicks, double-clicks, and repositioning events.
     * @private
     */
    setupEventHandlers() {
        // Handle click events on this unit
        this.sprite.on('pointerdown', (pointer) => {
            // Ignore right clicks
            if (pointer.rightButtonDown()) return;
            // Get the unit system
            const unitSystem = this.scene.unitSystem;

            // When in repositioning mode, allow the click to pass through
            // to potentially trigger the global click handler
            if (this.isRepositioning && pointer.event.detail === 1) {
                // Handle the placement directly here
                this.handleSingleClick(pointer);

                console.groupEnd();
                return;
            }

            // Prevent all event propagation for non-repositioning clicks
            if (pointer.event) {
                pointer.event.stopPropagation();
                pointer.event.preventDefault();
                pointer.event.stopImmediatePropagation();
            }

            // Check if this is a double-click using the browser's native detection
            if (pointer.event.detail > 1) {
                this.handleDoubleClick(pointer);
            } else {
                this.handleSingleClick(pointer);
            }

            console.groupEnd();
        });
    }

    /**
     * Handles single-click events on the unit.
     * Manages unit selection and placement during repositioning.
     * @param {Phaser.Input.Pointer} pointer - The pointer that triggered the event
     * @private
     */
    handleSingleClick(pointer) {
        const unitSystem = this.scene.unitSystem;

        // Get the group this unit belongs to
        const group = unitSystem.getUnitGroup(this.gridX, this.gridY);

        // If this unit's group is being repositioned, handle placement
        if (group && group.isRepositioning) {

            // Get grid position for placement
            const { snappedX, snappedY, gridX, gridY } = this.scene.gridSystem.getGridPositionFromPointer(
                pointer,
                this.scene.cameras.main
            );

            // Try to place the unit group
            group.placeAtPosition(
                gridX,
                gridY,
                snappedX,
                snappedY,
                unitSystem,
                this.scene.gridSystem
            );

            return;
        }

        // If another unit/group is being repositioned, ignore this click
        if (unitSystem.selectedUnitGroup &&
            unitSystem.selectedUnitGroup.isRepositioning &&
            unitSystem.selectedUnitGroup !== group) {
            console.log('Another unit is being repositioned - ignoring click');
            return;
        }
        unitSystem.selectUnitGroup(group);
    }

    /**
     * Handles double-click events on the unit.
     * Initiates unit repositioning if allowed.
     * @param {Phaser.Input.Pointer} pointer - The pointer that triggered the event
     * @private
     */
    handleDoubleClick(pointer) {
        if (this.scene.currentPhase == PHASE.PLANNING) {
            const unitSystem = this.scene.unitSystem;
            const group = unitSystem.getUnitGroup(this.gridX, this.gridY);
            
            if (group && unitSystem.canPlayerInteractWithUnit(group) && group.canReposition) {
                unitSystem.startRepositioningGroup(group);
            }
        }
    }

    /**
     * Sets the unit's position in world coordinates and updates grid position.
     * @param {number} x - World X coordinate
     * @param {number} y - World Y coordinate
     */
    setPosition(x, y) {
        if (this.sprite) {
            this.sprite.setPosition(x, y);
            // Move the highlight sprite with the unit
            if (this.highlightSprite) {
                this.highlightSprite.setPosition(x, y);
            }
            if (this.outlineSprite) {
                this.outlineSprite.setPosition(x, y);
            }
            const { gridX, gridY } = this.scene.gridSystem.worldToGrid(x, y);
            this.gridX = gridX;
            this.gridY = gridY;
        }
    }

    /**
     * Sets the transparency of the unit's sprite.
     * @param {number} alpha - Transparency value (0-1)
     */
    setAlpha(alpha) {
        if (this.sprite) {
            this.sprite.setAlpha(alpha);
        }
    }

    /**
     * Sets the unit's selected state and updates visual feedback.
     * @param {boolean} selected - Whether the unit is selected
     */
    setSelected(selected) {
        this.isSelected = selected;
        this.updateHighlightColor();
        
        const isCurrentRound = this.roundCreated === this.scene.currentRound;
        const isOwnedByCurrentPlayer = this.owner === this.scene.currentPlayer;
        
        // Show highlight based on unit state (repositioning/created this round)
        const showHighlight = (isCurrentRound || 
                              this.isRepositioning || 
                              this.isInvalidPosition) && 
                              isOwnedByCurrentPlayer;
        
        this.highlightSprite.setVisible(showHighlight);
        this.outlineSprite.setVisible(this.isSelected && isOwnedByCurrentPlayer);
    }

    /**
     * Sets the unit's repositioning state and updates visual feedback.
     * @param {boolean} repositioning - Whether the unit is being repositioned
     */
    setRepositioning(repositioning) {
        this.isRepositioning = repositioning;
        this.setAlpha(repositioning ? 0.5 : 1.0);
        this.updateHighlightColor();
    }

    /**
     * Sets whether the unit is in an invalid position and updates visual feedback.
     * @param {boolean} invalid - Whether the position is invalid
     */
    setInvalidPosition(invalid) {
        this.isInvalidPosition = invalid;
        this.updateHighlightColor();
    }

    /**
     * Updates the highlight color based on unit state (selected, repositioning, invalid).
     * @private
     */
    updateHighlightColor() {
        if (!this.highlightSprite) return;

        let color;
        let alpha = 0.4;
        if (this.owner === this.scene.currentPlayer) {
            if (this.isInvalidPosition) {
                color = UNIT.FEEDBACK.COLOR;
            } else if (this.isRepositioning) {
                color = TERRITORY_COLORS.DEPLOYMENT.color;
            } else {
                color = TERRITORY_COLORS.NO_MANS_LAND.color;
            }
        } else {
            color = 0x000000;
            alpha = 0; // Transparent black (alpha will be set separately)
        }

        this.highlightSprite.setFillStyle(color, alpha);
    }

    /**
     * Cleans up and removes the unit's visual components from the scene.
     */
    destroy() {
        if (this.highlightSprite) {
            this.highlightSprite.destroy();
            this.highlightSprite = null;
        }
        if (this.outlineSprite) {
            this.outlineSprite.destroy();
            this.outlineSprite = null;
        }
        if (this.sprite) {
            this.sprite.destroy();
            this.sprite = null;
        }
    }

    /**
     * Gets the unit's current grid position.
     * @returns {{gridX: number, gridY: number}} The grid coordinates
     */
    getGridPosition() {
        if (this.gridX !== null && this.gridY !== null) {
            return { gridX: this.gridX, gridY: this.gridY };
        }
        if (!this.sprite) return null;
        const pos = this.scene.gridSystem.worldToGrid(this.sprite.x, this.sprite.y);
        this.gridX = pos.gridX;
        this.gridY = pos.gridY;
        return pos;
    }

    /**
     * Updates the unit's stored grid position.
     * @param {number} gridX - New X position on grid
     * @param {number} gridY - New Y position on grid
     */
    updateGridPosition(gridX, gridY) {
        this.gridX = gridX;
        this.gridY = gridY;
    }

    /**
     * Toggles the unit's orientation between vertical and horizontal.
     * Only works when unit is being repositioned.
     */
    toggleRotation() {
        if (this.isRepositioning) {
            this.isVertical = !this.isVertical;
        }
    }

    /**
     * Updates the visibility and state of the unit's highlight based on current conditions.
     * @private
     */
    updateHighlight() {
        if (!this.sprite) return;
        
        const currentPlayer = this.scene.currentPlayer;
        const isFogActive = this.scene.fogOfWarSystem && this.scene.fogOfWarSystem.enabled;
        const isCurrentRound = this.roundCreated === this.scene.currentRound;
        const isOwnedByCurrentPlayer = this.owner === currentPlayer;
        const isBattlePhase = this.scene.currentPhase === PHASE.BATTLE;
        
        // Determine unit visibility based on fog of war rules and game phase
        let shouldBeVisible = true;
        
        // During battle phase, all units should be visible regardless of ownership or creation round
        if (isBattlePhase) {
            shouldBeVisible = true;
        } else if (isFogActive && !isOwnedByCurrentPlayer) {
            // If fog is active and unit belongs to opponent (outside battle phase):
            // Only show units from previous rounds (not current round)
            shouldBeVisible = !isCurrentRound;
        }
        
        // Update sprite visibility
        this.sprite.setVisible(shouldBeVisible);
        
        // A unit can be repositioned if it was created in the current round 
        // and is owned by the current player
        const canReposition = isCurrentRound && isOwnedByCurrentPlayer;
        this.highlightSprite.setVisible(canReposition && shouldBeVisible);
        this.outlineSprite.setVisible(this.isSelected && shouldBeVisible);
        
        // Force the highlight to match the unit's position exactly
        if (canReposition && shouldBeVisible) {
            this.highlightSprite.setPosition(this.sprite.x, this.sprite.y);
            this.updateHighlightColor();
        }
    }

    /**
     * Updates the unit's state in the battle phase.
     * Handles targeting, movement, and combat.
     * @param {number} time - Current game time
     * @param {number} delta - Time elapsed since last update
     */
    update(time, delta) {
        // Only process battle logic during the battle phase
        if (this.scene.currentPhase !== PHASE.BATTLE) return;
        
        // Skip if the unit is dead
        if (this.health <= 0) return;
        
        // Find a target if we don't have one or current target is dead
        if (!this.target || this.target.health <= 0) {
            this.findNearestEnemy();
        }
        
        // If we have a target, move toward it and possibly attack
        if (this.target) {
            const distance = this.getDistanceToTarget();
            
            // If in attack range, attack target
            if (distance <= this.attackRange) {
                this.attackTarget(time);
            } 
            // Otherwise, move toward target
            else {
                this.moveTowardTarget(delta);
            }
        }
    }
    
    /**
     * Finds the nearest enemy unit and sets it as the target.
     */
    findNearestEnemy() {
        let nearestDistance = Infinity;
        let nearestEnemy = null;
        
        // Iterate through all units and find the nearest enemy
        this.scene.unitSystem.unitsById.forEach(unit => {
            // Skip if this is our own unit or unit is dead
            if (unit.owner === this.owner || unit.health <= 0) return;
            
            const distance = Phaser.Math.Distance.Between(
                this.sprite.x, this.sprite.y,
                unit.sprite.x, unit.sprite.y
            );
            
            if (distance < nearestDistance) {
                nearestDistance = distance;
                nearestEnemy = unit;
            }
        });
        
        this.target = nearestEnemy;
    }
    
    /**
     * Moves the unit toward its current target.
     * @param {number} delta - Time elapsed since last update
     */
    moveTowardTarget(delta) {
        if (!this.target) return;
        
        // Calculate direction vector to target
        const dirX = this.target.sprite.x - this.sprite.x;
        const dirY = this.target.sprite.y - this.sprite.y;
        
        // Normalize direction vector
        const length = Math.sqrt(dirX * dirX + dirY * dirY);
        const normX = dirX / length;
        const normY = dirY / length;
        
        // Calculate movement distance
        const distance = this.speed * delta / 1000;
        
        // Calculate new position
        const newX = this.sprite.x + normX * distance;
        const newY = this.sprite.y + normY * distance;
        
        // Check for collisions with other units before moving
        if (!this.checkCollision(newX, newY)) {
            // Update sprite position
            this.sprite.x = newX;
            this.sprite.y = newY;
            
            // Also update highlight and outline
            if (this.highlightSprite) {
                this.highlightSprite.x = newX;
                this.highlightSprite.y = newY;
            }
            if (this.outlineSprite) {
                this.outlineSprite.x = newX;
                this.outlineSprite.y = newY;
            }
            
            // Convert world position to grid position
            const { gridX, gridY } = this.scene.gridSystem.worldToGrid(newX, newY);
            this.gridX = gridX;
            this.gridY = gridY;
        }
    }
    
    /**
     * Checks if moving to a new position would result in a collision.
     * @param {number} x - New X position
     * @param {number} y - New Y position
     * @returns {boolean} Whether a collision would occur
     */
    checkCollision(x, y) {
        // Define collision radius (smaller than grid size to allow units to get close)
        const collisionRadius = GRID.CELL_SIZE * 0.4;
        
        // Check collision with each unit
        for (const unit of this.scene.unitSystem.unitsById.values()) {
            // Skip self and dead units
            if (unit === this || unit.health <= 0) continue;
            
            // Calculate distance to unit
            const distance = Phaser.Math.Distance.Between(x, y, unit.sprite.x, unit.sprite.y);
            
            // If distance is less than collision radius, we have a collision
            if (distance < collisionRadius) {
                return true;
            }
        }
        
        return false;
    }
    
    /**
     * Attacks the current target.
     * @param {number} time - Current game time
     */
    attackTarget(time) {
        if (!this.target || this.target.health <= 0) return;
        
        // Check cooldown
        if (time - this.lastAttackTime < this.attackCooldown) return;
        
        // Update last attack time
        this.lastAttackTime = time;
        
        // Apply damage to target
        this.target.takeDamage(this.attackPower);
        
        // Simple visual feedback for attack
        this.scene.tweens.add({
            targets: this.sprite,
            scaleX: 1.2,
            scaleY: 1.2,
            duration: 100,
            yoyo: true
        });
    }
    
    /**
     * Takes damage from an attack.
     * @param {number} damage - Amount of damage to take
     */
    takeDamage(damage) {
        this.health -= damage;
        
        // If health dropped to zero or below, die
        if (this.health <= 0) {
            this.health = 0;
            this.die();
        } else {
            // Visual feedback for taking damage
            this.scene.tweens.add({
                targets: this.sprite,
                alpha: 0.5,
                duration: 100,
                yoyo: true
            });
        }
    }
    
    /**
     * Handles the unit's death.
     */
    die() {
        // Fade out the unit sprite
        this.scene.tweens.add({
            targets: [this.sprite, this.highlightSprite, this.outlineSprite],
            alpha: 0,
            duration: 500,
            onComplete: () => {
                this.sprite.visible = false;
                this.highlightSprite.visible = false;
                this.outlineSprite.visible = false;
            }
        });
        
        // Notify the unit system about the death
        // This will be implemented in the UnitSystem class
        this.scene.unitSystem.handleUnitDeath(this);
    }
    
    /**
     * Gets the distance to the current target.
     * @returns {number} Distance to target or Infinity if no target
     */
    getDistanceToTarget() {
        if (!this.target) return Infinity;
        
        return Phaser.Math.Distance.Between(
            this.sprite.x, this.sprite.y,
            this.target.sprite.x, this.target.sprite.y
        );
    }
} 