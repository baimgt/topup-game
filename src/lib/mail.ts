import nodemailer from "nodemailer";
import { connectDB } from "./mongoose";
import Setting from "@/models/Setting";

export async function sendOtpEmail(email: string, name: string, otp: string) {
  // Load SMTP config from database, or fallback to environment variables
  let host = process.env.SMTP_HOST;
  let port = parseInt(process.env.SMTP_PORT || "587");
  let user = process.env.SMTP_USER;
  let pass = process.env.SMTP_PASS;
  let from = process.env.SMTP_FROM || '"GamerStore" <no-reply@gametopup.com>';

  try {
    await connectDB();
    const settings = await Setting.findOne({});
    if (settings) {
      if (settings.smtpHost) host = settings.smtpHost;
      if (settings.smtpPort) port = settings.smtpPort;
      if (settings.smtpUser) user = settings.smtpUser;
      if (settings.smtpPass) pass = settings.smtpPass;
      if (settings.smtpFrom) from = settings.smtpFrom;
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
    subject: "Verifikasi Akun - GamerStore",
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #332759; border-radius: 12px; background-color: #0b071e; color: #ffffff;">
        <div style="text-align: center; margin-bottom: 20px;">
          <h2 style="color: #a855f7; margin-bottom: 5px; font-weight: 900; font-size: 26px;">Game<span style="color: #06b6d4;">TopUp</span></h2>
          <p style="color: #94a3b8; font-size: 14px; margin-top: 0;">Top Up Game Terpercaya</p>
        </div>
        <hr style="border: 0; border-top: 1px solid #332759; margin: 20px 0;">
        <p>Halo, <strong>${name}</strong></p>
        <p>Terima kasih telah melakukan registrasi. Silakan gunakan kode OTP di bawah ini untuk memverifikasi pendaftaran akun Anda:</p>
        <div style="text-align: center; margin: 30px 0;">
          <span style="font-size: 32px; font-weight: 900; letter-spacing: 6px; color: #06b6d4; padding: 12px 28px; background-color: #160f38; border-radius: 10px; border: 1px solid #a855f7; display: inline-block;">${otp}</span>
        </div>
        <p style="color: #94a3b8; font-size: 14px; line-height: 1.6;">Kode ini berlaku selama <strong>10 menit</strong>. Jika Anda tidak merasa melakukan pendaftaran ini, silakan abaikan email ini.</p>
        <hr style="border: 0; border-top: 1px solid #332759; margin: 20px 0;">
        <p style="font-size: 12px; color: #64748b; text-align: center;">&copy; ${new Date().getFullYear()} GamerStore. All rights reserved.</p>
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
  let from = process.env.SMTP_FROM || '"GamerStore" <no-reply@gametopup.com>';

  try {
    await connectDB();
    const settings = await Setting.findOne({});
    if (settings) {
      if (settings.smtpHost) host = settings.smtpHost;
      if (settings.smtpPort) port = settings.smtpPort;
      if (settings.smtpUser) user = settings.smtpUser;
      if (settings.smtpPass) pass = settings.smtpPass;
      if (settings.smtpFrom) from = settings.smtpFrom;
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
    ? `Pembayaran Berhasil - Pesanan #${order.orderNumber}` 
    : `Menunggu Pembayaran - Pesanan #${order.orderNumber}`;

  const formatCurrency = (val: number) => "Rp " + val.toLocaleString("id-ID");

  const mailOptions = {
    from,
    to: order.customerEmail,
    subject,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #332759; border-radius: 12px; background-color: #0b071e; color: #ffffff;">
        <div style="text-align: center; margin-bottom: 20px;">
          <h2 style="color: #a855f7; margin-bottom: 5px; font-weight: 900; font-size: 26px;">Game<span style="color: #06b6d4;">TopUp</span></h2>
          <p style="color: #94a3b8; font-size: 14px; margin-top: 0;">Top Up Game Terpercaya</p>
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
              <td style="padding: 6px 0; text-align: right; font-weight: bold; color: #ffffff;">${order.gameUserId} ${order.gameServerId ? `(${order.gameServerId})` : ""}</td>
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

        ${!isPaid && order.paymentUrl ? `
        <div style="text-align: center; margin: 30px 0;">
          <a href="${order.paymentUrl}" style="background-color: #a855f7; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">Bayar Sekarang</a>
        </div>
        ` : ''}

        <p style="color: #94a3b8; font-size: 14px; line-height: 1.6;">${isPaid ? "Pesanan Anda sedang dalam antrean pemrosesan kami. Mohon ditunggu." : "Harap menyelesaikan pembayaran sebelum batas waktu berakhir agar pesanan tidak dibatalkan otomatis."}</p>
        <hr style="border: 0; border-top: 1px solid #332759; margin: 20px 0;">
        <p style="font-size: 12px; color: #64748b; text-align: center;">&copy; ${new Date().getFullYear()} GamerStore. All rights reserved.</p>
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
