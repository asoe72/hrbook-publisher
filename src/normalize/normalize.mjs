import { insertUtf8Bom } from "./insert_utf8bom.mjs";
import { normalizeAll } from "./normalize_hrbook_format.mjs";


export function procAll(basePath)
{
  insertUtf8Bom(basePath);
  normalizeAll(basePath);

  return 0;
}
