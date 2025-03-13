class Modal {
    static modal = null;
    static passwordStrengthTimeout = null;

    static init() {
        // Wrap initialization in a try-catch to handle potential errors
        try {
            this.modal = document.getElementById('loginModal');
            
            if (!this.modal) {
                console.error('Login modal not found');
                return;
            }

            this.setupEventListeners();
        } catch (error) {
            console.error('Error initializing modal:', error);
        }
    }

    static setupEventListeners() {
        // Close button
        const closeBtn = this.modal.querySelector('.close');
        if (closeBtn) {
            closeBtn.onclick = () => this.hide();
        }

        // Modal background click to close
        window.onclick = (event) => {
            if (event.target === this.modal) {
                this.hide();
            }
        };

        // Password strength checker
        this.setupPasswordStrengthListener();

        // Form toggle links
        this.setupFormToggleListeners();
    }

    static setupPasswordStrengthListener() {
        const signupPassword = document.getElementById('signupPassword');
        
        if (signupPassword) {
            signupPassword.addEventListener('input', (e) => {
                clearTimeout(this.passwordStrengthTimeout);
                this.passwordStrengthTimeout = setTimeout(() => {
                    this.checkPasswordStrength(e.target.value);
                }, 300);
            });
        }
    }

    static setupFormToggleListeners() {
        // Signup link
        const signupLink = document.querySelector('a[onclick*="toggleForms(\'signup\')"]');
        if (signupLink) {
            signupLink.addEventListener('click', (e) => {
                e.preventDefault();
                this.toggleForms('signup');
            });
        }

        // Forgot password link
        const forgotPasswordLink = document.querySelector('a[onclick*="showForgotPassword()"]');
        if (forgotPasswordLink) {
            forgotPasswordLink.addEventListener('click', (e) => {
                e.preventDefault();
                this.showForgotPassword();
            });
        }

        // Login link in signup form
        const loginLink = document.querySelector('a[onclick*="toggleForms(\'login\')"]');
        if (loginLink) {
            loginLink.addEventListener('click', (e) => {
                e.preventDefault();
                this.toggleForms('login');
            });
        }
    }

    static show() {
        if (this.modal) {
            this.modal.style.display = 'block';
            document.body.style.overflow = 'hidden';
            this.toggleForms('login'); // Always show login form first
        } else {
            console.error('Modal not initialized');
        }
    }

    static hide() {
        if (this.modal) {
            this.modal.style.display = 'none';
            document.body.style.overflow = 'auto';
            this.resetForms();
        }
    }

    static toggleForms(form) {
        const loginForm = document.getElementById('loginForm');
        const signupForm = document.getElementById('signupForm');
        const forgotPasswordForm = document.getElementById('forgotPasswordForm');

        if (!loginForm || !signupForm || !forgotPasswordForm) {
            console.error('One or more form elements not found');
            return;
        }

        [loginForm, signupForm, forgotPasswordForm].forEach(formEl => {
            formEl.classList.remove('active');
        });

        switch(form) {
            case 'signup':
                signupForm.classList.add('active');
                break;
            case 'forgot':
                forgotPasswordForm.classList.add('active');
                break;
            default:
                loginForm.classList.add('active');
        }
    }

    static togglePasswordVisibility(inputId, icon) {
        const input = document.getElementById(inputId);
        if (input.type === 'password') {
            input.type = 'text';
            icon.classList.remove('fa-eye');
            icon.classList.add('fa-eye-slash');
        } else {
            input.type = 'password';
            icon.classList.remove('fa-eye-slash');
            icon.classList.add('fa-eye');
        }
    }

    static checkPasswordStrength(password) {
        const requirements = {
            length: password.length >= 8,
            uppercase: /[A-Z]/.test(password),
            lowercase: /[a-z]/.test(password),
            number: /[0-9]/.test(password),
            special: /[!@#$%^&*]/.test(password)
        };

        // Update requirement indicators
        Object.keys(requirements).forEach(req => {
            const element = document.getElementById(req);
            if (requirements[req]) {
                element.classList.add('met');
                element.querySelector('i').classList.remove('fa-circle');
                element.querySelector('i').classList.add('fa-check-circle');
            } else {
                element.classList.remove('met');
                element.querySelector('i').classList.remove('fa-check-circle');
                element.querySelector('i').classList.add('fa-circle');
            }
        });

        // Calculate strength
        const strength = Object.values(requirements).filter(Boolean).length;
        const meterSections = document.querySelectorAll('.meter-section');
        const strengthText = document.querySelector('.strength-text');

        meterSections.forEach((section, index) => {
            section.className = 'meter-section';
            if (index < strength) {
                if (strength <= 2) section.classList.add('weak');
                else if (strength <= 4) section.classList.add('medium');
                else section.classList.add('strong');
            }
        });

        // Update strength text
        if (password.length === 0) strengthText.textContent = 'Password Strength';
        else if (strength <= 2) strengthText.textContent = 'Weak';
        else if (strength <= 4) strengthText.textContent = 'Medium';
        else strengthText.textContent = 'Strong';
    }

    static showError(elementId, message) {
        const errorElement = document.getElementById(elementId);
        if (errorElement) {
            errorElement.textContent = message;
            errorElement.classList.add('show');
        } else {
            console.warn(`Error element ${elementId} not found`);
        }
    }

    static hideError(elementId) {
        const errorElement = document.getElementById(elementId);
       if (errorElement) {
            errorElement.classList.remove('show');
            errorElement.textContent = ''; // Clear error text
        } else {
            console.warn(`Error element ${elementId} not found`);
        }
    }

    static resetForms() {
        // Reset all forms
        const forms = document.querySelectorAll('form');
        forms.forEach(form => form.reset());

        // Reset password strength meter
        const meterSections = document.querySelectorAll('.meter-section');
        meterSections.forEach(section => {
            section.className = 'meter-section';
        });

        // Reset requirements
        const requirements = document.querySelectorAll('.requirement');
        requirements.forEach(req => {
            req.classList.remove('met');
            const icon = req.querySelector('i');
            icon.classList.remove('fa-check-circle');
            icon.classList.add('fa-circle');
        });

        // Hide all error messages
        const errorMessages = document.querySelectorAll('.error-message');
        errorMessages.forEach(error => error.classList.remove('show'));
    }

    static showForgotPassword() {
        this.toggleForms('forgot');
    }
}

// Expose methods globally for inline onclick attributes
window.Modal = Modal;
