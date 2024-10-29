function doGet() {
 return HtmlService.createTemplateFromFile('Index')
     .evaluate()
     .setTitle('Sistem Presensi')
     .addMetaTag('viewport', 'width=device-width, initial-scale=1')
     .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

async function processRFID(rfid) {
 try {
   Logger.log('Starting processRFID for: ' + rfid);
   
   if (!rfid || rfid.trim() === '') {
     throw new Error('RFID tidak boleh kosong');
   }

   const db = new Database();
   
   // Cari data siswa
   const student = db.findStudent(rfid);
   if (!student) {
     throw new Error('RFID tidak terdaftar dalam sistem');
   }

   // Record attendance
   const attendance = await db.recordAttendance(student);
   
   // Pastikan format response
   return JSON.stringify({
     status: 'success',
     message: `Presensi berhasil: ${student.nama} - ${student.kelas}`,
     data: {
       rfid: student.rfid,
       nis: student.nis,
       nama: student.nama,
       kelas: student.kelas,
       keahlian: student.keahlian,
       status: attendance.status,
       timestamp: attendance.timestamp
     }
   });
   
 } catch (error) {
   Logger.log('Error in processRFID:', error);
   throw error; // Let Apps Script handle the error response
 }
}

function testConnection() {
 try {
   const ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
   const sheetNames = ss.getSheets().map(sheet => sheet.getName());
   
   // Cek keberadaan semua sheet yang diperlukan
   const requiredSheets = [
     CONFIG.SHEET_NAMES.STUDENTS,
     CONFIG.SHEET_NAMES.ATTENDANCE,
     CONFIG.SHEET_NAMES.ERROR_LOG
   ];
   
   const missingSheets = requiredSheets.filter(name => !sheetNames.includes(name));
   
   if (missingSheets.length > 0) {
     return {
       status: 'error',
       message: `Sheet tidak ditemukan: ${missingSheets.join(', ')}`
     };
   }
   
   // Test read Master_Siswa
   const masterSheet = ss.getSheetByName(CONFIG.SHEET_NAMES.STUDENTS);
   const headers = masterSheet.getRange(1, 1, 1, 9).getValues()[0];
   const expectedHeaders = ['RFID', 'NIS', 'NAMA', 'KELAS', 'KEAHLIAN', 'URL_FOTO', 'NOMOR_WA', 'WA_ORTU', 'EMAIL'];
   
   const missingHeaders = expectedHeaders.filter(header => !headers.includes(header));
   if (missingHeaders.length > 0) {
     return {
       status: 'error',
       message: `Kolom tidak sesuai di Master_Siswa: ${missingHeaders.join(', ')}`
     };
   }

   logActivity('testConnection', {
     status: 'success',
     spreadsheetName: ss.getName(),
     sheets: sheetNames
   });
   
   return {
     status: 'success',
     message: `Terhubung ke spreadsheet: ${ss.getName()}\nSemua sheet dan kolom lengkap.`
   };
   
 } catch (error) {
   logError('testConnection', error);
   return {
     status: 'error',
     message: 'Gagal terhubung: ' + error.message
   };
 }
}

function testWhatsApp() {
 const message = "Test pengiriman WhatsApp dari Sistem Presensi";
 const number = "<GANTI_HP_TEST>"; // Ganti dengan nomor test
 
 const result = sendWhatsApp(number, message);
 
 return {
   status: result ? 'success' : 'error',
   message: result ? 'Berhasil mengirim WA' : 'Gagal mengirim WA'
 };
}
