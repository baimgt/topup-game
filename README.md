# 🎮 GameTopUp - Platform Top Up Game

Web top up game berbasis Next.js 15 + TypeScript dengan integrasi **Digiflazz** (supplier) dan **Midtrans** (payment gateway).

## ✨ Fitur

- 🎮 Katalog game dengan produk top up
- 💳 Pembayaran via Midtrans Snap (QRIS, Transfer Bank, E-Wallet, dll)
- ⚡ Proses otomatis via Digiflazz API
- 📦 Tracking status pesanan real-time
- 👤 Autentikasi user (register/login)
- 🛡️ Admin dashboard (kelola game, produk, pesanan)
- 📱 Responsive design (mobile-first)

## 🛠️ Tech Stack

- **Frontend**: Next.js 15 (App Router), TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes
- **Database**: MongoDB (local) + Prisma ORM
- **Payment**: Midtrans Snap
- **Supplier**: Digiflazz API
- **Auth**: JWT + bcrypt

## 🚀 Setup & Instalasi

### 1. Install dependencies

```bash
cd game-topup
npm install
```

### 2. Setup environment variables

Salin `.env.local` dan isi dengan kredensial Anda:

```env
# Database MongoDB Local
DATABASE_URL="mongodb://localhost:27017/game_topup"

# JWT
JWT_SECRET="your-secret-key"

# Digiflazz
DIGIFLAZZ_USERNAME="username-digiflazz"
DIGIFLAZZ_API_KEY="api-key-digiflazz"

# Midtrans
MIDTRANS_SERVER_KEY="SB-Mid-server-xxxx"   # Sandbox
MIDTRANS_CLIENT_KEY="SB-Mid-client-xxxx"   # Sandbox
MIDTRANS_IS_PRODUCTION="false"

NEXT_PUBLIC_APP_URL="http://localhost:3000"
NEXT_PUBLIC_MIDTRANS_CLIENT_KEY="SB-Mid-client-xxxx"
```

### 3. Setup database

```bash
# Generate Prisma client
npm run db:generate

# Push schema ke MongoDB (tidak perlu migrate)
npm run db:push

# Seed data awal (game & produk contoh)
npm run db:seed
```

> **Catatan:** Pastikan MongoDB sudah berjalan di `localhost:27017`. Jalankan dengan `mongod` atau lewat MongoDB Compass.

### 4. Jalankan development server

```bash
npm run dev
```

Buka [http://localhost:3000](http://localhost:3000)

## 📋 Akun Default (setelah seed)

| Role  | Email                  | Password  |
|-------|------------------------|-----------|
| Admin | admin@gametopup.com    | admin123  |

## 🔑 Cara Mendapatkan API Keys

### Digiflazz
1. Daftar di [digiflazz.com](https://digiflazz.com)
2. Masuk ke menu **Pengaturan > API**
3. Salin **Username** dan **API Key**
4. Untuk testing, gunakan mode **Development** di Digiflazz

### Midtrans
1. Daftar di [midtrans.com](https://midtrans.com)
2. Masuk ke **Dashboard > Settings > Access Keys**
3. Gunakan **Sandbox** keys untuk testing
4. Set `MIDTRANS_IS_PRODUCTION=false` untuk sandbox

## 📁 Struktur Project

```
src/
├── app/
│   ├── api/
│   │   ├── auth/          # Login, register, logout
│   │   ├── games/         # CRUD game
│   │   ├── orders/        # Buat & cek pesanan
│   │   ├── payment/       # Webhook Midtrans
│   │   └── admin/         # Admin endpoints
│   ├── admin/             # Halaman admin
│   ├── auth/              # Login & register
│   ├── games/             # Katalog & detail game
│   └── order/             # Detail & cek pesanan
├── components/
│   ├── ui/                # Button, Input, Badge
│   ├── layout/            # Navbar, Footer
│   ├── games/             # GameCard, ProductCard
│   └── order/             # OrderForm
├── lib/
│   ├── prisma.ts          # Prisma client
│   ├── digiflazz.ts       # Digiflazz API
│   ├── midtrans.ts        # Midtrans client
│   ├── auth.ts            # JWT utilities
│   └── utils.ts           # Helper functions
└── types/                 # TypeScript types
```

## 🔄 Alur Transaksi

```
User pilih produk
    ↓
Isi ID akun game + data pembeli
    ↓
Klik "Bayar Sekarang"
    ↓
API buat Order di DB + request Midtrans token
    ↓
Midtrans Snap popup terbuka
    ↓
User bayar (QRIS/Transfer/E-Wallet)
    ↓
Midtrans kirim webhook ke /api/payment/notification
    ↓
Verifikasi signature → update status PAID
    ↓
Kirim request ke Digiflazz API
    ↓
Digiflazz proses top up → status SUCCESS
    ↓
User lihat status di halaman pesanan
```

## 🌐 Konfigurasi Webhook Midtrans

Set URL notifikasi di Midtrans Dashboard:
```
https://yourdomain.com/api/payment/notification
```

## 📝 Menambah Game & Produk

### Via Admin Dashboard
1. Login sebagai admin
2. Klik **Admin** di navbar
3. Klik **Tambah Game** atau **Tambah Produk**

### Via API (dengan token admin)
```bash
# Tambah game
POST /api/games
Authorization: Bearer <token>

# Tambah produk
POST /api/admin/products
Authorization: Bearer <token>
```

## 🚀 Deploy ke Production

1. Set `MIDTRANS_IS_PRODUCTION=true`
2. Ganti ke Midtrans Production keys
3. Ganti ke Digiflazz Production API key
4. Set `NEXT_PUBLIC_APP_URL` ke domain production
5. Deploy ke Vercel/Railway/VPS

```bash
npm run build
npm run start
```
