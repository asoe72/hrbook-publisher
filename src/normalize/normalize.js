const { insertUtf8Bom } = require("./insert_utf8bom.js");
const { normalizeAll } = require("./normalize_hrbook_format.js");


function normalizeProcAll(basePath)
{
  insertUtf8Bom(basePath);
  normalizeAll(basePath);

  return 0;
}

module.exports = {
  normalizeProcAll
}
