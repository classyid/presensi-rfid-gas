// Utilities.gs
function getAttendanceStatus(timestamp) {
  const hour = timestamp.getHours();
  const minutes = timestamp.getMinutes();
  
  if (hour < 7 || (hour === 7 && minutes <= 30)) {
    return 'Tepat Waktu';
  } else {
    return 'Terlambat';
  }
}

function formatDateTime(date) {
  const d = new Date(date);
  const options = {
    weekday: 'long',
    year: 'numeric', 
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Asia/Jakarta'
  };
  return d.toLocaleDateString('id-ID', options);
}

function sendWhatsApp(number, message) {
  try {
    // Log attempt
    logActivity('sendWhatsApp-attempt', {
      to: number,
      message: message
    });

    const url = CONFIG.WHATSAPP.ENDPOINT;
    const payload = {
      api_key: CONFIG.WHATSAPP.API_KEY,
      sender: CONFIG.WHATSAPP.SENDER,
      number: number,
      message: message
    };

    // Log what we're sending
    logActivity('sendWhatsApp-payload', payload);

    const options = {
      method: 'post',
      contentType: 'application/json',
      payload: JSON.stringify(payload),
      muteHttpExceptions: true
    };
    
    const response = UrlFetchApp.fetch(url, options);
    const responseCode = response.getResponseCode();
    const responseText = response.getContentText();
    
    // Log response
    logActivity('sendWhatsApp-response', {
      number: number,
      responseCode: responseCode,
      response: responseText
    });

    if (responseCode !== 200) {
      throw new Error(`API Error: ${responseText}`);
    }
    
    return true;
  } catch (error) {
    logError('sendWhatsApp', error);
    return false;
  }
}

// Modifikasi fungsi generateMessageTemplate di Utilities.gs
function generateMessageTemplate(student, attendance, isParent = false) {
  const dateTime = formatDateTime(attendance.timestamp);
  
  // Template untuk email
  if (!isParent) {
    const emailTemplate = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #f8f9fa; padding: 20px; text-align: center; border-radius: 5px; }
    .content { margin: 20px 0; }
    .info-box { background: ${attendance.status === 'Tepat Waktu' ? '#d4edda' : '#fff3cd'}; 
                padding: 15px; 
                border-radius: 5px;
                margin: 10px 0; }
    .footer { text-align: center; font-size: 0.9em; color: #6c757d; margin-top: 20px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h2 style="color: #333;">Notifikasi Presensi Siswa</h2>
    </div>
    <div class="content">
      <p>Halo <strong>${student.nama}</strong>,</p>
      <div class="info-box">
        <h3 style="margin-top: 0;">Detail Presensi:</h3>
        <p>NIS: ${student.nis}</p>
        <p>Kelas: ${student.kelas}</p>
        <p>Jurusan: ${student.keahlian}</p>
        <p>Waktu: ${dateTime}</p>
        <p>Status: <strong>${attendance.status}</strong></p>
      </div>
      ${attendance.status === 'Tepat Waktu' 
        ? '<p>Terima kasih telah hadir tepat waktu. Selamat belajar!</p>'
        : '<p><strong>Mohon untuk dapat hadir lebih tepat waktu pada hari berikutnya.</strong></p>'}
    </div>
    <div class="footer">
      <p>Email ini dikirim otomatis oleh Sistem Presensi Sekolah</p>
    </div>
  </div>
</body>
</html>`;
    return {
      whatsapp: `*Notifikasi Presensi*\n\nHalo ${student.nama},\nPresensi Anda telah tercatat:\n\nTanggal: ${dateTime}\nStatus: ${attendance.status}\n\n${attendance.status === 'Tepat Waktu' ? 'Selamat belajar!' : 'Mohon untuk lebih tepat waktu ke depannya.'}`,
      email: emailTemplate
    };
  } else {
    // Template untuk WhatsApp orang tua (tidak berubah)
    return `*Notifikasi ${attendance.status === 'Tepat Waktu' ? 'Presensi' : 'Keterlambatan'}*\n\nYth. Orang Tua/Wali dari:\nNama: ${student.nama}\nNIS: ${student.nis}\nKelas: ${student.kelas}\nKeahlian: ${student.keahlian}\n\nTelah hadir di sekolah pada:\n${dateTime}\nStatus: ${attendance.status}\n\n${attendance.status === 'Tepat Waktu' ? 'Terimakasih atas perhatiannya.' : 'Mohon bimbingan agar dapat hadir tepat waktu. Terimakasih.'}`;
  }
}

function sendEmail(to, subject, message) {
  try {
    GmailApp.sendEmail(
      to,
      `${CONFIG.EMAIL.SUBJECT_PREFIX} ${subject}`,
      '', // Plain text body (kosong karena kita menggunakan HTML)
      {
        name: CONFIG.EMAIL.SENDER_NAME,
        htmlBody: message // Menggunakan format HTML
      }
    );
    
    logActivity('sendEmail', {
      to: to,
      subject: subject,
      status: 'success'
    });
    
    return true;
  } catch (error) {
    logError('sendEmail', error);
    return false;
  }
}

function logActivity(context, data) {
  try {
    const sheet = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID)
                               .getSheetByName(CONFIG.SHEET_NAMES.ERROR_LOG);
    sheet.appendRow([
      new Date(),
      context,
      'INFO',
      JSON.stringify(data)
    ]);
    Logger.log(`Activity in ${context}: ${JSON.stringify(data)}`);
  } catch (e) {
    Logger.log(`Failed to log activity: ${e.message}`);
  }
}

function logError(context, error) {
  try {
    const sheet = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID)
                               .getSheetByName(CONFIG.SHEET_NAMES.ERROR_LOG);
    sheet.appendRow([
      new Date(),
      context,
      'ERROR',
      error.message,
      error.stack
    ]);
    Logger.log(`Error in ${context}: ${error.message}`);
  } catch (e) {
    Logger.log(`Failed to log error: ${e.message}`);
  }
}

function validateStudentData(student) {
  const requiredFields = ['rfid', 'nis', 'nama', 'kelas'];
  const missingFields = [];
  
  requiredFields.forEach(field => {
    if (!student[field]) {
      missingFields.push(field);
    }
  });
  
  if (missingFields.length > 0) {
    throw new Error(`Data tidak lengkap: ${missingFields.join(', ')}`);
  }
  
  return true;
}
