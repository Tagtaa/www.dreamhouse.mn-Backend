// src/seeds/seedData.js
const mongoose = require('mongoose');
require('dotenv').config();

const User = require('../models/User');
const Material = require('../models/Material');
const MaterialCategory = require('../models/MaterialCategory');
const ParentCategory = require('../models/ParentCategory');
const Idea = require('../models/Idea');
const IdeaCategory = require('../models/IdeaCategory');
const HeatingType = require('../models/HeatingType');
const IngredientName = require('../models/IngredientName');
const Ingredient = require('../models/Ingredient');
const { seedHeatingTypes } = require('./heatingTypeSeedData');
const { seedIdeaCategories } = require('./ideaCategorySeedData');
const { seedIdeas } = require('./ideaSeedData');
const { seedSubscriptions } = require('./subscriptionSeedData');
const { seedWithdrawals } = require('./withdrawSeedData');
const { seedIngredientNames } = require('./ingredientNameSeedData');
const { seedIngredients } = require('./ingredientSeedData');

// Connect to database directly
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/dreamhouse', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Parent Categories
const parentCategories = [
  { _id: 1, name: "Wall", ingredientType: "percentage", isActive: true },
  { _id: 2, name: "Fundament", ingredientType: "percentage", isActive: true },
  { _id: 3, name: "Roof", ingredientType: "m2", isActive: true },
  { _id: 4, name: "Inner Wall", ingredientType: "percentage", isActive: true },
  { _id: 5, name: "Floor", ingredientType: "m2", isActive: true },
  { _id: 6, name: "Floor Tiles", ingredientType: "m2", isActive: true },
  { _id: 7, name: "Wall decoration", ingredientType: "percentage", isActive: true }
];

// Material Categories
const materialCategories = [
  { name: "Brick", parentCategory: 1, images: ["https://via.placeholder.com/300x200/ff6b6b/ffffff?text=Brick"], isActive: true },
  { name: "Block with hole", parentCategory: 1, images: ["https://via.placeholder.com/300x200/4ecdc4/ffffff?text=Block"], isActive: true },
  { name: "Concrete block", parentCategory: 2, images: ["https://via.placeholder.com/300x200/45b7d1/ffffff?text=Concrete"], isActive: true },
  { name: "Metal sheet", parentCategory: 3, images: ["https://via.placeholder.com/300x200/45b7d1/ffffff?text=Metal"], isActive: true },
  { name: "Ceramic", parentCategory: 6, images: ["https://via.placeholder.com/300x200/f39c12/ffffff?text=Ceramic"], isActive: true },
  { name: "Gypsum", parentCategory: 4, images: ["https://via.placeholder.com/300x200/9b59b6/ffffff?text=Gypsum"], isActive: true }
];

// Idea Categories - based on image data
const ideaCategories = [
  { _id: 1, name: "Concrete house", description: "Houses built with concrete materials", isActive: true },
  { _id: 2, name: "Top", description: "Premium and top-tier house designs", isActive: true },
  { _id: 3, name: "Canada house", description: "Canadian style house designs", isActive: true },
  { _id: 4, name: "Sandwich garage", description: "Garage designs with sandwich panel construction", isActive: true }
];

// Heating Types - based on image data
const heatingTypes = [
  { _id: 1, name: "Electric floor heating", description: "Electric heating system installed under the floor", isActive: true },
  { _id: 2, name: "No heating", description: "No heating system installed", isActive: true },
  { _id: 3, name: "Furnace heating", description: "Traditional furnace heating system", isActive: true },
  { _id: 4, name: "Heat pump", description: "Modern heat pump heating system", isActive: true },
  { _id: 5, name: "Solar heating", description: "Solar-powered heating system", isActive: true }
];

