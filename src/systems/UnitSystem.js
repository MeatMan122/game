import { UnitConfigs } from "../configs/UnitConfigs";

export class UnitSystem {
    constructor(scene) {
        this.scene = scene;
        this.selectedUnit = null;
        this.previewUnits = []; // Array to hold preview units
        this.unitButtons = new Map();
    }

    registerButton(unitType, button) {
        this.unitButtons.set(unitType, button);
    }

    getUnitsPerPlacement(unitType) {
        return UnitConfigs.getUnitsPerPlacement(unitType);
    }

    createPreviewUnit(unitType, x, y) {
        this.clearPreview();
        
        const unitsPerPlacement = this.getUnitsPerPlacement(unitType);
        
        // Create preview units in a horizontal line
        for (let i = 0; i < unitsPerPlacement; i++) {
            const previewUnit = this.scene.add.sprite(
                x + (i * this.scene.CELL_SIZE), 
                y, 
                `${unitType}-idle`, 
                0
            );
            previewUnit.play(`${unitType}-idle`);
            previewUnit.setAlpha(0.6);
            this.scene.gameContainer.add(previewUnit);
            this.previewUnits.push(previewUnit);
        }
    }

    updatePreviewPosition(x, y, isValidPosition) {
        this.previewUnits.forEach((unit, index) => {
            if (unit) {
                unit.setPosition(x + (index * this.scene.CELL_SIZE), y);
                unit.setAlpha(isValidPosition ? 0.6 : 0.2);
            }
        });
    }

    placeUnit(unitType, x, y) {
        const units = [];
        const unitsPerPlacement = this.getUnitsPerPlacement(unitType);
        
        for (let i = 0; i < unitsPerPlacement; i++) {
            const unit = this.scene.add.sprite(
                x + (i * this.scene.CELL_SIZE), 
                y, 
                `${unitType}-idle`, 
                0
            );
            unit.play(`${unitType}-idle`);
            this.scene.gameContainer.add(unit);
            units.push(unit);
        }
        return units;
    }

    clearPreview() {
        this.previewUnits.forEach(unit => {
            if (unit) {
                unit.destroy();
            }
        });
        this.previewUnits = [];
    }

    setSelectedUnit(unitType) {
        // Deselect previous unit if any
        if (this.selectedUnit && this.selectedUnit !== unitType) {
            const prevButton = this.unitButtons.get(this.selectedUnit);
            if (prevButton) {
                prevButton.setSelected(false);
            }
        }
        this.selectedUnit = unitType;
    }

    getSelectedUnit() {
        return this.selectedUnit;
    }

    clearSelection() {
        if (this.selectedUnit) {
            const button = this.unitButtons.get(this.selectedUnit);
            if (button) {
                button.setSelected(false);
            }
        }
        this.selectedUnit = null;
        this.clearPreview();
    }
} 