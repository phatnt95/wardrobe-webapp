/**
 * Backfill Embeddings Script
 * 
 * Generates and saves vector embeddings for all existing items that
 * don't have one yet. Uses the Gemini embedding API directly.
 * 
 * Usage:  node seed/backfill-embeddings.js
 */

const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

// ─── Google Generative AI SDK ────────────────────────────────────────────────
const { GoogleGenerativeAI } = require('@google/generative-ai');

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
if (!GEMINI_API_KEY) {
  console.error('❌ GEMINI_API_KEY not found in .env');
  process.exit(1);
}
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

// ─── Mongoose Schemas (minimal, matching the app) ────────────────────────────
const baseMetadataSchema = new mongoose.Schema({ name: String }, { strict: false });

const Brand = mongoose.model('Brand', baseMetadataSchema);
const Category = mongoose.model('Category', baseMetadataSchema);
const Neckline = mongoose.model('Neckline', baseMetadataSchema);
const Occasion = mongoose.model('Occasion', baseMetadataSchema);
const SeasonCode = mongoose.model('SeasonCode', baseMetadataSchema);
const SleeveLength = mongoose.model('SleeveLength', baseMetadataSchema);
const Style = mongoose.model('Style', baseMetadataSchema);

const itemSchema = new mongoose.Schema({
  name: String,
  description: String,
  color: String,
  tags: [String],
  embedding: [Number],
  owner: mongoose.Schema.Types.ObjectId,
  category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category' },
  brand: { type: mongoose.Schema.Types.ObjectId, ref: 'Brand' },
  style: { type: mongoose.Schema.Types.ObjectId, ref: 'Style' },
  occasion: { type: mongoose.Schema.Types.ObjectId, ref: 'Occasion' },
  seasonCode: { type: mongoose.Schema.Types.ObjectId, ref: 'SeasonCode' },
  neckline: { type: mongoose.Schema.Types.ObjectId, ref: 'Neckline' },
  sleeveLength: { type: mongoose.Schema.Types.ObjectId, ref: 'SleeveLength' },
}, { strict: false });

const Item = mongoose.model('Item', itemSchema);

// ─── Helper: Build description text (mirrors ItemDescriptionHelper) ──────────
function buildDescription(item) {
  const parts = [
    `Item: ${item.name || 'unknown'}`,
    `Category: ${item.category?.name || 'unknown'}`,
    `Brand: ${item.brand?.name || 'unknown'}`,
    `Style: ${item.style?.name || 'unknown'}`,
    `Occasion: ${item.occasion?.name || 'unknown'}`,
    `Season: ${item.seasonCode?.name || 'unknown'}`,
    `Neckline: ${item.neckline?.name || 'unknown'}`,
    `Sleeve Length: ${item.sleeveLength?.name || 'unknown'}`,
    `Color: ${item.color || 'unknown'}`,
    `Tags: ${item.tags?.join(', ') || ''}`,
  ];
  return parts.join('. ');
}

// ─── Helper: Generate embedding with rate-limit retry ────────────────────────
async function generateEmbedding(text, retries = 3) {
  const model = genAI.getGenerativeModel({ model: 'text-embedding-004' });
  // const model = genAI.getGenerativeModel({ model: 'gemini-embedding-001' });

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const result = await model.embedContent(text);
      return result.embedding.values;
    } catch (error) {
      if (error.status === 429 && attempt < retries) {
        const waitMs = 5000 * attempt; // 5s, 10s, 15s
        console.warn(`  ⏳ Rate limited. Waiting ${waitMs / 1000}s before retry ${attempt}/${retries}...`);
        await sleep(waitMs);
      } else {
        throw error;
      }
    }
  }
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ─── Main ────────────────────────────────────────────────────────────────────
async function main() {
  const uri = process.env.MONGO_URI || 'mongodb://localhost:27017/wardrobe';
  console.log('🔌 Connecting to MongoDB...');
  await mongoose.connect(uri);
  console.log('✅ Connected.\n');

  // Find items with no embedding (or empty embedding)
  const items = await Item.find({
    $or: [
      { embedding: { $exists: false } },
      { embedding: { $size: 0 } },
      { embedding: null },
    ],
  })
    .populate('category', 'name')
    .populate('brand', 'name')
    .populate('style', 'name')
    .populate('occasion', 'name')
    .populate('seasonCode', 'name')
    .populate('neckline', 'name')
    .populate('sleeveLength', 'name');

  console.log(`📦 Found ${items.length} items without embeddings.\n`);

  if (items.length === 0) {
    console.log('🎉 All items already have embeddings. Nothing to do.');
    await mongoose.disconnect();
    return;
  }

  let success = 0;
  let failed = 0;
  const BATCH_DELAY_MS = 500; // Delay between items to respect Gemini rate limits

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    const label = `[${i + 1}/${items.length}] ${item.name || item._id}`;

    try {
      const text = buildDescription(item);
      const embedding = await generateEmbedding(text);

      await Item.updateOne(
        { _id: item._id },
        { $set: { embedding } },
      );

      console.log(`  ✅ ${label} — ${embedding.length} dimensions`);
      success++;
    } catch (error) {
      console.error(`  ❌ ${label} — ${error.message}`);
      failed++;
    }

    // Small delay to avoid hitting Gemini rate limits
    if (i < items.length - 1) {
      await sleep(BATCH_DELAY_MS);
    }
  }

  console.log(`\n────────────────────────────────`);
  console.log(`✅ Success: ${success}`);
  console.log(`❌ Failed:  ${failed}`);
  console.log(`📊 Total:   ${items.length}`);
  console.log(`────────────────────────────────\n`);

  await mongoose.disconnect();
  console.log('🔌 Disconnected from MongoDB.');
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
