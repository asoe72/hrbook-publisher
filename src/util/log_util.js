const path = require('path');
const fs = require('fs');

const pathnameLog = 'public/out-result/result.log';


// --------------------------------------------------
exports.init = function()
{
	try {
		// 이전 파일 있으면 삭제
    if (fs.existsSync(pathnameLog)) {
      fs.unlinkSync(pathnameLog);
    }

		// 경로 없으면 생성
		const dir = path.dirname(pathnameLog);
  	if (!fs.existsSync(dir)) {
    	fs.mkdirSync(dir, { recursive: true });
  	}
  } catch (err) {
    console.error(`초기화 중 에러 발생: ${pathnameLog}`, err);
  }
}


// --------------------------------------------------
exports.log = function(msg)
{
	console.log(msg);

	const strippedMsg = stripAnsi(msg);
	logToFile(strippedMsg);
}


// --------------------------------------------------
exports.logToSameRow = function(msg)
{
	process.stdout.write(`\r\x1b[K${msg}`);

	const strippedMsg = stripAnsi(msg);
	logToFile(strippedMsg);
}


// --------------------------------------------------
function logToFile(str) {
	fs.appendFile(pathnameLog, str + '\n', (err) => {
		if (err) throw err;
	});
}


// --------------------------------------------------
function stripAnsi(str) {
  // ANSI escape code를 찾는 정규표현식
  const ansiRegex = /[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g;
  return str.replace(ansiRegex, '');
}
