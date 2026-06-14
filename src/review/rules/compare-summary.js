const axios = require('axios');
const markdown_it = require('markdown-it');
const chalk = require('chalk');
const log_util = require('../../util/log_util');

const GITHUB_ORG_BASE = 'https://raw.githubusercontent.com/hyundai-robotics';


// --------------------------------------------------
///@param[in]   bookId      e.g. 'doc-endless'
///@param[in]   branchName  e.g. 'ko-tp630'
///@return      GitHub raw URL string
// --------------------------------------------------
function buildSummaryRawUrl(bookId, branchName)
{
  return `${GITHUB_ORG_BASE}/${bookId}/refs/heads/${branchName}/SUMMARY.md`;
}


// --------------------------------------------------
///@param[in]   bookId      e.g. 'doc-endless'
///@param[in]   branchName  e.g. 'ko-tp630'
///@return      SUMMARY.md 텍스트, 실패 시 null
// --------------------------------------------------
async function fetchSummaryText(bookId, branchName)
{
  const url = buildSummaryRawUrl(bookId, branchName);
  try {
    const response = await axios.get(url);
    return response.data;
  } catch (e) {
    return null;
  }
}


// --------------------------------------------------
///@param[in]   text    SUMMARY.md 텍스트
///@return      .md 상대경로 href 배열 (http/https 제외)
// --------------------------------------------------
function extractMdHrefsFromSummary(text)
{
  const tokens = new markdown_it().parse(text, {});
  const hrefs = [];

  for (const token of tokens) {
    if (!token.children) continue;
    for (const child of token.children) {
      if (child.type !== 'link_open') continue;
      const hrefAttr = child.attrs?.find(a => a[0] === 'href');
      if (!hrefAttr) continue;
      const href = hrefAttr[1].split('?')[0].split('#')[0].trim();
      if (href.startsWith('http://') || href.startsWith('https://')) continue;
      if (!href.toLowerCase().endsWith('.md')) continue;
      hrefs.push(href);
    }
  }
  return hrefs;
}


// --------------------------------------------------
///@param[in]   koBranch  e.g. 'ko-tp630' or 'ko'
///@return      en branch name e.g. 'en-tp630' or 'en'
// --------------------------------------------------
function getEnBranchName(koBranch)
{
  return koBranch.replace(/^ko/, 'en');
}


// --------------------------------------------------
///@param[in]   koHrefs   ko SUMMARY.md의 .md href 배열
///@param[in]   enHrefs   en SUMMARY.md의 .md href 배열
///@return      불일치 항목 배열 { index, koLink, enLink }[] (없으면 빈 배열)
// --------------------------------------------------
function findAllDiffs(koHrefs, enHrefs)
{
  const len = Math.max(koHrefs.length, enHrefs.length);
  const diffs = [];
  for (let i = 0; i < len; i++) {
    const koLink = koHrefs[i] ?? '(none)';
    const enLink = enHrefs[i] ?? '(none)';
    if (koLink !== enLink) {
      diffs.push({ index: i, koLink, enLink });
    }
  }
  return diffs;
}


// --------------------------------------------------
///@param[in]   bookId    e.g. 'doc-endless'
///@param[in]   koBranch  e.g. 'ko-tp630'
///@return      { ok, count, diffs, error }
///@brief       ko/en 한 쌍의 SUMMARY.md를 fetch하여 .md link 비교
// --------------------------------------------------
async function compareOnePair(bookId, koBranch, enBranch)
{
  const koText = await fetchSummaryText(bookId, koBranch);
  if (koText === null) return { ok: false, error: `${koBranch}/SUMMARY.md fetch 실패` };

  const enText = await fetchSummaryText(bookId, enBranch);
  if (enText === null) return { ok: false, error: `${enBranch}/SUMMARY.md fetch 실패` };

  const koHrefs = extractMdHrefsFromSummary(koText);
  const enHrefs = extractMdHrefsFromSummary(enText);

  const diffs = findAllDiffs(koHrefs, enHrefs);
  return { ok: diffs.length === 0, count: koHrefs.length, diffs, error: null };
}


// --------------------------------------------------
///@param[in]   context     review context
///@param[in]   bookId      e.g. 'doc-endless'
///@param[in]   versions    ver_id 목록 (string[])
///@brief       ko로 시작하는 브랜치들에 대해 en 브랜치와 SUMMARY.md link 전체 비교, 결과를 log 출력
// --------------------------------------------------
async function applyRule_CompareSummary(context, bookId, versions)
{
  const koBranches = getKoBranchNames(versions);

  log_util.log(`\n[compare-summary] ${koBranches.length} branch pair(s) to check.`);

  for (const koBranch of koBranches) {
    const enBranch = getEnBranchName(koBranch);
    const result = await compareOnePair(bookId, koBranch, enBranch);

    const compareLabel = `${koBranch}:${enBranch}`;
    if (result.error) {
      log_util.log(chalk.yellow(`  [${compareLabel}] error: ${result.error}`));
      context.nNgItem++;
      continue;
    }

    if (result.ok) {
      log_util.log(chalk.green(`  [${compareLabel}] ✓ OK`) + ` (${result.count} links matched)`);
    } else {
      log_util.log(chalk.yellow(`  [${compareLabel}] ✗ DIFF (${result.diffs.length} item(s)):`));
      for (const { index, koLink, enLink } of result.diffs) {
        log_util.log(chalk.yellow(`    [${index}] ko : ${koLink}`));
        log_util.log(chalk.yellow(`         en : ${enLink}`));
      }
      context.nNgItem += result.diffs.length;
    }
  }
}


// --------------------------------------------------
///@param[in]   versions    ver_id 목록 (string[])
///@return      'ko'로 시작하는 branch명 배열
// --------------------------------------------------
function getKoBranchNames(versions)
{
  return versions.filter(v => v.startsWith('ko'));
}


module.exports = { applyRule_CompareSummary };
