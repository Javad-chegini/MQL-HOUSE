const themeToggle = document.getElementById('themeToggle');
const currentTheme = localStorage.getItem('theme') || 'light';

if (currentTheme === 'dark') {
    document.documentElement.setAttribute('data-theme', 'dark');
}

themeToggle.addEventListener('click', function() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';

    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
});


const signupForm = document.getElementById('signupForm');
const passwordToggle = document.getElementById('passwordToggle');
const confirmPasswordToggle = document.getElementById('confirmPasswordToggle');
const passwordInput = document.getElementById('password');
const confirmPasswordInput = document.getElementById('confirmPassword');
const submitBtn = document.querySelector('.signup-btn');

let isSubmitting = false;


function setupPasswordToggle(toggleBtn, inputField) {
    if (!toggleBtn || !inputField) return;
    
    toggleBtn.addEventListener('click', function() {
        const type = inputField.getAttribute('type') === 'password' ? 'text' : 'password';
        inputField.setAttribute('type', type);

        const icon = this.querySelector('i');
        if (icon) {
            if (type === 'text') {
                icon.classList.remove('fa-eye');
                icon.classList.add('fa-eye-slash');
            } else {
                icon.classList.remove('fa-eye-slash');
                icon.classList.add('fa-eye');
            }
        }
    });
}

setupPasswordToggle(passwordToggle, passwordInput);
setupPasswordToggle(confirmPasswordToggle, confirmPasswordInput);


function validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

function validatePhone(phone) {
    const phoneRegex = /^(\+98|0)?9[0-9]{9}$/;
    return phoneRegex.test(phone.replace(/\s/g, ''));
}

function validatePassword(password) {
    return password.length >= 8;
}

function validateName(name) {
    return name.trim().length >= 2;
}


function showError(input, message) {
    if (!input) return;
    
    clearError(input);
    input.classList.add('error');

    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.innerHTML = `<i class="fas fa-exclamation-triangle"></i> ${message}`;

    input.parentNode.appendChild(errorDiv);
}

function clearError(input) {
    if (!input) return;
    
    input.classList.remove('error');
    const errorMessage = input.parentNode.querySelector('.error-message');
    if (errorMessage) {
        errorMessage.remove();
    }
}

function showNotification(message, type = 'success') {
    
    const existingNotifications = document.querySelectorAll('.notification');
    existingNotifications.forEach(notif => notif.remove());

    const notification = document.createElement('div');
    notification.className = `notification ${type}`;

    const icon = type === 'success' ? 'fa-check-circle' : 'fa-exclamation-triangle';
    notification.innerHTML = `<i class="fas ${icon}"></i> ${message}`;

    document.body.appendChild(notification);

    setTimeout(() => {
        if (notification.parentNode) {
            notification.remove();
        }
    }, 4000);
}


function setupLiveValidation() {
    const emailInput = document.getElementById('email');
    const phoneInput = document.getElementById('phone');

    if (emailInput) {
        emailInput.addEventListener('blur', function() {
            const email = this.value.trim();
            if (email && !validateEmail(email)) {
                showError(this, 'لطفاً آدرس ایمیل معتبر وارد کنید');
            } else {
                clearError(this);
            }
        });
    }

    if (phoneInput) {
        phoneInput.addEventListener('blur', function() {
            const phone = this.value.trim();
            if (phone && !validatePhone(phone)) {
                showError(this, 'لطفاً شماره تلفن همراه معتبر وارد کنید');
            } else {
                clearError(this);
            }
        });
    }

    if (passwordInput) {
        passwordInput.addEventListener('blur', function() {
            const password = this.value;
            if (password && !validatePassword(password)) {
                showError(this, 'رمز عبور باید حداقل ۸ کاراکتر باشد');
            } else {
                clearError(this);
            }
        });
    }

    if (confirmPasswordInput) {
        confirmPasswordInput.addEventListener('blur', function() {
            const password = passwordInput.value;
            const confirmPassword = this.value;
            if (confirmPassword && password !== confirmPassword) {
                showError(this, 'رمز عبور و تأیید آن یکسان نیستند');
            } else {
                clearError(this);
            }
        });
    }
}


function setupInputClearError() {
    document.querySelectorAll('.form-input').forEach(input => {
        input.addEventListener('input', function() {
            if (this.classList.contains('error')) {
                clearError(this);
            }
        });
    });
}


function handleSpecificErrors(error, result) {
    const errorMessages = {
        'invalid_email': 'آدرس ایمیل نامعتبر است',
        'invalid_phone': 'شماره تلفن نامعتبر است',
        'weak_password': 'رمز عبور خیلی ساده است',
        'email_exists': 'این ایمیل قبلاً ثبت شده است',
        'phone_exists': 'این شماره تلفن قبلاً ثبت شده است',
        'no_params': 'لطفاً تمام فیلدها را پر کنید',
        'network_error': 'خطا در اتصال به سرور. لطفاً دوباره تلاش کنید'
    };

    let errorMessage = result.msg || errorMessages[error] || 'خطا در ثبت نام';

    switch(error) {
        case 'email_exists':
        case 'invalid_email':
            showError(document.getElementById('email'), errorMessage);
            break;
        case 'phone_exists':
        case 'invalid_phone':
            showError(document.getElementById('phone'), errorMessage);
            break;
        case 'weak_password':
            showError(passwordInput, errorMessage);
            break;
        default:
            showNotification(errorMessage, 'error');
    }
}


