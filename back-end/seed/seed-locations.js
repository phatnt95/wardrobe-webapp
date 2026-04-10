require('dotenv').config();
const mongoose = require('mongoose');

// Fallback to local dev URI if MONGO_URI isn't inside .env
const MONGO_URI = process.env.MONGO_URI || 'mongodb://admin:password@72.62.247.116:27017';

const locationSchema = new mongoose.Schema({
  name: String,
  type: String,
  parent: { type: mongoose.Schema.Types.ObjectId, ref: 'Location', default: null },
  path: String,
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

// Prevent mongoose from trying to pluralize names if we strictly match existing collection
const Location = mongoose.model('Location', locationSchema, 'locations');

async function run() {
  try {
    console.log(`Connecting to script DB...`);
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB successfully.');

    // Fetch all locations to build an in-memory tree reference
    const locations = await Location.find().lean();
    console.log(`Found ${locations.length} locations. Resolving new paths...`);

    const locMap = new Map();
    locations.forEach(l => locMap.set(l._id.toString(), l));

    // Cache precalculated paths to handle deep trees extremely fast
    const calculatedPaths = new Map();

    function buildPath(loc) {
      if (calculatedPaths.has(loc._id.toString())) {
        return calculatedPaths.get(loc._id.toString());
      }

      let resultPath;
      if (!loc.parent) {
        // Root items path is just their id
        resultPath = loc._id.toString();
      } else {
        const parentLoc = locMap.get(loc.parent.toString());
        if (parentLoc) {
            // Child concatenates parent's full recursive path + '/' + its own ID
          resultPath = `${buildPath(parentLoc)}/${loc._id.toString()}`;
        } else {
          // If dangling pointer (parent doesn't exist), fallback to root behavior
          resultPath = loc._id.toString();
        }
      }

      calculatedPaths.set(loc._id.toString(), resultPath);
      return resultPath;
    }

    // Construct Bulk Operations array to run all updates instantly
    const bulkOps = [];
    for (const loc of locations) {
      const newPath = buildPath(loc);
      if (loc.path !== newPath) {
        bulkOps.push({
          updateOne: {
            filter: { _id: loc._id },
            update: { $set: { path: newPath } }
          }
        });
      }
    }

    if (bulkOps.length > 0) {
      console.log(`Executing bulkWrite for ${bulkOps.length} updates...`);
      const res = await Location.bulkWrite(bulkOps);
      console.log(`✔ Successfully updated paths for ${res.modifiedCount} locations.`);
    } else {
      console.log('✔ All locations already have the correct paths!');
    }

  } catch (error) {
    console.error('✖ Error running script:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from DB.');
  }
}

run();
