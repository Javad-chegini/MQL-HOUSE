class UserAuthManager {
    constructor() {
        this.init();
    }
    async init() {
        const loginResult = await login();
        if (!loginResult.error && loginResult.user) {
            this.updateUIForLoggedInUser(loginResult.user);
        }
    }
    updateUIForLoggedInUser(user) {
        const loginBtn = document.querySelector('a[href*="login-page"]');
        const signupBtn = document.querySelector('a[href*="signup-page"]');
        if (loginBtn && user.first_name) {
            loginBtn.textContent = `سلام، ${user.first_name}`;
            loginBtn.href = '#';
            loginBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.showUserMenu();
            });
        }
        if (signupBtn) {
            signupBtn.textContent = 'خروج';
            signupBtn.href = '#';
            signupBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.logout();
            });
        }
        const mobileLoginBtn = document.querySelector('#mobileMenu a[href*="login-page"]');
        const mobileSignupBtn = document.querySelector('#mobileMenu a[href*="signup-page"]');
        if (mobileLoginBtn && user.first_name) {
            mobileLoginBtn.textContent = `سلام، ${user.first_name}`;
            mobileLoginBtn.href = '#';
            mobileLoginBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.showUserMenu();
            });
        }
        if (mobileSignupBtn) {
            mobileSignupBtn.textContent = 'خروج';
            mobileSignupBtn.href = '#';
            mobileSignupBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.logout();
            });
        }
    }
    async logout() {
        clearTokens();
        window.location.reload();
    }
    showUserMenu() {
        alert('پنل کاربری در حال توسعه است');
    }
}
class OrderFormManager {
    constructor() {
        this.createOrderSection();
    }
    createOrderSection() {
        const { accessToken, error } = accessTokenFinder();
        if (!error && accessToken) {
            const teamSection = document.querySelector('.team-section');
            if (teamSection) {
                const orderHTML = `
                    <section class="order-section" style="padding: 80px 0; background: var(--light);">
                        <div class="container">
                            <h2 class="section-title">ثبت سفارش جدید</h2>
                            <form id="orderForm" class="order-form" style="max-width: 600px; margin: 0 auto;">
                                <div class="form-group" style="margin-bottom: 20px;">
                                    <label style="display: block; margin-bottom: 5px; font-weight: 600;">عنوان پروژه:</label>
                                    <input type="text" id="orderTitle" required style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 5px; font-family: inherit;">
                                </div>
                                <div class="form-group" style="margin-bottom: 20px;">
                                    <label style="display: block; margin-bottom: 5px; font-weight: 600;">توضیحات پروژه:</label>
                                    <textarea id="orderDescription" rows="4" required style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 5px; font-family: inherit; resize: vertical;"></textarea>
                                </div>
                                <div class="form-group" style="margin-bottom: 20px;">
                                    <label style="display: block; margin-bottom: 5px; font-weight: 600;">ابزارهای مورد نیاز:</label>
                                    <input type="text" id="orderTools" required placeholder="مثال: MT4, MT5, Python" style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 5px; font-family: inherit;">
                                </div>
                                <button type="submit" class="btn-primary" style="background: var(--primary); color: white; padding: 12px 30px; border: none; border-radius: 5px; cursor: pointer; font-size: 16px; font-weight: 600; transition: all 0.3s ease;">ارسال سفارش</button>
                            </form>
                            <div id="orderMessage" style="margin-top: 20px; text-align: center;"></div>
                        </div>
                    </section>
                `;
                teamSection.insertAdjacentHTML('afterend', orderHTML);
                this.initOrderForm();
            }
        }
    }
    initOrderForm() {
        const form = document.getElementById('orderForm');
        if (form) {
            form.addEventListener('submit', async (e) => {
                e.preventDefault();
                const title = document.getElementById('orderTitle').value;
                const description = document.getElementById('orderDescription').value;
                const tools = document.getElementById('orderTools').value;
                const submitBtn = form.querySelector('button[type="submit"]');
                const messageDiv = document.getElementById('orderMessage');
                messageDiv.innerHTML = '<p style="color: #007bff;">در حال ارسال سفارش...</p>';
                submitBtn.disabled = true;
                const result = await subOrder(title, description, tools);
                if (result.error) {
                    let errorMessage = 'مشکلی پیش آمده';
                    if (result.error === 'no_authenticated') {
                        errorMessage = 'لطفا وارد شوید';
                    } else if (result.error === 'no_params') {
                        errorMessage = 'لطفا همه فیلدها را پر کنید';
                    }
                    messageDiv.innerHTML = `<p style="color: #dc3545;">خطا: ${errorMessage}</p>`;
                } else {
                    messageDiv.innerHTML = '<p style="color: #28a745;">سفارش شما با موفقیت ثبت شد!</p>';
                    form.reset();
                    setTimeout(() => {
                        messageDiv.innerHTML = '';
                    }, 3000);
                }
                submitBtn.disabled = false;
            });
            const submitBtn = form.querySelector('button[type="submit"]');
            submitBtn.addEventListener('mouseenter', function() {
                this.style.transform = 'translateY(-2px)';
                this.style.boxShadow = '0 5px 15px rgba(0,0,0,0.1)';
            });
            submitBtn.addEventListener('mouseleave', function() {
                this.style.transform = 'translateY(0)';
                this.style.boxShadow = 'none';
            });
        }
    }
}
class AboutHeaderAnimation {
    constructor() {
        this.header = document.getElementById('header');
        this.hamburger = document.getElementById('hamburger');
        this.mobileMenu = document.getElementById('mobileMenu');
        this.navLinks = document.querySelectorAll('.nav-link[data-nav]');
        this.themeToggle = document.getElementById('themeToggle');
        this.mobileThemeToggle = document.getElementById('mobileThemeToggle');
        this.init();
        this.userAuthManager = new UserAuthManager();
        this.orderFormManager = new OrderFormManager();
    }
    init() {
        this.initNavigation();
        this.initMobileMenu();
        this.initThemeToggle();
    }
    initNavigation() {
        if (!this.navLinks.length) {
            console.warn('No navigation links found');
            return;
        }
        this.navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                const href = link.getAttribute('href');
                if (href.startsWith('#')) {
                    e.preventDefault();
                    const section = document.querySelector(href);
                    if (section) {
                        this.navLinks.forEach(l => l.classList.remove('active'));
                        link.classList.add('active');
                        section.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }
                }
            });
        });
    }
    initMobileMenu() {
        if (!this.hamburger || !this.mobileMenu) {
            console.warn('Hamburger or MobileMenu not found');
            return;
        }
        this.hamburger.addEventListener('click', () => {
            const isActive = this.hamburger.classList.toggle('active');
            this.mobileMenu.classList.toggle('active');
            document.body.style.overflow = isActive ? 'hidden' : '';
        });
        this.mobileMenu.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', () => {
                this.hamburger.classList.remove('active');
                this.mobileMenu.classList.remove('active');
                document.body.style.overflow = '';
            });
        });
    }
    initThemeToggle() {
        const savedTheme = localStorage.getItem('theme');
        const isDark = savedTheme === 'dark';
        if (isDark) {
            document.body.classList.add('dark-mode');
        }
        this.updateThemeIcon(isDark);
        const toggleTheme = () => {
            const isDarkNow = document.body.classList.toggle('dark-mode');
            localStorage.setItem('theme', isDarkNow ? 'dark' : 'light');
            this.updateThemeIcon(isDarkNow);
        };
        if (this.themeToggle) {
            this.themeToggle.addEventListener('click', toggleTheme);
            this.themeToggle.style.cursor = 'pointer';
        } else {
            console.warn('Desktop theme toggle not found');
        }
        if (this.mobileThemeToggle) {
            this.mobileThemeToggle.addEventListener('click', toggleTheme);
            this.mobileThemeToggle.style.cursor = 'pointer';
            if (!this.mobileThemeToggle.querySelector('svg')) {
                const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
                this.mobileThemeToggle.appendChild(svg);
                console.log('Created missing SVG for mobile theme toggle');
            }

        } else {
            console.warn('Mobile theme toggle not found – Check HTML for #mobileThemeToggle');
        }
    }
    updateThemeIcon(isDark) {
        const icons = [];
        if (this.themeToggle?.querySelector('svg')) icons.push(this.themeToggle.querySelector('svg'));
        if (this.mobileThemeToggle?.querySelector('svg')) icons.push(this.mobileThemeToggle.querySelector('svg'));
        if (!icons.length) {
            console.warn('No theme toggle icons found – Ensure <svg> exists inside buttons');
            return;
        }
        icons.forEach(icon => {
            icon.style.transition = 'fill 0.3s ease, transform 0.4s ease';
            if (isDark) {
                icon.setAttribute('viewBox', '0 0 24 24');
                icon.innerHTML = '<path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/>';
                icon.style.fill = 'white';
            } else {
                icon.setAttribute('viewBox', '0 0 200 200');
                icon.innerHTML = `
                    <circle cx="100" cy="100" r="40" fill="currentColor" />
                    <g fill="currentColor">
                        <polygon points="100,10 90,40 110,40" />
                        <polygon points="100,190 110,160 90,160" />
                        <polygon points="190,100 160,90 160,110" />
                        <polygon points="10,100 40,110 40,90" />
                        <polygon points="160,40 135,55 145,65" />
                        <polygon points="160,160 145,135 135,145" />
                        <polygon points="40,160 65,145 55,135" />
                        <polygon points="40,40 55,65 65,55" />
                    </g>
                `;
                icon.style.fill = 'var(--primary)';
            }
        });
    }
}
document.addEventListener('DOMContentLoaded', () => {
    try {
        new AboutHeaderAnimation();
        document.documentElement.style.visibility = 'visible';
    } catch (error) {
        console.error('Error initializing AboutHeaderAnimation:', error);
    }
});
