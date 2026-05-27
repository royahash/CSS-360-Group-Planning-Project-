// ── Auth API ──────────────────────────────────────────────────────────────
export async function getCurrentUser() {
  try {
    const response = await fetch('/auth/me', { credentials: 'include' });
    if (!response.ok) return null;
    return await response.json();
  } catch {
    return null;
  }
}

export function loginWithGoogle() {
  window.location.href = '/auth/google';
}

export function logout() {
  window.location.href = '/auth/logout';
}

export async function savePreferences(preferences) {
  try {
    const response = await fetch('/api/user/preferences', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ preferences }),
    });
    return response.ok;
  } catch {
    return false;
  }
}

// ── Page Protection ───────────────────────────────────────────────────────
// Call this on any page that requires login
export async function requireLogin() {
  const user = await getCurrentUser();
  if (!user) {
    window.location.href = '/html/LogIn.html';
  }
  return user;
}

// ── UI LOGIC ──────────────────────────────────────────────────────────────
const updateUI = () => {
  // Signup Page
  const signupBtn = document.getElementById('signupButton');
  if (signupBtn) {
    const u = document.getElementById('username')?.value.trim();
    const e = document.getElementById('email')?.value.trim();
    const p = document.getElementById('password')?.value;
    const cp = document.getElementById('confirmPassword')?.value;
    signupBtn.disabled = !(u && e && p && cp);
  }

  // Login Page
  const loginBtn = document.getElementById('loginButton');
  if (loginBtn) {
    const id = document.getElementById('usernameOrEmail')?.value.trim();
    const lp = document.getElementById('password')?.value;
    loginBtn.disabled = !(id && lp);
  }
};

document.addEventListener('input', updateUI, true);
document.addEventListener(
  'click',
  (e) => {
    if (e.target && e.target.id === 'togglePassword') {
      const passInput = document.getElementById('password');
      if (passInput) {
        passInput.type = passInput.type === 'password' ? 'text' : 'password';
      }
      const confirmPassInput = document.getElementById('confirmPassword');
      if (confirmPassInput) {
        confirmPassInput.type =
          confirmPassInput.type === 'password' ? 'text' : 'password';
      }
    }
  },
  true,
);