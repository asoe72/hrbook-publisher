const child_process = require("child_process");


// --------------------------------------------------
///@return		true: repoPath가 유효한 git repo, false: 아님
// --------------------------------------------------
exports.isGitRepo = function(repoPath) {
	try {
		child_process.execSync('git rev-parse --git-dir', {
			cwd: repoPath,
			encoding: 'utf8',
			stdio: 'pipe'
		});
		return true;
	} catch (err) {
		return false;
	}
}


// --------------------------------------------------
///@param[in]	repoPath		git repo 경로 (e.g. 'public/out-md/doc-endless')
///@return
///				-		0			ok
///				-		-1		ng
// --------------------------------------------------
exports.pullBook = function(repoPath) {
	try {
		gitExec(repoPath, 'git pull');
		return 0;
	} catch (err) {
		console.error("failed to pull:", err.message);
		return -1;
	}
}


// --------------------------------------------------
///@param[in]	repoPath		git repo 경로
///@param[in]	verId			checkout할 branch명 (e.g. 'ko', 'en')
///@return		0: ok, -1: ng (branch 없음 등)
// --------------------------------------------------
exports.checkoutBranch = function(repoPath, verId) {
	try {
		gitExec(repoPath, `git checkout ${verId}`);
		return 0;
	} catch (err) {
		console.error("failed to checkout:", err.message);
		return -1;
	}
}


// ----------------------------------------------
///@param[in]	repoPath		local 경로
///@param[in]	bookId			e.g. 'doc-endless'
///@param[in]	verId			e.g. 'ko'
///@return
// 				-		0			ok
// 				-		-1		ng
// ----------------------------------------------
exports.cloneBook = function(repoPath, bookId, verId) {
	try {
		const url = `https://github.com/hyundai-robotics/${bookId}.git`;
		const ret = gitExec(
			repoPath,
			`git clone -b ${verId} ${url}`
		);
		return 0;
	} catch (err) {
		console.error("failed to clone:", err.message);
		return -1;
	}
}


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
		return timestamp.split("  ")[0];
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
