export const GRID = {
    CELL_SIZE: 32,
    WIDTH: 75,
    HEIGHT: 75,
    BASE_PADDING: 120,
    EXTRA_BOTTOM: 130,
    PADDING: {
        TOP: 120,
        RIGHT: 120,
        BOTTOM: 250, // BASE_PADDING + EXTRA_BOTTOM
        LEFT: 120
    }
};

export const TERRITORY = {
    NO_MANS_LAND_HEIGHT: 9,
    TERRITORY_HEIGHT: 33 // Math.floor((GRID.HEIGHT - NO_MANS_LAND_HEIGHT) / 2)
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
    STARTING_GOLD: 500
};

export const CAMERA = {
    MOVE_SPEED: 16,
    MIN_ZOOM: 0.5,
    MAX_ZOOM: 2,
    ZOOM_STEP: 0.1
};

export const ANIMATION = {
    FEEDBACK_DURATION: 300
};

export const TERRITORY_COLORS = {
    AI: { color: 0xff0000, alpha: 0.1 },
    NO_MANS_LAND: { color: 0xffff00, alpha: 0.1 },
    PLAYER: { color: 0x0000ff, alpha: 0.1 }
};

export const GRID_STYLE = {
    LINE_WIDTH: 1,
    LINE_COLOR: 0x666666,
    LINE_ALPHA: 0.8,
    TERRITORY_BORDER_WIDTH: 2,
    TERRITORY_BORDER_COLOR: 0xffffff,
    TERRITORY_BORDER_ALPHA: 0.8
}; 