function saveTokens(tokens, remember = false) {
    if (!tokens) return;
    
    const storage = remember ? localStorage : sessionStorage;
    
    if (tokens.access) {
        storage.setItem('access_token', tokens.access);
    }
    if (tokens.refresh) {
        storage.setItem('refresh_token', tokens.refresh);
    }
}


function checkAuthStatus() {
    try {
        const { accessToken, error } = accessTokenFinder();
        if (!error && accessToken) {
            
            window.location.href = '/dashboard.html';
        }
    } catch (error) {
        console.log('Auth check failed:', error);
    }
}


async function handleFormSubmit(e) {
    e.preventDefault();

    if (isSubmitting) return;

    const formData = new FormData(signupForm);
    const firstName = formData.get('firstName')?.trim() || '';
    const lastName = formData.get('lastName')?.trim() || '';
    const email = formData.get('email')?.trim() || '';
    const phone = formData.get('phone')?.trim() || '';
    const password = formData.get('password') || '';
    const confirmPassword = formData.get('confirmPassword') || '';
    const terms = formData.get('terms');

    
    document.querySelectorAll('.form-input').forEach(input => clearError(input));

    
    let hasError = false;

    if (!validateName(firstName)) {
        showError(document.getElementById('firstName'), 'لطفاً نام خود را وارد کنید');
        hasError = true;
    }

    if (!validateName(lastName)) {
        showError(document.getElementById('lastName'), 'لطفاً نام خانوادگی خود را وارد کنید');
        hasError = true;
    }

    if (!email) {
        showError(document.getElementById('email'), 'لطفاً آدرس ایمیل خود را وارد کنید');
        hasError = true;
    } else if (!validateEmail(email)) {
        showError(document.getElementById('email'), 'لطفاً آدرس ایمیل معتبر وارد کنید');
        hasError = true;
    }

    if (!phone) {
        showError(document.getElementById('phone'), 'لطفاً شماره تلفن همراه خود را وارد کنید');
        hasError = true;
    } else if (!validatePhone(phone)) {
        showError(document.getElementById('phone'), 'لطفاً شماره تلفن همراه معتبر وارد کنید');
        hasError = true;
    }

    if (!password) {
        showError(passwordInput, 'لطفاً رمز عبور خود را وارد کنید');
        hasError = true;
    } else if (!validatePassword(password)) {
        showError(passwordInput, 'رمز عبور باید حداقل ۸ کاراکتر باشد');
        hasError = true;
    }

    if (!confirmPassword) {
        showError(confirmPasswordInput, 'لطفاً تأیید رمز عبور را وارد کنید');
        hasError = true;
    } else if (password !== confirmPassword) {
        showError(confirmPasswordInput, 'رمز عبور و تأیید آن یکسان نیستند');
        hasError = true;
    }

    if (!terms) {
        showNotification('لطفاً شرایط و قوانین را بپذیرید', 'error');
        hasError = true;
    }

    if (hasError) {
        const firstError = signupForm.querySelector('.form-input.error');
        if (firstError) firstError.focus();
        return;
    }

    
    setLoadingState(true);

    try {
        
        const result = await signup(email, phone, password, firstName, lastName);

        if (result.error) {
            
            handleSpecificErrors(result.error, result);
        } else {
            
            showNotification(result.msg || 'ثبت نام موفقیت‌آمیز!', 'success');

            
            if (result.tokens) {
                saveTokens(result.tokens, true); 
            }

            
            signupForm.reset();

            
            setTimeout(() => {
                if (result.user && result.tokens) {
                    
                    window.location.href = '/dashboard.html';
                } else {
                    
                    window.location.href = 'indexl.html';
                }
            }, 2000);
        }

    } catch (error) {
        console.error('Signup error:', error);
        showNotification('خطای غیرمنتظره. لطفاً دوباره تلاش کنید', 'error');
    } finally {
        setLoadingState(false);
    }
}


function setLoadingState(loading) {
    isSubmitting = loading;
    
    if (!submitBtn) return;
    
    if (loading) {
        submitBtn.dataset.originalText = submitBtn.innerHTML;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> در حال ثبت نام...';
        submitBtn.disabled = true;
        signupForm.classList.add('loading');
    } else {
        submitBtn.innerHTML = submitBtn.dataset.originalText || 'ثبت نام';
        submitBtn.disabled = false;
        signupForm.classList.remove('loading');
    }
}


function setupFocusEffects() {
    document.querySelectorAll('.form-input').forEach(input => {
        input.addEventListener('focus', function() {
            if (this.parentNode) {
                this.parentNode.style.transform = 'translateY(-2px)';
            }
        });

        input.addEventListener('blur', function() {
            if (this.parentNode) {
                this.parentNode.style.transform = 'translateY(0)';
            }
        });
    });
}


function initializeSignupPage() {
    
    checkAuthStatus();
    
    
    setupLiveValidation();
    
    
    setupInputClearError();
    
    
    setupFocusEffects();
    
    
    if (signupForm) {
        signupForm.addEventListener('submit', handleFormSubmit);
    }
    
    console.log('صفحه ثبت نام با API کاملاً متصل شد');
}


document.addEventListener('DOMContentLoaded', initializeSignupPage);


if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeSignupPage);
} else {
    initializeSignupPage();
}


window.signupPageUtils = {
    validateEmail,
    validatePhone,
    validatePassword,
    validateName,
    showError,
    clearError,
    showNotification,
    handleSpecificErrors,
    saveTokens,
    checkAuthStatus
};