const CalculationType = require('../models/CalculationType');
const CalculationMaterial = require('../models/CalculationMaterial');

// Wall Types
const wallTypes = [
  {
    calculationType: 'wall',
    key: 'brick',
    name: 'Brick',
    imageUrl: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=400&h=300&fit=crop',
    description: 'Traditional red brick wall construction',
    sortOrder: 1
  },
  {
    calculationType: 'wall',
    key: 'block_with_hole',
    name: 'Block with hole',
    imageUrl: 'https://images.unsplash.com/photo-1541888946425-d81bb19240f5?w=400&h=300&fit=crop',
    description: 'Hollow concrete blocks for wall construction',
    sortOrder: 2
  },
  {
    calculationType: 'wall',
    key: 'sandwich',
    name: 'Sandwich',
    imageUrl: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400&h=300&fit=crop',
    description: 'Multi-layer sandwich panel wall',
    sortOrder: 3
  },
  {
    calculationType: 'wall',
    key: 'mak_block',
    name: 'MAK block',
    imageUrl: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=400&h=300&fit=crop',
    description: 'Lightweight aerated concrete blocks',
    sortOrder: 4
  },
  {
    calculationType: 'wall',
    key: 'concrete_block',
    name: 'Concrete block',
    imageUrl: 'https://images.unsplash.com/photo-1541888946425-d81bb19240f5?w=400&h=300&fit=crop',
    description: 'Solid concrete blocks for structural walls',
    sortOrder: 5
  },
  {
    calculationType: 'wall',
    key: 'polistrol_block',
    name: 'Polistrol block',
    imageUrl: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400&h=300&fit=crop',
    description: 'Polystyrene concrete form blocks',
    sortOrder: 6
  },
  {
    calculationType: 'wall',
    key: 'teplo_block',
    name: 'Teplo block',
    imageUrl: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=400&h=300&fit=crop',
    description: 'Thermal insulation blocks',
    sortOrder: 7
  },
  {
    calculationType: 'wall',
    key: 'canada_house',
    name: 'Canada house',
    imageUrl: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400&h=300&fit=crop',
    description: 'Wooden frame construction with insulation',
    sortOrder: 8
  },
  {
    calculationType: 'wall',
    key: 'concrete_wall',
    name: 'Concrete wall',
    imageUrl: 'https://images.unsplash.com/photo-1541888946425-d81bb19240f5?w=400&h=300&fit=crop',
    description: 'Poured concrete wall construction',
    sortOrder: 9
  },
  {
    calculationType: 'wall',
    key: 'custom',
    name: 'Custom',
    imageUrl: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400&h=300&fit=crop',
    description: 'Custom wall specifications',
    sortOrder: 10
  }
];

// Foundation Types
const foundationTypes = [
  {
    calculationType: 'fundament',
    key: 'concrete_fundament',
    name: 'Concrete fundament',
    imageUrl: 'https://images.unsplash.com/photo-1541888946425-d81bb19240f5?w=400&h=300&fit=crop',
    description: 'Traditional concrete foundation',
    sortOrder: 1
  },
  {
    calculationType: 'fundament',
    key: 'pile_fundament',
    name: 'Pile fundament',
    imageUrl: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=400&h=300&fit=crop',
    description: 'Deep pile foundation system',
    sortOrder: 2
  },
  {
    calculationType: 'fundament',
    key: 'concrete_pile_fundament',
    name: 'Concrete pile fundament',
    imageUrl: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400&h=300&fit=crop',
    description: 'Concrete pile foundation with grid',
    sortOrder: 3
  }
];

