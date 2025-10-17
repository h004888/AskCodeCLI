import * as Parser from "tree-sitter";
import JavaScript from "tree-sitter-javascript";

async function createParser(language = "javascript") {
  const parser = new Parser.default();
  if (language === "javascript") {
    await parser.setLanguage(JavaScript);
  } else {
    throw new Error(`Ngôn ngữ ${language} chưa được hỗ trợ`);
  }
  return parser;
}

/**
 * Lấy docstring (comment ngay phía trên node)
 */
function getDocstringRecursive(node, code) {
  let prev = node.previousSibling;
  while (prev) {
    if (prev.type === "comment") {
      return code.slice(prev.startIndex + 2, prev.endIndex).trim();
    }
    // Bỏ qua các node không quan trọng khi tìm comment
    if (prev.isNamed) break;
    prev = prev.previousSibling;
  }
  return "";
}

/**
 * Hàm chính: phân tích code và trích xuất thông tin
 */
export async function parseCode(code, language = "javascript") {
  const parser = await createParser(language);
  const tree = parser.parse(code);
  const root = tree.rootNode;

  const imports = [];
  const functions = [];

  // Duyệt qua các node con cấp cao nhất của file
  for (const node of root.namedChildren || []) {
    // SỬA ĐỔI Ở ĐÂY: Dùng 'import_statement' thay vì 'import_declaration'
    if (node.type === "import_statement") {
      const importPathNode = node.namedChildren.find(n => n.type === "string");
      if (importPathNode) {
        // Lấy nội dung bên trong dấu ngoặc kép "" hoặc ''
        const importPath = code.slice(importPathNode.startIndex + 1, importPathNode.endIndex - 1);
        imports.push(importPath);
      }
    } 
    // Nếu là một định nghĩa hàm
    else if (node.type === "function_declaration") {
      const nameNode = node.namedChildren.find(n => n.type === "identifier");
      const name = nameNode ? code.slice(nameNode.startIndex, nameNode.endIndex) : "anonymous";

      const startLine = node.startPosition.row + 1;
      const endLine = node.endPosition.row + 1;

      const codeSnippet = code.slice(node.startIndex, node.endIndex).trim();
      const docstring = getDocstringRecursive(node, code);

      functions.push({
        type: "function",
        name,
        startLine,
        endLine,
        docstring,
        code: codeSnippet,
        imports: [], // Sẽ được điền ở bước sau
        language,
      });
    }
  }

  // Gán danh sách tất cả các import tìm thấy cho mỗi hàm
  for (const func of functions) {
    func.imports = imports;
  }

  return functions;
}