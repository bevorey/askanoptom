/* =============================================
   ASKANOPTOM — Consultants directory
   Add a consultant = add one object to CONSULTANTS.
   ============================================= */

// Where "Book a scoping call" buttons go when a consultant has no
// bookingUrl of their own. TODO: create a separate Calendly event type
// for business scoping calls (not the $39.99 patient consultation).
const CONSULTING_BOOKING_URL = '';
// Fallback contact if no booking link is set yet. TODO: add consulting email.
const CONSULTING_EMAIL = '';

const CONSULTANTS = [
  {
    id: 'bevon-babwah',
    featured: true,
    name: 'Dr. Bevon R. Babwah',
    credentials: 'BSc Optom (Hons.), MCOptom (U.K.), Doctor of Optometry (O.D.)',
    title: 'Consultant Optometrist & Contact Lens Practitioner',
    role: 'Founder, askanoptom',
    initials: 'BB',
    photo: 'img/consultants/bevon-babwah.jpg',            // e.g. 'img/consultants/bevon.jpg'
    summary: 'Operations, systems, standards, applied AI',
    bio: 'Background in high-volume clinical practice, clinical systems design and practice operations across the Caribbean, licensed in multiple Caribbean jurisdictions. Builder of askanoptom, an AI-assisted eye care platform for patients, students and professionals.',
    focus: [
      'Practice operations',
      'Clinical systems & SOPs',
      'International standards',
      'Applied AI',
      'Brand & sales',
      'Contact lenses'
    ],
    // Optional proof points — shown only when filled in.
    // e.g. { value: '12', label: 'Clinics set up or restructured' }
    stats: [],
    bookingUrl: '',       // falls back to CONSULTING_BOOKING_URL
    profilePdf: ''        // optional downloadable profile
  }
  // Next consultants go here, e.g.
  // { id: 'adrian', featured: false, name: '…', title: '…', summary: '…', initials: 'AH', … }
];

/* ---------- rendering ---------- */

function esc(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function bookingHref(c) {
  if (c && c.bookingUrl) return c.bookingUrl;
  if (CONSULTING_BOOKING_URL) return CONSULTING_BOOKING_URL;
  if (CONSULTING_EMAIL) return 'mailto:' + CONSULTING_EMAIL + '?subject=Consulting%20enquiry';
  return '#contact';
}

function linkAttrs(href) {
  return /^https?:/.test(href) ? ' target="_blank" rel="noopener"' : '';
}

function avatar(c, cls) {
  if (c.photo) {
    return `<img class="${cls}" src="${esc(c.photo)}" alt="Portrait of ${esc(c.name)}">`;
  }
  return `<div class="${cls} ct-avatar-initials" aria-hidden="true">${esc(c.initials || '')}</div>`;
}

function renderFeatured(c) {
  const href = bookingHref(c);
  const stats = (c.stats || []).length
    ? `<div class="ct-stats">${c.stats.map(s =>
        `<div><div class="ct-stat-value">${esc(s.value)}</div><div class="ct-stat-label">${esc(s.label)}</div></div>`
      ).join('')}</div>`
    : '';
  const pdf = c.profilePdf
    ? `<a class="ct-btn-ghost" href="${esc(c.profilePdf)}" download>Download profile (PDF)</a>`
    : '';
  return `
    <div class="ct-featured-photo">
      ${avatar(c, 'ct-featured-img')}
      <span class="ct-featured-tag">Featured consultant</span>
    </div>
    <div class="ct-featured-body">
      <div>
        <h2 class="ct-featured-name" id="featured-name">${esc(c.name)}</h2>
        <p class="ct-featured-creds">${esc(c.credentials)}</p>
        <p class="ct-featured-title">${esc(c.title)}${c.role ? ' · ' + esc(c.role) : ''}</p>
      </div>
      <p class="ct-featured-bio">${esc(c.bio)}</p>
      <div class="ct-tags">${(c.focus || []).map(f => `<span class="ct-tag">${esc(f)}</span>`).join('')}</div>
      ${stats}
      <div class="ct-actions">
        <a class="ct-btn" href="${esc(href)}"${linkAttrs(href)}>Book a scoping call with ${esc(c.name.replace(/^Dr\.\s*/, '').split(' ')[0])} →</a>
        ${pdf}
      </div>
    </div>`;
}

function renderCard(c) {
  const href = bookingHref(c);
  return `
    <article class="ct-card">
      ${avatar(c, 'ct-card-img')}
      <div class="ct-card-text">
        <h3 class="ct-card-name">${esc(c.name)}</h3>
        <p class="ct-card-summary">${esc(c.summary || c.title)}</p>
        <a class="consult-card-link" href="${esc(href)}"${linkAttrs(href)}>Book a call →</a>
      </div>
    </article>`;
}

document.addEventListener('DOMContentLoaded', () => {
  const featured = CONSULTANTS.find(c => c.featured) || CONSULTANTS[0];
  const featuredEl = document.getElementById('featuredConsultant');
  const gridEl = document.getElementById('consultantGrid');

  if (featured && featuredEl) featuredEl.innerHTML = renderFeatured(featured);
  if (gridEl) {
    gridEl.innerHTML = CONSULTANTS.map(renderCard).join('') +
      `<article class="ct-card ct-card-soon">
         <div class="ct-card-img ct-avatar-initials" aria-hidden="true">+</div>
         <div class="ct-card-text">
           <h3 class="ct-card-name">More consultants joining soon</h3>
           <p class="ct-card-summary">Each with a distinct focus area.</p>
         </div>
       </article>`;
  }

  // Point every generic booking button at the featured consultant's link.
  const href = bookingHref(featured);
  document.querySelectorAll('[data-book]').forEach(a => {
    a.setAttribute('href', href);
    if (/^https?:/.test(href)) { a.target = '_blank'; a.rel = 'noopener'; }
  });
});
