const { insertUtf8Bom } = require("./insert_utf8bom.js");
const { normalizeAll } = require("./normalize_hrbook_format.js");
const str_util = require("../util/str_util.js");


function normalizeProcAll(basePath)
{
  str_util.clearConsole();
  insertUtf8Bom(basePath);
  normalizeAll(basePath);

  return 0;
}

module.exports = {
  normalizeProcAll
}
