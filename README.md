# hrbook-publisher

hrbook 기술 문서를 PDF 출력용 단일 HTML로 변환하는 도구입니다.

GitBook 스타일의 디렉토리 구조(`SUMMARY.md` + 개별 `.md` 파일)를 입력받아
정규화 → HTML 변환 → 통합 HTML 생성 단계를 거쳐 `book.html`을 생성합니다.
생성된 `book.html`은 브라우저에서 [Paged.js](https://pagedjs.org/)를 통해 PDF로 인쇄할 수 있습니다.

---

## 목차

- [설치](#설치)
- [실행](#실행)
- [Web UI](#web-ui)
- [문서 디렉토리 구조](#문서-디렉토리-구조)
- [bookinfo.json 설정](#bookinfojson-설정)
- [SUMMARY.md 작성](#summarymd-작성)
- [마크다운 특수 문법](#마크다운-특수-문법)
- [CLI 사용법](#cli-사용법)
- [HTTP API](#http-api)
- [변환 워크플로우](#변환-워크플로우)
- [오류 코드](#오류-코드)

---

## 설치

```bash
npm install
npm install --prefix frontend
```

---

## 실행

### 개발 모드 (Express + Vite 동시 기동)

```bash
npm start
```

- Express 서버: `http://127.0.0.1:50000`
- Vite 개발 서버: `http://localhost:5173` (기본값)

### 서버만 기동

```bash
node server.js
# Server Running at http://127.0.0.1:50000
```

### 프론트엔드 빌드

```bash
npm run build
```

---

## Web UI

브라우저에서 `http://localhost:5173` (개발) 또는 `http://127.0.0.1:50000` (빌드 후)에 접속합니다.

### review 탭

마크다운 문서의 링크 깨짐, 특수 문자, 금지 문자열 등을 검사합니다.

| 소스 타입 | 설명 |
|-----------|------|
| `local` | 로컬 경로의 `.md` 디렉토리를 직접 검사 |
| `remote` | Book ID / Book Ver 으로 원격 저장소 문서를 클론하여 검사 |

### publish 탭

로컬 문서를 `book.html`로 변환합니다. bind-book 완료 후 `print-book` 버튼으로 브라우저 인쇄 화면을 열 수 있습니다.

---

## 문서 디렉토리 구조

```
<path_md>/
├── bookinfo.json        # 책 메타데이터 (필수)
├── SUMMARY.md           # 목차 (필수)
├── chapter1/
│   ├── intro.md
│   └── detail.md
├── chapter2/
│   └── content.md
└── _assets/             # 이미지 등 정적 자산
    ├── image1.png
    └── image2.jpg
```

---

## bookinfo.json 설정

```json
{
  "title": "문서 제목",
  "series": "제품 시리즈명",
  "publisher": "발행사",
  "docId": "DOC-001",
  "langCode": "ko",
  "tocTitle": "목차",
  "tocTitleElements": ["h1", "h2"],
  "references": [
    {
      "title": "참고 문서 제목",
      "id": "REF-001",
      "series": "시리즈명"
    }
  ],
  "variables": {
    "product_name": "MyProduct",
    "company_name": "My Company",
    "version": "2.0"
  }
}
```

| 필드 | 타입 | 설명 |
|------|------|------|
| `title` | string | 문서 제목 |
| `series` | string | 제품/시리즈 이름 |
| `publisher` | string | 발행사 이름 |
| `docId` | string | 문서 식별자 |
| `langCode` | string | 언어 코드 (`ko`, `en`, `zh` 등) |
| `tocTitle` | string | 목차 섹션 제목 |
| `tocTitleElements` | array | 목차에 포함할 헤딩 레벨 (기본값: `["h1", "h2"]`) |
| `references` | array | 참고문헌 목록 |
| `variables` | object | 마크다운 내 `${변수명}` 치환에 사용할 값 |

---

## SUMMARY.md 작성

GitBook 형식의 목차 파일입니다. 링크된 `.md` 파일들이 순서대로 변환됩니다.

```markdown
# Summary

* [소개](README.md)
* [1장. 개요](chapter1/intro.md)
  * [상세 설명](chapter1/detail.md)
* [2장. 내용](chapter2/content.md)
```

---

## 마크다운 특수 문법

### 힌트 박스

```markdown
{% hint style="info" %}
참고 사항입니다.
{% endhint %}

{% hint style="warning" %}
주의해야 할 내용입니다.
{% endhint %}

{% hint style="danger" %}
위험한 내용입니다.
{% endhint %}
```

### 파일 포함

다른 마크다운 파일의 내용을 현재 문서에 삽입합니다.

```markdown
{% include file="en/precautions.md" %}
```

### URL 포함

외부 URL의 HTML 콘텐츠를 삽입합니다.

```markdown
{% include url="https://example.com/content.html" %}
```

### 변수 치환

`bookinfo.json`의 `variables`에 정의된 값으로 치환됩니다.

```markdown
이 제품은 ${product_name}입니다.
제조사: ${company_name:upper}
버전: ${version:lower}
```

| 문법 | 설명 |
|------|------|
| `${변수명}` | 값 그대로 치환 |
| `${변수명:upper}` | 대문자로 치환 |
| `${변수명:lower}` | 소문자로 치환 |

---

## CLI 사용법

### bind-book

마크다운을 HTML로 변환하고 `book.html`을 생성합니다.

```bash
node cli.js bind-book --path_md="<문서_디렉토리_경로>"
```

성공 시:

```
bind-book ok
```

### 출력 파일

| 파일 | 설명 |
|------|------|
| `public/out/book.html` | PDF 인쇄용 통합 HTML (메인 출력) |
| `public/out-html/` | 개별 마크다운 변환 HTML |
| `<path_md>/book.md` | 통합 마크다운 |

---

## HTTP API

### `GET /app-version`

```bash
curl http://127.0.0.1:50000/app-version
```

```json
{ "version": "2.0.0" }
```

---

### `POST /adjust-md`

마크다운 파일을 정규화합니다 (특수 문자, 인코딩 표준화).

```bash
curl -X POST http://127.0.0.1:50000/adjust-md \
  -d "path_md=/home/user/my-book"
```

---

### `POST /bind-book`

마크다운을 HTML로 변환하고 `book.html`을 생성합니다.

```bash
curl -X POST http://127.0.0.1:50000/bind-book \
  -d "path_md=/home/user/my-book"
```

추가 변수를 전달할 수 있습니다.

```bash
curl -X POST http://127.0.0.1:50000/bind-book \
  -d "path_md=/home/user/my-book" \
  -d "variables[product_name]=NewProduct"
```

---

### `POST /review-local-book`

로컬 문서를 검사합니다.

```bash
curl -X POST http://127.0.0.1:50000/review-local-book \
  -d "path_md=/home/user/my-book"
```

---

### `POST /review-remote-book`

원격 저장소 문서를 클론하여 검사합니다.

```bash
curl -X POST http://127.0.0.1:50000/review-remote-book \
  -d "bookId=doc-endless" \
  -d "verId=ko"
```

---

### 공통 응답 형식

```json
{
  "message": "<엔드포인트명> ok",
  "data": { "code": 0 }
}
```

---

## 변환 워크플로우

```
문서 디렉토리 (*.md + bookinfo.json + SUMMARY.md)
        │
        ▼
[1] adjust-md  (선택)
    - 특수 문자 정규화 (비표준 대시, 따옴표 등 → 표준 문자)
        │
        ▼
[2] bind-book
    - {% include %} 처리
    - {% hint %} 스타일 처리
    - ${변수명} 치환
    - 마크다운 → HTML 변환 (markdown-it)
    - SUMMARY.md 기반 전체 병합
    - 표지·목차·참고문헌 등 구성요소 조합
    - _assets/ 이미지 복사
        │
        ▼
public/out/book.html
        │
        ▼
[3] 브라우저에서 열기 → Paged.js로 PDF 인쇄
```

---

## 오류 코드

| 코드 | 설명 |
|------|------|
| `0` | 성공 |
| `-1` | `SUMMARY.md` 파일을 찾을 수 없음 |
| `-2` | `bookinfo.json` 파일을 찾을 수 없음 |

---

## 라이선스

Commercial — 별도 문의 바랍니다.