// Roof Types
const roofTypes = [
  {
    calculationType: 'roof',
    key: 'wooden_frame',
    name: 'Wooden frame',
    imageUrl: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=400&h=300&fit=crop',
    description: 'Traditional wooden roof truss construction',
    sortOrder: 1
  },
  {
    calculationType: 'roof',
    key: 'metal_frame',
    name: 'Metal frame',
    imageUrl: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=400&h=300&fit=crop',
    description: 'Modern metal roof truss system',
    sortOrder: 2
  },
  {
    calculationType: 'roof',
    key: 'concrete_roof',
    name: 'Concrete roof',
    imageUrl: 'https://images.unsplash.com/photo-1541888946425-d81bb19240f5?w=400&h=300&fit=crop',
    description: 'Solid concrete roof construction',
    sortOrder: 3
  },
  {
    calculationType: 'roof',
    key: 'plate',
    name: 'Plate',
    imageUrl: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400&h=300&fit=crop',
    description: 'Flat plate roof system',
    sortOrder: 4
  }
];

// Roof Shapes
const roofShapes = [
  {
    calculationType: 'roof',
    key: 'triangle',
    name: 'Triangle',
    imageUrl: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=400&h=300&fit=crop',
    description: 'Traditional gable roof shape',
    sortOrder: 1
  },
  {
    calculationType: 'roof',
    key: 'hip',
    name: 'Hip',
    imageUrl: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=400&h=300&fit=crop',
    description: 'Hip roof with slopes on all sides',
    sortOrder: 2
  },
  {
    calculationType: 'roof',
    key: 'shed',
    name: 'Shed',
    imageUrl: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400&h=300&fit=crop',
    description: 'Single slope shed roof',
    sortOrder: 3
  }
];

// Inner Wall Types
const innerWallTypes = [
  {
    calculationType: 'inner_wall',
    key: 'gypsum_wall',
    name: 'Gypsum wall',
    imageUrl: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400&h=300&fit=crop',
    description: 'Interior gypsum board wall construction',
    sortOrder: 1
  },
  {
    calculationType: 'inner_wall',
    key: 'mak_block_inner_wall',
    name: 'MAK block inner wall',
    imageUrl: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=400&h=300&fit=crop',
    description: 'Lightweight block interior walls',
    sortOrder: 2
  },
  {
    calculationType: 'inner_wall',
    key: 'custom',
    name: 'Custom',
    imageUrl: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400&h=300&fit=crop',
    description: 'Custom interior wall specifications',
    sortOrder: 3
  }
];

// Underfloor Types
const underfloorTypes = [
  {
    calculationType: 'underfloor',
    key: 'canada_type_underfloor',
    name: 'Canada type underfloor',
    imageUrl: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=400&h=300&fit=crop',
    description: 'Wooden frame with insulation',
    sortOrder: 1
  },
  {
    calculationType: 'underfloor',
    key: 'keramzit_and_concrete',
    name: 'Keramzit and concrete',
    imageUrl: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400&h=300&fit=crop',
    description: 'Expanded clay with concrete',
    sortOrder: 2
  },
  {
    calculationType: 'underfloor',
    key: 'custom',
    name: 'Custom',
    imageUrl: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400&h=300&fit=crop',
    description: 'Custom underfloor specifications',
    sortOrder: 3
  }
];

// Floor Types
const floorTypes = [
  {
    calculationType: 'floor_tiles',
    key: 'parket',
    name: 'Parket',
    imageUrl: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400&h=300&fit=crop',
    description: 'Wooden parquet flooring',
    sortOrder: 1
  },
  {
    calculationType: 'floor_tiles',
    key: 'ceramic',
    name: 'Ceramic',
    imageUrl: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=400&h=300&fit=crop',
    description: 'Ceramic tile flooring',
    sortOrder: 2
  },
  {
    calculationType: 'floor_tiles',
    key: 'carpet',
    name: 'Carpet',
    imageUrl: 'https://images.unsplash.com/photo-1541888946425-d81bb19240f5?w=400&h=300&fit=crop',
    description: 'Carpet flooring',
    sortOrder: 3
  },
  {
    calculationType: 'floor_tiles',
    key: 'custom',
    name: 'Custom',
    imageUrl: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400&h=300&fit=crop',
    description: 'Custom floor specifications',
    sortOrder: 4
  }
];

