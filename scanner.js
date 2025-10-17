import fs from "fs";
import path from "path";

async function scanDir(dir, allowedExtensions, skipFolders) {
  let results = []; // Sử dụng let thay vì const để có thể gán lại

  try {
    const entries = await fs.promises.readdir(dir, { withFileTypes: true });

    for (const entry of entries) {
      const full = path.join(dir, entry.name);

      // 🔥 Bỏ qua các thư mục không cần quét
      if (entry.isDirectory()) {
        if (!skipFolders.includes(entry.name.toLowerCase())) {
          // SỬA LỖI Ở ĐÂY: Phải `await` lời gọi đệ quy
          const subResults = await scanDir(full, allowedExtensions, skipFolders);
          results.push(...subResults);
        }
      } 
      // 🔥 Lọc theo phần mở rộng
      else if (entry.isFile()) {
        const ext = path.extname(entry.name).toLowerCase();
        if (allowedExtensions.includes(ext)) {
          results.push(full);
        }
      }
    }
  } catch (err) {
    // Bỏ qua các lỗi truy cập thư mục (ví dụ: permission denied)
    if (err.code !== 'EPERM' && err.code !== 'EACCES') {
        console.error("⚠️ Lỗi khi đọc thư mục:", dir, "-", err.message);
    }
  }

  return results;
}

export default scanDir;