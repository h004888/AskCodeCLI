import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";
dotenv.config();

// Khởi tạo API
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
const embeddingModel = genAI.getGenerativeModel({ model: "text-embedding-004" });

// 🔹 Hàm xử lý từng chunk
async function embedChunk(chunk) {
    try {
        console.log(`Processing ${chunk.path}#${chunk.chunkIndex}`);
        const response = await embeddingModel.embedContent(chunk.content);
        const embedding = response.embedding.values;
        console.log(`✅ Embedded ${chunk.path}#${chunk.chunkIndex}`);
        return {
            id: `${chunk.path}#${chunk.chunkIndex}`,
            embedding,
            metadata: { path: chunk.path, chunkIndex: chunk.chunkIndex },
            document: chunk.content,
        };

    } catch (err) {
        console.error(`❌ Lỗi khi embed ${chunk.path}#${chunk.chunkIndex}:`, err.message);
        return null;
    }
}

// 🔹 Chạy nhiều task song song nhưng giới hạn số lượng
async function processChunksConcurrently(chunks, concurrency = 5) {
    const results = [];
    let index = 0;

    async function worker() {
        while (index < chunks.length) {
            const currentIndex = index++;
            const chunk = chunks[currentIndex];
            const res = await embedChunk(chunk);
            if (res) results.push(res);
        }
    }

    // Tạo `concurrency` số worker chạy song song
    const workers = Array.from({ length: concurrency }, () => worker());
    await Promise.all(workers);

    return results;
}

async function createQueryEmbedding(query) { // Sửa tên hàm cho nhất quán
    try {
        // SỬA LỖI: Sử dụng biến 'query' thay vì 'text' không xác định
        const result = await embeddingModel.embedContent(query);
        // Lấy vector embedding từ response
        const embedding = result.embedding.values;
        return embedding;
    } catch (err) {
        console.error("❌ Lỗi khi tạo embedding:", err);
        throw err;
    }
}

// Thay đổi export default thành named exports
export { processChunksConcurrently, createQueryEmbedding };