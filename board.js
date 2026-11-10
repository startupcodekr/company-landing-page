/**
 * NextWave Solutions - Board & Admin Logic
 * Enhanced with Skeleton UI, Pagination, Debouncing, and Anti-Double-Submit
 */

const WORKER_API_BASE = 'https://company-inquiry-api.startupcode2021.workers.dev';
const STORAGE_KEY_POSTS = 'nw_board_posts';
const STORAGE_KEY_ADMIN = 'nw_admin_session';

const PAGE_SIZE = 5; // 페이지당 표시할 문의글 수 (5개씩 페이징)

// 초기 샘플 문의 데이터 (오프라인/네트워크 폴백용)
const INITIAL_SAMPLE_POSTS = [
  {
    id: 1,
    title: '온프레미스 사내 오라클 DB의 멀티클라우드 마이그레이션 기술 문의',
    content: '안녕하세요. 제조 기업 IT 인프라팀입니다.\n기존 오라클 19c RAC 환경에서 AWS RDS 및 Aurora PostgreSQL로 다운타임을 최소화하면서 전환하는 컨설팅과 기술 지원이 가능한지 문의드립니다.\n예상 데이터 볼륨은 약 18TB입니다.',
    author: '최현우 팀장',
    password: 'guest1234',
    email: 'hw.choi@partner-sample.co.kr',
    category: '기술 솔루션',
    isSecret: false,
    views: 42,
    createdAt: '2026-11-08 11:20',
    replies: [
      {
        id: 101,
        author: '넥스트웨이브 솔루션즈 (아키텍처팀)',
        content: '안녕하세요, 최현우 팀장님. 넥스트웨이브 클라우드 아키텍처팀입니다.\n문의주신 18TB급 대용량 오라클 환경의 마이그레이션은 AWS DMS와 CDC 파이프라인을 연계하여 다운타임을 1시간 이내로 단축하는 컷오버 프레임워크를 보유하고 있습니다.',
        createdAt: '2026-11-08 14:15'
      }
    ]
  },
  {
    id: 2,
    title: '사내 보안 규정 준수 온프레미스 LLM 검색 증강(RAG) 구축 견적 요청',
    content: '금융 보안 법령상 사내 내부망 외부로 데이터 반출이 일체 불가능합니다.\n자사 서버실에 고성능 GPU 서버(H100/A100)를 배치하고 폐쇄망 환경에서 동작하는 사내 규정 Q&A 에이전트 구축이 가능한지 검토 부탁드립니다.',
    author: '박지훈 수석',
    password: 'guest1234',
    email: 'jhpark@finance-sample.com',
    category: 'AI 에이전트',
    isSecret: false,
    views: 29,
    createdAt: '2026-11-09 16:40',
    replies: []
  },
  {
    id: 3,
    title: '신규 엔터프라이즈 솔루션 도입 예산안 및 파트너십 제휴 제안서 (비공개)',
    content: '동남아시아 3개국 지사 통합 ERP 및 데이터 플랫폼 구축 건에 대해 넥스트웨이브와의 전략적 컨소시엄 구성을 제안드리고자 합니다.',
    author: '정다은 본부장',
    password: 'secret1234',
    email: 'de.jung@global-corp.sample',
    category: '견적 및 제휴',
    isSecret: true,
    views: 7,
    createdAt: '2026-11-10 13:30',
    replies: []
  }
];

/* ==========================================================================
   Utilities (Debounce, Escape, Date, Skeleton, Pagination)
   ========================================================================== */
function debounce(fn, delay = 300) {
  let timer = null;
  return function (...args) {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), delay);
  };
}

function escapeHtml(string) {
  if (!string) return '';
  const div = document.createElement('div');
  div.textContent = string;
  return div.innerHTML;
}

function formatDate(date) {
  const d = date || new Date();
  const pad = (n) => String(n).padStart(2, '0');
  const y = d.getFullYear();
  const m = pad(d.getMonth() + 1);
  const day = pad(d.getDate());
  const h = pad(d.getHours());
  const min = pad(d.getMinutes());
  return `${y}-${m}-${day} ${h}:${min}`;
}

