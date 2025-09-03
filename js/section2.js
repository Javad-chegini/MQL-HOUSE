document.addEventListener('DOMContentLoaded', () => {
    const cards = document.querySelectorAll('.trading-styles__card');
    const container = document.querySelector('.trading-styles__cards');
    let currentIndex = 0;
    const cycleTime = 5000;
    let isAnimating = false;

    function activateCard(index) {
        if (isAnimating) return;
        isAnimating = true;

        cards.forEach((card, i) => {
            if (i === index) {
                card.classList.add('active');
                card.style.zIndex = '3';
                card.style.opacity = '1';
                card.style.visibility = 'visible';
                card.style.position = 'relative';
            } else {
                card.classList.remove('active');
                card.style.zIndex = '1';
                card.style.opacity = '0';
                card.style.visibility = 'hidden';
                card.style.position = 'absolute';
            }
        });

        // محاسبه ارتفاع مناسب بر اساس کارت فعال
        const activeCard = cards[index];
        if (activeCard) {
            const cardHeight = activeCard.offsetHeight;
            container.style.height = cardHeight + 'px';
        }

        setTimeout(() => {
            isAnimating = false;
        }, 600);
    }

    function cycleCards() {
        if (isAnimating) return;
        currentIndex = (currentIndex + 1) % cards.length;
        activateCard(currentIndex);
    }

    function resetContainer() {
        if (cards.length > 0) {
            const activeCard = document.querySelector('.trading-styles__card.active');
            if (activeCard) {
                container.style.height = activeCard.offsetHeight + 'px';
            }
        }
    }

    window.addEventListener('resize', resetContainer);

    if (cards.length > 0) {
        activateCard(0);
        setInterval(cycleCards, cycleTime);
    }
});
