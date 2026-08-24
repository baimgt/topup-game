import nodemailer from "nodemailer";
import { connectDB } from "./mongoose";
import Setting from "@/models/Setting";

export async function sendOtpEmail(email: string, name: string, otp: string) {
  // Load SMTP config & Site Branding from database, or fallback to environment variables
  let host = process.env.SMTP_HOST;
  let port = parseInt(process.env.SMTP_PORT || "587");
  let user = process.env.SMTP_USER;
  let pass = process.env.SMTP_PASS;
  let siteName = "GamerStore";
  let siteLogo = "";
  let siteDescription = "Top Up Game Terpercaya";
  let from = process.env.SMTP_FROM || `"GamerStore" <no-reply@gamerstore.com>`;

  try {
    await connectDB();
    const settings = await Setting.findOne({});
    if (settings) {
      if (settings.siteName) siteName = settings.siteName;
      if (settings.siteLogo) siteLogo = settings.siteLogo;
      if (settings.siteDescription) siteDescription = settings.siteDescription;
      if (settings.smtpHost) host = settings.smtpHost;
      if (settings.smtpPort) port = settings.smtpPort;
      if (settings.smtpUser) user = settings.smtpUser;
      if (settings.smtpPass) pass = settings.smtpPass;
      if (settings.smtpFrom) from = settings.smtpFrom;
      else from = `"${siteName}" <no-reply@gamerstore.com>`;
    }
  } catch (error) {
    console.error("Failed to load SMTP settings from DB, using fallback:", error);
  }

  // If SMTP is not configured, fall back to console logging
  if (!host || !user || !pass) {
    console.log("=========================================");
    console.log(`[DEV ONLY] OTP CODE FOR ${email}: ${otp}`);
    console.log("=========================================");
    return true;
  }

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465, // true for 465, false for other ports
    auth: {
      user,
      pass,
    },
  });

  const mailOptions = {
    from,
    to: email,
    subject: `Verifikasi Akun - ${siteName}`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #332759; border-radius: 12px; background-color: #0b071e; color: #ffffff;">
        <div style="text-align: center; margin-bottom: 20px;">
          ${siteLogo ? `<div style="margin-bottom: 8px;"><img src="${siteLogo}" alt="${siteName}" style="height: 48px; max-width: 200px; object-fit: contain;" /></div>` : ''}
          <h2 style="color: #a855f7; margin: 0 0 5px 0; font-weight: 900; font-size: 26px;">${siteName}</h2>
          <p style="color: #94a3b8; font-size: 14px; margin-top: 0;">${siteDescription}</p>
        </div>
        <hr style="border: 0; border-top: 1px solid #332759; margin: 20px 0;">
        <p>Halo, <strong>${name}</strong></p>
        <p>Terima kasih telah melakukan registrasi. Silakan gunakan kode OTP di bawah ini untuk memverifikasi pendaftaran akun Anda:</p>
        <div style="text-align: center; margin: 30px 0;">
          <span style="font-size: 32px; font-weight: 900; letter-spacing: 6px; color: #06b6d4; padding: 12px 28px; background-color: #160f38; border-radius: 10px; border: 1px solid #a855f7; display: inline-block;">${otp}</span>
        </div>
        <p style="color: #94a3b8; font-size: 14px; line-height: 1.6;">Kode ini berlaku selama <strong>10 menit</strong>. Jika Anda tidak merasa melakukan pendaftaran ini, silakan abaikan email ini.</p>
        <hr style="border: 0; border-top: 1px solid #332759; margin: 20px 0;">
        <p style="font-size: 12px; color: #64748b; text-align: center;">&copy; ${new Date().getFullYear()} ${siteName}. All rights reserved.</p>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
  return true;
}

