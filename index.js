import readAllFilesAndChunk from "./scanner.js";
import { processChunksConcurrently } from "./embedding.js";
import { saveToChromaMultiThread, searchCode } from "./dbConnect.js";

async function main() {
    // =================================================================
    // 🔹 BƯỚC 1: QUÉT VÀ CHIA NHỎ FILE TRONG THƯ MỤC SOURCE CODE
    // Thay thế './' bằng đường dẫn đến thư mục code của bạn.
    // =================================================================
    console.log("🚀 Bắt đầu quá trình quét thư mục...");
    const directoryToScan = "C:/Users/ADMIN/Downloads/aas"; // <-- THAY ĐỔI ĐƯỜNG DẪN NÀY
    const chunks = await readAllFilesAndChunk(directoryToScan);

    if (chunks.length === 0) {
        console.log("⚠️ Không tìm thấy file nào để xử lý. Vui lòng kiểm tra lại đường dẫn và `allowedExtensions` trong scanner.js");
        return;
    }
    console.log(`✅ Quét xong! Tìm thấy ${chunks.length} chunks.\n`);


    // =================================================================
    // 🔹 BƯỚC 2: TẠO EMBEDDING CHO TỪNG CHUNK
    // =================================================================
    console.log("🧠 Bắt đầu quá trình tạo embedding...");
    const embeddingData = await processChunksConcurrently(chunks);
    console.log("✅ Tạo embedding thành công!\n");


    // =================================================================
    // 🔹 BƯỚC 3: LƯU EMBEDDING VÀO CHROMA DB
    // =================================================================
    console.log("💾 Bắt đầu lưu dữ liệu vào ChromaDB...");
    await saveToChromaMultiThread(embeddingData);
    console.log("✅ Lưu vào ChromaDB thành công!\n");


    // =================================================================
    // 🔹 BƯỚC 4: THỰC HIỆN TÌM KIẾM (QUERY)
    // =================================================================
    const question = "Giao diện login ở đâu ?";
    await searchCode(question);
}

main().catch(err => {
    console.error("❌ Đã xảy ra lỗi trong quá trình thực thi:", err);
});