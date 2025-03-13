import { initializeApp } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-app.js";
import { 
    getAuth, 
    createUserWithEmailAndPassword, 
    signInWithEmailAndPassword, 
    sendPasswordResetEmail, 
    signOut, 
    onAuthStateChanged,
    GoogleAuthProvider,
    signInWithPopup
} from "https://www.gstatic.com/firebasejs/11.4.0/firebase-auth.js";

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
const googleProvider = new GoogleAuthProvider();

class Auth {
    static isLoggedIn = false;
    static user = null;

    // Validation Methods
    static validateEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    static validatePassword(password) {
        return {
            length: password.length >= 8,
            uppercase: /[A-Z]/.test(password),
            lowercase: /[a-z]/.test(password),
            number: /[0-9]/.test(password),
            special: /[!@#$%^&*]/.test(password)
        };
    }

    // Initialization Method
    static init() {
        this.setupAuthStateListener();
        this.setupAuthButtons();
    }

    // Authentication State Listener
    static setupAuthStateListener() {
        onAuthStateChanged(auth, (user) => {
            if (user) {
                this.user = user;
                this.isLoggedIn = true;
                this.updateUI();
                this.enableLoginRequiredFeatures();
            } else {
                this.user = null;
                this.isLoggedIn = false;
                this.updateUI();
                this.disableLoginRequiredFeatures();
            }
        });
    }

    // Setup Authentication Buttons
    static setupAuthButtons() {
        const loginRequiredButtons = document.querySelectorAll('[data-requires-login="true"]');
        
        loginRequiredButtons.forEach(btn => {
            const originalHref = btn.getAttribute('href') || btn.dataset.href;
            
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                
                if (!this.isLoggedIn) {
                    Modal.show();
                } else if (originalHref) {
                    window.open(originalHref, '_blank');
                }
            });
        });
    }

    // Signup Method
    static async handleSignup(event) {
        event.preventDefault();
        
        // Reset previous errors
        ['Name', 'Email', 'Password', 'ConfirmPassword'].forEach(field => {
            Modal.hideError(`signup${field}Error`);
        });

        const name = document.getElementById('signupName').value.trim();
        const email = document.getElementById('signupEmail').value.trim();
        const password = document.getElementById('signupPassword').value;
        const confirmPassword = document.getElementById('confirmPassword').value;

        // Validate name
        if (name.length < 2) {
            Modal.showError('signupNameError', 'Name must be at least 2 characters long');
            return;
        }

        // Validate email
        if (!this.validateEmail(email)) {
            Modal.showError('signupEmailError', 'Please enter a valid email address');
            return;
        }

        // Validate password
        const passwordReqs = this.validatePassword(password);
        if (!Object.values(passwordReqs).every(req => req)) {
            Modal.showError('signupPasswordError', 'Password does not meet all requirements');
            return;
        }

        // Validate password match
        if (password !== confirmPassword) {
            Modal.showError('confirmPasswordError', 'Passwords do not match');
            return;
        }

        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            // Optional: Update profile with name
            // await updateProfile(user, { displayName: name });

            this.user = user;
            this.isLoggedIn = true;
            this.updateUI();
            Modal.hide();
            showToast('Account created successfully!', 'success');
        } catch (error) {
            console.error('Signup error:', error);
            Modal.showError('signupPasswordError', this.getErrorMessage(error));
        }
    }

    // Login Method
    static async handleLogin(event) {
        event.preventDefault();

        Modal.hideError('loginEmailError');
        Modal.hideError('loginPasswordError');

        const email = document.getElementById('loginEmail').value.trim();
        const password = document.getElementById('loginPassword').value;
        const rememberMe = document.getElementById('rememberMe').checked;

        if (!this.validateEmail(email)) {
            Modal.showError('loginEmailError', 'Please enter a valid email address');
            return;
        }

        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            this.user = userCredential.user;
            this.isLoggedIn = true;
            
            // Implement remember me functionality
            if (rememberMe) {
                // Firebase handles persistence automatically
            }

            this.updateUI();
            Modal.hide();
            showToast('Login successful!', 'success');
        } catch (error) {
            console.error('Login error:', error);
            Modal.showError('loginPasswordError', this.getErrorMessage(error));
        }
    }

    // Google Sign-In Method
    static async handleGoogleSignIn() {
        try {
            const result = await signInWithPopup(auth, googleProvider);
            const user = result.user;
            
            this.user = user;
            this.isLoggedIn = true;
            this.updateUI();
            Modal.hide();
            showToast('Google Sign-In successful!', 'success');
        } catch (error) {
            console.error('Google Sign-In error:', error);
            showToast(this.getErrorMessage(error), 'error');
        }
    }

    // Forgot Password Method
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
            Modal.showError('resetEmailError', this.getErrorMessage(error));
        }
    }

    // Logout Method
    static async logout() {
        try {
            await signOut(auth);
            this.user = null;
            this.isLoggedIn = false;
            this.updateUI();
            showToast('Logged out successfully', 'info');
        } catch (error) {
            console.error('Logout error:', error);
            showToast('Error logging out', 'error');
        }
    }

    // UI Update Method
    static updateUI() {
        const loginRequiredButtons = document.querySelectorAll('[data-requires-login="true"]');
        const userInfoContainer = document.getElementById('user-info');
        
        // Update buttons
        loginRequiredButtons.forEach(btn => {
            if (this.isLoggedIn) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });

        // Update user info container
        if (userInfoContainer) {
            if (this.isLoggedIn) {
                userInfoContainer.innerHTML = `
                    <div class="user-menu">
                        <span>Welcome, ${this.user.email || 'User'}</span>
                        <button onclick="Auth.logout()" class="logout-btn">
                            <i class="fas fa-sign-out-alt"></i> Logout
                        </button>
                    </div>
                `;
            } else {
                userInfoContainer.innerHTML = `
                    <button onclick="Modal.show()" class="login-btn">
                        <i class="fas fa-sign-in-alt"></i> Login
                    </button>
                `;
            }
        }
    }

    // Enable Login Required Features
    static enableLoginRequiredFeatures() {
        const loginRequiredElements = document.querySelectorAll('[data-requires-login="true"]');
        loginRequiredElements.forEach(el => {
            el.disabled = false;
            el.classList.remove('disabled');
        });
    }

    // Disable Login Required Features
    static disableLoginRequiredFeatures() {
        const loginRequiredElements = document.querySelectorAll('[data-requires-login="true"]');
        loginRequiredElements.forEach(el => {
            el.disabled = true;
            el.classList.add('disabled');
        });
    }

    // Error Message Handler
    static getErrorMessage(error) {
        switch (error.code) {
            case 'auth/email-already-in-use':
                return 'Email is already registered';
            case 'auth/invalid-email':
                return 'Invalid email address';
            case 'auth/weak-password':
                return 'Password is too weak';
            case 'auth/user-not-found':
                return 'No user found with this email';
            case 'auth/wrong-password':
                return 'Incorrect password';
            default:
                return error.message || 'An unexpected error occurred';
        }
    }
}

// Expose methods globally for inline event handlers
window.Auth = Auth;

export default Auth;
