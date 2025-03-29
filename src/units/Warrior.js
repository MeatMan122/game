import { Unit } from './Unit';

/**
 * Warrior unit class. Specializes in close combat with high health and attack.
 * @class
 * @extends Unit
 */
export class Warrior extends Unit {
    /**
     * Creates a new Warrior unit instance.
     * @param {import('../scenes/Game').Game} scene - The scene this unit belongs to
     */
    constructor(scene) {
        super(scene, 'warrior');
    }
} 