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

export default class AuthService {
    // Authentication State Management
    static isLoggedIn = false;
    static user = null;

    // Comprehensive Validation Utility
    static Validator = {
        // Email Validation
        email: (email) => {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            return {
                isValid: emailRegex.test(email.trim()),
                error: 'Please enter a valid email address'
            };
        },

        // Password Validation with Detailed Requirements
        password: (password) => {
            const validations = [
                {
                    test: (pw) => pw.length >= 8,
                    message: 'Password must be at least 8 characters long'
                },
                {
                    test: (pw) => /[A-Z]/.test(pw),
                    message: 'Must contain at least one uppercase letter'
                },
                {
                    test: (pw) => /[a-z]/.test(pw),
                    message: 'Must contain at least one lowercase letter'
                },
                {
                    test: (pw) => /[0-9]/.test(pw),
                    message: 'Must contain at least one number'
                },
                {
                    test: (pw) => /[!@#$%^&*]/.test(pw),
                    message: 'Must contain at least one special character'
                }
            ];

            const failedValidation = validations.find(v => !v.test(password));
            return {
                isValid: !failedValidation,
                error: failedValidation ? failedValidation.message : ''
            };
        },

        // Name Validation
        name: (name) => ({
            isValid: name.trim().length >= 2,
            error: 'Name must be at least 2 characters long'
        })
    };

    // Error Handling Utility
    static ErrorHandler = {
        // Map Firebase Error Codes to User-Friendly Messages
        mapAuthError: (error) => {
            const errorMap = {
                'auth/email-already-in-use': 'Email is already registered',
                'auth/invalid-email': 'Invalid email address',
                'auth/weak-password': 'Password is too weak',
                'auth/user-not-found': 'No account found with this email',
                'auth/wrong-password': 'Incorrect password',
                'auth/too-many-requests': 'Too many login attempts. Please try again later.'
            };

            return errorMap[error.code] || error.message || 'An unexpected error occurred';
        },

        // Display Error with Toast and Modal
        displayError: (errorField, errorMessage) => {
            // Show error in modal
            if (window.Modal && typeof window.Modal.showError === 'function') {
                window.Modal.showError(errorField, errorMessage);
            }

            // Show toast notification
            if (window.showToast) {
                window.showToast(errorMessage, 'error');
            }
        }
    };

    // Form Validation Utility
    static validateForm(inputs) {
        for (const input of inputs) {
            const { isValid, error } = input.validator(input.value);
            if (!isValid) {
                this.ErrorHandler.displayError(input.errorField, error);
                input.element.focus();
                return false;
            }
        }
        return true;
    }

    // Authentication State Listener
    static init() {
        console.log('Initializing Authentication Service');
        this.setupAuthStateListener();
        this.setupAuthButtons();
    }

    // Listen for Authentication State Changes
    static setupAuthStateListener() {
        onAuthStateChanged(auth, async (user) => {
            if (user) {
                this.user = user;
                this.isLoggedIn = true;
                
                // Optional: Additional user data fetching
                await this.fetchUserProfile();
                
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

    // Fetch Additional User Profile (Optional)
    static async fetchUserProfile() {
        try {
            // Implement additional user profile fetching logic
            // e.g., from Firestore or your backend
            console.log('Fetching user profile');
        } catch (error) {
            console.error('Error fetching user profile:', error);
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
                    // Show login modal
                    if (window.Modal && typeof window.Modal.show === 'function') {
                        window.Modal.show();
                    }
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
        ['signupName', 'signupEmail', 'signupPassword', 'confirmPassword']
            .forEach(field => {
                if (window.Modal && typeof window.Modal.hideError === 'function') {
                    window.Modal.hideError(`${field}Error`);
                }
            });

        // Get form elements
        const nameInput = document.getElementById('signupName');
        const emailInput = document.getElementById('signupEmail');
        const passwordInput = document.getElementById('signupPassword');
        const confirmPasswordInput = document.getElementById('confirmPassword');
        const submitButton = event.target.querySelector('button[type="submit"]');

        // Validation inputs
        const validationInputs = [
            {
                element: nameInput,
                value: nameInput.value.trim(),
                validator: this.Validator.name,
                errorField: 'signupNameError'
            },
            {
                element: emailInput,
                value: emailInput.value.trim(),
                validator: this.Validator.email,
                errorField: 'signupEmailError'
            },
            {
                element: passwordInput,
                value: passwordInput.value,
                validator: this.Validator.password,
                errorField: 'signupPasswordError'
            }
        ];

        // Validate form
        if (!this.validateForm(validationInputs)) return;

        // Check password match
        if (passwordInput.value !== confirmPasswordInput.value) {
            this.ErrorHandler.displayError('confirmPasswordError', 'Passwords do not match');
            confirmPasswordInput.focus();
            return;
        }

        try {
            // Disable submit button
            submitButton.disabled = true;
            submitButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Creating Account...';

            // Create user
            const userCredential = await createUserWithEmailAndPassword(
                auth, 
                emailInput.value.trim(), 
                passwordInput.value
            );
            const user = userCredential.user;

            // Update profile
            await updateProfile(user, {
                displayName: nameInput.value.trim()
            });

            // Send verification email
            await sendEmailVerification(user);

            // Show success message
            if (window.showToast) {
                window.showToast('Account created! Please verify your email.', 'success');
            }

            // Reset form
            event.target.reset();

            // Hide modal
            if (window.Modal && typeof window.Modal.hide === 'function') {
                window.Modal.hide();
            }

        } catch (error) {
            // Handle signup errors
            const errorMessage = this.ErrorHandler.mapAuthError(error);
            this.ErrorHandler.displayError('signupPasswordError', errorMessage);
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
        if (window.Modal && typeof window.Modal.hideError === 'function') {
            window.Modal.hideError('loginEmailError');
            window.Modal.hideError('loginPasswordError');
        }

        // Get form elements
        const emailInput = document.getElementById('loginEmail');
        const passwordInput = document.getElementById('loginPassword');
        const submitButton = event.target.querySelector('button[type="submit"]');

        // Validate inputs
        const validationInputs = [
            {
                element: emailInput,
                value: emailInput.value.trim(),
                validator: this.Validator.email,
                errorField: 'loginEmailError'
            }
        ];

        // Validate form
        if (!this.validateForm(validationInputs)) return;

        try {
            // Disable submit button
            submitButton.disabled = true;
            submitButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Logging In...';

            // Perform login
            const userCredential = await signInWithEmailAndPassword(
                auth, 
                emailInput.value.trim(), 
                passwordInput.value
            );
            const user = userCredential.user;

            // Check email verification
            if (!user.emailVerified) {
                await sendEmailVerification(user);
                
                if (window.showToast) {
                    window.showToast('Please verify your email. Verification link sent.', 'warning');
                }
                
                await signOut(auth);
                return;
            }

            // Hide modal
            if (window.Modal && typeof window.Modal.hide === 'function') {
                window.Modal.hide();
            }

            // Show success message
            if (window.showToast) {
                window.showToast('Login successful!', 'success');
            }

        } catch (error) {
            // Handle login errors
            const errorMessage = this.ErrorHandler.mapAuthError(error);
            this.ErrorHandler.displayError('loginPasswordError', errorMessage);
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
            
            if (window.showToast) {
                window.showToast('Logged out successfully', 'info');
            }
        } catch (error) {
            if (window.showToast) {
                window.showToast('Error logging out', 'error');
            }
            console.error('Logout error:', error);
        }
    }

    // Update UI Based on Authentication State
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
}

// Expose to global scope
window.Auth = AuthService;
