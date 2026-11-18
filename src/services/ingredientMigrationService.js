const mongoose = require('mongoose');
const Material = require('../models/Material');
const Ingredient = require('../models/Ingredient');
const { ensureIngredientIndexes } = require('./ingredientService');

// One-time move from category-owned to material-owned ingredients.
// Every material gets its own copy of its category's ingredients; the old
// category rows are left untouched (nothing reads them any more).
// Safe to run many times: a material that already has its own ingredients is skipped,
// and a marker document stops it from running again after it has finished once.
const MIGRATION_ID = 'ingredients-owned-by-material-v1';

const migrateIngredientsToMaterials = async ({ force = false, log = console.log } = {}) => {
  await ensureIngredientIndexes();

  const migrations = mongoose.connection.db.collection('migrations');
  if (!force && await migrations.findOne({ _id: MIGRATION_ID })) {
    return { skipped: true };
  }

  const categoryIngredients = await Ingredient.find({
    materialCategory: { $type: 'objectId' },
    material: { $exists: false }
  }).lean();
  const byCategory = new Map();
  categoryIngredients.forEach(ing => {
    const key = ing.materialCategory.toString();
    if (!byCategory.has(key)) byCategory.set(key, []);
    byCategory.get(key).push(ing);
  });

  const materialsWithOwn = new Set(
    (await Ingredient.distinct('material', { material: { $type: 'objectId' } })).map(id => id.toString())
  );

  let materialsUpdated = 0;
  let ingredientsCopied = 0;
  const materials = await Material.find({}).select('_id category name').lean();
  for (const material of materials) {
    if (!material.category || materialsWithOwn.has(material._id.toString())) continue;
    const source = byCategory.get(material.category.toString()) || [];
    if (source.length === 0) continue;
    const copies = source.map(({ _id, __v, id, materialCategory, createdAt, updatedAt, ...rest }) => ({
      ...rest,
      material: material._id
    }));
    await Ingredient.insertMany(copies, { ordered: false });
    materialsUpdated += 1;
    ingredientsCopied += copies.length;
  }

  await migrations.updateOne(
    { _id: MIGRATION_ID },
    { $set: { finishedAt: new Date(), materialsUpdated, ingredientsCopied } },
    { upsert: true }
  );
  log(`🧪 Ingredients moved to materials: ${ingredientsCopied} rows copied to ${materialsUpdated} materials`);
  return { skipped: false, materialsUpdated, ingredientsCopied };
};

module.exports = { migrateIngredientsToMaterials, MIGRATION_ID };
