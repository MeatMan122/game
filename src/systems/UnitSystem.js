export class UnitSystem {
    constructor(scene) {
        this.scene = scene;
        this.selectedUnit = null;
        this.previewUnit = null;
    }

    createPreviewUnit(unitType, x, y) {
        if (this.previewUnit) {
            this.previewUnit.destroy();
        }
        
        this.previewUnit = this.scene.add.sprite(x, y, `${unitType}-idle`, 0);
        this.previewUnit.play(`${unitType}-idle`);
        this.previewUnit.setAlpha(0.6);
        this.scene.gameContainer.add(this.previewUnit);
    }

    updatePreviewPosition(x, y, isValidPosition) {
        if (this.previewUnit) {
            this.previewUnit.setPosition(x, y);
            this.previewUnit.setAlpha(isValidPosition ? 0.6 : 0.2);
        }
    }

    placeUnit(unitType, x, y) {
        const unit = this.scene.add.sprite(x, y, `${unitType}-idle`, 0);
        unit.play(`${unitType}-idle`);
        this.scene.gameContainer.add(unit);
        return unit;
    }

    clearPreview() {
        if (this.previewUnit) {
            this.previewUnit.destroy();
            this.previewUnit = null;
        }
    }

    setSelectedUnit(unitType) {
        this.selectedUnit = unitType;
    }

    getSelectedUnit() {
        return this.selectedUnit;
    }

    clearSelection() {
        this.selectedUnit = null;
        this.clearPreview();
    }
} 