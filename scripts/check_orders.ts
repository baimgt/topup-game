import { connectDB } from "../src/lib/mongoose";
import Order from "../src/models/Order";

async function main() {
  await connectDB();
  const orders = await Order.find().sort({ createdAt: -1 }).limit(10).lean();
  console.log("LAST 10 ORDERS:");
  orders.forEach(o => {
    console.log(`- Order: ${o.orderNumber}, Name: ${o.customerName}, Email: ${o.customerEmail}, Amount: ${o.totalAmount}, PaymentStatus: ${o.paymentStatus}, OrderStatus: ${o.orderStatus}, isFlashSale: ${o.isFlashSale}`);
  });
  process.exit(0);
}

main().catch(console.error);
