import { Scene } from 'phaser';

export class Preloader extends Scene
{
    constructor ()
    {
        super('Preloader');
    }

    init ()
    {
        //  We loaded this image in our Boot Scene, so we can display it here
        this.add.image(512, 384, 'background');

        //  A simple progress bar. This is the outline of the bar.
        this.add.rectangle(512, 384, 468, 32).setStrokeStyle(1, 0xffffff);

        //  This is the progress bar itself. It will increase in size from the left based on the % of progress.
        const bar = this.add.rectangle(512-230, 384, 4, 28, 0xffffff);

        //  Use the 'progress' event emitted by the LoaderPlugin to update the loading bar
        this.load.on('progress', (progress) => {

            //  Update the progress bar (our bar is 464px wide, so 100% = 464px)
            bar.width = 4 + (460 * progress);

        });
    }

    preload ()
    {
        //  Load the assets for the game
        this.load.setPath('assets');

        // Load the character sprites
        this.load.setPath('assets/roguelike-game-kit-pixel-art/1 Characters');
        
        // Load archer spritesheet
        this.load.spritesheet('archer-idle', '1/D_Idle.png', {
            frameWidth: 32,
            frameHeight: 32,
            startFrame: 0,
            endFrame: 3
        });

        // Load warrior spritesheet
        this.load.spritesheet('warrior-idle', '2/D_Idle.png', {
            frameWidth: 32,
            frameHeight: 32,
            startFrame: 0,
            endFrame: 3
        });

        // Reset path for other assets
        this.load.setPath('assets');
        this.load.image('logo', 'logo.png');
    }

    create ()
    {
        // Create the archer idle animation configuration
        this.anims.create({
            key: 'archer-idle',
            frames: this.anims.generateFrameNumbers('archer-idle', { start: 0, end: 3 }),
            frameRate: 8,
            repeat: -1
        });

        // Create the warrior idle animation configuration
        this.anims.create({
            key: 'warrior-idle',
            frames: this.anims.generateFrameNumbers('warrior-idle', { start: 0, end: 3 }),
            frameRate: 8,
            repeat: -1
        });

        //  When all the assets have loaded, it's often worth creating global objects here that the rest of the game can use.
        //  For example, you can define global animations here, so we can use them in other scenes.

        //  Move to the MainMenu. You could also swap this for a Scene Transition, such as a camera fade.
        this.scene.start('MainMenu');
    }
}
