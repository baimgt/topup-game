import { connectDB } from "../src/lib/mongoose";
import Game from "../src/models/Game";

async function main() {
  await connectDB();
  const games = await Game.find().lean();
  console.log("ALL GAMES AND CATEGORIES:");
  games.forEach(g => {
    console.log(`- Game: ${g.name}, Category: ${g.category}, isActive: ${g.isActive}`);
  });
  process.exit(0);
}

main().catch(console.error);
