function animateCounter(element, start, end, duration, suffix = '') {
    let startTimestamp = null;
    const step = (timestamp) => {
        if (!startTimestamp) startTimestamp = timestamp;
        const progress = Math.min((timestamp - startTimestamp) / duration, 1);
        const current = Math.floor(progress * (end - start) + start);
        element.textContent = current + suffix;
        if (progress < 1) {
            window.requestAnimationFrame(step);
        } else {
            element.textContent = end + suffix;
        }
    };
    window.requestAnimationFrame(step);
}

function initCounters() {
    const statNumbers = document.querySelectorAll('.stat-number');
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const el = entry.target;
                const count = parseInt(el.getAttribute('data-count'), 10);
                if (!el.classList.contains('counted')) {
                    el.classList.add('counted');
                    if (el.closest('.stat-item')?.querySelector('.stat-label')?.textContent.includes('млрд')) {
                        animateCounter(el, 0, count, 2000, ' млрд');
                    } else if (el.closest('.stat-item')?.querySelector('.stat-label')?.textContent.includes('портфельных')) {
                        animateCounter(el, 0, count, 1500, '+');
                    } else {
                        animateCounter(el, 0, count, 1500, '');
                    }
                }
            }
        });
    }, { threshold: 0.3 });
    statNumbers.forEach(el => observer.observe(el));
}

document.addEventListener('DOMContentLoaded', () => {
    const heroContent = document.querySelector('.hero-content');
    if (heroContent) {
        heroContent.style.opacity = '0';
        heroContent.style.transform = 'translateY(20px)';
        heroContent.style.transition = 'opacity 0.8s ease, transform 0.8s ease';
        setTimeout(() => {
            heroContent.style.opacity = '1';
            heroContent.style.transform = 'translateY(0)';
        }, 100);
    }
    initCounters();
});

document.addEventListener('mousemove', (e) => {
    const shapes = document.querySelectorAll('.abstract-shape, .abstract-shape-2, .floating-card');
    const mouseX = e.clientX / window.innerWidth - 0.5;
    const mouseY = e.clientY / window.innerHeight - 0.5;
    shapes.forEach((shape, index) => {
        const speed = index === 0 ? 25 : (index === 1 ? 18 : 12);
        shape.style.transform = `translate(${mouseX * speed}px, ${mouseY * speed}px)`;
    });
});

const currentPath = window.location.pathname.split('/').pop() || 'index.html';
document.querySelectorAll('.nav-menu a').forEach(link => {
    if (link.getAttribute('href') === currentPath) {
        link.classList.add('active');
    }
});