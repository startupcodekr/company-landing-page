/**
 * Cloudflare Worker - NextWave Inquiry Board API with D1
 */

// Helper: Web Crypto SHA-256 with Salt
async function hashPassword(password, salt) {
  const encoder = new TextEncoder();
  const data = encoder.encode(password + salt);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

function generateSalt() {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return Array.from(array, b => b.toString(16).padStart(2, '0')).join('');
}

// CORS Headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Admin-Token',
  'Content-Type': 'application/json; charset=utf-8'
};

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: corsHeaders
  });
}

export default {
  async fetch(request, env, ctx) {
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    const url = new URL(request.url);
    const path = url.pathname;
    const db = env.DB || env.company_inquiry_db;

    if (!db) {
      return jsonResponse({ error: 'D1 database binding not found' }, 500);
    }

    try {
      // 1. GET /api/stats - 대시보드 통계
      if (path === '/api/stats' && request.method === 'GET') {
        const totalRes = await db.prepare('SELECT COUNT(*) as count FROM posts').first();
        const completedRes = await db.prepare('SELECT COUNT(DISTINCT post_id) as count FROM replies').first();
        const total = totalRes.count || 0;
        const completed = completedRes.count || 0;
        const waiting = total - completed;

        return jsonResponse({ total, completed, waiting });
      }

      // 2. GET /api/posts - 게시글 목록 조회
      if (path === '/api/posts' && request.method === 'GET') {
        const filter = url.searchParams.get('filter') || 'all';
        const search = url.searchParams.get('search') || '';

        let query = `
          SELECT p.id, p.title, p.author, p.category, p.is_secret, p.views, p.created_at,
                 COUNT(r.id) as reply_count
          FROM posts p
          LEFT JOIN replies r ON p.id = r.post_id
        `;
        const conditions = [];
        const params = [];

        if (search) {
          conditions.push('(p.title LIKE ? OR p.author LIKE ? OR p.content LIKE ?)');
          const q = `%${search}%`;
          params.push(q, q, q);
        }

        if (conditions.length > 0) {
          query += ' WHERE ' + conditions.join(' AND ');
        }

        query += ' GROUP BY p.id ORDER BY p.id DESC';

        const { results } = await db.prepare(query).bind(...params).all();

        // 필터링 (waiting / completed)
        let filtered = results;
        if (filter === 'waiting') {
          filtered = results.filter(r => r.reply_count === 0);
        } else if (filter === 'completed') {
          filtered = results.filter(r => r.reply_count > 0);
        }

        return jsonResponse({ posts: filtered });
      }

      // 3. POST /api/posts - 비회원 새 문의글 작성
      if (path === '/api/posts' && request.method === 'POST') {
        const body = await request.json();
        const { title, content, author, password, category, email, is_secret } = body;

        if (!title || !content || !author || !password) {
          return jsonResponse({ error: '필수 항목이 누락되었습니다.' }, 400);
        }

        const salt = generateSalt();
        const password_hash = await hashPassword(password, salt);

        const stmt = await db.prepare(`
          INSERT INTO posts (title, content, author, password_hash, salt, category, email, is_secret)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `).bind(
          title,
          content,
          author,
          password_hash,
          salt,
          category || '기술 솔루션',
          email || null,
          is_secret ? 1 : 0
        ).run();

        return jsonResponse({
          success: true,
          id: stmt.meta.last_row_id,
          message: '문의글이 안전하게 등록되었습니다.'
        }, 201);
      }

      // 4. GET /api/posts/:id - 게시글 상세 및 답변 조회
      const postMatch = path.match(/^\/api\/posts\/(\d+)$/);
      if (postMatch && request.method === 'GET') {
        const postId = parseInt(postMatch[1], 10);

        // 조회수 1 증가
        await db.prepare('UPDATE posts SET views = views + 1 WHERE id = ?').bind(postId).run();

        const post = await db.prepare(`
          SELECT id, title, content, author, category, email, is_secret, views, created_at
          FROM posts WHERE id = ?
        `).bind(postId).first();

        if (!post) {
          return jsonResponse({ error: '게시글을 찾을 수 없습니다.' }, 404);
        }

        const { results: replies } = await db.prepare(`
          SELECT id, post_id, author, content, created_at
          FROM replies WHERE post_id = ? ORDER BY id ASC
        `).bind(postId).all();

        return jsonResponse({ post, replies });
      }

      // 5. POST /api/posts/:id/verify - 비밀글 비밀번호 검증
      const verifyMatch = path.match(/^\/api\/posts\/(\d+)\/verify$/);
      if (verifyMatch && request.method === 'POST') {
        const postId = parseInt(verifyMatch[1], 10);
        const { password } = await request.json();

        const post = await db.prepare('SELECT password_hash, salt FROM posts WHERE id = ?').bind(postId).first();
        if (!post) {
          return jsonResponse({ error: '게시글이 존재하지 않습니다.' }, 404);
        }

        const computedHash = await hashPassword(password, post.salt);
        if (computedHash === post.password_hash) {
          return jsonResponse({ verified: true });
        } else {
          return jsonResponse({ verified: false, error: '비밀번호가 일치하지 않습니다.' }, 401);
        }
      }

      // 6. DELETE /api/posts/:id - 게시글 삭제 (비밀번호 확인 또는 관리자)
      if (postMatch && request.method === 'DELETE') {
        const postId = parseInt(postMatch[1], 10);
        const authHeader = request.headers.get('X-Admin-Token');
        const body = await request.json().catch(() => ({}));
        const { password } = body;

        // 관리자 권한 확인 (토큰 검증)
        const isAdmin = authHeader === 'admin-authenticated-token';

        if (!isAdmin) {
          if (!password) {
            return jsonResponse({ error: '비밀번호가 필요합니다.' }, 400);
          }
          const post = await db.prepare('SELECT password_hash, salt FROM posts WHERE id = ?').bind(postId).first();
          if (!post) return jsonResponse({ error: '게시글이 없습니다.' }, 404);

          const computed = await hashPassword(password, post.salt);
          if (computed !== post.password_hash) {
            return jsonResponse({ error: '비밀번호가 일치하지 않습니다.' }, 403);
          }
        }

        await db.prepare('DELETE FROM posts WHERE id = ?').bind(postId).run();
        return jsonResponse({ success: true, message: '게시글이 삭제되었습니다.' });
      }

      // 7. POST /api/admin/login - 관리자 로그인
      if (path === '/api/admin/login' && request.method === 'POST') {
        const { username, password } = await request.json();

        const admin = await db.prepare('SELECT id, username, password_hash, salt, name, role FROM admins WHERE username = ?')
          .bind(username).first();

        if (!admin) {
          return jsonResponse({ error: '아이디 또는 비밀번호가 올바르지 않습니다.' }, 401);
        }

        const computed = await hashPassword(password, admin.salt);
        if (computed !== admin.password_hash) {
          return jsonResponse({ error: '아이디 또는 비밀번호가 올바르지 않습니다.' }, 401);
        }

        // 로그인 성공 시 관리자 토큰 반환
        return jsonResponse({
          success: true,
          token: 'admin-authenticated-token',
          admin: {
            id: admin.id,
            username: admin.username,
            name: admin.name,
            role: admin.role
          }
        });
      }

      // 8. POST /api/posts/:id/replies - 관리자 공식 답변 등록
      const replyMatch = path.match(/^\/api\/posts\/(\d+)\/replies$/);
      if (replyMatch && request.method === 'POST') {
        const postId = parseInt(replyMatch[1], 10);
        const { content, author } = await request.json();

        if (!content) {
          return jsonResponse({ error: '답변 내용을 입력해주세요.' }, 400);
        }

        const stmt = await db.prepare(`
          INSERT INTO replies (post_id, admin_id, author, content)
          VALUES (?, 1, ?, ?)
        `).bind(
          postId,
          author || '넥스트웨이브 솔루션즈 (고객지원팀)',
          content
        ).run();

        return jsonResponse({
          success: true,
          id: stmt.meta.last_row_id,
          message: '공식 답변이 성공적으로 등록되었습니다.'
        }, 201);
      }

      // 9. DELETE /api/replies/:id - 답변 삭제
      const delReplyMatch = path.match(/^\/api\/replies\/(\d+)$/);
      if (delReplyMatch && request.method === 'DELETE') {
        const replyId = parseInt(delReplyMatch[1], 10);
        await db.prepare('DELETE FROM replies WHERE id = ?').bind(replyId).run();
        return jsonResponse({ success: true, message: '답변이 삭제되었습니다.' });
      }

      // 10. Root health check
      if (path === '/' || path === '/api') {
        return jsonResponse({
          status: 'online',
          service: 'NextWave Inquiry API (Cloudflare Workers + D1)',
          version: '1.0.0'
        });
      }

      return jsonResponse({ error: 'Not Found' }, 404);

    } catch (err) {
      return jsonResponse({ error: err.message, stack: err.stack }, 500);
    }
  }
};
