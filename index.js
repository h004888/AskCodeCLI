import { parseCode } from "./parser.js";
import scanDir from "./scanner.js";
import fs from "fs";
import path from "path";

const allowedExtensions = [
  ".java", ".kt", ".js", ".ts", ".jsx", ".tsx", ".py", ".rb", ".php", ".cs", ".go",
  ".cpp", ".hpp", ".c", ".h", ".m", ".mm", ".swift", ".vb", ".dart", ".lua", ".pl",
  ".sh", ".bash", ".zsh", ".fish", ".csh", ".ksh", ".tcsh", ".rc", ".bat", ".cmd",
  ".ps1", ".psm1", ".psd1", ".vbs", ".vba", ".sql", ".html", ".htm", ".css", ".scss",
  ".less", ".xml", ".json", ".yaml", ".yml", ".toml", ".ini", ".cfg", ".conf",
  ".properties", ".md", ".rst", ".txt", ".log", ".csv", ".tsv"
];

const skipFolders = [
  "node_modules", "build", "dist", "out", "target", "venv", "env",
  "bin", "obj", "lib", "libs", "builds", "logs", "tmp", "temp", "fontawesome-free", "jquery", "bootstrap", ".idea", ".git"
];

const languageMap = {
  '.js': 'javascript',
  '.java': 'java',
  '.html': 'html',
  '.htm': 'html'
};

async function main() {
    const dir = "C:/Users/ADMIN/Documents/FlowerShop/FlowerShop";
    // 🔥 BƯỚC 1: ĐỊNH NGHĨA TÊN FILE OUTPUT
    const outputFilename = "analysis_results.json";

    const files = await scanDir(dir, allowedExtensions, skipFolders);
    
    console.log(`Quét xong! Tìm thấy ${files.length} file hợp lệ.`);

    const allResults = [];

    for (const file of files) {
        const extension = path.extname(file).toLowerCase();
        const language = languageMap[extension];

        if (!language) {
            continue;
        }

        try {
            const code = await fs.promises.readFile(file, "utf8");
            const result = await parseCode(code, language);

            if (result && result.length > 0) {
                console.log(`-> Đã phân tích file [${language}]: ${file}`);
                allResults.push({ file, language, data: result });
            }
        } catch (err) {
            console.error(`⚠️ Lỗi khi xử lý file ${file}:`, err.message);
        }
    }

    // 🔥 BƯỚC 2: GHI MẢNG allResults VÀO FILE JSON SAU KHI VÒNG LẶP KẾT THÚC
    try {
        console.log(`\nĐang ghi ${allResults.length} kết quả vào file ${outputFilename}...`);
        
        // Chuyển đổi mảng object thành một chuỗi JSON có định dạng đẹp (cách 2 space)
        const jsonData = JSON.stringify(allResults, null, 2);
        
        // Ghi chuỗi JSON vào file
        await fs.promises.writeFile(outputFilename, jsonData, 'utf8');
        
        console.log(`✅ Ghi file thành công!`);
    } catch (err) {
        console.error(`❌ Lỗi khi ghi file JSON:`, err.message);
    }

    console.log("\nHoàn tất quá trình phân tích!");
}

main();