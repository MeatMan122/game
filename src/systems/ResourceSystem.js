import { RESOURCES, DEPTH } from '../configs/Constants';
import { UNIT_CONFIGS } from '../configs/UnitConfigs';

export class ResourceSystem {
    constructor(scene) {
        this.scene = scene;
        this.gold = RESOURCES.STARTING_GOLD;
        this.goldText = null;
    }

    createGoldCounter(x, y) {
        this.goldText = this.scene.add.text(
            x,
            y,
            `Gold: ${this.gold}`,
            {
                fontSize: RESOURCES.DISPLAY.FONT_SIZE,
                color: RESOURCES.DISPLAY.COLOR,
                fontStyle: RESOURCES.DISPLAY.FONT_STYLE
            }
        );
        this.goldText.setOrigin(1, 0.5);
        return this.goldText;
    }

    canAfford(unitType) {
        return this.gold >= UNIT_CONFIGS[unitType].cost;
    }

    deductCost(unitType) {
        if (this.canAfford(unitType)) {
            this.gold -= UNIT_CONFIGS[unitType].cost;
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
        const padding = RESOURCES.DISPLAY.PADDING;
        
        const feedback = this.scene.add.rectangle(
            bounds.centerX,
            bounds.centerY,
            bounds.width + padding * 2,
            bounds.height + padding * 2,
            RESOURCES.FEEDBACK.COLOR,
            RESOURCES.FEEDBACK.ALPHA
        );
        feedback.setDepth(DEPTH.UI_FOREGROUND);

        // Add a shake effect to the gold text
        this.scene.tweens.add({
            targets: this.goldText,
            x: this.goldText.x - RESOURCES.FEEDBACK.SHAKE.OFFSET,
            duration: RESOURCES.FEEDBACK.SHAKE.DURATION,
            yoyo: true,
            repeat: RESOURCES.FEEDBACK.SHAKE.REPEATS
        });

        // Fade out the feedback rectangle
        this.scene.tweens.add({
            targets: feedback,
            alpha: 0,
            duration: RESOURCES.FEEDBACK.FADE_DURATION,
            onComplete: () => feedback.destroy()
        });
    }
} 