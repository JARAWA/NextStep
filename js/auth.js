class Auth {
    static isLoggedIn = false;
    static user = null;

    static init() {
        this.checkAuthStatus();
        this.setupAuthButtons();
    }

    static checkAuthStatus() {
        const savedUser = localStorage.getItem('user');
        if (savedUser) {
            this.user = JSON.parse(savedUser);
            this.isLoggedIn = true;
            this.updateUI();
        }
    }

    static setupAuthButtons() {
        // Find all buttons that require login
        const generateButtons = document.querySelectorAll('[data-requires-login="true"]');
        
        generateButtons.forEach(btn => {
            const originalHref = btn.href; // Store original href if it's an anchor
            
            // Remove href to prevent direct navigation
            if (btn.tagName === 'A') {
                btn.removeAttribute('href');
            }

            btn.addEventListener('click', (e) => {
                e.preventDefault(); // Prevent default action
                
                if (!this.isLoggedIn) {
                    Modal.show(); // Show login modal
                } else {
                    // If it's an anchor and has an original href, navigate
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

    static validatePassword(password) {
        return {
            length: password.length >= 8,
            uppercase: /[A-Z]/.test(password),
            lowercase: /[a-z]/.test(password),
            number: /[0-9]/.test(password),
            special: /[!@#$%^&*]/.test(password)
        };
    }

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
            // Here you would typically make an API call to your backend
            const users = JSON.parse(localStorage.getItem('users') || '[]');
            
            if (users.some(user => user.email === email)) {
                Modal.showError('signupEmailError', 'Email already registered');
                return;
            }

            const newUser = {
                id: Date.now(),
                name,
                email,
                password: btoa(password) // Basic encoding (NOT secure for production!)
            };

            users.push(newUser);
            localStorage.setItem('users', JSON.stringify(users));

            // Auto login
            this.user = {
                id: newUser.id,
                name: newUser.name,
                email: newUser.email
            };
            this.isLoggedIn = true;
            localStorage.setItem('user', JSON.stringify(this.user));

            this.updateUI();
            Modal.hide();
            showToast('Account created successfully!', 'success');
        } catch (error) {
            console.error('Signup error:', error);
            showToast('Signup failed. Please try again.', 'error');
        }
    }

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
            const users = JSON.parse(localStorage.getItem('users') || '[]');
            const user = users.find(u => 
                u.email === email && 
                btoa(password) === u.password
            );

            if (!user) {
                Modal.showError('loginPasswordError', 'Invalid email or password');
                return;
            }

            this.user = {
                id: user.id,
                name: user.name,
                email: user.email
            };
            this.isLoggedIn = true;
            
            if (rememberMe) {
                localStorage.setItem('user', JSON.stringify(this.user));
            } else {
                sessionStorage.setItem('user', JSON.stringify(this.user));
            }

            this.updateUI();
            Modal.hide();
            showToast('Login successful!', 'success');
        } catch (error) {
            console.error('Login error:', error);
            showToast('Login failed. Please try again.', 'error');
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

        // Here you would typically make an API call to your backend
        // For demo, we'll just show a success message
        showToast('Password reset link sent to your email!', 'success');
        Modal.hide();
    }

    static logout() {
        this.user = null;
        this.isLoggedIn = false;
        localStorage.removeItem('user');
        sessionStorage.removeItem('user');
        this.updateUI();
        showToast('Logged out successfully', 'info');
    }

    static updateUI() {
        const generateButtons = document.querySelectorAll('[data-requires-login="true"]');
        const userInfo = document.getElementById('user-info');
        
        if (this.isLoggedIn) {
            generateButtons.forEach(btn => {
                if (btn.tagName === 'A') {
                    // Restore original href for anchor tags
                    if (btn.dataset.originalHref) {
                        btn.href = btn.dataset.originalHref;
                    }
                }
                btn.classList.add('active');
            });

            if (userInfo) {
                userInfo.innerHTML = `
                    <div class="user-menu">
                        <span>Welcome, ${this.user.name}</span>
                        <button onclick="Auth.logout()" class="logout-btn">
                            <i class="fas fa-sign-out-alt"></i> Logout
                        </button>
                    </div>
                `;
            }
        } else {
            generateButtons.forEach(btn => {
                if (btn.tagName === 'A') {
                    // Store and remove href
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