export async function sendInvoiceEmail(order: any) {
  let host = process.env.SMTP_HOST;
  let port = parseInt(process.env.SMTP_PORT || "587");
  let user = process.env.SMTP_USER;
  let pass = process.env.SMTP_PASS;
  let siteName = "GamerStore";
  let siteLogo = "";
  let siteDescription = "Top Up Game Terpercaya";
  let from = process.env.SMTP_FROM || `"GamerStore" <no-reply@gamerstore.com>`;

  try {
    await connectDB();
    const settings = await Setting.findOne({});
    if (settings) {
      if (settings.siteName) siteName = settings.siteName;
      if (settings.siteLogo) siteLogo = settings.siteLogo;
      if (settings.siteDescription) siteDescription = settings.siteDescription;
      if (settings.smtpHost) host = settings.smtpHost;
      if (settings.smtpPort) port = settings.smtpPort;
      if (settings.smtpUser) user = settings.smtpUser;
      if (settings.smtpPass) pass = settings.smtpPass;
      if (settings.smtpFrom) from = settings.smtpFrom;
      else from = `"${siteName}" <no-reply@gamerstore.com>`;
    }
  } catch (error) {
    console.error("Failed to load SMTP settings from DB, using fallback:", error);
  }

  // If SMTP is not configured, fall back to console logging
  if (!host || !user || !pass) {
    console.log("=========================================");
    console.log(`[DEV ONLY] INVOICE EMAILED TO ${order.customerEmail}`);
    console.log("=========================================");
    return true;
  }

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465, // true for 465, false for other ports
    auth: {
      user,
      pass,
    },
  });

  const isPaid = order.paymentStatus === "PAID";
  const subject = isPaid 
    ? `Pembayaran Berhasil - Pesanan #${order.orderNumber} - ${siteName}` 
    : `Menunggu Pembayaran - Pesanan #${order.orderNumber} - ${siteName}`;

  const formatCurrency = (val: number) => "Rp " + val.toLocaleString("id-ID");
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL || "https://gamerstoreplus.com";
  const orderUrl = `${appUrl}/order/${order.orderNumber}`;

  const mailOptions = {
    from,
    to: order.customerEmail,
    subject,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #332759; border-radius: 12px; background-color: #0b071e; color: #ffffff;">
        <div style="text-align: center; margin-bottom: 20px;">
          ${siteLogo ? `<div style="margin-bottom: 8px;"><img src="${siteLogo}" alt="${siteName}" style="height: 48px; max-width: 200px; object-fit: contain;" /></div>` : ''}
          <h2 style="color: #a855f7; margin: 0 0 5px 0; font-weight: 900; font-size: 26px;">${siteName}</h2>
          <p style="color: #94a3b8; font-size: 14px; margin-top: 0;">${siteDescription}</p>
        </div>
        <hr style="border: 0; border-top: 1px solid #332759; margin: 20px 0;">
        <p>Halo, <strong>${order.customerName || "Pelanggan"}</strong></p>
        <p>${isPaid ? "Terima kasih, pembayaran untuk pesanan Anda telah berhasil kami terima." : "Pesanan Anda berhasil dibuat. Silakan segera lakukan pembayaran agar pesanan dapat diproses."}</p>
        
        <div style="background-color: #160f38; border: 1px solid #332759; border-radius: 8px; padding: 15px; margin: 20px 0;">
          <h3 style="margin-top: 0; color: #06b6d4; font-size: 16px;">Detail Pesanan</h3>
          <table style="width: 100%; font-size: 14px; color: #e2e8f0; border-collapse: collapse;">
            <tr>
              <td style="padding: 6px 0; color: #94a3b8;">No. Pesanan</td>
              <td style="padding: 6px 0; text-align: right; font-weight: bold; color: #ffffff;">#${order.orderNumber}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #94a3b8;">Nama Pelanggan</td>
              <td style="padding: 6px 0; text-align: right; font-weight: bold; color: #ffffff;">${order.customerName || "-"}</td>
            </tr>
            ${order.customerPhone ? `
            <tr>
              <td style="padding: 6px 0; color: #94a3b8;">No. Telepon</td>
              <td style="padding: 6px 0; text-align: right; font-weight: bold; color: #ffffff;">${order.customerPhone}</td>
            </tr>
            ` : ""}
            <tr>
              <td style="padding: 6px 0; color: #94a3b8;">Game</td>
              <td style="padding: 6px 0; text-align: right; font-weight: bold; color: #ffffff;">${order.gameName}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #94a3b8;">ID Tujuan</td>
              <td style="padding: 6px 0; text-align: right; font-weight: bold; color: #ffffff;">${order.isVoucher || order.gameUserId === "VOUCHER" ? "🎟️ Voucher Digital (Tanpa Akun)" : `${order.gameUserId} ${order.gameServerId ? `(${order.gameServerId})` : ""}`}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #94a3b8;">Metode Pembayaran</td>
              <td style="padding: 6px 0; text-align: right; font-weight: bold; color: #ffffff;">${order.paymentMethod || "-"}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #94a3b8;">Status</td>
              <td style="padding: 6px 0; text-align: right; font-weight: bold; color: ${isPaid ? '#4ade80' : '#fbbf24'};">${isPaid ? 'LUNAS' : 'BELUM BAYAR'}</td>
            </tr>
          </table>
          <hr style="border: 0; border-top: 1px dashed #332759; margin: 15px 0;">
          <table style="width: 100%; font-size: 14px; color: #e2e8f0; border-collapse: collapse;">
            <tr>
              <td style="padding: 6px 0; color: #94a3b8;">Item Pembelian</td>
              <td style="padding: 6px 0; text-align: right; font-weight: bold; color: #ffffff;">${order.orderItems[0]?.productName || "-"}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; font-size: 16px; font-weight: bold; color: #ffffff; padding-top: 15px;">Total Pembayaran</td>
              <td style="padding: 6px 0; font-size: 18px; font-weight: bold; color: #a855f7; text-align: right; padding-top: 15px;">${formatCurrency(order.totalAmount)}</td>
            </tr>
          </table>
        </div>

        ${isPaid ? `
        <div style="text-align: center; margin: 32px 0;">
          ${order.isPascabayar ? `
          <a href="${order.receiptUrl || `https://receipt.tagihanpulsa.com/digiflazz/${order.sn || order.digiflazzRef}`}" style="background-color: #059669; background: linear-gradient(135deg, #059669 0%, #0d9488 100%); color: #ffffff; padding: 14px 24px; text-decoration: none; border-radius: 10px; font-weight: bold; font-size: 14px; display: inline-block; box-shadow: 0 4px 14px rgba(5, 150, 105, 0.4); margin-right: 8px; margin-bottom: 8px;">
            📄 Unduh Struk PDF Resmi ➔
          </a>
          ` : ''}
          <a href="${orderUrl}" style="background-color: #7c3aed; background: linear-gradient(135deg, #7c3aed 0%, #06b6d4 100%); color: #ffffff; padding: 14px 24px; text-decoration: none; border-radius: 10px; font-weight: bold; font-size: 14px; display: inline-block; box-shadow: 0 4px 14px rgba(124, 58, 237, 0.4); margin-bottom: 8px;">
            Buka Detail Pesanan di Web ➔
          </a>
        </div>
        ` : order.paymentUrl ? `
        <div style="text-align: center; margin: 32px 0;">
          <a href="${order.paymentUrl}" style="background-color: #7c3aed; background: linear-gradient(135deg, #7c3aed 0%, #a855f7 100%); color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 10px; font-weight: bold; font-size: 15px; display: inline-block; box-shadow: 0 4px 14px rgba(124, 58, 237, 0.4);">
            Bayar Sekarang ➔
          </a>
        </div>
        ` : `
        <div style="text-align: center; margin: 32px 0;">
          <a href="${orderUrl}" style="background-color: #7c3aed; background: linear-gradient(135deg, #7c3aed 0%, #06b6d4 100%); color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 10px; font-weight: bold; font-size: 15px; display: inline-block;">
            Buka Detail Pesanan di Web ➔
          </a>
        </div>
        `}

        <p style="color: #94a3b8; font-size: 14px; line-height: 1.6;">${isPaid ? "Pesanan Anda sedang dalam antrean pemrosesan kami. Mohon ditunggu." : "Harap menyelesaikan pembayaran sebelum batas waktu berakhir agar pesanan tidak dibatalkan otomatis."}</p>
        <hr style="border: 0; border-top: 1px solid #332759; margin: 20px 0;">
        <p style="font-size: 12px; color: #64748b; text-align: center;">&copy; ${new Date().getFullYear()} ${siteName}. All rights reserved.</p>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error("Failed to send invoice email", error);
    return false;
  }
}

