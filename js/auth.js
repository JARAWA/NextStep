import { initializeApp } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-app.js";
import { 
    getAuth, 
    createUserWithEmailAndPassword, 
    signInWithEmailAndPassword, 
    sendPasswordResetEmail, 
    signOut, 
    onAuthStateChanged,
    GoogleAuthProvider,
    signInWithPopup,
    updateProfile,
    sendEmailVerification
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
    // Authentication State
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

    // Comprehensive Initialization
    static init() {
        this.setupAuthStateListener();
        this.setupAuthButtons();
    }

    // Authentication State Listener
    static setupAuthStateListener() {
        onAuthStateChanged(auth, async (user) => {
            if (user) {
                // Additional checks for verified email if needed
                this.user = user;
                this.isLoggedIn = true;
                
                // Optional: Fetch additional user data
                await this.fetchUserAdditionalData();
                
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

    // Fetch Additional User Data (Optional)
    static async fetchUserAdditionalData() {
        try {
            // You can add additional data fetching logic here
            // For example, fetching user profile from Firestore
        } catch (error) {
            console.error('Error fetching user data:', error);
        }
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

    // Comprehensive Signup Method
    static async handleSignup(event) {
        event.preventDefault();
        
        // Reset previous errors
        ['Name', 'Email', 'Password', 'ConfirmPassword'].forEach(field => {
            Modal.hideError(`signup${field}Error`);
        });

        // Get form elements
        const nameInput = document.getElementById('signupName');
        const emailInput = document.getElementById('signupEmail');
        const passwordInput = document.getElementById('signupPassword');
        const confirmPasswordInput = document.getElementById('confirmPassword');
        const submitButton = event.target.querySelector('button[type="submit"]');

        // Extract values
        const name = nameInput.value.trim();
        const email = emailInput.value.trim();
        const password = passwordInput.value;
        const confirmPassword = confirmPasswordInput.value;

        // Comprehensive Validation
        const validationChecks = [
            {
                condition: name.length < 2,
                errorField: 'signupNameError',
                message: 'Name must be at least 2 characters long',
                element: nameInput
            },
            {
                condition: !this.validateEmail(email),
                errorField: 'signupEmailError',
                message: 'Please enter a valid email address',
                element: emailInput
            },
            {
                condition: !Object.values(this.validatePassword(password)).every(req => req),
                errorField: 'signupPasswordError',
                message: 'Password does not meet all requirements',
                element: passwordInput
            },
            {
                condition: password !== confirmPassword,
                errorField: 'confirmPasswordError',
                message: 'Passwords do not match',
                element: confirmPasswordInput
            }
        ];

        // Perform validation
        for (const check of validationChecks) {
            if (check.condition) {
                Modal.showError(check.errorField, check.message);
                check.element.focus();
                return;
            }
        }

        try {
            // Disable submit button and show loading state
            submitButton.disabled = true;
            submitButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Creating Account...';

            // Create user in Firebase
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            // Update profile with name
            await updateProfile(user, {
                displayName: name
            });

            // Send email verification
            await sendEmailVerification(user);

            // Update authentication state
            this.user = user;
            this.isLoggedIn = true;
            this.updateUI();
            Modal.hide();
            
            // Show success toast
            showToast('Account created successfully! Please verify your email.', 'success');

            // Reset form
            event.target.reset();

        } catch (error) {
            console.error('Signup error:', error);
            
            // Detailed error handling
            const errorMap = {
                'auth/email-already-in-use': {
                    field: 'signupEmailError',
                    message: 'Email is already registered'
                },
                'auth/invalid-email': {
                    field: 'signupEmailError',
                    message: 'Invalid email address'
                },
                'auth/weak-password': {
                    field: 'signupPasswordError',
                    message: 'Password is too weak'
                }
            };

            const mappedError = errorMap[error.code] || {
                field: 'signupPasswordError',
                message: 'An unexpected error occurred during signup'
            };

            Modal.showError(mappedError.field, mappedError.message);
            showToast(mappedError.message, 'error');

        } finally {
            // Re-enable submit button
            submitButton.disabled = false;
            submitButton.innerHTML = '<i class="fas fa-user-plus"></i> Create Account';
        }
    }

    // Login Method
    static async handleLogin(event) {
        event.preventDefault();

        // Reset previous errors
        Modal.hideError('loginEmailError');
        Modal.hideError('loginPasswordError');

        // Get form elements
        const emailInput = document.getElementById('loginEmail');
        const passwordInput = document.getElementById('loginPassword');
        const rememberMeCheckbox = document.getElementById('rememberMe');
        const submitButton = event.target.querySelector('button[type="submit"]');

        // Extract values
        const email = emailInput.value.trim();
        const password = passwordInput.value;
        const rememberMe = rememberMeCheckbox.checked;

        // Validate email
        if (!this.validateEmail(email)) {
            Modal.showError('loginEmailError', 'Please enter a valid email address');
            emailInput.focus();
            return;
        }

        try {
            // Disable submit button and show loading state
            submitButton.disabled = true;
            submitButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Logging In...';

            // Perform login
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            // Check email verification (optional)
            if (!user.emailVerified) {
                await sendEmailVerification(user);
                showToast('Please verify your email. Verification link sent.', 'warning');
                await signOut(auth);
                return;
            }

            // Update authentication state
            this.user = user;
            this.isLoggedIn = true;
            
            // Handle remember me (Firebase handles persistence)
            this.updateUI();
            Modal.hide();
            
            // Show success toast
            showToast('Login successful!', 'success');

        } catch (error) {
            console.error('Login error:', error);
            
            // Detailed error handling
            const errorMap = {
                'auth/user-not-found': {
                    field: 'loginEmailError',
                    message: 'No account found with this email'
                },
                'auth/wrong-password': {
                    field: 'loginPasswordError',
                    message: 'Incorrect password'
                },
                'auth/too-many-requests': {
                    field: 'loginPasswordError',
                    message: 'Too many login attempts. Please try again later.'
                }
            };

            const mappedError = errorMap[error.code] || {
                field: 'loginPasswordError',
                message: 'An unexpected error occurred during login'
            };

            Modal.showError(mappedError.field, mappedError.message);
            showToast(mappedError.message, 'error');

        } finally {
            // Re-enable submit button
            submitButton.disabled = false;
            submitButton.innerHTML = '<i class="fas fa-sign-in-alt"></i> Login';
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
                        <span>Welcome, ${this.user.displayName || this.user.email}</span>
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

    // Forgot Password Method
    static async handleForgotPassword(event) {
        event.preventDefault();
        
        // Reset previous errors
        Modal.hideError('resetEmailError');
        
        // Get form elements
        const emailInput = document.getElementById('resetEmail');
        const submitButton = event.target.querySelector('button[type="submit"]');

        const email = emailInput.value.trim();

        // Validate email
        if (!this.validateEmail(email)) {
            Modal.showError('resetEmailError', 'Please enter a valid email address');
            emailInput.focus();
            return;
        }

        try {
            // Disable submit button and show loading state
            submitButton.disabled = true;
            submitButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending Reset Link...';

            // Send password reset email
            await sendPasswordResetEmail(auth, email);
            
            showToast('Password reset link sent to your email!', 'success');
            Modal.hide();

        } catch (error) {
            console.error('Forgot password error:', error);
            
            // Detailed error handling
            const errorMap = {
                'auth/user-not-found': 'No account found with this email',
                'auth/invalid-email': 'Invalid email address'
            };

            const errorMessage = errorMap[error.code] || 'An error occurred. Please try again.';
            Modal.showError('resetEmailError', errorMessage);
            showToast(errorMessage, 'error');

        } finally {
            // Re-enable submit button
            submitButton.disabled = false;
            submitButton.innerHTML = '<i class="fas fa-paper-plane"></i> Send Reset Link';
        }
    }
}

// Expose methods globally for inline event handlers
window.Auth = Auth;

export default Auth;
