import { DEPTH, OPENING_MENU, PHASE } from '../../configs/Constants';

/**
 * Full-screen menu displayed at the start of the game for initial choices.
 * Allows players to select their starting general/configuration.
 * 
 * @class
 * @property {import('../../scenes/Game').Game} scene - The scene this menu belongs to
 * @property {Object} config - Menu configuration options
 * @property {number} config.backgroundColor - Background color
 * @property {number} config.backgroundAlpha - Background transparency
 * @property {Phaser.GameObjects.Rectangle} modalBg - Full-screen background
 * @property {Phaser.GameObjects.Container} container - Container for menu elements
 */
export class OpeningPhaseMenu {
    /**
     * Creates a new OpeningPhaseMenu instance.
     * @param {import('../../scenes/Game').Game} scene - The scene this menu belongs to
     * @param {Object} [config={}] - Menu configuration
     * @param {number} [config.backgroundColor=0x000000] - Background color
     * @param {number} [config.backgroundAlpha=0.8] - Background transparency
     */
    constructor(scene, config = {}) {
        this.scene = scene;
        this.container = null;
        this.modalBg = null;
        this.config = {
            backgroundColor: OPENING_MENU.BACKGROUND.COLOR,
            backgroundAlpha: OPENING_MENU.BACKGROUND.ALPHA,
            ...config
        };
    }

    /**
     * Creates and initializes all menu elements.
     */
    create() {
        // Create modal background
        this.modalBg = this.scene.add.rectangle(
            0, 0,
            this.scene.scale.width,
            this.scene.scale.height,
            this.config.backgroundColor,
            this.config.backgroundAlpha
        );
        this.modalBg.setOrigin(0);
        this.modalBg.setDepth(DEPTH.UI_FULLSCREEN);

        // Create container for menu elements
        this.container = this.scene.add.container(0, 0);
        this.container.setDepth(DEPTH.UI_FULLSCREEN);

        this.createChoiceButtons();
    }

    /**
     * Creates the choice buttons and adds them to the container.
     * @private
     */
    createChoiceButtons() {
        const choices = ['Choice 1', 'Choice 2', 'Choice 3', 'Choice 4'];
        const buttonWidth = OPENING_MENU.CHOICE_BUTTON.WIDTH;
        const buttonHeight = OPENING_MENU.CHOICE_BUTTON.HEIGHT;
        const spacing = OPENING_MENU.CHOICE_BUTTON.SPACING;

        // Calculate total width of all buttons and spacing
        const totalWidth = (buttonWidth * choices.length) + (spacing * (choices.length - 1));
        const startX = (this.scene.scale.width - totalWidth) / 2;
        const centerY = this.scene.scale.height / 2;

        choices.forEach((choice, index) => {
            const x = startX + (buttonWidth + spacing) * index;
            const buttonContainer = this.scene.add.container(x, centerY);

            // Create background rectangle
            const button = this.scene.add.rectangle(
                buttonWidth / 2,
                0,
                buttonWidth,
                buttonHeight,
                OPENING_MENU.CHOICE_BUTTON.COLORS[index]
            );
            button.setInteractive();

            // Optional background sprite (commented out for now)
            // const sprite = this.scene.add.sprite(buttonWidth / 2, 0, 'choice-background-' + index);
            // sprite.setDisplaySize(buttonWidth, buttonHeight);
            // if (!sprite.texture.key) {
            //     sprite.destroy();
            // }

            const text = this.scene.add.text(
                buttonWidth / 2,
                0,
                choice,
                {
                    fontSize: OPENING_MENU.CHOICE_BUTTON.TEXT.FONT_SIZE,
                    color: OPENING_MENU.CHOICE_BUTTON.TEXT.COLOR,
                    align: 'center'
                }
            );
            text.setOrigin(0.5);

            // Handle button click
            button.on('pointerdown', () => {
                console.log(`Selected ${choice}`);
                this.handleSelection(choice);
            });

            // Hover effects
            button.on('pointerover', () => {
                button.setScale(1.05);
                text.setScale(1.05);
            });
            button.on('pointerout', () => {
                button.setScale(1);
                text.setScale(1);
            });

            buttonContainer.add([button, text]);
            this.container.add(buttonContainer);
        });
    }

    /**
     * Handles choice selection and advances to the next phase.
     * @param {string} choice - The selected choice
     * @private
     */
    handleSelection(choice) {
        // TODO: Store selection in game state when implemented
        console.log(`Selected choice: ${choice}`);
        this.scene.handleRoundPhaseChange(PHASE.POWERUP);
        this.destroy();
    }

    /**
     * Removes the menu and its elements from the scene.
     */
    destroy() {
        if (this.modalBg) this.modalBg.destroy();
        if (this.container) this.container.destroy();
    }
} 