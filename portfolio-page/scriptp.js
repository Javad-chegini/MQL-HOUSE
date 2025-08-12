// scriptp.js - نسخه کامل با اتصال به API

// کلاس مدیریت Portfolio
class PortfolioManager {
    constructor() {
        this.portfolioCards = [];
        this.currentFilter = 'all';
        this.currentPage = 1;
        this.itemsPerPage = 9;
        this.isLoading = false;
        this.init();
    }

    // مقداردهی اولیه
    async init() {
        await this.checkAuthentication();
        this.setupEventListeners();
        await this.loadPortfolioItems();
        this.setupFilterButtons();
    }

    // بررسی وضعیت احراز هویت کاربر
    async checkAuthentication() {
        try {
            const loginResult = await login();

            if (loginResult.error === 'no_authenticated') {
                console.log('کاربر احراز هویت نشده است');
                this.updateUserInterface(null);
            } else if (loginResult.error === 'jwt_invalid') {
                // توکن نامعتبر - پاک کن و نمایش حالت خروج
                clearTokens();
                this.updateUserInterface(null);
            } else if (loginResult.user) {
                console.log('کاربر وارد شده:', loginResult.user);
                this.updateUserInterface(loginResult.user);
            }
        } catch (error) {
            console.error('خطا در بررسی احراز هویت:', error);
            this.updateUserInterface(null);
        }
    }

    // به‌روزرسانی رابط کاربری بر اساس وضعیت کاربر
    updateUserInterface(user) {
        const userMenuElement = document.querySelector('.user-menu');
        if (!userMenuElement) return;
        
        if (user) {
            userMenuElement.innerHTML = `
                <div class="user-info">
                    <span class="user-name">خوش آمدید، ${user.first_name} ${user.last_name}</span>
                    <button class="btn-logout" onclick="portfolioManager.handleLogout()">
                        <i class="fas fa-sign-out-alt"></i> خروج
                    </button>
                </div>
            `;
        } else {
            userMenuElement.innerHTML = `
                <a href="/login" class="btn-login">
                    <i class="fas fa-sign-in-alt"></i> ورود
                </a>
                <a href="/signup" class="btn-signup">
                    <i class="fas fa-user-plus"></i> ثبت نام
                </a>
            `;
        }
    }

    // خروج از حساب کاربری
    async handleLogout() {
        try {
            // پاک کردن توکن‌ها
            clearTokens();
            
            this.showSuccessMessage('با موفقیت از حساب خارج شدید');
            
            // بازنشانی رابط کاربری
            const userMenuElement = document.querySelector('.user-menu');
            if (userMenuElement) {
                userMenuElement.innerHTML = `
                    <a href="/login" class="btn-login">ورود</a>
                    <a href="/signup" class="btn-signup">ثبت نام</a>
                `;
            }
            
            // ریلود صفحه بعد از 1 ثانیه
            setTimeout(() => {
                window.location.reload();
            }, 1000);
            
        } catch (error) {
            console.error('خطا در خروج:', error);
            this.showErrorMessage('خطا در خروج از حساب');
        }
    }

    // نمایش پیام ورود
    showLoginPrompt() {
        const promptDiv = document.createElement('div');
        promptDiv.className = 'login-prompt';
        promptDiv.innerHTML = `
            <div class="prompt-content">
                <p>برای مشاهده کامل نمونه کارها، لطفاً وارد شوید</p>
                <button class="btn-login" onclick="window.location.href='/login'">ورود به حساب</button>
            </div>
        `;

        const container = document.querySelector('.portfolio-container');
        if (container) {
            container.insertBefore(promptDiv, container.firstChild);
        }
    }

    // بارگذاری آیتم‌های portfolio از API
    async loadPortfolioItems() {
        if (this.isLoading) return;

        this.isLoading = true;
        this.showLoadingState();

        try {
            const response = await this.fetchPortfolioItems();

            if (response.error) {
                this.showErrorMessage(response.error);
            } else {
                this.portfolioCards = response.items || [];
                this.renderPortfolioCards();
            }
        } catch (error) {
            console.error('خطا در بارگذاری نمونه کارها:', error);
            this.showErrorMessage('خطا در بارگذاری نمونه کارها');
        } finally {
            this.isLoading = false;
            this.hideLoadingState();
        }
    }

    // دریافت داده‌ها از API
    async fetchPortfolioItems() {
        const { accessToken, error } = accessTokenFinder();

        try {
            const response = await fetch('/api/portfolio/items/', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    ...(accessToken ? { 'Authorization': `Bearer ${accessToken}` } : {})
                }
            });

