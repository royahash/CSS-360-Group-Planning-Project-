import {getUsers, findUser, addUser, checkPasswordMatch, checkCredentials} from './auth.js';
describe('User Storage', () => {
    beforeEach(() => {
        localStorage.clear();
    });

    it('adds a new user to storage', () => {
        const user = { username: 'testuser', email: 'testuser@example.com', password: 'password123' };
        const user2 = { username: 'testuser2', email: 'testuser2@example.com', password: 'password456' };
        addUser(user);
        expect(getUsers()).toContainEqual(user);
        expect(getUsers()).not.toContainEqual(user2);
    });

    it('finds user by username or email', () => {
        const user = { username: 'testuser', email: 'testuser@example.com', password: 'password123' };
        addUser(user);
        expect(findUser('testuser')).toEqual(user);
        expect(findUser('testuser@example.com')).toEqual(user);
        expect(findUser('nonexistent')).toBeNull();
        expect(findUser('nonexistent@example.com')).toBeNull();
    });

    it('prevents duplicate usernames or email', () => {
        const user1 = { username: 'testuser', email: 'testuser@example.com', password: 'password123' };
        const user2 = { username: 'testuser', email: 'testuser2@example.com', password: 'password456' };
        const user3 = { username: 'testuser2', email: 'testuser@example.com', password: 'password789' };
        const user4 = { username: 'testuser3', email: 'testuser3@example.com', password: 'password012' };
        addUser(user1);
        expect(() => addUser(user2)).toThrow('Username or email already exists');
        expect(() => addUser(user3)).toThrow('Username or email already exists');
        expect(() => addUser(user4)).not.toThrow('Username or email already exists');
    });
});

describe('Authentication/Checks', () => {
    beforeEach(() => {
        localStorage.clear();
    });

    it('checks if password = confirm password (signup)', () => {
        expect(checkPasswordMatch('password123', 'password123')).toBe(true);
        expect(checkPasswordMatch('password123', 'password456')).toBe(false);
    });

    it('checks valid credentials (login)', () => {
        const user = { username: 'testuser', email: 'testuser@example.com', password: 'password123' };
        addUser(user);
        expect(checkCredentials('testuser', 'password123')).toBe(true);
        expect(checkCredentials('testuser@example.com', 'password123')).toBe(true);
        expect(checkCredentials('nonexistent@example.com', 'password123')).toBe(false);
        expect(checkCredentials('nonexistent', 'password123')).toBe(false);
        expect(checkCredentials('testuser', 'wrongpassword')).toBe(false);
        expect(checkCredentials('testuser@example.com', 'wrongpassword')).toBe(false);
    });
});

describe('Button State (signup)', () => {
    beforeEach(() => {
        document.body.innerHTML = `
            <input type="text" id="username" />
            <input type="email" id="email" />
            <input type="password" id="password" />
            <input type="password" id="confirmPassword" />
            <button id="signupButton" disabled>Sign Up</button>
        `;
    });

    it('enables signup button when all fields are filled and passwords match', () => {
        const usernameInput = document.getElementById('username');
        const emailInput = document.getElementById('email');
        const passwordInput = document.getElementById('password');
        const confirmPasswordInput = document.getElementById('confirmPassword');
        const signupButton = document.getElementById('signupButton');
        usernameInput.value = 'testuser';
        emailInput.value = 'testuser@example.com';
        passwordInput.value = 'password123';
        confirmPasswordInput.value = 'password123';
        // Simulate input event to trigger button state update
        usernameInput.dispatchEvent(new Event('input'));
        emailInput.dispatchEvent(new Event('input'));
        passwordInput.dispatchEvent(new Event('input'));
        confirmPasswordInput.dispatchEvent(new Event('input'));
        expect(signupButton.disabled).toBe(false);
    });

    it('disables signup button when fields are missing', () => {
        const usernameInput = document.getElementById('username');
        const emailInput = document.getElementById('email');
        const passwordInput = document.getElementById('password');
        const confirmPasswordInput = document.getElementById('confirmPassword');
        const signupButton = document.getElementById('signupButton');
        usernameInput.value = '';
        emailInput.value = '';
        passwordInput.value = '';
        confirmPasswordInput.value = '';
        // Simulate input event to trigger button state update
        usernameInput.dispatchEvent(new Event('input'));
        emailInput.dispatchEvent(new Event('input'));
        passwordInput.dispatchEvent(new Event('input'));
        confirmPasswordInput.dispatchEvent(new Event('input'));
        expect(signupButton.disabled).toBe(true);
    });
});

describe('Button State (login)', () => {
    beforeEach(() => {
        document.body.innerHTML = `
            <input type="text" id="usernameOrEmail" />
            <input type="password" id="password" />
            <button id="loginButton" disabled>Log In</button>
        `;
    });

    it('enables login button when both fields are filled', () => {
        const usernameOrEmailInput = document.getElementById('usernameOrEmail');
        const passwordInput = document.getElementById('password');
        const loginButton = document.getElementById('loginButton');
        usernameOrEmailInput.value = 'testuser';
        passwordInput.value = 'password123';
        // Simulate input event to trigger button state update
        usernameOrEmailInput.dispatchEvent(new Event('input'));
        passwordInput.dispatchEvent(new Event('input'));
        expect(loginButton.disabled).toBe(false);
    });

    it('disables login button when fields are missing', () => {
        const usernameOrEmailInput = document.getElementById('usernameOrEmail');
        const passwordInput = document.getElementById('password');
        const loginButton = document.getElementById('loginButton');
        usernameOrEmailInput.value = '';
        passwordInput.value = '';
        // Simulate input event to trigger button state update
        usernameOrEmailInput.dispatchEvent(new Event('input'));
        passwordInput.dispatchEvent(new Event('input'));
        expect(loginButton.disabled).toBe(true);
    });
});

describe('Password Visibility (Eye Icon)', () => {
    beforeEach(() => {
        document.body.innerHTML = `
            <input type="password" id="password" />
            <button id="togglePassword">Show/Hide</button>
        `;
    });

    it('toggles password visibility', () => {
        const passwordInput = document.getElementById('password');
        const toggleButton = document.getElementById('togglePassword');
        // Initial state should be password
        expect(passwordInput.type).toBe('password');
        // Simulate click to show password
        toggleButton.click();
        expect(passwordInput.type).toBe('text');
        // Simulate click to hide password
        toggleButton.click();
        expect(passwordInput.type).toBe('password');
    });
});