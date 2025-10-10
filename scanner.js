import fs from 'fs';
import path from 'path';

// const allowedExtensions = [
//   '.html', '.htm', '.xhtml', '.css', '.scss', '.sass', '.less',
//   '.js', '.jsx', '.ts', '.tsx', '.vue', '.svelte',
//   '.java', '.kt', '.kts', '.groovy', '.scala', '.clj', '.cljs',
//   '.py', '.pyw', '.ipynb', '.c', '.cpp', '.cc', '.cxx', '.h', '.hpp', '.cs',
//   '.rs', '.go', '.zig', '.php', '.phtml', '.php3', '.php4', '.php5', '.phps',
//   '.rb', '.rake', '.erb', '.pl', '.pm', '.swift', '.m', '.mm',
//   '.sh', '.bash', '.zsh', '.bat', '.cmd', '.ps1',
//   '.json', '.yaml', '.yml', '.xml', '.ini', '.cfg', '.toml', '.env',
//   '.sql', '.psql', '.proto', '.thrift', '.graphql', '.gql',
//   '.r', '.jl', '.ipynb', '.dart', '.lua', '.hs', '.erl', '.ex', '.exs',
//   '.fs', '.fsi', '.fsx', '.vb', '.vbs', '.pas', '.asm',
//   '.gradle', '.makefile', '.mk', '.dockerfile', '.md', '.markdown'
// ];

const allowedExtensions = ['.html']

// Kiểm tra phần mở rộng hợp lệ
function hasAllowedExtension(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  return allowedExtensions.includes(ext);
}

// ✅ Hàm chia nhỏ nội dung code thành chunk
function chunkContent(content, filePath, chunkSize = 10000) {
  const chunks = [];
  const totalChunks = Math.ceil(content.length / chunkSize);

  for (let i = 0; i < totalChunks; i++) {
    const start = i * chunkSize;
    const end = start + chunkSize;
    const chunkContent = content.slice(start, end);

    chunks.push({
      path: filePath,
      chunkIndex: i,
      content: chunkContent,
    });
  }

  return chunks;
}

// ✅ Đọc tất cả file và chunk nếu cần
 async function readAllFilesAndChunk(dirPath, results = []) {
  if (!fs.existsSync(dirPath)) {
    console.error('❌ Folder không tồn tại:', dirPath);
    return results;
  }

  const files = fs.readdirSync(dirPath);

  for (const file of files) {
    const filePath = path.join(dirPath, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      readAllFilesAndChunk(filePath, results);
    } else {
      if (!hasAllowedExtension(filePath)) continue;

      try {
        const content = fs.readFileSync(filePath, 'utf8');
        if (content.length > 1000) {
          const chunks = chunkContent(content, filePath);
          results.push(...chunks);
        } else {
          results.push({ path: filePath, chunkIndex: 0, content });
        }
      } catch (error) {
        console.error(`⚠️ Không đọc được file ${filePath}:`, error.message);
      }
    }
  }

  return results;
}

export default readAllFilesAndChunk;

