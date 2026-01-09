import { insertUtf8Bom } from "./insert_utf8bom.mjs";

export function procAll(basePath)
{
  return insertUtf8Bom(basePath);
}
