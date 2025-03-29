import { DEPTH, PHASE, POWERUP_MENU, TIMER } from '../../configs/Constants';

/**
 * A modal menu that displays powerup choices between rounds.
 * Features an expandable/collapsible interface that can be shown/hidden,
 * with smooth animations for transitions.
 * 
 * @class
 * @property {import('../../scenes/Game').Game} scene - The scene this menu belongs to
 * @property {Phaser.GameObjects.Container} container - Container for all menu elements
 * @property {Phaser.GameObjects.Rectangle} modalBg - The background rectangle for the modal
 * @property {Phaser.GameObjects.Container} showButton - The button that appears when menu is hidden
 */
export class PowerupMenu {
    /**
     * Creates a new PowerupMenu instance.
     * @param {import('../../scenes/Game').Game} scene - The scene this menu belongs to
     */
    constructor(scene) {
        this.scene = scene;
        this.container = null;
        this.modalBg = null;
        this.showButton = null;
        
        // Calculate required width for buttons
        const totalButtonWidth = (POWERUP_MENU.CHOICE_BUTTON.WIDTH * 4) + 
                               (POWERUP_MENU.CHOICE_BUTTON.SPACING * 3) +
                               (POWERUP_MENU.MODAL.INNER_PADDING * 2);
        
        // Calculate modal dimensions ensuring it fits the buttons
        const margin = POWERUP_MENU.MODAL.SCREEN_MARGIN;
        this.modalWidth = Math.max(
            this.scene.scale.width * (1 - 2 * margin),
            totalButtonWidth
        );
        this.modalHeight = this.scene.scale.height * (1 - 2 * margin);
        this.modalX = (this.scene.scale.width - this.modalWidth) / 2;
        this.modalY = this.scene.scale.height * margin;
    }

    /**
     * Creates and initializes all menu elements.
     * Sets up the modal background, container, and animates the menu in.
     */
    create() {
        // Create opaque background for modal
        this.modalBg = this.scene.add.rectangle(
            this.modalX,
            this.modalY,
            this.modalWidth,
            this.modalHeight,
            POWERUP_MENU.BACKGROUND.COLOR,
            POWERUP_MENU.BACKGROUND.ALPHA
        );
        this.modalBg.setOrigin(0);
        this.modalBg.setDepth(DEPTH.UI_FULLSCREEN);
        this.modalBg.setInteractive();

        // Create container for menu elements
        this.container = this.scene.add.container(
            this.modalX + this.modalWidth / 2,
            this.modalY + this.modalHeight / 2
        );
        this.container.setDepth(DEPTH.UI_FULLSCREEN);

        this.createPowerupChoices();
        this.createHideButton();

        // Start animation
        this.animateIn();
    }

    /**
     * Animates the menu sliding in from above the screen.
     * @private
     */
    animateIn() {
        // Start from above screen
        const startY = -this.modalHeight;
        this.modalBg.y = startY;
        this.container.y = startY + this.modalHeight / 2;

        // Slide down animation
        this.scene.tweens.add({
            targets: [this.modalBg],
            y: this.modalY,
            duration: POWERUP_MENU.ANIMATION.SLIDE_DURATION,
            ease: 'Power2',
        });

        // Animate container in sync with background
        this.scene.tweens.add({
            targets: [this.container],
            y: this.modalY + this.modalHeight / 2,
            duration: POWERUP_MENU.ANIMATION.SLIDE_DURATION,
            ease: 'Power2'
        });
    }

    /**
     * Creates the powerup choice buttons and adds them to the container.
     * Each button includes hover effects and selection handling.
     * @private
     */
    createPowerupChoices() {
        const choices = ['Powerup 1', 'Powerup 2', 'Powerup 3', 'Powerup 4'];
        const buttonWidth = POWERUP_MENU.CHOICE_BUTTON.WIDTH;
        const buttonHeight = POWERUP_MENU.CHOICE_BUTTON.HEIGHT;
        const spacing = POWERUP_MENU.CHOICE_BUTTON.SPACING;

        choices.forEach((choice, index) => {
            const x = (index - 1.5) * (buttonWidth + spacing);
            const button = this.scene.add.rectangle(
                x, 0,
                buttonWidth, buttonHeight,
                POWERUP_MENU.CHOICE_BUTTON.COLOR
            );
            button.setInteractive();

            const text = this.scene.add.text(
                x, 0,
                choice,
                {
                    fontSize: POWERUP_MENU.CHOICE_BUTTON.TEXT.FONT_SIZE,
                    color: POWERUP_MENU.CHOICE_BUTTON.TEXT.COLOR
                }
            );
            text.setOrigin(0.5);

            button.on('pointerdown', () => this.handleSelection(choice));
            button.on('pointerover', () => button.setScale(1.05));
            button.on('pointerout', () => button.setScale(1));

            this.container.add([button, text]);
        });
    }

    /**
     * Creates the hide button at the bottom of the menu.
     * @private
     */
    createHideButton() {
        const button = this.scene.add.rectangle(
            0, 100,
            POWERUP_MENU.SHOW_BUTTON.WIDTH,
            POWERUP_MENU.SHOW_BUTTON.HEIGHT,
            POWERUP_MENU.SHOW_BUTTON.COLOR
        );
        button.setInteractive();

        const text = this.scene.add.text(
            0, 100,
            'Hide Powerup Menu',
            {
                fontSize: POWERUP_MENU.SHOW_BUTTON.TEXT.FONT_SIZE,
                color: POWERUP_MENU.SHOW_BUTTON.TEXT.COLOR
            }
        );
        text.setOrigin(0.5);

        button.on('pointerdown', () => this.hide());
        this.container.add([button, text]);
    }

