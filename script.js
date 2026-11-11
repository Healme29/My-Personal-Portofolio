/* ==========================================================================
   PORTFOLIO — BLACK · IVORY · APRICOT GOLD · interactions
   (game.js handles the Malware Sorter on its own)
   ========================================================================== */

/* ---------- Footer year ---------- */
document.getElementById('year').textContent = new Date().getFullYear();

/* ---------- Mobile menu ---------- */
const mobileMenuButton = document.getElementById('mobile-menu-button');
const mobileMenu = document.getElementById('mobile-menu');

mobileMenuButton.addEventListener('click', () => {
  const open = mobileMenu.classList.toggle('open');
  mobileMenuButton.classList.toggle('open', open);
  mobileMenuButton.setAttribute('aria-expanded', open);
});

/* Close mobile menu after clicking any anchor */
document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
  anchor.addEventListener('click', () => {
    mobileMenu.classList.remove('open');
    mobileMenuButton.classList.remove('open');
    mobileMenuButton.setAttribute('aria-expanded', 'false');
  });
});

/* ---------- Scroll reveal (staggered) ---------- */
const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        revealObserver.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
);

document.querySelectorAll('.reveal').forEach((el) => revealObserver.observe(el));

/* ---------- Cursor spotlight on cards ---------- */
const spotlightTargets = document.querySelectorAll('.project-card, .skill-card');

if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
  spotlightTargets.forEach((el) => {
    el.addEventListener('pointermove', (e) => {
      const rect = el.getBoundingClientRect();
      el.style.setProperty('--mx', `${e.clientX - rect.left}px`);
      el.style.setProperty('--my', `${e.clientY - rect.top}px`);
    });
  });
}

/* ---------- Navbar: active link highlight on scroll ---------- */
const navLinks = document.querySelectorAll('.nav-link');
const navSections = [...navLinks]
  .map((link) => document.querySelector(link.getAttribute('href')))
  .filter(Boolean);

const sectionObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        navLinks.forEach((link) => {
          link.classList.toggle('active', link.getAttribute('href') === `#${entry.target.id}`);
        });
      }
    });
  },
  { rootMargin: '-30% 0px -60% 0px' }
);

navSections.forEach((section) => sectionObserver.observe(section));
