/* =============================================
   ASKANOPTOM.COM — Forum JS
   =============================================
   Handles:
   - Supabase client init
   - Google OAuth sign in/out
   - Loading and rendering threads
   - Posting threads and comments
   - Specialty filtering
   ============================================= */

// ─────────────────────────────────────────────
// CONFIG — add your values from Supabase dashboard
// Settings → API → Project URL and anon key
// ─────────────────────────────────────────────
// credentials loaded dynamically via get-config function
const { createClient } = supabase;
let sb = null;

// ─────────────────────────────────────────────
// INIT
// ─────────────────────────────────────────────
const { createClient } = supabase;
const sb = createClient(SUPABASE_URL, SUPABASE_ANON);

let currentUser    = null;
let currentSession = null;
let activeSpecialty = 'all';
let activeThreadId  = null;

// ─────────────────────────────────────────────
// AUTH
// ─────────────────────────────────────────────
async function initAuth() {
  const { data: { session } } = await sb.auth.getSession();
  if (session) {
    currentSession = session;
    currentUser    = session.user;
    renderAuthState(true);
  }

  sb.auth.onAuthStateChange((_event, session) => {
    currentSession = session;
    currentUser    = session?.user || null;
    renderAuthState(!!session);
  });
}

function renderAuthState(signedIn) {
  const authCard  = document.getElementById('authCard');
  const userCard  = document.getElementById('userCard');
  const navAuth   = document.getElementById('navAuth');

  if (signedIn && currentUser) {
    const name     = currentUser.user_metadata?.full_name || currentUser.email?.split('@')[0] || 'You';
    const initials = name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();

    authCard.classList.add('hidden');
    userCard.classList.remove('hidden');
    document.getElementById('userAvatar').textContent = initials;
    document.getElementById('userName').textContent   = name;

    navAuth.innerHTML = `
      <div class="nav-auth-avatar">${initials}</div>
      <span class="nav-auth-name">${name.split(' ')[0]}</span>`;
  } else {
    authCard.classList.remove('hidden');
    userCard.classList.add('hidden');
    navAuth.innerHTML = `<button class="nav-signin-btn" onclick="signInWithGoogle()">Sign in</button>`;
  }
}

async function signInWithGoogle() {
  await sb.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: window.location.href }
  });
}

async function signOut() {
  await sb.auth.signOut();
  currentUser    = null;
  currentSession = null;
  renderAuthState(false);
}

// ─────────────────────────────────────────────
// LOAD THREADS
// ─────────────────────────────────────────────
async function loadThreads(specialty = 'all') {
  const feed    = document.getElementById('forumFeed');
  const loading = document.getElementById('feedLoading');
  loading.style.display = 'flex';

  try {
    const url = specialty === 'all'
      ? '/.netlify/functions/get-threads'
      : `/.netlify/functions/get-threads?specialty=${encodeURIComponent(specialty)}`;

    const res  = await fetch(url);
    const data = await res.json();

    loading.style.display = 'none';

    if (!data.threads || data.threads.length === 0) {
      feed.innerHTML = `
        <div class="forum-empty">
          <div class="forum-empty-title">No cases yet${specialty !== 'all' ? ' in ' + specialty : ''}</div>
          <div class="forum-empty-sub">Be the first to post a case and start the discussion.</div>
        </div>`;
      return;
    }

    feed.innerHTML = '';
    data.threads.forEach(thread => {
      feed.appendChild(renderThreadCard(thread));
    });

  } catch (err) {
    loading.style.display = 'none';
    feed.innerHTML = `
      <div class="forum-empty">
        <div class="forum-empty-title">Couldn't load cases</div>
        <div class="forum-empty-sub">Check your connection and try again.</div>
      </div>`;
    console.error('loadThreads error:', err);
  }
}

