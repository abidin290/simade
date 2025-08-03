// =================================================================
// PENGATURAN AWAL - Sesuaikan ID dan nama sheet di sini
// =================================================================
var sheetId = "id sheet Anda";
var loginSheet = "SheetLoginWeb";
var dataSheet1 = "DataPenduduk";

// =================================================================
// FUNGSI UTAMA (ROUTER) - Titik masuk untuk semua permintaan dari web
// =================================================================
function doPost(e) {
  try {
    var params = e.postData && e.postData.contents ? JSON.parse(e.postData.contents) : {};
    var action = params.action;
    var token = params.token;

    if (!action) {
      return errorResponse("Aksi tidak ditentukan.");
    }
    
    // Pengecualian: Aksi 'login' tidak memerlukan token.
    if (action !== "login") {
      const validation = validateToken(token);
      if (!validation.isValid) {
        return errorResponse("Token tidak valid atau sesi habis.");
      }
      // Menyimpan peran (role) pengguna untuk pengecekan keamanan di setiap aksi
      params.userRole = validation.role; 
      params.usernameFromToken = validation.username;
    }

    // Mengarahkan permintaan ke fungsi yang sesuai
    switch (action) {
      case "login":
        return handleLogin(params);
      
      // Aksi yang bisa diakses semua pengguna yang sudah login
      case "listPenduduk":
        return successResponse({ penduduk: getAllPenduduk() });
      case "getFolderId":
        return handleGetFolderId();
      
      // Aksi yang HANYA bisa diakses oleh ADMIN
      case "setFolderId":
        if (params.userRole !== 'admin') return errorResponse("Akses ditolak. Hanya admin.");
        return handleSetFolderId(params);
      case "listUsers":
        if (params.userRole !== 'admin') return errorResponse("Akses ditolak. Hanya admin.");
        return handleListUsers();
      case "addUser":
        if (params.userRole !== 'admin') return errorResponse("Akses ditolak. Hanya admin.");
        return handleAddUser(params);
      case "updateUser":
        if (params.userRole !== 'admin') return errorResponse("Akses ditolak. Hanya admin.");
        return handleUpdateUser(params);
      case "deleteUser":
        if (params.userRole !== 'admin') return errorResponse("Akses ditolak. Hanya admin.");
        return handleDeleteUser(params);

      default:
        return errorResponse("Aksi '" + action + "' tidak valid.");
    }
  } catch (error) {
    Logger.log("ERROR di doPost: " + error.toString());
    return errorResponse("Terjadi kesalahan server: " + error.message);
  }
}

// =================================================================
// FUNGSI-FUNGSI MANAJEMEN PENGGUNA (KHUSUS ADMIN)
// =================================================================

/**
 * Mengambil daftar semua pengguna dari SheetLoginWeb.
 */
function handleListUsers() {
  try {
    const sheet = SpreadsheetApp.openById(sheetId).getSheetByName(loginSheet);
    const data = sheet.getDataRange().getValues();
    const headers = data.shift(); // Ambil dan hapus header
    
    const users = data.map(row => {
      return {
        username: row[0],
        // Password tidak dikirim ke client demi keamanan
        role: row[2] || 'user'
      };
    });

    return successResponse({ users: users });
  } catch (e) {
    return errorResponse("Gagal mengambil daftar pengguna: " + e.message);
  }
}

/**
 * Menambahkan pengguna baru ke SheetLoginWeb.
 */
function handleAddUser(params) {
  const { newUsername, newPassword, newRole } = params;
  if (!newUsername || !newPassword || !newRole) {
    return errorResponse("Semua field (username, password, role) harus diisi.");
  }

  try {
    const sheet = SpreadsheetApp.openById(sheetId).getSheetByName(loginSheet);
    const data = sheet.getDataRange().getValues();
    const isExist = data.some(row => row[0].toLowerCase() === newUsername.toLowerCase());

    if (isExist) {
      return errorResponse("Username sudah ada. Silakan gunakan username lain.");
    }

    sheet.appendRow([newUsername, newPassword, newRole]);
    return successResponse({ message: "Pengguna baru berhasil ditambahkan." });
  } catch (e) {
    return errorResponse("Gagal menambahkan pengguna: " + e.message);
  }
}

/**
 * Memperbarui data pengguna (password dan/atau role).
 */
function handleUpdateUser(params) {
  const { username, newPassword, newRole } = params;
  if (!username || !newRole) {
    return errorResponse("Username dan Role harus diisi.");
  }

  try {
    const sheet = SpreadsheetApp.openById(sheetId).getSheetByName(loginSheet);
    const data = sheet.getDataRange().getValues();
    const userRowIndex = data.findIndex(row => row[0] === username);

    if (userRowIndex === -1) {
      return errorResponse("Pengguna tidak ditemukan.");
    }

    // Update Role (kolom ke-3)
    sheet.getRange(userRowIndex + 1, 3).setValue(newRole);
    // Update Password (kolom ke-2) hanya jika diisi
    if (newPassword) {
      sheet.getRange(userRowIndex + 1, 2).setValue(newPassword);
    }
    
    return successResponse({ message: "Data pengguna berhasil diperbarui." });
  } catch (e) {
    return errorResponse("Gagal memperbarui pengguna: " + e.message);
  }
}

/**
 * Menghapus pengguna dari SheetLoginWeb.
 */
