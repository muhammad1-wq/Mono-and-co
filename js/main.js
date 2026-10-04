// Mono & Co. — page behaviour (kept small: no scroll handlers, no libraries)

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// Header: shrink + blur once the page leaves the top.
const header = document.querySelector('.site-header');
const sentinel = document.querySelector('.top-sentinel');
new IntersectionObserver(([entry]) => {
  header.classList.toggle('scrolled', !entry.isIntersecting);
}).observe(sentinel);

// Mobile menu
const toggle = document.querySelector('.menu-toggle');
const links = document.querySelector('.nav-links');
function setMenu(open) {
  links.classList.toggle('open', open);
  toggle.setAttribute('aria-expanded', String(open));
  toggle.textContent = open ? 'CLOSE' : 'MENU';
  document.body.style.overflow = open ? 'hidden' : '';
}
toggle.addEventListener('click', () => setMenu(!links.classList.contains('open')));
links.addEventListener('click', (e) => { if (e.target.closest('a')) setMenu(false); });
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && links.classList.contains('open')) { setMenu(false); toggle.focus(); }
});

// Scroll reveals
const revealEls = document.querySelectorAll('.reveal, .reveal-mask');
if (reduceMotion || !('IntersectionObserver' in window)) {
  revealEls.forEach((el) => el.classList.add('in'));
} else {
  const io = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('in');
      io.unobserve(entry.target);
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
  revealEls.forEach((el) => io.observe(el));
}

// Images: each [data-media] link has an <img> over placeholder artwork.
// If the image exists, it covers the artwork and the link opens it in a new tab.
// If it doesn't, the image is removed and the link keeps going to #contact.
document.querySelectorAll('[data-media]').forEach((link) => {
  const img = link.querySelector('img');
  if (!img) return;
  const ready = () => {
    link.href = img.currentSrc || img.src;
    link.target = '_blank';
    link.rel = 'noopener';
  };
  const missing = () => img.remove();
  if (img.complete) {
    img.naturalWidth ? ready() : missing();
  } else {
    img.addEventListener('load', ready, { once: true });
    img.addEventListener('error', missing, { once: true });
  }
});

// Custom cursor — desktop with a fine pointer only.
const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
const cursor = document.querySelector('.cursor');
if (finePointer && cursor) {
  document.documentElement.classList.add('has-cursor');
  let x = -100, y = -100, cx = x, cy = y, raf = null;

  const render = () => {
    // Ease toward the pointer; snap when reduced motion is on.
    cx = reduceMotion ? x : cx + (x - cx) * 0.35;
    cy = reduceMotion ? y : cy + (y - cy) * 0.35;
    cursor.style.transform = `translate3d(${cx}px, ${cy}px, 0)`;
    raf = Math.abs(x - cx) + Math.abs(y - cy) > 0.1 ? requestAnimationFrame(render) : null;
  };

  document.addEventListener('pointermove', (e) => {
    x = e.clientX; y = e.clientY;
    if (!raf) raf = requestAnimationFrame(render);
  }, { passive: true });

  document.addEventListener('pointerover', (e) => {
    const t = e.target;
    const view = t.closest('[data-cursor="view"]');
    const button = !view && t.closest('.btn-primary, .btn-wa, .panel, .menu-toggle, button');
    const link = !view && !button && t.closest('a');
    cursor.classList.toggle('is-view', !!view);
    cursor.classList.toggle('is-button', !!button);
    cursor.classList.toggle('is-link', !!link);
    cursor.classList.toggle('on-dark', !!t.closest('.dark'));
  });

  document.addEventListener('pointerleave', () => cursor.classList.add('hidden'));
  document.addEventListener('pointerenter', () => cursor.classList.remove('hidden'));
}

// Logo intro: remove it once it has slid away; a click or key press skips it.
const intro = document.querySelector('.intro');
if (intro && document.documentElement.classList.contains('intro-on')) {
  const done = () => intro.remove();
  intro.addEventListener('animationend', (e) => { if (e.animationName === 'introOut') done(); });
  setTimeout(done, 3200); // safety net
  const skip = () => {
    if (!intro.isConnected) return;
    document.documentElement.style.setProperty('--intro', '0s');
    done();
  };
  intro.addEventListener('click', skip);
  document.addEventListener('keydown', skip, { once: true });
}

// Studio local time (Islamabad), so clients abroad can see the time difference.
const clock = document.querySelector('[data-clock]');
if (clock) {
  const fmt = new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Karachi' });
  const tick = () => { clock.textContent = fmt.format(new Date()); };
  tick();
  setInterval(tick, 30000);
}
