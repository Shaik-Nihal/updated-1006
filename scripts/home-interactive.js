// Hero Slider Functionality
let slides = [];
let dots = [];
let currentSlide = 0;
const prevBtn = document.getElementById('prev-btn');
const nextBtn = document.getElementById('next-btn');
const slideInterval = 5000; // 5 seconds. This can be part of the re-init function.
let slideTimer; // This can be part of the re-init function.

function initializeSlider(dynamicSlides, dynamicDots) {
    slides = dynamicSlides; // NodeList of new slides
    dots = dynamicDots;     // NodeList of new dots
    currentSlide = 0;       // Reset current slide index

    const controls = document.querySelector('.slider-controls');

    if (slides.length === 0) {
        console.warn("No slides to initialize for the slider.");
        if (controls) {
            controls.style.display = 'none';
        }
        return; // No slides, so no slider to set up
    }

    // Always ensure the first (or only) slide is active
    if (!slides[0].classList.contains('active')) {
        slides[0].classList.add('active');
    }
    // If dots are generated, ensure the first one is active
    if (dots.length > 0 && !dots[0].classList.contains('active')) {
        dots[0].classList.add('active');
    }

    setHeroBackground(); // Set background for the initial slide

    if (slides.length <= 1) {
        if (controls) {
            controls.style.display = 'none';
        }
        clearInterval(slideTimer); // Clear any existing timer just in case
        // No event listeners or interval needed for a single slide
        return;
    }

    // More than one slide, so ensure controls are visible and proceed
    if (controls) {
        controls.style.display = ''; // Or 'flex' if that's the default display style
    }

    function showSlide(n) {
        slides.forEach((slide, index) => {
            slide.classList.remove('active');
            if (dots[index]) dots[index].classList.remove('active');
        });

        currentSlide = (n + slides.length) % slides.length;
        slides[currentSlide].classList.add('active');
        if (dots[currentSlide]) dots[currentSlide].classList.add('active');

        setHeroBackground(); // Call background update

        // Reset the timer only if there's more than one slide
        clearInterval(slideTimer);
        slideTimer = setInterval(nextSlide, slideInterval);
    }

    function nextSlide() {
        showSlide(currentSlide + 1);
    }

    function prevSlide() {
        showSlide(currentSlide - 1);
    }

    if (prevBtn && nextBtn) {
        // Remove old listeners if any (important if re-initializing)
        prevBtn.removeEventListener('click', prevSlide);
        nextBtn.removeEventListener('click', nextSlide);

        prevBtn.addEventListener('click', prevSlide);
        nextBtn.addEventListener('click', nextSlide);
    }

    dots.forEach((dot, index) => {
        // Remove old listeners if any
        const newListener = () => showSlide(index);
        dot.removeEventListener('click', dot.listener); // Assumes listener was stored on dot
        dot.addEventListener('click', newListener);
        dot.listener = newListener; // Store listener for removal
    });

    // Initial timer start for multiple slides
    clearInterval(slideTimer); // Clear any existing timer
    slideTimer = setInterval(nextSlide, slideInterval);
}

function setHeroBackground() {
    const hero = document.querySelector('.hero');
    const activeSlideImg = document.querySelector('#hero-slider .slide.active img');
    if (hero && activeSlideImg) {
        if (window.innerWidth <= 768) { // Mobile breakpoint
            hero.style.backgroundImage = `url('${activeSlideImg.src}')`;
            hero.style.backgroundSize = 'cover';
            hero.style.backgroundPosition = 'center';
            hero.style.backgroundRepeat = 'no-repeat';
        } else {
            hero.style.backgroundImage = ''; // Remove inline style for larger screens
        }
    }
}
// Call setHeroBackground on resize
window.addEventListener('resize', setHeroBackground);
// Initial call on DOMContentLoaded might be too early if slides are dynamic
// It's better to call it after slides are loaded and slider is initialized.

// Featured Programs Slider
document.addEventListener('DOMContentLoaded', function () {
    const slider = document.querySelector('.program-cards');
    const prevBtn = document.getElementById('prev-control');
    const nextBtn = document.getElementById('next-control');

    if (!slider || !prevBtn || !nextBtn) return;

    // Helper to get current cards (since they're loaded dynamically)
    function getCards() {
        return slider.querySelectorAll('.program-card');
    }

    let currentIndex = 0;

    // Ensure the container has horizontal scroll and no wrapping
    slider.style.display = 'flex';
    slider.style.overflowX = 'auto';
    slider.style.scrollBehavior = 'smooth';

    // Set min-width for each card so only one fully visible at a time (optional, adjust as needed)
    function styleCards() {
        getCards().forEach(card => {
            card.style.minWidth = '300px';
            card.style.flex = '0 0 auto';
        });
    }

    // Call styleCards initially and whenever cards are (re)loaded
    const observer = new MutationObserver(() => {
        styleCards();
    });
    observer.observe(slider, { childList: true });

    styleCards();

    function scrollToCard(index) {
        const cards = getCards();
        if (cards.length === 0) return;
        if (index < 0) index = 0;
        if (index > cards.length - 1) index = cards.length - 1;
        currentIndex = index;
        cards[index].scrollIntoView({ behavior: 'smooth', inline: 'start', block: 'nearest' });
    }

    nextBtn.addEventListener('click', () => {
        const cards = getCards();
        if (currentIndex < cards.length - 1) {
            scrollToCard(currentIndex + 1);
        }
    });

    prevBtn.addEventListener('click', () => {
        if (currentIndex > 0) {
            scrollToCard(currentIndex - 1);
        }
    });

    // Optional: update currentIndex on manual scroll
    slider.addEventListener('scroll', () => {
        const cards = getCards();
        let closest = 0;
        let minDiff = Infinity;
        cards.forEach((card, i) => {
            const diff = Math.abs(card.getBoundingClientRect().left - slider.getBoundingClientRect().left);
            if (diff < minDiff) {
                minDiff = diff;
                closest = i;
            }
        });
        currentIndex = closest;
    });
});

// "We are Apollo" Counter Animation
document.addEventListener('DOMContentLoaded', function () {
    const counters = document.querySelectorAll('.counter');
    const duration = 2000; // Total duration for all counters to finish
    let started = false;

    const startCounters = () => {
        const startTime = performance.now();

        const updateCounters = () => {
            const elapsedTime = performance.now() - startTime;
            const progress = Math.min(elapsedTime / duration, 1);

            counters.forEach(counter => {
                const target = +counter.getAttribute('data-target');
                const value = Math.floor(target * progress);
                counter.innerText = value + (progress === 1 ? "+" : "");
            });

            if (progress < 1) {
                requestAnimationFrame(updateCounters);
            }
        };

        updateCounters();
    };

    const observer = new IntersectionObserver(entries => {
        entries.forEach(entry => {
            if (entry.isIntersecting && !started) {
                started = true;
                startCounters();
            }
        });
    });

    const statsSection = document.querySelector('.apollo-stats');
    if (statsSection) {
        observer.observe(statsSection);
    }
});
