import { TIMER, DEPTH } from "../../configs/Constants";
import { Button } from "./Button";

export class CountdownTimer {
  constructor(scene, config = {}) {
    this.scene = scene;
    this.timeRemaining = config.duration || TIMER.DEFAULT_DURATION;
    this.onReady = config.onReady || (() => {});
    this.onTimeComplete = config.onTimeComplete || (() => {});
    
    this.container = scene.add.container(0, 0);
    this.container.setDepth(DEPTH.UI_FOREGROUND);
    
    this.timerText = null;
    this.timerEvent = null;
    this.readyButton = null;
    
    this.create();
  }
  
  create() {
    // Create timer text
    this.timerText = this.scene.add.text(
      this.scene.scale.width * TIMER.POSITION.X,
      TIMER.POSITION.Y,
      this.formatTime(this.timeRemaining),
      {
        fontSize: TIMER.STYLE.FONT_SIZE,
        color: TIMER.STYLE.COLOR,
        fontStyle: TIMER.STYLE.FONT_STYLE
      }
    );
    this.timerText.setOrigin(0.5, 0.5);
    
    // Create ready button using the Button component
    this.readyButton = new Button(this.scene, {
      x: this.scene.scale.width * TIMER.POSITION.X,
      y: TIMER.POSITION.Y + TIMER.READY_BUTTON.Y_OFFSET,
      width: TIMER.READY_BUTTON.WIDTH,
      height: TIMER.READY_BUTTON.HEIGHT,
      text: 'Ready',
      textStyle: {
        fontSize: '20px',
        color: TIMER.READY_BUTTON.TEXT_COLOR
      },
      backgroundColor: TIMER.READY_BUTTON.COLOR,
      hoverColor: TIMER.READY_BUTTON.HOVER_COLOR,
      depth: DEPTH.UI_ELEMENTS,
      onClick: () => this.handleReadyButtonClick()
    });
    
    // Add elements to container
    this.container.add([this.timerText]);
    this.container.add(this.readyButton.container);
    
    // Start timer
    this.start();
  }
  
  start() {
    // Clear any existing timer
    if (this.timerEvent) {
      this.timerEvent.remove();
    }
    
    // Start a new timer
    this.timerEvent = this.scene.time.addEvent({
      delay: 1000,
      callback: this.updateTimer,
      callbackScope: this,
      loop: true
    });
  }
  
  stop() {
    if (this.timerEvent) {
      this.timerEvent.remove();
      this.timerEvent = null;
    }
  }
  
  reset(duration = TIMER.DEFAULT_DURATION) {
    this.stop();
    this.timeRemaining = duration;
    this.timerText.setText(this.formatTime(this.timeRemaining));
    this.start();
  }
  
  updateTimer() {
    this.timeRemaining--;
    
    if (this.timeRemaining <= 0) {
      this.timeRemaining = 0;
      this.stop();
      this.onTimeComplete();
    }
    
    this.timerText.setText(this.formatTime(this.timeRemaining));
  }
  
  formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  }
  
  handleReadyButtonClick() {
    this.onReady();
  }
} 