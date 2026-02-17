# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 프로젝트 개요

`hrbook2pdf.js`는 Markdown 기반 기술 문서(hrbook 포맷)를 PDF 출력용 HTML로 변환하는 로컬 웹 앱이다. Node.js + Express 서버가 변환 파이프라인을 처리하고, 브라우저(paged.js)에서 PDF 인쇄를 수행한다.

## 실행 방법

```bat
install.bat   # npm install (최초 1회)
run.bat       # chrome 열기 + node server.js 실행 (포트 50000)
```

직접 실행:
```bash
node server.js   # http://127.0.0.1:50000
```

## 입력 문서 구조 (hrbook 포맷)

입력 디렉토리에는 다음 파일이 반드시 있어야 한다:

- `SUMMARY.md` — 목차(TOC). Markdown 링크 목록으로 챕터별 `.md` 파일 경로를 지정
- `bookinfo.json` — 책 메타데이터 (title, langCode, series, variables, references, tocTitle, tocTitleElements 등)
- `_assets/` — 이미지 등 정적 파일 디렉토리 (변환 시 `public/out/_assets/`로 복사됨)

`bookinfo.json`의 `variables` 필드에 `${변수명}` 또는 `${변수명:upper}` 형식의 변수를 정의하면, 문서 본문 전체에 치환된다.

## 변환 파이프라인 (bind-book)

`server.js` → `bindBook()` 함수가 다음 순서로 실행:

1. `md2html.convDir()` — `.md` 파일 전체를 재귀적으로 HTML fragment로 변환
   - `markdown-it` + `markdown-it-implicit-figures` 사용
   - `{% hint style="warning/danger/info" %}...{% endhint %}` → 커스텀 hint-box HTML로 변환
   - `{% include url="..." %}` → 외부 URL 내용 삽입 (fetch)
   - 결과는 `public/out/` 에 저장
2. `bookbind.bind()` — HTML fragment들을 하나의 `book.html`로 합침
   - `SUMMARY.md` 파싱으로 TOC 순서 결정
   - 각 HTML에 대해 heading 레벨 조정, codebox 스타일 적용, page-break 삽입
   - `variables.js`로 `${변수명}` 치환
   - `git_util`로 첫/현재 커밋 날짜 추출 → 저작권 연도 자동 계산
   - `references.js`로 참조 문서 메타데이터를 외부 프록시(Azure)에서 가져옴
   - EJS 템플릿(`public/view/book_template.ejs`)으로 최종 HTML 생성
   - `helpsect.js`로 각 섹션별 standalone HTML도 생성 (오프라인 help용)
   - 결과: `public/out/book.html`

## normalize 기능

`normalize-book` 버튼 → `normalizeProcAll(path_md)`:

1. `insert_utf8bom.js` — 모든 텍스트 파일에 UTF-8 BOM 삽입
2. `normalize_hrbook_format.js` — 특수문자 검사 및 자동 치환
   - `ALT_SPECIAL_CHAR` 맵: 유사 문자를 ASCII로 치환 (예: `–` → `-`, `…` → `...`)
   - `PERMITTED_CHARS` / `PERMITTED_CHAR_RANGE`: 허용 특수문자 목록 (화살표, 수학기호, 그리스 문자 등)
   - `PROHIBITED_STRS`: 금지 문자열 검출 (예: 이전 모델명, 구 사이트 주소)
   - 처리 대상: `.md`, `.json` 파일 (`.git`, `book.md`, `index.json` 제외)

## 주요 파일 역할

| 파일 | 역할 |
|------|------|
| `server.js` | Express 서버, 3개 API 엔드포인트 정의 |
| `src/md2html.js` | Markdown → HTML fragment 변환 |
| `src/bookbind.js` | HTML fragment들을 book.html로 조합 |
| `src/md_adjuster.js` | HTML entity(`&#xXXXX;`) → 실제 문자로 변환 |
| `src/variables.js` | `${변수명}` 치환 로직 |
| `src/references.js` | 참조 문서 메타데이터 원격 fetch |
| `src/helpsect.js` | 섹션별 standalone HTML 생성 (TP 오프라인 help) |
| `src/include_urls.js` | `{% include url="..." %}` 처리 |
| `src/normalize/` | 문서 정규화 처리 모듈 |
| `src/util/` | 파일·문자열·Git·재귀탐색 유틸리티 |
| `public/view/*.ejs` | 책 앞/뒤 표지, 참조 목록, 본문 템플릿 |
| `public/out/book.html` | 최종 출력 (브라우저에서 인쇄 → PDF) |

## API 엔드포인트

- `POST /normalize-book` — 입력 디렉토리 정규화
- `POST /bind-book` — 전체 변환 파이프라인 실행 (`path_md`, `variables` 파라미터)
- `POST /adjust-md` — HTML entity → 문자 치환 (현재 UI에서 미사용)

## 언어 설정 (langCode)

`bookinfo.json`의 `langCode`에 따라 뒷 표지 템플릿 선택: `book_cover_back_ko.html`, `book_cover_back_en.html`, `book_cover_back_zh.html`
