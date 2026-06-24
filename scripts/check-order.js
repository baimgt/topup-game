const mongoose = require("mongoose");
const fs = require("fs");
const path = require("path");

const envPath = path.resolve(process.cwd(), ".env");
if (fs.existsSync(envPath)) {
  const envConfig = fs.readFileSync(envPath, "utf8");
  envConfig.split("\n").forEach((line) => {
    line = line.trim();
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) {
      process.env[match[1]] = match[2];
    }
  });
}

const MONGODB_URI = process.env.MONGODB_URI || process.env.DATABASE_URL;

if (!MONGODB_URI) {
  throw new Error("Please define the MONGODB_URI or DATABASE_URL environment variable");
}

const OrderSchema = new mongoose.Schema({
  orderNumber: String,
  paymentStatus: String,
  orderStatus: String,
  notes: String,
  digiflazzRef: String,
}, { strict: false });

const Order = mongoose.models.Order || mongoose.model("Order", OrderSchema);

async function check() {
  try {
    let uri = MONGODB_URI;
    if (uri.startsWith('"') || uri.startsWith("'")) {
      uri = uri.slice(1, -1);
    }
    await mongoose.connect(uri);
    
    const order = await Order.findOne().sort({ createdAt: -1 });
    console.log("Last Order:", JSON.stringify(order, null, 2));
    
    process.exit(0);
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
}

check();
