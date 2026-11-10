# 넥스트웨이브 (NextWave) 기업 랜딩 페이지

넥스트웨이브 기업 랜딩 페이지는 외부 라이브러리 없이 순수 HTML, CSS, 자바스크립트로 구축한 반응형 정적 웹사이트입니다. 현재 Cloudflare Pages 글로벌 네트워크를 통해 정식 서비스 중입니다.

👉 **서비스 바로가기**: [https://company-landing-page-7hh.pages.dev](https://company-landing-page-7hh.pages.dev)  
👉 **GitHub 저장소**: [https://github.com/startupcodekr/company-landing-page](https://github.com/startupcodekr/company-landing-page)

---

## 핵심 기능

사용자 경험과 접근성을 최우선으로 고려해 설계했습니다.

- **자동 및 수동 다크 모드**: 방문자의 OS 테마를 먼저 반영하며, 우측 상단 토글로 언제든 변경할 수 있습니다. 설정값은 브라우저에 안전하게 보관됩니다.
- **반응형 화면 대응**: 모바일, 태블릿, 데스크톱 환경에 맞춰 유연하게 레이아웃이 전환됩니다. 모바일 기기에서는 전용 메뉴 서랍을 지원합니다.
- **실시간 데이터 애니메이션**: 브라우저 화면에 실적 섹션이 들어오는 순간, 신뢰도를 높여주는 성과 지표 숫자가 부드럽게 올라갑니다.
- **고객사 추천사 캐러셀**: 6초마다 자동으로 넘어가는 슬라이더를 통해 주요 파트너사의 평가를 한눈에 볼 수 있습니다.
- **문의 폼 실시간 검증**: 회사명, 이메일, 상담 내용을 올바르게 적었는지 즉시 확인하고, 접수 시 피드백 알림창을 띄웁니다.

---

## 기술 스택

프레임워크나 외부 런타임 종속성을 배제하고 웹 표준 기술만 활용했습니다.

- **HTML5**: 웹 표준과 검색 최적화(SEO)를 고려한 시맨틱 태그 구조
- **CSS3**: CSS 변수(Custom Properties), Flexbox, CSS Grid, 글래스모피즘 효과
- **JavaScript (ES6+)**: 바닐라 자바스크립트 (`IntersectionObserver`, DOM 이벤트 제어)
- **인프라 & 배포**: GitHub, Cloudflare Pages, Cloudflare Wrangler CLI

---

## 개발 및 배포 과정

기획부터 글로벌 배포까지 총 3단계로 완성했습니다.

### 1. 화면 설계 및 프런트엔드 구현
단일 페이지 웹 애플리케이션 형태로 화면 구조를 나누었습니다. 헤더, 히어로, 회사 소개, 핵심 솔루션, 실적 통계, 고객 추천사, 도입 문의 폼, 푸터로 이어지는 흐름을 잡고, CSS 변수를 활용해 라이트 모드와 다크 모드를 매끄럽게 교체할 수 있도록 스타일을 분리했습니다. 자바스크립트는 외부 라이브러리 없이 브라우저 내장 API만 활용해 페이지 로딩 속도를 극대화했습니다.

### 2. Git 형상 관리 및 GitHub 원격 저장소 연결
버전 관리의 일관성을 위해 불필요한 운영체제 파일(`.DS_Store`)을 거르는 `.gitignore`를 설정하고, `main` 브랜치를 기준으로 초기 커밋을 구성했습니다. GitHub CLI를 활용해 원격 공개 저장소를 생성한 뒤 소스 코드를 동기화했습니다.

### 3. Wrangler CLI를 통한 Cloudflare Pages 글로벌 배포
안정적인 접속 환경을 마련하고자 Cloudflare 글로벌 엣지 네트워크를 배포 환경으로 선정했습니다. Wrangler CLI로 배포 파이프라인을 구성해 빌드 과정 없이 정적 에셋을 엣지 서버로 직접 업로드했습니다. 현재 전 세계 어디서나 빠른 응답 속도(HTTP/2 200)로 페이지가 열립니다.

---

## 로컬 실행 및 직접 배포하기

### 로컬 환경에서 실행하기
별도 패키지 설치 과정이 필요 없습니다. 브라우저에서 `index.html` 파일을 바로 열거나, 파이썬 기본 서버로 확인할 수 있습니다.

```bash
# 저장소 내려받기
git clone https://github.com/startupcodekr/company-landing-page.git
cd company-landing-page

# 로컬 웹 서버 실행
python3 -m http.server 8080
```

### Cloudflare Pages로 다시 배포하기
정적 자산을 수정한 뒤 프로젝트 디렉터리에서 Wrangler 명령어를 실행하면 몇 초 안에 전 세계 서버로 배포됩니다.

```bash
wrangler pages deploy . --project-name company-landing-page --branch main
```
