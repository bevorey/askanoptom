/* =============================================
   ASKANOPTOM.COM — Question Page JS
   ============================================= */

// ─────────────────────────────────────────────
// HARDCODED ANSWERS (Phase 1 — no backend yet)
// Replace these with real API calls in Phase 3
// ─────────────────────────────────────────────
const HARDCODED_ANSWERS = {
  "what is keratoconus": {
    tags: [
      { label: "cornea & anterior segment", type: "blue" },
      { label: "clinically reviewed", type: "green" }
    ],
    body: `
      <p>Keratoconus is a progressive eye condition in which the cornea — the clear, dome-shaped front surface of the eye — gradually thins and bulges outward into an irregular, cone-like shape. The word comes from the Greek <em>keras</em> (cornea) and <em>konos</em> (cone).</p>
      <p>This distortion causes light entering the eye to scatter rather than focus precisely on the retina, leading to blurred and distorted vision that cannot be fully corrected with standard spectacles alone.</p>
      <h3>Who does it affect?</h3>
      <p>Keratoconus typically appears in late adolescence or early adulthood — most commonly between ages 10 and 25. It affects roughly 1 in 2,000 people globally.</p>
      <div class="q-callout"><strong>Risk factors include:</strong> a family history of keratoconus, chronic eye rubbing, Down syndrome, Marfan syndrome, and Ehlers-Danlos syndrome.</div>
      <h3>Symptoms</h3>
      <ul>
        <li>Blurred or distorted vision, especially at night</li>
        <li>Increased sensitivity to light and glare</li>
        <li>Frequent prescription changes in a short period</li>
        <li>Ghosting or double vision in one eye</li>
        <li>Halos around lights when driving</li>
      </ul>
      <div class="q-warning">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M8 2L15 13H1L8 2Z" stroke="currentColor" stroke-width="1.2" stroke-linejoin="round"/><path d="M8 7v3" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/><circle cx="8" cy="11.5" r="0.6" fill="currentColor"/></svg>
        Sudden severe pain, rapid vision loss, or corneal clouding may indicate acute hydrops — seek same-day optometric care immediately.
      </div>
      <h3>Treatment options</h3>
      <p>Management depends on severity — from spectacles and soft contact lenses in early stages, to rigid gas-permeable or scleral lenses in moderate cases, to corneal cross-linking (CXL) to halt progression, and corneal transplant in severe scarring.</p>
    `,
    sources: ["Krachmer et al. — Cornea (3rd ed.)", "AAO Preferred Practice Pattern", "reviewed by Dr. B. Reyaz, OD"],
    related: ["What are scleral lenses?", "What is corneal cross-linking?", "Is keratoconus hereditary?", "What is corneal topography?"]
  },
  "what causes dry eyes": {
    tags: [
      { label: "ocular surface", type: "blue" },
      { label: "clinically reviewed", type: "green" }
    ],
    body: `
      <p>Dry eye disease (DED) occurs when the eye either does not produce enough tears, or produces tears of poor quality that evaporate too quickly. The result is an unstable tear film that fails to adequately lubricate and protect the ocular surface.</p>
      <h3>Main causes</h3>
      <ul>
        <li><strong>Meibomian gland dysfunction (MGD)</strong> — the most common cause. The oil-producing glands along the eyelid margins become blocked, leading to rapid tear evaporation.</li>
        <li><strong>Age</strong> — tear production naturally decreases after age 40, and is more pronounced after menopause.</li>
        <li><strong>Screen use</strong> — prolonged screen time reduces blink rate significantly, causing tear evaporation.</li>
        <li><strong>Medications</strong> — antihistamines, antidepressants, diuretics, and some blood pressure medications can reduce tear production.</li>
        <li><strong>Environmental factors</strong> — air conditioning, low humidity, wind, and smoke.</li>
      </ul>
      <div class="q-callout"><strong>Tip:</strong> The 20-20-20 rule helps screen users — every 20 minutes, look at something 20 feet away for 20 seconds, and consciously blink fully.</div>
      <p>Diagnosis involves assessing tear break-up time (TBUT), Schirmer's test, and meibography. Treatment ranges from artificial tears and warm compresses to prescription drops (cyclosporine) and in-office procedures like LipiFlow.</p>
    `,
    sources: ["TFOS DEWS II Report 2017", "BCLA Clinical Practice Guide", "reviewed by Dr. B. Reyaz, OD"],
    related: ["What is MGD?", "How do I use eye drops properly?", "Can dry eyes cause blurred vision?", "What is the tear film?"]
  },
  "are blue light glasses worth it": {
    tags: [
      { label: "lenses & optics", type: "amber" },
      { label: "evidence-based", type: "blue" }
    ],
    body: `
      <p>Blue light glasses have become widely marketed as a solution for digital eye strain and sleep disruption. The evidence, however, is more nuanced than the marketing suggests.</p>
      <h3>What the evidence says</h3>
      <p>The American Academy of Ophthalmology (AAO) does not currently recommend blue light-blocking glasses for eye strain, as high-quality studies have not demonstrated they meaningfully reduce digital eye strain symptoms compared to standard lenses.</p>
      <div class="q-callout"><strong>The real culprit:</strong> Digital eye strain (asthenopia) is primarily caused by reduced blink rate during screen use, prolonged near focus, and uncorrected refractive error — not blue light wavelengths themselves.</div>
      <h3>Where there may be a benefit</h3>
      <p>There is some evidence that blue light in the evening can suppress melatonin and disrupt circadian rhythms. Using blue-blocking glasses or enabling "night mode" on devices 1–2 hours before bed may help with sleep quality — though this is separate from daytime eye strain.</p>
      <h3>Better alternatives for screen fatigue</h3>
      <ul>
        <li>Ensure your prescription is current and optimised for screen distance</li>
        <li>Use the 20-20-20 rule consistently</li>
        <li>Apply anti-reflective (AR) coating to your lenses — this has stronger evidence for reducing glare and strain</li>
        <li>Adjust screen brightness and contrast to match ambient lighting</li>
      </ul>
    `,
    sources: ["AAO Clinical Statement 2023", "Cochrane Review — Blue light filtering lenses 2022", "reviewed by Dr. B. Reyaz, OD"],
    related: ["What is anti-reflective coating?", "What causes digital eye strain?", "How often should I have an eye exam?"]
  }
};

