// src/seeds/materialSeedData.js
const mongoose = require('mongoose');
require('dotenv').config();

const Material = require('../models/Material');
const MaterialCategory = require('../models/MaterialCategory');

// Connect to database
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/dreamhouse', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Materials for different calculation types
const materials = [
  // WALL MATERIALS
  {
    name: "Standard Wall Brick",
    category: null, // Will be set to Brick category ID
    price: 5000,
    specs: "1 piece / 240×120×65mm",
    rating: 8.4,
    width: 120,
    length: 240,
    height: 65,
    unit: 'mm',
    description: "High quality standard brick for wall construction",
    images: ["https://via.placeholder.com/300x200/ff6b6b/ffffff?text=Wall+Brick"],
    ingredients: [
        {
          name: "Cement",
          requiredPercent: 25,
          unit: "m3",
          costPerM3: null,
          costPerPacket: 15000,
          packageWeight: 25
        },
        {
          name: "Sand",
          requiredPercent: 60,
          unit: "m3",
          costPerM3: 8000
        },
        {
          name: "Water",
          requiredPercent: 15,
          unit: "m3",
          costPerM3: 500
        }
    ],
    thicknessOptions: [
      {
        thickness: { value: 65, unit: 'mm' },
        fileUrl: "https://via.placeholder.com/400x300/ff6b6b/ffffff?text=65mm"
      }
    ],
    likeCount: 25,
    likedBy: [],
    isPremium: false,
    isActive: true,
    tags: ["wall", "brick", "construction"],
    popularity: 85,
    viewCount: 120,
    supplier: {
      name: "Wall Brick Co.",
      contact: "+976-11-123456",
      location: "Ulaanbaatar"
    }
  },

  // FUNDAMENT MATERIALS
  {
    name: "Foundation Concrete Mix",
    category: null,
    price: 8000,
    specs: "1 m3 / Heavy duty concrete",
    rating: 9.2,
    width: 1000,
    length: 1000,
    height: 1000,
    unit: 'mm',
    description: "High strength concrete mix for foundation work",
    images: ["https://via.placeholder.com/300x200/8b4513/ffffff?text=Foundation+Concrete"],
    ingredients: [
        {
          name: "Cement",
          requiredPercent: 15,
          unit: "m3",
          costPerM3: null,
          costPerPacket: 18000,
          packageWeight: 50
        },
        {
          name: "Gravel",
          requiredPercent: 50,
          unit: "m3",
          costPerM3: 15000
        },
        {
          name: "Sand",
          requiredPercent: 25,
          unit: "m3",
          costPerM3: 9000
        },
        {
          name: "Water",
          requiredPercent: 10,
          unit: "m3",
          costPerM3: 500
        }
    ],
    thicknessOptions: [
      {
        thickness: { value: 300, unit: 'mm' },
        fileUrl: "https://via.placeholder.com/400x300/8b4513/ffffff?text=300mm"
      }
    ],
    likeCount: 18,
    likedBy: [],
    isPremium: true,
    isActive: true,
    tags: ["fundament", "concrete", "foundation"],
    popularity: 92,
    viewCount: 85,
    supplier: {
      name: "Foundation Materials Ltd.",
      contact: "+976-11-654321",
      location: "Ulaanbaatar"
    }
  },

  // ROOF MATERIALS
  {
    name: "Metal Roof Tiles",
    category: null,
    price: 12000,
    specs: "1 m2 / Galvanized steel",
    rating: 8.8,
    width: 1000,
    length: 2000,
    height: 5,
    unit: 'mm',
    description: "Durable galvanized steel roof tiles",
    images: ["https://via.placeholder.com/300x200/696969/ffffff?text=Metal+Roof"],
    ingredients: [
        {
          name: "Steel Sheet",
          requiredPercent: 85,
          unit: "m2",
          costPerM3: 45000
        },
        {
          name: "Galvanized Coating",
          requiredPercent: 10,
          unit: "kg",
          costPerM3: 8000
        },
        {
          name: "Fasteners",
          requiredPercent: 5,
          unit: "pieces",
          costPerM3: 500
        }
    ],
    thicknessOptions: [
      {
        thickness: { value: 5, unit: 'mm' },
        fileUrl: "https://via.placeholder.com/400x300/696969/ffffff?text=5mm"
      }
    ],
    likeCount: 22,
    likedBy: [],
    isPremium: true,
    isActive: true,
    tags: ["roof", "metal", "tiles"],
    popularity: 88,
    viewCount: 95,
    supplier: {
      name: "Roof Solutions Inc.",
      contact: "+976-11-789012",
      location: "Darkhan"
    }
  },

  // INNER WALL MATERIALS
  {
    name: "Gypsum Board Panel",
    category: null,
    price: 3500,
    specs: "1 panel / 1200×2400×12.5mm",
    rating: 8.1,
    width: 1200,
    length: 2400,
    height: 12.5,
    unit: 'mm',
    description: "Standard gypsum board for inner walls",
    images: ["https://via.placeholder.com/300x200/f5f5dc/000000?text=Gypsum+Board"],
    ingredients: [
        {
          name: "Gypsum Powder",
          requiredPercent: 70,
          unit: "kg",
          costPerM3: 2500
        },
        {
          name: "Paper Facing",
          requiredPercent: 20,
          unit: "m2",
          costPerM3: 1200
        },
        {
          name: "Adhesive",
          requiredPercent: 10,
          unit: "kg",
          costPerM3: 3000
        }
    ],
    thicknessOptions: [
      {
        thickness: { value: 12.5, unit: 'mm' },
        fileUrl: "https://via.placeholder.com/400x300/f5f5dc/000000?text=12.5mm"
      }
    ],
    likeCount: 15,
    likedBy: [],
    isPremium: false,
    isActive: true,
    tags: ["inner_wall", "gypsum", "drywall"],
    popularity: 78,
    viewCount: 110,
    supplier: {
      name: "Interior Materials Co.",
      contact: "+976-11-345678",
      location: "Ulaanbaatar"
    }
  },

  // UNDERFLOOR MATERIALS
  {
    name: "Thermal Insulation Foam",
    category: null,
    price: 6500,
    specs: "1 m2 / 50mm thickness",
    rating: 8.6,
    width: 1000,
    length: 1000,
    height: 50,
    unit: 'mm',
    description: "High-performance thermal insulation for underfloor",
    images: ["https://via.placeholder.com/300x200/ffa500/000000?text=Insulation+Foam"],
    ingredients: [
        {
          name: "Polyurethane Foam",
          requiredPercent: 90,
          unit: "m3",
          costPerM3: 85000
        },
        {
          name: "Protective Film",
          requiredPercent: 10,
          unit: "m2",
          costPerM3: 2500
        }
    ],
    thicknessOptions: [
      {
        thickness: { value: 50, unit: 'mm' },
        fileUrl: "https://via.placeholder.com/400x300/ffa500/000000?text=50mm"
      }
    ],
    likeCount: 12,
    likedBy: [],
    isPremium: false,
    isActive: true,
    tags: ["underfloor", "insulation", "thermal"],
    popularity: 72,
    viewCount: 68,
    supplier: {
      name: "Insulation Pro Ltd.",
      contact: "+976-11-456789",
      location: "Erdenet"
    }
  },

  // FLOOR TILES MATERIALS
  {
    name: "Ceramic Floor Tiles",
    category: null,
    price: 4200,
    specs: "1 m2 / 600×600×10mm",
    rating: 8.3,
    width: 600,
    length: 600,
    height: 10,
    unit: 'mm',
    description: "Premium ceramic tiles for flooring",
    images: ["https://via.placeholder.com/300x200/d2b48c/000000?text=Ceramic+Tiles"],
    ingredients: [
        {
          name: "Ceramic Body",
          requiredPercent: 85,
          unit: "kg",
          costPerM3: 3500
        },
        {
          name: "Glazing",
          requiredPercent: 10,
          unit: "kg",
          costPerM3: 8000
        },
        {
          name: "Tile Adhesive",
          requiredPercent: 5,
          unit: "kg",
          costPerM3: 4500
        }
    ],
    thicknessOptions: [
      {
        thickness: { value: 10, unit: 'mm' },
        fileUrl: "https://via.placeholder.com/400x300/d2b48c/000000?text=10mm"
      }
    ],
    likeCount: 28,
    likedBy: [],
    isPremium: false,
    isActive: true,
    tags: ["floor_tiles", "ceramic", "flooring"],
    popularity: 89,
    viewCount: 145,
    supplier: {
      name: "Tile Master Co.",
      contact: "+976-11-567890",
      location: "Ulaanbaatar"
    }
  },

  // WALL DECORATION MATERIALS
  {
    name: "Interior Paint Premium",
    category: null,
    price: 2800,
    specs: "1 liter / Covers ~8m2",
    rating: 8.7,
    width: 100,
    length: 100,
    height: 100,
    unit: 'mm',
    description: "High-quality interior wall paint",
    images: ["https://via.placeholder.com/300x200/4682b4/ffffff?text=Interior+Paint"],
    ingredients: [
        {
          name: "Paint Base",
          requiredPercent: 70,
          unit: "liter",
          costPerM3: 2200
        },
        {
          name: "Pigments",
          requiredPercent: 15,
          unit: "kg",
          costPerM3: 5500
        },
        {
          name: "Binders",
          requiredPercent: 10,
          unit: "kg",
          costPerM3: 4800
        },
        {
          name: "Additives",
          requiredPercent: 5,
          unit: "kg",
          costPerM3: 8200
        }
    ],
    thicknessOptions: [
      {
        thickness: { value: 0.1, unit: 'mm' },
        fileUrl: "https://via.placeholder.com/400x300/4682b4/ffffff?text=0.1mm"
      }
    ],
    likeCount: 31,
    likedBy: [],
    isPremium: false,
    isActive: true,
    tags: ["wall_decoration", "paint", "interior"],
    popularity: 93,
    viewCount: 165,
    supplier: {
      name: "Color Craft Paints",
      contact: "+976-11-678901",
      location: "Ulaanbaatar"
    }
  }
];