// 스켈레톤 테이블 행 렌더링
function renderSkeletonTable(tbody, rowCount = 5) {
  if (!tbody) return;
  tbody.innerHTML = '';
  for (let i = 0; i < rowCount; i++) {
    const tr = document.createElement('tr');
    tr.className = 'skeleton-row';
    tr.innerHTML = `
      <td class="col-num"><span class="skeleton-pulse skeleton-text" style="width: 28px;"></span></td>
      <td class="col-category"><span class="skeleton-pulse skeleton-pill"></span></td>
      <td class="col-status"><span class="skeleton-pulse skeleton-pill" style="width: 58px;"></span></td>
      <td class="col-title"><span class="skeleton-pulse skeleton-text" style="width: ${60 + (i % 3) * 15}%;"></span></td>
      <td class="col-author"><span class="skeleton-pulse skeleton-text" style="width: 60px;"></span></td>
      <td class="col-date"><span class="skeleton-pulse skeleton-text" style="width: 70px;"></span></td>
      <td class="col-views"><span class="skeleton-pulse skeleton-text" style="width: 24px;"></span></td>
    `;
    tbody.appendChild(tr);
  }
}

// 페이지네이션 컨트롤러 렌더링
function renderPaginationUI(container, currentPage, totalPages, onPageClick) {
  if (!container) return;
  container.innerHTML = '';

  if (totalPages <= 1) {
    return; // 1페이지 이하면 페이지네이션 표시 안 함
  }

  // 이전 버튼
  const prevBtn = document.createElement('button');
  prevBtn.className = 'page-btn';
  prevBtn.innerHTML = '‹ 이전';
  prevBtn.disabled = currentPage <= 1;
  prevBtn.onclick = () => onPageClick(currentPage - 1);
  container.appendChild(prevBtn);

  // 번호 버튼들
  const maxButtons = 5;
  let startPage = Math.max(1, currentPage - Math.floor(maxButtons / 2));
  let endPage = Math.min(totalPages, startPage + maxButtons - 1);

  if (endPage - startPage + 1 < maxButtons) {
    startPage = Math.max(1, endPage - maxButtons + 1);
  }

  for (let p = startPage; p <= endPage; p++) {
    const numBtn = document.createElement('button');
    numBtn.className = `page-btn ${p === currentPage ? 'active' : ''}`;
    numBtn.textContent = p;
    numBtn.onclick = () => onPageClick(p);
    container.appendChild(numBtn);
  }

  // 다음 버튼
  const nextBtn = document.createElement('button');
  nextBtn.className = 'page-btn';
  nextBtn.innerHTML = '다음 ›';
  nextBtn.disabled = currentPage >= totalPages;
  nextBtn.onclick = () => onPageClick(currentPage + 1);
  container.appendChild(nextBtn);

  // 총 페이지 안내 텍스트
  const info = document.createElement('span');
  info.className = 'pagination-info';
  info.textContent = `${currentPage} / ${totalPages} 페이지`;
  container.appendChild(info);
}

/* ==========================================================================
   API Client with Cloudflare Worker
   ========================================================================== */
