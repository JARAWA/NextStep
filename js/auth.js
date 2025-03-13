import { initializeApp } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, sendPasswordResetEmail, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-auth.js";

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyC7tvZe9NeHRhYuTVrQnkaSG7Nkj3ZS40U",
  authDomain: "nextstep-log.firebaseapp.com",
  projectId: "nextstep-log",
  storageBucket: "nextstep-log.firebasestorage.app",
  messagingSenderId: "9308831285",
  appId: "1:9308831285:web:d55ed6865804c50f743b7c",
  measurementId: "G-BPGP3TBN3N"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

class Auth {
    static isLoggedIn = false;
    static user = null;

    static init() {
        this.setupAuthButtons();
        onAuthStateChanged(auth, (user) => {
            if (user) {
                this.user = user;
                this.isLoggedIn = true;
                this.updateUI();
            } else {
                this.user = null;
                this.isLoggedIn = false;
                this.updateUI();
            }
        });
    }

    static setupAuthButtons() {
        const generateButtons = document.querySelectorAll('[data-requires-login="true"]');
        
        generateButtons.forEach(btn => {
            const originalHref = btn.href;
            if (btn.tagName === 'A') {
                btn.removeAttribute('href');
            }

            btn.addEventListener('click', (e) => {
                e.preventDefault();
                if (!this.isLoggedIn) {
                    Modal.show();
                } else {
                    if (btn.tagName === 'A' && originalHref) {
                        window.open(originalHref, '_blank');
                    }
                }
            });
        });
    }

    static validateEmail(email) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    }

    static async handleSignup(event) {
        event.preventDefault();
        
        Modal.hideError('signupEmailError');
        Modal.hideError('signupPasswordError');
        Modal.hideError('confirmPasswordError');

        const email = document.getElementById('signupEmail').value.trim();
        const password = document.getElementById('signupPassword').value;
        const confirmPassword = document.getElementById('confirmPassword').value;

        if (!this.validateEmail(email)) {
            Modal.showError('signupEmailError', 'Please enter a valid email address');
            return;
        }

        if (password !== confirmPassword) {
            Modal.showError('confirmPasswordError', 'Passwords do not match');
            return;
        }

        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            this.user = userCredential.user;
            this.isLoggedIn = true;
            this.updateUI();
            Modal.hide();
            showToast('Account created successfully!', 'success');
        } catch (error) {
            console.error('Signup error:', error);
            Modal.showError('signupPasswordError', error.message);
        }
    }

    static async handleLogin(event) {
        event.preventDefault();

        Modal.hideError('loginEmailError');
        Modal.hideError('loginPasswordError');

        const email = document.getElementById('loginEmail').value.trim();
        const password = document.getElementById('loginPassword').value;

        if (!this.validateEmail(email)) {
            Modal.showError('loginEmailError', 'Please enter a valid email address');
            return;
        }

        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            this.user = userCredential.user;
            this.isLoggedIn = true;
            this.updateUI();
            Modal.hide();
            showToast('Login successful!', 'success');
        } catch (error) {
            console.error('Login error:', error);
            Modal.showError('loginPasswordError', error.message);
        }
    }

    static async handleForgotPassword(event) {
        event.preventDefault();
        
        Modal.hideError('resetEmailError');
        const email = document.getElementById('resetEmail').value.trim();

        if (!this.validateEmail(email)) {
            Modal.showError('resetEmailError', 'Please enter a valid email address');
            return;
        }

        try {
            await sendPasswordResetEmail(auth, email);
            showToast('Password reset link sent to your email!', 'success');
            Modal.hide();
        } catch (error) {
            console.error('Forgot password error:', error);
            Modal.showError('resetEmailError', error.message);
        }
    }

    static logout() {
        signOut(auth).then(() => {
            this.user = null;
            this.isLoggedIn = false;
            this.updateUI();
            showToast('Logged out successfully', 'info');
        }).catch((error) => {
            console.error('Logout error:', error);
        });
    }

    static updateUI() {
        const generateButtons = document.querySelectorAll('[data-requires-login="true"]');
        const userInfo = document.getElementById('user-info');
        
        if (this.isLoggedIn) {
            generateButtons.forEach(btn => {
                if (btn.tagName === 'A') {
                    if (btn.dataset.originalHref) {
                        btn.href = btn.dataset.originalHref;
                    }
                }
                btn.classList.add('active');
            });

            if (userInfo) {
                userInfo.innerHTML = `
                    <div class="user-menu">
                        <span>Welcome, ${this.user.email}</span>
                        <button onclick="Auth.logout()" class="logout-btn">
                            <i class="fas fa-sign-out-alt"></i> Logout
                        </button>
                    </div>
                `;
            }
        } else {
            generateButtons.forEach(btn => {
                if (btn.tagName === 'A') {
                    btn.dataset.originalHref = btn.href;
                    btn.removeAttribute('href');
                }
                btn.classList.remove('active');
            });

            if (userInfo) {
                userInfo.innerHTML = `
                    <button onclick="Modal.show()" class="login-btn">
                        <i class="fas fa-sign-in-alt"></i> Login
                    </button>
                `;
            }
        }
    }
}

export default Auth;
