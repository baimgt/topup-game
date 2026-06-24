import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const MONGODB_URI = process.env.DATABASE_URL || "mongodb://localhost:27017/game_topup";

// ── Schemas (inline agar tidak perlu import path alias) ──────────────────────

const UserSchema = new mongoose.Schema(
  { email: { type: String, unique: true }, name: String, password: String, role: { type: String, default: "USER" } },
  { timestamps: true }
);
const GameSchema = new mongoose.Schema(
  { name: String, slug: { type: String, unique: true }, description: String, imageUrl: String, category: String, isActive: { type: Boolean, default: true }, sortOrder: { type: Number, default: 0 } },
  { timestamps: true }
);
const ProductSchema = new mongoose.Schema(
  { gameId: mongoose.Schema.Types.ObjectId, name: String, description: String, price: Number, sellingPrice: Number, digiflazzSku: String, category: String, isActive: { type: Boolean, default: true }, sortOrder: { type: Number, default: 0 } },
  { timestamps: true }
);

const User = mongoose.models.User || mongoose.model("User", UserSchema);
const Game = mongoose.models.Game || mongoose.model("Game", GameSchema);
const Product = mongoose.models.Product || mongoose.model("Product", ProductSchema);

// ── Data ─────────────────────────────────────────────────────────────────────

const gamesData = [
  { name: "Mobile Legends: Bang Bang", slug: "mobile-legends", description: "Game MOBA mobile paling populer di Asia Tenggara", category: "MOBA", imageUrl: "", sortOrder: 1 },
  { name: "Free Fire", slug: "free-fire", description: "Battle royale mobile yang seru dan kompetitif", category: "Battle Royale", imageUrl: "", sortOrder: 2 },
  { name: "PUBG Mobile", slug: "pubg-mobile", description: "Game battle royale terpopuler di dunia", category: "Battle Royale", imageUrl: "", sortOrder: 3 },
  { name: "Genshin Impact", slug: "genshin-impact", description: "RPG open-world dengan grafis memukau", category: "RPG", imageUrl: "", sortOrder: 4 },
  { name: "Valorant", slug: "valorant", description: "Tactical shooter 5v5 dari Riot Games", category: "PC", imageUrl: "", sortOrder: 5 },
];

