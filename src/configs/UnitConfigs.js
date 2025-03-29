import { RESOURCES } from './Constants';

/**
 * Configuration constants for unit types.
 * @type {Object.<string, string>}
 */
export const UNIT_TYPES = {
    ARCHER: 'archer',
    WARRIOR: 'warrior'
};

/**
 * Detailed configuration for each unit type.
 * @type {Object.<string, {
 *   cost: number,
 *   unitsPerPlacement: number,
 *   color: number,
 *   speed: number,
 *   health: number,
 *   attackPower: number,
 *   attackRange: number
 * }>}
 */
export const UNIT_CONFIGS = {
    [UNIT_TYPES.ARCHER]: {
        cost: 50,
        color: 0x00ff00,
        unitsPerPlacement: 2,
        speed: 50,         // Slower than warrior
        health: 80,        // Less health than warrior
        attackPower: 15,   // Archer attack power
        attackRange: 200   // Ranged attack (in pixels)
    },
    [UNIT_TYPES.WARRIOR]: {
        cost: 50,
        color: 0xff0000,
        unitsPerPlacement: 4,
        speed: 80,         // Faster than archer
        health: 150,       // More health than archer
        attackPower: 25,   // Warrior attack power
        attackRange: 40    // Melee attack (in pixels)
    }
};

/**
 * Static class providing utility methods for accessing unit configurations.
 * @class
 */
export class UnitConfigs {
    /**
     * Map of all unit configurations.
     * @type {Object.<string, Object>}
     * @static
     */
    static CONFIGS = UNIT_CONFIGS;

    /**
     * Gets the configuration for a specific unit type.
     * @param {string} unitType - Type of unit to get config for
     * @returns {Object} Unit configuration
     * @static
     */
    static getConfig(unitType) {
        return this.CONFIGS[unitType];
    }

    /**
     * Gets the cost for a specific unit type.
     * @param {string} unitType - Type of unit to get cost for
     * @returns {number} Unit cost
     * @static
     */
    static getCost(unitType) {
        return this.CONFIGS[unitType].cost;
    }

    /**
     * Gets the number of units created per placement for a unit type.
     * @param {string} unitType - Type of unit to check
     * @returns {number} Units per placement
     * @static
     */
    static getUnitsPerPlacement(unitType) {
        return this.CONFIGS[unitType].unitsPerPlacement;
    }

    /**
     * Gets the color for a specific unit type.
     * @param {string} unitType - Type of unit to get color for
     * @returns {number} Unit color in hex format
     * @static
     */
    static getColor(unitType) {
        return this.CONFIGS[unitType].color;
    }

    /**
     * Gets a list of all available unit types.
     * @returns {string[]} Array of unit type identifiers
     * @static
     */
    static getAllUnitTypes() {
        return Object.keys(this.CONFIGS);
    }
} 