    /**
     * Creates the show button that appears when the menu is hidden.
     * Positioned relative to the timer.
     * @private
     */
    createShowButton() {
        // Position to the right of the timer
        const timerCenterX = this.scene.scale.width * TIMER.POSITION.X;
        const buttonX = timerCenterX + TIMER.READY_BUTTON.WIDTH / 2 + POWERUP_MENU.SHOW_BUTTON.POSITION.X_OFFSET;
        
        this.showButton = this.scene.add.container(
            buttonX,
            TIMER.POSITION.Y
        );
        this.showButton.setDepth(DEPTH.UI_FULLSCREEN);

        const button = this.scene.add.rectangle(
            0, 0,
            POWERUP_MENU.SHOW_BUTTON.WIDTH,
            POWERUP_MENU.SHOW_BUTTON.HEIGHT,
            POWERUP_MENU.SHOW_BUTTON.COLOR
        );
        button.setInteractive();

        const text = this.scene.add.text(
            0, 0,
            'Show Powerup Menu',
            {
                fontSize: POWERUP_MENU.SHOW_BUTTON.TEXT.FONT_SIZE,
                color: POWERUP_MENU.SHOW_BUTTON.TEXT.COLOR
            }
        );
        text.setOrigin(0.5);

        button.on('pointerdown', () => this.show());
        this.showButton.add([button, text]);
    }

    /**
     * Animates the menu collapsing into the show button position.
     * Hides the menu elements and creates the show button when complete.
     */
    hide() {
        // Get the final position of the show button
        const timerCenterX = this.scene.scale.width * TIMER.POSITION.X;
        const buttonX = timerCenterX + TIMER.READY_BUTTON.WIDTH / 2 + POWERUP_MENU.SHOW_BUTTON.POSITION.X_OFFSET;

        // Collapse animation
        this.scene.tweens.add({
            targets: [this.modalBg],
            x: buttonX - POWERUP_MENU.SHOW_BUTTON.WIDTH / 2,
            y: TIMER.POSITION.Y - POWERUP_MENU.SHOW_BUTTON.HEIGHT / 2,
            width: POWERUP_MENU.SHOW_BUTTON.WIDTH,
            height: POWERUP_MENU.SHOW_BUTTON.HEIGHT,
            duration: POWERUP_MENU.ANIMATION.COLLAPSE.DURATION,
            ease: POWERUP_MENU.ANIMATION.COLLAPSE.EASE,
            onComplete: () => {
                this.modalBg.setVisible(false);
                this.container.setVisible(false);
                this.createShowButton();
            }
        });

        // Fade out container
        this.scene.tweens.add({
            targets: [this.container],
            alpha: 0,
            duration: POWERUP_MENU.ANIMATION.COLLAPSE.DURATION,
            ease: POWERUP_MENU.ANIMATION.COLLAPSE.EASE
        });
    }

    /**
     * Expands the menu from the show button position.
     * Destroys the show button and displays the full menu with animation.
     */
    show() {
        // Make elements visible
        this.modalBg.setVisible(true);
        this.container.setVisible(true);
        this.container.setAlpha(1); // Set alpha to 1 since we're not fading

        // Get current button position
        const timerCenterX = this.scene.scale.width * TIMER.POSITION.X;
        const buttonX = timerCenterX + TIMER.READY_BUTTON.WIDTH / 2 + POWERUP_MENU.SHOW_BUTTON.POSITION.X_OFFSET;

        // Set initial position (at show button)
        this.modalBg.x = buttonX - POWERUP_MENU.SHOW_BUTTON.WIDTH / 2;
        this.modalBg.y = TIMER.POSITION.Y - POWERUP_MENU.SHOW_BUTTON.HEIGHT / 2;
        this.modalBg.width = POWERUP_MENU.SHOW_BUTTON.WIDTH;
        this.modalBg.height = POWERUP_MENU.SHOW_BUTTON.HEIGHT;

        // Set container's initial position to match the show button
        this.container.x = buttonX;
        this.container.y = TIMER.POSITION.Y;
        this.container.setScale(POWERUP_MENU.SHOW_BUTTON.WIDTH / this.modalWidth);

        // Expand animation for background
        this.scene.tweens.add({
            targets: [this.modalBg],
            x: this.modalX,
            y: this.modalY,
            width: this.modalWidth,
            height: this.modalHeight,
            duration: POWERUP_MENU.ANIMATION.COLLAPSE.DURATION,
            ease: POWERUP_MENU.ANIMATION.COLLAPSE.EASE
        });

        // Expand and move container in sync with background
        this.scene.tweens.add({
            targets: [this.container],
            x: this.modalX + this.modalWidth / 2,
            y: this.modalY + this.modalHeight / 2,
            scale: 1,
            duration: POWERUP_MENU.ANIMATION.COLLAPSE.DURATION,
            ease: POWERUP_MENU.ANIMATION.COLLAPSE.EASE
        });

        if (this.showButton) {
            this.showButton.destroy();
            this.showButton = null;
        }
    }

    /**
     * Handles powerup selection, advances game phase, and destroys the menu.
     * @param {string} choice - The selected powerup option
     */
    handleSelection(choice) {
        console.log(`Selected powerup: ${choice}`);
        this.scene.handleRoundPhaseChange(PHASE.PLANNING);
        this.destroy();
    }

    /**
     * Cleans up all menu elements and removes them from the scene.
     */
    destroy() {
        if (this.modalBg) this.modalBg.destroy();
        if (this.container) this.container.destroy();
        if (this.showButton) this.showButton.destroy();
    }
} 