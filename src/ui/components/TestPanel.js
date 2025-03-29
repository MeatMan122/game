import { DEPTH } from '../../configs/Constants';
import { Button } from './Button';

export class TestPanel {
    constructor(scene) {
        this.scene = scene;
        this.isExpanded = false;
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
        
        // Set initial position for closed state
        this.container.x = -this.width + 30;
        
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

        // Create toggle button with the Button component
        this.toggleButton = new Button(this.scene, {
            x: this.width - 5,
            y: this.height / 2,
            width: 30,
            height: 40,
            text: '<',
            textStyle: { fontSize: '24px', color: '#ffffff' },
            backgroundColor: 0x444444,
            hoverColor: 0x555555,
            onClick: () => this.toggle(),
            originX: 1,
            originY: 0.5
        });

        // Add elements to container
        this.container.add([this.background]);
        this.container.add(this.toggleButton.container);

        // Create content container for future elements
        this.contentContainer = this.scene.add.container(this.padding, this.padding);
        this.container.add(this.contentContainer);
    }

    initializeTestButtons() {
        this.addButton('Switch Player', () => {
            // Example functionality
            this.scene.switchPlayer();
            console.log('Player switched to: ', this.scene.currentPlayer);
        });

        this.addButton('Next Round', () => {
            this.scene.initializeNextRound();
            
        });
    }

    addButton(text, callback) {
        const button = new Button(this.scene, {
            x: 0,
            y: this.nextButtonY,
            width: this.width - (this.padding * 2),
            height: 30,
            text: text,
            textStyle: { fontSize: '16px', color: '#ffffff',padding: { x: 10, y: 10 } },
            backgroundColor: 0x555555,
            hoverColor: 0x666666,
            onClick: callback,
            originX: 0,
            originY: 0
        });
        
        this.addContent(button.container);
        
        // Update the Y position for the next button
        this.nextButtonY += 35 + this.buttonSpacing;
        
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