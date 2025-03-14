import { RESOURCES } from './Constants';

export const UNIT_TYPES = {
    ARCHER: 'archer',
    WARRIOR: 'warrior'
};

export const UNIT_CONFIGS = {
    [UNIT_TYPES.ARCHER]: {
        cost: Math.floor(RESOURCES.STARTING_GOLD / 10),
        color: 0x00ff00,
        unitsPerPlacement: 2
    },
    [UNIT_TYPES.WARRIOR]: {
        cost: Math.floor(RESOURCES.STARTING_GOLD / 10),
        color: 0xff0000,
        unitsPerPlacement: 4
    }
};

export class UnitConfigs {
    static CONFIGS = UNIT_CONFIGS;

    static getConfig(unitType) {
        return this.CONFIGS[unitType];
    }

    static getCost(unitType) {
        return this.CONFIGS[unitType].cost;
    }

    static getUnitsPerPlacement(unitType) {
        return this.CONFIGS[unitType].unitsPerPlacement;
    }

    static getColor(unitType) {
        return this.CONFIGS[unitType].color;
    }

    static getAllUnitTypes() {
        return Object.keys(this.CONFIGS);
    }
} 