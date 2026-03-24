const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

// Load environment variables from the .env file in the back-end directory
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const locationDataPath = path.join(__dirname, 'location-data.json');
const locationData = JSON.parse(fs.readFileSync(locationDataPath, 'utf8'));

// Define the Location schema
const locationSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    type: { type: String, required: true },
    parent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Location',
      default: null,
    },
    path: { type: String, index: true },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true },
);

// Compile the model (NestJS typically maps Location -> locations collection)
const Location = mongoose.model('Location', locationSchema, 'locations');

async function seed() {
  const uri = process.env.MONGO_URI || 'mongodb://localhost:27017/wardrobe';
  console.log('Connecting to MongoDB...', uri);

  try {
    await mongoose.connect(uri);
    console.log('Connected to MongoDB successfully.');

    let insertedCount = 0;
    let updatedCount = 0;

    console.log('Seeding locations...');

    for (const item of locationData) {
      let parentObjectId = null;

      // Look up the parent ObjectId by name if the parent is defined
      if (item.parent) {
        const parentDoc = await Location.findOne({ name: item.parent });
        if (parentDoc) {
          parentObjectId = parentDoc._id;
        } else {
          console.warn(
            `[!] Warning: Parent location '${item.parent}' not found in DB for '${item.name}'. Saving location with null parent.`,
          );
        }
      }

      const updateData = {
        name: item.name,
        type: item.type,
        parent: parentObjectId,
        path: item.path,
        // 'owner' is left out as this is a master seed available to the whole application
      };

      // We use 'path' as the unique identifier for upserting, to prevent duplicates
      // while allowing renaming if needed
      const result = await Location.updateOne(
        { path: item.path },
        { $set: updateData },
        { upsert: true },
      );

      if (result.upsertedCount > 0) {
        insertedCount++;
      } else if (result.modifiedCount > 0) {
        updatedCount++;
      }
    }

    console.log(
      `\nLocation seed completed: ${insertedCount} inserted, ${updatedCount} updated.`,
    );
  } catch (error) {
    console.error('Error seeding data:', error);
  } finally {
    // Terminate DB connection properly
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB.');
  }
}

seed();
