class LanguageCardCycler {
    constructor() {
        this.cards = document.querySelectorAll('.language-card');
        this.currentIndex = 0;
        this.intervalTime = 4000; 
        this.interval = null;
        this.isHovered = false;

        this.init();
    }

    init() {
        if (this.cards.length === 0) return;

        this.cards.forEach((card, index) => {
            card.addEventListener('mouseenter', () => this.handleCardHover(index));
            card.addEventListener('mouseleave', () => this.handleCardLeave());
        });

        this.startCycling();

        this.setActiveCard(0);
    }

    setActiveCard(index) {
        this.cards.forEach(card => card.classList.remove('active'));

        if (this.cards[index]) {
            this.cards[index].classList.add('active');
            this.currentIndex = index;
        }
    }

    nextCard() {
        const nextIndex = (this.currentIndex + 1) % this.cards.length;
        this.setActiveCard(nextIndex);
    }

    handleCardHover(index) {
        this.isHovered = true;
        this.stopCycling();
        this.setActiveCard(index);
    }

    handleCardLeave() {
        this.isHovered = false;
        this.startCycling();
    }

    startCycling() {
        if (!this.isHovered) {
            this.interval = setInterval(() => {
                if (!this.isHovered) {
                    this.nextCard();
                }
            }, this.intervalTime);
        }
    }

    stopCycling() {
        if (this.interval) {
            clearInterval(this.interval);
            this.interval = null;
        }
    }
}


class TradingCardCycler {
    constructor() {
        this.cards = document.querySelectorAll('.trading-card');
        this.currentIndex = 0;
        this.intervalTime = 3500; 
        this.interval = null;
        this.isHovered = false;

        this.init();
    }

    init() {
        if (this.cards.length === 0) return;

        this.cards.forEach((card, index) => {
            card.addEventListener('mouseenter', () => this.handleCardHover(index));
            card.addEventListener('mouseleave', () => this.handleCardLeave());
        });

        this.startCycling();

        this.setActiveCard(0);
    }

    setActiveCard(index) {
        this.cards.forEach(card => card.classList.remove('active'));

        if (this.cards[index]) {
            this.cards[index].classList.add('active');
            this.currentIndex = index;
        }
    }

    nextCard() {
        const nextIndex = (this.currentIndex + 1) % this.cards.length;
        this.setActiveCard(nextIndex);
    }

    handleCardHover(index) {
        this.isHovered = true;
        this.stopCycling();
        this.setActiveCard(index);
    }

    handleCardLeave() {
        this.isHovered = false;
        this.startCycling();
    }

    startCycling() {
        if (!this.isHovered) {
            this.interval = setInterval(() => {
                if (!this.isHovered) {
                    this.nextCard();
                }
            }, this.intervalTime);
        }
    }

    stopCycling() {
        if (this.interval) {
            clearInterval(this.interval);
            this.interval = null;
        }
    }
}

class CardClickEffects {
    constructor() {
        this.init();
    }
    
    init() {
        document.querySelectorAll('.language-card').forEach(card => {
            card.addEventListener('click', (e) => this.handleCardClick(e, 'language'));
        });
        
        document.querySelectorAll('.trading-card').forEach(card => {
            card.addEventListener('click', (e) => this.handleCardClick(e, 'trading'));
        });
    }
    
    handleCardClick(e, type) {
        const card = e.currentTarget;
        
        this.createRippleEffect(e, card);
        
        const cardTitle = card.querySelector('h3').textContent;
        console.log(`${type} card clicked: ${cardTitle}`);
        
        card.classList.add('clicked');
        setTimeout(() => {
            card.classList.remove('clicked');
        }, 300);
        
        window.dispatchEvent(new CustomEvent('cardClicked', {
            detail: { type, title: cardTitle, element: card }
        }));
    }
    
    createRippleEffect(e, element) {
        const ripple = document.createElement('div');
        const rect = element.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height);
        const x = e.clientX - rect.left - size / 2;
        const y = e.clientY - rect.top - size / 2;
        
        ripple.style.cssText = `
            position: absolute;
            border-radius: 50%;
            background: rgba(37, 99, 235, 0.3);
            pointer-events: none;
            transform: scale(0);
            animation: ripple 0.6s ease-out;
            width: ${size}px;
            height: ${size}px;
            left: ${x}px;
            top: ${y}px;
            z-index: 1000;
        `;
        
        element.style.position = 'relative';
        element.style.overflow = 'hidden';
        element.appendChild(ripple);
        
        setTimeout(() => {
            if (ripple.parentNode) {
                ripple.remove();
            }
        }, 600);
    }
}


class PerformanceOptimizer {
    constructor() {
        this.rafId = null;
        this.scrollListeners = [];
        this.resizeListeners = [];
        this.init();
    }
    
    init() {
        this.setupRAF();
        
        this.setupLazyLoading();
        
        this.optimizeEventListeners();
    }
    
    setupRAF() {
        let ticking = false;
        
        const scrollHandler = () => {
            if (!ticking) {
                this.rafId = requestAnimationFrame(() => {
                    this.scrollListeners.forEach(listener => listener());
                    ticking = false;
                });
                ticking = true;
            }
        };
        
        window.addEventListener('scroll', scrollHandler, { passive: true });
    }
    
