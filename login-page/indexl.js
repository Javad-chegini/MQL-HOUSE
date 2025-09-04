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
const loginForm = document.getElementById('loginForm');
const passwordToggle = document.getElementById('passwordToggle');
const passwordInput = document.getElementById('password');
const emailInput = document.getElementById('email');
const submitBtn = document.querySelector('.login-btn');
let isSubmitting = false;
passwordToggle.addEventListener('click', function() {
    const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
    passwordInput.setAttribute('type', type);
    const icon = this.querySelector('i');
    if (type === 'text') {
        icon.classList.remove('fa-eye');
        icon.classList.add('fa-eye-slash');
    } else {
        icon.classList.remove('fa-eye-slash');
        icon.classList.add('fa-eye');
    }
});
function validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email) || email.length > 3;
}
function validatePassword(password) {
    return password.length >= 6;
}
function showError(input, message) {
    clearError(input);
    input.classList.add('error');
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.innerHTML = `<i class="fas fa-exclamation-triangle"></i> ${message}`;
    input.parentNode.appendChild(errorDiv);
}
function clearError(input) {
    input.classList.remove('error');
    const errorMessage = input.parentNode.querySelector('.error-message');
    if (errorMessage) {
        errorMessage.remove();
    }
}
function showNotification(message, type = 'success') {
    const existingNotifications = document.querySelectorAll('.notification');
    existingNotifications.forEach(notification => notification.remove());
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    const icon = type === 'success' ? 'fa-check-circle' : 'fa-exclamation-triangle';
    notification.innerHTML = `<i class="fas ${icon}"></i> ${message}`;
    Object.assign(notification.style, {
        position: 'fixed',
        top: '20px',
        right: '20px',
        padding: '15px 20px',
        borderRadius: '8px',
        color: 'white',
        fontFamily: 'Vazir, sans-serif',
        fontSize: '14px',
        fontWeight: '500',
        zIndex: '10000',
        minWidth: '300px',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
        animation: 'slideInRight 0.3s ease-out',
        display: 'flex',
        alignItems: 'center',
        gap: '10px'
    });
    if (type === 'success') {
        notification.style.background = 'linear-gradient(135deg, #10b981, #059669)';
    } else {
        notification.style.background = 'linear-gradient(135deg, #ef4444, #dc2626)';
    }
    document.body.appendChild(notification);
    setTimeout(() => {
        notification.style.animation = 'slideOutRight 0.3s ease-in';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 300);
    }, 4000);
}
function getErrorMessage(error) {
    const errorMessages = {
        'no_authenticated': 'لطفاً وارد حساب کاربری خود شوید',
        'invalid_credentials': 'ایمیل یا رمز عبور اشتباه است',
        'user_not_found': 'کاربری با این مشخصات یافت نشد',
        'account_disabled': 'حساب کاربری شما غیرفعال است',
        'too_many_attempts': 'تعداد تلاش‌های شما بیش از حد مجاز است',
        'server_error': 'خطای سرور. لطفاً بعداً تلاش کنید',
        'no params': 'لطفاً تمام فیلدها را پر کنید',
        'network_error': 'خطا در اتصال به اینترنت',
        'timeout': 'زمان اتصال تمام شد. لطفاً دوباره تلاش کنید'
    };
    return errorMessages[error] || 'خطای ناشناخته رخ داده است';
}
emailInput.addEventListener('blur', function() {
    const email = this.value.trim();
    if (email && !validateEmail(email)) {
        showError(this, 'لطفاً ایمیل یا نام کاربری معتبر وارد کنید');
    } else {
        clearError(this);
    }
});
passwordInput.addEventListener('blur', function() {
    const password = this.value;
    if (password && !validatePassword(password)) {
        showError(this, 'رمز عبور باید حداقل ۶ کاراکتر باشد');
    } else {
        clearError(this);
    }
});
[emailInput, passwordInput].forEach(input => {
    input.addEventListener('input', function() {
        if (this.classList.contains('error')) {
            clearError(this);
        }
    });
});
loginForm.addEventListener('submit', async function(e) {
    e.preventDefault();
    if (isSubmitting) return;
    const formData = new FormData(loginForm);
    const email = formData.get('email').trim();
    const password = formData.get('password');
    const remember = formData.get('remember') === 'on';
    clearError(emailInput);
    clearError(passwordInput);
    let hasError = false;
    if (!email) {
        showError(emailInput, 'لطفاً ایمیل یا نام کاربری خود را وارد کنید');
        hasError = true;
    } else if (!validateEmail(email)) {
        showError(emailInput, 'لطفاً ایمیل یا نام کاربری معتبر وارد کنید');
        hasError = true;
    }
    if (!password) {
        showError(passwordInput, 'لطفاً رمز عبور خود را وارد کنید');
        hasError = true;
    } else if (!validatePassword(password)) {
        showError(passwordInput, 'رمز عبور باید حداقل ۶ کاراکتر باشد');
        hasError = true;
    }
    if (hasError) {
        const firstError = loginForm.querySelector('.form-input.error');
        if (firstError) firstError.focus();
        return;
    }
    isSubmitting = true;
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> در حال ورود...';
    submitBtn.disabled = true;
    loginForm.classList.add('loading');
    try {
        const result = await manualLogin(email, password, remember);
        if (result.error) {
            showNotification(getErrorMessage(result.error), 'error');
            if (result.error.includes('email') || result.error.includes('user') || result.error.includes('credentials')) {
                showError(emailInput, 'ایمیل یا نام کاربری اشتباه است');
            } else if (result.error.includes('password')) {
                showError(passwordInput, 'رمز عبور اشتباه است');
            }
        } else {
            showNotification('ورود موفقیت‌آمیز! در حال انتقال...', 'success');
            if (result.tokens) {
                if (remember) {
                    localStorage.setItem('access_token', result.tokens.access);
                    if (result.tokens.refresh) {
                        localStorage.setItem('refresh_token', result.tokens.refresh);
                    }
                    localStorage.setItem('rememberLogin', 'true');
                    localStorage.setItem('savedEmail', email);
                } else {
                    sessionStorage.setItem('access_token', result.tokens.access);
                    if (result.tokens.refresh) {
                        sessionStorage.setItem('refresh_token', result.tokens.refresh);
                    }
                }
            }
            if (result.user) {
                const userData = {
                    ...result.user,
                    user_type: result.user_type
                };
                localStorage.setItem('user_data', JSON.stringify(userData));
            }
            setTimeout(() => {
                switch(result.user_type) {
                    case 'admin':
                        window.location.href = '/admin-dashboard';
                        break;
                    case 'user':
                        window.location.href = '/user-dashboard';
                        break;
                    case 'manager':
                        window.location.href = '/manager-dashboard';
                        break;
                    default:
                        window.location.href = '/dashboard';
                }
            }, 1500);
        }
    } catch (error) {
        console.error('خطا در ورود:', error);
        let errorMessage = 'خطا در اتصال به سرور. لطفاً دوباره تلاش کنید.';
        if (error.name === 'TypeError' && error.message.includes('fetch')) {
            errorMessage = 'خطا در اتصال به اینترنت. لطفاً اتصال خود را بررسی کنید.';
        } else if (error.name === 'AbortError') {
            errorMessage = 'زمان اتصال تمام شد. لطفاً دوباره تلاش کنید.';
        }
        showNotification(errorMessage, 'error');
    } finally {
        isSubmitting = false;
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
        loginForm.classList.remove('loading');
    }
});
function logout() {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    sessionStorage.removeItem('access_token');
    sessionStorage.removeItem('refresh_token');
    localStorage.removeItem('user_data');
    localStorage.removeItem('rememberLogin');
    localStorage.removeItem('savedEmail');
    showNotification('با موفقیت خارج شدید', 'success');
    setTimeout(() => {
        window.location.href = '/login';
    }, 1000);
}
document.addEventListener('DOMContentLoaded', async function() {
    console.log('شروع بررسی لاگین خودکار...');
    const { accessToken, error } = accessTokenFinder();
    if (!error && accessToken) {
        console.log('توکن موجود است، بررسی اعتبار...');
        try {
            const result = await login();
            if (!result.error) {
                console.log('لاگین خودکار موفق:', result.user_type);
                showNotification('خوش آمدید! در حال انتقال...', 'success');
                setTimeout(() => {
                    switch(result.user_type) {
                        case 'admin':
                            window.location.href = '/admin-dashboard';
                            break;
                        case 'user':
                            window.location.href = '/user-dashboard';
                            break;
                        case 'manager':
                            window.location.href = '/manager-dashboard';
                            break;
                        default:
                            window.location.href = '/dashboard';
                    }
                }, 1500);
                return;
            } else {
                console.log('توکن نامعتبر است:', result.error);
            }
        } catch (error) {
            console.log('خطا در لاگین خودکار:', error);
        }
    } else {
        console.log('توکن موجود نیست');
    }
    if (localStorage.getItem('rememberLogin') === 'true') {
        const savedEmail = localStorage.getItem('savedEmail');
        if (savedEmail) {
            emailInput.value = savedEmail;
            document.getElementById('remember').checked = true;
            console.log('اطلاعات ذخیره شده بارگذاری شد');
        }
    }
});
document.addEventListener('keydown', function(e) {
    if (e.key === 'Enter' && !isSubmitting) {
        const activeElement = document.activeElement;
        if (activeElement === emailInput || activeElement === passwordInput) {
            loginForm.dispatchEvent(new Event('submit'));
        }
    }
    if (e.key === 'Escape') {
        emailInput.value = '';
        passwordInput.value = '';
        document.getElementById('remember').checked = false;
        clearError(emailInput);
        clearError(passwordInput);
        emailInput.focus();
    }
    if (e.ctrlKey && e.key === 't') {
        e.preventDefault();
        themeToggle.click();
    }
});
document.querySelectorAll('.form-input').forEach(input => {
    input.addEventListener('focus', function() {
        this.parentNode.style.transform = 'translateY(-2px)';
        this.parentNode.style.boxShadow = '0 8px 25px rgba(37, 99, 235, 0.15)';
    });
    input.addEventListener('blur', function() {
        this.parentNode.style.transform = 'translateY(0)';
        this.parentNode.style.boxShadow = '';
    });
});
const style = document.createElement('style');
style.textContent = `
    @keyframes slideInRight {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    @keyframes slideOutRight {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
    .form-group {
        transition: all 0.3s ease;
    }
    .loading .form-input {
        pointer-events: none;
        opacity: 0.7;
    }
    .loading .login-btn {
        transform: none !important;
        box-shadow: none !important;
    }
`;
document.head.appendChild(style);
window.addEventListener('load', function() {
    const importantPages = ['/dashboard', '/admin-dashboard', '/user-dashboard'];
    importantPages.forEach(page => {
        const link = document.createElement('link');
        link.rel = 'prefetch';
        link.href = page;
        document.head.appendChild(link);
    });
});
window.addEventListener('online', function() {
    showNotification('اتصال اینترنت برقرار شد', 'success');
});
window.addEventListener('offline', function() {
    showNotification('اتصال اینترنت قطع شد', 'error');
});
if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    console.log('🚀 صفحه لاگین در حالت Debug بارگذاری شد');
    console.log('📧 برای تست: admin / 123456');
    const testBtn = document.createElement('button');
    testBtn.textContent = 'تست سریع';
    testBtn.style.cssText = `
        position: fixed;
        bottom: 20px;
        left: 20px;
        padding: 10px 15px;
        background: #6366f1;
        color: white;
        border: none;
        border-radius: 6px;
        cursor: pointer;
        font-family: Vazir;
        z-index: 9999;
    `;
    testBtn.onclick = function() {
        emailInput.value = 'admin';
        passwordInput.value = '123456';
        document.getElementById('remember').checked = true;
    };
    document.body.appendChild(testBtn);
}
console.log('✅ صفحه لاگین مدرن با API کامل بارگذاری شد');