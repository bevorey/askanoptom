/* =============================================
   ASKANOPTOM.COM — Professionals Page JS
   ============================================= */

function handleWaitlist() {
  const input   = document.getElementById('waitlistEmail');
  const confirm = document.getElementById('waitlistConfirm');
  const email   = input.value.trim();

  if (!email || !email.includes('@')) {
    input.focus();
    input.style.borderColor = 'var(--amber)';
    return;
  }

  // For now: show confirmation message
  // Later: POST to a Netlify function or Mailchimp/ConvertKit API
  input.style.display  = 'none';
  document.querySelector('.waitlist-btn').style.display = 'none';
  confirm.style.display = 'block';

  console.log('Waitlist signup:', email);
  // TODO: connect to email list (Mailchimp, ConvertKit, or a Netlify function)
}

// Allow Enter key on the input
document.addEventListener('DOMContentLoaded', () => {
  const input = document.getElementById('waitlistEmail');
  if (input) {
    input.addEventListener('keydown', e => {
      if (e.key === 'Enter') handleWaitlist();
    });
  }
});
