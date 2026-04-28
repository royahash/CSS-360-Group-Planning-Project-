import { beforeEach, describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

import {
  loadOnboardingSelection,
  selectInterest,
  saveOnboarding,
  onboardingState
} from '../scripts/onboarding.js';
import { loadProfileInterests } from '../scripts/profile.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const onboardingHtml = readFileSync(path.join(__dirname, '..', 'onboarding.html'), 'utf-8');
const profileHtml = readFileSync(path.join(__dirname, '..', 'profile.html'), 'utf-8');

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

  it('saves onboarding choices, renders them in profile, and keeps update link available', () => {
    document.body.innerHTML = '<div class="interest-tile" data-interest="Sports &amp; Fitness"></div>';
    const tile = document.querySelector('.interest-tile');
    selectInterest(tile, 'Sports & Fitness');
    saveOnboarding();

    expect(localStorage.getItem('selectedInterests')).toBe(JSON.stringify(['Sports & Fitness']));

    document.body.innerHTML = '<div id="interestList"></div><div id="emptyState" style="display:none"></div><a href="onboarding.html">Update interests</a>';
    loadProfileInterests();

    const chips = document.querySelectorAll('.interest-chip');
    expect(chips.length).toBe(1);
    expect(chips[0].textContent.trim()).toBe('Sports & Fitness');
    expect(document.querySelector('a[href="onboarding.html"]')).not.toBeNull();
  });
});
