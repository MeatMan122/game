export class UnitGroup {
    constructor({
        units,
        unitType,
        canReposition,
        gridPositions,
        isVertical,
        isRepositioning
    }) {
        this.units = units;
        this.unitType = unitType;
        this.canReposition = canReposition;
        this.gridPositions = gridPositions;
        this.isVertical = isVertical;
        this.isRepositioning = isRepositioning;
    }

    setRepositioning() {
        this.isRepositioning = true;
        this.units.forEach(unit => {
            unit.isRepositioning = true;
        });
    }
} 