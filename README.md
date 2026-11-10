# 넥스트웨이브 (NextWave) 기업 홈페이지 및 고객 문의 시스템

넥스트웨이브 공식 웹사이트는 외부 라이브러리 없이 순수 HTML, CSS, 자바스크립트로 구축한 반응형 정적 웹서비스입니다. 2026년 기업 소개 랜딩 페이지와 더불어 비회원 문의 게시판 및 관리자 전용 댓글 답변 시스템을 기본 탑재하고 있습니다.

👉 **서비스 바로가기**: [https://company-landing-page-7hh.pages.dev](https://company-landing-page-7hh.pages.dev)  
👉 **고객 문의 게시판**: [https://company-landing-page-7hh.pages.dev/board.html](https://company-landing-page-7hh.pages.dev/board.html)  
👉 **관리자 로그인 콘솔**: [https://company-landing-page-7hh.pages.dev/admin.html](https://company-landing-page-7hh.pages.dev/admin.html) (테스트 계정: `admin` / `admin1234`)  
👉 **GitHub 저장소**: [https://github.com/startupcodekr/company-landing-page](https://github.com/startupcodekr/company-landing-page)

---

## 핵심 기능

방문자와 관리자 모두 별도 회원가입 없이 편리하게 소통할 수 있도록 설계했습니다.

- **비회원 문의 등록 및 조회**: 회원가입 절차 없이 제목, 내용, 작성자명, 비밀번호만으로 간편하게 문의글을 남길 수 있습니다.
- **비밀글 보호 기능**: 민감한 기술 제휴나 견적 문의는 비밀글 체크 시 작성자가 지정한 비밀번호 또는 관리자 인증을 거쳐야만 열람할 수 있습니다.
- **관리자 전용 로그인 및 답변(댓글)**: 관리자 계정(`admin`/`admin1234`)으로 접속하면 모든 문의에 공식 답변 댓글을 작성하거나 수정·삭제할 수 있습니다.
- **답변 상태 자동 전환**: 관리자가 답변을 등록하면 문의글 상태가 '답변 대기'에서 '답변 완료'로 실시간 갱신됩니다.
- **영속적 브라우저 데이터 관리**: `LocalStorage`와 `SessionStorage`를 연동해 새로고침을 하거나 페이지를 다시 열어도 등록된 문의와 답변이 안전하게 유지됩니다.
- **자동/수동 다크 모드**: 방문자의 운영체제 환경설정에 맞춰 다크 모드와 라이트 모드를 지원합니다.

---

## 페이지 구조

| 페이지 | 경로 | 주요 역할 |
| :--- | :--- | :--- |
| **기업 랜딩 페이지** | `index.html` | 서비스 소개, 핵심 기술 역량, 고객사 후기 슬라이더, 빠른 상담 신청 폼 |
| **비회원 문의 게시판** | `board.html` | 1:1 고객 문의 목록, 필터/검색, 새 글 작성, 비밀글 열람 인증, 관리자 답변 확인 |
| **관리자 콘솔** | `admin.html` | 관리자 로그인, 누적 문의 및 답변 현황 대시보드, 미답변 문의 일괄 관리 |

---

## 기술 스택

외부 프레임워크나 복잡한 백엔드 설정 없이 웹 표준 기술만으로 구현했습니다.

- **프런트엔드**: HTML5 Semantic Markup, Modern CSS3 (Custom Variables, CSS Grid, Flexbox), Vanilla JavaScript (ES6+)
- **데이터 관리**: 브라우저 `LocalStorage` (문의글 및 관리자 댓글 영속 저장), `SessionStorage` (관리자 로그인 세션)
- **인프라 & 호스팅**: GitHub 저장소, Cloudflare Pages, Cloudflare Wrangler CLI

---

## 로컬 실행 및 직접 배포하기

### 로컬 환경에서 실행하기
패키지 설치 없이 파이썬 기본 내장 웹 서버로 즉시 구동할 수 있습니다.

```bash
# 저장소 복제 및 이동
git clone https://github.com/startupcodekr/company-landing-page.git
cd company-landing-page

# 로컬 웹 서버 구동
python3 -m http.server 8080
```
브라우저에서 `http://localhost:8080`에 접속하면 메인 페이지와 문의 게시판을 바로 이용할 수 있습니다.

### Cloudflare Pages 배포 명령어
Wrangler CLI를 활용해 변경 사항을 몇 초 안에 글로벌 엣지 네트워크로 배포합니다.

```bash
wrangler pages deploy . --project-name company-landing-page --branch main
```
