// DATA LOGIC
export function getUsers() {
    return JSON.parse(localStorage.getItem("users")) || [];
}

export function findUser(identifier) {
    const users = getUsers();
    return users.find(u => u.username === identifier || u.email === identifier) || null;
}

export function addUser(userData) {
    const users = getUsers();
    const exists = users.some(u => u.username === userData.username || u.email === userData.email);
    if (exists) throw new Error("Username or email already exists");
    users.push(userData);
    localStorage.setItem("users", JSON.stringify(users));
}

export function checkPasswordMatch(p1, p2) { return p1 === p2; }

export function checkCredentials(id, pass) {
    const user = findUser(id);
    return user ? user.password === pass : false;
}

// UI LOGIC (Automatically enables green buttons and handles toggle)
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

// Capture phase ensures events reach these listeners in JSDOM tests
document.addEventListener('input', updateUI, true);

document.addEventListener('click', (e) => {
    if (e.target && e.target.id === 'togglePassword') {
        const passInput = document.getElementById('password');
        if (passInput) {
            passInput.type = passInput.type === 'password' ? 'text' : 'password';
        }
        const confirmPassInput = document.getElementById('confirmPassword');
        if (confirmPassInput) {
            confirmPassInput.type = confirmPassInput.type === 'password' ? 'text' : 'password';
        }
    }
}, true);