    setupLazyLoading() {
        if ('IntersectionObserver' in window) {
            const imageObserver = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const img = entry.target;
                        if (img.dataset.src) {
                            img.src = img.dataset.src;
                            img.classList.remove('lazy');
                            imageObserver.unobserve(img);
                        }
                    }
                });
            });
            
            document.querySelectorAll('img[data-src]').forEach(img => {
                imageObserver.observe(img);
            });
        }
    }
    
    optimizeEventListeners() {
        document.addEventListener('click', (e) => {
            if (e.target.closest('.language-card') || e.target.closest('.trading-card')) {
                this.handleCardInteraction(e);
            }
        });
    }
    
    handleCardInteraction(e) {
        const card = e.target.closest('.language-card, .trading-card');
        if (card) {
            card.style.transform = 'scale(0.98)';
            setTimeout(() => {
                card.style.transform = '';
            }, 150);
        }
    }
    
    addScrollListener(listener) {
        this.scrollListeners.push(listener);
    }
    
    removeScrollListener(listener) {
        const index = this.scrollListeners.indexOf(listener);
        if (index > -1) {
            this.scrollListeners.splice(index, 1);
        }
    }
}

class ThemeIntegration {
    constructor() {
        this.init();
    }
    
    init() {
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
                    this.handleThemeChange();
                }
            });
        });
        
        observer.observe(document.body, {
            attributes: true,
            attributeFilter: ['class']
        });
        
        this.handleThemeChange();
    }
    
    handleThemeChange() {
        const isDarkMode = document.body.classList.contains('dark-mode');
        
        document.documentElement.style.setProperty(
            '--card-shadow-color', 
            isDarkMode ? 'rgba(6, 182, 212, 0.2)' : 'rgba(37, 99, 235, 0.2)'
        );
        
        window.dispatchEvent(new CustomEvent('themeChanged', {
            detail: { isDarkMode }
        }));
    }
}

class AccessibilityEnhancer {
    constructor() {
        this.init();
    }
    
    init() {
        this.setupKeyboardNavigation();
        
        this.enhanceScreenReaderSupport();
        
        this.setupFocusManagement();
    }
    
    setupKeyboardNavigation() {
        document.addEventListener('keydown', (e) => {
            const focusedCard = document.querySelector('.language-card:focus, .trading-card:focus');
            
            if (focusedCard) {
                switch (e.key) {
                    case 'Enter':
                    case ' ':
                        e.preventDefault();
                        focusedCard.click();
                        break;
                    case 'ArrowRight':
                        e.preventDefault();
                        this.focusNextCard(focusedCard);
                        break;
                    case 'ArrowLeft':
                        e.preventDefault();
                        this.focusPreviousCard(focusedCard);
                        break;
                }
            }
        });
    }
    
    focusNextCard(currentCard) {
        const container = currentCard.closest('.cards-container, .trading-cards-container');
        const cards = container.querySelectorAll('.language-card, .trading-card');
        const currentIndex = Array.from(cards).indexOf(currentCard);
        const nextIndex = (currentIndex + 1) % cards.length;
        cards[nextIndex].focus();
    }
    
    focusPreviousCard(currentCard) {
        const container = currentCard.closest('.cards-container, .trading-cards-container');
        const cards = container.querySelectorAll('.language-card, .trading-card');
        const currentIndex = Array.from(cards).indexOf(currentCard);
        const prevIndex = currentIndex === 0 ? cards.length - 1 : currentIndex - 1;
        cards[prevIndex].focus();
    }
    
    enhanceScreenReaderSupport() {
        document.querySelectorAll('.language-card').forEach((card, index) => {
            card.setAttribute('role', 'button');
            card.setAttribute('tabindex', '0');
            card.setAttribute('aria-label', `زبان برنامه‌نویسی ${card.querySelector('h3').textContent}`);
        });
        
        document.querySelectorAll('.trading-card').forEach((card, index) => {
            card.setAttribute('role', 'button');
            card.setAttribute('tabindex', '0');
            card.setAttribute('aria-label', `سبک معاملاتی ${card.querySelector('h3').textContent}`);
        });
    }
    
    setupFocusManagement() {
        document.querySelectorAll('.language-card, .trading-card').forEach(card => {
            card.addEventListener('focus', () => {
                card.classList.add('focused');
            });
            
            card.addEventListener('blur', () => {
                card.classList.remove('focused');
            });
        });
    }
}

class BodyInitializer {
    constructor() {
        this.components = [];
        this.init();
    }
    
    init() {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.initializeComponents());
        } else {
            this.initializeComponents();
        }
    }

    

    initializeComponents() {
        try {
            this.components = [
                new LanguageCardCycler(),
                new TradingCardCycler(),
                new CardClickEffects(),
                new PerformanceOptimizer(),
                new ThemeIntegration(),
                new AccessibilityEnhancer()
            ];
            
            console.log('✅ Body components initialized successfully');
            
            window.dispatchEvent(new CustomEvent('bodyInitialized'));
            
        } catch (error) {
            console.error('❌ Error initializing body components:', error);
        }
    }
    
    destroy() {
        this.components.forEach(component => {
            if (component.destroy) {
                component.destroy();
            }
        });
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new LanguageCardCycler();
    new TradingCardCycler();
});

const bodyApp = new BodyInitializer();

window.bodyApp = bodyApp;

document.documentElement.style.visibility = 'visible';