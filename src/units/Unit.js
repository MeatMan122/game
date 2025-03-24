import { GRID } from '../configs/Constants';

export class Unit {
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
        
        // Create the sprite
        this.createSprite();
    }

    createSprite() {
        // Create a highlight background (will be visible only when unit can be repositioned)
        // scene.add.rectangle(x, y, width, height, fillColor, fillAlpha)
        this.highlightSprite = this.scene.add.rectangle(0, 0, GRID.CELL_SIZE, GRID.CELL_SIZE, 0xfce303, 0.4);
        this.highlightSprite.setVisible(false); // Hidden by default
        this.scene.gameContainer.add(this.highlightSprite);
        
        // Set highlight to a lower depth so it appears behind the unit sprite
        this.highlightSprite.setDepth(-1);
        
        // Create the unit sprite
        this.sprite = this.scene.add.sprite(0, 0, `${this.unitType}-idle`, 0);
        this.sprite.play(`${this.unitType}-idle`);
        this.sprite.setInteractive();
        this.sprite.unit = this; // Reference back to this Unit instance
        this.scene.gameContainer.add(this.sprite);
        this.sprite.setDepth(0); // Ensure unit is above the highlight
        
        // Set up event handlers
        this.setupEventHandlers();
        
        // Update highlight visibility based on whether unit can be repositioned
        this.updateHighlight();
    }

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
    
    handleDoubleClick(pointer) {
        const unitSystem = this.scene.unitSystem;
        const group = unitSystem.getUnitGroup(this.gridX, this.gridY);
        
        if (group && group.canReposition) {
            unitSystem.startRepositioningGroup(group);
        }
    }

    setPosition(x, y) {
        if (this.sprite) {
            this.sprite.setPosition(x, y);
            // Move the highlight sprite with the unit
            if (this.highlightSprite) {
                this.highlightSprite.setPosition(x, y);
            }
            const { gridX, gridY } = this.scene.gridSystem.worldToGrid(x, y);
            this.gridX = gridX;
            this.gridY = gridY;
        }
    }

    setAlpha(alpha) {
        if (this.sprite) {
            this.sprite.setAlpha(alpha);
        }
    }

    setSelected(selected) {
        this.isSelected = selected;
        // Visual indicator for selection could be added here
    }

    setRepositioning(repositioning) {
        this.isRepositioning = repositioning;
        this.setAlpha(repositioning ? 0.5 : 1.0);
    }

    destroy() {
        if (this.highlightSprite) {
            this.highlightSprite.destroy();
            this.highlightSprite = null;
        }
        if (this.sprite) {
            this.sprite.destroy();
            this.sprite = null;
        }
    }

    // Helper to get grid position
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

    // Update grid position
    updateGridPosition(gridX, gridY) {
        this.gridX = gridX;
        this.gridY = gridY;
    }

    toggleRotation() {
        if (this.isRepositioning) {
            this.isVertical = !this.isVertical;
        } 
    }

    // Update the highlight visibility based on whether the unit can be repositioned
    updateHighlight() {
        // A unit can be repositioned if it was created in the current round
        const canReposition = this.roundCreated === this.scene.currentRound;
        this.highlightSprite.setVisible(canReposition);
        
        // Force the highlight to match the unit's position exactly
        if (canReposition && this.sprite) {
            this.highlightSprite.setPosition(this.sprite.x, this.sprite.y);
        }
    }
} 