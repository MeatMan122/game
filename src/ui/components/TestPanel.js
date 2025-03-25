import { DEPTH } from '../../configs/Constants';

export class TestPanel {
    constructor(scene) {
        this.scene = scene;
        this.isExpanded = true;
        this.container = null;
        this.background = null;
        this.toggleButton = null;
        this.contentContainer = null;
        this.width = 200;
        this.padding = 20;
        this.buttonSpacing = 10;
        this.nextButtonY = 0;
        
        // Calculate height (80% of view height)
        this.height = this.scene.scale.height * 0.7;
        this.yOffset = this.scene.scale.height * 0.1; // 10% from top
        
        this.createPanel();
        this.initializeTestButtons();
    }

    createPanel() {
        // Create container for all panel elements
        this.container = this.scene.add.container(0, this.yOffset);
        this.container.setDepth(DEPTH.UI_ELEMENTS);

        // Create background panel
        this.background = this.scene.add.rectangle(
            0,
            0,
            this.width,
            this.height,
            0x333333,
            0.9
        );
        this.background.setOrigin(0, 0);

        // Create toggle button
        this.toggleButton = this.scene.add.text(
            this.width - 5,
            this.height / 2,
            '>',
            {
                fontSize: '24px',
                color: '#ffffff',
                backgroundColor: '#444444',
                padding: { x: 10, y: 10 }
            }
        );
        this.toggleButton.setOrigin(1, 0.5);
        this.toggleButton.setInteractive({ useHandCursor: true });
        
        // Add click handler for toggle button
        this.toggleButton.on('pointerdown', () => this.toggle());

        // Add elements to container
        this.container.add([this.background, this.toggleButton]);

        // Create content container for future elements
        this.contentContainer = this.scene.add.container(this.padding, this.padding);
        this.container.add(this.contentContainer);
    }

    initializeTestButtons() {
        // Add your test buttons here
        this.addButton('Test Button', () => {
            console.log('Test button clicked');
        });

        // Add more test buttons as needed
        this.addButton('Toggle Grid', () => {
            // Example functionality
            console.log('Grid toggled');
        });

        this.addButton('Next Round', () => {
            this.scene.currentRound++;
            console.log('Advanced to round:', this.scene.currentRound);
        });
    }

    addButton(text, callback) {
        const button = this.scene.add.text(0, this.nextButtonY, text, {
            fontSize: '16px',
            color: '#ffffff',
            backgroundColor: '#555555',
            padding: { x: 10, y: 5 }
        });
        
        button.setInteractive({ useHandCursor: true });
        button.on('pointerdown', callback);
        
        // Add hover effect
        button.on('pointerover', () => {
            button.setStyle({ backgroundColor: '#666666' });
        });
        button.on('pointerout', () => {
            button.setStyle({ backgroundColor: '#555555' });
        });

        this.addContent(button);
        
        // Update the Y position for the next button
        this.nextButtonY += button.height + this.buttonSpacing;
        
        return button;
    }

    toggle() {
        const targetX = this.isExpanded ? -this.width + 30 : 0;
        
        // Animate the container
        this.scene.tweens.add({
            targets: this.container,
            x: targetX,
            duration: 300,
            ease: 'Power2',
            onComplete: () => {
                // Update button text based on state
                this.toggleButton.setText(this.isExpanded ? '<' : '>');
                this.isExpanded = !this.isExpanded;
            }
        });
    }

    addContent(content) {
        this.contentContainer.add(content);
    }

    setVisible(visible) {
        this.container.setVisible(visible);
    }
} 