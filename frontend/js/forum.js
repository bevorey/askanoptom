/* =============================================
   ASKANOPTOM.COM — Forum JS
   Inline expand thread design
   ============================================= */

let sb              = null;
let currentUser     = null;
let currentSession  = null;
let activeSpecialty = 'all';
let expandedThreadId = null;

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
  const authCard = document.getElementById('authCard');
  const userCard = document.getElementById('userCard');
  const navAuth  = document.getElementById('navAuth');

  if (signedIn && currentUser) {
    const name     = currentUser.user_metadata?.full_name || currentUser.email?.split('@')[0] || 'You';
    const initials = name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
    const displayName = 'Dr. ' + (name.trim().split(' ')[0]?.[0]?.toUpperCase() || '?');

    authCard?.classList.add('hidden');
    userCard?.classList.remove('hidden');
    const avatarEl = document.getElementById('userAvatar');
    const nameEl   = document.getElementById('userName');
    if (avatarEl) avatarEl.textContent = initials;
    if (nameEl)   nameEl.textContent   = name;

    if (navAuth) navAuth.innerHTML = `
      <div class="nav-auth-avatar">${initials}</div>
      <span class="nav-auth-name">${displayName}</span>`;
  } else {
    authCard?.classList.remove('hidden');
    userCard?.classList.add('hidden');
    if (navAuth) navAuth.innerHTML = `<button class="nav-signin-btn" onclick="signInWithGoogle()">Sign in</button>`;
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
  if (loading) loading.style.display = 'flex';

  try {
    const url = specialty === 'all'
      ? '/.netlify/functions/get-threads'
      : `/.netlify/functions/get-threads?specialty=${encodeURIComponent(specialty)}`;

    const res  = await fetch(url);
    const data = await res.json();

    if (loading) loading.style.display = 'none';

    if (!data.threads || data.threads.length === 0) {
      feed.innerHTML = `
        <div class="forum-empty">
          <div class="forum-empty-title">No cases yet${specialty !== 'all' ? ' in ' + specialty : ''}</div>
          <div class="forum-empty-sub">Be the first to post a case and start the discussion.</div>
        </div>`;
      return;
    }

    feed.innerHTML = '';
    data.threads.forEach((thread, index) => {
      const wrapper = document.createElement('div');
      wrapper.className = 'thread-wrapper';
      wrapper.id = `wrapper-${thread.id}`;

      const card = renderThreadCard(thread);
      wrapper.appendChild(card);

      const panel = document.createElement('div');
      panel.className = 'thread-expand-panel hidden';
      panel.id = `panel-${thread.id}`;
      wrapper.appendChild(panel);

      feed.appendChild(wrapper);

      // Auto-expand first thread — delay to ensure session is loaded
      if (index === 0) {
        setTimeout(() => expandThread(thread.id), 300);
      }
    });

  } catch (err) {
    if (loading) loading.style.display = 'none';
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
  card.id = `card-${thread.id}`;
  card.onclick = () => toggleThread(thread.id);

  const author   = thread.profiles;
  const name     = formatAuthorName(author);
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
    <div class="thread-card-body thread-card-preview">${escapeHtml(thread.body)}</div>
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
// TOGGLE / EXPAND THREAD INLINE
// ─────────────────────────────────────────────
async function toggleThread(threadId) {
  const panel = document.getElementById(`panel-${threadId}`);
  const card  = document.getElementById(`card-${threadId}`);
  if (!panel) return;

  const isOpen = !panel.classList.contains('hidden');

  if (expandedThreadId && expandedThreadId !== threadId) {
    const oldPanel = document.getElementById(`panel-${expandedThreadId}`);
    const oldCard  = document.getElementById(`card-${expandedThreadId}`);
    if (oldPanel) oldPanel.classList.add('hidden');
    if (oldCard) {
      oldCard.classList.remove('thread-card-active');
      oldCard.querySelector('.thread-card-preview')?.classList.remove('thread-card-expanded');
    }
  }

  if (isOpen) {
    panel.classList.add('hidden');
    card?.classList.remove('thread-card-active');
    card?.querySelector('.thread-card-preview')?.classList.remove('thread-card-expanded');
    expandedThreadId = null;
  } else {
    expandedThreadId = threadId;
    card?.classList.add('thread-card-active');
    card?.querySelector('.thread-card-preview')?.classList.add('thread-card-expanded');
    panel.classList.remove('hidden');
    panel.innerHTML = `
      <div class="forum-loading" style="padding:1.5rem;">
        <div class="loading-dots"><span></span><span></span><span></span></div>
        <p class="loading-text">Loading discussion...</p>
      </div>`;
    await loadThreadDetail(threadId, panel);
  }
}

async function expandThread(threadId) {
  expandedThreadId = threadId;
  const card  = document.getElementById(`card-${threadId}`);
  const panel = document.getElementById(`panel-${threadId}`);
  if (!panel) return;
  card?.classList.add('thread-card-active');
  card?.querySelector('.thread-card-preview')?.classList.add('thread-card-expanded');
  panel.classList.remove('hidden');
  panel.innerHTML = `
    <div class="forum-loading" style="padding:1.5rem;">
      <div class="loading-dots"><span></span><span></span><span></span></div>
      <p class="loading-text">Loading discussion...</p>
    </div>`;
  await loadThreadDetail(threadId, panel);
}

async function loadThreadDetail(threadId, panel) {
  try {
    const headers = {};
    if (currentSession?.access_token) {
      headers['Authorization'] = `Bearer ${currentSession.access_token}`;
    }
    const res  = await fetch(`/.netlify/functions/get-threads?thread_id=${threadId}`, { headers });
    const data = await res.json();
    renderThreadDetail(data.thread, data.comments || [], panel);
  } catch (err) {
    panel.innerHTML = `<p style="padding:1rem;color:var(--text-tertiary);font-size:13px;">Couldn't load this case. Please try again.</p>`;
  }
}

// ─────────────────────────────────────────────
// RENDER THREAD DETAIL (inline panel)
// matches student discussion style
// ─────────────────────────────────────────────
function renderThreadDetail(thread, comments, panel) {
  const author  = thread.profiles;
  const name    = formatAuthorName(author);
  const cred    = author?.credential || '';
  const country = author?.country    || '';
  const timeAgo = formatTimeAgo(thread.created_at);
  const initials = name.replace(/[^A-Z]/g, '').substring(0, 2) || 'DR';

  const commentsHtml = comments.length === 0
    ? '<p style="font-size:13px;color:var(--text-tertiary);padding:0.5rem 0 1rem;">No replies yet — be the first to contribute.</p>'
    : comments.map(c => {
        const ca      = c.profiles;
        const cn      = formatAuthorName(ca);
        const cc      = ca?.credential || '';
        const ccountry = ca?.country  || '';
        const ci      = cn.replace(/[^A-Z]/g, '').substring(0, 2) || 'DR';
        const votes   = c.upvotes || 0;
        const voted   = c.user_has_voted ? 'vote-btn-active' : '';
        return `
          <div class="expand-reply">
            <div class="expand-reply-avatar">${ci}</div>
            <div class="expand-reply-body">
              <div class="expand-reply-meta">
                <span class="expand-reply-author">${escapeHtml(cn)}</span>
                ${cc ? `<span class="expand-reply-cred">${escapeHtml(cc)}${ccountry ? ' · ' + ccountry : ''}</span>` : ''}
                <span class="expand-reply-time">${formatTimeAgo(c.created_at)}</span>
              </div>
              <p class="expand-reply-text">${escapeHtml(c.body)}</p>
              <button class="vote-btn ${voted}" id="vote-${c.id}" onclick="toggleVote('${c.id}', this)">
                ▲ <span class="vote-count">${votes}</span>
              </button>
            </div>
          </div>`;
      }).join('');

  const replyArea = currentUser
    ? `<div class="expand-input-row">
        <div class="expand-input-avatar">${
          (currentUser.user_metadata?.full_name || currentUser.email || 'You')
            .substring(0, 2).toUpperCase()
        }</div>
        <input type="text" class="expand-input" id="reply-${thread.id}"
          placeholder="Share your clinical reasoning…" />
        <button class="expand-reply-btn" onclick="submitInlineComment('${thread.id}', this)">Reply</button>
       </div>`
    : `<div class="expand-signin">
        <button onclick="signInWithGoogle()">Sign in with Google</button> to add your clinical perspective.
       </div>`;

  panel.innerHTML = `
    <div class="thread-expand-inner">
      <div class="expand-replies">
        ${commentsHtml}
      </div>
      ${replyArea}
    </div>`;
}

// ─────────────────────────────────────────────
// POST COMMENT (inline)
// ─────────────────────────────────────────────
async function submitInlineComment(threadId, btn) {
  if (!currentUser || !currentSession) return;

  const input = document.getElementById(`reply-${threadId}`);
  const text  = input?.value.trim();
  if (!text) { input?.focus(); return; }

  btn.disabled    = true;
  btn.textContent = 'Posting...';

  try {
    const res = await fetch('/.netlify/functions/post-comment', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${currentSession.access_token}`
      },
      body: JSON.stringify({ thread_id: threadId, body: text })
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to post');

    // reload the panel
    const panel = document.getElementById(`panel-${threadId}`);
    if (panel) await loadThreadDetail(threadId, panel);

  } catch (err) {
    alert('Failed to post comment: ' + err.message);
    btn.disabled    = false;
    btn.textContent = 'Reply';
  }
}

// ─────────────────────────────────────────────
// POST THREAD MODAL
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

  const titleEl     = document.getElementById('threadTitle');
  const specialtyEl = document.getElementById('threadSpecialty');
  const bodyEl      = document.getElementById('threadBody');
  const btn         = document.getElementById('btnSubmitThread');

  const title    = titleEl.value.trim();
  const specialty = specialtyEl.value;
  const body     = bodyEl.value.trim();

  if (!title || !body) {
    alert('Please fill in the title and case details.');
    return;
  }

  if (btn) { btn.disabled = true; btn.textContent = 'Posting...'; }

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

    titleEl.value = '';
    bodyEl.value  = '';
    closePostModal();
    setTimeout(() => loadThreads(activeSpecialty), 300);

  } catch (err) {
    alert('Failed to post case: ' + err.message);
    if (btn) { btn.disabled = false; btn.textContent = 'Post case'; }
  }
}

// ─────────────────────────────────────────────
// SPECIALTY FILTER
// ─────────────────────────────────────────────
function filterBySpecialty(specialty) {
  activeSpecialty = specialty;
  document.querySelectorAll('.forum-filter').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.specialty === specialty);
  });
  loadThreads(specialty);
}

document.querySelectorAll('.forum-filter').forEach(btn => {
  btn.addEventListener('click', () => filterBySpecialty(btn.dataset.specialty));
});

// ─────────────────────────────────────────────
// CHAR COUNTER + MODAL OVERLAY CLOSE
// ─────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  const bodyEl  = document.getElementById('threadBody');
  const counter = document.getElementById('charCount');
  if (bodyEl && counter) {
    bodyEl.addEventListener('input', () => { counter.textContent = bodyEl.value.length; });
  }
  document.getElementById('postModal')?.addEventListener('click', e => {
    if (e.target === document.getElementById('postModal')) closePostModal();
  });
});

// ─────────────────────────────────────────────
// FORMAT AUTHOR NAME
// Shows "Dr. K" for privacy — first initial only
// ─────────────────────────────────────────────
function formatAuthorName(profile) {
  if (!profile) return 'Anonymous';
  const name     = profile.full_name || '';
  const cred     = profile.credential || '';
  const first    = name.trim().split(' ')[0] || '';
  const initial  = first[0]?.toUpperCase() || '?';
  const isDoc    = cred.toLowerCase().includes('od') ||
                   cred.toLowerCase().includes('dr') ||
                   cred.toLowerCase().includes('mbbs') ||
                   cred.toLowerCase().includes('md');
  return isDoc ? `Dr. ${initial}` : initial + '.';
}

// ─────────────────────────────────────────────
// UTILITIES
// ─────────────────────────────────────────────
function formatTimeAgo(iso) {
  const diff  = Date.now() - new Date(iso).getTime();
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
// TOGGLE VOTE
// ─────────────────────────────────────────────
async function toggleVote(commentId, btn) {
  if (!currentUser || !currentSession) {
    signInWithGoogle();
    return;
  }

  const countEl = btn.querySelector('.vote-count');
  const current = parseInt(countEl.textContent) || 0;
  const voted   = btn.classList.contains('vote-btn-active');

  // Optimistic update
  btn.classList.toggle('vote-btn-active');
  countEl.textContent = voted ? Math.max(current - 1, 0) : current + 1;
  btn.disabled = true;

  try {
    const res = await fetch('/.netlify/functions/toggle-vote', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${currentSession.access_token}`
      },
      body: JSON.stringify({ comment_id: commentId })
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Vote failed');

    // Use server count as source of truth
    if (typeof data.upvotes === 'number') {
      countEl.textContent = data.upvotes;
    }

  } catch (err) {
    // Revert on failure
    btn.classList.toggle('vote-btn-active');
    countEl.textContent = current;
    console.error('Vote error:', err.message);
  } finally {
    btn.disabled = false;
  }
}

// ─────────────────────────────────────────────
// BOOTSTRAP
// ─────────────────────────────────────────────
async function bootstrap() {
  try {
    const res    = await fetch('/.netlify/functions/get-config');
    const config = await res.json();
    sb = window.supabase.createClient(config.supabaseUrl, config.supabaseAnon);
  } catch (err) {
    console.error('Failed to load config:', err);
    const loading = document.getElementById('feedLoading');
    if (loading) loading.innerHTML =
      '<p style="color:var(--text-tertiary);font-size:13px;">Could not connect to the forum. Please try refreshing.</p>';
    return;
  }
  await initAuth();
  await loadThreads();
}

bootstrap();