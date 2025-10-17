import { GoogleGenerativeAI } from "@google/generative-ai";
import "dotenv/config"; // Tự động nạp các biến từ file .env

// 1. Khởi tạo client với API Key từ file .env
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);

// 🔥 SỬA LỖI Ở ĐÂY: Thay đổi tên model thành tên định danh chính xác
const model = genAI.getGenerativeModel({ model: "text-embedding-004" });

/**
 * Hàm chính để tạo embedding cho một mảng các câu hoặc đoạn code bằng Gemini API.
 * @param {string[]} texts Mảng các chuỗi cần embedding.
 * @returns {Promise<number[][]>} Một Promise trả về mảng các vector.
 */
export async function embed(texts) {
    try {
        const validTexts = texts.filter(text => text && text.trim() !== '');
        if (validTexts.length === 0) {
            return [];
        }

        // Cấu trúc request này đã đúng
        const result = await model.batchEmbedContents({
            requests: validTexts.map(text => ({
                content: {
                    parts: [{ text: text }],
                },
            })),
        });

        const embeddings = result.embeddings.map(e => e.values);
        return embeddings;

    } catch (error) {
        console.error("❌ Lỗi khi gọi Gemini API:", error);
        return [];
    }
}

// --- VÍ DỤ SỬ DỤNG (Bạn có thể chạy file này trực tiếp để test) ---
async function runExample() {
    console.log("Bắt đầu embedding với Google Gemini API (model: text-embedding-004)...");

    const sentences_vi = [
        "Làm thế nào để quét tất cả các file trong một thư mục?",
        "Hướng dẫn quét file và thư mục con bằng Node.js"
    ];
    
    const code_snippets = [
        "async function scanDir(dir) { /* ... */ }",
        "import fs from 'fs';"
    ];

    console.log("\n--- Bắt đầu embedding Tiếng Việt ---");
    const embeddings_vi = await embed(sentences_vi);
    if (embeddings_vi.length > 0) {
        console.log("Vector đầu tiên:", embeddings_vi[0].slice(0, 5), "...");
        console.log("Kích thước vector:", embeddings_vi[0].length);
    }

    console.log("\n--- Bắt đầu embedding Code ---");
    const embeddings_code = await embed(code_snippets);
    if (embeddings_code.length > 0) {
        console.log("Vector đầu tiên:", embeddings_code[0].slice(0, 5), "...");
        console.log("Kích thước vector:", embeddings_code[0].length);
    }
}

runExample();