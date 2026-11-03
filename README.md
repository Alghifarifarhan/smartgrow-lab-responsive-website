# 🌱 Smart Grow Laboratory — Web Application & Content Manager

[![Next.js 15](https://img.shields.io/badge/Next.js-15.3.3-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![React 19](https://img.shields.io/badge/React-19.0.0-61dafb?style=for-the-badge&logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8.2-3178c6?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS v4](https://img.shields.io/badge/Tailwind_CSS-v4.1.11-38bdf8?style=for-the-badge&logo=tailwindcss)](https://tailwindcss.com/)
[![Firebase](https://img.shields.io/badge/Firebase-v12.0.0-ffca28?style=for-the-badge&logo=firebase)](https://firebase.google.com/)

Website resmi dan sistem manajemen konten terpadu untuk **Smart Grow Laboratory** — pusat riset dan inovasi pertanian cerdas berbasis AIoT (*Artificial Intelligence of Things*), otomasi, hidroponik, dan *smart greenhouse* di bawah naungan Bandung Techno Park.

---

## 🚀 Teknologi & Framework yang Digunakan

| Kategori | Teknologi | Versi | Deskripsi |
| :--- | :--- | :--- | :--- |
| **Framework Utama** | [Next.js](https://nextjs.org/) | `15.3.3` | Framework React App Router dengan Server Components, Static Generation, dan optimasi bawaan. |
| **UI Library** | [React](https://react.dev/) & React DOM | `19.0.0` | Library antarmuka deklaratif dengan React Compiler dan hooks terbaru. |
| **Bahasa Pemrograman** | [TypeScript](https://www.typescriptlang.org/) | `5.8.2` | Menjamin *type-safety*, autocompletion akurat, dan minim kesalahan runtime. |
| **Styling & CSS** | [Tailwind CSS](https://tailwindcss.com/) & PostCSS | `v4.1.11` | Engine CSS utility-first modern dengan `@theme` dan CSS custom properties (`:root`). |
| **Backend & Cloud DB** | [Google Cloud Firestore](https://firebase.google.com/docs/firestore) | `v12.0.0` | Database NoSQL real-time cloud untuk menyimpan seluruh data konten dan analitik web. |
| **Autentikasi** | [Firebase Auth](https://firebase.google.com/docs/auth) | `v12.0.0` | Autentikasi aman berbasis email & kata sandi dengan proteksi brute-force bertingkat. |
| **Ikon & Tipografi** | FontAwesome 5 & Inter Font | `5.15.3` | Ikon vektorFontAwesome dan tipografi Google Fonts Inter yang ramah dibaca. |

---

## ✨ Fitur-Fitur Utama

### 1. 🎨 Dynamic Theme & Color Customizer
* **5 Pilihan Desain Preset Siap Pakai**:
  1. **Sunset Orange**: *Orange & Dark Slate* (`#EA580C`, `#FFFFFF`, `#1E293B`, `#0F172A`, `#64748B`)
  2. **Ocean Blue**: *Blue & Navy Night* (`#2196F3`, `#FFFFFF`, `#1E293B`, `#0B0F12`, `#3B82F6`)
  3. **Royal Purple**: *Violet & Deep Indigo* (`#8B5CF6`, `#FFFFFF`, `#1E1B4B`, `#0F172A`, `#A855F7`)
  4. **Emerald Green**: *Emerald & Forest Green* (`#10B981`, `#FFFFFF`, `#064E3B`, `#022C22`, `#34D399`)
  5. **Golden Amber**: *Gold & Dark Obsidian* (`#EAB308`, `#FEFCE8`, `#0A0A0A`, `#171717`, `#474747`)
* **Kustomisasi Detail Warna Manual**: Mendukung pemilihan warna visual (*native color picker*) dan input kode HEX untuk 6 parameter:
  * Warna Utama / Aksen (*Buttons & Highlights*)
  * Warna Latar Gelap (*Section Background*)
  * Warna Latar Terang
  * Teks Gelap
  * Teks Sedang
  * Teks Terang / Muted
* **Zero Flash (No FOUC)**: Dilengkapi *inline hydration script* dan `ThemeProvider` sehingga warna tema dimuat instan tanpa kedipan putih saat halaman direfresh.

### 2. 📊 Realtime Analytics & Performance Statistics
* Melacak metrik pengunjung secara akurat:
  * Total Kunjungan (*Total Visits*)
  * Pengunjung Unik Hari Ini (*Unique Visitors*)
  * Total Data Terunggah (*Upload Breakdown*)
  * Total Bandwidth Terdistribusi (*CDN Download Performance*)

### 3. 🖼️ Konverter Tautan Gambar Google Drive Modern
* Admin cukup menyalin tautan sharing Google Drive (`https://drive.google.com/file/d/.../view?usp=sharing`).
* Sistem otomatis mengekstrak ID berkas dan mengubahnya menjadi URL pratinjau thumbnail beresolusi tinggi secara otomatis.
* Pratinjau gambar langsung muncul seketika di admin panel sebelum disimpan.

### 4. 🔒 Keamanan Panel Admin Berlapis
* **Proteksi Percobaan Login**: Maksimal 3 kali kesalahan kata sandi berturut-turut. Jika gagal, akun dikunci sementara selama 5 menit dengan *countdown timer*.
* **Kedaluwarsa Sesi Otomatis**: Jika admin tidak aktif login selama lebih dari 2 hari, sesi akan direset secara otomatis dan wajib login ulang.
* **Firestore Security Rules**: Dilengkapi aturan keamanan deklaratif production-ready di [`firestore.rules`](./firestore.rules) dan [`rules.firebase`](./rules.firebase).

### 5. 💾 Backup & Restore Database Mandiri
* Tombol **Download Database (JSON)** untuk mencadangkan seluruh data website (*content, research, news, projects, team, comments*).
* Tombol **Import / Pulihkan Database** untuk mengunggah berkas `database.json` secara instan.

### 6. 📱 Desain 100% Responsif (Mobile & Desktop)
* Navigasi desktop elegan dengan penanda section aktif.
* Navigasi mobile dengan tombol hamburger morphing (`✕`), menu animasi slide-down, dan dropdown pemilihan menu instan pada panel admin smartphone.

---

## 📂 Struktur Direktori Proyek

```text
smart-grow-laboratory/
├── public/                 # Berkas statis (gambar, logo, aset publik)
├── src/
│   ├── app/                # Next.js 15 App Router
│   │   ├── admin/          # Panel Admin & Content Manager (13 Menu Tab)
│   │   ├── login/          # Halaman Login Admin dengan Brute-Force Lockout
│   │   ├── news-detail/    # Halaman Detail Berita & Kolom Komentar
│   │   ├── globals.css     # Tailwind v4, CSS Custom Properties & Animasi
│   │   ├── layout.tsx      # Root Layout & Theme Hydration Script
│   │   └── page.tsx        # Halaman Utama (Hero, Stats, Research, Projects, Team, Footer)
│   ├── components/         # Komponen React yang dapat digunakan ulang
│   │   ├── Navbar.tsx      # Navigasi utama responsif desktop & mobile
│   │   ├── Footer.tsx      # Footer dinamis
│   │   ├── ThemeProvider.tsx # Provider tema warna global real-time
│   │   └── GoToTop.tsx     # Tombol mengambang kembali ke atas
│   ├── lib/                # Library pembantu & integrasi eksternal
│   │   ├── firebase.ts     # Konfigurasi & inisialisasi Firebase SDK
│   │   ├── analytics.ts    # Sistem pelacak statistik & bandwidth
│   │   ├── theme.ts        # Definisi preset palet warna & helper tema
│   │   └── icons.ts        # Daftar ikon riset FontAwesome
│   └── types/              # Definisi TypeScript model data
│       └── index.ts
├── .env.example            # Template variabel lingkungan Firebase
├── firebase.json           # Konfigurasi Firebase Hosting & Firestore Rules
├── firestore.rules         # Security Rules Cloud Firestore
├── next.config.ts          # Konfigurasi Next.js 15
├── package.json            # Daftar dependensi & script build
└── tsconfig.json           # Konfigurasi compiler TypeScript
```

---

## 🛠️ Panduan Instalasi & Menjalankan Proyek Secara Lokal

### Prasyarat:
Pastikan Anda telah memasang:
* **Node.js** (versi `18.18.0` ke atas, direkomendasikan `20.x` atau `22.x`)
* **npm** (versi `9.x` ke atas) atau **yarn** / **pnpm**
* Akun **Firebase Console** (jika ingin menggunakan proyek Firebase Anda sendiri)

---

### Langkah 1: Kloning Repository

Untuk mengkloning branch `develop`:
```bash
git clone -b develop https://github.com/Alghifarifarhan/smartgrow-lab-responsive-website.git
cd smartgrow-lab-responsive-website
```

---

### Langkah 2: Memasang Dependensi

Jalankan perintah berikut pada terminal:
```bash
npm install
```

---

### Langkah 3: Konfigurasi Firebase SDK

Salin berkas template environment:
```bash
cp .env.example .env.local
```

Buka file `.env.local` atau buka file [`src/lib/firebase.ts`](./src/lib/firebase.ts), lalu isi dengan kredensial Firebase project Anda:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=YOUR_FIREBASE_API_KEY
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=YOUR_FIREBASE_AUTH_DOMAIN
NEXT_PUBLIC_FIREBASE_PROJECT_ID=YOUR_FIREBASE_PROJECT_ID
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=YOUR_FIREBASE_STORAGE_BUCKET
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=YOUR_FIREBASE_MESSAGING_SENDER_ID
NEXT_PUBLIC_FIREBASE_APP_ID=YOUR_FIREBASE_APP_ID
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=YOUR_FIREBASE_MEASUREMENT_ID
```

> **Catatan**: Jika menggunakan Firebase Authentication, aktifkan provider **Email/Password** di menu *Authentication > Sign-in method* pada Firebase Console, dan buat akun admin pertama Anda.

---

### Langkah 4: Menjalankan Server Development

Jalankan server pengembangan:
```bash
npm run dev
```

Buka browser dan akses alamat:
* **Halaman Web Utama**: [http://localhost:3000](http://localhost:3000)
* **Halaman Login Admin**: [http://localhost:3000/login](http://localhost:3000/login)
* **Panel Kontrol Admin**: [http://localhost:3000/admin](http://localhost:3000/admin)

---

### Langkah 5: Membangun Versi Produksi (*Build Production*)

Untuk memverifikasi dan mengompilasi kode ke mode produksi teroptimasi:
```bash
npm run build
npm run start
```

---

## 👥 Kontributor

* **Smart Grow Laboratory Team** — Bandung Techno Park
* Repository: [Alghifarifarhan/smartgrow-lab-responsive-website](https://github.com/Alghifarifarhan/smartgrow-lab-responsive-website)

---

## 📄 Lisensi
Hak Cipta © 2026 Smart Grow Laboratory. Seluruh hak cipta dilindungi undang-undang.

