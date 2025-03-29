import { TIMER, DEPTH, PLAYERS } from "../../configs/Constants";
import { Button } from "./Button";

/**
 * A countdown timer with ready button functionality.
 * Used to manage round timing and player readiness.
 * 
 * @class
 * @property {import('../../scenes/Game').Game} scene - The scene this timer belongs to
 * @property {number} timeRemaining - Current time remaining in seconds
 * @property {Phaser.Time.TimerEvent} timerEvent - Timer event for countdown
 * @property {Phaser.GameObjects.Text} timerText - Text display for countdown
 * @property {Button} readyButton - Button for player ready state
 * @property {boolean} isReady - Whether the player is ready
 */
export class CountdownTimer {
  /**
   * Creates a new CountdownTimer instance.
   * @param {import('../../scenes/Game').Game} scene - The scene this timer belongs to
   * @param {Object} [config={}] - Timer configuration
   * @param {number} [config.duration=TIMER.DEFAULT_DURATION] - Initial duration in seconds
   * @param {Function} [config.onComplete] - Callback when timer completes
   * @param {Function} [config.onReady] - Callback when player clicks ready
   * @param {Function} [config.onTimeComplete] - Callback when time runs out
   * @param {Function} [config.onBothPlayersReady] - Callback when both players are ready
   */
  constructor(scene, config = {}) {
    this.scene = scene;
    this.timeRemaining = config.duration || TIMER.DEFAULT_DURATION;
    this.onReady = config.onReady || (() => { });
    this.onTimeComplete = config.onTimeComplete || (() => { });
    this.onBothPlayersReady = config.onBothPlayersReady || (() => { });

    this.container = scene.add.container(0, 0);
    this.container.setDepth(DEPTH.UI_FOREGROUND);

    this.timerText = null;
    this.timerEvent = null;
    this.readyButton = null;

    // Player ready indicators
    this.player1Ready = false;
    this.player2Ready = false;
    this.player1Indicator = null;
    this.player2Indicator = null;

    this.create();
  }

  /**
   * Creates the timer's visual elements and ready button.
   * @private
   */
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

    this.createPlayerReadyIndicators();


    // Add elements to container
    this.container.add([
      this.timerText
    ]);
    this.container.add(this.readyButton.container);

    // Start timer
    this.start();
  }

  createPlayerReadyIndicators() {
    // Create player ready indicators
    const indicatorHeight = 10;
    const indicatorSpacing = 10;
    const totalIndicatorWidth = TIMER.READY_BUTTON.WIDTH;
    const singleIndicatorWidth = (totalIndicatorWidth - indicatorSpacing) / 2;
    const indicatorY = TIMER.POSITION.Y + TIMER.READY_BUTTON.Y_OFFSET + TIMER.READY_BUTTON.HEIGHT;

    // Calculate indicator positions
    const centerX = this.scene.scale.width * TIMER.POSITION.X;
    const player1X = centerX - (singleIndicatorWidth / 2 + indicatorSpacing / 2);
    const player2X = centerX + (singleIndicatorWidth / 2 + indicatorSpacing / 2);

    // Player 1 indicator (left side)
    this.player1Indicator = this.scene.add.rectangle(
      player1X,
      indicatorY,
      singleIndicatorWidth,
      indicatorHeight,
      0x777777, // Gray when not ready
      1
    );
    this.player1Indicator.setOrigin(0.5, 0);


    // Player 2 indicator (right side)
    this.player2Indicator = this.scene.add.rectangle(
      player2X,
      indicatorY,
      singleIndicatorWidth,
      indicatorHeight,
      0x777777, // Gray when not ready
      1
    );
    this.player2Indicator.setOrigin(0.5, 0);
    this.container.add([this.player1Indicator, this.player2Indicator]);
  }

  /**
   * Starts the countdown timer.
   * @param {number} [duration=TIMER.DEFAULT_DURATION] - Duration in seconds
   */
  start(duration = TIMER.DEFAULT_DURATION) {
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

  /**
   * Stops the countdown timer.
   */
  stop() {
    if (this.timerEvent) {
      this.timerEvent.remove();
      this.timerEvent = null;
    }
  }

  /**
   * Resets the timer to initial state.
   * @param {number} [duration=TIMER.DEFAULT_DURATION] - New duration in seconds
   */
  reset(duration = TIMER.DEFAULT_DURATION) {
    this.stop();
    this.timeRemaining = duration;
    this.timerText.setText(this.formatTime(this.timeRemaining));
    this.start();
  }

  /**
   * Resets the ready button state.
   */
  resetReadyStatus() {
    this.player1Ready = false;
    this.player2Ready = false;
    this.player1Indicator.fillColor = 0x777777;
    this.player2Indicator.fillColor = 0x777777;
  }

  /**
   * Updates the timer display and checks for completion.
   * @private
   */
  updateTimer() {
    this.timeRemaining--;

    if (this.timeRemaining <= 0) {
      this.timeRemaining = 0;
      this.stop();
      this.onTimeComplete();
    }

    this.timerText.setText(this.formatTime(this.timeRemaining));
  }

  /**
   * Formats seconds into MM:SS display format.
   * @param {number} seconds - Time in seconds
   * @returns {string} Formatted time string
   * @private
   */
  formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  }

  /**
   * Handles ready button click event.
   * @private
   */
  handleReadyButtonClick() {
    // Determine which player clicked ready based on the current player in the game
    const currentPlayer = this.scene.currentPlayer;

    if (currentPlayer === PLAYERS.PLAYER_ONE) {
      this.player1Ready = true;
      this.player1Indicator.fillColor = 0x00FF00; // Green for ready
    } else if (currentPlayer === PLAYERS.PLAYER_TWO) {
      this.player2Ready = true;
      this.player2Indicator.fillColor = 0x00FF00; // Green for ready
    }
    // Notify game about ready status
    this.onReady();
  }
} 