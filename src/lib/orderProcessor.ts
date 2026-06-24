import mongoose from "mongoose";
import Order from "@/models/Order";
import PaymentConfig from "@/models/PaymentConfig";
import { getTransactionStatus } from "@/lib/midtrans";
import { createTransaction, generateRefId } from "@/lib/digiflazz";

/**
 * Decrement flash sale stock for a given order if it is a flash sale order and hasn't been decremented yet.
 */
export async function decrementFlashSaleStock(order: any) {
  if (order.isFlashSale && !order.flashSaleDecremented) {
    try {
      const FlashSaleModel = mongoose.models.FlashSale || mongoose.model("FlashSale");
      const flashSale = await FlashSaleModel.findOne({
        productId: order.orderItems[0].productId
      }).sort({ createdAt: -1 });
      
      if (flashSale) {
        flashSale.stockLeft = Math.max(0, flashSale.stockLeft - 1);
        if (flashSale.stockLeft === 0) {
          flashSale.isActive = false;
        }
        await flashSale.save();
        order.flashSaleDecremented = true;
      }
    } catch (fsErr) {
      console.error("Failed to decrement flash sale stock:", fsErr);
    }
  }
}

/**
 * Memproses top-up ke Digiflazz setelah pembayaran berhasil.
 */
export async function processOrderPayment(order: any) {
  try {
    await decrementFlashSaleStock(order);
    
    const item = order.orderItems[0];
    if (item) {
      const ProductModel = mongoose.models.Product || mongoose.model("Product");
      const product = await ProductModel.findById(item.productId);
      
      if (!product || !product.digiflazzSku) {
        throw new Error("SKU Digiflazz tidak ditemukan pada produk ini");
      }

      const refId = generateRefId();
      const customerNo = order.gameServerId
        ? `${order.gameUserId}${order.gameServerId}`
        : order.gameUserId;

      order.orderStatus = "PROCESSING";
      order.digiflazzRef = refId;
      await order.save();

      const paymentConfig = await PaymentConfig.findOne();
      const digiResult = await createTransaction(
        product.digiflazzSku,
        customerNo,
        refId,
        {
          username: paymentConfig?.digiflazzUsername,
          apiKey: paymentConfig?.digiflazzApiKey,
          testing: false, // Jika pakai kredensial dari dashboard, matikan mode testing statis
        }
      );

      order.orderStatus = digiResult.status === "Sukses" ? "SUCCESS" : digiResult.status === "Gagal" ? "FAILED" : "PROCESSING";
      order.notes = digiResult.message;
      await order.save();
    }
  } catch (err: any) {
    console.error("Digiflazz error:", err.response?.data || err);
    order.orderStatus = "FAILED";
    const digiMsg = err.response?.data?.data?.message || err.response?.data?.message || err.message;
    order.notes = digiMsg || "Gagal memproses transaksi Digiflazz";
    await order.save();
  }
}

/**
 * Cek status Midtrans secara manual (berguna saat di localhost / webhook gagal).
 * Akan merubah status pembayaran dan otomatis memicu Digiflazz jika lunas.
 */
export async function syncOrderStatus(orderNumber: string) {
  const paymentConfig = await PaymentConfig.findOne();
  if (!paymentConfig) return null;

  const order = await Order.findOne({ orderNumber });
  if (!order || (order.paymentStatus !== "UNPAID" && order.orderStatus !== "PROCESSING")) return order;

  // Sync Midtrans/Duitku if UNPAID
  if (order.paymentStatus === "UNPAID") {
    // Try Midtrans first
    try {
      const statusRes = await getTransactionStatus(
        orderNumber,
        paymentConfig.midtransServerKey,
        paymentConfig.midtransClientKey,
        paymentConfig.midtransIsProduction
      );

      if (statusRes && statusRes.transaction_status) {
        const { transaction_status, fraud_status } = statusRes;
        
        let newStatus: string = order.paymentStatus;
        if (transaction_status === "capture" || transaction_status === "settlement") {
          if (fraud_status === "accept" || !fraud_status) newStatus = "PAID";
        } else if (["deny", "cancel"].includes(transaction_status)) {
          newStatus = "FAILED";
        } else if (transaction_status === "expire") {
          newStatus = "EXPIRED";
        }

        if (newStatus !== order.paymentStatus) {
          order.paymentStatus = newStatus as any;
          if (newStatus === "PAID") {
            order.paidAt = new Date();
            await order.save();
            await processOrderPayment(order);
          } else {
            await order.save();
          }
          return order; // Jika berhasil sync Midtrans, return langsung
        }
      }
    } catch (e) {
      // Not a midtrans order or failed to fetch
    }

    // Try Duitku
    try {
      const { checkDuitkuTransactionStatus } = await import("@/lib/duitku");
      const statusRes = await checkDuitkuTransactionStatus(orderNumber, {
        merchantCode: paymentConfig.duitkuMerchantCode,
        apiKey: paymentConfig.duitkuApiKey,
        isProduction: paymentConfig.duitkuIsProduction
      });

      if (statusRes && statusRes.statusCode) {
        let newStatus: string = order.paymentStatus;
        // 00 = Success, 01 = Pending, 02 = Failed
        if (statusRes.statusCode === "00") {
          newStatus = "PAID";
        } else if (statusRes.statusCode === "02") {
          newStatus = "FAILED";
        }

        if (newStatus !== order.paymentStatus) {
          order.paymentStatus = newStatus as any;
          if (newStatus === "PAID") {
            order.paidAt = new Date();
            await order.save();
            await processOrderPayment(order);
          } else {
            await order.save();
          }
        }
      }
    } catch (e) {
      // Failed to sync Duitku
    }
  }

  // Jika payment sudah PAID dan orderStatus masih PROCESSING, cek status di Digiflazz
  if (order.paymentStatus === "PAID" && order.orderStatus === "PROCESSING" && order.digiflazzRef) {
    try {
      const { checkTransactionStatus } = await import("@/lib/digiflazz");
      const digiStatus = await checkTransactionStatus(order.digiflazzRef, {
        username: paymentConfig.digiflazzUsername,
        apiKey: paymentConfig.digiflazzApiKey
      });

      if (digiStatus && digiStatus.status) {
        if (digiStatus.status === "Sukses") {
          order.orderStatus = "SUCCESS";
          order.notes = digiStatus.message || order.notes;
          await order.save();
        } else if (digiStatus.status === "Gagal") {
          order.orderStatus = "FAILED";
          order.notes = digiStatus.message || order.notes;
          await order.save();
        }
      }
    } catch (e) {
      console.log("Sync Digiflazz failed for", orderNumber);
    }
  }

  return order;
}
