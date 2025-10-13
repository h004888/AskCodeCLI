import inquirer from 'inquirer';
import readAllFilesAndChunk from "./scanner.js";
import { processChunksConcurrently } from "./embedding.js";
import { saveToChromaMultiThread, searchCode, deleteAndCreateCollection } from "./dbConnect.js";

// =================================================================
// 🔹 HÀM CHUNG: Quét thư mục, chia nhỏ file và tạo embedding
// =================================================================
async function scanAndEmbed() {
    const { directoryToScan } = await inquirer.prompt([
        {
            type: 'input',
            name: 'directoryToScan',
            message: 'Nhập đường dẫn đến thư mục source code:',
            default: 'C:/Users/ADMIN/Downloads/aas', // Đường dẫn mặc định
        }
    ]);

    console.log("\n🚀 Bắt đầu quá trình quét thư mục...");
    const chunks = await readAllFilesAndChunk(directoryToScan);

    if (chunks.length === 0) {
        console.log("⚠️  Không tìm thấy file nào để xử lý. Vui lòng kiểm tra lại đường dẫn và `allowedExtensions` trong scanner.js");
        return null;
    }
    console.log(`✅ Quét xong! Tìm thấy ${chunks.length} chunks.\n`);

    console.log("🧠 Bắt đầu quá trình tạo embedding...");
    const embeddingData = await processChunksConcurrently(chunks);
    console.log("✅ Tạo embedding thành công!\n");
    return embeddingData;
}

// =================================================================
// 🔹 XỬ LÝ 1: Tạo mới VectorDB
// =================================================================
async function handleCreateNewDB() {
    console.log("\n===== BẮT ĐẦU: TẠO MỚI VECTOR DB =====");
    const embeddingData = await scanAndEmbed();
    if (embeddingData) {
        console.log("🗑️  Chuẩn bị tạo collection mới (xóa collection cũ nếu tồn tại)...");
        await deleteAndCreateCollection();

        console.log("\n💾 Bắt đầu lưu dữ liệu vào ChromaDB...");
        await saveToChromaMultiThread(embeddingData);
        console.log("✅ Hoàn tất! Vector DB đã được tạo mới thành công.\n");
    }
}

// =================================================================
// 🔹 XỬ LÝ 2: Cập nhật VectorDB đã có
// =================================================================
async function handleUpdateDB() {
    console.log("\n===== BẮT ĐẦU: CẬP NHẬT VECTOR DB =====");
    const embeddingData = await scanAndEmbed();
    if (embeddingData) {
        console.log("💾 Bắt đầu thêm/cập nhật dữ liệu vào ChromaDB...");
        // Hàm này sẽ tự động thêm dữ liệu mới hoặc ghi đè dữ liệu cũ nếu có cùng ID
        await saveToChromaMultiThread(embeddingData);
        console.log("✅ Hoàn tất! Vector DB đã được cập nhật thành công.\n");
        
    }
}

// =================================================================
// 🔹 XỬ LÝ 3: Đặt câu hỏi
// =================================================================
async function handleAskQuestion() {
    console.log("\n===== ĐẶT CÂU HỎI VỚI VECTOR DB =====");
    const { question } = await inquirer.prompt([
        {
            type: 'input',
            name: 'question',
            message: 'Nhập câu hỏi của bạn:',
            default: 'Giao diện login ở đâu ?',
        }
    ]);
    if (question && question.trim() !== '') {
        await searchCode(question);
    } else {
        console.log("⚠️ Câu hỏi không được để trống.");
    }
}

// =================================================================
// 🔹 MENU CHÍNH
// =================================================================
async function mainMenu() {
    while (true) {
        const { action } = await inquirer.prompt([
            {
                type: 'list',
                name: 'action',
                message: 'Chào bạn, bạn muốn làm gì?',
                choices: [
                    { name: '1. Đặt câu hỏi với VectorDB đã tồn tại', value: 'ask' },
                    { name: '2. Tạo VectorDB mới (xóa toàn bộ dữ liệu cũ)', value: 'create' },
                    { name: '3. Cập nhật dữ liệu cho VectorDB đã có', value: 'update' },
                    new inquirer.Separator(),
                    { name: 'Thoát chương trình', value: 'exit' },
                ],
                loop: false,
            },
        ]);

        switch (action) {
            case 'ask':
                await handleAskQuestion();
                break;
            case 'create':
                await handleCreateNewDB();
                break;
            case 'update':
                await handleUpdateDB();
                break;
            case 'exit':
                console.log('👋 Tạm biệt!');
                return;
        }
        await inquirer.prompt([{type: 'input', name: 'continue', message: '\nNhấn ENTER để quay lại menu chính...'}]);
    }
}

mainMenu().catch(err => {
    console.error("❌ Đã xảy ra lỗi nghiêm trọng trong quá trình thực thi:", err);
});