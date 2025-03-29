import { DEPTH } from "../../configs/Constants";

/**
 * A customizable button component with text, background, and hover effects.
 * Supports various styling options and interaction callbacks.
 * 
 * @class
 * @property {Phaser.Scene} scene - The scene this button belongs to
 * @property {Phaser.GameObjects.Container} container - Container for button elements
 * @property {Phaser.GameObjects.Rectangle} background - Button background shape
 * @property {Phaser.GameObjects.Text} buttonText - Button text display
 * @property {number} width - Button width
 * @property {number} height - Button height
 * @property {number} x - Button x position
 * @property {number} y - Button y position
 * @property {string} text - Button text content
 * @property {number} backgroundColor - Normal background color
 * @property {number} hoverColor - Background color when hovered
 * @property {Function} onClick - Click callback function
 */
export class Button {
  /**
   * Creates a new Button instance.
   * @param {Phaser.Scene} scene - The scene this button belongs to
   * @param {Object} config - Button configuration
   * @param {number} [config.x=0] - X position
   * @param {number} [config.y=0] - Y position
   * @param {number} [config.width=100] - Button width
   * @param {number} [config.height=40] - Button height
   * @param {string} [config.text=''] - Button text
   * @param {Object} [config.textStyle] - Text style configuration
   * @param {number} [config.backgroundColor=0x666666] - Normal background color
   * @param {number} [config.hoverColor=0x888888] - Background color when hovered
   * @param {Function} [config.onClick] - Click callback function
   * @param {number} [config.depth] - Rendering depth
   * @param {number} [config.originX=0.5] - X origin point (0-1)
   * @param {number} [config.originY=0.5] - Y origin point (0-1)
   * @param {boolean} [config.isUnitStyle=false] - Whether to use unit-specific styling
   * @param {string} [config.hoverText=''] - Text to show on hover
   * @param {boolean} [config.showStrokeOnHover=false] - Whether to show stroke on hover
   * @param {number} [config.strokeColor=0xffffff] - Stroke color
   * @param {number} [config.strokeWidth=2] - Stroke width
   */
  constructor(scene, config = {}) {
    this.scene = scene;
    
    // Default values with config overrides
    this.x = config.x || 0;
    this.y = config.y || 0;
    this.width = config.width || 120;
    this.height = config.height || 40;
    this.text = config.text || 'Button';
    this.textStyle = config.textStyle || { fontSize: '20px', color: '#FFFFFF' };
    this.backgroundColor = config.backgroundColor || 0x4CAF50;
    this.hoverColor = config.hoverColor || 0x45A049;
    this.depth = config.depth || DEPTH.UI_ELEMENTS;
    this.onClick = config.onClick || (() => {});
    this.originX = config.originX ?? 0.5;
    this.originY = config.originY ?? 0;
    
    // UnitButton specific properties
    this.isUnitStyle = config.isUnitStyle || false;
    this.hoverText = config.hoverText || '';
    this.showStrokeOnHover = config.showStrokeOnHover || false;
    this.strokeColor = config.strokeColor || 0xffffff;
    this.strokeWidth = config.strokeWidth || 2;
    
    // Container for all button elements
    this.container = scene.add.container(0, 0);
    this.container.setDepth(this.depth);
    
    // Button elements
    this.background = null;
    this.buttonText = null;
    this.hoverLabel = null;
    
    this.create();
  }
  
