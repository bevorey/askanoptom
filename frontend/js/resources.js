/* =============================================
   ASKANOPTOM.COM — Resources Page JS
   ============================================= */

// ─────────────────────────────────────────────
// TAB SWITCHING
// ─────────────────────────────────────────────
function initTabs() {
  const tabs   = document.querySelectorAll('.filter-tab');
  const panels = document.querySelectorAll('.panel');

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const target = tab.dataset.filter;

      // Update tab active state
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');

      // Show the matching panel, hide others
      panels.forEach(panel => {
        if (panel.id === `panel-${target}`) {
          panel.classList.remove('hidden');
        } else {
          panel.classList.add('hidden');
        }
      });

      // Update URL hash so the tab persists on refresh
      history.replaceState(null, '', `#${target}`);
    });
  });
}

// ─────────────────────────────────────────────
// RESTORE TAB FROM URL HASH
// e.g. resources.html#students opens the students tab
// ─────────────────────────────────────────────
function restoreTabFromHash() {
  const hash   = window.location.hash.replace('#', '');
  const valid  = ['patients', 'students', 'professionals'];

  if (hash && valid.includes(hash)) {
    const tab = document.querySelector(`[data-filter="${hash}"]`);
    if (tab) tab.click();
  }
}

// ─────────────────────────────────────────────
// INIT
// ─────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  initTabs();
  restoreTabFromHash();
});
