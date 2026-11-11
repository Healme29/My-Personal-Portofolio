# fix 1 — Referensi Area

Berikut pemahaman saya soal "gambar a", "gambar b", "gambar c", "gambar d" pada halaman:

```
┌─────────────────────────────────────────────────┐
│  🅰︎  NAVBAR                                      │
│  [hocsilens]  Home  About  My Exp  Skills  ...   │
│  → gerakan ombak kiri→kanan                      │
├─────────────────────────────────────────────────┤
│  🅱︎  CREAM BAND (marquee)                        │
│  → HAPUS tulisan skill, ganti jadi awan          │
│  → awan bergoyang saat disentuh/dihover          │
├─────────────────────────────────────────────────┤
│                                                  │
│          🅲   HERO — foto + chips                │
│         ┌──────────┐                             │
│         │  🟤 foto  │   🅳  Hero teks             │
│         │ lingkaran │   [Available for work]     │
│    🏷️   │          │   ACHMAD HILMI BUKHARI     │
│   OpenCV │          │   // Computer Vision       │
│ Arduino  │          │   Deskripsi ...            │
│  Python  │          │                            │
│    C++   │          │   3+ Awards · 2× Podiums   │
│         └──────────┘                             │
│                                                  │
├─────────────────────────────────────────────────┤
│  dst...                                          │
└─────────────────────────────────────────────────┘
```

## Yang saya pahami dari instruksi kamu:

### 🅰️ — gambar a (NAVBAR)
- "ubah gerakannya jadi seperti ombak mengalir secara perlahan dari kiri ke kanan"
- → **Navbar wave**: tiap item (hocsilens, Home, About, dst) bergelombang dengan delay bertahap dari kiri ke kanan
- ✅ Saya sudah pernah implement ini sebelumnya, kamu suruh revert. Sekarang saya pasang lagi.

### 🅱️ — gambar b (CREAM MARQUEE BAND)
- "yang kumaksud adalah tulisan tulisan itu" → teks skill yang jalan (Computer Vision ◆ IoT ◆ ...)
- "hapus tulisan itu, buat jadi awan" → ganti teks jalan jadi elemen awan (bentuk awan)
- "yang jika disentuh awan tersebut akan bergoyang kekanan dan ke kiri" → awan bergoyang saat hover/touch

### 🅲 — gambar c (HERO — floating chips) 
- "hapus aja tulisan tersebut" → hapus chip OpenCV, Arduino, Python, C++

### 🅳 — gambar d (HERO — stats strip?)
- "hapus aja tulisan tersebut" → hapus teks "3+ Awards · 2× Podiums · 5 Fields"?

Atau gambar c = chips, gambar d = role text "// Computer Vision"?

### 📱 — Mode HP
- "foto hero lingkaran di bawah 'Available for work' dan di atas 'ACHMAD HILMI BUKHARI'"
- → Foto urutan ke-2 di mobile (setelah badge, sebelum nama)