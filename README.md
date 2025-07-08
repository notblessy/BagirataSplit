# Bagirata Android

Aplikasi pengelola pengeluaran pribadi berbasis React Native yang dibuat menggunakan Expo. Aplikasi ini adalah versi Android dari aplikasi iOS Bagirata yang dibuat dengan Swift.

## Fitur Utama

- **Dashboard Beranda**: Melihat ringkasan pengeluaran dan transaksi terbaru
- **Scan Struk**: Mensimulasikan pemindaian struk belanja (menggunakan data mock)
- **Laporan Pengeluaran**: Melihat riwayat transaksi dengan tampilan berdasarkan:
  - Daftar struk
  - Pengeluaran bulanan
  - Kategori pengeluaran
- **Profil Pengguna**: Mengatur profil dan preferensi aplikasi

## Teknologi yang Digunakan

- **Expo Router**: Untuk navigasi berbasis file system
- **React Native**: Framework untuk pengembangan mobile
- **TypeScript**: Untuk type safety dan developer experience yang lebih baik
- **Expo**: Platform untuk pengembangan React Native

## Struktur Aplikasi

```
app/
├── (tabs)/
│   ├── index.tsx       # Beranda/Dashboard
│   ├── scan.tsx        # Halaman scan struk
│   ├── expenses.tsx    # Laporan pengeluaran
│   └── profile.tsx     # Profil pengguna
components/
├── ReceiptCard.tsx     # Komponen kartu struk
└── ...                 # Komponen lainnya
services/
└── DataService.ts      # Service untuk data mock
types/
└── index.ts           # Type definitions
```

## Perbedaan dengan Versi Swift

### Yang Sama:

- Struktur navigasi tab
- Konsep split bill dan manajemen pengeluaran
- UI/UX yang mirip dengan desain iOS

### Yang Berbeda:

- **OCR Vision**: Versi Swift menggunakan Apple's Vision framework untuk OCR, sedangkan versi Android menggunakan data simulasi
- **Data Storage**: Versi Swift menggunakan SwiftData, versi Android menggunakan in-memory storage dengan data mock
- **Platform**: iOS vs Android dengan komponen React Native

## Data Mock

Aplikasi menggunakan data simulasi untuk:

- Struk belanja dari berbagai toko
- Pengeluaran bulanan
- Kategorisasi otomatis berdasarkan nama toko
- Simulasi proses OCR scanning

## Cara Menjalankan

1. Install dependencies:

   ```bash
   npm install
   ```

2. Start development server:

   ```bash
   npm start
   ```

3. Scan QR code dengan Expo Go app di Android device atau jalankan di emulator

## Pengembangan Selanjutnya

- Implementasi OCR menggunakan library seperti react-native-text-recognition
- Integrasi dengan database lokal (SQLite) atau cloud storage
- Fitur sync data antar device
- Notifikasi dan reminder
- Export data ke Excel/PDF
- Fitur split bill dengan teman

## Catatan

Aplikasi ini dibuat sebagai translasi dari aplikasi Swift Bagirata ke React Native, dengan fokus pada struktur dan fungsi yang sama namun menggunakan teknologi cross-platform.
