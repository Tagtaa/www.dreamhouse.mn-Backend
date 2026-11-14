const Idea = require('../models/Idea');

const ideaSeedData = [
  {
    title: '2 bedroom brick house',
    category: 1, // Concrete house
    heatingType: 1, // Electric floor heating
    description: 'A cozy 2-bedroom brick house with modern amenities and electric floor heating system.',
    shortDetail: 'Electric floor heating',
    size: {
      value: 85,
      unit: 'm2'
    },
    totalCost: 22000,
    soldCount: 2,
    images: [
      {
        url: 'https://via.placeholder.com/400x300/ff6b6b/ffffff?text=2+Bed+Brick+House',
        caption: 'Front view',
        isPrimary: true
      },
      {
        url: 'https://via.placeholder.com/400x300/ff6b6b/ffffff?text=Interior',
        caption: 'Living room',
        isPrimary: false
      }
    ],
    addItem: [
      {
        itemName: 'Brick blocks',
        itemQuantity: 800,
        itemPrice: 12.50
      },
      {
        itemName: 'Electric heating system',
        itemQuantity: 1,
        itemPrice: 3500.00
      },
      {
        itemName: 'Insulation material',
        itemQuantity: 120,
        itemPrice: 15.00
      },
      {
        itemName: 'Roofing materials',
        itemQuantity: 1,
        itemPrice: 2800.00
      }
    ],
    isPremium: false,
    tags: ['brick', '2-bedroom', 'electric-heating', 'residential'],
    popularity: 150,
    viewCount: 245,
    likeCount: 45,
    isActive: true,
    isPublished: true,
    isFeatured: false
  },
  {
    title: '2 car garage',
    category: 4, // Sandwich garage
    heatingType: 1, // Electric floor heating
    description: 'Spacious garage for two vehicles with electric floor heating and modern design.',
    shortDetail: 'Electric floor heating',
    size: {
      value: 60,
      unit: 'm3'
    },
    totalCost: 0,
    soldCount: 11,
    images: [
      {
        url: 'https://via.placeholder.com/400x300/4ecdc4/ffffff?text=2+Car+Garage',
        caption: 'Garage exterior',
        isPrimary: true
      },
      {
        url: 'https://via.placeholder.com/400x300/4ecdc4/ffffff?text=Interior',
        caption: 'Garage interior',
        isPrimary: false
      }
    ],
    addItem: [
      {
        itemName: 'Sandwich panels',
        itemQuantity: 40,
        itemPrice: 85.00
      },
      {
        itemName: 'Electric heating system',
        itemQuantity: 1,
        itemPrice: 1200.00
      },
      {
        itemName: 'Garage door',
        itemQuantity: 1,
        itemPrice: 800.00
      }
    ],
    isPremium: false,
    tags: ['garage', '2-car', 'electric-heating', 'sandwich-panel'],
    popularity: 120,
    viewCount: 180,
    likeCount: 32,
    isActive: true,
    isPublished: true,
    isFeatured: false
  },
  {
    title: 'Small house with terrace',
    category: 2, // Top
    heatingType: 2, // No heating
    description: 'Charming small house with a spacious outdoor terrace and no heating system.',
    shortDetail: 'No heating',
    size: {
      value: 45,
      unit: 'sqft'
    },
    totalCost: 0,
    soldCount: 0,
    images: [
      {
        url: 'https://via.placeholder.com/400x300/87ceeb/ffffff?text=Small+House+Terrace',
        caption: 'House with terrace',
        isPrimary: true
      },
      {
        url: 'https://via.placeholder.com/400x300/87ceeb/ffffff?text=Terrace',
        caption: 'Outdoor terrace',
        isPrimary: false
      }
    ],
    addItem: [
      {
        itemName: 'Wooden frame',
        itemQuantity: 30,
        itemPrice: 45.00
      },
      {
        itemName: 'Terrace materials',
        itemQuantity: 1,
        itemPrice: 1200.00
      },
      {
        itemName: 'Windows and doors',
        itemQuantity: 1,
        itemPrice: 800.00
      }
    ],
    isPremium: false,
    tags: ['small-house', 'terrace', 'no-heating', 'outdoor-living'],
    popularity: 50,
    viewCount: 80,
    likeCount: 15,
    isActive: true,
    isPublished: true,
    isFeatured: false
  },
  {
    title: '2 floor polistrol block house',
    category: 1, // Concrete house
    heatingType: 1, // Electric floor heating
    description: 'Modern two-story house built with energy-efficient polistrol blocks and electric heating.',
    shortDetail: 'Electric floor heating',
    size: {
      value: 140,
      unit: 'm2'
    },
    totalCost: 35000,
    soldCount: 3,
    images: [
      {
        url: 'https://via.placeholder.com/400x300/f0e68c/ffffff?text=2+Floor+Polistrol',
        caption: 'House exterior',
        isPrimary: true
      },
      {
        url: 'https://via.placeholder.com/400x300/f0e68c/ffffff?text=Floor+Plan',
        caption: 'Floor plan',
        isPrimary: false
      }
    ],
    addItem: [
      {
        itemName: 'Polistrol blocks',
        itemQuantity: 600,
        itemPrice: 18.50
      },
      {
        itemName: 'Electric heating system',
        itemQuantity: 1,
        itemPrice: 4500.00
      },
      {
        itemName: 'Steel reinforcement',
        itemQuantity: 300,
        itemPrice: 22.00
      },
      {
        itemName: 'Insulation panels',
        itemQuantity: 80,
        itemPrice: 35.00
      }
    ],
    isPremium: true,
    tags: ['polistrol', '2-floor', 'electric-heating', 'eco-friendly'],
    popularity: 250,
    viewCount: 300,
    likeCount: 89,
    isActive: true,
    isPublished: true,
    isFeatured: true
  },
  {
    title: 'Block with hole house',
    category: 1, // Concrete house
    heatingType: 1, // Electric floor heating
    description: 'Unique house design using block with hole construction for ventilation and electric heating.',
    shortDetail: 'Electric floor heating',
    size: {
      value: 95,
      unit: 'm2'
    },
    totalCost: 28000,
    soldCount: 1,
    images: [
      {
        url: 'https://via.placeholder.com/400x300/4ecdc4/ffffff?text=Block+Hole+House',
        caption: 'House exterior',
        isPrimary: true
      },
      {
        url: 'https://via.placeholder.com/400x300/4ecdc4/ffffff?text=Detail',
        caption: 'Block detail',
        isPrimary: false
      }
    ],
    addItem: [
      {
        itemName: 'Hollow blocks',
        itemQuantity: 700,
        itemPrice: 16.00
      },
      {
        itemName: 'Electric heating system',
        itemQuantity: 1,
        itemPrice: 3200.00
      },
      {
        itemName: 'Ventilation system',
        itemQuantity: 1,
        itemPrice: 1200.00
      }
    ],
    isPremium: true,
    tags: ['hollow-blocks', 'ventilation', 'electric-heating', 'modern', 'unique'],
    popularity: 200,
    viewCount: 280,
    likeCount: 67,
    isActive: true,
    isPublished: true,
    isFeatured: true
  },
  {
    title: 'Teplo block house',
    category: 1, // Concrete house
    heatingType: 1, // Electric floor heating
    description: 'Energy-efficient Teplo block house for superior insulation with electric floor heating.',
    shortDetail: 'Electric floor heating',
    size: {
      value: 110,
      unit: 'm2'
    },
    totalCost: 32000,
    soldCount: 0,
    images: [
      {
        url: 'https://via.placeholder.com/400x300/d3d3d3/ffffff?text=Teplo+Block+House',
        caption: 'House exterior',
        isPrimary: true
      },
      {
        url: 'https://via.placeholder.com/400x300/d3d3d3/ffffff?text=Insulation',
        caption: 'Teplo block detail',
        isPrimary: false
      }
    ],
    addItem: [
      {
        itemName: 'Teplo blocks',
        itemQuantity: 500,
        itemPrice: 25.00
      },
      {
        itemName: 'Electric heating system',
        itemQuantity: 1,
        itemPrice: 4000.00
      },
      {
        itemName: 'Insulation material',
        itemQuantity: 100,
        itemPrice: 20.00
      }
    ],
    isPremium: true,
    tags: ['teplo-blocks', 'insulation', 'electric-heating', 'energy-efficient'],
    popularity: 100,
    viewCount: 150,
    likeCount: 42,
    isActive: true,
    isPublished: true,
    isFeatured: true
  },
  {
    title: '2 room small canada house',
    category: 3, // Canada house
    heatingType: 1, // Electric floor heating
    description: 'Compact and efficient 2-room Canada-style house with electric floor heating.',
    shortDetail: 'Electric floor heating',
    size: {
      value: 65,
      unit: 'm2'
    },
    totalCost: 18000,
    soldCount: 0,
    images: [
      {
        url: 'https://via.placeholder.com/400x300/a2d9ce/ffffff?text=2+Room+Canada+House',
        caption: 'House exterior',
        isPrimary: true
      },
      {
        url: 'https://via.placeholder.com/400x300/a2d9ce/ffffff?text=Interior',
        caption: 'Living area',
        isPrimary: false
      }
    ],
    addItem: [
      {
        itemName: 'Wooden frame',
        itemQuantity: 40,
        itemPrice: 55.00
      },
      {
        itemName: 'Electric heating system',
        itemQuantity: 1,
        itemPrice: 2500.00
      },
      {
        itemName: 'Insulation material',
        itemQuantity: 80,
        itemPrice: 18.00
      }
    ],
    isPremium: false,
    tags: ['canada-style', '2-room', 'electric-heating', 'compact'],
    popularity: 90,
    viewCount: 120,
    likeCount: 28,
    isActive: true,
    isPublished: true,
    isFeatured: false
  }
];

const seedIdeas = async () => {
  try {
    // Clear existing data
    await Idea.deleteMany({});
    
    // Insert new data
    const result = await Idea.insertMany(ideaSeedData);
    
    console.log(`${result.length} ideas seeded successfully`);
    return result;
  } catch (error) {
    console.error('Error seeding ideas:', error);
    throw error;
  }
};

const clearIdeas = async () => {
  try {
    console.log('🧹 Clearing ideas...');
    await Idea.deleteMany({});
    console.log('✅ All ideas cleared');
  } catch (error) {
    console.error('❌ Error clearing ideas:', error);
    throw error;
  }
};

module.exports = { seedIdeas, clearIdeas, ideaSeedData };
