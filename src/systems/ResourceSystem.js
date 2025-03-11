export class ResourceSystem {
    constructor(scene) {
        this.scene = scene;
        this.STARTING_GOLD = 200;
        this.UNIT_COSTS = {
            archer: 50,
            warrior: 50
        };
        this.gold = this.STARTING_GOLD;
        this.goldText = null;
    }

    createGoldCounter(x, y) {
        this.goldText = this.scene.add.text(
            x,
            y,
            `Gold: ${this.gold}`,
            {
                fontSize: '24px',
                color: '#FFD700',
                fontStyle: 'bold'
            }
        );
        this.goldText.setOrigin(1, 0.5);
        return this.goldText;
    }

    canAfford(unitType) {
        return this.gold >= this.UNIT_COSTS[unitType];
    }

    deductCost(unitType) {
        if (this.canAfford(unitType)) {
            this.gold -= this.UNIT_COSTS[unitType];
            this.updateGoldDisplay();
            return true;
        }
        return false;
    }

    updateGoldDisplay() {
        if (this.goldText) {
            this.goldText.setText(`Gold: ${this.gold}`);
        }
    }

    showInsufficientGoldFeedback() {
        const bounds = this.goldText.getBounds();
        const padding = 10;
        
        const feedback = this.scene.add.rectangle(
            bounds.centerX,
            bounds.centerY,
            bounds.width + padding * 2,
            bounds.height + padding * 2,
            0xff0000,
            0.3
        );
        feedback.setDepth(102);

        // Add a shake effect to the gold text
        this.scene.tweens.add({
            targets: this.goldText,
            x: this.goldText.x - 5,
            duration: 50,
            yoyo: true,
            repeat: 2
        });

        // Fade out the feedback rectangle
        this.scene.tweens.add({
            targets: feedback,
            alpha: 0,
            duration: 300,
            onComplete: () => feedback.destroy()
        });
    }
} 