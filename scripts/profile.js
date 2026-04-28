export function loadProfileInterests() {
  const saved = JSON.parse(localStorage.getItem('selectedInterests') || '[]');
  const interestList = document.getElementById('interestList');
  const emptyState = document.getElementById('emptyState');

  if (!saved.length) {
    interestList.innerHTML = '';
    emptyState.style.display = 'block';
    return;
  }

  emptyState.style.display = 'none';
  interestList.innerHTML = saved.map(interest => `
    <span class="interest-chip">${interest}</span>
  `).join('');
}

document.addEventListener('DOMContentLoaded', loadProfileInterests);

if (typeof window !== 'undefined') {
  window.loadProfileInterests = loadProfileInterests;
}
