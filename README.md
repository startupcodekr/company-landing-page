# 넥스트웨이브 (NextWave) 기업 홈페이지 및 고객 문의 시스템

넥스트웨이브 공식 웹사이트는 외부 라이브러리 없이 순수 HTML, CSS, 자바스크립트로 구축한 반응형 정적 웹서비스입니다. 2026년 기업 소개 랜딩 페이지와 더불어 비회원 문의 게시판 및 Cloudflare D1 기반의 데이터베이스 스키마와 관리자 전용 댓글 답변 시스템을 기본 탑재하고 있습니다.

👉 **서비스 바로가기**: [https://company-landing-page-7hh.pages.dev](https://company-landing-page-7hh.pages.dev)  
👉 **고객 문의 게시판**: [https://company-landing-page-7hh.pages.dev/board](https://company-landing-page-7hh.pages.dev/board)  
👉 **관리자 로그인 콘솔**: [https://company-landing-page-7hh.pages.dev/admin](https://company-landing-page-7hh.pages.dev/admin) (테스트 계정: `admin` / `admin1234`)  
👉 **GitHub 저장소**: [https://github.com/startupcodekr/company-landing-page](https://github.com/startupcodekr/company-landing-page)

---

## 핵심 기능

방문자와 관리자 모두 별도 회원가입 없이 편리하게 소통할 수 있도록 설계했습니다.

- **비회원 문의 등록 및 조회**: 회원가입 절차 없이 제목, 내용, 작성자명, 비밀번호만으로 간편하게 문의글을 남길 수 있습니다.
- **비밀글 보호 기능**: 민감한 기술 제휴나 견적 문의는 비밀글 체크 시 작성자가 지정한 비밀번호 또는 관리자 인증을 거쳐야만 열람할 수 있습니다.
- **안전한 비밀번호 해싱 저장**: 비회원 글 비밀번호 및 관리자 비밀번호는 평문이 아닌 솔트(Salt)와 결합된 SHA-256 해시값으로 데이터베이스에 안전하게 보관됩니다.
- **관리자 전용 로그인 및 답변(댓글)**: 관리자 계정(`admin`/`admin1234`)으로 접속하면 모든 문의에 공식 답변 댓글을 작성하거나 수정·삭제할 수 있습니다.
- **Cloudflare D1 로컬 데이터베이스 완벽 연동**: Wrangler를 통해 로컬 환경에서 분산 서버리스 SQL 데이터베이스를 생성하고 마이그레이션할 수 있습니다.
- **답변 상태 자동 전환**: 관리자가 답변을 등록하면 문의글 상태가 '답변 대기'에서 '답변 완료'로 실시간 갱신됩니다.

---

## 데이터베이스 스키마 (Cloudflare D1)

`migrations/0001_init.sql` 파일에 정의된 테이블 구조입니다.

### 1. `admins` (관리자 계정 테이블)
| 컬럼명 | 데이터 타입 | 설명 |
| :--- | :--- | :--- |
| `id` | INTEGER | 기본키 (자동 증가) |
| `username` | TEXT | 관리자 로그인 아이디 (UNIQUE) |
| `password_hash`| TEXT | SHA-256 해시 암호문 |
| `salt` | TEXT | 해시 암호화용 16바이트 솔트 |
| `name` | TEXT | 관리자 이름/담당 부서 |
| `role` | TEXT | 권한 등급 (`superadmin`, `admin`) |
| `created_at` | DATETIME | 계정 생성 일시 |

### 2. `posts` (비회원 문의 게시글 테이블)
| 컬럼명 | 데이터 타입 | 설명 |
| :--- | :--- | :--- |
| `id` | INTEGER | 기본키 (자동 증가) |
| `title` | TEXT | 문의 제목 |
| `content` | TEXT | 문의 상세 본문 |
| `author` | TEXT | 비회원 작성자명 |
| `password_hash`| TEXT | 글 삭제/비밀글 열람용 SHA-256 해시 |
| `salt` | TEXT | 비밀번호 해시용 솔트 |
| `category` | TEXT | 문의 유형 (기술 솔루션, AI 에이전트, 제휴 등) |
| `email` | TEXT | 회신용 이메일 주소 (선택) |
| `is_secret` | INTEGER | 비밀글 여부 (0: 공개, 1: 비밀글) |
| `views` | INTEGER | 조회수 |
| `created_at` | DATETIME | 작성 일시 |
| `updated_at` | DATETIME | 수정 일시 |

### 3. `replies` (관리자 공식 답변 댓글 테이블)
| 컬럼명 | 데이터 타입 | 설명 |
| :--- | :--- | :--- |
| `id` | INTEGER | 기본키 (자동 증가) |
| `post_id` | INTEGER | 외래키 (`posts.id` 참조, ON DELETE CASCADE) |
| `admin_id` | INTEGER | 외래키 (`admins.id` 참조) |
| `author` | TEXT | 답변 담당자 표기 |
| `content` | TEXT | 공식 답변 내용 |
| `created_at` | DATETIME | 답변 작성 일시 |

---

## 로컬 D1 데이터베이스 실행 가이드

Wrangler CLI를 활용해 로컬 D1 데이터베이스를 즉시 생성하고 조회할 수 있습니다.

### 1. 로컬 D1 마이그레이션 실행
```bash
wrangler d1 execute DB --local --file=migrations/0001_init.sql
```

### 2. 관리자 계정 및 해시 데이터 확인
```bash
wrangler d1 execute DB --local --command="SELECT id, username, name, salt, password_hash FROM admins;"
```

### 3. 문의글 및 답변 조인 쿼리 확인
```bash
wrangler d1 execute DB --local --command="SELECT p.id, p.title, p.author, p.is_secret, count(r.id) as reply_count FROM posts p LEFT JOIN replies r ON p.id = r.post_id GROUP BY p.id;"
```

---

## 로컬 웹 서버 실행 및 Cloudflare Pages 배포

### 로컬 웹 서버 실행하기
```bash
# 로컬 웹 서버 구동
python3 -m http.server 8080
```

### Cloudflare Pages 배포하기
```bash
wrangler pages deploy . --project-name company-landing-page --branch main
```