// ─────────────────────────────────────────────
// RENDER THREAD CARD
// ─────────────────────────────────────────────
function renderThreadCard(thread) {
  const card = document.createElement('div');
  card.className = 'thread-card';
  card.onclick = () => openThread(thread.id);

  const author   = thread.profiles;
  const name     = author?.full_name || 'Anonymous';
  const cred     = author?.credential ? ` · ${author.credential}` : '';
  const country  = author?.country    ? ` · ${author.country}`    : '';
  const timeAgo  = formatTimeAgo(thread.created_at);
  const comments = thread.comment_count || 0;
  const resolved = thread.is_resolved;

  card.innerHTML = `
    <div class="thread-card-tags">
      <span class="tc-tag tc-tag-teal">${thread.specialty || 'General'}</span>
      ${resolved
        ? '<span class="tc-tag tc-tag-green">resolved ✓</span>'
        : '<span class="tc-tag tc-tag-amber">open</span>'}
    </div>
    <div class="thread-card-title">${escapeHtml(thread.title)}</div>
    <div class="thread-card-body">${escapeHtml(thread.body)}</div>
    <div class="thread-card-footer">
      <div class="thread-card-meta">
        <span class="tc-author">${escapeHtml(name)}${escapeHtml(cred)}${escapeHtml(country)}</span>
        <span>${timeAgo}</span>
      </div>
      <span class="tc-comments">
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M10 1H2a1 1 0 0 0-1 1v5a1 1 0 0 0 1 1h2l2 3 2-3h2a1 1 0 0 0 1-1V2a1 1 0 0 0-1-1Z" stroke="currentColor" stroke-width="1.1" stroke-linejoin="round"/></svg>
        ${comments}
      </span>
    </div>`;
  return card;
}

// ─────────────────────────────────────────────
// OPEN THREAD
// ─────────────────────────────────────────────
async function openThread(threadId) {
  activeThreadId = threadId;
  const modal = document.getElementById('threadModal');
  const body  = document.getElementById('threadModalBody');
  modal.classList.remove('hidden');
  body.innerHTML = `
    <div class="forum-loading" style="padding:2rem 0;">
      <div class="loading-dots"><span></span><span></span><span></span></div>
      <p class="loading-text">Loading case...</p>
    </div>`;

  try {
    const res  = await fetch(`/.netlify/functions/get-threads?thread_id=${threadId}`);
    const data = await res.json();
    renderThreadDetail(data.thread, data.comments || []);
  } catch (err) {
    body.innerHTML = `<p style="color:var(--text-secondary);padding:1rem;">Couldn't load this case. Please try again.</p>`;
  }
}

function renderThreadDetail(thread, comments) {
  const body     = document.getElementById('threadModalBody');
  const author   = thread.profiles;
  const name     = author?.full_name || 'Anonymous';
  const cred     = author?.credential || '';
  const country  = author?.country    || '';
  const timeAgo  = formatTimeAgo(thread.created_at);

  const commentsHtml = comments.length === 0
    ? '<p style="font-size:13px;color:var(--text-tertiary);margin-bottom:1rem;">No replies yet — be the first to contribute.</p>'
    : comments.map(c => {
        const ca = c.profiles;
        const cn = ca?.full_name || 'Anonymous';
        const cc = ca?.credential || '';
        const ccountry = ca?.country || '';
        const init = cn.substring(0, 2).toUpperCase();
        return `
          <div class="comment-item">
            <div class="comment-avatar">${init}</div>
            <div class="comment-body">
              <div class="comment-meta">
                <span class="comment-author">${escapeHtml(cn)}</span>
                ${cc ? `<span class="comment-cred">${escapeHtml(cc)}${ccountry ? ' · ' + ccountry : ''}</span>` : ''}
                <span class="comment-time">${formatTimeAgo(c.created_at)}</span>
              </div>
              <div class="comment-text">${escapeHtml(c.body)}</div>
            </div>
          </div>`;
      }).join('');

  const replySection = currentUser
    ? `<div class="comment-input-area">
        <textarea class="comment-input" id="newComment" rows="2" placeholder="Share your clinical reasoning..."></textarea>
        <button class="comment-submit" onclick="submitComment()">Reply</button>
       </div>`
    : `<div class="signin-to-comment">
        <button onclick="signInWithGoogle()">Sign in with Google</button> to add your clinical perspective.
       </div>`;

  body.innerHTML = `
    <div class="thread-detail-tags">
      <span class="tc-tag tc-tag-teal">${thread.specialty || 'General'}</span>
      ${thread.is_resolved
        ? '<span class="tc-tag tc-tag-green">resolved ✓</span>'
        : '<span class="tc-tag tc-tag-amber">open</span>'}
    </div>
    <h2 class="thread-detail-title">${escapeHtml(thread.title)}</h2>
    <div class="thread-detail-meta">
      <span class="td-author">${escapeHtml(name)}${cred ? ' · ' + cred : ''}${country ? ' · ' + country : ''}</span>
      <span>${timeAgo}</span>
      <span>${comments.length} ${comments.length === 1 ? 'reply' : 'replies'}</span>
    </div>
    <div class="thread-detail-body">${escapeHtml(thread.body)}</div>
    <div class="comments-header">${comments.length} ${comments.length === 1 ? 'reply' : 'replies'}</div>
    ${commentsHtml}
    ${replySection}`;
}

