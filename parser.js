import * as Parser from "tree-sitter";
import JavaScript from "tree-sitter-javascript";
import Java from "tree-sitter-java";
import HTML from "tree-sitter-html";

// --- CÁC HÀM HELPER CHUNG (Không thay đổi) ---

async function createParser(language) {
  const parser = new Parser.default();
  switch (language) {
    case "javascript":
      await parser.setLanguage(JavaScript);
      break;
    case "java":
      await parser.setLanguage(Java);
      break;
    case "html":
      await parser.setLanguage(HTML);
      break;
    default:
      throw new Error(`Ngôn ngữ ${language} chưa được hỗ trợ`);
  }
  return parser;
}

function getDocstring(node, code) {
  let prev = node.previousSibling;
  while (prev) {
    if (prev.type === "comment" || prev.type === "block_comment") {
      const commentText = code.slice(prev.startIndex, prev.endIndex);
      return commentText.replace(/\/\*|\*\/|\/\//g, "").trim();
    }
    if (prev.isNamed) break;
    prev = prev.previousSibling;
  }
  return "";
}

// --- LOGIC PARSE CHO JAVASCRIPT VÀ JAVA (Không thay đổi) ---

function parseJavaScript(root, code) {
    const imports = [];
    const functions = [];
    for (const node of root.namedChildren) {
        if (node.type === "import_statement") {
        const pathNode = node.namedChildren.find(n => n.type === "string");
        if (pathNode) {
            imports.push(code.slice(pathNode.startIndex + 1, pathNode.endIndex - 1));
        }
        } else if (node.type === "function_declaration") {
        const nameNode = node.namedChildren.find(n => n.type === "identifier");
        const name = nameNode ? code.slice(nameNode.startIndex, nameNode.endIndex) : "anonymous";
        functions.push({
            type: "function", name, startLine: node.startPosition.row + 1, endLine: node.endPosition.row + 1,
            docstring: getDocstring(node, code), code: code.slice(node.startIndex, node.endIndex),
            imports: [], language: "javascript",
        });
        }
    }
    functions.forEach(f => f.imports = imports);
    return functions;
}

function parseJava(root, code) {
    const imports = [];
    const methods = [];
    const classNode = root.namedChildren.find(n => n.type === "class_declaration");
    if (!classNode) return [];
    const bodyNode = classNode.namedChildren.find(n => n.type === "class_body");
    if (!bodyNode) return [];
    for (const node of root.namedChildren) {
        if (node.type === "import_declaration") {
        const pathNode = node.namedChildren.find(n => n.type === "scoped_identifier" || n.type === "identifier");
        if (pathNode) {
            imports.push(code.slice(pathNode.startIndex, pathNode.endIndex));
        }
        }
    }
    for (const node of bodyNode.namedChildren) {
        if (node.type === "method_declaration") {
        const nameNode = node.namedChildren.find(n => n.type === "identifier");
        const name = nameNode ? code.slice(nameNode.startIndex, nameNode.endIndex) : "anonymous";
        methods.push({
            type: "method", name, startLine: node.startPosition.row + 1, endLine: node.endPosition.row + 1,
            docstring: getDocstring(node, code), code: code.slice(node.startIndex, node.endIndex),
            imports: imports, language: "java",
        });
        }
    }
    return methods;
}
// --- LOGIC PARSE CHO HTML (PHIÊN BẢN CHÍNH XÁC DỰA TRÊN DEBUG TREE) ---

function parseHTML(root, code) {
  const results = [];

  // Hàm helper để lấy giá trị thuộc tính, đã được kiểm chứng qua debug tree
  function getAttributeValue(tagNode, attributeName) {
    const attributeNode = tagNode.namedChildren.find(child => {
      if (child.type !== 'attribute') return false;
      const nameNode = child.namedChildren[0];
      return nameNode && nameNode.type === 'attribute_name' && nameNode.text === attributeName;
    });
    if (!attributeNode) return null;
    const valueNode = attributeNode.namedChildren[1];
    if (valueNode && valueNode.type === 'quoted_attribute_value') {
      return valueNode.text.slice(1, -1); // Cắt bỏ dấu ""
    }
    return null;
  }

  // Hàm đệ quy duyệt toàn bộ cây
  function traverse(node) {
    // 1. Xử lý node hiện tại
    if (node.type === 'element') {
      const startTag = node.namedChildren.find(c => c.type === 'start_tag');
      const tagNameNode = startTag?.namedChildren.find(c => c.type === 'tag_name');
      if (tagNameNode?.text === 'link') {
        const href = getAttributeValue(startTag, 'href');
        if (href) {
          results.push({ type: 'dependency', tag: 'link', path: href, language: 'html' });
        }
      }
    } 
    // PHÁT HIỆN QUAN TRỌNG: Xử lý loại node đặc biệt 'script_element'
    else if (node.type === 'script_element') {
      const startTag = node.namedChildren.find(c => c.type === 'start_tag');
      const src = getAttributeValue(startTag, 'src');
      if (src) {
        // Đây là script ngoài
        results.push({ type: 'dependency', tag: 'script', path: src, language: 'html' });
      } else {
        // Đây là script inline
        const contentNode = node.namedChildren.find(c => c.type === 'raw_text');
        if (contentNode) {
          results.push({
            type: 'code_block', tag: 'script',
            startLine: contentNode.startPosition.row + 1,
            endLine: contentNode.endPosition.row + 1,
            code: contentNode.text.trim(),
            language: 'html',
          });
        }
      }
    }

    // 2. Đệ quy xuống tất cả các node con để không bỏ sót
    for (const child of node.children) {
      traverse(child);
    }
  }

  traverse(root);
  return results;
}
/**
 * HÀM CHÍNH: Phân tích code và gọi hàm xử lý tương ứng
 */
export async function parseCode(code, language = "javascript") {
  const parser = await createParser(language);
  const tree = parser.parse(code);
  const root = tree.rootNode;

  switch (language) {
    case "javascript":
      return parseJavaScript(root, code);
    case "java":
      return parseJava(root, code);
    case "html":
      return parseHTML(root, code);
    default:
      return [];
  }
}