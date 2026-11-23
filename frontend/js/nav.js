/* =============================================
   ASKANOPTOM — Nav dropdowns + drawer sections
   Desktop: hover (or click the chevron) opens a
   .nav-item's .nav-panel; the label link still
   goes to the hub page. Mobile: drawer sections
   expand/collapse.
   ============================================= */
(function () {
  const items = document.querySelectorAll('.nav-item.has-menu');
  let closeTimer = null;

  function setOpen(item, open) {
    item.classList.toggle('open', open);
    const btn = item.querySelector('.nav-menu-toggle');
    if (btn) btn.setAttribute('aria-expanded', open ? 'true' : 'false');
  }
  function closeAll(except) {
    items.forEach(i => { if (i !== except) setOpen(i, false); });
  }

  items.forEach(item => {
    const btn = item.querySelector('.nav-menu-toggle');
    const canHover = window.matchMedia('(hover: hover)').matches;

    if (canHover) {
      item.addEventListener('mouseenter', () => {
        clearTimeout(closeTimer);
        closeAll(item);
        setOpen(item, true);
      });
      item.addEventListener('mouseleave', () => {
        closeTimer = setTimeout(() => setOpen(item, false), 180);
      });
    }
    if (btn) {
      btn.addEventListener('click', e => {
        e.stopPropagation();
        const open = !item.classList.contains('open');
        closeAll(item);
        setOpen(item, open);
        if (open) {
          const first = item.querySelector('.nav-panel a');
          if (first && !canHover) first.focus();
        }
      });
    }
  });

  // Close on outside click and Escape
  document.addEventListener('click', e => {
    if (!e.target.closest('.nav-item.has-menu')) closeAll();
  });
  document.addEventListener('keydown', e => {
    if (e.key !== 'Escape') return;
    const open = document.querySelector('.nav-item.has-menu.open');
    if (open) {
      setOpen(open, false);
      const btn = open.querySelector('.nav-menu-toggle');
      if (btn) btn.focus();
    }
  });
  // Close when keyboard focus leaves the item
  items.forEach(item => {
    item.addEventListener('focusout', e => {
      if (!item.contains(e.relatedTarget)) setOpen(item, false);
    });
  });

  // "Ask" box inside panels and drawer
  document.querySelectorAll('form.panel-ask').forEach(form => {
    form.addEventListener('submit', e => {
      e.preventDefault();
      const q = form.querySelector('input').value.trim();
      if (!q) return form.querySelector('input').focus();
      window.location.href = 'question.html?q=' + encodeURIComponent(q);
    });
  });

  // Drawer sections
  document.querySelectorAll('.drawer-section-toggle').forEach(btn => {
    btn.addEventListener('click', () => {
      const section = btn.closest('.drawer-section');
      const open = !section.classList.contains('open');
      section.classList.toggle('open', open);
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
  });
})();