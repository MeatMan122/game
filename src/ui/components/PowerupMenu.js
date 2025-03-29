import { DEPTH, PHASE } from '../../configs/Constants';

export class PowerupMenu {
    constructor(scene) {
        this.scene = scene;
        this.container = null;
        this.modalBg = null;
        this.showButton = null;
    }

    create() {
        // Create semi-transparent background
        this.modalBg = this.scene.add.rectangle(
            0, 0,
            this.scene.scale.width,
            this.scene.scale.height,
            0x000000,
            0.5
        );
        this.modalBg.setOrigin(0);
        this.modalBg.setDepth(DEPTH.UI_BACKGROUND);
        this.modalBg.setInteractive();

        // Create container for menu elements
        this.container = this.scene.add.container(
            this.scene.scale.width / 2,
            this.scene.scale.height / 2
        );
        this.container.setDepth(DEPTH.UI_ELEMENTS);

        this.createPowerupChoices();
        this.createHideButton();
    }

    createPowerupChoices() {
        const choices = ['Powerup 1', 'Powerup 2', 'Powerup 3', 'Powerup 4'];
        const buttonWidth = 150;
        const buttonHeight = 100;
        const spacing = 20;

        choices.forEach((choice, index) => {
            const x = (index - 1.5) * (buttonWidth + spacing);
            const button = this.scene.add.rectangle(
                x, 0,
                buttonWidth, buttonHeight,
                0x4CAF50
            );
            button.setInteractive();

            const text = this.scene.add.text(
                x, 0,
                choice,
                { fontSize: '20px', color: '#ffffff' }
            );
            text.setOrigin(0.5);

            button.on('pointerdown', () => this.handleSelection(choice));
            button.on('pointerover', () => button.setScale(1.05));
            button.on('pointerout', () => button.setScale(1));

            this.container.add([button, text]);
        });
    }

    createHideButton() {
        const button = this.scene.add.rectangle(
            0, 100,
            200, 40,
            0x666666
        );
        button.setInteractive();

        const text = this.scene.add.text(
            0, 100,
            'Hide Powerup Menu',
            { fontSize: '16px', color: '#ffffff' }
        );
        text.setOrigin(0.5);

        button.on('pointerdown', () => this.hide());
        this.container.add([button, text]);
    }

    createShowButton() {
        this.showButton = this.scene.add.container(
            this.scene.scale.width / 2,
            30
        );
        this.showButton.setDepth(DEPTH.UI_ELEMENTS);

        const button = this.scene.add.rectangle(
            0, 0,
            200, 40,
            0x666666
        );
        button.setInteractive();

        const text = this.scene.add.text(
            0, 0,
            'Show Powerup Menu',
            { fontSize: '16px', color: '#ffffff' }
        );
        text.setOrigin(0.5);

        button.on('pointerdown', () => this.show());
        this.showButton.add([button, text]);
    }

    hide() {
        this.modalBg.setVisible(false);
        this.container.setVisible(false);
        this.createShowButton();
    }

    show() {
        this.modalBg.setVisible(true);
        this.container.setVisible(true);
        if (this.showButton) {
            this.showButton.destroy();
            this.showButton = null;
        }
    }

    handleSelection(choice) {
        console.log(`Selected powerup: ${choice}`);
        this.scene.handleRoundPhaseChange(PHASE.PLANNING);
        this.destroy();
    }

    destroy() {
        if (this.modalBg) this.modalBg.destroy();
        if (this.container) this.container.destroy();
        if (this.showButton) this.showButton.destroy();
    }
} 