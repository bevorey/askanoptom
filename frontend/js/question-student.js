/* =============================================
   ASKANOPTOM.COM — Student Answer Page JS
   =============================================
   Same structure as question.js but:
   - calls /.netlify/functions/ask-student
   - no hardcoded answers (all go to AI)
   - routes related questions back to student page
   ============================================= */

const API_URL = '/.netlify/functions/ask-student';

// ─────────────────────────────────────────────
// API CALL
// ─────────────────────────────────────────────
async function fetchFromStudentAPI(question) {
  const res = await fetch(API_URL, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({ question })
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Server error');
  }
  return await res.json();
}

// ─────────────────────────────────────────────
// MAIN
// ─────────────────────────────────────────────
async function loadAnswer() {
  const params  = new URLSearchParams(window.location.search);
  const query   = params.get('q') || '';
  const loading = document.getElementById('loadingState');
  const content = document.getElementById('answerContent');

  if (query) document.title = `${query} — AskAnOptom Students`;

  try {
    const data = await fetchFromStudentAPI(query);
    loading.style.display = 'none';
    renderAnswer(query, data);
    content.style.display = 'block';
  } catch (err) {
    console.error('Student API error:', err.message);
    loading.style.display = 'none';
    renderError(query);
    content.style.display = 'block';
  }
}

// ─────────────────────────────────────────────
// RENDER
// ─────────────────────────────────────────────
function renderAnswer(query, data) {
  document.getElementById('qTitle').textContent = query || 'Your question';

  if (data.tags && data.tags.length) {
    document.getElementById('qMeta').innerHTML = data.tags
      .map(t => `<span class="answer-tag tag-${t.type}">${t.label}</span>`)
      .join('');
  }

  document.getElementById('qAnswerBody').innerHTML = data.answer || '';

  if (data.warning) {
    document.getElementById('qAnswerBody').insertAdjacentHTML('beforeend', `
      <div class="q-callout">
        <strong>Clinical pearl / exam tip:</strong> ${data.warning}
      </div>`);
  }

  if (data.sources && data.sources.length) {
    document.getElementById('qSources').innerHTML =
      `<span class="sources-label">sources</span>` +
      data.sources.map(s => `<span class="source-pill">${s}</span>`).join('');
  } else {
    document.getElementById('qSources').style.display = 'none';
  }

  if (data.related && data.related.length) {
    document.getElementById('relatedSection').style.display = 'block';
    document.getElementById('relatedChips').innerHTML = data.related
      .map(q => `<button class="related-chip" onclick="goToQuestion('${q.replace(/'/g, "\\'")}')">${q} →</button>`)
      .join('');
  }
}

function renderError(query) {
  document.getElementById('qTitle').textContent = query || 'Your question';
  document.getElementById('qMeta').innerHTML = '';
  document.getElementById('qAnswerBody').innerHTML = `
    <p>We weren't able to retrieve an answer right now.</p>
    <div class="q-callout">
      <strong>Try:</strong> Rephrasing your question, or
      <a href="students.html" style="color:var(--teal);text-decoration:underline;">return to the student hub</a>
      and try one of the suggested questions.
    </div>`;
  document.getElementById('qSources').style.display = 'none';
}

// ─────────────────────────────────────────────
// NAVIGATION
// ─────────────────────────────────────────────
function goToQuestion(q) {
  window.location.href = `question-student.html?q=${encodeURIComponent(q)}`;
}

function handleSearch() {
  const input = document.getElementById('searchInput');
  const query = input.value.trim();
  if (!query) { input.focus(); return; }
  window.location.href = `question-student.html?q=${encodeURIComponent(query)}`;
}

// ─────────────────────────────────────────────
// INIT
// ─────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  loadAnswer();

  const params = new URLSearchParams(window.location.search);
  const q      = params.get('q');
  const input  = document.getElementById('searchInput');
  if (q && input) input.value = q;

  if (input) {
    input.addEventListener('keydown', e => {
      if (e.key === 'Enter') handleSearch();
    });
  }
});