            if (!response.ok) {
                // اگر 401 بود یعنی نیاز به لاگین داره
                if (response.status === 401) {
                    this.showLoginPrompt();
                    return this.getPublicPortfolioData();
                }
                throw new Error('خطا در دریافت داده‌ها');
            }

            const data = await response.json();
            return { error: null, items: data.items || data };
            
        } catch (error) {
            console.error('خطا در fetch:', error);
            // در صورت خطا از داده‌های محلی استفاده کن
            return this.getPublicPortfolioData();
        }
    }

    // دریافت جزئیات پروژه از API
    async fetchProjectDetails(projectId) {
        const { accessToken } = accessTokenFinder();
        
        try {
            const response = await fetch(`/api/portfolio/items/${projectId}/`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    ...(accessToken ? { 'Authorization': `Bearer ${accessToken}` } : {})
                }
            });

            if (!response.ok) {
                throw new Error('خطا در دریافت جزئیات پروژه');
            }

            const data = await response.json();
            return { error: null, project: data };
            
        } catch (error) {
            console.error('خطا در دریافت جزئیات:', error);
            // استفاده از داده محلی در صورت خطا
            const localProject = this.portfolioCards.find(p => p.id == projectId);
            return { error: error.message, project: localProject };
        }
    }

    // داده‌های عمومی portfolio (برای زمانی که API در دسترس نیست)
    getPublicPortfolioData() {
        return {
            error: null,
            items: [
                {
                    id: 1,
                    title: 'ربات تریدینگ مارتینگل',
                    category: 'mql5',
                    description: 'اکسپرت با استراتژی مارتینگل هوشمند',
                    image: 'images/portfolio/martingale-bot.jpg',
                    tags: ['MQL5', 'Expert Advisor', 'Risk Management'],
                    date: '2024-11'
                },
                {
                    id: 2,
                    title: 'اندیکاتور RSI حرفه‌ای',
                    category: 'pinescript',
                    description: 'اندیکاتور RSI با سیگنال‌های دقیق',
                    image: 'images/portfolio/rsi-indicator.jpg',
                    tags: ['Pine Script', 'TradingView', 'Technical Analysis'],
                    date: '2024-10'
                },
                {
                    id: 3,
                    title: 'ربات هوش مصنوعی',
                    category: 'python',
                    description: 'ربات معاملاتی با یادگیری ماشین',
                    image: 'images/portfolio/ai-bot.jpg',
                    tags: ['Python', 'Machine Learning', 'AI'],
                    date: '2024-09'
                },
                {
                    id: 4,
                    title: 'سیستم اسکالپینگ',
                    category: 'csharp',
                    description: 'سیستم اسکالپینگ سریع cTrader',
                    image: 'images/portfolio/scalping-system.jpg',
                    tags: ['C#', 'cTrader', 'Scalping'],
                    date: '2024-08'
                },
                {
                    id: 5,
                    title: 'سیستم چند استراتژی',
                    category: 'mql4',
                    description: 'ترکیب چندین استراتژی در یک ربات',
                    image: 'images/portfolio/multi-strategy.jpg',
                    tags: ['MQL4', 'Multi-Strategy', 'MetaTrader 4'],
                    date: '2024-07'
                },
                {
                    id: 6,
                    title: 'استراتژی پرایس اکشن',
                    category: 'pinescript',
                    description: 'تحلیل خالص قیمت بدون اندیکاتور',
                    image: 'images/portfolio/price-action.jpg',
                    tags: ['Pine Script', 'Price Action', 'Strategy'],
                    date: '2024-06'
                }
            ]
        };
    }

    // رندر کردن کارت‌های portfolio
    renderPortfolioCards() {
        const container = document.querySelector('.portfolio-grid');
        if (!container) return;

        // فیلتر کردن کارت‌ها بر اساس دسته‌بندی انتخاب شده
        const filteredCards = this.currentFilter === 'all'
            ? this.portfolioCards
            : this.portfolioCards.filter(card => card.category === this.currentFilter);

        // پیجینیشن
        const startIndex = (this.currentPage - 1) * this.itemsPerPage;
        const endIndex = startIndex + this.itemsPerPage;
        const paginatedCards = filteredCards.slice(startIndex, endIndex);

        // رندر کارت‌ها
        container.innerHTML = paginatedCards.map(card => this.createCardHTML(card)).join('');

        // اضافه کردن event listeners به کارت‌های جدید
        this.attachCardEventListeners();

        // رندر pagination
        this.renderPagination(filteredCards.length);
    }

    // ایجاد HTML کارت
    createCardHTML(card) {
        return `
            <div class="portfolio-card show" data-category="${card.category}" data-id="${card.id}">
                <div class="portfolio-img-wrapper">
                    <img src="${card.image}" alt="${card.title}" class="portfolio-img"
                         onerror="this.src='images/portfolio/placeholder.jpg'">
                    <div class="portfolio-overlay">
                        <button class="btn-quick-view" data-id="${card.id}">
                            <i class="fas fa-eye"></i> مشاهده سریع
                        </button>
                    </div>
                </div>
                <div class="portfolio-content">
                    <h3 class="portfolio-title">${card.title}</h3>
                    <p class="portfolio-description">${card.description}</p>
                    <div class="portfolio-tags">
                        ${card.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
                    </div>
                    <div class="portfolio-footer">
                        <span class="portfolio-date">${this.formatDate(card.date)}</span>
                        <button class="view-details-btn" data-id="${card.id}">
                            نمایش جزئیات
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    // فرمت کردن تاریخ
    formatDate(dateString) {
        const months = {
            '01': 'فروردین', '02': 'اردیبهشت', '03': 'خرداد',
            '04': 'تیر', '05': 'مرداد', '06': 'شهریور',
            '07': 'مهر', '08': 'آبان', '09': 'آذر',
            '10': 'دی', '11': 'بهمن', '12': 'اسفند'
        };

        const [year, month] = dateString.split('-');
        return `${months[month]} ${year}`;
    }

    // رندر کردن صفحه‌بندی
    renderPagination(totalItems) {
        const totalPages = Math.ceil(totalItems / this.itemsPerPage);
        const paginationContainer = document.querySelector('.pagination');

        if (!paginationContainer || totalPages <= 1) return;

        let paginationHTML = '';

        // دکمه قبلی
        paginationHTML += `
            <button class="pagination-btn prev" ${this.currentPage === 1 ? 'disabled' : ''}
                    onclick="portfolioManager.changePage(${this.currentPage - 1})">
                <i class="fas fa-chevron-right"></i>
            </button>
        `;

        // شماره صفحات
        for (let i = 1; i <= totalPages; i++) {
            paginationHTML += `
                <button class="pagination-btn ${i === this.currentPage ? 'active' : ''}"
                        onclick="portfolioManager.changePage(${i})">${i}</button>
            `;
        }

        // دکمه بعدی
        paginationHTML += `
            <button class="pagination-btn next" ${this.currentPage === totalPages ? 'disabled' : ''}
                    onclick="portfolioManager.changePage(${this.currentPage + 1})">
                <i class="fas fa-chevron-left"></i>
            </button>
        `;

        paginationContainer.innerHTML = paginationHTML;
    }

    // تغییر صفحه
    changePage(page) {
        this.currentPage = page;
        this.renderPortfolioCards();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    // راه‌اندازی دکمه‌های فیلتر
    setupFilterButtons() {
        const filterButtons = document.querySelectorAll('.filter-btn');

        filterButtons.forEach(button => {
            button.addEventListener('click', () => {
                // حذف کلاس active از همه دکمه‌ها
                filterButtons.forEach(btn => btn.classList.remove('active'));

                // اضافه کردن کلاس active به دکمه کلیک شده
                button.classList.add('active');

                // اعمال فیلتر
                this.currentFilter = button.getAttribute('data-filter');
                this.currentPage = 1; // ریست صفحه به 1
                this.applyFilter();
            });
        });
    }

    // اعمال فیلتر با انیمیشن
    applyFilter() {
        const cards = document.querySelectorAll('.portfolio-card');

        cards.forEach(card => {
            const category = card.getAttribute('data-category');

            if (this.currentFilter === 'all' || category === this.currentFilter) {
                card.classList.remove('hide');
                setTimeout(() => {
                    card.classList.add('show');
                }, 10);
            } else {
                card.classList.remove('show');
                card.classList.add('hide');
            }
        });

        // رندر مجدد با فیلتر جدید
        setTimeout(() => {
            this.renderPortfolioCards();
        }, 300);
    }

    // اتصال event listeners به کارت‌ها
    attachCardEventListeners() {
        // دکمه‌های نمایش جزئیات
        document.querySelectorAll('.view-details-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const projectId = btn.getAttribute('data-id');
                this.showProjectDetails(projectId);
            });
        });

        // دکمه‌های مشاهده سریع
        document.querySelectorAll('.btn-quick-view').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const projectId = btn.getAttribute('data-id');
                this.showQuickView(projectId);
            });
        });

        // کلیک روی کارت
        document.querySelectorAll('.portfolio-card').forEach(card => {
            card.addEventListener('click', () => {
                const projectId = card.getAttribute('data-id');
                this.showProjectDetails(projectId);
            });
        });
    }

    // نمایش جزئیات پروژه
    async showProjectDetails(projectId) {
        const modal = this.createModal();
        
        // نمایش حالت لودینگ
        modal.innerHTML = `
            <div class="modal-content">
                <div class="loading-spinner">
                    <i class="fas fa-spinner fa-spin"></i>
                    <p>در حال بارگذاری...</p>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        setTimeout(() => modal.classList.add('show'), 10);
        
        // دریافت جزئیات از API
        const { error, project } = await this.fetchProjectDetails(projectId);
        
        if (!project) {
            modal.innerHTML = `
                <div class="modal-content">
                    <div class="error-message">
                        <i class="fas fa-exclamation-triangle"></i>
                        <p>پروژه یافت نشد</p>
                    </div>
                    <button class="modal-close" onclick="portfolioManager.closeModal()">بستن</button>
                </div>
            `;
            return;
        }

        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h2>${project.title}</h2>
                    <button class="modal-close" onclick="portfolioManager.closeModal()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="modal-body">
                    <div class="project-details-grid">
                        <div class="project-image">
                            <img src="${project.image}" alt="${project.title}"
                                 onerror="this.src='images/portfolio/placeholder.jpg'">
                        </div>
                        <div class="project-info">
                            <h3>توضیحات پروژه</h3>
                            <p>${project.description}</p>

                            <h3>تکنولوژی‌ها</h3>
                            <div class="portfolio-tags">
                                ${project.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
                            </div>

                            <h3>تاریخ تحویل</h3>
                            <p>${this.formatDate(project.date)}</p>

                            <div class="modal-actions">
                                <button class="btn-primary" onclick="portfolioManager.requestSimilarProject(${projectId})">
                                    <i class="fas fa-copy"></i> سفارش پروژه مشابه
                                </button>
                                <button class="btn-secondary" onclick="portfolioManager.contactUs(${projectId})">
                                    <i class="fas fa-phone"></i> تماس با ما
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    // نمایش سریع پروژه
    showQuickView(projectId) {
        const project = this.portfolioCards.find(p => p.id == projectId);

        if (!project) {
            this.showErrorMessage('پروژه یافت نشد');
            return;
        }

        const quickViewModal = this.createModal('quick-view-modal');

        quickViewModal.innerHTML = `
            <div class="quick-view-content">
                <button class="modal-close" onclick="portfolioManager.closeModal()">
                    <i class="fas fa-times"></i>
                </button>
                <img src="${project.image}" alt="${project.title}"
                     onerror="this.src='images/portfolio/placeholder.jpg'">
                <h3>${project.title}</h3>
                <p>${project.description}</p>
                <button class="btn-view-full" onclick="portfolioManager.closeModal(); portfolioManager.showProjectDetails(${projectId})">
                    مشاهده کامل
                </button>
            </div>
        `;

        document.body.appendChild(quickViewModal);
        setTimeout(() => quickViewModal.classList.add('show'), 10);
    }

    // درخواست پروژه مشابه
    async requestSimilarProject(projectId) {
        const project = this.portfolioCards.find(p => p.id == projectId);
        
        if (!project) {
            this.showErrorMessage('پروژه یافت نشد');
            return;
        }

        // بررسی احراز هویت
        const { accessToken, error } = accessTokenFinder();

        if (error === 'no_authenticated') {
            // ذخیره URL فعلی برای بازگشت بعد از لاگین
            sessionStorage.setItem('redirect_after_login', window.location.pathname);
            alert('لطفاً ابتدا وارد حساب کاربری خود شوید');
            window.location.href = '/login';
            return;
        }

        try {
            const result = await subOrder(
                `سفارش پروژه مشابه: ${project.title}`,
                `درخواست ساخت پروژه‌ای مشابه با "${project.title}" در دسته‌بندی ${project.category}. تکنولوژی‌های مورد استفاده: ${project.tags.join('، ')}`,
                project.tags.join(', ')
            );

            if (result.error) {
                if (result.error === 'no_authenticated') {
                    sessionStorage.setItem('redirect_after_login', window.location.pathname);
                    alert('لطفاً ابتدا وارد حساب کاربری خود شوید');
                    window.location.href = '/login';
                } else {
                    this.showErrorMessage('خطا در ثبت سفارش: ' + result.error);
                }
            } else {
                this.showSuccessMessage('سفارش شما با موفقیت ثبت شد. به زودی با شما تماس خواهیم گرفت.');
                this.closeModal();
                
                // اگر order برگشت، می‌تونیم شماره سفارش رو نمایش بدیم
                if (result.order && result.order.id) {
                    console.log('شماره سفارش:', result.order.id);
                }
            }
        } catch (error) {
            console.error('خطا در ارسال سفارش:', error);
            this.showErrorMessage('خطا در ارسال درخواست. لطفاً دوباره تلاش کنید.');
        }
    }

    // تماس با ما
    contactUs(projectId) {
        const project = this.portfolioCards.find(p => p.id == projectId);
        window.location.href = `/contact?project=${projectId}&title=${encodeURIComponent(project.title)}`;
    }

    // ایجاد modal
    createModal(className = 'project-modal') {
        const existingModal = document.querySelector(`.${className}`);
        if (existingModal) {
            existingModal.remove();
        }

        const modal = document.createElement('div');
        modal.className = `modal ${className}`;

        // بستن modal با کلیک روی backdrop
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                this.closeModal();
            }
        });

        return modal;
    }

    // بستن modal
    closeModal() {
        const modals = document.querySelectorAll('.modal');
        modals.forEach(modal => {
            modal.classList.remove('show');
            setTimeout(() => modal.remove(), 300);
        });
    }

    // نمایش پیام خطا
    showErrorMessage(message) {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'message error-message';
        errorDiv.innerHTML = `
            <i class="fas fa-exclamation-circle"></i>
            <span>${message}</span>
        `;

        document.body.appendChild(errorDiv);
        setTimeout(() => errorDiv.classList.add('show'), 100);

        setTimeout(() => {
            errorDiv.classList.remove('show');
            setTimeout(() => errorDiv.remove(), 300);
        }, 3000);
    }

    // نمایش پیام موفقیت
    showSuccessMessage(message) {
        const successDiv = document.createElement('div');
        successDiv.className = 'message success-message';
        successDiv.innerHTML = `
            <i class="fas fa-check-circle"></i>
            <span>${message}</span>
        `;

        document.body.appendChild(successDiv);
        setTimeout(() => successDiv.classList.add('show'), 100);

        setTimeout(() => {
            successDiv.classList.remove('show');
            setTimeout(() => successDiv.remove(), 300);
        }, 3000);
    }

    // نمایش حالت بارگذاری
    showLoadingState() {
        const container = document.querySelector('.portfolio-grid');
        if (!container) return;

        const loadingDiv = document.createElement('div');
        loadingDiv.className = 'loading-overlay';
        loadingDiv.innerHTML = `
            <div class="loading-spinner">
                <i class="fas fa-spinner fa-spin"></i>
                <p>در حال بارگذاری...</p>
            </div>
        `;

        container.appendChild(loadingDiv);
    }

    // مخفی کردن حالت بارگذاری
    hideLoadingState() {
        const loadingDiv = document.querySelector('.loading-overlay');
        if (loadingDiv) {
            loadingDiv.remove();
        }
    }

    // راه‌اندازی event listeners عمومی
    setupEventListeners() {
        // بستن modal با دکمه Escape
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeModal();
            }
        });

        // جستجو در پروژه‌ها
        const searchInput = document.querySelector('.search-input');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.handleSearch(e.target.value);
            });
        }
    }

    // مدیریت جستجو
    handleSearch(searchTerm) {
        const normalizedSearch = searchTerm.toLowerCase().trim();

        if (!normalizedSearch) {
            this.renderPortfolioCards();
            return;
        }

        const filteredCards = this.portfolioCards.filter(card => {
            return card.title.toLowerCase().includes(normalizedSearch) ||
                   card.description.toLowerCase().includes(normalizedSearch) ||
                   card.tags.some(tag => tag.toLowerCase().includes(normalizedSearch));
        });

        const container = document.querySelector('.portfolio-grid');
        if (!container) return;

        if (filteredCards.length === 0) {
            container.innerHTML = `
                <div class="no-results">
                    <i class="fas fa-search"></i>
                    <p>نتیجه‌ای برای "${searchTerm}" یافت نشد</p>
                </div>
            `;
        } else {
            container.innerHTML = filteredCards.map(card => this.createCardHTML(card)).join('');
            this.attachCardEventListeners();
        }
    }
}

// ایجاد instance از PortfolioManager
let portfolioManager;

// اطمینان از بارگذاری کامل DOM
document.addEventListener('DOMContentLoaded', () => {
    portfolioManager = new PortfolioManager();
});

// برای دسترسی از console
window.portfolioManager = portfolioManager;