async function fetchAPI(endpoint, options = {}) {
  try {
    const res = await fetch(`${WORKER_API_BASE}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(isAdminLoggedIn() ? { 'X-Admin-Token': 'admin-authenticated-token' } : {}),
        ...options.headers
      }
    });
    const data = await res.json();
    return { ok: res.ok, status: res.status, data };
  } catch (err) {
    console.warn('API fetch failed, fallback mode:', err);
    return { ok: false, error: err.message };
  }
}

function getStoredPosts() {
  const data = localStorage.getItem(STORAGE_KEY_POSTS);
  if (!data) {
    localStorage.setItem(STORAGE_KEY_POSTS, JSON.stringify(INITIAL_SAMPLE_POSTS));
    return INITIAL_SAMPLE_POSTS;
  }
  try {
    return JSON.parse(data);
  } catch (e) {
    return INITIAL_SAMPLE_POSTS;
  }
}

function saveStoredPosts(posts) {
  localStorage.setItem(STORAGE_KEY_POSTS, JSON.stringify(posts));
}

function isAdminLoggedIn() {
  return sessionStorage.getItem(STORAGE_KEY_ADMIN) === 'true';
}

function setAdminLoggedIn(status) {
  if (status) {
    sessionStorage.setItem(STORAGE_KEY_ADMIN, 'true');
  } else {
    sessionStorage.removeItem(STORAGE_KEY_ADMIN);
  }
}

function initThemeToggle() {
  const themeToggle = document.getElementById('themeToggle');
  const storedTheme = localStorage.getItem('nw_theme') || 'dark';
  document.body.setAttribute('data-theme', storedTheme);

  if (themeToggle) {
    themeToggle.addEventListener('click', () => {
      const current = document.body.getAttribute('data-theme');
      const next = current === 'dark' ? 'light' : 'dark';
      document.body.setAttribute('data-theme', next);
      localStorage.setItem('nw_theme', next);
    });
  }
}

function showToast(message, title = '알림', isError = false) {
  const toast = document.getElementById('boardToast') || document.getElementById('adminToast');
  if (!toast) return;

  const titleEl = toast.querySelector('.toast-title');
  const msgEl = toast.querySelector('.toast-msg');
  const iconEl = toast.querySelector('.toast-icon');

  if (titleEl) titleEl.textContent = title;
  if (msgEl) msgEl.textContent = message;

  if (isError) {
    toast.style.background = '#ef4444';
    if (iconEl) iconEl.textContent = '!';
  } else {
    toast.style.background = '#10b981';
    if (iconEl) iconEl.textContent = '✓';
  }

  toast.classList.add('show');
  setTimeout(() => {
    toast.classList.remove('show');
  }, 3500);
}

/* ==========================================================================
   Page: board.html
   ========================================================================== */
function initBoardPage() {
  const tableBody = document.getElementById('boardTableBody');
  const paginationContainer = document.getElementById('boardPagination');
  if (!tableBody) return;

  let currentFilter = 'all';
  let searchQuery = '';
  let currentPage = 1;
  let activeViewingPostId = null;

  // Elements
  const writeModal = document.getElementById('writeModal');
  const detailModal = document.getElementById('detailModal');
  const secretAuthModal = document.getElementById('secretAuthModal');
  const openWriteBtn = document.getElementById('openWriteModalBtn');
  const emptyWriteBtn = document.getElementById('emptyWriteBtn');
  const closeWriteBtn = document.getElementById('closeWriteModal');
  const cancelWriteBtn = document.getElementById('cancelWriteModal');
  const writeForm = document.getElementById('writeForm');
  const savePostBtn = document.getElementById('savePostBtn');
  const searchInput = document.getElementById('searchInput');
  const filterBtns = document.querySelectorAll('.filter-btn');

  // Detail Elements
  const closeDetailBtn = document.getElementById('closeDetailModal');
  const closeDetailBtnFooter = document.getElementById('closeDetailBtn');
  const adminReplyBox = document.getElementById('adminReplyBox');
  const guestReplyNotice = document.getElementById('guestReplyNotice');
  const adminReplyForm = document.getElementById('adminReplyForm');
  const userDeleteBtn = document.getElementById('userDeleteBtn');
  const adminDeleteArea = document.getElementById('adminDeleteArea');
  const adminDeleteBtn = document.getElementById('adminDeleteBtn');

  // Secret Modal Elements
  const closeSecretBtn = document.getElementById('closeSecretAuthModal');
  const cancelSecretBtn = document.getElementById('cancelSecretAuth');
  const confirmSecretBtn = document.getElementById('confirmSecretAuth');
  const secretPwInput = document.getElementById('secretPasswordInput');
  const secretErrorMsg = document.getElementById('secretErrorMsg');
  let pendingSecretPost = null;

  function updateAdminHeaderStatus() {
    const adminBanner = document.getElementById('adminBanner');
    const adminLoginLink = document.getElementById('adminLoginLink');
    const adminQuickLogout = document.getElementById('adminQuickLogout');

    if (isAdminLoggedIn()) {
      if (adminBanner) adminBanner.style.display = 'flex';
      if (adminLoginLink) {
        adminLoginLink.innerHTML = '<span>⚙️ 관리자 콘솔</span>';
        adminLoginLink.classList.remove('btn-secondary');
        adminLoginLink.classList.add('btn-primary');
      }
    } else {
      if (adminBanner) adminBanner.style.display = 'none';
      if (adminLoginLink) {
        adminLoginLink.innerHTML = '<span>🔐 관리자 로그인</span>';
        adminLoginLink.classList.remove('btn-primary');
        adminLoginLink.classList.add('btn-secondary');
      }
    }

    if (adminQuickLogout) {
      adminQuickLogout.onclick = () => {
        setAdminLoggedIn(false);
        updateAdminHeaderStatus();
        loadBoardData(currentPage);
        showToast('관리자 세션에서 로그아웃되었습니다.');
      };
    }
  }

  // Load and Render Board with Skeleton UI & Pagination
  async function loadBoardData(page = 1) {
    currentPage = page;

    // 1. 스켈레톤 UI 즉시 표시
    renderSkeletonTable(tableBody, 6);
    const emptyState = document.getElementById('emptyState');
    if (emptyState) emptyState.style.display = 'none';

    // 2. 비동기 데이터 로드
    const endpoint = `/api/posts?page=${page}&limit=${PAGE_SIZE}&filter=${currentFilter}&search=${encodeURIComponent(searchQuery)}`;
    const res = await fetchAPI(endpoint);

    let posts = [];
    let totalPages = 1;

    if (res.ok && res.data.posts) {
      posts = res.data.posts;
      if (res.data.pagination) {
        totalPages = res.data.pagination.totalPages;
      }
    } else {
      // LocalStorage Fallback with local pagination
      const all = getStoredPosts().filter(post => {
        const hasReplies = post.replies && post.replies.length > 0;
        if (currentFilter === 'waiting' && hasReplies) return false;
        if (currentFilter === 'completed' && !hasReplies) return false;
        if (searchQuery) {
          const q = searchQuery.toLowerCase();
          return post.title.toLowerCase().includes(q) || post.author.toLowerCase().includes(q);
        }
        return true;
      });
      totalPages = Math.ceil(all.length / PAGE_SIZE) || 1;
      posts = all.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
    }

    // 3. 통계 카운터 갱신
    fetchAPI('/api/stats').then(statsRes => {
      if (statsRes.ok) {
        document.getElementById('countAll').textContent = statsRes.data.total;
        document.getElementById('countWaiting').textContent = statsRes.data.waiting;
        document.getElementById('countCompleted').textContent = statsRes.data.completed;
      }
    });

    // 4. 테이블 렌더링
    tableBody.innerHTML = '';

    if (!posts || posts.length === 0) {
      if (emptyState) emptyState.style.display = 'block';
      if (paginationContainer) paginationContainer.innerHTML = '';
      return;
    }

    posts.forEach(post => {
      const replyCount = post.reply_count || (post.replies ? post.replies.length : 0);
      const isCompleted = replyCount > 0;
      const isSecret = Boolean(post.is_secret || post.isSecret);
      const row = document.createElement('tr');
      row.onclick = () => onRowClick(post);

      row.innerHTML = `
        <td class="col-num table-num">${post.id}</td>
        <td class="col-category"><span class="badge-category">${post.category || '일반'}</span></td>
        <td class="col-status">
          <span class="badge-status ${isCompleted ? 'completed' : 'waiting'}">
            ${isCompleted ? '답변 완료' : '답변 대기'}
          </span>
        </td>
        <td class="col-title">
          <div class="post-row-title">
            ${isSecret ? '<span class="badge-secret">🔒</span>' : ''}
            <span>${escapeHtml(post.title)}</span>
            ${replyCount > 0 ? `<span class="reply-count-badge">+${replyCount}</span>` : ''}
          </div>
        </td>
        <td class="col-author">${escapeHtml(post.author)}</td>
        <td class="col-date">${(post.created_at || post.createdAt || '').split(' ')[0]}</td>
        <td class="col-views">${post.views || 0}</td>
      `;
      tableBody.appendChild(row);
    });

    // 5. 페이지네이션 렌더링
    renderPaginationUI(paginationContainer, currentPage, totalPages, (newPage) => {
      loadBoardData(newPage);
      window.scrollTo({ top: tableBody.closest('.board-table-wrapper').offsetTop - 90, behavior: 'smooth' });
    });
  }

  function onRowClick(post) {
    const isSecret = Boolean(post.is_secret || post.isSecret);

    if (isSecret && !isAdminLoggedIn()) {
      pendingSecretPost = post;
      secretPwInput.value = '';
      if (secretErrorMsg) secretErrorMsg.style.display = 'none';
      secretAuthModal.classList.add('open');
      secretPwInput.focus();
      return;
    }

    fetchAndOpenDetail(post.id);
  }

  if (confirmSecretBtn) {
    confirmSecretBtn.onclick = async () => {
      const pw = secretPwInput.value.trim();
      if (!pw || !pendingSecretPost) return;

      const res = await fetchAPI(`/api/posts/${pendingSecretPost.id}/verify`, {
        method: 'POST',
        body: JSON.stringify({ password: pw })
      });

      if (res.ok && res.data.verified) {
        secretAuthModal.classList.remove('open');
        fetchAndOpenDetail(pendingSecretPost.id);
      } else {
        if (pendingSecretPost.password && pendingSecretPost.password === pw) {
          secretAuthModal.classList.remove('open');
          openDetailModalDirect(pendingSecretPost, pendingSecretPost.replies || []);
        } else {
          if (secretErrorMsg) secretErrorMsg.style.display = 'block';
        }
      }
    };
  }

  if (cancelSecretBtn) cancelSecretBtn.onclick = () => secretAuthModal.classList.remove('open');
  if (closeSecretBtn) closeSecretBtn.onclick = () => secretAuthModal.classList.remove('open');

  async function fetchAndOpenDetail(postId) {
    activeViewingPostId = postId;
    const res = await fetchAPI(`/api/posts/${postId}`);

    if (res.ok && res.data.post) {
      openDetailModalDirect(res.data.post, res.data.replies || []);
    } else {
      const posts = getStoredPosts();
      const post = posts.find(p => p.id === postId);
      if (post) {
        post.views = (post.views || 0) + 1;
        saveStoredPosts(posts);
        openDetailModalDirect(post, post.replies || []);
      }
    }
  }

  function openDetailModalDirect(post, replies) {
    document.getElementById('detailCategory').textContent = post.category || '일반';
    const isCompleted = replies.length > 0;
    const statusEl = document.getElementById('detailStatus');
    statusEl.textContent = isCompleted ? '답변 완료' : '답변 대기';
    statusEl.className = `badge-status ${isCompleted ? 'completed' : 'waiting'}`;

    const secretEl = document.getElementById('detailSecretBadge');
    if (secretEl) secretEl.style.display = (post.is_secret || post.isSecret) ? 'inline-flex' : 'none';

    document.getElementById('detailTitle').textContent = post.title;
    document.getElementById('detailAuthor').textContent = post.author;
    document.getElementById('detailDate').textContent = post.created_at || post.createdAt;
    document.getElementById('detailViews').textContent = post.views || 1;
    document.getElementById('detailContent').textContent = post.content;

    if (isAdminLoggedIn()) {
      if (adminReplyBox) adminReplyBox.style.display = 'block';
      if (guestReplyNotice) guestReplyNotice.style.display = 'none';
      if (adminDeleteArea) adminDeleteArea.style.display = 'block';
    } else {
      if (adminReplyBox) adminReplyBox.style.display = 'none';
      if (guestReplyNotice) guestReplyNotice.style.display = 'flex';
      if (adminDeleteArea) adminDeleteArea.style.display = 'none';
    }

    renderReplies(replies);
    detailModal.classList.add('open');
  }

  function renderReplies(replies) {
    const list = document.getElementById('repliesList');
    const countEl = document.getElementById('replyCount');
    if (!list) return;

    if (countEl) countEl.textContent = replies.length;
    list.innerHTML = '';

    if (replies.length === 0) {
      list.innerHTML = `<div class="empty-state" style="padding: 24px;"><p>아직 등록된 공식 답변이 없습니다. 담당 관리자가 확인 중입니다.</p></div>`;
      return;
    }

    replies.forEach(reply => {
      const item = document.createElement('div');
      item.className = 'reply-card';
      item.innerHTML = `
        <div class="reply-meta">
          <div class="reply-author-info">
            <span class="badge-admin">공식 답변</span>
            <span class="reply-author">${escapeHtml(reply.author)}</span>
            <span class="reply-date">${reply.created_at || reply.createdAt}</span>
          </div>
          ${isAdminLoggedIn() ? `<button class="reply-delete-btn" data-reply-id="${reply.id}">답변 삭제</button>` : ''}
        </div>
        <div class="reply-body">${escapeHtml(reply.content)}</div>
      `;

      const delBtn = item.querySelector('.reply-delete-btn');
      if (delBtn) {
        delBtn.onclick = async () => {
          if (!confirm('이 관리자 답변을 삭제하시겠습니까?')) return;
          const delRes = await fetchAPI(`/api/replies/${reply.id}`, { method: 'DELETE' });
          if (delRes.ok) {
            showToast('답변이 삭제되었습니다.');
            fetchAndOpenDetail(activeViewingPostId);
          }
        };
      }

      list.appendChild(item);
    });
  }

  if (adminReplyForm) {
    adminReplyForm.onsubmit = async (e) => {
      e.preventDefault();
      const contentEl = document.getElementById('adminReplyContent');
      const content = contentEl.value.trim();
      if (!content || !activeViewingPostId) return;

      const submitBtn = adminReplyForm.querySelector('button[type="submit"]');
      if (submitBtn) submitBtn.disabled = true;

      const res = await fetchAPI(`/api/posts/${activeViewingPostId}/replies`, {
        method: 'POST',
        body: JSON.stringify({
          content,
          author: '넥스트웨이브 솔루션즈 (고객지원팀)'
        })
      });

      if (submitBtn) submitBtn.disabled = false;

      if (res.ok) {
        contentEl.value = '';
        fetchAndOpenDetail(activeViewingPostId);
        showToast('공식 답변이 성공적으로 등록되었습니다.');
      } else {
        showToast('답변 등록 실패: ' + (res.data?.error || ''), '오류', true);
      }
    };
  }

  if (userDeleteBtn) {
    userDeleteBtn.onclick = async () => {
      const pwInput = document.getElementById('deletePasswordInput');
      const pw = pwInput.value.trim();
      if (!pw) {
        alert('비밀번호를 입력해주세요.');
        return;
      }

      const res = await fetchAPI(`/api/posts/${activeViewingPostId}`, {
        method: 'DELETE',
        body: JSON.stringify({ password: pw })
      });

      if (res.ok) {
        detailModal.classList.remove('open');
        pwInput.value = '';
        loadBoardData(currentPage);
        showToast('게시글이 정상적으로 삭제되었습니다.');
      } else {
        alert(res.data?.error || '비밀번호가 일치하지 않습니다.');
      }
    };
  }

  if (adminDeleteBtn) {
    adminDeleteBtn.onclick = async () => {
      if (!confirm('관리자 권한으로 이 게시글을 완전히 삭제하시겠습니까?')) return;
      const res = await fetchAPI(`/api/posts/${activeViewingPostId}`, { method: 'DELETE' });
      if (res.ok) {
        detailModal.classList.remove('open');
        loadBoardData(currentPage);
        showToast('관리자 권한으로 문의글이 삭제되었습니다.');
      }
    };
  }

  // 글 등록 폼 제출 (중복 클릭 방지 적용)
  if (writeForm) {
    writeForm.onsubmit = async (e) => {
      e.preventDefault();

      if (savePostBtn && savePostBtn.disabled) return;

      const author = document.getElementById('postAuthor').value.trim();
      const password = document.getElementById('postPassword').value.trim();
      const category = document.getElementById('postCategory').value;
      const email = document.getElementById('postEmail').value.trim();
      const title = document.getElementById('postTitle').value.trim();
      const content = document.getElementById('postContent').value.trim();
      const isSecret = document.getElementById('postIsSecret').checked;

      if (!author || !password || !title || !content) {
        alert('필수 입력 항목을 모두 작성해주세요.');
        return;
      }

      if (password.length < 4) {
        alert('비밀번호는 최소 4자리 이상이어야 합니다.');
        return;
      }

      // 중복 제출 방지: 버튼 비활성화 & 텍스트 변경
      if (savePostBtn) {
        savePostBtn.disabled = true;
        savePostBtn.textContent = '등록 중...';
      }

      try {
        const res = await fetchAPI('/api/posts', {
          method: 'POST',
          body: JSON.stringify({
            title,
            content,
            author,
            password,
            category,
            email,
            is_secret: isSecret
          })
        });

        if (res.ok) {
          writeForm.reset();
          writeModal.classList.remove('open');
          loadBoardData(1); // 1페이지로 리프레시
          showToast('Cloudflare D1에 문의글이 안전하게 등록되었습니다.');
        } else {
          showToast('등록 실패: ' + (res.data?.error || ''), '오류', true);
        }
      } finally {
        if (savePostBtn) {
          savePostBtn.disabled = false;
          savePostBtn.textContent = '문의 등록하기';
        }
      }
    };
  }

  if (openWriteBtn) openWriteBtn.onclick = () => writeModal.classList.add('open');
  if (emptyWriteBtn) emptyWriteBtn.onclick = () => writeModal.classList.add('open');
  if (closeWriteBtn) closeWriteBtn.onclick = () => writeModal.classList.remove('open');
  if (cancelWriteBtn) cancelWriteBtn.onclick = () => writeModal.classList.remove('open');
  if (closeDetailBtn) closeDetailBtn.onclick = () => detailModal.classList.remove('open');
  if (closeDetailBtnFooter) closeDetailBtnFooter.onclick = () => detailModal.classList.remove('open');

  filterBtns.forEach(btn => {
    btn.onclick = () => {
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentFilter = btn.getAttribute('data-filter');
      loadBoardData(1);
    };
  });

  // 300ms 디바운스 적용 검색
  if (searchInput) {
    searchInput.oninput = debounce((e) => {
      searchQuery = e.target.value.trim();
      loadBoardData(1);
    }, 300);
  }

  updateAdminHeaderStatus();
  loadBoardData(1);
}

/* ==========================================================================
   Page: admin.html
   ========================================================================== */
function initAdminPage() {
  const loginSection = document.getElementById('loginSection');
  const dashboardSection = document.getElementById('dashboardSection');
  const adminPagination = document.getElementById('adminPagination');
  if (!loginSection || !dashboardSection) return;

  const loginForm = document.getElementById('adminLoginForm');
  const adminIdInput = document.getElementById('adminId');
  const adminPwInput = document.getElementById('adminPw');
  const autoFillBtn = document.getElementById('autoFillAccount');
  const loginErrorMsg = document.getElementById('loginErrorMsg');
  const logoutBtn = document.getElementById('logoutBtn');

  const adminModal = document.getElementById('adminDetailModal');
  const closeAdminModal = document.getElementById('closeAdminDetailModal');
  const admCloseBtn = document.getElementById('admCloseBtn');
  const admReplyForm = document.getElementById('admReplyForm');
  const admDeletePostBtn = document.getElementById('admDeletePostBtn');
  let activeAdminPostId = null;

  let currentTab = 'all';
  let adminSearch = '';
  let adminPage = 1;

  if (autoFillBtn) {
    autoFillBtn.onclick = () => {
      adminIdInput.value = 'admin';
      adminPwInput.value = 'admin1234';
      if (loginErrorMsg) loginErrorMsg.style.display = 'none';
    };
  }

  function checkAuthState() {
    if (isAdminLoggedIn()) {
      loginSection.style.display = 'none';
      dashboardSection.style.display = 'block';
      loadAdminDashboard(1);
    } else {
      loginSection.style.display = 'flex';
      dashboardSection.style.display = 'none';
    }
  }

  if (loginForm) {
    loginForm.onsubmit = async (e) => {
      e.preventDefault();
      const id = adminIdInput.value.trim();
      const pw = adminPwInput.value.trim();

      const res = await fetchAPI('/api/admin/login', {
        method: 'POST',
        body: JSON.stringify({ username: id, password: pw })
      });

      if (res.ok && res.data.success) {
        setAdminLoggedIn(true);
        if (loginErrorMsg) loginErrorMsg.style.display = 'none';
        showToast('관리자 인증에 성공했습니다.');
        checkAuthState();
      } else {
        if (loginErrorMsg) {
          loginErrorMsg.textContent = res.data?.error || '아이디 또는 비밀번호가 올바르지 않습니다.';
          loginErrorMsg.style.display = 'block';
        }
      }
    };
  }

  if (logoutBtn) {
    logoutBtn.onclick = () => {
      setAdminLoggedIn(false);
      showToast('로그아웃되었습니다.');
      checkAuthState();
    };
  }

  async function loadAdminDashboard(page = 1) {
    adminPage = page;
    const tbody = document.getElementById('adminTableBody');
    const emptyMsg = document.getElementById('adminEmptyMsg');

    // 스켈레톤 행 표시
    renderSkeletonTable(tbody, 5);
    if (emptyMsg) emptyMsg.style.display = 'none';

    // Stats
    fetchAPI('/api/stats').then(statsRes => {
      if (statsRes.ok) {
        document.getElementById('dashTotalCount').textContent = statsRes.data.total;
        document.getElementById('dashWaitingCount').textContent = statsRes.data.waiting;
        document.getElementById('dashCompletedCount').textContent = statsRes.data.completed;
      }
    });

    // Posts with Pagination
    const res = await fetchAPI(`/api/posts?page=${page}&limit=${PAGE_SIZE}&filter=${currentTab}&search=${encodeURIComponent(adminSearch)}`);
    const posts = (res.ok && res.data.posts) ? res.data.posts : [];
    const totalPages = (res.ok && res.data.pagination) ? res.data.pagination.totalPages : 1;

    tbody.innerHTML = '';

    if (posts.length === 0) {
      if (emptyMsg) emptyMsg.style.display = 'block';
      if (adminPagination) adminPagination.innerHTML = '';
      return;
    }

    posts.forEach(post => {
      const isCompleted = (post.reply_count || 0) > 0;
      const isSecret = Boolean(post.is_secret);
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td class="col-num table-num">${post.id}</td>
        <td>
          <span class="badge-status ${isCompleted ? 'completed' : 'waiting'}">
            ${isCompleted ? '답변 완료' : '답변 대기'}
          </span>
        </td>
        <td><span class="badge-category">${post.category || '일반'}</span></td>
        <td>
          <div class="post-row-title">
            ${isSecret ? '<span class="badge-secret">🔒</span>' : ''}
            <strong>${escapeHtml(post.title)}</strong>
          </div>
        </td>
        <td>${escapeHtml(post.author)}</td>
        <td class="col-date">${(post.created_at || '').split(' ')[0]}</td>
        <td>
          <button class="btn btn-sm ${isCompleted ? 'btn-secondary' : 'btn-primary'} open-reply-btn">
            ${isCompleted ? '답변 관리' : '답변 작성하기'}
          </button>
        </td>
      `;

      tr.querySelector('.open-reply-btn').onclick = () => openAdminModal(post.id);
      tbody.appendChild(tr);
    });

    renderPaginationUI(adminPagination, adminPage, totalPages, (newPage) => {
      loadAdminDashboard(newPage);
    });
  }

  async function openAdminModal(postId) {
    activeAdminPostId = postId;
    const res = await fetchAPI(`/api/posts/${postId}`);
    if (!res.ok || !res.data.post) return;

    const post = res.data.post;
    const replies = res.data.replies || [];

    document.getElementById('admCategory').textContent = post.category || '일반';
    const isCompleted = replies.length > 0;
    const statusEl = document.getElementById('admStatus');
    statusEl.textContent = isCompleted ? '답변 완료' : '답변 대기';
    statusEl.className = `badge-status ${isCompleted ? 'completed' : 'waiting'}`;

    const secretBadge = document.getElementById('admSecret');
    if (secretBadge) secretBadge.style.display = post.is_secret ? 'inline-block' : 'none';

    document.getElementById('admTitle').textContent = post.title;
    document.getElementById('admAuthor').textContent = post.author;
    document.getElementById('admEmail').textContent = post.email || '(이메일 미입력)';
    document.getElementById('admDate').textContent = post.created_at;
    document.getElementById('admContent').textContent = post.content;

    renderAdminExistingReplies(replies);
    adminModal.classList.add('open');
  }

  function renderAdminExistingReplies(replies) {
    const list = document.getElementById('admExistingReplies');
    list.innerHTML = '';

    if (replies.length === 0) {
      list.innerHTML = '<p style="color: var(--text-muted); font-size: 0.88rem; margin-bottom: 16px;">아직 작성된 공식 답변이 없습니다.</p>';
      return;
    }

    replies.forEach(reply => {
      const item = document.createElement('div');
      item.className = 'reply-card';
      item.style.marginBottom = '12px';
      item.innerHTML = `
        <div class="reply-meta">
          <div class="reply-author-info">
            <span class="badge-admin">등록된 답변</span>
            <span class="reply-author">${escapeHtml(reply.author)}</span>
            <span class="reply-date">${reply.created_at}</span>
          </div>
          <button class="reply-delete-btn" data-adm-del="${reply.id}">삭제</button>
        </div>
        <div class="reply-body">${escapeHtml(reply.content)}</div>
      `;

      item.querySelector('.reply-delete-btn').onclick = async () => {
        if (!confirm('이 답변을 삭제하시겠습니까?')) return;
        const res = await fetchAPI(`/api/replies/${reply.id}`, { method: 'DELETE' });
        if (res.ok) {
          openAdminModal(activeAdminPostId);
          loadAdminDashboard(adminPage);
          showToast('답변이 삭제되었습니다.');
        }
      };

      list.appendChild(item);
    });
  }

  if (admReplyForm) {
    admReplyForm.onsubmit = async (e) => {
      e.preventDefault();
      const txt = document.getElementById('admReplyText');
      const val = txt.value.trim();
      if (!val || !activeAdminPostId) return;

      const res = await fetchAPI(`/api/posts/${activeAdminPostId}/replies`, {
        method: 'POST',
        body: JSON.stringify({
          content: val,
          author: '넥스트웨이브 솔루션즈 (고객지원팀)'
        })
      });

      if (res.ok) {
        txt.value = '';
        openAdminModal(activeAdminPostId);
        loadAdminDashboard(adminPage);
        showToast('공식 답변이 Cloudflare D1에 등록되었습니다.');
      }
    };
  }

  if (admDeletePostBtn) {
    admDeletePostBtn.onclick = async () => {
      if (!confirm('이 문의글을 완전히 삭제하시겠습니까? (D1에서 영구 제거됩니다)')) return;
      const res = await fetchAPI(`/api/posts/${activeAdminPostId}`, { method: 'DELETE' });
      if (res.ok) {
        adminModal.classList.remove('open');
        loadAdminDashboard(adminPage);
        showToast('게시글이 삭제되었습니다.');
      }
    };
  }

  if (closeAdminModal) closeAdminModal.onclick = () => adminModal.classList.remove('open');
  if (admCloseBtn) admCloseBtn.onclick = () => adminModal.classList.remove('open');

  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.onclick = () => {
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentTab = btn.getAttribute('data-tab');
      loadAdminDashboard(1);
    };
  });

  if (searchEl = document.getElementById('adminSearchInput')) {
    searchEl.oninput = debounce((e) => {
      adminSearch = e.target.value.trim();
      loadAdminDashboard(1);
    }, 300);
  }

  checkAuthState();
}

document.addEventListener('DOMContentLoaded', () => {
  initThemeToggle();
  initBoardPage();
  initAdminPage();
});
