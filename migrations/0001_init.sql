-- ============================================================================
-- Migration: 0001_init.sql
-- Description: Create admins, posts, and replies tables for inquiry board with password hashing
-- ============================================================================

-- 1. 관리자 계정 테이블 (admins)
CREATE TABLE IF NOT EXISTS admins (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    salt TEXT NOT NULL,
    name TEXT NOT NULL DEFAULT '최고관리자',
    role TEXT NOT NULL DEFAULT 'superadmin',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 2. 비회원 문의 게시글 테이블 (posts)
CREATE TABLE IF NOT EXISTS posts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    author TEXT NOT NULL,
    password_hash TEXT NOT NULL,
    salt TEXT NOT NULL,
    category TEXT NOT NULL DEFAULT '기술 솔루션',
    email TEXT,
    is_secret INTEGER NOT NULL DEFAULT 0, -- 0: 공개, 1: 비밀글
    views INTEGER NOT NULL DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 3. 관리자 공식 답변(댓글) 테이블 (replies)
CREATE TABLE IF NOT EXISTS replies (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    post_id INTEGER NOT NULL,
    admin_id INTEGER,
    author TEXT NOT NULL,
    content TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
    FOREIGN KEY (admin_id) REFERENCES admins(id) ON DELETE SET NULL
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_category ON posts(category);
CREATE INDEX IF NOT EXISTS idx_replies_post_id ON replies(post_id);

-- ============================================================================
-- 초기 시드 데이터 삽입 (비밀번호는 SHA-256 + Salt 해시 적용)
-- ============================================================================

-- 관리자 계정: admin / admin1234
-- Salt: 414000827dcc98da855808e91b86df46
-- Hash: 0820f7a8eb582bb7a5365cf2be06414a275758bb6a506402223cf14f63b725a9
INSERT OR IGNORE INTO admins (id, username, password_hash, salt, name, role)
VALUES (
    1,
    'admin',
    '0820f7a8eb582bb7a5365cf2be06414a275758bb6a506402223cf14f63b725a9',
    '414000827dcc98da855808e91b86df46',
    '넥스트웨이브 공식 관리자',
    'superadmin'
);

-- 샘플 문의 1 (비밀번호: guest1234)
INSERT OR IGNORE INTO posts (id, title, content, author, password_hash, salt, category, email, is_secret, views, created_at)
VALUES (
    1,
    '온프레미스 사내 오라클 DB의 멀티클라우드 마이그레이션 기술 문의',
    '안녕하세요. 제조 기업 IT 인프라팀입니다. 기존 오라클 19c RAC 환경에서 AWS RDS 및 Aurora PostgreSQL로 다운타임을 최소화하면서 전환하는 컨설팅과 기술 지원이 가능한지 문의드립니다. 예상 데이터 볼륨은 약 18TB입니다.',
    '최현우 팀장',
    '238216641c4d3294f7a8d68620ce94bcfdb939ef0a03bdd4806e559db49230b0',
    '1685e90ab07b384b935868722e413918',
    '기술 솔루션',
    'hw.choi@partner-sample.co.kr',
    0,
    42,
    '2026-11-08 11:20:00'
);

-- 샘플 문의 2 (비밀번호: guest1234)
INSERT OR IGNORE INTO posts (id, title, content, author, password_hash, salt, category, email, is_secret, views, created_at)
VALUES (
    2,
    '사내 보안 규정 준수 온프레미스 LLM 검색 증강(RAG) 구축 견적 요청',
    '금융 보안 법령상 사내 내부망 외부로 데이터 반출이 일체 불가능합니다. 자사 서버실에 고성능 GPU 서버를 배치하고 폐쇄망 환경에서 동작하는 사내 규정 Q&A 에이전트 구축이 가능한지 검토 부탁드립니다.',
    '박지훈 수석',
    '238216641c4d3294f7a8d68620ce94bcfdb939ef0a03bdd4806e559db49230b0',
    '1685e90ab07b384b935868722e413918',
    'AI 에이전트',
    'jhpark@finance-sample.com',
    0,
    29,
    '2026-11-09 16:40:00'
);

-- 샘플 문의 3 (비밀글, 비밀번호: secret1234)
-- Salt: c37b554905d1d6da1577130873a2d0a3
-- Hash: 69c0a5567fa6ea3a07b9cffdc7aa74c7e2e3f416593b9436248a5c8bf4c5cec0
INSERT OR IGNORE INTO posts (id, title, content, author, password_hash, salt, category, email, is_secret, views, created_at)
VALUES (
    3,
    '신규 엔터프라이즈 솔루션 도입 예산안 및 파트너십 제휴 제안서 (비공개)',
    '동남아시아 3개국 지사 통합 ERP 및 데이터 플랫폼 구축 건에 대해 넥스트웨이브와의 전략적 컨소시엄 구성을 제안드리고자 합니다.',
    '정다은 본부장',
    '69c0a5567fa6ea3a07b9cffdc7aa74c7e2e3f416593b9436248a5c8bf4c5cec0',
    'c37b554905d1d6da1577130873a2d0a3',
    '견적 및 제휴',
    'de.jung@global-corp.sample',
    1,
    7,
    '2026-11-10 13:30:00'
);

-- 샘플 1번에 대한 관리자 공식 답변
INSERT OR IGNORE INTO replies (id, post_id, admin_id, author, content, created_at)
VALUES (
    1,
    1,
    1,
    '넥스트웨이브 솔루션즈 (아키텍처팀)',
    '안녕하세요, 최현우 팀장님. 넥스트웨이브 클라우드 아키텍처팀입니다. 문의주신 18TB급 대용량 오라클 환경의 마이그레이션은 AWS DMS와 CDC 파이프라인을 연계하여 다운타임을 1시간 이내로 단축하는 컷오버 프레임워크를 보유하고 있습니다. 남겨주신 이메일로 PoC 사례집과 단계별 추진 로드맵 백서를 전달해 드렸습니다.',
    '2026-11-08 14:15:00'
);
