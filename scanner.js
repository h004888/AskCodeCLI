import fs from "fs";
import path from "path";

const allowedExtensions = [
  ".java", ".kt", ".js", ".ts", ".jsx", ".tsx", ".py", ".rb", ".php", ".cs", ".go",
  ".cpp", ".hpp", ".c", ".h", ".m", ".mm", ".swift", ".vb", ".dart", ".lua", ".pl",
  ".sh", ".bash", ".zsh", ".fish", ".csh", ".ksh", ".tcsh", ".rc", ".bat", ".cmd",
  ".ps1", ".psm1", ".psd1", ".vbs", ".vba", ".sql", ".html", ".htm", ".css", ".scss",
  ".less", ".xml", ".json", ".yaml", ".yml", ".toml", ".ini", ".cfg", ".conf",
  ".properties", ".md", ".rst", ".txt", ".log", ".csv", ".tsv", ".xlsx", ".xls",
  ".pptx", ".ppt", ".docx", ".doc", ".pdf", ".odt", ".ods", ".odp", ".odg", ".odf",
  ".rtf", ".tex", ".bib"
];

const skipFolders = [
  "node_modules", "build", "dist", "out", "target", "venv", "env",
  "bin", "obj", "lib", "libs", "builds", "logs", "tmp", "temp","fontawesome-free","jquery","bootstrap",".idea"
];
async function scanDir(dir, allowedExtensions, skipFolders) {
  const results = [];

  try {
    for (const entry of fs.readdirSync(dir)) {
      const full = path.join(dir, entry);
      const stat = fs.statSync(full);

      // 🔥 Bỏ qua các thư mục không cần quét
      if (stat.isDirectory()) {
        if (!skipFolders.includes(entry.toLowerCase())) {
          results.push(...scanDir(full, allowedExtensions, skipFolders));
        }
      } 
      // 🔥 Lọc theo phần mở rộng
      else {
        const ext = path.extname(entry).toLowerCase();
        if (allowedExtensions.includes(ext)) {
          results.push(full);
        }
      }
    }
  } catch (err) {
    console.error("⚠️ Lỗi khi đọc thư mục:", dir, "-", err.message);
  }

  return results;
}

export default scanDir;
