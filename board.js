/**
 * NextWave Solutions - Board & Admin Logic
 * Pure Vanilla JavaScript with LocalStorage persistence
 */

const STORAGE_KEY_POSTS = 'nw_board_posts';
const STORAGE_KEY_ADMIN = 'nw_admin_session';

// 초기 샘플 문의 데이터
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
        content: '안녕하세요, 최현우 팀장님. 넥스트웨이브 클라우드 아키텍처팀입니다.\n문의주신 18TB급 대용량 오라클 환경의 마이그레이션은 AWS DMS(Database Migration Service)와 CDC(Change Data Capture) 파이프라인을 연계하여 다운타임을 1시간 이내로 단축하는 컷오버 프레임워크를 보유하고 있습니다.\n\n남겨주신 이메일로 PoC 사례집과 단계별 추진 로드맵 백서를 전달해 드렸으니 확인 부탁드립니다. 유선 상담도 가능합니다.',
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
    title: '글로벌 물류 트랜잭션 실시간 Kafka 파이프라인 성능 튜닝 자문',
    content: '현재 일일 3억 건 이상의 이벤트 스트림이 유입되고 있으나, 특정 피크 타임에 컨슈머 랙(Consumer Lag)이 급격히 증가하고 있습니다.\n파티션 전략 및 클러스터 아키텍처 진단 컨설팅 가능 일정이 궁금합니다.',
    author: '이영재',
    password: 'guest1234',
    email: 'yjlee@logis.sample.net',
    category: '기술 솔루션',
    isSecret: false,
    views: 18,
    createdAt: '2026-11-10 09:15',
    replies: []
  },
  {
    id: 4,
    title: '신규 엔터프라이즈 솔루션 도입 예산안 및 파트너십 제휴 제안서 (비공개)',
    content: '동남아시아 3개국 지사 통합 ERP 및 데이터 플랫폼 구축 건에 대해 넥스트웨이브와의 전략적 컨소시엄 구성을 제안드리고자 합니다. 세부 RFP는 첨부 내용 확인 부탁드립니다.',
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
   Data Helpers (LocalStorage CRUD)
   ========================================================================== */
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

/* ==========================================================================
   Global Theme Initialization
   ========================================================================== */
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

/* ==========================================================================
   Toast Notification
   ========================================================================== */
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
   Page Specific Handlers: board.html
   ========================================================================== */
function initBoardPage() {
  const tableBody = document.getElementById('boardTableBody');
  if (!tableBody) return; // Not on board.html

  let currentFilter = 'all';
  let searchQuery = '';
  let activeViewingPostId = null;

  // DOM Elements
  const writeModal = document.getElementById('writeModal');
  const detailModal = document.getElementById('detailModal');
  const secretAuthModal = document.getElementById('secretAuthModal');
  const openWriteBtn = document.getElementById('openWriteModalBtn');
  const emptyWriteBtn = document.getElementById('emptyWriteBtn');
  const closeWriteBtn = document.getElementById('closeWriteModal');
  const cancelWriteBtn = document.getElementById('cancelWriteModal');
  const writeForm = document.getElementById('writeForm');
  const searchInput = document.getElementById('searchInput');
  const filterBtns = document.querySelectorAll('.filter-btn');

  // Detail Modal Elements
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
  let pendingSecretPostId = null;

  // Admin Banner & Link Status
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
        renderBoard();
        showToast('관리자 세션에서 로그아웃되었습니다.');
      };
    }
  }

  // Render Board Posts
  function renderBoard() {
    const posts = getStoredPosts();
    let filtered = posts.filter(post => {
      // Filter status
      const hasReplies = post.replies && post.replies.length > 0;
      if (currentFilter === 'waiting' && hasReplies) return false;
      if (currentFilter === 'completed' && !hasReplies) return false;

      // Search filter
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const matchTitle = post.title.toLowerCase().includes(q);
        const matchAuthor = post.author.toLowerCase().includes(q);
        const matchContent = post.content.toLowerCase().includes(q);
        return matchTitle || matchAuthor || matchContent;
      }
      return true;
    });

    // Counts update
    const totalCount = posts.length;
    const waitingCount = posts.filter(p => !p.replies || p.replies.length === 0).length;
    const completedCount = totalCount - waitingCount;

    const countAllEl = document.getElementById('countAll');
    const countWaitingEl = document.getElementById('countWaiting');
    const countCompletedEl = document.getElementById('countCompleted');

    if (countAllEl) countAllEl.textContent = totalCount;
    if (countWaitingEl) countWaitingEl.textContent = waitingCount;
    if (countCompletedEl) countCompletedEl.textContent = completedCount;

    // Render table
    tableBody.innerHTML = '';
    const emptyState = document.getElementById('emptyState');

    if (filtered.length === 0) {
      if (emptyState) emptyState.style.display = 'block';
      return;
    }
    if (emptyState) emptyState.style.display = 'none';

    filtered.forEach((post, index) => {
      const isCompleted = post.replies && post.replies.length > 0;
      const row = document.createElement('tr');
      row.onclick = () => onRowClick(post.id);

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
            ${post.isSecret ? '<span class="badge-secret">🔒</span>' : ''}
            <span>${escapeHtml(post.title)}</span>
            ${isCompleted ? `<span class="reply-count-badge">+${post.replies.length}</span>` : ''}
          </div>
        </td>
        <td class="col-author">${escapeHtml(post.author)}</td>
        <td class="col-date">${post.createdAt.split(' ')[0]}</td>
        <td class="col-views">${post.views || 0}</td>
      `;
      tableBody.appendChild(row);
    });
  }

  // Row Click Handler (Secret check)
  function onRowClick(postId) {
    const posts = getStoredPosts();
    const post = posts.find(p => p.id === postId);
    if (!post) return;

    // If secret and user is NOT admin
    if (post.isSecret && !isAdminLoggedIn()) {
      pendingSecretPostId = postId;
      secretPwInput.value = '';
      if (secretErrorMsg) secretErrorMsg.style.display = 'none';
      secretAuthModal.classList.add('open');
      secretPwInput.focus();
      return;
    }

    openDetailModal(post);
  }

  // Confirm Secret Password
  if (confirmSecretBtn) {
    confirmSecretBtn.onclick = () => {
      const posts = getStoredPosts();
      const post = posts.find(p => p.id === pendingSecretPostId);
      if (!post) return;

      if (secretPwInput.value === post.password) {
        secretAuthModal.classList.remove('open');
        openDetailModal(post);
      } else {
        if (secretErrorMsg) secretErrorMsg.style.display = 'block';
      }
    };
  }

  if (cancelSecretBtn) cancelSecretBtn.onclick = () => secretAuthModal.classList.remove('open');
  if (closeSecretBtn) closeSecretBtn.onclick = () => secretAuthModal.classList.remove('open');

  // Open Detail Modal
  function openDetailModal(post) {
    activeViewingPostId = post.id;

    // Increment Views
    post.views = (post.views || 0) + 1;
    saveStoredPosts(getStoredPosts().map(p => p.id === post.id ? post : p));
    renderBoard();

    // Fill Modal
    document.getElementById('detailCategory').textContent = post.category || '일반';
    const isCompleted = post.replies && post.replies.length > 0;
    const statusEl = document.getElementById('detailStatus');
    statusEl.textContent = isCompleted ? '답변 완료' : '답변 대기';
    statusEl.className = `badge-status ${isCompleted ? 'completed' : 'waiting'}`;

    const secretEl = document.getElementById('detailSecretBadge');
    if (secretEl) secretEl.style.display = post.isSecret ? 'inline-flex' : 'none';

    document.getElementById('detailTitle').textContent = post.title;
    document.getElementById('detailAuthor').textContent = post.author;
    document.getElementById('detailDate').textContent = post.createdAt;
    document.getElementById('detailViews').textContent = post.views;
    document.getElementById('detailContent').textContent = post.content;

    // Admin Reply Box & Delete Permissions
    if (isAdminLoggedIn()) {
      if (adminReplyBox) adminReplyBox.style.display = 'block';
      if (guestReplyNotice) guestReplyNotice.style.display = 'none';
      if (adminDeleteArea) adminDeleteArea.style.display = 'block';
    } else {
      if (adminReplyBox) adminReplyBox.style.display = 'none';
      if (guestReplyNotice) guestReplyNotice.style.display = 'flex';
      if (adminDeleteArea) adminDeleteArea.style.display = 'none';
    }

    renderReplies(post);
    detailModal.classList.add('open');
  }

  // Render Replies inside Detail Modal
  function renderReplies(post) {
    const list = document.getElementById('repliesList');
    const countEl = document.getElementById('replyCount');
    if (!list) return;

    const replies = post.replies || [];
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
            <span class="reply-date">${reply.createdAt}</span>
          </div>
          ${isAdminLoggedIn() ? `<button class="reply-delete-btn" data-reply-id="${reply.id}">답변 삭제</button>` : ''}
        </div>
        <div class="reply-body">${escapeHtml(reply.content)}</div>
      `;

      // Reply delete handler
      const delBtn = item.querySelector('.reply-delete-btn');
      if (delBtn) {
        delBtn.onclick = () => {
          if (!confirm('이 관리자 답변을 삭제하시겠습니까?')) return;
          const posts = getStoredPosts();
          const target = posts.find(p => p.id === activeViewingPostId);
          if (target) {
            target.replies = target.replies.filter(r => r.id !== reply.id);
            saveStoredPosts(posts);
            renderReplies(target);
            renderBoard();
            showToast('답변이 삭제되었습니다.');
          }
        };
      }

      list.appendChild(item);
    });
  }

  // Admin Reply Submit
  if (adminReplyForm) {
    adminReplyForm.onsubmit = (e) => {
      e.preventDefault();
      const contentEl = document.getElementById('adminReplyContent');
      const content = contentEl.value.trim();
      if (!content) return;

      const posts = getStoredPosts();
      const post = posts.find(p => p.id === activeViewingPostId);
      if (!post) return;

      if (!post.replies) post.replies = [];
      post.replies.push({
        id: Date.now(),
        author: '넥스트웨이브 솔루션즈 (고객지원팀)',
        content: content,
        createdAt: formatDate()
      });

      saveStoredPosts(posts);
      contentEl.value = '';
      renderReplies(post);
      renderBoard();

      // Update status badge
      const statusEl = document.getElementById('detailStatus');
      if (statusEl) {
        statusEl.textContent = '답변 완료';
        statusEl.className = 'badge-status completed';
      }

      showToast('공식 답변이 성공적으로 등록되었습니다.');
    };
  }

  // Non-member delete post with password
  if (userDeleteBtn) {
    userDeleteBtn.onclick = () => {
      const pwInput = document.getElementById('deletePasswordInput');
      const pw = pwInput.value.trim();
      if (!pw) {
        alert('글 작성 시 입력하셨던 비밀번호를 입력해주세요.');
        pwInput.focus();
        return;
      }

      const posts = getStoredPosts();
      const post = posts.find(p => p.id === activeViewingPostId);
      if (!post) return;

      if (post.password === pw) {
        if (!confirm('정말 이 문의글을 삭제하시겠습니까?')) return;
        saveStoredPosts(posts.filter(p => p.id !== activeViewingPostId));
        detailModal.classList.remove('open');
        pwInput.value = '';
        renderBoard();
        showToast('게시글이 정상적으로 삭제되었습니다.');
      } else {
        alert('비밀번호가 일치하지 않습니다.');
      }
    };
  }

  // Admin Instant Delete
  if (adminDeleteBtn) {
    adminDeleteBtn.onclick = () => {
      if (!confirm('관리자 권한으로 이 게시글을 완전히 삭제하시겠습니까?')) return;
      saveStoredPosts(getStoredPosts().filter(p => p.id !== activeViewingPostId));
      detailModal.classList.remove('open');
      renderBoard();
      showToast('관리자 권한으로 문의글이 삭제되었습니다.');
    };
  }

  // Create New Post Submit
  if (writeForm) {
    writeForm.onsubmit = (e) => {
      e.preventDefault();
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

      const posts = getStoredPosts();
      const newId = posts.length > 0 ? Math.max(...posts.map(p => p.id)) + 1 : 1;

      const newPost = {
        id: newId,
        title,
        content,
        author,
        password,
        email,
        category,
        isSecret,
        views: 0,
        createdAt: formatDate(),
        replies: []
      };

      posts.unshift(newPost);
      saveStoredPosts(posts);

      writeForm.reset();
      writeModal.classList.remove('open');
      renderBoard();
      showToast('문의글이 등록되었습니다. 신속하게 답변드리겠습니다.');
    };
  }

  // Modal open/close bindings
  if (openWriteBtn) openWriteBtn.onclick = () => writeModal.classList.add('open');
  if (emptyWriteBtn) emptyWriteBtn.onclick = () => writeModal.classList.add('open');
  if (closeWriteBtn) closeWriteBtn.onclick = () => writeModal.classList.remove('open');
  if (cancelWriteBtn) cancelWriteBtn.onclick = () => writeModal.classList.remove('open');
  if (closeDetailBtn) closeDetailBtn.onclick = () => detailModal.classList.remove('open');
  if (closeDetailBtnFooter) closeDetailBtnFooter.onclick = () => detailModal.classList.remove('open');

  // Filter Buttons
  filterBtns.forEach(btn => {
    btn.onclick = () => {
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentFilter = btn.getAttribute('data-filter');
      renderBoard();
    };
  });

  // Search Input
  if (searchInput) {
    searchInput.oninput = (e) => {
      searchQuery = e.target.value.trim();
      renderBoard();
    };
  }

  // Initial Load
  updateAdminHeaderStatus();
  renderBoard();
}

