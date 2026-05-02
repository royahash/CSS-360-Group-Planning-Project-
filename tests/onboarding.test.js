import { beforeEach, describe, expect, it } from 'vitest';

import {
  loadOnboardingSelection,
  selectInterest,
  saveOnboarding,
  onboardingState
} from '../scripts/onboarding.js';
import { loadProfileInterests } from '../scripts/profile.js';

beforeEach(() => {
  localStorage.clear();
  onboardingState.selectedInterests.length = 0;
  document.body.innerHTML = '';
  window.location.href = 'http://localhost/';
});

describe('Onboarding module', () => {
  it('toggles selection state and tile class when selecting an interest', () => {
    document.body.innerHTML = '<div class="interest-tile" data-interest="Music & Concerts"></div>';
    const tile = document.querySelector('.interest-tile');

    expect(onboardingState.selectedInterests).toEqual([]);

    selectInterest(tile, 'Music & Concerts');
    expect(onboardingState.selectedInterests).toEqual(['Music & Concerts']);
    expect(tile.classList.contains('selected')).toBe(true);

    selectInterest(tile, 'Music & Concerts');
    expect(onboardingState.selectedInterests).toEqual([]);
    expect(tile.classList.contains('selected')).toBe(false);
  });

  it('loads saved selections and applies selected classes to matching tiles', () => {
    localStorage.setItem('selectedInterests', JSON.stringify(['Sports & Fitness']));
    document.body.innerHTML = `
      <div class="interest-tile" data-interest="Music & Concerts"></div>
      <div class="interest-tile" data-interest="Sports & Fitness"></div>
    `;

    loadOnboardingSelection();

    const tiles = Array.from(document.querySelectorAll('.interest-tile'));
    expect(tiles[0].classList.contains('selected')).toBe(false);
    expect(tiles[1].classList.contains('selected')).toBe(true);
  });

  it('saves onboarding choices and persists them to localStorage', () => {
    document.body.innerHTML = '<div class="interest-tile" data-interest="Sports &amp; Fitness"></div>';
    const tile = document.querySelector('.interest-tile');
    selectInterest(tile, 'Sports & Fitness');

    saveOnboarding();

    expect(localStorage.getItem('selectedInterests')).toBe(JSON.stringify(['Sports & Fitness']));
    expect(window.location.href).toContain('profile.html');
  });
});

describe('Profile module', () => {
  it('renders saved interests and hides the empty state', () => {
    localStorage.setItem('selectedInterests', JSON.stringify(['Sports & Fitness']));
    document.body.innerHTML = '<div id="interestList"></div><div id="emptyState" style="display:none"></div><a href="onboarding.html">Update interests</a>';

    loadProfileInterests();

    const chips = document.querySelectorAll('.interest-chip');
    expect(chips.length).toBe(1);
    expect(chips[0].textContent.trim()).toBe('Sports & Fitness');
    expect(document.getElementById('emptyState').style.display).toBe('none');
    expect(document.querySelector('a[href="onboarding.html"]')).not.toBeNull();
  });
});
