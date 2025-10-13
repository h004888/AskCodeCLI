import fs from 'fs/promises';
import path from 'path';
import os from 'os';

// Danh sách phần mở rộng được phép
const allowedExtensions = ['.html', '.js', '.ts','.vue'];

// ✅ Kiểm tra phần mở rộng hợp lệ
function hasAllowedExtension(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  return allowedExtensions.includes(ext);
}

// ✅ Chia nhỏ nội dung code thành chunk
function chunkContent(content, filePath, chunkSize = 10000) {
  const chunks = [];
  const totalChunks = Math.ceil(content.length / chunkSize);

  for (let i = 0; i < totalChunks; i++) {
    const start = i * chunkSize;
    const end = start + chunkSize;
    chunks.push({
      path: filePath,
      chunkIndex: i,
      content: content.slice(start, end),
    });
  }
  return chunks;
}

// ===============================================
// 🧵 Hàm phụ: giới hạn số lượng tác vụ chạy song song
// ===============================================
async function withConcurrencyLimit(tasks, limit = os.cpus().length * 10) {
  const results = [];
  let index = 0;

  async function worker() {
    while (index < tasks.length) {
      const i = index++;
      try {
        const res = await tasks[i]();
        if (res) results.push(...res);
      } catch (err) {
        console.error(`⚠️ Lỗi xử lý file:`, err.message);
      }
    }
  }

  await Promise.all(Array.from({ length: limit }, () => worker()));
  return results;
}

// ===============================================
// ✅ Hàm chính: đọc toàn bộ file và chunk song song
// ===============================================
async function readAllFilesAndChunk(dirPath) {
  async function walkDirectory(dir) {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    const allFiles = [];

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        allFiles.push(...(await walkDirectory(fullPath)));
      } else if (hasAllowedExtension(fullPath)) {
        allFiles.push(fullPath);
      }
    }

    return allFiles;
  }

  // 🔍 Quét toàn bộ thư mục
  console.log('🔍 Đang quét thư mục:', dirPath);
  let allFiles = [];
  try {
    allFiles = await walkDirectory(dirPath);
  } catch (err) {
    console.error('❌ Không thể đọc thư mục:', err.message);
    return [];
  }

  console.log(`📁 Tìm thấy ${allFiles.length} file cần xử lý`);

  // Tạo danh sách task song song
  const tasks = allFiles.map((filePath) => async () => {
    try {
      const content = await fs.readFile(filePath, 'utf8');
      if (content.length > 1000) {
        const chunks = chunkContent(content, filePath);
        return chunks;
      } else {
        console.log(`📄 Đã đọc file ${filePath} (${content.length} ký tự)`);
        return [{ path: filePath, chunkIndex: 0, content }];
      }
    } catch (err) {
      console.error(`⚠️ Không đọc được file ${filePath}:`, err.message);
      return [];
    }
  });

  // 🧠 Chạy song song với giới hạn CPU
  const allChunks = await withConcurrencyLimit(tasks);

  console.log(`✅ Hoàn tất đọc & chunk ${allChunks.length} đoạn code`);
  return allChunks;
}

export default readAllFilesAndChunk;
