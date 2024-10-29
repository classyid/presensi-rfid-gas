class Database {
 constructor() {
   this.spreadsheet = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
   this.cache = CacheService.getScriptCache();
 }

 findStudent(rfid) {
  try {
    Logger.log('Starting findStudent for RFID:', rfid);

    // Validasi input
    if (!rfid) {
      throw new Error('RFID is required');
    }

    // Ambil data dari spreadsheet
    const sheet = this.spreadsheet.getSheetByName(CONFIG.SHEET_NAMES.STUDENTS);
    if (!sheet) {
      throw new Error('Sheet Master_Siswa tidak ditemukan');
    }

    const data = sheet.getDataRange().getValues();
    Logger.log(`Found ${data.length} rows of data`);

    // Cari data siswa
    for (let i = 1; i < data.length; i++) {
      const currentRFID = data[i][0]?.toString().trim();
      const searchRFID = rfid.toString().trim();
      
      Logger.log(`Comparing RFID: "${currentRFID}" with "${searchRFID}"`);
      
      if (currentRFID === searchRFID) {
        const student = {
          rfid: data[i][0],
          nis: data[i][1], 
          nama: data[i][2],
          kelas: data[i][3],
          keahlian: data[i][4],
          url_foto: data[i][5],
          nomor_wa: data[i][6],
          wa_ortu: data[i][7],
          email: data[i][8]
        };

        Logger.log('Found matching student:', student);
        return student;
      }
    }

    Logger.log('No matching student found');
    return null;

  } catch (error) {
    Logger.log('Error in findStudent:', error);
    throw error;
  }
}

 async recordAttendance(student) {
   try {
     const sheet = this.spreadsheet.getSheetByName(CONFIG.SHEET_NAMES.ATTENDANCE);
     const now = new Date();
     const status = getAttendanceStatus(now);

     // Debug: Log data attendance yang akan disimpan
     Logger.log('Recording attendance for:', {
       student: student,
       status: status,
       timestamp: now
     });
     
     // Cek apakah sudah presensi hari ini
     const todayStart = new Date();
     todayStart.setHours(0,0,0,0);
     
     const todayEnd = new Date();
     todayEnd.setHours(23,59,59,999);
     
     const existingData = sheet.getDataRange().getValues();
     const alreadyPresent = existingData.some(row => {
       const timestamp = new Date(row[0]);
       return row[1] === student.rfid && 
              timestamp >= todayStart && 
              timestamp <= todayEnd;
     });
     
     if (alreadyPresent) {
       logActivity('recordAttendance', {
         rfid: student.rfid,
         nama: student.nama,
         status: 'DUPLICATE',
         message: 'Sudah presensi hari ini'
       });
       throw new Error('Sudah melakukan presensi hari ini');
     }
     
     // Catat presensi baru
     sheet.appendRow([
       now,
       student.rfid,
       student.nis,
       student.nama, 
       student.kelas,
       student.keahlian,
       status
     ]);

     const attendance = {
       timestamp: now,
       status: status
     };

     // Log attempt notification
     logActivity('notification-attempt', {
       type: status,
       student: student.nama,
       wa_siswa: student.nomor_wa,
       wa_ortu: student.wa_ortu,
       email: student.email
     });
     
     // Modifikasi bagian notifikasi dalam method recordAttendance
// Cari bagian kode yang mengirim notifikasi dan ubah menjadi:

if (status === 'Tepat Waktu') {
  // Notifikasi jika tepat waktu
  if (CONFIG.NOTIFICATION.WHATSAPP.ONTIME && student.nomor_wa) {
    const messages = generateMessageTemplate(student, attendance, false);
    const sent = sendWhatsApp(student.nomor_wa, messages.whatsapp);
    logActivity('wa-siswa-sent-ontime', {
      to: student.nomor_wa,
      success: sent
    });
  }
  if (CONFIG.NOTIFICATION.EMAIL.ONTIME && student.email) {
    const messages = generateMessageTemplate(student, attendance, false);
    const subject = `Presensi Tepat Waktu - ${formatDateTime(now)}`;
    sendEmail(student.email, subject, messages.email);
  }
} else {
  // Notifikasi jika terlambat
  if (CONFIG.NOTIFICATION.WHATSAPP.LATE && student.nomor_wa) {
    const messages = generateMessageTemplate(student, attendance, false);
    const sent = sendWhatsApp(student.nomor_wa, messages.whatsapp);
    logActivity('wa-siswa-sent-late', {
      to: student.nomor_wa,
      success: sent
    });
  }
  if (CONFIG.NOTIFICATION.WHATSAPP.LATE_PARENT && student.wa_ortu) {
    const messageParent = generateMessageTemplate(student, attendance, true);
    const sent = sendWhatsApp(student.wa_ortu, messageParent);
    logActivity('wa-ortu-sent-late', {
      to: student.wa_ortu,
      success: sent
    });
  }
  if (CONFIG.NOTIFICATION.EMAIL.LATE && student.email) {
    const messages = generateMessageTemplate(student, attendance, false);
    const subject = `Notifikasi Keterlambatan - ${formatDateTime(now)}`;
    sendEmail(student.email, subject, messages.email);
  }
}
     
     // Log aktivitas presensi
     logActivity('recordAttendance', {
       timestamp: now,
       rfid: student.rfid,
       nama: student.nama,
       status: status,
       notified: {
         wa_siswa: Boolean(student.nomor_wa),
         wa_ortu: status === 'Terlambat' && Boolean(student.wa_ortu),
         email: Boolean(student.email)
       }
     });
     
     // Debug: Log attendance result
     Logger.log('Attendance recorded:', attendance);

     return attendance;
     
   } catch (error) {
     Logger.log('Error in recordAttendance:', error);
     logError('recordAttendance', error);
     throw new Error(error.message || 'Gagal mencatat kehadiran');
   }
 }
}
