const mongoose = require('mongoose');

async function fix() {
  await mongoose.connect('mongodb://admin:password@localhost:27017/wardrobe-app?authSource=admin');
  const collection = mongoose.connection.collection('items');
  const items = await collection.find({}).toArray();
  
  let deleted = 0;
  for (const item of items) {
     if (item.location) {
         try {
            new mongoose.Types.ObjectId(String(item.location));
         } catch(e) {
            console.log("Removing invalid item:", item._id, "Location:", item.location);
            await collection.deleteOne({ _id: item._id });
            deleted++;
         }
     }
  }
  console.log("Done! Deleted", deleted, "corrupted items.");
  process.exit(0);
}

fix();
