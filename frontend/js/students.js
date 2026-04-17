/* =============================================
   ASKANOPTOM.COM — Students Page JS
   ============================================= */

// ─────────────────────────────────────────────
// SEARCH — sends to student answer page
// The student answer page uses a different
// Netlify function (ask-student) with a
// student-tuned system prompt
// ─────────────────────────────────────────────
function fillSearch(text) {
  const input = document.getElementById('searchInput');
  if (!input) return;
  input.value = text;
  input.focus();
}

function handleSearch() {
  const input = document.getElementById('searchInput');
  const query = input.value.trim();
  if (!query) { input.focus(); return; }
  // Route to student-specific answer page
  window.location.href = `question-student.html?q=${encodeURIComponent(query)}`;
}

document.addEventListener('DOMContentLoaded', () => {
  const input = document.getElementById('searchInput');
  if (input) {
    input.addEventListener('keydown', e => {
      if (e.key === 'Enter') handleSearch();
    });
  }
});

// ─────────────────────────────────────────────
// DISCUSSION — upvotes, expand threads, reply
// ─────────────────────────────────────────────
function upvote(btn) {
  if (btn.classList.contains('voted')) return;
  const num = parseInt(btn.textContent.replace('▲', '').trim());
  btn.textContent = `▲ ${num + 1}`;
  btn.classList.add('voted');
}

function expandThread(btn) {
  // For now — scroll to the ask tool as a nudge to use it
  // Later: expand the thread inline or navigate to a thread page
  const searchInput = document.getElementById('searchInput');
  if (searchInput) {
    searchInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
    searchInput.focus();
  }
}

function handleReply(btn) {
  const row   = btn.closest('.reply-input-row');
  const input = row.querySelector('.reply-input');
  const text  = input.value.trim();
  if (!text) { input.focus(); return; }

  // Build a new reply element
  const repliesContainer = btn.closest('.thread-expanded').querySelector('.thread-replies');
  const reply = document.createElement('div');
  reply.className = 'reply';
  reply.style.animation = 'fadeIn 0.3s ease both';
  reply.innerHTML = `
    <div class="reply-avatar" style="background:var(--teal);">You</div>
    <div class="reply-body">
      <div class="reply-meta">
        <span class="reply-author">You</span>
        <span class="reply-time">just now</span>
      </div>
      <p class="reply-text">${text}</p>
      <button class="reply-upvote" onclick="upvote(this)">▲ 0</button>
    </div>`;
  repliesContainer.appendChild(reply);
  input.value = '';
  reply.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

// ─────────────────────────────────────────────
// WAITLIST
// ─────────────────────────────────────────────
function handleStuWaitlist() {
  const input   = document.getElementById('stuWaitlistEmail');
  const confirm = document.getElementById('stuWaitlistConfirm');
  const email   = input.value.trim();

  if (!email || !email.includes('@')) {
    input.style.borderColor = 'var(--amber)';
    input.focus();
    return;
  }

  input.style.display  = 'none';
  document.querySelector('.waitlist-btn').style.display = 'none';
  confirm.style.display = 'block';
  console.log('Student waitlist signup:', email);
  // TODO: wire to email list
}