const productsData: Record<string, Array<{ name: string; price: number; sellingPrice: number; digiflazzSku: string; category: string; sortOrder: number }>> = {
  "mobile-legends": [
    { name: "86 Diamond",   price: 15000,  sellingPrice: 17000,  digiflazzSku: "mlbb-86",   category: "Diamond", sortOrder: 1 },
    { name: "172 Diamond",  price: 29000,  sellingPrice: 32000,  digiflazzSku: "mlbb-172",  category: "Diamond", sortOrder: 2 },
    { name: "257 Diamond",  price: 43000,  sellingPrice: 47000,  digiflazzSku: "mlbb-257",  category: "Diamond", sortOrder: 3 },
    { name: "344 Diamond",  price: 57000,  sellingPrice: 62000,  digiflazzSku: "mlbb-344",  category: "Diamond", sortOrder: 4 },
    { name: "514 Diamond",  price: 85000,  sellingPrice: 92000,  digiflazzSku: "mlbb-514",  category: "Diamond", sortOrder: 5 },
    { name: "706 Diamond",  price: 115000, sellingPrice: 125000, digiflazzSku: "mlbb-706",  category: "Diamond", sortOrder: 6 },
    { name: "1412 Diamond", price: 228000, sellingPrice: 245000, digiflazzSku: "mlbb-1412", category: "Diamond", sortOrder: 7 },
    { name: "2195 Diamond", price: 350000, sellingPrice: 375000, digiflazzSku: "mlbb-2195", category: "Diamond", sortOrder: 8 },
  ],
  "free-fire": [
    { name: "70 Diamond",   price: 12000,  sellingPrice: 14000,  digiflazzSku: "ff-70",   category: "Diamond", sortOrder: 1 },
    { name: "140 Diamond",  price: 23000,  sellingPrice: 26000,  digiflazzSku: "ff-140",  category: "Diamond", sortOrder: 2 },
    { name: "355 Diamond",  price: 57000,  sellingPrice: 62000,  digiflazzSku: "ff-355",  category: "Diamond", sortOrder: 3 },
    { name: "720 Diamond",  price: 113000, sellingPrice: 122000, digiflazzSku: "ff-720",  category: "Diamond", sortOrder: 4 },
    { name: "1450 Diamond", price: 225000, sellingPrice: 242000, digiflazzSku: "ff-1450", category: "Diamond", sortOrder: 5 },
  ],
  "pubg-mobile": [
    { name: "60 UC",   price: 14000,  sellingPrice: 16000,  digiflazzSku: "pubg-60",   category: "UC", sortOrder: 1 },
    { name: "325 UC",  price: 72000,  sellingPrice: 78000,  digiflazzSku: "pubg-325",  category: "UC", sortOrder: 2 },
    { name: "660 UC",  price: 143000, sellingPrice: 154000, digiflazzSku: "pubg-660",  category: "UC", sortOrder: 3 },
    { name: "1800 UC", price: 385000, sellingPrice: 415000, digiflazzSku: "pubg-1800", category: "UC", sortOrder: 4 },
  ],
  "genshin-impact": [
    { name: "60 Primogem",   price: 14000,  sellingPrice: 16000,  digiflazzSku: "gi-60",   category: "Primogem", sortOrder: 1 },
    { name: "300 Primogem",  price: 68000,  sellingPrice: 74000,  digiflazzSku: "gi-300",  category: "Primogem", sortOrder: 2 },
    { name: "980 Primogem",  price: 220000, sellingPrice: 238000, digiflazzSku: "gi-980",  category: "Primogem", sortOrder: 3 },
    { name: "1980 Primogem", price: 440000, sellingPrice: 475000, digiflazzSku: "gi-1980", category: "Primogem", sortOrder: 4 },
  ],
  "valorant": [
    { name: "475 VP",  price: 50000,  sellingPrice: 55000,  digiflazzSku: "valo-475",  category: "VP", sortOrder: 1 },
    { name: "1000 VP", price: 100000, sellingPrice: 108000, digiflazzSku: "valo-1000", category: "VP", sortOrder: 2 },
    { name: "2050 VP", price: 200000, sellingPrice: 215000, digiflazzSku: "valo-2050", category: "VP", sortOrder: 3 },
    { name: "3650 VP", price: 350000, sellingPrice: 378000, digiflazzSku: "valo-3650", category: "VP", sortOrder: 4 },
  ],
};

// ── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log("🔌 Connecting to MongoDB...");
  await mongoose.connect(MONGODB_URI);
  console.log("✅ Connected!\n🌱 Seeding...\n");

  // Admin user
  const existing = await User.findOne({ email: "admin@gametopup.com" });
  if (!existing) {
    const hashed = await bcrypt.hash("admin123", 12);
    await User.create({ email: "admin@gametopup.com", name: "Admin", password: hashed, role: "ADMIN" });
    console.log("✅ Admin user dibuat");
  } else {
    console.log("⏭️  Admin user sudah ada");
  }

  // Games & Products
  for (const gameData of gamesData) {
    let game = await Game.findOne({ slug: gameData.slug });
    if (!game) {
      game = await Game.create(gameData);
      console.log(`✅ Game: ${game.name}`);
    } else {
      console.log(`⏭️  Game sudah ada: ${game.name}`);
    }

    const products = productsData[game.slug] || [];
    let created = 0;
    for (const p of products) {
      const exists = await Product.findOne({ gameId: game._id, digiflazzSku: p.digiflazzSku });
      if (!exists) {
        await Product.create({ ...p, gameId: game._id });
        created++;
      }
    }
    if (created > 0) console.log(`   └─ ${created} produk baru ditambahkan`);
  }

  console.log("\n🎉 Seeding selesai!");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("📧 Admin : admin@gametopup.com");
  console.log("🔑 Pass  : admin123");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
}

main()
  .catch((e) => { console.error("❌ Seed error:", e); process.exit(1); })
  .finally(() => mongoose.disconnect());
