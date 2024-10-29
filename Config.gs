const CONFIG = {
  SPREADSHEET_ID: '<ID-SPREADSHEET>',
  SHEET_NAMES: {
    STUDENTS: 'Master_Siswa',
    ATTENDANCE: 'Attendance', 
    ERROR_LOG: 'ErrorLog'
  },
  LOGO_BASE64: 'data:image/png;base64,iVBORw0KGgoAAAJggg==', // Paste base64 logo lengkap disini
  TIME_CONFIG: {
    DELAY: 5000,
    LATE_THRESHOLD: '17:30:00',
    CLEAR_TIME: '00:00:00'
  },
  WHATSAPP: {
    API_KEY: '<APIKEY>',
    SENDER: '<SENDER>',
    ENDPOINT: 'https://m-pedia/send-message'
  },
  EMAIL: {
    SENDER_NAME: 'Sistem Presensi SMK',
    SUBJECT_PREFIX: 'Notifikasi Presensi -'
  },
  NOTIFICATION: {
    WHATSAPP: {
      ONTIME: true,     // tidak kirim WA jika tepat waktu 
      LATE: true,        // kirim WA jika terlambat
      LATE_PARENT: true  // kirim WA ke ortu jika terlambat
    },
    EMAIL: {
      ONTIME: true,     // tidak kirim email jika tepat waktu
      LATE: true         // kirim email jika terlambat
    }
  }
};
