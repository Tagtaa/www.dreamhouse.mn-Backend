const mongoose = require('mongoose');
const Ingredient = require('../models/Ingredient');

// Ingredients belong to a single material (Ingredient.material).
// This module is the one place that reads, formats and replaces them.

const unitKind = (unit) => {
  const u = String(unit || '').trim().toLowerCase();
  if (u === 'm3') return 'm3';
  if (u === 'm2') return 'm2';
  return 'percent';
};

const toNumber = (value) => {
  if (value === undefined || value === null || value === '') return undefined;
  const n = typeof value === 'number' ? value : parseFloat(value);
  return Number.isFinite(n) ? n : undefined;
};

// API shape used by web and mobile (unchanged from the old category ingredients):
// { _id, name, unit, percentValue, pricePerM3 | pricePerM2 | priceForPer1Percent }
const formatIngredient = (doc) => {
  const ing = doc && doc.toObject ? doc.toObject() : doc;
  const out = {
    _id: ing._id,
    name: ing.name,
    unit: ing.unit,
    percentValue: ing.requiredPercent ?? null,
    sortOrder: ing.sortOrder ?? 0,
    isActive: ing.isActive !== false
  };
  const kind = unitKind(ing.unit);
  if (kind === 'm3') out.pricePerM3 = ing.pricePerM3 ?? null;
  else if (kind === 'm2') out.pricePerM2 = ing.pricePerM2 ?? null;
  else out.priceForPer1Percent = ing.priceForPer1Percent ?? null;
  return out;
};

const SORT = { sortOrder: 1, createdAt: 1 };

// Map<materialId string, formatted ingredient[]> for many materials in one query
const getIngredientsByMaterialIds = async (materialIds, { includeInactive = false } = {}) => {
  const ids = (materialIds || []).filter(Boolean).map(id => id.toString());
  const map = new Map(ids.map(id => [id, []]));
  if (ids.length === 0) return map;
  const filter = { material: { $in: ids } };
  if (!includeInactive) filter.isActive = true;
  const docs = await Ingredient.find(filter).sort(SORT);
  docs.forEach(doc => {
    const key = doc.material.toString();
    if (!map.has(key)) map.set(key, []);
    map.get(key).push(formatIngredient(doc));
  });
  return map;
};

const getMaterialIngredients = async (materialId, opts) => {
  const map = await getIngredientsByMaterialIds([materialId], opts);
  return map.get(materialId.toString()) || [];
};

// Puts a material's ingredients on the response object. They are also copied to
// category.ingredients because app versions already installed read them from there.
const attachIngredients = (materialObj, ingredients) => {
  materialObj.ingredients = ingredients;
  if (materialObj.category && typeof materialObj.category === 'object') {
    materialObj.category.ingredients = ingredients;
  }
  return materialObj;
};

class IngredientValidationError extends Error {
  constructor(key, params = {}) {
    super(key);
    this.key = key;
    this.params = params;
    this.status = 400;
  }
}

// Validates a full ingredient list coming from the admin form and returns rows ready to insert.
const normalizeIngredientList = (list) => {
  if (!Array.isArray(list)) throw new IngredientValidationError('INGREDIENTS_ARRAY');
  const seen = new Set();
  const rows = list.map((raw, index) => {
    const name = String(raw?.name || '').trim();
    const unit = String(raw?.unit || '').trim();
    const kind = unitKind(unit);
    const percent = toNumber(raw?.percentValue ?? raw?.requiredPercent);
    const price = toNumber(
      kind === 'm3' ? raw?.pricePerM3 : kind === 'm2' ? raw?.pricePerM2 : raw?.priceForPer1Percent
    );
    if (!name || !unit || percent === undefined || price === undefined || percent < 0 || price < 0
      || (kind === 'percent' && percent > 100)) {
      throw new IngredientValidationError('INGREDIENT_ROW_INVALID', { name: name || `#${index + 1}` });
    }
    const dedupeKey = name.toLowerCase();
    if (seen.has(dedupeKey)) throw new IngredientValidationError('INGREDIENT_EXISTS');
    seen.add(dedupeKey);
    const row = {
      name,
      unit: kind === 'percent' ? unit : kind,
      requiredPercent: percent,
      sortOrder: index,
      isActive: raw?.isActive !== false
    };
    if (kind === 'm3') row.pricePerM3 = price;
    else if (kind === 'm2') row.pricePerM2 = price;
    else row.priceForPer1Percent = price;
    return row;
  });

  // Same rule as before: a list made only of percentage-type ingredients must add up to 100%
  if (rows.length > 0 && rows.every(r => unitKind(r.unit) === 'percent')) {
    const total = rows.reduce((sum, r) => sum + r.requiredPercent, 0);
    if (Math.abs(total - 100) > 0.01) {
      throw new IngredientValidationError('TOTAL_PERCENTAGE_MUST_BE_100', { total });
    }
  }
  return rows;
};

// Replaces all ingredients of a material with the given list (validated first).
const replaceMaterialIngredients = async (materialId, list) => {
  const rows = normalizeIngredientList(list);
  const session = await mongoose.startSession().catch(() => null);
  const run = async (opts) => {
    await Ingredient.deleteMany({ material: materialId }, opts);
    if (rows.length > 0) {
      await Ingredient.insertMany(rows.map(r => ({ ...r, material: materialId })), opts);
    }
  };
  try {
    if (session) {
      try {
        await session.withTransaction(() => run({ session }));
      } catch (err) {
        // Standalone MongoDB (no replica set) cannot run transactions
        if (err && (err.code === 20 || /Transaction numbers|replica set/i.test(err.message))) await run({});
        else throw err;
      }
    } else {
      await run({});
    }
  } finally {
    if (session) session.endSession();
  }
  return getMaterialIngredients(materialId, { includeInactive: true });
};

const deleteMaterialIngredients = (materialId) => Ingredient.deleteMany({ material: materialId });

// The old unique index {materialCategory, name} (not partial) makes material-owned
// ingredients collide on a null category. Swap it for the partial indexes.
const ensureIngredientIndexes = async () => {
  try {
    const indexes = await Ingredient.collection.indexes();
    const legacy = indexes.find(ix => ix.name === 'materialCategory_1_name_1' && !ix.partialFilterExpression);
    if (legacy) {
      await Ingredient.collection.dropIndex(legacy.name);
      console.log('🔧 Dropped legacy ingredient index materialCategory_1_name_1');
    }
    await Ingredient.syncIndexes();
  } catch (err) {
    if (err && err.codeName === 'NamespaceNotFound') return; // collection not created yet
    console.error('ensureIngredientIndexes error:', err.message);
  }
};

module.exports = {
  unitKind,
  formatIngredient,
  getIngredientsByMaterialIds,
  getMaterialIngredients,
  attachIngredients,
  normalizeIngredientList,
  replaceMaterialIngredients,
  deleteMaterialIngredients,
  ensureIngredientIndexes,
  IngredientValidationError
};
