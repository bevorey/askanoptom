/* =============================================
   ASKANOPTOM.COM — Main JS
   ============================================= */

// Fill the search input with a suggested question
function fillSearch(text) {
  const input = document.getElementById('searchInput');
  if (!input) return;
  input.value = text;
  input.focus();
}

// Handle search submission
// RIGHT NOW: redirects to question.html with the query in the URL
// LATER: this is where you'll call your Node.js backend API
function handleSearch() {
  const input = document.getElementById('searchInput');
  if (!input) return;

  const query = input.value.trim();
  if (!query) {
    input.focus();
    return;
  }

  // Encode the question and pass it to the question page via URL
  const encoded = encodeURIComponent(query);
  window.location.href = `question.html?q=${encoded}`;
}

// Allow pressing Enter to search
document.addEventListener('DOMContentLoaded', () => {
  const input = document.getElementById('searchInput');
  if (input) {
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') handleSearch();
    });
  }
});
