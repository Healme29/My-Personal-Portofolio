/* ==========================================================================
   PORTFOLIO — BLACK · IVORY · APRICOT GOLD · interactions
   (game.js handles the Malware Sorter independently)
   ========================================================================== */

document.getElementById('year').textContent = new Date().getFullYear();

/* ---------- Scroll progress bar ---------- */
const progressBar = document.getElementById('scroll-progress');
let prevScrollY = 0;

function updateProgress() {
  const docH = document.documentElement.scrollHeight - window.innerHeight;
  if (docH <= 0) { progressBar.style.transform = 'scaleX(0)'; return; }
  const pct = window.scrollY / docH;
  progressBar.style.transform = `scaleX(${pct})`;
}

window.addEventListener('scroll', updateProgress, { passive: true });
window.addEventListener('resize', updateProgress, { passive: true });
updateProgress();

/* ---------- Mobile menu ---------- */
const mobileMenuButton = document.getElementById('mobile-menu-button');
const mobileMenu = document.getElementById('mobile-menu');

mobileMenuButton.addEventListener('click', () => {
  const open = mobileMenu.classList.toggle('open');
  mobileMenuButton.classList.toggle('open', open);
  mobileMenuButton.setAttribute('aria-expanded', open);
});

document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
  anchor.addEventListener('click', () => {
    mobileMenu.classList.remove('open');
    mobileMenuButton.classList.remove('open');
    mobileMenuButton.setAttribute('aria-expanded', 'false');
  });
});

/* ---------- Scroll reveal ---------- */
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

/* ---------- Cursor spotlight ---------- */
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const spotlightTargets = [].concat(
  ...['.project-card', '.skill-card'].map((s) => [...document.querySelectorAll(s)])
);

if (!reducedMotion) {
  spotlightTargets.forEach((el) => {
    el.addEventListener('pointermove', (e) => {
      const rect = el.getBoundingClientRect();
      el.style.setProperty('--mx', `${e.clientX - rect.left}px`);
      el.style.setProperty('--my', `${e.clientY - rect.top}px`);
    });
  });
}

/* ---------- Navbar active link ---------- */
const navLinks = [...document.querySelectorAll('.nav-link')];
const navSections = navLinks
  .map((link) => document.querySelector(link.getAttribute('href')))
  .filter(Boolean);

const sectionObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        navLinks.forEach((link) => link.classList.toggle('active', link.getAttribute('href') === `#${entry.target.id}`));
      }
    });
  },
  { rootMargin: '-30% 0px -60% 0px' }
);
navSections.forEach((section) => sectionObserver.observe(section));

/* ---------- Role typewriter (Hero) ---------- */
const roleEl = document.getElementById('role-type');
if (roleEl) {
  const roles = ['Computer Vision', 'IoT', 'Robotics', 'Network', 'Cyber Security'];
  let idx = 0;

  function nextRole() {
    idx = (idx + 1) % roles.length;
    roleEl.style.opacity = '0';
    setTimeout(() => {
      roleEl.textContent = roles[idx];
      roleEl.style.opacity = '1';
    }, 220);
  }

  if (reducedMotion) {
    roleEl.textContent = roles[0];
  } else {
    setInterval(nextRole, 3200);
  }
}

/* ---------- 3D tilt on award cards ---------- */
const tiltCards = [...document.querySelectorAll('.tilt-card')];

if (!reducedMotion) {
  tiltCards.forEach((card) => {
    const media = card.querySelector('.project-media');

    card.addEventListener('pointermove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width;     // 0..1
      const y = (e.clientY - rect.top) / rect.height;     // 0..1
      const tiltX = (0.5 - y) * 10;                       // -5..5 deg
      const tiltY = (x - 0.5) * 10;                       // -5..5 deg
      media.style.setProperty('--tilt-x', `${tiltX}deg`);
      media.style.setProperty('--tilt-y', `${tiltY}deg`);
    });

    card.addEventListener('pointerleave', () => {
      media.style.setProperty('--tilt-x', '0deg');
      media.style.setProperty('--tilt-y', '0deg');
    });
  });
}