const mongoose = require('mongoose');

async function initSortOrders() {
  await mongoose.connect('mongodb://localhost:27017/game_topup');
  const db = mongoose.connection.db;
  
  // Get all games in their current DB order
  const games = await db.collection('games').find({}).sort({ _id: 1 }).toArray();
  
  console.log(`Total games: ${games.length}`);
  console.log('Assigning sequential sortOrder and homeSortOrder...\n');
  
  // Assign sequential numbers 1,2,3... to all games
  for (let i = 0; i < games.length; i++) {
    const order = i + 1;
    await db.collection('games').updateOne(
      { _id: games[i]._id },
      { $set: { sortOrder: order, homeSortOrder: order } }
    );
    console.log(`  [${order}] ${games[i].name} (sortOrder=${order}, homeSortOrder=${order})`);
  }
  
  console.log('\nDone! All games now have sequential sort orders.');
  console.log('You can now change individual numbers in Admin to reorder them.');
  
  await mongoose.disconnect();
}

initSortOrders().catch(console.error);
