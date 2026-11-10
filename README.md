# 넥스트웨이브 (NextWave) 기업 서비스 및 고객 문의 시스템

넥스트웨이브 공식 서비스는 외부 의존성을 배제한 순수 웹 표준 기술(HTML5, CSS3, Vanilla JS)과 Cloudflare 서버리스 생태계를 결합하여 구축한 엔터프라이즈 웹 애플리케이션입니다. 기업 홍보용 랜딩 페이지를 시작으로, 비회원 문의 게시판, 관리자 전용 댓글 답변 시스템, 그리고 Cloudflare D1 분산 SQL 데이터베이스와 Worker REST API까지 풀스택 아키텍처를 하나로 아우릅니다.

👉 **서비스 바로가기**: [https://company-landing-page-7hh.pages.dev](https://company-landing-page-7hh.pages.dev)  
👉 **고객 문의 게시판**: [https://company-landing-page-7hh.pages.dev/board](https://company-landing-page-7hh.pages.dev/board)  
👉 **관리자 로그인 콘솔**: [https://company-landing-page-7hh.pages.dev/admin](https://company-landing-page-7hh.pages.dev/admin) *(테스트 계정: `admin` / `admin1234`)*  
⚡ **Cloudflare Worker API**: [https://company-inquiry-api.startupcode2021.workers.dev](https://company-inquiry-api.startupcode2021.workers.dev)  
💻 **GitHub 저장소**: [https://github.com/startupcodekr/company-landing-page](https://github.com/startupcodekr/company-landing-page)

---

## 핵심 기능 요약

방문자의 접근성과 데이터 보안을 최우선 가치로 두고 개발했습니다.

- **비회원 간편 문의 접수**: 번거로운 회원가입 절차 없이 이름, 비밀번호, 제목, 내용만으로 즉시 상담 글을 등록할 수 있습니다.
- **철저한 비밀글 암호화 보호**: 제휴나 견적 등 민감한 문의는 비밀글로 등록할 수 있으며, 작성 시 설정한 비밀번호나 관리자 권한 인증을 거쳐야만 본문이 열립니다.
- **솔트(Salt) 기반 SHA-256 비밀번호 해싱**: 비회원 글 비밀번호와 관리자 패스워드는 평문 상태로 데이터베이스에 남지 않습니다. 16바이트 무작위 솔트와 결합한 SHA-256 해시값만 D1에 보관하여 단방향 암호화를 실현했습니다.
- **관리자 전용 공식 답변(댓글) 시스템**: 관리자로 로그인하면 모든 문의에 대해 공식 피드백 댓글을 남길 수 있으며, 답변 등록 즉시 게시글 상태가 '답변 대기'에서 '답변 완료'로 자동 전환됩니다.
- **Cloudflare 글로벌 엣지 인프라 연동**: 글로벌 분산 SQL 데이터베이스인 Cloudflare D1과 초저지연 Worker API를 연동해 전 세계 어디서나 빠른 응답 속도를 보장합니다.

---

## 시스템 아키텍처 및 화면 구성

화면 계층과 API 계층, 데이터 계층이 명확한 관심사 분리를 이루도록 설계했습니다.

| 구분 | 파일 및 경로 | 주요 역할 |
| :--- | :--- | :--- |
| **기업 랜딩 페이지** | `index.html` | 서비스 소개, 핵심 솔루션 역량, 지표 카운터 애니메이션, 고객사 추천사 슬라이더 |
| **비회원 문의 게시판** | `board.html` | 1:1 고객 문의 목록, 탭 필터링 및 실시간 검색, 모달 기반 새 글 작성 및 비밀글 인증 |
| **관리자 콘솔** | `admin.html` | 관리자 로그인, 접수 현황 통계 카드, 미답변 문의 일괄 관리 및 답변 등록 |
| **Worker REST API** | `src/index.js` | Cloudflare D1 바인딩, 비밀번호 해시 검증, 게시글 및 답변 CRUD 엔드포인트 제공 |
| **보안 유틸리티** | `crypto-utils.js`| 표준 Web Crypto API 기반의 솔트 생성, SHA-256 해싱 및 검증 공용 모듈 |
| **D1 스키마 마이그레이션**| `migrations/0001_init.sql` | `admins`, `posts`, `replies` 테이블 구조 및 초기 시드 데이터 정의 |

---

## 단계별 개발 및 배포 과정

기획부터 클라우드 엣지 인프라 배포까지 총 5단계를 거쳐 완성했습니다.

### 1. 화면 설계 및 반응형 웹 프런트엔드 구축
무거운 자바스크립트 프레임워크나 외부 UI 라이브러리를 일절 사용하지 않고 웹 표준 기술만으로 인터페이스를 구현했습니다. CSS 변수를 활용해 라이트 모드와 다크 모드를 매끄럽게 지원하며, 모바일 화면에서는 전용 서랍 메뉴가 펼쳐지도록 반응형 레이아웃을 다듬었습니다.

### 2. Git 형상 관리 및 GitHub 원격 저장소 동기화
프로젝트 디렉터리에서 Git을 초기화하고 불필요한 빌드 캐시(`.wrangler/`)를 배제하는 `.gitignore`를 수립했습니다. GitHub CLI를 활용해 원격 저장소를 생성한 뒤 메인 브랜치로 소스 코드를 동기화했습니다.

### 3. 비회원 문의 게시판 및 관리자 콘솔 추가 개발
고객과의 실시간 소통 창구를 마련하기 위해 비회원 게시판과 관리자 화면을 증설했습니다. 비회원은 비밀번호를 지정해 본인 글을 관리할 수 있고, 관리자는 전용 계정으로 로그인해 공식 댓글을 남길 수 있도록 모달 기반의 대화형 인터랙션을 완성했습니다.

### 4. Cloudflare D1 스키마 설계 및 솔트 기반 해시 암호화
데이터 영속성과 기밀성을 확보하고자 Cloudflare D1 데이터베이스를 도입했습니다. 관리자 계정(`admins`), 문의글(`posts`), 공식 답변(`replies`) 테이블을 외래키 제약조건과 함께 구성했습니다. 특히 비밀번호는 브라우저와 Workers 모두 지원하는 Web Crypto API를 사용해 고유 솔트와 SHA-256 알고리즘을 거친 해시값으로만 저장하도록 설계했습니다.

### 5. Cloudflare D1 및 Worker API 원격 배포
Wrangler CLI를 활용해 아시아 태평양(APAC) 리전에 실제 원격 D1 데이터베이스(`company_inquiry_db`)를 프로비저닝하고 마이그레이션 SQL을 적용했습니다. 이어 D1과 직접 통신하는 Cloudflare Worker API(`company-inquiry-api`)를 배포하고, 프런트엔드가 원격 API와 실시간으로 데이터를 주고받도록 파이프라인을 연결했습니다.

---

## 데이터베이스 테이블 구조 (Cloudflare D1)

### `admins` (관리자 계정)
- `id` (INTEGER, PK): 관리자 식별 번호
- `username` (TEXT, UNIQUE): 관리자 로그인 아이디
- `password_hash` (TEXT): SHA-256 해시 암호문
- `salt` (TEXT): 비밀번호 해시용 16바이트 솔트
- `name` (TEXT): 관리자 성함 및 소속 부서
- `role` (TEXT): 계정 권한 등급 (`superadmin`, `admin`)
- `created_at` (DATETIME): 등록 일시

### `posts` (비회원 문의 게시글)
- `id` (INTEGER, PK): 게시글 고유 번호
- `title` (TEXT): 문의 제목
- `content` (TEXT): 상세 문의 내용
- `author` (TEXT): 작성자 이름
- `password_hash` (TEXT): 글 삭제 및 비밀글 열람용 해시 암호문
- `salt` (TEXT): 글 비밀번호 솔트
- `category` (TEXT): 문의 유형 (기술 솔루션, AI 에이전트, 제휴 등)
- `email` (TEXT): 답변 회신용 이메일
- `is_secret` (INTEGER): 비밀글 여부 (0: 공개, 1: 비밀글)
- `views` (INTEGER): 누적 조회수
- `created_at` / `updated_at` (DATETIME): 작성 및 수정 일시

### `replies` (관리자 공식 답변)
- `id` (INTEGER, PK): 답변 고유 번호
- `post_id` (INTEGER, FK): 원본 게시글 번호 (`posts.id` 참조, 삭제 시 연쇄 삭제)
- `admin_id` (INTEGER, FK): 답변 작성 관리자 번호
- `author` (TEXT): 공식 답변 담당자 표기
- `content` (TEXT): 답변 본문 내용
- `created_at` (DATETIME): 답변 등록 일시

---

## 로컬 실행 및 클라우드 배포 가이드

### 로컬 개발 환경 실행
Wrangler를 활용해 로컬 D1 데이터베이스와 연동된 개발 서버를 구동합니다.

```bash
# 의존성 확인 및 로컬 개발 서버 실행 (포트 8788)
npm run dev

# 로컬 D1 마이그레이션 재실행 필요 시
npm run db:migrate
```
브라우저에서 `http://localhost:8788`로 접속하면 로컬 D1 인스턴스와 연동된 화면을 즉시 확인할 수 있습니다.

### 원격 Cloudflare 배포
정적 페이지와 백엔드 Worker API는 각각 아래 명령어로 독립 배포할 수 있습니다.

```bash
# 1. 정적 프런트엔드 웹사이트 배포 (Cloudflare Pages)
npm run deploy

# 2. 독립 백엔드 Worker API 재배포 (Cloudflare Workers)
wrangler deploy -c wrangler.worker.toml
```