// Wall Decoration Types
const wallDecorationTypes = [
  {
    calculationType: 'wall_decoration',
    key: 'plaster',
    name: 'Plaster',
    imageUrl: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400&h=300&fit=crop',
    description: 'Traditional wall plaster finish',
    sortOrder: 1
  },
  {
    calculationType: 'wall_decoration',
    key: 'wall_paper',
    name: 'Wall paper',
    imageUrl: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=400&h=300&fit=crop',
    description: 'Decorative wallpaper',
    sortOrder: 2
  },
  {
    calculationType: 'wall_decoration',
    key: 'emulsion',
    name: 'Emulsion',
    imageUrl: 'https://images.unsplash.com/photo-1541888946425-d81bb19240f5?w=400&h=300&fit=crop',
    description: 'Water-based emulsion paint',
    sortOrder: 3
  },
  {
    calculationType: 'wall_decoration',
    key: 'paint',
    name: 'Paint',
    imageUrl: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400&h=300&fit=crop',
    description: 'Oil-based paint finish',
    sortOrder: 4
  },
  {
    calculationType: 'wall_decoration',
    key: 'decoration_slab',
    name: 'Decoration slab',
    imageUrl: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=400&h=300&fit=crop',
    description: 'Decorative stone slabs',
    sortOrder: 5
  },
  {
    calculationType: 'wall_decoration',
    key: 'stone',
    name: 'Stone',
    imageUrl: 'https://images.unsplash.com/photo-1541888946425-d81bb19240f5?w=400&h=300&fit=crop',
    description: 'Natural stone wall covering',
    sortOrder: 6
  }
];

// Wall Materials
const wallMaterials = [
  {
    calculationType: 'wall',
    key: 'standard_brick',
    name: 'Standard brick',
    imageUrl: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=400&h=300&fit=crop',
    description: 'Traditional red brick for walls',
    price: { amount: 300, currency: '₹', unit: 'piece' },
    rating: 4.9,
    likes: 123,
    sortOrder: 1
  },
  {
    calculationType: 'wall',
    key: '24x12_brick',
    name: '24x12 brick',
    imageUrl: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=400&h=300&fit=crop',
    description: 'Standard size brick 240x120x65mm',
    price: { amount: 300, currency: '₹', unit: 'piece' },
    rating: 4.9,
    likes: 123,
    sortOrder: 2
  }
];

// Foundation Materials
const foundationMaterials = [
  {
    calculationType: 'fundament',
    key: 'standard_beton_small_houses',
    name: 'Standard beton for small houses fundament',
    imageUrl: 'https://images.unsplash.com/photo-1541888946425-d81bb19240f5?w=400&h=300&fit=crop',
    description: 'Standard concrete for small house foundations',
    price: { amount: 280000, currency: '₸', unit: 'm3' },
    rating: 4.9,
    likes: 123,
    sortOrder: 1
  },
  {
    calculationType: 'fundament',
    key: 'beton_2_5_floor_houses',
    name: 'Beton for 2-5 floor houses',
    imageUrl: 'https://images.unsplash.com/photo-1541888946425-d81bb19240f5?w=400&h=300&fit=crop',
    description: 'High-strength concrete for multi-story buildings',
    price: { amount: 320000, currency: '₸', unit: 'm3' },
    rating: 4.9,
    likes: 123,
    sortOrder: 2
  }
];