// Sample Users
const sampleUsers = [{
  username: 'admin_user',
  phone: '+97699123456',
  password: '1234',
  isAdmin: true
}, {
  username: 'publisher_user',
  phone: '+97699234567',
  password: '1234',
  isAdmin: false
}, {
  username: 'regular_user1',
  phone: '+97699345678',
  password: '1234',
  isAdmin: false
}, {
  username: 'regular_user2',
  phone: '+97699456789',
  password: '1234',
  isAdmin: false
}];

// Sample Ideas - based on image data
const sampleIdeas = [
  {
    title: "2 bedroom brick house",
    description: "A cozy 2-bedroom brick house with modern amenities and electric floor heating system.",
    content: "This design features a durable brick exterior, two comfortable bedrooms, a spacious living area, and a functional kitchen. The electric floor heating ensures warmth throughout the year. Ideal for small families looking for a comfortable and energy-efficient home.",
    category: 1, // Concrete house
    heatingType: 1, // Electric floor heating
    size: { value: 80, unit: 'm2' },
    totalCost: 22000000,
    shortDetail: "Electric floor heating",
    imageUrl: "https://via.placeholder.com/400x300/ff6b6b/ffffff?text=2+Bed+Brick+House",
    images: [
      { url: "https://via.placeholder.com/400x300/ff6b6b/ffffff?text=2+Bed+Brick+House", caption: "Front view", isPrimary: true },
      { url: "https://via.placeholder.com/400x300/ff6b6b/ffffff?text=Interior", caption: "Living room", isPrimary: false }
    ],
    calculation: [
      { itemName: "Bricks", itemQuantity: 10000, itemPrice: 5000 },
      { itemName: "Cement", itemQuantity: 500, itemPrice: 12000 },
      { itemName: "Roofing", itemQuantity: 80, itemPrice: 150000 },
      { itemName: "Electric Heating System", itemQuantity: 1, itemPrice: 2000000 }
    ],
    author: { name: "Architect Team", title: "Senior Architect", bio: "Specialized in residential design", avatar: "https://via.placeholder.com/100x100/ff6b6b/ffffff?text=AT" },
    isPremium: false,
    purchasePrice: 0,
    isActive: true,
    isPublished: true,
    isFeatured: false,
    tags: ["brick", "2-bedroom", "electric-heating", "residential"],
    sold: 2,
    readTime: 8,
    difficulty: "intermediate",
    popularity: 150,
    viewCount: 245,
    purchaseCount: 0,
    likeCount: 45,
    rating: { average: 4.5, count: 12 },
    relatedMaterials: [],
    seo: {
      metaTitle: "2 Bedroom Brick House with Electric Floor Heating",
      metaDescription: "Modern 2-bedroom brick house design with electric floor heating system. Perfect for small families.",
      keywords: ["brick house", "2 bedroom", "electric heating", "modern design"]
    }
  },
  {
    title: "2 car garage",
    description: "Spacious garage for two vehicles with electric floor heating and modern design.",
    content: "A robust two-car garage design, perfect for protecting your vehicles. Includes electric floor heating for comfort during cold seasons. The design features high ceilings for larger vehicles and excellent ventilation.",
    category: 4, // Sandwich garage
    heatingType: 1, // Electric floor heating
    size: { value: 36, unit: 'm2' },
    totalCost: 15000000,
    shortDetail: "Electric floor heating",
    imageUrl: "https://via.placeholder.com/400x300/4ecdc4/ffffff?text=2+Car+Garage",
    images: [
      { url: "https://via.placeholder.com/400x300/4ecdc4/ffffff?text=2+Car+Garage", caption: "Garage exterior", isPrimary: true },
      { url: "https://via.placeholder.com/400x300/4ecdc4/ffffff?text=Interior", caption: "Garage interior", isPrimary: false }
    ],
    calculation: [
      { itemName: "Concrete", itemQuantity: 20, itemPrice: 80000 },
      { itemName: "Garage Doors", itemQuantity: 2, itemPrice: 1500000 },
      { itemName: "Electric Heating System", itemQuantity: 1, itemPrice: 2000000 },
      { itemName: "Sandwich Panels", itemQuantity: 36, itemPrice: 12000 }
    ],
    author: { name: "Garage Specialists", title: "Garage Design Expert", bio: "20+ years in garage construction", avatar: "https://via.placeholder.com/100x100/4ecdc4/ffffff?text=GS" },
    isPremium: false,
    purchasePrice: 0,
    isActive: true,
    isPublished: true,
    isFeatured: false,
    tags: ["garage", "2-car", "electric-heating", "sandwich-panel"],
    sold: 11,
    readTime: 6,
    difficulty: "beginner",
    popularity: 120,
    viewCount: 180,
    purchaseCount: 0,
    likeCount: 32,
    rating: { average: 4.3, count: 8 },
    relatedMaterials: [],
    seo: {
      metaTitle: "2 Car Garage with Electric Floor Heating",
      metaDescription: "Modern 2-car garage design with electric floor heating. Perfect for vehicle protection and comfort.",
      keywords: ["garage", "2 car", "electric heating", "vehicle protection"]
    }
  },
  {
    title: "2 floor polistrol block house",
    description: "Modern two-story house built with energy-efficient polistrol blocks and electric heating.",
    content: "This two-story house offers ample living space and excellent thermal insulation thanks to polistrol block construction. Features a contemporary design with electric floor heating throughout. Perfect for growing families.",
    category: 1, // Concrete house
    heatingType: 1, // Electric floor heating
    size: { value: 150, unit: 'm2' },
    totalCost: 35000000,
    shortDetail: "Electric floor heating",
    imageUrl: "https://via.placeholder.com/400x300/f0e68c/ffffff?text=2+Floor+Polistrol",
    images: [
      { url: "https://via.placeholder.com/400x300/f0e68c/ffffff?text=2+Floor+Polistrol", caption: "House exterior", isPrimary: true },
      { url: "https://via.placeholder.com/400x300/f0e68c/ffffff?text=Floor+Plan", caption: "Floor plan", isPrimary: false }
    ],
    calculation: [
      { itemName: "Polistrol Blocks", itemQuantity: 500, itemPrice: 8000 },
      { itemName: "Roofing Tiles", itemQuantity: 100, itemPrice: 180000 },
      { itemName: "Windows", itemQuantity: 10, itemPrice: 300000 },
      { itemName: "Electric Heating System", itemQuantity: 1, itemPrice: 3500000 }
    ],
    author: { name: "EcoBuild Design", title: "Sustainable Architect", bio: "Specialized in eco-friendly construction", avatar: "https://via.placeholder.com/100x100/f0e68c/ffffff?text=ED" },
    isPremium: true,
    purchasePrice: 500000,
    isActive: true,
    isPublished: true,
    isFeatured: true,
    tags: ["polistrol", "2-floor", "electric-heating", "eco-friendly"],
    sold: 111,
    readTime: 12,
    difficulty: "advanced",
    popularity: 250,
    viewCount: 300,
    purchaseCount: 45,
    likeCount: 89,
    rating: { average: 4.8, count: 23 },
    relatedMaterials: [],
    seo: {
      metaTitle: "2 Floor Polistrol Block House with Electric Heating",
      metaDescription: "Modern two-story house built with energy-efficient polistrol blocks and electric floor heating.",
      keywords: ["polistrol", "2 floor", "electric heating", "eco-friendly", "modern"]
    }
  },
  {
    title: "2 room small canada house",
    description: "Compact and efficient 2-room Canada-style house with electric floor heating.",
    content: "A charming small house designed in the Canada style, featuring two rooms and efficient use of space. The electric floor heating ensures comfort in all seasons. Perfect for a single person or a couple.",
    category: 3, // Canada house
    heatingType: 1, // Electric floor heating
    size: { value: 60, unit: 'm2' },
    totalCost: 18000000,
    shortDetail: "Electric floor heating",
    imageUrl: "https://via.placeholder.com/400x300/a2d9ce/ffffff?text=2+Room+Canada+House",
    images: [
      { url: "https://via.placeholder.com/400x300/a2d9ce/ffffff?text=2+Room+Canada+House", caption: "House exterior", isPrimary: true },
      { url: "https://via.placeholder.com/400x300/a2d9ce/ffffff?text=Interior", caption: "Living area", isPrimary: false }
    ],
    calculation: [
      { itemName: "Wood Framing", itemQuantity: 5, itemPrice: 500000 },
      { itemName: "Siding", itemQuantity: 60, itemPrice: 25000 },
      { itemName: "Insulation", itemQuantity: 60, itemPrice: 15000 },
      { itemName: "Electric Heating System", itemQuantity: 1, itemPrice: 1500000 }
    ],
    author: { name: "Canada Style Homes", title: "Canadian Design Expert", bio: "Specialized in Canadian architecture", avatar: "https://via.placeholder.com/100x100/a2d9ce/ffffff?text=CSH" },
    isPremium: false,
    purchasePrice: 0,
    isActive: true,
    isPublished: true,
    isFeatured: false,
    tags: ["canada-style", "2-room", "electric-heating", "compact"],
    sold: 2,
    readTime: 7,
    difficulty: "beginner",
    popularity: 90,
    viewCount: 120,
    purchaseCount: 0,
    likeCount: 28,
    rating: { average: 4.2, count: 6 },
    relatedMaterials: [],
    seo: {
      metaTitle: "2 Room Small Canada House with Electric Heating",
      metaDescription: "Compact Canada-style house with 2 rooms and electric floor heating. Perfect for small families.",
      keywords: ["canada house", "2 room", "electric heating", "compact", "canadian style"]
    }
  },
  {
    title: "Block with hole house",
    description: "Unique house design using block with hole construction for ventilation and electric heating.",
    content: "An innovative house concept utilizing special 'block with hole' materials for natural ventilation and a distinctive aesthetic. Features modern architecture with electric floor heating throughout. Perfect for those seeking unique design.",
    category: 1, // Concrete house
    heatingType: 1, // Electric floor heating
    size: { value: 100, unit: 'm2' },
    totalCost: 25000000,
    shortDetail: "Electric floor heating",
    imageUrl: "https://via.placeholder.com/400x300/4ecdc4/ffffff?text=Block+Hole+House",
    images: [
      { url: "https://via.placeholder.com/400x300/4ecdc4/ffffff?text=Block+Hole+House", caption: "House exterior", isPrimary: true },
      { url: "https://via.placeholder.com/400x300/4ecdc4/ffffff?text=Detail", caption: "Block detail", isPrimary: false }
    ],
    calculation: [
      { itemName: "Hollow Blocks", itemQuantity: 8000, itemPrice: 5000 },
      { itemName: "Steel Beams", itemQuantity: 10, itemPrice: 800000 },
      { itemName: "Glass Panels", itemQuantity: 15, itemPrice: 400000 },
      { itemName: "Electric Heating System", itemQuantity: 1, itemPrice: 2500000 }
    ],
    author: { name: "Innovative Design Studio", title: "Modern Architect", bio: "Pioneering innovative construction methods", avatar: "https://via.placeholder.com/100x100/4ecdc4/ffffff?text=IDS" },
    isPremium: true,
    purchasePrice: 300000,
    isActive: true,
    isPublished: true,
    isFeatured: true,
    tags: ["hollow-blocks", "ventilation", "electric-heating", "modern", "unique"],
    sold: 2,
    readTime: 10,
    difficulty: "advanced",
    popularity: 200,
    viewCount: 280,
    purchaseCount: 12,
    likeCount: 67,
    rating: { average: 4.6, count: 15 },
    relatedMaterials: [],
    seo: {
      metaTitle: "Block with Hole House - Innovative Ventilation Design",
      metaDescription: "Unique house design using block with hole construction for natural ventilation and electric heating.",
      keywords: ["hollow blocks", "ventilation", "electric heating", "innovative", "modern design"]
    }
  },
  {
    title: "Small house with terrace",
    description: "Charming small house with a spacious outdoor terrace and no heating system.",
    content: "This compact house offers comfortable living with the added luxury of a large terrace, perfect for outdoor relaxation and entertaining. No heating system installed, ideal for warm climates or seasonal use.",
    category: 2, // Top
    heatingType: 2, // No heating
    size: { value: 70, unit: 'm2' },
    totalCost: 18000000,
    shortDetail: "No heating",
    imageUrl: "https://via.placeholder.com/400x300/87ceeb/ffffff?text=Small+House+Terrace",
    images: [
      { url: "https://via.placeholder.com/400x300/87ceeb/ffffff?text=Small+House+Terrace", caption: "House with terrace", isPrimary: true },
      { url: "https://via.placeholder.com/400x300/87ceeb/ffffff?text=Terrace", caption: "Outdoor terrace", isPrimary: false }
    ],
    calculation: [
      { itemName: "Foundation", itemQuantity: 70, itemPrice: 100000 },
      { itemName: "Walls", itemQuantity: 150, itemPrice: 50000 },
      { itemName: "Terrace Decking", itemQuantity: 20, itemPrice: 80000 },
      { itemName: "Windows", itemQuantity: 8, itemPrice: 250000 }
    ],
    author: { name: "Terrace Design Co.", title: "Outdoor Living Specialist", bio: "Expert in terrace and outdoor design", avatar: "https://via.placeholder.com/100x100/87ceeb/ffffff?text=TDC" },
    isPremium: false,
    purchasePrice: 0,
    isActive: true,
    isPublished: true,
    isFeatured: false,
    tags: ["small-house", "terrace", "no-heating", "outdoor-living"],
    sold: 0,
    readTime: 6,
    difficulty: "beginner",
    popularity: 50,
    viewCount: 80,
    purchaseCount: 0,
    likeCount: 15,
    rating: { average: 3.8, count: 4 },
    relatedMaterials: [],
    seo: {
      metaTitle: "Small House with Terrace - No Heating Required",
      metaDescription: "Charming small house with spacious terrace. Perfect for warm climates with no heating needed.",
      keywords: ["small house", "terrace", "no heating", "outdoor living", "warm climate"]
    }
  },
  {
    title: "Teplo block house",
    description: "Energy-efficient Teplo block house for superior insulation with electric floor heating.",
    content: "Built with advanced Teplo blocks, this house provides exceptional thermal insulation, ensuring warmth in winter and coolness in summer. Features electric floor heating for year-round comfort. Perfect for energy-conscious homeowners.",
    category: 1, // Concrete house
    heatingType: 1, // Electric floor heating
    size: { value: 90, unit: 'm2' },
    totalCost: 20000000,
    shortDetail: "Electric floor heating",
    imageUrl: "https://via.placeholder.com/400x300/d3d3d3/ffffff?text=Teplo+Block+House",
    images: [
      { url: "https://via.placeholder.com/400x300/d3d3d3/ffffff?text=Teplo+Block+House", caption: "House exterior", isPrimary: true },
      { url: "https://via.placeholder.com/400x300/d3d3d3/ffffff?text=Insulation", caption: "Teplo block detail", isPrimary: false }
    ],
    calculation: [
      { itemName: "Teplo Blocks", itemQuantity: 7000, itemPrice: 10000 },
      { itemName: "Roof Structure", itemQuantity: 90, itemPrice: 120000 },
      { itemName: "Electrical Wiring", itemQuantity: 1, itemPrice: 1500000 },
      { itemName: "Electric Heating System", itemQuantity: 1, itemPrice: 2000000 }
    ],
    author: { name: "Teplo Construction", title: "Teplo Block Specialist", bio: "Leading expert in Teplo block construction", avatar: "https://via.placeholder.com/100x100/d3d3d3/ffffff?text=TC" },
    isPremium: true,
    purchasePrice: 400000,
    isActive: true,
    isPublished: true,
    isFeatured: true,
    tags: ["teplo-blocks", "insulation", "electric-heating", "energy-efficient"],
    sold: 11,
    readTime: 9,
    difficulty: "intermediate",
    popularity: 100,
    viewCount: 150,
    purchaseCount: 8,
    likeCount: 42,
    rating: { average: 4.4, count: 11 },
    relatedMaterials: [],
    seo: {
      metaTitle: "Teplo Block House with Electric Floor Heating",
      metaDescription: "Energy-efficient house built with Teplo blocks and electric floor heating for superior insulation.",
      keywords: ["teplo blocks", "insulation", "electric heating", "energy efficient", "thermal"]
    }
  }
];

