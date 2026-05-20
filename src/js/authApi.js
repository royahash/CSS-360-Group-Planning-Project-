const BASE = '/api/auth';

function getAuthHeader() {
  const token = localStorage.getItem('token');
  return token ? { 'Authorization': `Bearer ${token}` } : {};
}

async function registerUser(username, email, password) {
  const res = await fetch(`${BASE}/register`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({ username, email, password })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error);
  localStorage.setItem('token',    data.token);
  localStorage.setItem('username', data.username);
  localStorage.setItem('userId',   data.userId);
  return data;
}

async function loginUser(identifier, password) {
  const res = await fetch(`${BASE}/login`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({ identifier, password })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error);
  localStorage.setItem('token',    data.token);
  localStorage.setItem('username', data.username);
  localStorage.setItem('userId',   data.userId);
  return data;
}

async function loadUserProfile() {
  const res = await fetch(`${BASE}/me`, {
    headers: getAuthHeader()
  });
  return res.ok ? res.json() : null;
}

function logout() {
  localStorage.removeItem('token');
  localStorage.removeItem('username');
  localStorage.removeItem('userId');
  window.location.href = 'LogIn.html';
}

if (typeof module !== 'undefined') {
  module.exports = { registerUser, loginUser, loadUserProfile, logout, getAuthHeader };
}