function handleDeleteUser(params) {
  const { username } = params;
  if (!username) return errorResponse("Username harus diisi.");
  
  // Proteksi agar admin tidak bisa menghapus akunnya sendiri
  if (username.toLowerCase() === params.usernameFromToken.toLowerCase()) {
    return errorResponse("Anda tidak dapat menghapus akun Anda sendiri.");
  }

  try {
    const sheet = SpreadsheetApp.openById(sheetId).getSheetByName(loginSheet);
    const data = sheet.getDataRange().getValues();
    const userRowIndex = data.findIndex(row => row[0] === username);

    if (userRowIndex === -1) {
      return errorResponse("Pengguna tidak ditemukan.");
    }

    // Hapus baris (ingat +1 karena index array vs nomor baris sheet)
    sheet.deleteRow(userRowIndex + 1);
    return successResponse({ message: "Pengguna berhasil dihapus." });
  } catch (e) {
    return errorResponse("Gagal menghapus pengguna: " + e.message);
  }
}

// =================================================================
// FUNGSI LOGIN & AUTENTIKASI
// =================================================================

function handleLogin(params) {
  const { username, password } = params;
  if (!username || !password) return errorResponse("Username dan password harus diisi.");

  const result = authenticateUser(username, password);
  if (result.success) {
    const token = Utilities.base64Encode(Utilities.getUuid());
    const userData = JSON.stringify({ username: result.username, role: result.role });
    PropertiesService.getScriptProperties().setProperty(token, userData);
    
    return successResponse({ 
        token: token, 
        username: result.username, 
        role: result.role 
    });
  } else {
    return errorResponse(result.message);
  }
}

function authenticateUser(username, password) {
  try {
    const sheet = SpreadsheetApp.openById(sheetId).getSheetByName(loginSheet);
    const data = sheet.getDataRange().getValues();
    const headers = data[0];
    
    const userIndex = headers.indexOf("Username");
    const passIndex = headers.indexOf("Password");
    const roleIndex = headers.indexOf("Role");

    if (userIndex === -1 || passIndex === -1 || roleIndex === -1) {
      return { success: false, message: "Struktur SheetLoginWeb tidak benar. Pastikan ada kolom 'Username', 'Password', dan 'Role'." };
    }

    const userRow = data.slice(1).find(row => row[userIndex] === username && row[passIndex] === password);
    
    if (userRow) {
      return { 
        success: true, 
        username: userRow[userIndex],
        role: userRow[roleIndex] || 'user'
      };
    } else {
      return { success: false, message: "Username atau password salah." };
    }
  } catch (err) {
    Logger.log("ERROR di authenticateUser: " + err.toString());
    return { success: false, message: "Terjadi kesalahan saat otentikasi." };
  }
}

function validateToken(token) {
  if (!token) return { isValid: false };
  const userDataJSON = PropertiesService.getScriptProperties().getProperty(token);
  if (!userDataJSON) return { isValid: false };
  
  const userData = JSON.parse(userDataJSON);
  return { 
    isValid: true, 
    username: userData.username, 
    role: userData.role 
  };
}

// =================================================================
// FUNGSI PENGATURAN GALERI (KHUSUS ADMIN)
// =================================================================

/**
 * Menyimpan data beberapa folder galeri DAN daftar folder mana saja yang aktif.
 * Menerima objek: { folders: [{name, id}, ...], activeIds: ["ID_1", "ID_2", ...] }
 */
function handleSetFolderId(params) {
  const { folderData, activeIds } = params;
  if (!folderData || !Array.isArray(folderData) || !Array.isArray(activeIds)) {
    return errorResponse("Data yang dikirim tidak valid.");
  }
  
  try {
    const settings = {
      folders: folderData,
      activeIds: activeIds || [] // Simpan array ID aktif
    };
    const settingsString = JSON.stringify(settings);
    PropertiesService.getScriptProperties().setProperty('gallerySettings', settingsString);
    return successResponse({ message: "Pengaturan folder galeri berhasil disimpan." });
  } catch (e) {
    return errorResponse("Gagal menyimpan data folder: " + e.message);
  }
}

/**
 * Mengambil data beberapa folder galeri DAN daftar folder yang aktif.
 */
function handleGetFolderId() {
  const settingsString = PropertiesService.getScriptProperties().getProperty('gallerySettings');
  if (!settingsString) {
    // Jika belum ada data, kembalikan struktur default
    return successResponse({ settings: { folders: [], activeIds: [] } });
  }
  
  try {
    const settings = JSON.parse(settingsString);
    return successResponse({ settings: settings });
  } catch (e) {
    return errorResponse("Gagal membaca data folder: " + e.message);
  }
}

// =================================================================
// FUNGSI PENGAMBILAN DATA
// =================================================================

function getAllPenduduk() {
  const sheet = SpreadsheetApp.openById(sheetId).getSheetByName(dataSheet1);
  const data = sheet.getDataRange().getValues();
  return data.slice(1).map(row => ({
    nama: row[2]?.toString().trim() || "",
    noKK: row[3]?.toString().trim() || "",
    nik: row[4]?.toString().trim() || "",
    tempatLahir: row[5]?.toString().trim() || "",
    tanggalLahir: row[6]?.toString().trim() || "",
    agama: row[7]?.toString().trim() || "",
    pekerjaan: row[8]?.toString().trim() || "",
    jenisKelamin: row[9]?.toString().trim() || "",
    statusHubungan: row[10]?.toString().trim() || "",
    pendidikan: row[11]?.toString().trim() || "",
    umur: row[12]?.toString().trim() || "",
    dusun: row[22]?.toString().trim() || "Tidak Diketahui"
  })).filter(p => p.nik && p.nama);
}

// =================================================================
// FUNGSI BANTUAN (HELPER)
// =================================================================

function errorResponse(message) {
  return ContentService.createTextOutput(JSON.stringify({ success: false, message: message }))
    .setMimeType(ContentService.MimeType.JSON);
}

function successResponse(data) {
  return ContentService.createTextOutput(JSON.stringify({ success: true, ...data }))
    .setMimeType(ContentService.MimeType.JSON);
}