/* ==========================================================================
   Page Specific Handlers: admin.html
   ========================================================================== */
function initAdminPage() {
  const loginSection = document.getElementById('loginSection');
  const dashboardSection = document.getElementById('dashboardSection');
  if (!loginSection || !dashboardSection) return; // Not on admin.html

  const loginForm = document.getElementById('adminLoginForm');
  const adminIdInput = document.getElementById('adminId');
  const adminPwInput = document.getElementById('adminPw');
  const autoFillBtn = document.getElementById('autoFillAccount');
  const loginErrorMsg = document.getElementById('loginErrorMsg');
  const logoutBtn = document.getElementById('logoutBtn');

  // Admin Modal Elements
  const adminModal = document.getElementById('adminDetailModal');
  const closeAdminModal = document.getElementById('closeAdminDetailModal');
  const admCloseBtn = document.getElementById('admCloseBtn');
  const admReplyForm = document.getElementById('admReplyForm');
  const admDeletePostBtn = document.getElementById('admDeletePostBtn');
  let activeAdminPostId = null;

  let currentTab = 'all';
  let adminSearch = '';

  // Auto Fill Test Account
  if (autoFillBtn) {
    autoFillBtn.onclick = () => {
      adminIdInput.value = 'admin';
      adminPwInput.value = 'admin1234';
      if (loginErrorMsg) loginErrorMsg.style.display = 'none';
    };
  }

  // Check login state on load
  function checkAuthState() {
    if (isAdminLoggedIn()) {
      loginSection.style.display = 'none';
      dashboardSection.style.display = 'block';
      renderAdminDashboard();
    } else {
      loginSection.style.display = 'flex';
      dashboardSection.style.display = 'none';
    }
  }

  // Handle Login
  if (loginForm) {
    loginForm.onsubmit = (e) => {
      e.preventDefault();
      const id = adminIdInput.value.trim();
      const pw = adminPwInput.value.trim();

      // Demo Admin Credentials: admin / admin1234
      if (id === 'admin' && pw === 'admin1234') {
        setAdminLoggedIn(true);
        if (loginErrorMsg) loginErrorMsg.style.display = 'none';
        showToast('관리자 인증에 성공했습니다.');
        checkAuthState();
      } else {
        if (loginErrorMsg) loginErrorMsg.style.display = 'block';
      }
    };
  }

  // Handle Logout
  if (logoutBtn) {
    logoutBtn.onclick = () => {
      setAdminLoggedIn(false);
      showToast('로그아웃되었습니다.');
      checkAuthState();
    };
  }

  // Render Admin Dashboard
  function renderAdminDashboard() {
    const posts = getStoredPosts();
    const totalCount = posts.length;
    const waitingCount = posts.filter(p => !p.replies || p.replies.length === 0).length;
    const completedCount = totalCount - waitingCount;

    document.getElementById('dashTotalCount').textContent = totalCount;
    document.getElementById('dashWaitingCount').textContent = waitingCount;
    document.getElementById('dashCompletedCount').textContent = completedCount;

    // Filter
    let filtered = posts.filter(p => {
      const hasReplies = p.replies && p.replies.length > 0;
      if (currentTab === 'waiting' && hasReplies) return false;
      if (currentTab === 'completed' && !hasReplies) return false;
      if (adminSearch) {
        const q = adminSearch.toLowerCase();
        return p.title.toLowerCase().includes(q) || p.author.toLowerCase().includes(q);
      }
      return true;
    });

    const tbody = document.getElementById('adminTableBody');
    const emptyMsg = document.getElementById('adminEmptyMsg');
    tbody.innerHTML = '';

    if (filtered.length === 0) {
      if (emptyMsg) emptyMsg.style.display = 'block';
      return;
    }
    if (emptyMsg) emptyMsg.style.display = 'none';

    filtered.forEach(post => {
      const isCompleted = post.replies && post.replies.length > 0;
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
            ${post.isSecret ? '<span class="badge-secret">🔒</span>' : ''}
            <strong>${escapeHtml(post.title)}</strong>
          </div>
        </td>
        <td>${escapeHtml(post.author)}</td>
        <td class="col-date">${post.createdAt.split(' ')[0]}</td>
        <td>
          <button class="btn btn-sm ${isCompleted ? 'btn-secondary' : 'btn-primary'} open-reply-btn">
            ${isCompleted ? '답변 관리' : '답변 작성하기'}
          </button>
        </td>
      `;

      tr.querySelector('.open-reply-btn').onclick = () => openAdminModal(post);
      tbody.appendChild(tr);
    });
  }

  // Open Admin Reply Modal
  function openAdminModal(post) {
    activeAdminPostId = post.id;
    document.getElementById('admCategory').textContent = post.category || '일반';
    const isCompleted = post.replies && post.replies.length > 0;
    const statusEl = document.getElementById('admStatus');
    statusEl.textContent = isCompleted ? '답변 완료' : '답변 대기';
    statusEl.className = `badge-status ${isCompleted ? 'completed' : 'waiting'}`;

    const secretBadge = document.getElementById('admSecret');
    if (secretBadge) secretBadge.style.display = post.isSecret ? 'inline-block' : 'none';

    document.getElementById('admTitle').textContent = post.title;
    document.getElementById('admAuthor').textContent = post.author;
    document.getElementById('admEmail').textContent = post.email || '(이메일 미입력)';
    document.getElementById('admDate').textContent = post.createdAt;
    document.getElementById('admContent').textContent = post.content;

    renderAdminExistingReplies(post);
    adminModal.classList.add('open');
  }

  function renderAdminExistingReplies(post) {
    const list = document.getElementById('admExistingReplies');
    list.innerHTML = '';
    const replies = post.replies || [];

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
            <span class="reply-date">${reply.createdAt}</span>
          </div>
          <button class="reply-delete-btn" data-adm-del="${reply.id}">삭제</button>
        </div>
        <div class="reply-body">${escapeHtml(reply.content)}</div>
      `;

      item.querySelector('.reply-delete-btn').onclick = () => {
        if (!confirm('이 답변을 삭제하시겠습니까?')) return;
        const posts = getStoredPosts();
        const cur = posts.find(p => p.id === activeAdminPostId);
        if (cur) {
          cur.replies = cur.replies.filter(r => r.id !== reply.id);
          saveStoredPosts(posts);
          renderAdminExistingReplies(cur);
          renderAdminDashboard();
          showToast('답변이 삭제되었습니다.');
        }
      };

      list.appendChild(item);
    });
  }

  // Admin Reply Submit
  if (admReplyForm) {
    admReplyForm.onsubmit = (e) => {
      e.preventDefault();
      const txt = document.getElementById('admReplyText');
      const val = txt.value.trim();
      if (!val) return;

      const posts = getStoredPosts();
      const post = posts.find(p => p.id === activeAdminPostId);
      if (!post) return;

      if (!post.replies) post.replies = [];
      post.replies.push({
        id: Date.now(),
        author: '넥스트웨이브 솔루션즈 (고객지원팀)',
        content: val,
        createdAt: formatDate()
      });

      saveStoredPosts(posts);
      txt.value = '';
      renderAdminExistingReplies(post);
      renderAdminDashboard();

      const statusEl = document.getElementById('admStatus');
      if (statusEl) {
        statusEl.textContent = '답변 완료';
        statusEl.className = 'badge-status completed';
      }

      showToast('공식 답변이 등록되었습니다.');
    };
  }

  // Admin Delete Post
  if (admDeletePostBtn) {
    admDeletePostBtn.onclick = () => {
      if (!confirm('이 문의글을 완전히 삭제하시겠습니까? (복구할 수 없습니다)')) return;
      saveStoredPosts(getStoredPosts().filter(p => p.id !== activeAdminPostId));
      adminModal.classList.remove('open');
      renderAdminDashboard();
      showToast('게시글이 삭제되었습니다.');
    };
  }

  // Modal Closures
  if (closeAdminModal) closeAdminModal.onclick = () => adminModal.classList.remove('open');
  if (admCloseBtn) admCloseBtn.onclick = () => adminModal.classList.remove('open');

  // Filter tabs
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.onclick = () => {
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentTab = btn.getAttribute('data-tab');
      renderAdminDashboard();
    };
  });

  // Admin Search
  const searchEl = document.getElementById('adminSearchInput');
  if (searchEl) {
    searchEl.oninput = (e) => {
      adminSearch = e.target.value.trim();
      renderAdminDashboard();
    };
  }

  checkAuthState();
}

// Utility: Escape HTML
function escapeHtml(string) {
  if (!string) return '';
  const div = document.createElement('div');
  div.textContent = string;
  return div.innerHTML;
}

// Global initialization
document.addEventListener('DOMContentLoaded', () => {
  initThemeToggle();
  initBoardPage();
  initAdminPage();
});
