import readAllFilesAndChunk from "./scanner.js";
import processChunksConcurrently from "./embedding.js";
import saveToChromaMultiThread from "./dbConnect.js";

async function main() {
  const chunks = await readAllFilesAndChunk("C:/Users/ADMIN/Downloads/aas");
  console.log("✅ Đã đọc xong:", chunks.length, "chunks");
  console.time("embedding");
  const results = await processChunksConcurrently(chunks, 20);
  console.timeEnd("embedding");
  console.log("✅ Done:", results.length, "chunks processed");
  await saveToChromaMultiThread(JSON.stringify(results));
}

main();