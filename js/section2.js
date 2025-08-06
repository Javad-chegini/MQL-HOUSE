document.addEventListener('DOMContentLoaded', () => {
    const cards = document.querySelectorAll('.trading-styles__card');
    let currentIndex = 0;
    const cycleTime = 5000;
  
    function activateCard(index) {
        cards.forEach((card, i) => {
            if (i === index) {
                card.classList.add('active');
                card.style.zIndex = 2;
                card.style.opacity = 1;
            } else {
                card.classList.remove('active');
                card.style.zIndex = 1;
                card.style.opacity = 0;
            }
        });
    }
  
    function cycleCards() {
        currentIndex = (currentIndex + 1) % cards.length;
        activateCard(currentIndex);
    }
  
    if (cards.length > 0) {
        activateCard(0);
        setInterval(cycleCards, cycleTime);
    }
  });
  
