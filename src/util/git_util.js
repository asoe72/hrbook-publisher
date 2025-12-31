const child_process = require("child_process");


///@return		repoPath의 첫 commit date	e.g. '2022-01-19'
exports.getFirstCommitDate= function(repoPath) {
	try {
		const output = gitExec(
			repoPath,
			"git log --all --reverse --format=%cd --date=iso"
		);
		
		const timestamp = output.split(/\r?\n/)[0];	// e.g. "2025-12-30 09:25:28 +0900"
		return timestamp.split(" ")[0];
	} catch (err) {
		console.error("cannot get git info:", err.message);
		return "";
	}
}


///@return		repoPath의 현재 commit 날짜	e.g. '2025-12-30'
exports.getCurrentCommitDate = function(repoPath) {
	try {
		const timestamp = gitExec(
			repoPath,
			"git log -1 --format=%cd --date=iso"
		);				// e.g. "2025-12-30 09:25:28 +0900"
		return timestamp.split(" ")[0];
	} catch (err) {
		console.error("cannot get git info:", err.message);
		return '';
	}
}


///@param[in]	repoPath		경로
///@param[in]	cmd			exec 명령문
function gitExec(repoPath, cmd) {
  return child_process.execSync(cmd, {
    cwd: repoPath,
    encoding: "utf8"
  }).trim();
}


exports.gitExec = gitExec;
