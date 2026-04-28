export const onboardingState = {
  selectedInterests: []
};

export function loadOnboardingSelection() {
  onboardingState.selectedInterests = JSON.parse(localStorage.getItem('selectedInterests') || '[]');
  document.querySelectorAll('.interest-tile').forEach(tile => {
    const interest = tile.dataset.interest;
    if (onboardingState.selectedInterests.includes(interest)) {
      tile.classList.add('selected');
    } else {
      tile.classList.remove('selected');
    }
  });
}

export function selectInterest(tile, interest) {
  if (onboardingState.selectedInterests.includes(interest)) {
    onboardingState.selectedInterests = onboardingState.selectedInterests.filter(i => i !== interest);
    tile.classList.remove('selected');
  } else {
    onboardingState.selectedInterests.push(interest);
    tile.classList.add('selected');
  }
}

export function saveOnboarding() {
  localStorage.setItem('selectedInterests', JSON.stringify(onboardingState.selectedInterests));
  window.location.href = 'profile.html';
}

export function skipOnboarding() {
  localStorage.setItem('selectedInterests', JSON.stringify([]));
  window.location.href = 'index.html';
}

if (typeof window !== 'undefined') {
  window.loadOnboardingSelection = loadOnboardingSelection;
  window.selectInterest = selectInterest;
  window.saveOnboarding = saveOnboarding;
  window.skipOnboarding = skipOnboarding;
}
