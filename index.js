import { parseCode } from "./parser.js";

const code = `
// Hàm cộng hai số
import lodash from "lodash";

function add(a, b) {
  return a + b;
}

// Nhân hai số
function multiply(x, y) {
  return x * y;
}
`;

const result = await parseCode(code);
console.log(JSON.stringify(result, null, 2));
