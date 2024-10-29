# 📚 Sistem Presensi Sekolah dengan Google Apps Script

<p align="center">
  <img src="path_to_logo.png" alt="Logo Sistem Presensi" width="200"/>
</p>

> Sistem presensi sekolah modern berbasis RFID dengan notifikasi realtime, dibangun menggunakan Google Apps Script dan spreadsheet sebagai database.

## 🌟 Fitur Utama

- ✅ Pencatatan kehadiran dengan RFID atau input manual
- 📱 Notifikasi WhatsApp realtime ke siswa dan orang tua
- 📧 Notifikasi email otomatis
- 📊 Dashboard presensi realtime
- 💾 Database menggunakan Google Spreadsheet
- 🔄 Sinkronisasi data otomatis
- 📝 Log aktivitas lengkap
- 🔒 Sistem caching untuk performa optimal

## 🚀 Teknologi yang Digunakan

- Google Apps Script
- HTML5 & Tailwind CSS
- WhatsApp API
- Google Spreadsheet API
- Gmail API

## 📋 Persyaratan Sistem

- Google Workspace / Google Account
- Akses internet
- Browser modern (Chrome, Firefox, Safari)
- RFID Reader (opsional)

## ⚙️ Instalasi

1. Buat project baru di Google Apps Script
2. Copy semua file ke project:
   - Code.gs
   - Database.gs
   - Config.gs
   - Utilities.gs
   - Index.html
3. Sesuaikan konfigurasi di `Config.gs`
4. Deploy sebagai web app
5. Atur permissions dan akses

## 📖 Struktur Spreadsheet

### Sheet: Master_Siswa
- RFID
- NIS
- NAMA
- KELAS
- KEAHLIAN
- URL_FOTO
- NOMOR_WA
- WA_ORTU
- EMAIL

### Sheet: Attendance
- Timestamp
- RFID
- NIS
- NAMA
- KELAS
- KEAHLIAN
- STATUS

### Sheet: ErrorLog
- Timestamp
- Context
- Type
- Message
- Stack

## 🛠️ Konfigurasi

```javascript
const CONFIG = {
  SPREADSHEET_ID: 'your_spreadsheet_id',
  SHEET_NAMES: {
    STUDENTS: 'Master_Siswa',
    ATTENDANCE: 'Attendance',
    ERROR_LOG: 'ErrorLog'
  },
  // ... konfigurasi lainnya
};
