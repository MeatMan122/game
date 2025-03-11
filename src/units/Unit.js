export class Unit {
    constructor(scene, x, y, unitType) {
        this.scene = scene;
        this.unitType = unitType;
        this.id = null; // Will be set by UnitSystem
        this.sprite = null; // Will be set by createSprite
        this.isVertical = false;
        
        // Create the sprite
        this.createSprite(x, y);
    }

    createSprite(x, y) {
        this.sprite = this.scene.add.sprite(x, y, `${this.unitType}-idle`, 0);
        this.sprite.play(`${this.unitType}-idle`);
        this.sprite.setInteractive();
        this.sprite.unit = this; // Reference back to this Unit instance
        this.scene.gameContainer.add(this.sprite);
    }

    setPosition(x, y) {
        if (this.sprite) {
            this.sprite.setPosition(x, y);
        }
    }

    setAlpha(alpha) {
        if (this.sprite) {
            this.sprite.setAlpha(alpha);
        }
    }

    destroy() {
        if (this.sprite) {
            this.sprite.destroy();
            this.sprite = null;
        }
    }

    // Helper to get grid position
    getGridPosition() {
        if (!this.sprite) return null;
        return this.scene.gridSystem.worldToGrid(this.sprite.x, this.sprite.y);
    }

    toggleRotation() {
        this.isVertical = !this.isVertical;
    }
} 