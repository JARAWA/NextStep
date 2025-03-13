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

class AuthService {
    // Validation Utility Methods
    static validateInput = {
        email: (email) => {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            return {
                isValid: emailRegex.test(email),
                error: 'Please enter a valid email address'
            };
        },

        password: (password) => {
            const validations = [
                {
                    test: (pw) => pw.length >= 8,
                    message: 'Password must be at least 8 characters long'
                },
                {
                    test: (pw) => /[A-Z]/.test(pw),
                    message: 'Password must contain at least one uppercase letter'
                },
                {
                    test: (pw) => /[a-z]/.test(pw),
                    message: 'Password must contain at least one lowercase letter'
                },
                {
                    test: (pw) => /[0-9]/.test(pw),
                    message: 'Password must contain at least one number'
                },
                {
                    test: (pw) => /[!@#$%^&*]/.test(pw),
                    message: 'Password must contain at least one special character'
                }
            ];

            const failedValidation = validations.find(v => !v.test(password));
            return {
                isValid: !failedValidation,
                error: failedValidation ? failedValidation.message : ''
            };
        },

        name: (name) => ({
            isValid: name.trim().length >= 2,
            error: 'Name must be at least 2 characters long'
        })
    };

    // Error Handling Utility
    static handleAuthError(error) {
        const errorMap = {
            'auth/email-already-in-use': 'Email is already registered',
            'auth/invalid-email': 'Invalid email address',
            'auth/weak-password': 'Password is too weak',
            'auth/user-not-found': 'No account found with this email',
            'auth/wrong-password': 'Incorrect password',
            'auth/too-many-requests': 'Too many login attempts. Please try again later.'
        };

        return errorMap[error.code] || error.message || 'An unexpected error occurred';
    }

    // Form Validation Utility
    static validateForm(inputs) {
        for (const input of inputs) {
            const { isValid, error } = input.validator(input.value);
            if (!isValid) {
                Modal.showError(input.errorField, error);
                input.element.focus();
                return false;
            }
        }
        return true;
    }

    // Signup Method
    static async handleSignup(event) {
        event.preventDefault();

        // Reset previous errors
        ['signupName', 'signupEmail', 'signupPassword', 'confirmPassword']
            .forEach(field => Modal.hideError(`${field}Error`));

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
                validator: this.validateInput.name,
                errorField: 'signupNameError'
            },
            {
                element: emailInput,
                value: emailInput.value.trim(),
                validator: this.validateInput.email,
                errorField: 'signupEmailError'
            },
            {
                element: passwordInput,
                value: passwordInput.value,
                validator: this.validateInput.password,
                errorField: 'signupPasswordError'
            }
        ];

        // Validate form
        if (!this.validateForm(validationInputs)) return;

        // Check password match
        if (passwordInput.value !== confirmPasswordInput.value) {
            Modal.showError('confirmPasswordError', 'Passwords do not match');
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
            window.showToast('Account created! Please verify your email.', 'success');

            // Reset form
            event.target.reset();

        } catch (error) {
            // Handle signup errors
            const errorMessage = this.handleAuthError(error);
            Modal.showError('signupPasswordError', errorMessage);
            window.showToast(errorMessage, 'error');
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
        const submitButton = event.target.querySelector('button[type="submit"]');

        // Validate inputs
        const validationInputs = [
            {
                element: emailInput,
                value: emailInput.value.trim(),
                validator: this.validateInput.email,
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
                window.showToast('Please verify your email. Verification link sent.', 'warning');
                await signOut(auth);
                return;
            }

            // Show success message
            window.showToast('Login successful!', 'success');

        } catch (error) {
            // Handle login errors
            const errorMessage = this.handleAuthError(error);
            Modal.showError('loginPasswordError', errorMessage);
            window.showToast(errorMessage, 'error');
        } finally {
            // Re-enable submit button
            submitButton.disabled = false;
            submitButton.innerHTML = '<i class="fas fa-sign-in-alt"></i> Login';
        }
    }

    // Forgot Password Method
    static async handleForgotPassword(event) {
        event.preventDefault();

        // Reset previous errors
        Modal.hideError('resetEmailError');

        // Get form elements
        const emailInput = document.getElementById('resetEmail');
        const submitButton = event.target.querySelector('button[type="submit"]');

        // Validate inputs
        const validationInputs = [
            {
                element: emailInput,
                value: emailInput.value.trim(),
                validator: this.validateInput.email,
                errorField: 'resetEmailError'
            }
        ];

        // Validate form
        if (!this.validateForm(validationInputs)) return;

        try {
            // Disable submit button
            submitButton.disabled = true;
            submitButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending Reset Link...';

            // Send password reset email
            await sendPasswordResetEmail(auth, emailInput.value.trim());

            // Show success message
            window.showToast('Password reset link sent to your email!', 'success');
            Modal.hide();

        } catch (error) {
            // Handle forgot password errors
            const errorMessage = this.handleAuthError(error);
            Modal.showError('resetEmailError', errorMessage);
            window.showToast(errorMessage, 'error');
        } finally {
            // Re-enable submit button
            submitButton.disabled = false;
            submitButton.innerHTML = '<i class="fas fa-paper-plane"></i> Send Reset Link';
        }
    }

    // Logout Method
    static async logout() {
        try {
            await signOut(auth);
            window.showToast('Logged out successfully', 'info');
        } catch (error) {
            window.showToast('Error logging out', 'error');
        }
    }
}

// Export and expose globally
window.Auth = AuthService;
export default AuthService;