// Function to seed materials
const seedMaterials = async () => {
  try {
    // Find Brick category
    const brickCategory = await MaterialCategory.findOne({ name: "Brick" });
    if (!brickCategory) {
      console.log("Brick category not found. Please seed categories first.");
      return;
    }

    // Set category for all materials
    materials.forEach(material => {
      material.category = brickCategory._id;
    });

    // Clear existing materials
    await Material.deleteMany({});
    
    // Insert new materials
    const createdMaterials = await Material.insertMany(materials);
    
    console.log(`✅ Successfully seeded ${createdMaterials.length} materials`);
    console.log(`📊 Materials seeded: Wall, Foundation, Roof, Inner Wall, Underfloor, Floor Tiles, Wall Decoration`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding materials:', error);
    process.exit(1);
  }
};

// Function to clear materials
const clearMaterials = async () => {
  try {
    await Material.deleteMany({});
    console.log('✅ Materials cleared successfully');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error clearing materials:', error);
    process.exit(1);
  }
};

// Export functions
module.exports = {
  seedMaterials,
  clearMaterials,
  materials
};

// Run if called directly
if (require.main === module) {
  const command = process.argv[2];
  
  if (command === '--seed') {
    seedMaterials();
  } else if (command === '--clear') {
    clearMaterials();
  } else {
    console.log('Usage: node seedMaterials.js [options]');
    console.log('');
    console.log('Options:');
    console.log('  --seed    Seed materials data');
    console.log('  --clear   Clear all materials data');
    console.log('  --help    Show this help message');
    console.log('');
    console.log('Examples:');
    console.log('  node seedMaterials.js --seed');
    console.log('  node seedMaterials.js --clear');
  }
}