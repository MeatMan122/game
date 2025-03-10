export class UnitConfigs {
    static CONFIGS = {
        archer: {
            cost: 50,
            color: 0x00ff00,
            unitsPerPlacement: 2
        },
        warrior: {
            cost: 50,
            color: 0xff0000,
            unitsPerPlacement: 4
        }
    };

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