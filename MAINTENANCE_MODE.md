# 🔧 Maintenance Mode Guide

Panduan lengkap untuk mengaktifkan dan menonaktifkan mode maintenance pada website Cougan Fams.

## 📋 Cara Mengaktifkan Maintenance Mode

### Metode 1: Menggunakan Environment Variable (Recommended)

1. Buka file `.env` atau `.env.local` di root project
2. Tambahkan atau ubah baris berikut:
   ```bash
   NEXT_PUBLIC_MAINTENANCE_MODE=true
   ```
3. Restart development server atau rebuild production:

   ```bash
   # Development
   npm run dev

   # Production
   npm run build
   npm start
   ```

### Metode 2: Akses Langsung ke Halaman Maintenance

Jika ingin melihat preview halaman maintenance tanpa mengaktifkan mode:

- Kunjungi: `http://localhost:3000/maintenance` (development)
- Atau: `https://yourdomain.com/maintenance` (production)

## 🚫 Cara Menonaktifkan Maintenance Mode

1. Buka file `.env` atau `.env.local`
2. Ubah nilai menjadi `false`:
   ```bash
   NEXT_PUBLIC_MAINTENANCE_MODE=false
   ```
3. Restart server

## 🎨 Fitur Halaman Maintenance

Halaman maintenance yang telah dibuat memiliki fitur-fitur berikut:

### Visual Design

- ✨ **Animated Background** - Background dengan efek blur dan pulse yang dinamis
- 🌈 **Gradient Effects** - Gradient text animation yang menarik
- 🎯 **Glassmorphism** - Modern glass effect pada card elements
- 📱 **Fully Responsive** - Optimal di semua ukuran layar

### Content Elements

- ⚙️ **Animated Icon** - Gear icon dengan rotasi smooth
- 💬 **Informative Cards** - 3 info cards menjelaskan:
  - Quick Maintenance
  - Performance Boost
  - Enhanced Security
- 🔗 **Social Media Links** - Links ke Twitter, YouTube, dan Discord
- 🎨 **Hover Effects** - Interactive hover states pada semua elemen

### Technical Features

- 🔄 **Auto Redirect** - Otomatis redirect semua halaman ke /maintenance
- 🚀 **SEO Optimized** - Proper meta tags dan title
- ⚡ **Performance** - Lightweight dan fast loading
- 🎭 **Animations** - Smooth CSS animations tanpa JavaScript overhead

## 📁 File Structure

```
cougan-website/
├── app/
│   └── maintenance/
│       └── page.tsx          # Halaman maintenance
├── middleware.ts              # Logic untuk redirect maintenance
├── .env                       # Environment variables
└── MAINTENANCE_MODE.md        # Dokumentasi ini
```

## 🔧 Customization

### Mengubah Teks

Edit file `app/maintenance/page.tsx`:

- **Heading**: Line 42-46
- **Description**: Line 48-50
- **Info Cards**: Line 59-91

### Mengubah Warna

Warna menggunakan Tailwind classes yang sudah didefinisikan:

- `gold` - Warna emas Cougan (#d4af37)
- `zinc-*` - Grayscale colors
- `purple-*`, `blue-*` - Accent colors

### Mengubah Social Links

Edit links pada line 97-127:

```tsx
href = 'https://twitter.com/couganfams'; // Twitter
href = 'https://youtube.com/@couganfams'; // YouTube
href = 'https://discord.gg/couganfams'; // Discord
```

## 🚀 Deployment Notes

### Vercel / Netlify

Environment variables akan otomatis terbaca. Pastikan set di dashboard:

- Variable: `NEXT_PUBLIC_MAINTENANCE_MODE`
- Value: `true` atau `false`

### Manual Deployment

Pastikan file `.env` atau `.env.production` sudah ter-configure dengan benar sebelum build.

## ⚠️ Important Notes

1. **Prefix `NEXT_PUBLIC_`** diperlukan agar environment variable bisa diakses di client-side
2. **Restart diperlukan** setiap kali mengubah environment variable
3. **Admin routes** juga akan ter-redirect ke maintenance page
4. **Static assets** (images, CSS, JS) tetap accessible

## 🎯 Best Practices

1. **Komunikasi**: Informasikan user sebelum maintenance via social media
2. **Timing**: Lakukan maintenance saat traffic rendah
3. **Testing**: Test halaman maintenance di staging dulu
4. **Monitoring**: Monitor logs untuk memastikan tidak ada error
5. **Quick Rollback**: Siapkan cara cepat untuk disable maintenance mode

## 📞 Support

Jika ada masalah atau pertanyaan:

- Check middleware.ts untuk logic redirect
- Pastikan environment variable sudah benar
- Clear browser cache jika halaman tidak update
- Restart development server

---

**Created**: February 2026  
**Last Updated**: February 2026  
**Version**: 1.0.0
