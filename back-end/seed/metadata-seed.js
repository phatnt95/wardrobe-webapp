const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

// Load environment variables from the .env file in the back-end directory
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const masterDataPath = path.join(__dirname, 'master-data.json');
const masterData = JSON.parse(fs.readFileSync(masterDataPath, 'utf8'));

// Define the BaseMetadata schema structure
const baseMetadataSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true, trim: true },
  description: { type: String }
}, { timestamps: true });

// Compile models
// By omitting the collection name argument, Mongoose will auto-pluralize the model name
// matching what NestJS does under the hood by default.
const Brand = mongoose.model('Brand', baseMetadataSchema);
const Category = mongoose.model('Category', baseMetadataSchema);
const Neckline = mongoose.model('Neckline', baseMetadataSchema);
const Occasion = mongoose.model('Occasion', baseMetadataSchema);
const SeasonCode = mongoose.model('SeasonCode', baseMetadataSchema);
const SleeveLength = mongoose.model('SleeveLength', baseMetadataSchema);
const Style = mongoose.model('Style', baseMetadataSchema);
const Size = mongoose.model('Size', baseMetadataSchema);
const Shoulder = mongoose.model('Shoulder', baseMetadataSchema);

const modelsMap = {
  Brand,
  Category,
  Neckline,
  Occasion,
  SeasonCode,
  SleeveLength,
  Style,
  Size,
  Shoulder
};

async function seed() {
  const uri = process.env.MONGO_URI || 'mongodb://localhost:27017/wardrobe';
  console.log('Connecting to MongoDB...', uri);
  
  try {
    await mongoose.connect(uri);
    console.log('Connected to MongoDB successfully.');
    
    for (const [collectionKey, dataArray] of Object.entries(masterData)) {
      const Model = modelsMap[collectionKey];
      if (!Model) {
        console.warn(`No Mongoose model found for key: ${collectionKey}`);
        continue;
      }
      
      console.log(`Seeding ${collectionKey}...`);
      let insertedCount = 0;
      let updatedCount = 0;

      for (const item of dataArray) {
        // Use updateOne with upsert to add or update records safely
        // preventing unique key collision exceptions
        const result = await Model.updateOne(
          { name: item.name },
          { $set: item },
          { upsert: true }
        );

        if (result.upsertedCount > 0) {
          insertedCount++;
        } else if (result.modifiedCount > 0) {
          updatedCount++;
        }
      }
      console.log(`Finished ${collectionKey}: ${insertedCount} inserted, ${updatedCount} updated.`);
    }
    
    console.log('\nAll metadata seeded successfully!');
  } catch (error) {
    console.error('Error seeding data:', error);
  } finally {
    // Ensure the script exits by terminating the connection
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB.');
  }
}

seed();
