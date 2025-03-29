import { Unit } from './Unit';

/**
 * Archer unit class. Specializes in ranged combat with high range but lower health.
 * @class
 * @extends Unit
 */
export class Archer extends Unit {
    /**
     * Creates a new Archer unit instance.
     * @param {import('../scenes/Game').Game} scene - The scene this unit belongs to
     */
    constructor(scene) {
        super(scene, 'archer');
    }
} 