async function seedDatabase() {
  try {
    console.log('🌱 Starting database seeding...');

    // Clear existing data
    await User.deleteMany();
    await Material.deleteMany();
    await MaterialCategory.deleteMany();
    await ParentCategory.deleteMany();
    await Idea.deleteMany();
    await IdeaCategory.deleteMany();
    await HeatingType.deleteMany();
    await IngredientName.deleteMany();
    await Ingredient.deleteMany();

    console.log('🗑️  Cleared existing data');

    // Seed parent categories
    const parentCategoryDocs = await ParentCategory.insertMany(parentCategories);
    console.log(`🏠 Created ${parentCategoryDocs.length} parent categories`);

    // Seed material categories
    const materialCategoryDocs = await MaterialCategory.insertMany(materialCategories);
    console.log(`🧱 Created ${materialCategoryDocs.length} material categories`);

    // Seed idea categories
    const ideaCategoryDocs = await IdeaCategory.insertMany(ideaCategories);
    console.log(`💡 Created ${ideaCategoryDocs.length} idea categories`);

    // Seed heating types
    const heatingTypeDocs = await HeatingType.insertMany(heatingTypes);
    console.log(`🔥 Created ${heatingTypeDocs.length} heating types`);

    // Seed users (using save() to trigger password hashing)
    console.log('🔄 Seeding users...');
    const users = [];
    for (const userData of sampleUsers) {
      const user = new User(userData);
      await user.save();
      users.push(user);
    }
    console.log(`👥 Created ${users.length} users with hashed passwords`);

    // Update idea author references
    sampleIdeas.forEach(idea => {
      const randomUser = users[Math.floor(Math.random() * users.length)];
      idea.author.name = randomUser.username; // Assign a random user name
    });

    // Seed ideas
    const ideas = await Idea.insertMany(sampleIdeas);
    console.log(`💡 Created ${ideas.length} ideas`);

    // Seed subscriptions
    await seedSubscriptions();
    console.log('💳 Subscriptions seeded');

    // Seed withdrawals
    await seedWithdrawals();
    console.log('💰 Withdrawals seeded');

    // Seed ingredient names
    await seedIngredientNames();
    console.log('📝 Ingredient names seeded');

    // Seed ingredients (must be after categories are created)
    await seedIngredients();
    console.log('🧪 Ingredients seeded');

    console.log('✅ Database seeding complete!');
    process.exit();
  } catch (error) {
    console.error(`❌ Seeding failed: ${error}`);
    process.exit(1);
  }
}

const seedAllData = async () => {
  try {
    console.log('Starting to seed all data...');
    
    // Seed heating types
    await seedHeatingTypes();
    
    // Seed idea categories
    await seedIdeaCategories();
    
    // Seed ideas
    await seedIdeas();
    
    console.log('All data seeded successfully!');
  } catch (error) {
    console.error('Error seeding data:', error);
    throw error;
  }
};

module.exports = { seedAllData };

if (process.argv[2] === '-d') {
  // This part is for destroying data, not seeding
  // For now, we'll just exit if -d is passed, as deleteMany is already at the start
  console.log('Destroying data is handled at the start of seeding. Exiting.');
  process.exit();
} else {
  seedDatabase();
}
