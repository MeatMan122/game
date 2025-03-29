export const GRID = {
    CELL_SIZE: 32,
    WIDTH: 75,
    HEIGHT: 75,
    BASE_PADDING: 120,
    EXTRA_BOTTOM: 130,
    PADDING: {
        TOP: 250,// BASE_PADDING + EXTRA_BOTTOM
        RIGHT: 120,
        BOTTOM: 250, // BASE_PADDING + EXTRA_BOTTOM
        LEFT: 120
    }
};

export const TERRITORY = {
    NO_MANS_LAND_HEIGHT: 9,
    TERRITORY_HEIGHT: 33, // Math.floor((GRID.HEIGHT - NO_MANS_LAND_HEIGHT) / 2)
    DEPLOYMENT_ZONE: {
        SIZE: 21,
        PADDING: 27 // (GRID.WIDTH - SIZE) / 2
    }
};

export const UI = {
    PANEL_HEIGHT: 100,
    BUTTON: {
        PADDING: 50,
        SPACING: 70,
        SIZE: 50
    }
};

export const RESOURCES = {
    STARTING_GOLD: 250,
    DISPLAY: {
        FONT_SIZE: '24px',
        COLOR: '#FFD700',
        FONT_STYLE: 'bold',
        PADDING: 10
    },
    FEEDBACK: {
        COLOR: 0xff0000,
        ALPHA: 0.3,
        SHAKE: {
            OFFSET: 5,
            DURATION: 50,
            REPEATS: 2
        },
        FADE_DURATION: 300
    }
};

export const CAMERA = {
    MOVE_SPEED: 16,
    MIN_ZOOM: 0.5,
    MAX_ZOOM: 2,
    ZOOM_STEP: 0.1,
    DEFAULT_ZOOM: 0.75
};

export const ANIMATION = {
    FEEDBACK_DURATION: 300
};

export const TERRITORY_COLORS = {
    PLAYER_TWO: { color: 0xff0000, alpha: 0.1 },
    NO_MANS_LAND: { color: 0xffff00, alpha: 0.1 },
    PLAYER: { color: 0x0000ff, alpha: 0.1 },
    DEPLOYMENT: { color: 0x00ff00, alpha: 0.2 }
};

export const GRID_STYLE = {
    LINE_WIDTH: 1,
    LINE_COLOR: 0x666666,
    LINE_ALPHA: 0.8,
    TERRITORY_BORDER_WIDTH: 2,
    TERRITORY_BORDER_COLOR: 0xffffff,
    TERRITORY_BORDER_ALPHA: 0.8
};

export const UNIT = {
    PREVIEW: {
        VALID_ALPHA: 0.6,
        INVALID_ALPHA: 0.2
    },
    FEEDBACK: {
        COLOR: 0xff0000,
        ALPHA: 0.3
    }
};

export const GAME = {
    BACKGROUND_COLOR: '#028af8',
    UI: {
        MENU: {
            BACKGROUND: {
                COLOR: 0x333333,
                ALPHA: 0.8
            }
        }
    },
    DEBUG: {
        LOG_DEBOUNCE: 2000
    }
};

// Depth constants for rendering layers
// Each layer is spaced by 5 to allow for intermediate layers if needed
export const DEPTH = {
    BACKGROUND: 0,
    HIGHLIGHTS: 5,
    SELECTION:6,
    GROUND_UNITS: 10,
    FLYING_UNITS: 15,
    EFFECTS: 20,
    UI_BACKGROUND: 95,
    UI_ELEMENTS: 100,
    UI_FOREGROUND: 105,
    TOOLTIP: 110,
    UI_FULLSCREEN: 115
}; 

export const PLAYERS = {
    PLAYER_ONE: 'playerOne',
    PLAYER_TWO: 'playerTwo'
};

export const TIMER = {
    DEFAULT_DURATION: 90, // seconds
    POSITION: {
        X: 0.5, // center of screen
        Y: 25   // pixels from top
    },
    STYLE: {
        FONT_SIZE: '32px',
        COLOR: '#FFFFFF',
        FONT_STYLE: 'bold'
    },
    READY_BUTTON: {
        WIDTH: 120,
        HEIGHT: 40,
        COLOR: 0x4CAF50,
        HOVER_COLOR: 0x45A049,
        TEXT_COLOR: '#FFFFFF',
        Y_OFFSET: 20  // pixels below timer
    }
};

export const PHASE = {
    OPENING: "Opening", 
    POWERUP: "Powerup",
    PLANNING: "Planning",
    BATTLE: "Battle",
    RESOLUTION: "Resolution",
};

export const OPENING_MENU = {
    BACKGROUND: {
        COLOR: 0x000000,
        ALPHA: 1.0
    },
    CHOICE_BUTTON: {
        WIDTH: 200,
        HEIGHT: 300,
        COLORS: [0x4CAF50, 0x2196F3, 0xFFC107, 0xE91E63],
        SPACING: 50,
        TEXT: {
            COLOR: '#ffffff',
            FONT_SIZE: '24px'
        }
    }
};