export class UnitButton {
    constructor(scene, config) {
        this.scene = scene;
        this.x = config.x;
        this.y = config.y;
        this.size = config.size;
        this.color = config.color;
        this.name = config.name.charAt(0).toUpperCase() + config.name.slice(1);
        this.onClick = config.onClick;
        this.isSelected = false;
        
        this.container = this.scene.add.container(0, 0);
        this.createButton();
    }

    createButton() {
        // Create the button rectangle
        this.button = this.scene.add.rectangle(this.x, this.y, this.size, this.size, this.color);
        this.button.setInteractive();
        
        // Create hover text
        this.text = this.scene.add.text(this.x, this.y - this.size - 10, this.name, {
            fontSize: '16px',
            color: '#ffffff',
            align: 'center'
        });
        this.text.setOrigin(0.5, 1);
        this.text.setAlpha(0);

        // Add event listeners
        this.button.on('pointerover', () => {
            this.text.setAlpha(1);
            if (!this.isSelected) {
                this.button.setStrokeStyle(2, 0xffffff);
            }
        });

        this.button.on('pointerout', () => {
            this.text.setAlpha(0);
            if (!this.isSelected) {
                this.button.setStrokeStyle(0);
            }
        });

        this.button.on('pointerdown', () => {
            this.setSelected(!this.isSelected);
            if (this.onClick) {
                this.onClick(this.isSelected);
            }
        });

        // Add elements to container
        this.container.add([this.button, this.text]);
    }

    setSelected(selected) {
        this.isSelected = selected;
        this.button.setStrokeStyle(selected ? 2 : 0, 0xffffff);
    }

    setDepth(depth) {
        this.container.setDepth(depth);
    }

    setVisible(visible) {
        this.container.setVisible(visible);
        return this;
    }

    destroy() {
        this.container.destroy();
    }
} 