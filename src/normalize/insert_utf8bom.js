const fs = require('fs');
const path = require('path');
const chalk = require('chalk');


// 제외할 폴더 or 파일명 목록
const EXCLUDED_NAMES = new Set([
  '.git'
]);


// 처리할 텍스트 파일 확장자 목록 (text만)
const TEXT_EXTENSIONS = new Set([
  '.txt', '.md', 
  '.html', '.css', 
  '.json','.xml', '.yml', '.yaml',
  '.js', '.ts', '.py', '.c', '.cpp', '.cs'
]);

const UTF8_BOM = Buffer.from([0xEF, 0xBB, 0xBF]);


///@param[in]   buffer    문자열
///@return      buffer가 utf8-bom으로 시작하는지 여부
function hasUtf8Bom(buffer) {
  return (
    buffer.length >= 3 &&
    buffer[0] === 0xEF &&
    buffer[1] === 0xBB &&
    buffer[2] === 0xBF
  );
}


///@param[in]   basePath
///@return    insert한 개수
///@brief		    _path 내의 모든 TEXT_EXTENSIONS 파일들에 대해 utf8-bom이 없으면 삽입
function insertUtf8Bom(basePath)
{
  console.log('');
  console.log('# INSERT UTF8-BOM ================');
  const context = { basePath, count: 0 };
  insertUtf8BomOnPath(basePath, context);
  if(context.count > 0) {
    console.log(chalk.yellow(`  * Inserted utf8-bom on total ${context.count} file(s).`));
  }
  
  return context.count;
}


///@param[in]   pathname
///@return
//      -   1   insert 했음.
//      -   0   insert 안 했음. (이미 있거나, 대상 확장자 아님.)
///@brief		    pathname file이 지정한 확장자이면, template html의 in-body 표식을 merged_in_body로 대체하여
///				head까지 갖춘 완전한 html 문서의 문자열을 리턴한다.
function insertUtf8BomOnFile(pathname, context)
{
  const relPath = path.relative(context.basePath, pathname);
  let strMsg = `  * ${relPath} : `;

  const ext = path.extname(pathname).toLowerCase();
  if (!TEXT_EXTENSIONS.has(ext)) {
    return 0;
  }

  const data = fs.readFileSync(pathname);

  if (hasUtf8Bom(data)) {
    console.log(strMsg + chalk.green(`has BOM already: `));
    return 0;
  }

  const newData = Buffer.concat([UTF8_BOM, data]);
  fs.writeFileSync(pathname, newData);

  console.log(strMsg + chalk.yellow(`  BOM added`));
  return 1;
}


///@param[in]   _path
///@param[in]   context   { basePath, count: 0 }
///@return
//      -   1   insert 했음.
//      -   0   insert 안 했음. (이미 있거나, 대상 확장자 아님.)
///@brief		    _path 내의 모든 파일에 대해 insertUtf8BomOnFile() 수행
function insertUtf8BomOnPath(_path, context)
{
  const entries = fs.readdirSync(_path, { withFileTypes: true });
  let count = 0;

  for (const entry of entries) {
    const pathname = path.join(_path, entry.name);

    if(EXCLUDED_NAMES.has(entry.name)) {
      continue;
    }

    if (entry.isDirectory()) {
      count += insertUtf8BomOnPath(pathname, context);
    }
    else if (entry.isFile()) {
      if(insertUtf8BomOnFile(pathname, context)) {
        context.count++;
      }
    }
  }

  return count;
}

module.exports = {
  insertUtf8Bom
}