  /**
   * Creates the button's visual elements.
   * @private
   */
  create() {
    // Create button background
    this.background = this.scene.add.rectangle(
      this.x,
      this.y,
      this.width,
      this.height,
      this.backgroundColor
    );
    this.background.setOrigin(this.originX, this.originY);
    this.background.setInteractive({ useHandCursor: true });
    
    if (this.isUnitStyle) {
      // Create hover text above the button (UnitButton style)
      this.hoverLabel = this.scene.add.text(
        this.x,
        this.y - this.height - 10,
        this.hoverText || this.text,
        {
          fontSize: '16px',
          color: '#ffffff',
          align: 'center'
        }
      );
      this.hoverLabel.setOrigin(0.5, 1);
      this.hoverLabel.setAlpha(0); // Hidden by default
      
      // Set up UnitButton style event handlers
      this.background.on('pointerover', () => {
        this.hoverLabel.setAlpha(1);
        if (this.showStrokeOnHover) {
          this.background.setStrokeStyle(this.strokeWidth, this.strokeColor);
        } else {
          this.background.fillColor = this.hoverColor;
        }
      });
      
      this.background.on('pointerout', () => {
        this.hoverLabel.setAlpha(0);
        if (this.showStrokeOnHover) {
          this.background.setStrokeStyle(0);
        } else {
          this.background.fillColor = this.backgroundColor;
        }
      });
    } else {
      // Standard button style
      // Calculate text position based on button position and origin
      const textX = this.x;
      const textY = this.y + (this.originY === 0 ? this.height / 2 : 0);
      
      // Create button text
      this.buttonText = this.scene.add.text(
        textX,
        textY,
        this.text,
        this.textStyle
      );
      this.buttonText.setOrigin(this.originX, 0.5);
      
      // Set up standard event handlers
      this.background.on('pointerover', () => {
        this.background.fillColor = this.hoverColor;
      });
      
      this.background.on('pointerout', () => {
        this.background.fillColor = this.backgroundColor;
      });
    }
    
    // Common click handler
    this.background.on('pointerdown', () => {
      this.onClick();
    });
    
    // Add elements to container
    this.container.add([this.background]);
    if (this.isUnitStyle) {
      this.container.add(this.hoverLabel);
    } else if (this.buttonText) {
      this.container.add(this.buttonText);
    }
  }
  
  setPosition(x, y) {
    // Update stored coordinates
    this.x = x;
    this.y = y;
    
    // Update background position
    this.background.setPosition(x, y);
    
    if (this.isUnitStyle && this.hoverLabel) {
      // Update hover label position
      this.hoverLabel.setPosition(x, y - this.height - 10);
    } else if (this.buttonText) {
      // Calculate text position based on button position and origin
      const textX = x;
      const textY = y + (this.originY === 0 ? this.height / 2 : 0);
      
      // Update text position
      this.buttonText.setPosition(textX, textY);
    }
    
    return this;
  }
  
  /**
   * Sets the button's text content.
   * @param {string} text - New text content
   * @returns {Button} This button instance for chaining
   */
  setText(text) {
    this.text = text;
    if (this.buttonText) {
      this.buttonText.setText(text);
    }
    return this;
  }
  
  setHoverText(text) {
    this.hoverText = text;
    if (this.hoverLabel) {
      this.hoverLabel.setText(text);
    }
    return this;
  }
  
  setBackgroundColor(color) {
    this.backgroundColor = color;
    this.background.fillColor = color;
    return this;
  }
  
  /**
   * Sets the button's hover background color.
   * @param {number} color - Color value in hex format
   * @returns {Button} This button instance for chaining
   */
  setHoverColor(color) {
    this.hoverColor = color;
    return this;
  }
  
  /**
   * Sets the button's click callback function.
   * @param {Function} callback - Function to call when button is clicked
   * @returns {Button} This button instance for chaining
   */
  setCallback(callback) {
    this.onClick = callback;
    return this;
  }
  
  /**
   * Sets the button's visibility.
   * @param {boolean} visible - Whether the button should be visible
   * @returns {Button} This button instance for chaining
   */
  setVisible(visible) {
    this.container.setVisible(visible);
    return this;
  }
  
  /**
   * Sets the button's transparency.
   * @param {number} alpha - Transparency value (0-1)
   * @returns {Button} This button instance for chaining
   */
  setAlpha(alpha) {
    this.container.setAlpha(alpha);
    return this;
  }
  
  /**
   * Sets the button's depth in the scene.
   * @param {number} depth - Depth value for rendering order
   * @returns {Button} This button instance for chaining
   */
  setDepth(depth) {
    this.container.setDepth(depth);
    return this;
  }
  
  /**
   * Removes the button and its elements from the scene.
   */
  destroy() {
    this.container.destroy();
  }
} 