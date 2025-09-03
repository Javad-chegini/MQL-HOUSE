document.addEventListener('DOMContentLoaded', function() {
    const emailInput = document.querySelector('input[type="email"]') || document.querySelector('#email');
    const codeInput = document.querySelector('input[placeholder*="کد"]') || document.querySelector('#code');
    const passwordInput = document.querySelector('input[type="password"]') || document.querySelector('#newPassword');
    const sendCodeBtn = document.querySelector('button');
    const verifyBtn = document.querySelectorAll('button')[1];
    const resendBtn = document.querySelector('.resend-btn') || document.querySelector('button[disabled]');

    let currentEmail = '';
    let isCodeSent = false;
    let countdownTimer = null;

    if (sendCodeBtn) {
        sendCodeBtn.addEventListener('click', async function(e) {
            e.preventDefault();

            if (!isCodeSent) {
                const email = emailInput ? emailInput.value.trim() : '';
                if (!email || !validateEmail(email)) {
                    showNotification('لطفاً ایمیل معتبر وارد کنید', 'error');
                    return;
                }
                setButtonLoading(this, true, 'در حال ارسال...');
                try {
                    const result = await forgotPassword(email);
                    if (result.error) {
                        showNotification('خطا در ارسال کد. لطفاً دوباره تلاش کنید', 'error');
                    } else {
                        currentEmail = email;
                        isCodeSent = true;
                        this.textContent = 'تأیید';
                        showStep2();
                        startCountdown();
                        showNotification('کد تایید به ایمیل شما ارسال شد', 'success');
                    }
                } catch (error) {
                    showNotification('خطا در اتصال به سرور', 'error');
                }
                setButtonLoading(this, false, 'تأیید');
            } else {
                const code = codeInput ? codeInput.value.trim() : '';
                const password = passwordInput ? passwordInput.value.trim() : '';
                if (!code || code.length < 4) {
                    showNotification('کد تایید را به درستی وارد کنید', 'error');
                    return;
                }
                if (!password || password.length < 6) {
                    showNotification('رمز عبور باید حداقل 6 کاراکتر باشد', 'error');
                    return;
                }
                setButtonLoading(this, true, 'در حال تایید...');
                try {
                    const result = await verifyResetCode(currentEmail, code, password);
                    if (result.error) {
                        if (result.error.includes('code')) {
                            showNotification('کد تایید نامعتبر است', 'error');
                        } else {
                            showNotification('خطا در تغییر رمز عبور', 'error');
                        }
                    } else {
                        showNotification('رمز عبور با موفقیت تغییر کرد', 'success');
                        setTimeout(() => {
                            window.location.href = 'indexl.html';
                        }, 2000);
                        return;
                    }
                } catch (error) {
                    showNotification('خطا در اتصال به سرور', 'error');
                }
                setButtonLoading(this, false, 'تأیید');
            }
        });
    }

    if (resendBtn) {
        resendBtn.addEventListener('click', async function() {
            if (this.disabled || !currentEmail) return;
            setButtonLoading(this, true, 'در حال ارسال...');
            try {
                const result = await forgotPassword(currentEmail);
                if (!result.error) {
                    startCountdown();
                    showNotification('کد جدید ارسال شد', 'success');
                } else {
                    showNotification('خطا در ارسال کد', 'error');
                }
            } catch (error) {
                showNotification('خطا در اتصال به سرور', 'error');
            }
            setButtonLoading(this, false, 'ارسال مجدد');
        });
    }

    function validateEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    function showStep2() {
        if (codeInput) {
            codeInput.style.display = 'block';
            codeInput.focus();
        }
        if (passwordInput) {
            passwordInput.style.display = 'block';
        }
        if (resendBtn) {
            resendBtn.style.display = 'inline-block';
        }
    }

    function startCountdown() {
        if (!resendBtn) return;
        let timeLeft = 60;
        resendBtn.disabled = true;
        countdownTimer = setInterval(() => {
            timeLeft--;
            resendBtn.textContent = `ارسال مجدد تا ${timeLeft} ثانیه`;
            if (timeLeft <= 0) {
                clearInterval(countdownTimer);
                resendBtn.disabled = false;
                resendBtn.textContent = 'ارسال مجدد';
            }
        }, 1000);
    }

    function setButtonLoading(button, loading, text = '') {
        if (loading) {
            button.disabled = true;
            button.innerHTML = `<i class="fas fa-spinner fa-spin"></i> ${text}`;
        } else {
            button.disabled = false;
            button.textContent = text;
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
});
