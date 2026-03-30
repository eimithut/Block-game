// WorldManager.ts

class WorldManager {
    constructor() {
        this.biomes = this.initializeBiomes();
        this.noiseParams = this.getEnhancedNoiseParameters();
        this.decorativeFeatures = this.addDecorativeFeatures();
        this.caveSystems = this.generateCaveSystems();
    }

    initializeBiomes() {
        // Improved biome variety logic
        return [
            { name: 'Desert', temperature: 40, decorative: ['cacti', 'rocks'] },
            { name: 'Forest', temperature: 15, decorative: ['trees', 'flowers'] },
            { name: 'Mountain', temperature: 10, decorative: ['pine trees', 'boulders'] },
            { name: 'Swamp', temperature: 20, decorative: ['mangroves', 'water lilies'] }
            // Add more biomes here
        ];
    }

    getEnhancedNoiseParameters() {
        // Improved noise parameters for better terrain
        return {
            scale: 0.1,
            octaves: 6,
            persistence: 0.5,
            lacunarity: 2.0
        }; // Adjust these parameters as needed
    }

    addDecorativeFeatures() {
        // Logic for adding more decorative features
        return [
            'sparkling water',
            'falling leaves',
            'glowing mushrooms',
            'ancient ruins' // Add more features
        ];
    }

    generateCaveSystems() {
        // Better cave generation logic
        let caves = [];
        for (let i = 0; i < 100; i++) {
            caves.push(this.createCave());
        }
        return caves;
    }

    createCave() {
        // Logic to create a single cave
        return {
            entrance: this.randomPoint(),
            length: Math.random() * 20 + 10,
            depth: Math.random() * 10 + 5
        };
    }

    randomPoint() {
        return { x: Math.floor(Math.random() * 100), y: Math.floor(Math.random() * 100) };
    }
}

export default WorldManager;