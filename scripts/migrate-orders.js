const mongoose = require("mongoose");
const fs = require("fs");
const path = require("path");

function loadEnv(filename) {
  const envPath = path.resolve(process.cwd(), filename);
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
}

loadEnv(".env");
loadEnv(".env.local");

let MONGODB_URI = process.env.MONGODB_URI || process.env.DATABASE_URL;
if (MONGODB_URI && (MONGODB_URI.startsWith('"') || MONGODB_URI.startsWith("'"))) {
  MONGODB_URI = MONGODB_URI.slice(1, -1);
}

if (!MONGODB_URI) {
  throw new Error("Please define the MONGODB_URI or DATABASE_URL environment variable");
}

const OrderSchema = new mongoose.Schema({
  status: String,
  digiflazzStatus: String,
  paymentStatus: String,
  orderStatus: String,
}, { strict: false });

const Order = mongoose.models.Order || mongoose.model("Order", OrderSchema);

async function migrate() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log("Connected to MongoDB.");

    const orders = await Order.find({
      $or: [
        { paymentStatus: { $exists: false } },
        { orderStatus: { $exists: false } },
      ]
    });
    console.log(`Found ${orders.length} orders to migrate.`);

    for (const order of orders) {
      let paymentStatus = "UNPAID";
      let orderStatus = "PENDING";

      const oldStatus = order.get("status");

      if (oldStatus === "SUCCESS") {
        paymentStatus = "PAID";
        orderStatus = "SUCCESS";
      } else if (oldStatus === "PAID") {
        paymentStatus = "PAID";
        orderStatus = "PENDING";
      } else if (oldStatus === "PROCESSING") {
        paymentStatus = "PAID";
        orderStatus = "PROCESSING";
      } else if (oldStatus === "FAILED" || oldStatus === "CANCELLED") {
        paymentStatus = "FAILED";
        orderStatus = "FAILED";
      } else if (oldStatus === "REFUNDED") {
        paymentStatus = "REFUNDED";
        orderStatus = "FAILED";
      }

      order.set("paymentStatus", paymentStatus);
      order.set("orderStatus", orderStatus);
      
      // Optionally unset old fields
      // order.set("status", undefined);
      // order.set("digiflazzStatus", undefined);

      await order.save();
    }

    console.log("Migration completed.");
    process.exit(0);
  } catch (error) {
    console.error("Migration failed:", error);
    process.exit(1);
  }
}

migrate();