// Roof Materials
const roofMaterials = [
  {
    calculationType: 'roof',
    key: 'canada_house_type_roof',
    name: 'Canada house type roof',
    imageUrl: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=400&h=300&fit=crop',
    description: 'Canada house type roof with Baswool insulation',
    price: { amount: 50000, currency: '₸', unit: 'm2' },
    rating: 4.5,
    likes: 123,
    sortOrder: 1
  },
  {
    calculationType: 'roof',
    key: 'canada_house_type_roof_wooden_interior',
    name: 'Canada house type roof with wooden interior',
    imageUrl: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=400&h=300&fit=crop',
    description: 'Canada house type roof with wooden interior finish',
    price: { amount: 60000, currency: '₸', unit: 'm2' },
    rating: 4.5,
    likes: 123,
    sortOrder: 2
  }
];

// Inner Wall Materials
const innerWallMaterials = [
  {
    calculationType: 'inner_wall',
    key: 'wooden_frame',
    name: 'Wooden frame',
    imageUrl: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400&h=300&fit=crop',
    description: 'Wooden frame interior wall construction',
    price: { amount: 50000, currency: '₺', unit: 'm2' },
    rating: 4.9,
    likes: 123,
    sortOrder: 1
  },
  {
    calculationType: 'inner_wall',
    key: 'iron_frame',
    name: 'Iron frame',
    imageUrl: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400&h=300&fit=crop',
    description: 'Metal frame interior wall construction',
    price: { amount: 60000, currency: '₺', unit: 'm2' },
    rating: 4.9,
    likes: 123,
    sortOrder: 2
  }
];

// Underfloor Materials
const underfloorMaterials = [
  {
    calculationType: 'underfloor',
    key: 'basaltwool_and_wooden_frame',
    name: 'Basaltwool and wooden frame',
    imageUrl: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=400&h=300&fit=crop',
    description: 'Basaltwool insulation with wooden frame',
    price: { amount: 50000, currency: '₸', unit: 'm2' },
    rating: 4.9,
    likes: 123,
    sortOrder: 1
  },
  {
    calculationType: 'underfloor',
    key: 'keramzit_and_concrete',
    name: 'Keramzit and concrete',
    imageUrl: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400&h=300&fit=crop',
    description: 'Expanded clay aggregate with concrete',
    price: { amount: 60000, currency: '₸', unit: 'm2' },
    rating: 4.9,
    likes: 123,
    sortOrder: 2
  }
];

// Floor Materials
const floorMaterials = [
  {
    calculationType: 'floor_tiles',
    key: 'normal_parket',
    name: 'Normal parket',
    imageUrl: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400&h=300&fit=crop',
    description: 'Standard wooden parquet flooring',
    price: { amount: 20000, currency: '₺', unit: 'm2' },
    rating: 4.9,
    likes: 123,
    sortOrder: 1
  },
  {
    calculationType: 'floor_tiles',
    key: 'laminat',
    name: 'Laminat',
    imageUrl: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=400&h=300&fit=crop',
    description: 'Laminate flooring',
    price: { amount: 35000, currency: '₺', unit: 'm2' },
    rating: 4.9,
    likes: 123,
    sortOrder: 2
  }
];

// Wall Decoration Materials
const wallDecorationMaterials = [
  {
    calculationType: 'wall_decoration',
    key: 'white_plaster',
    name: 'White plaster',
    imageUrl: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400&h=300&fit=crop',
    description: 'White plaster finish for walls',
    price: { amount: 20000, currency: '₹', unit: 'kg' },
    rating: 4.9,
    likes: 123,
    sortOrder: 1
  }
];

// All calculation types
const allCalculationTypes = [
  ...wallTypes,
  ...foundationTypes,
  ...roofTypes,
  ...roofShapes,
  ...innerWallTypes,
  ...underfloorTypes,
  ...floorTypes,
  ...wallDecorationTypes
];

// All calculation materials
const allCalculationMaterials = [
  ...wallMaterials,
  ...foundationMaterials,
  ...roofMaterials,
  ...innerWallMaterials,
  ...underfloorMaterials,
  ...floorMaterials,
  ...wallDecorationMaterials
];

module.exports = {
  allCalculationTypes,
  allCalculationMaterials
};