/**
 * Mengirimkan email KHUSUS Serial Number (SN) / Kode Voucher Digital kepada pembeli.
 * Terpisah dari email invoice tagihan biasa.
 */
export async function sendVoucherSnEmail(order: any) {
  if (!order.customerEmail || !order.sn) return false;

  let host = process.env.SMTP_HOST;
  let port = parseInt(process.env.SMTP_PORT || "587");
  let user = process.env.SMTP_USER;
  let pass = process.env.SMTP_PASS;
  let siteName = "GamerStore";
  let siteLogo = "";
  let siteDescription = "Top Up Game Terpercaya";
  let from = process.env.SMTP_FROM || `"GamerStore Voucher" <voucher@gamerstore.com>`;

  try {
    await connectDB();
    const settings = await Setting.findOne({});
    if (settings) {
      if (settings.siteName) siteName = settings.siteName;
      if (settings.siteLogo) siteLogo = settings.siteLogo;
      if (settings.siteDescription) siteDescription = settings.siteDescription;
      if (settings.smtpHost) host = settings.smtpHost;
      if (settings.smtpPort) port = settings.smtpPort;
      if (settings.smtpUser) user = settings.smtpUser;
      if (settings.smtpPass) pass = settings.smtpPass;
      if (settings.smtpFrom) from = settings.smtpFrom;
      else from = `"${siteName} Voucher" <voucher@gamerstore.com>`;
    }
  } catch (error) {
    console.error("Failed to load SMTP settings from DB for voucher email:", error);
  }

  // Fallback console log for dev
  if (!host || !user || !pass) {
    console.log("=================================================");
    console.log(`[DEV ONLY] VOUCHER SN EMAILED TO ${order.customerEmail}`);
    console.log(`ORDER #${order.orderNumber} - SN: ${order.sn}`);
    console.log("=================================================");
    return true;
  }

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL || "https://gamerstoreplus.com";
  const orderUrl = `${appUrl}/order/${order.orderNumber}`;

  const mailOptions = {
    from,
    to: order.customerEmail,
    subject: `🎟️ Kode Voucher / Serial Number (SN) - Pesanan #${order.orderNumber} - ${siteName}`,
    html: `
      <div style="font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #3b2064; border-radius: 16px; background-color: #0b071e; color: #ffffff;">
        
        <!-- Header -->
        <div style="text-align: center; margin-bottom: 24px;">
          <div style="display: inline-block; padding: 8px 16px; background: rgba(168, 85, 247, 0.15); border: 1px solid rgba(168, 85, 247, 0.3); border-radius: 20px; color: #c084fc; font-size: 12px; font-weight: bold; letter-spacing: 1.5px; text-transform: uppercase; margin-bottom: 12px;">
            🎟️ Pengiriman Kode Voucher Digital
          </div>
          ${siteLogo ? `<div style="margin-bottom: 8px;"><img src="${siteLogo}" alt="${siteName}" style="height: 48px; max-width: 200px; object-fit: contain;" /></div>` : ''}
          <h2 style="color: #ffffff; margin: 0 0 6px 0; font-weight: 900; font-size: 26px;">${siteName}</h2>
          <p style="color: #94a3b8; font-size: 13px; margin: 0;">Serial Number &amp; Kode Voucher Resmi</p>
        </div>

        <hr style="border: 0; border-top: 1px solid #231647; margin: 20px 0;">

        <!-- Greeting -->
        <p style="font-size: 15px; color: #e2e8f0; margin-bottom: 12px;">
          Halo, <strong style="color: #ffffff;">${order.customerName || "Pelanggan"}</strong>!
        </p>
        <p style="font-size: 14px; color: #94a3b8; line-height: 1.6; margin-top: 0;">
          Pesanan voucher digital Anda untuk <strong>${order.gameName}</strong> telah berhasil diproses oleh sistem. Berikut adalah <strong>Serial Number (SN) / Kode Voucher</strong> resmi Anda:
        </p>

        <!-- Voucher Code Box (Ultra Prominent) -->
        <div style="background: linear-gradient(135deg, #180a33 0%, #0c1833 100%); border: 2px dashed #06b6d4; border-radius: 14px; padding: 24px 20px; text-align: center; margin: 24px 0; box-shadow: 0 8px 24px rgba(6, 182, 212, 0.15);">
          <div style="font-size: 11px; color: #38bdf8; font-weight: 800; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 10px;">
            SERIAL NUMBER / KODE VOUCHER (SN)
          </div>
          <div style="font-size: 24px; font-family: 'Courier New', Courier, monospace; font-weight: 900; color: #facc15; letter-spacing: 2.5px; word-break: break-all; background: #030712; padding: 14px 18px; border-radius: 10px; border: 1px solid rgba(255, 255, 255, 0.12); margin-bottom: 10px; user-select: all;">
            ${order.sn}
          </div>
          <p style="font-size: 12px; color: #94a3b8; margin: 0;">
            🔒 Simpan kode ini baik-baik. Jangan bagikan kepada siapapun yang tidak berwenang.
          </p>
        </div>

        <!-- Product Summary Table -->
        <div style="background-color: #130a2a; border: 1px solid #231647; border-radius: 12px; padding: 16px; margin: 20px 0;">
          <h4 style="margin: 0 0 12px 0; color: #06b6d4; font-size: 13px; text-transform: uppercase; letter-spacing: 1px;">Rincian Pesanan</h4>
          <table style="width: 100%; font-size: 13px; color: #cbd5e1; border-collapse: collapse;">
            <tr>
              <td style="padding: 6px 0; color: #94a3b8;">No. Pesanan</td>
              <td style="padding: 6px 0; text-align: right; font-weight: bold; color: #ffffff;">#${order.orderNumber}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #94a3b8;">Produk Voucher</td>
              <td style="padding: 6px 0; text-align: right; font-weight: bold; color: #ffffff;">${order.orderItems[0]?.productName || order.gameName}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #94a3b8;">Status Pengiriman</td>
              <td style="padding: 6px 0; text-align: right; font-weight: bold; color: #4ade80;">✅ TERKIRIM SUKSES</td>
            </tr>
          </table>
        </div>

        <!-- Action Button -->
        <div style="text-align: center; margin: 28px 0;">
          <a href="${orderUrl}" style="background: linear-gradient(135deg, #7c3aed 0%, #06b6d4 100%); color: #ffffff; padding: 13px 28px; text-decoration: none; border-radius: 10px; font-weight: bold; font-size: 14px; display: inline-block; box-shadow: 0 4px 14px rgba(124, 58, 237, 0.4);">
            Buka Detail Pesanan & Salin SN ➔
          </a>
        </div>

        <p style="color: #64748b; font-size: 12px; line-height: 1.6; text-align: center; margin-top: 24px;">
          Jika Anda mengalami kesulitan saat me-redeem kode voucher ini, silakan hubungi tim customer service kami dengan menyertakan Nomor Pesanan di atas.
        </p>

        <hr style="border: 0; border-top: 1px solid #231647; margin: 20px 0;">
        <p style="font-size: 11px; color: #475569; text-align: center; margin: 0;">
          &copy; ${new Date().getFullYear()} ${siteName}. All rights reserved.
        </p>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error("Failed to send voucher SN email:", error);
    return false;
  }
}
