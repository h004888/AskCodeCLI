// index.js
import { ChromaClient } from "chromadb";
import { createQueryEmbedding } from "./embedding.js"; // Sửa import

const COLLECTION_NAME = "codebase"; // Tên collection
const BATCH_SIZE = 10;

// ===========================
// 🔹 Kết nối tới ChromaDB
// ===========================
async function dbConnect() {
    // ⚙️ Cách khởi tạo đúng cho chromadb >=0.5
    const client = new ChromaClient({ path: "http://localhost:8000" });
    console.log("✅ Đã kết nối tới ChromaDB.");
    return client;
}

// ===========================
// 🔹 Hàm xóa và tạo mới Collection
// ===========================
async function deleteAndCreateCollection() {
    const client = await dbConnect();
    try {
        await client.deleteCollection({ name: COLLECTION_NAME });
        console.log(`🗑️  Đã xóa collection cũ "${COLLECTION_NAME}".`);
    } catch (err) {
        // Bỏ qua lỗi nếu collection không tồn tại
        console.log(`ℹ️  Collection cũ không tồn tại, sẽ được tạo mới.`);
    }
    await client.createCollection({ name: COLLECTION_NAME });
    console.log(`✨ Tạo mới collection "${COLLECTION_NAME}"`);
}


// ===========================
// 🔹 Hàm lưu dữ liệu đa luồng
// ===========================
async function saveToChromaMultiThread(embeddingData) {
    const client = await dbConnect();

    // Nếu là chuỗi JSON → parse, còn không thì giữ nguyên
    const embeddingResult =
        typeof embeddingData === "string" ? JSON.parse(embeddingData) : embeddingData;

    // Mở hoặc tạo collection
    let collection;
    try {
        collection = await client.getCollection({ name: COLLECTION_NAME });
        console.log(`📁 Đã mở collection "${COLLECTION_NAME}"`);
    } catch {
        collection = await client.createCollection({ name: COLLECTION_NAME });
        console.log(`✨ Tạo mới collection "${COLLECTION_NAME}"`);
    }

    // ========================================
    // 🧵 Chia thành các batch để xử lý song song
    // ========================================
    for (let i = 0; i < embeddingResult.length; i += BATCH_SIZE) {
        const batch = embeddingResult.slice(i, i + BATCH_SIZE);

        console.log(
            `⚙️  Đang xử lý batch ${i / BATCH_SIZE + 1}/${Math.ceil(
                embeddingResult.length / BATCH_SIZE
            )} ...`
        );

        await Promise.all(
            batch.map(async (item) => {
                try {
                    await collection.add({
                        ids: [item.id],
                        embeddings: [item.embedding],
                        metadatas: [item.metadata],
                        documents: [item.document],
                    });
                    console.log(`✅ Đã thêm: ${item.id}`);
                } catch (err) {
                    console.error(`❌ Lỗi khi thêm ${item.id}:`, err.message);
                }
            })
        );
    }

    console.log("🎉 Đã lưu toàn bộ embedding vào Chroma thành công!");
}

// 🔹 Tìm kiếm
async function searchCode(question, topK = 5) {
    const client = await dbConnect();
    const queryEmbedding = await createQueryEmbedding(question);
    const collection = await client.getCollection({ name: COLLECTION_NAME });
    const results = await collection.query({
        queryEmbeddings: [queryEmbedding],
        nResults: topK,
    });

    console.log(`\n🔍 Kết quả tìm kiếm cho: "${question}"\n`);

    const documents = results.documents[0];
    const metadatas = results.metadatas[0];
    const distances = results.distances[0];

    for (let i = 0; i < documents.length; i++) {
        console.log(`📄 File: ${metadatas[i].path}`);
        console.log(`🔢 Score: ${distances[i].toFixed(4)}`);
        console.log("📜 Code:");
        console.log(documents[i].slice(0, 500));
        console.log("──────────────────────────────\n");
    }
}

// Thay đổi export default thành named exports
export { saveToChromaMultiThread, dbConnect, searchCode, deleteAndCreateCollection };