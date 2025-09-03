document.addEventListener('DOMContentLoaded', function() {
    const filterButtons = document.querySelectorAll('.filter-btn');
    const portfolioCards = document.querySelectorAll('.portfolio-card');
    const portfolioGrid = document.querySelector('.portfolio-grid');

    // تابع به‌روزرسانی شمارنده
    function updatePortfolioCounter(category) {
        let counter = document.querySelector('.portfolio-counter');
        
        // اگر شمارنده وجود ندارد، ایجاد می‌کنیم
        if (!counter) {
            const filtersContainer = document.querySelector('.portfolio-filters');
            if (filtersContainer) {
                counter = document.createElement('div');
                counter.className = 'portfolio-counter';
                counter.style.cssText = `
                    text-align: center;
                    margin-top: 20px;
                    font-size: 14px;
                    color: var(--text-dark);
                    opacity: 0.7;
                    transition: all 0.3s ease;
                `;
                filtersContainer.appendChild(counter);
            }
        }

        // محاسبه تعداد کارت‌های قابل نمایش
        let visibleCount = 0;
        
        portfolioCards.forEach(card => {
            const cardCategory = card.dataset.category;
            if (category === 'all' || cardCategory === category) {
                visibleCount++;
            }
        });

        // به‌روزرسانی متن شمارنده با انیمیشن
        if (counter) {
            // انیمیشن fade out
            counter.style.opacity = '0';
            counter.style.transform = 'scale(0.8)';
            
            setTimeout(() => {
                // تعیین متن بر اساس تعداد
                let counterText = '';
                if (visibleCount === 0) {
                    counterText = 'هیچ پروژه‌ای یافت نشد';
                } else if (visibleCount === 1) {
                    counterText = '۱ پروژه';
                } else {
                    // تبدیل عدد انگلیسی به فارسی
                    const persianNumbers = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
                    const persianCount = visibleCount.toString().replace(/\d/g, (digit) => persianNumbers[parseInt(digit)]);
                    counterText = `${persianCount} پروژه`;
                }
                
                counter.textContent = counterText;
                
                // تغییر رنگ بر اساس تعداد
                if (visibleCount === 0) {
                    counter.style.color = '#ef4444'; // قرمز برای صفر
                    counter.style.background = 'rgba(239, 68, 68, 0.1)';
                } else {
                    counter.style.color = 'var(--text-dark)';
                    counter.style.background = 'rgba(37, 99, 235, 0.1)';
                }
                
                // انیمیشن fade in
                counter.style.opacity = '0.8';
                counter.style.transform = 'scale(1)';
            }, 150);
        }

        // لاگ برای دیباگ
        console.log(`فیلتر: ${category === 'all' ? 'همه' : category} - تعداد: ${visibleCount}`);
    }

    // تابع فیلتر و مرتب‌سازی کارت‌ها
    function filterAndReorganizePortfolio(category) {
        const visibleCards = [];
        const hiddenCards = [];

        // جدا کردن کارت‌های قابل نمایش از مخفی
        portfolioCards.forEach(card => {
            const cardCategory = card.dataset.category;
            
            if (category === 'all' || cardCategory === category) {
                visibleCards.push(card);
                card.classList.remove('hide');
                card.classList.add('show');
            } else {
                hiddenCards.push(card);
                card.classList.remove('show');
                card.classList.add('hide');
            }
        });

        // مرتب‌سازی مجدد DOM
        setTimeout(() => {
            // حذف همه کارت‌ها از grid
            [...visibleCards, ...hiddenCards].forEach(card => {
                if (card.parentNode === portfolioGrid) {
                    portfolioGrid.removeChild(card);
                }
            });

            // افزودن کارت‌های مرئی در ابتدا
            visibleCards.forEach((card, index) => {
                card.style.animationDelay = `${index * 0.1}s`;
                portfolioGrid.appendChild(card);
            });

            // افزودن کارت‌های مخفی در انتها
            hiddenCards.forEach(card => {
                portfolioGrid.appendChild(card);
            });

            // به‌روزرسانی شمارنده
            updatePortfolioCounter(category);
            
        }, 100);
    }

    // تابع انیمیشن ورود کارت‌ها
    function animateVisibleCards() {
        const visibleCards = document.querySelectorAll('.portfolio-card.show');
        
        visibleCards.forEach((card, index) => {
            card.style.opacity = '0';
            card.style.transform = 'translateY(30px) scale(0.9)';
            
            setTimeout(() => {
                card.style.transition = 'all 0.6s cubic-bezier(0.4, 0, 0.2, 1)';
                card.style.opacity = '1';
                card.style.transform = 'translateY(0) scale(1)';
            }, index * 100);
        });
    }

    // Event listener برای دکمه‌های فیلتر
    filterButtons.forEach(button => {
        button.addEventListener('click', function() {
            // حذف کلاس active از همه دکمه‌ها
            filterButtons.forEach(btn => btn.classList.remove('active'));
            
            // افزودن کلاس active به دکمه کلیک شده
            this.classList.add('active');
            
            // دریافت مقدار فیلتر
            const filterValue = this.dataset.filter;
            
            // اجرای فیلتر و مرتب‌سازی
            filterAndReorganizePortfolio(filterValue);
            
            // انیمیشن کارت‌های مرئی
            setTimeout(() => {
                animateVisibleCards();
            }, 200);
        });
    });

    // تنظیم انیمیشن اولیه
    function initializeCards() {
        portfolioCards.forEach(card => {
            card.style.transition = 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)';
        });
    }

    // بهبود grid layout
    function optimizeGridLayout() {
        const style = document.createElement('style');
        style.textContent = `
            .portfolio-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
                gap: 40px;
                padding: 20px 0;
                grid-auto-flow: row dense;
            }
            
            .portfolio-card.hide {
                display: none !important;
            }
            
            .portfolio-counter {
                background: rgba(37, 99, 235, 0.1);
                padding: 8px 16px;
                border-radius: 20px;
                display: inline-block;
                font-weight: 600;
                margin-top: 15px;
                transition: all 0.3s ease;
            }
            
            body.dark-mode .portfolio-counter {
                background: rgba(6, 182, 212, 0.1);
            }
        `;
        document.head.appendChild(style);
    }

    // اجرای توابع اولیه
    initializeCards();
    optimizeGridLayout();
    
    // تنظیم حالت اولیه
    setTimeout(() => {
        filterAndReorganizePortfolio('all');
    }, 100);
});
