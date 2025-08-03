/**
 * @description
 * Skrip Google Apps ini berfungsi sebagai backend untuk galeri foto.
 * Saat diakses melalui URL Web App, skrip ini akan:
 * 1. Menerima satu atau beberapa ID Folder Google Drive melalui parameter URL.
 * 2. Mengambil semua file gambar dari setiap folder yang valid.
 * 3. Mengatur izin berbagi file agar dapat diakses secara publik (hanya lihat).
 * 4. Menggabungkan semua informasi file gambar dari semua folder.
 * 5. Mengirimkan kembali data tersebut dalam format JSON yang siap digunakan oleh website.
 *
 * @param {Object} e - Parameter event dari permintaan GET, berisi parameter URL.
 * @returns {ContentService.TextOutput} - Respons dalam format JSON.
 */
function doGet(e) {
  // Langkah 1: Ambil beberapa ID Folder dari parameter URL (contoh: ?folderIds=id1,id2,id3)
  const FOLDER_IDS_STRING = e.parameter.folderIds;

  // Validasi: Jika tidak ada ID folder yang diberikan, kembalikan pesan error.
  if (!FOLDER_IDS_STRING) {
    return ContentService
      .createTextOutput(JSON.stringify({ 
        success: false, 
        error: "Kesalahan: ID Folder tidak disediakan dalam permintaan." 
      }))
      .setMimeType(ContentService.MimeType.JSON);
  }

  // Memisahkan string ID menjadi array
  const FOLDER_IDS = FOLDER_IDS_STRING.split(',');
  const allImageFiles = [];
  const debugInfo = [];

  try {
    // Langkah 2: Loop melalui setiap ID folder yang diberikan
    FOLDER_IDS.forEach(folderId => {
      const trimmedId = folderId.trim();
      if (!trimmedId) return; // Lewati jika ada ID kosong setelah trim

      try {
        const folder = DriveApp.getFolderById(trimmedId);
        const folderName = folder.getName();
        const files = folder.getFiles();
        let filesFoundInFolder = 0;

        // Loop melalui setiap file di dalam folder
        while (files.hasNext()) {
          const file = files.next();
          const mimeType = file.getMimeType();

          // Cek apakah file adalah gambar
          if (mimeType && mimeType.startsWith('image/')) {
            const fileId = file.getId();
            
            // Mengatur izin berbagi agar bisa diakses publik (hanya jika belum)
            try {
              if (file.getSharingAccess() !== DriveApp.Access.ANYONE_WITH_LINK) {
                file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
              }
            } catch (permError) {
              // Jika gagal mengatur izin, catat sebagai peringatan tapi tetap lanjutkan
              Logger.log("Peringatan izin untuk file " + file.getName() + ": " + permError.toString());
            }

            // Kumpulkan informasi file yang relevan
            allImageFiles.push({
              id: fileId,
              name: file.getName(),
              album: folderName, // Menambahkan nama album/folder untuk filtering di web
              size: file.getSize(),
              url: "https://lh3.googleusercontent.com/d/" + fileId, // URL langsung untuk menampilkan gambar
              lastModified: file.getLastUpdated().toISOString()
            });
            filesFoundInFolder++;
          }
        }
        // Catat informasi debug untuk setiap folder yang berhasil diproses
        debugInfo.push({ folderName: folderName, imagesFound: filesFoundInFolder });

      } catch (folderError) {
        // Jika satu folder gagal (misal ID salah), catat errornya dan lanjutkan ke folder berikutnya
        Logger.log("Gagal memproses folder ID " + trimmedId + ": " + folderError.toString());
        debugInfo.push({ folderId: trimmedId, error: "ID Folder tidak valid atau tidak dapat diakses." });
      }
    });

    // Langkah 3: Siapkan dan kirim respons JSON yang berhasil
    const response = {
      success: true,
      debug: debugInfo,
      images: allImageFiles
    };

    return ContentService
      .createTextOutput(JSON.stringify(response))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    // Menangani error tak terduga yang mungkin terjadi di luar loop
    Logger.log("TERJADI ERROR UTAMA: " + error.toString());
    const errorResponse = {
      success: false,
      error: "Terjadi kesalahan internal pada server. Detail: " + error.toString(),
    };
    return ContentService
      .createTextOutput(JSON.stringify(errorResponse))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