function closeThreadModal() {
  document.getElementById('threadModal').classList.add('hidden');
  activeThreadId = null;
}

// ─────────────────────────────────────────────
// POST THREAD
// ─────────────────────────────────────────────
function openPostModal() {
  if (!currentUser) { signInWithGoogle(); return; }
  document.getElementById('postModal').classList.remove('hidden');
}

function closePostModal() {
  document.getElementById('postModal').classList.add('hidden');
}

async function submitThread() {
  if (!currentUser || !currentSession) { signInWithGoogle(); return; }

  const title    = document.getElementById('threadTitle').value.trim();
  const specialty = document.getElementById('threadSpecialty').value;
  const body     = document.getElementById('threadBody').value.trim();
  const btn      = document.getElementById('btnSubmitThread');

  if (!title || !body) {
    alert('Please fill in the title and case details.');
    return;
  }

  btn.disabled   = true;
  btn.textContent = 'Posting...';

  try {
    const res = await fetch('/.netlify/functions/post-thread', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${currentSession.access_token}`
      },
      body: JSON.stringify({ title, specialty, body })
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to post');

    closePostModal();
    document.getElementById('threadTitle').value = '';
    document.getElementById('threadBody').value  = '';
    await loadThreads(activeSpecialty);

  } catch (err) {
    alert('Failed to post case: ' + err.message);
  } finally {
    btn.disabled    = false;
    btn.textContent = 'Post case';
  }
}

// ─────────────────────────────────────────────
// POST COMMENT
// ─────────────────────────────────────────────
async function submitComment() {
  if (!currentUser || !currentSession || !activeThreadId) return;

  const input = document.getElementById('newComment');
  const text  = input?.value.trim();
  if (!text) { input?.focus(); return; }

  const btn = document.querySelector('.comment-submit');
  if (btn) { btn.disabled = true; btn.textContent = 'Posting...'; }

  try {
    const res = await fetch('/.netlify/functions/post-comment', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${currentSession.access_token}`
      },
      body: JSON.stringify({ thread_id: activeThreadId, body: text })
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to post');

    // Re-render thread with new comment
    await openThread(activeThreadId);

  } catch (err) {
    alert('Failed to post comment: ' + err.message);
    if (btn) { btn.disabled = false; btn.textContent = 'Reply'; }
  }
}

// ─────────────────────────────────────────────
// FILTER BY SPECIALTY
// ─────────────────────────────────────────────
function filterBySpecialty(specialty) {
  activeSpecialty = specialty;
  // Update filter pills
  document.querySelectorAll('.forum-filter').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.specialty === specialty);
  });
  loadThreads(specialty);
}

// ─────────────────────────────────────────────
// FILTER PILLS
// ─────────────────────────────────────────────
document.querySelectorAll('.forum-filter').forEach(btn => {
  btn.addEventListener('click', () => {
    filterBySpecialty(btn.dataset.specialty);
  });
});

// ─────────────────────────────────────────────
// CHAR COUNTER
// ─────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  const body    = document.getElementById('threadBody');
  const counter = document.getElementById('charCount');
  if (body && counter) {
    body.addEventListener('input', () => {
      counter.textContent = body.value.length;
    });
  }

  // Close modals on overlay click
  document.getElementById('postModal').addEventListener('click', e => {
    if (e.target === document.getElementById('postModal')) closePostModal();
  });
  document.getElementById('threadModal').addEventListener('click', e => {
    if (e.target === document.getElementById('threadModal')) closeThreadModal();
  });
});

// ─────────────────────────────────────────────
// UTILITIES
// ─────────────────────────────────────────────
function formatTimeAgo(iso) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins  = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days  = Math.floor(diff / 86400000);
  if (mins  < 1)  return 'just now';
  if (mins  < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days  < 7)  return `${days}d ago`;
  return new Date(iso).toLocaleDateString();
}

function escapeHtml(str) {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// ─────────────────────────────────────────────
// BOOTSTRAP
// ─────────────────────────────────────────────
initAuth().then(() => loadThreads());