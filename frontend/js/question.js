/* =============================================
   ASKANOPTOM.COM — Question Page JS
   =============================================
   Phase 2: calls the real Node.js backend.
   Hardcoded answers kept as instant fallback
   while the backend is offline or being built.
   ============================================= */

// ─────────────────────────────────────────────
// CONFIG
// Change this to your Railway URL when deployed
// ─────────────────────────────────────────────
// Points to the Netlify function via the redirect in netlify.toml
// Works identically on localhost (with netlify dev) and in production
const API_URL = '/api/ask';

// ─────────────────────────────────────────────
// HARDCODED ANSWERS — instant fallback
// Served immediately if the backend is offline.
// Keep adding to these as Bevon reviews content.
// ─────────────────────────────────────────────
const HARDCODED_ANSWERS = {
  "what is keratoconus": {
    tags: [
      { label: "cornea & anterior segment", type: "blue" },
      { label: "clinically reviewed", type: "green" }
    ],
    answer: `
      <p>Keratoconus is a progressive eye condition in which the cornea — the clear, dome-shaped front surface of the eye — gradually thins and bulges outward into an irregular, cone-like shape.</p>
      <p>This distortion causes light entering the eye to scatter rather than focus precisely on the retina, leading to blurred and distorted vision that cannot be fully corrected with standard spectacles alone.</p>
      <p>It typically appears in late adolescence or early adulthood and affects roughly 1 in 2,000 people globally. Risk factors include chronic eye rubbing, a family history of the condition, and certain systemic syndromes.</p>
    `,
    warning: "Sudden severe pain, rapid vision loss, or corneal clouding may indicate acute hydrops — seek same-day optometric care immediately.",
    sources: ["Krachmer et al. — Cornea (3rd ed.)", "AAO Preferred Practice Pattern", "reviewed by Dr. B. Reyaz, OD"],
    related: ["What are scleral lenses?", "What is corneal cross-linking?", "Is keratoconus hereditary?"]
  },
  "what causes dry eyes": {
    tags: [
      { label: "ocular surface", type: "blue" },
      { label: "clinically reviewed", type: "green" }
    ],
    answer: `
      <p>Dry eye disease occurs when the eye either does not produce enough tears, or produces tears of poor quality that evaporate too quickly, leaving an unstable tear film.</p>
      <p>The most common cause is <strong>meibomian gland dysfunction (MGD)</strong> — the oil-producing glands along the eyelid margins become blocked, leading to rapid tear evaporation. Other causes include age, prolonged screen use, certain medications like antihistamines, and environmental factors like air conditioning and low humidity.</p>
    `,
    warning: null,
    sources: ["TFOS DEWS II Report 2017", "BCLA Clinical Practice Guide", "reviewed by Dr. B. Reyaz, OD"],
    related: ["What is meibomian gland dysfunction?", "How do I use eye drops properly?", "Can dry eyes cause blurred vision?"]
  },
  "are blue light glasses worth it": {
    tags: [
      { label: "lenses & optics", type: "amber" },
      { label: "clinically reviewed", type: "green" }
    ],
    answer: `
      <p>Blue light glasses have been widely marketed for digital eye strain. The evidence, however, does not strongly support this. The American Academy of Ophthalmology does not currently recommend blue light-blocking glasses specifically for eye strain reduction.</p>
      <p>Digital eye strain is primarily caused by reduced blink rate during screen use and prolonged near focus — not blue light itself. Anti-reflective (AR) coating has stronger evidence for reducing screen-related glare.</p>
      <p>Where blue light blocking may genuinely help is <strong>sleep quality</strong> — using blue-blocking lenses or night mode on devices 1–2 hours before bed can reduce melatonin suppression.</p>
    `,
    warning: null,
    sources: ["AAO Clinical Statement 2023", "Cochrane Review — Blue light filtering lenses 2022", "reviewed by Dr. B. Reyaz, OD"],
    related: ["What is anti-reflective coating?", "What causes digital eye strain?", "How often should I have an eye exam?"]
  }
};

// ─────────────────────────────────────────────
// UTILITY: normalise question for lookup
// ─────────────────────────────────────────────
function normalise(str) {
  return str.toLowerCase().replace(/[^a-z0-9 ]/g, '').trim();
}

function findHardcoded(query) {
  const q = normalise(query);
  if (HARDCODED_ANSWERS[q]) return HARDCODED_ANSWERS[q];
  for (const key of Object.keys(HARDCODED_ANSWERS)) {
    if (q.includes(key) || key.includes(q)) return HARDCODED_ANSWERS[key];
  }
  return null;
}

// ─────────────────────────────────────────────
// API CALL
// ─────────────────────────────────────────────
async function fetchFromAPI(question) {
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

  if (query) document.title = `${query} — AskAnOptom`;

  // 1. Check hardcoded first — instant, no network needed
  const hardcoded = findHardcoded(query);
  if (hardcoded) {
    loading.style.display = 'none';
    renderAnswer(query, hardcoded);
    content.style.display = 'block';
    return;
  }

  // 2. Call the real API
  try {
    const data = await fetchFromAPI(query);
    loading.style.display = 'none';
    renderAnswer(query, data);
    content.style.display = 'block';
  } catch (err) {
    console.error('API error:', err.message);
    loading.style.display = 'none';
    renderError(query);
    content.style.display = 'block';
  }
}

// ─────────────────────────────────────────────
// RENDER: successful answer
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
      <div class="q-warning">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path d="M8 2L15 13H1L8 2Z" stroke="currentColor" stroke-width="1.2" stroke-linejoin="round"/>
          <path d="M8 7v3" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/>
          <circle cx="8" cy="11.5" r="0.6" fill="currentColor"/>
        </svg>
        ${data.warning}
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

// ─────────────────────────────────────────────
// RENDER: error state
// ─────────────────────────────────────────────
function renderError(query) {
  document.getElementById('qTitle').textContent = query || 'Your question';
  document.getElementById('qMeta').innerHTML = '';
  document.getElementById('qAnswerBody').innerHTML = `
    <p>We weren't able to retrieve an answer right now.</p>
    <div class="q-callout">
      <strong>What you can do:</strong> Try rephrasing your question, or
      <a href="index.html" style="color:var(--teal);text-decoration:underline;">return to the homepage</a>
      and try a suggested question. For urgent concerns, please consult a licensed optometrist.
    </div>`;
  document.getElementById('qSources').style.display = 'none';
}

// ─────────────────────────────────────────────
// NAVIGATION
// ─────────────────────────────────────────────
function goToQuestion(q) {
  window.location.href = `question.html?q=${encodeURIComponent(q)}`;
}

function handleSearch() {
  const input = document.getElementById('searchInput');
  const query = input.value.trim();
  if (!query) { input.focus(); return; }
  window.location.href = `question.html?q=${encodeURIComponent(query)}`;
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