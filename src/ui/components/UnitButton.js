export class UnitButton {
    constructor(scene, config) {
        this.scene = scene;
        this.config = {
            x: 0,
            y: 0,
            size: 50,
            color: 0x00ff00,
            name: 'Unit',
            textStyle: {
                fontSize: '14px',
                color: '#ffffff'
            },
            ...config
        };

        this.container = scene.add.container(0, 0);
        this.isSelected = false;
        this.createButton();
    }

    createButton() {
        // Create the button rectangle
        this.button = this.scene.add.rectangle(
            this.config.x,
            this.config.y,
            this.config.size,
            this.config.size,
            this.config.color
        );
        this.button.setInteractive();

        // Create hover text
        this.text = this.scene.add.text(
            this.config.x + this.config.size/2,
            this.config.y - this.config.size/4,
            this.config.name,
            this.config.textStyle
        );
        this.text.setOrigin(0.5);
        this.text.setVisible(false);

        // Add event listeners
        this.button.on('pointerover', () => {
            this.button.setStrokeStyle(2, 0xffffff);
            this.text.setVisible(true);
        });

        this.button.on('pointerout', () => {
            if (!this.isSelected) {
                this.button.setStrokeStyle(0);
            }
            this.text.setVisible(false);
        });

        this.button.on('pointerdown', () => {
            this.isSelected = !this.isSelected;
            this.button.setStrokeStyle(2, this.isSelected ? 0xffff00 : 0);
            if (this.config.onClick) {
                this.config.onClick(this.isSelected);
            }
        });

        // Add elements to container
        this.container.add([this.button, this.text]);
    }

    setDepth(depth) {
        this.container.setDepth(depth);
        return this;
    }

    setVisible(visible) {
        this.container.setVisible(visible);
        return this;
    }

    destroy() {
        this.container.destroy();
    }
} 