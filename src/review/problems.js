const path = require('path');
const chalk = require('chalk');


// --------------------------------------------------
function addInfo(context, msg)
{
	const info = { pathname: context.pathname, msg };
	context.problems.push(problem);
}


// --------------------------------------------------
///@param[in]   cat					category ('E'|'W'|'N')
///@param[in]   location		{ line, col } or null
// --------------------------------------------------
function addProblem(context, cat, header, msg, location)
{
	const problem = { pathname: context.pathname, cat, header, msg, location };
	context.problems.push(problem);
}


// --------------------------------------------------
function printProblems(context)
{
	let pathnameCur = '';

  for(const problem of context.problems)
  {
		// 경로파일명은 그룹별 1번만 출력
		pathnameCur = printRelPathnameIsDifferent(context, problem, pathnameCur);
		printProblem(problem);
  }
}


// --------------------------------------------------
///@param[in]   problem
///@param[in]   pathnameCur
///@return      problem.pathname
///@brief		    problem의 경로가 pathnameCur와 다르면 상대경로파일명을 print
// --------------------------------------------------
function printRelPathnameIsDifferent(context, problem, pathnameCur)
{
	if (pathnameCur === problem.pathname) return pathnameCur;

	console.log(` --------------------------------`);
	const relPathname = path.relative(context.basePathMd, problem.pathname);
	console.log(` in file, ${relPathname} : `);
	
	return problem.pathname;
}


// --------------------------------------------------
function printProblem(problem)
{
	let coloredHd = '';
	const strHd = `[${problem.header}]`;
	if(problem.cat === 'E') {
		coloredHd = chalk.red(strHd);
	}
	else if(problem.cat === 'W') {
		coloredHd = chalk.yellow(strHd);
	}
	else {
		coloredHd = chalk.cyan(strHd);
	}

	let strLocation = '';
	if(problem.location) {
		const { line, col } = problem.location;
		if (col) strLocation = ` at (Ln ${line}, Col ${col}))`;
		else strLocation = ` at (Ln ${line}))`;
	}

  console.log(`   - ` + coloredHd + ` ${problem.msg}` + strLocation);
}


module.exports = { addProblem, printProblems };