// ─────────────────────────────────────────────
// UTILITY: Normalise a question for lookup
// ─────────────────────────────────────────────
function normalise(str) {
  return str.toLowerCase().replace(/[^a-z0-9 ]/g, '').trim();
}

// ─────────────────────────────────────────────
// UTILITY: Find the best matching hardcoded answer
// ─────────────────────────────────────────────
function findAnswer(query) {
  const q = normalise(query);
  // Exact match first
  if (HARDCODED_ANSWERS[q]) return HARDCODED_ANSWERS[q];
  // Partial match — does the query contain any key?
  for (const key of Object.keys(HARDCODED_ANSWERS)) {
    if (q.includes(key) || key.includes(q)) return HARDCODED_ANSWERS[key];
  }
  return null;
}

// ─────────────────────────────────────────────
// MAIN: Load the answer for the current URL
// ─────────────────────────────────────────────
function loadAnswer() {
  const params = new URLSearchParams(window.location.search);
  const query  = params.get('q') || '';

  // Update page title
  if (query) document.title = `${query} — AskAnOptom`;

  // Show loading dots briefly for realism (remove this once real API is live)
  const loading = document.getElementById('loadingState');
  const content = document.getElementById('answerContent');

  setTimeout(() => {
    loading.style.display = 'none';
    renderAnswer(query);
    content.style.display = 'block';
  }, 800); // simulated delay — replace with real API call later
}

// ─────────────────────────────────────────────
// RENDER: Inject answer into the DOM
// ─────────────────────────────────────────────
function renderAnswer(query) {
  const answer = findAnswer(query);

  // Set the question title
  const titleEl = document.getElementById('qTitle');
  titleEl.textContent = query || 'Your question';

  if (answer) {
    // Tags
    const metaEl = document.getElementById('qMeta');
    metaEl.innerHTML = answer.tags.map(t =>
      `<span class="answer-tag tag-${t.type}">${t.label}</span>`
    ).join('');

    // Answer body (HTML)
    document.getElementById('qAnswerBody').innerHTML = answer.body;

    // Sources
    const sourcesEl = document.getElementById('qSources');
    sourcesEl.innerHTML = `<span class="sources-label">sources</span>` +
      answer.sources.map(s => `<span class="source-pill">${s}</span>`).join('');

    // Related questions
    if (answer.related && answer.related.length) {
      const relSection = document.getElementById('relatedSection');
      const relChips   = document.getElementById('relatedChips');
      relSection.style.display = 'block';
      relChips.innerHTML = answer.related.map(q =>
        `<button class="related-chip" onclick="goToQuestion('${q}')">${q} →</button>`
      ).join('');
    }

  } else {
    // Fallback for questions we don't have yet
    document.getElementById('qAnswerBody').innerHTML = `
      <p>We don't have a curated answer for this question yet — our knowledge base is growing as Dr. Reyaz adds more content.</p>
      <div class="q-callout">
        <strong>In the meantime:</strong> For clinical concerns, please consult a licensed optometrist.
        You can also <a href="index.html" style="color:var(--teal);text-decoration:underline;">try a different question</a> — conditions like keratoconus, dry eye, and blue light glasses are already covered.
      </div>
    `;
    document.getElementById('qSources').style.display = 'none';
  }
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

  // Pre-fill search with current question
  const params = new URLSearchParams(window.location.search);
  const q = params.get('q');
  const input = document.getElementById('searchInput');
  if (q && input) input.value = q;

  // Enter key
  if (input) {
    input.addEventListener('keydown', e => {
      if (e.key === 'Enter') handleSearch();
    });
  }
});

/*
 * ─────────────────────────────────────────────
 * PHASE 3 — SWAP THIS IN WHEN YOUR BACKEND IS READY
 * ─────────────────────────────────────────────
 * Replace the setTimeout in loadAnswer() with this:
 *
 * async function fetchFromAPI(query) {
 *   const res = await fetch('https://your-backend.railway.app/ask', {
 *     method: 'POST',
 *     headers: { 'Content-Type': 'application/json' },
 *     body: JSON.stringify({ question: query })
 *   });
 *   const data = await res.json();
 *   return data; // { answer, sources, related }
 * }
 *
 * Then call fetchFromAPI(query) instead of findAnswer(query).
 * ─────────────────────────────────────────────
 */
