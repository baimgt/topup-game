const mongoose = require('mongoose');

async function check() {
  await mongoose.connect('mongodb://localhost:27017/game_topup');
  const db = mongoose.connection.db;
  
  const games = await db.collection('games').find({}).sort({ sortOrder: 1, homeSortOrder: 1 }).toArray();
  
  const nonZero = games.filter(g => g.sortOrder > 0 || g.homeSortOrder > 0);
  
  if (nonZero.length === 0) {
    console.log('TIDAK ADA game dengan sortOrder atau homeSortOrder > 0. Semua masih 0.');
    console.log('\nSemua game:');
    games.forEach(g => console.log('  ' + g.name + ': sortOrder=' + g.sortOrder + ', homeSortOrder=' + g.homeSortOrder + ', statusCategory=' + (g.statusCategory || '-')));
  } else {
    console.log('Game dengan sortOrder/homeSortOrder > 0:');
    nonZero.forEach(g => console.log('  ' + g.name + ': sortOrder=' + g.sortOrder + ', homeSortOrder=' + g.homeSortOrder));
  }
  
  await mongoose.disconnect();
}

check().catch(console.error);
