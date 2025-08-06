class HeaderAnimation {
    constructor() {
        this.header = document.getElementById('header');
        this.hamburger = document.getElementById('hamburger');
        this.mobileMenu = document.getElementById('mobileMenu');
        this.navLinks = document.querySelectorAll('.nav-link[data-nav]');
        this.themeToggle = document.getElementById('themeToggle');
        this.mobileThemeToggle = document.getElementById('mobileThemeToggle');

        this.init();
    }

    init() {
        this.initNavigation();
        this.initMobileMenu();
        this.initThemeToggle();
    }

    initNavigation() {
        this.navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                const href = link.getAttribute('href');
                const isHash = href.startsWith('#');
                const section = document.querySelector(href);

                if (isHash && section) {
                    e.preventDefault();
                    this.navLinks.forEach(l => l.classList.remove('active'));
                    link.classList.add('active');
                    section.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
            });
        });
    }

    initMobileMenu() {
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

    // -----------------------------
    // Theme toggle (dark/light) – بدون انیمیشن
    // -----------------------------
    initThemeToggle() {
        const saved = localStorage.getItem('theme');
        if (saved === 'dark') {
            document.body.classList.add('dark-mode');
            this.updateThemeIcon(true);
        }

        const toggle = () => {
            const isDark = document.body.classList.toggle('dark-mode');
            localStorage.setItem('theme', isDark ? 'dark' : 'light');
            this.updateThemeIcon(isDark);
        };

        this.themeToggle.addEventListener('click', toggle);
        this.mobileThemeToggle.addEventListener('click', toggle);
    }

    updateThemeIcon(isDark) {
        const icons = [
            this.themeToggle.querySelector('svg'),
            this.mobileThemeToggle.querySelector('svg')
        ];
        icons.forEach(icon => {
            if (isDark) {
                icon.setAttribute('viewBox', '0 0 24 24');
                icon.innerHTML = '<path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/>';
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
            }
        });
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new HeaderAnimation();
    document.documentElement.style.visibility = 'visible';
});
