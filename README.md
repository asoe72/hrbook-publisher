# hrbook2pdf

hrbook 기술 문서를 PDF 출력용 단일 HTML로 변환하는 도구입니다.

GitBook 스타일의 디렉토리 구조(`SUMMARY.md` + 개별 `.md` 파일)를 입력받아,
정규화 → HTML 변환 → 통합 HTML 생성의 단계를 거쳐 `book.html`을 생성합니다.
생성된 `book.html`은 [Paged.js](https://pagedjs.org/) 등을 통해 PDF로 인쇄할 수 있습니다.

---

## 목차

- [설치](#설치)
- [문서 디렉토리 구조](#문서-디렉토리-구조)
- [bookinfo.json 설정](#bookinfojson-설정)
- [SUMMARY.md 작성](#summarymd-작성)
- [마크다운 특수 문법](#마크다운-특수-문법)
- [CLI 사용법](#cli-사용법)
- [HTTP API 사용법](#http-api-사용법)
- [변환 워크플로우](#변환-워크플로우)
- [오류 코드](#오류-코드)

---

## 문서 디렉토리 구조

변환할 문서 디렉토리는 다음 구조를 따라야 합니다.

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

책의 메타데이터와 변수를 정의합니다.

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

### 주요 필드

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

### 힌트 박스 (Hint Box)

경고, 위험, 정보 박스를 삽입합니다.

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

### 파일 포함 (Include)

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

| 옵션 | 설명 |
|------|------|
| `${변수명}` | 값 그대로 치환 |
| `${변수명:upper}` | 대문자로 치환 |
| `${변수명:lower}` | 소문자로 치환 |

---

## CLI 사용법

전역 설치 후 `hrbook2pdf` 명령어를 사용합니다.

```bash
npm install -g hrbook2pdf
```

### 1단계: 문서 정규화

마크다운 파일의 인코딩(UTF-8 BOM) 및 특수 문자를 표준화합니다.

```bash
hrbook2pdf normalize-book --path_md="<문서_디렉토리_경로>"
```

### 2단계: 북 바인딩 (HTML 생성)

마크다운을 HTML로 변환하고 `book.html`로 통합합니다.

```bash
hrbook2pdf bind-book --path_md="<문서_디렉토리_경로>"
```

### 사용 예시

```bash
hrbook2pdf normalize-book --path_md="/home/user/my-book"
hrbook2pdf bind-book --path_md="/home/user/my-book"
```

성공 시 다음 메시지가 출력됩니다.

```
normalize-book ok
bind-book ok
```

### 출력 파일

`bind-book` 실행 후 다음 파일이 생성됩니다.

| 파일 | 설명 |
|------|------|
| `public/out/book.html` | PDF 인쇄용 통합 HTML (메인 출력) |
| `public/out/<경로>/*.html` | 개별 마크다운 변환 HTML |
| `<path_md>/book.md` | 통합 마크다운 (검색 인덱스용) |

---

## HTTP API 사용법

웹 서버 모드로 실행하여 REST API로 사용할 수 있습니다.

### 서버 시작

```bash
node node_modules/hrbook2pdf/server.js
# Server Running at http://127.0.0.1:50000
```

### API 엔드포인트

#### `GET /app-version`

앱 버전을 반환합니다.

```bash
curl http://127.0.0.1:50000/app-version
```

```json
{ "version": "1.17.5" }
```

---

#### `POST /normalize-book`

마크다운 파일을 정규화합니다.

```bash
curl -X POST http://127.0.0.1:50000/normalize-book \
  -d "path_md=/home/user/my-book"
```

```json
{
  "message": "normalize-book ok",
  "data": { "code": 0 }
}
```

---

#### `POST /bind-book`

마크다운을 HTML로 변환하고 `book.html`을 생성합니다.

```bash
curl -X POST http://127.0.0.1:50000/bind-book \
  -d "path_md=/home/user/my-book"
```

추가 변수를 전달할 수도 있습니다.

```bash
curl -X POST http://127.0.0.1:50000/bind-book \
  -d "path_md=/home/user/my-book" \
  -d "variables[product_name]=NewProduct"
```

```json
{
  "message": "bind-book ok",
  "data": { "code": 0 }
}
```

---

## 변환 워크플로우

```
문서 디렉토리 (*.md + bookinfo.json + SUMMARY.md)
        │
        ▼
[1] normalize-book
    - UTF-8 BOM 추가
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
