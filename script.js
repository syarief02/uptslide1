/* =============================================
   UPTSlide1 — Enhanced Script
   Features:
     1. Dark Mode Toggle (with localStorage)
     2. Animated Number Counters
     3. Slide Transition Variety
     4. Interactive Charts (bar + donut)
     5. Canvas Particle Background
     6. Performance (lazy-load images)
     7. Original: scroll progress, keyboard nav, fullscreen
   ============================================= */

(function () {
  'use strict';

  // ── References ──
  const slides = document.querySelectorAll('.slide');
  const prog = document.getElementById('prog');
  const curSlide = document.getElementById('curSlide');
  const sh = document.getElementById('sh');
  const canvas = document.getElementById('particleCanvas');

  // ╔══════════════════════════════════════════╗
  // ║  1. DARK MODE                            ║
  // ╚══════════════════════════════════════════╝
  const themeToggle = document.getElementById('themeToggle');

  // Restore saved theme immediately (before particleSystem is created)
  const savedTheme = localStorage.getItem('uptslide-theme');
  if (savedTheme === 'dark') {
    document.documentElement.setAttribute('data-theme', 'dark');
  }

  function applyTheme(dark) {
    document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
    localStorage.setItem('uptslide-theme', dark ? 'dark' : 'light');
    // Reinit particles with new colour scheme
    if (typeof particleSystem !== 'undefined' && particleSystem) {
      particleSystem.updateColors();
    }
  }

  if (themeToggle) {
    themeToggle.addEventListener('click', () => {
      const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
      applyTheme(!isDark);
    });
  }

  // ╔══════════════════════════════════════════╗
  // ║  2. ANIMATED NUMBER COUNTERS             ║
  // ╚══════════════════════════════════════════╝
  function animateCounter(el) {
    const target = parseInt(el.getAttribute('data-target'), 10);
    if (isNaN(target) || el.dataset.counted === 'true') return;
    el.dataset.counted = 'true';
    el.classList.add('counting');

    const duration = 1200;
    const startTime = performance.now();
    const startVal = 0;

    function tick(now) {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(startVal + (target - startVal) * eased);
      el.textContent = current;

      if (progress < 1) {
        requestAnimationFrame(tick);
      } else {
        el.textContent = target;
        el.classList.remove('counting');
      }
    }

    requestAnimationFrame(tick);
  }

  const counterObserver = new IntersectionObserver((entries) => {
    entries.forEach((en) => {
      if (en.isIntersecting) {
        const counters = en.target.querySelectorAll('.counter');
        counters.forEach((c) => animateCounter(c));
      }
    });
  }, { threshold: 0.3 });

  slides.forEach((s) => counterObserver.observe(s));

  // ╔══════════════════════════════════════════╗
  // ║  3. SLIDE VISIBILITY + TRANSITIONS       ║
  // ╚══════════════════════════════════════════╝
  const slideObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((en) => {
        if (en.isIntersecting) {
          en.target.classList.add('visible');
          curSlide.textContent = Array.from(slides).indexOf(en.target) + 1;
        }
      });
    },
    { threshold: 0.18 }
  );

  slides.forEach((s) => slideObserver.observe(s));

  // ╔══════════════════════════════════════════╗
  // ║  4. INTERACTIVE CHARTS                   ║
  // ╚══════════════════════════════════════════╝

  // Bar chart animation
  function animateBars(container) {
    if (container.dataset.animated === 'true') return;
    container.dataset.animated = 'true';

    const bars = container.querySelectorAll('.chart-bar');
    bars.forEach((bar) => {
      const height = bar.getAttribute('data-height');
      setTimeout(() => {
        bar.style.height = height + '%';
        bar.classList.add('animated');
      }, 200);
    });
  }

  // Donut chart animation
  function animateDonut(container) {
    if (container.dataset.animated === 'true') return;
    container.dataset.animated = 'true';

    const circles = container.querySelectorAll('.donut-circle');
    circles.forEach((circle) => {
      const targetOffset = circle.getAttribute('data-target-offset');
      setTimeout(() => {
        circle.style.strokeDashoffset = targetOffset;
      }, 300);
    });
  }

  const chartObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((en) => {
        if (en.isIntersecting) {
          const barChart = en.target.querySelector('.chart-container');
          if (barChart) animateBars(barChart);

          const donutChart = en.target.querySelector('.donut-container');
          if (donutChart) animateDonut(donutChart);
        }
      });
    },
    { threshold: 0.3 }
  );

  slides.forEach((s) => chartObserver.observe(s));

  // ╔══════════════════════════════════════════╗
  // ║  5. CANVAS PARTICLE BACKGROUND           ║
  // ╚══════════════════════════════════════════╝

  var particleSystem = (function () {
    if (!canvas) return null;

    const ctx = canvas.getContext('2d');
    let particles = [];
    let w, h;
    let animId;

    // Particle settings
    const PARTICLE_COUNT = 65;
    const MAX_SPEED = 0.3;
    const CONNECTION_DIST = 140;
    const PARTICLE_MIN_R = 1.5;
    const PARTICLE_MAX_R = 4;

    function getColors() {
      const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
      return {
        particle: isDark ? 'rgba(58, 212, 168, 0.5)' : 'rgba(42, 170, 138, 0.35)',
        line: isDark ? 'rgba(58, 212, 168, 0.08)' : 'rgba(42, 170, 138, 0.06)',
        glow: isDark ? 'rgba(58, 212, 168, 0.15)' : 'rgba(42, 170, 138, 0.1)',
      };
    }

    let colors = getColors();

    function resize() {
      w = canvas.width = window.innerWidth;
      h = canvas.height = window.innerHeight;
    }

    function createParticle() {
      return {
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * MAX_SPEED * 2,
        vy: (Math.random() - 0.5) * MAX_SPEED * 2,
        r: PARTICLE_MIN_R + Math.random() * (PARTICLE_MAX_R - PARTICLE_MIN_R),
        opacity: 0.3 + Math.random() * 0.7,
      };
    }

    function init() {
      resize();
      particles = [];
      for (let i = 0; i < PARTICLE_COUNT; i++) {
        particles.push(createParticle());
      }
    }

    function update() {
      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;

        // Wrap around edges
        if (p.x < -10) p.x = w + 10;
        if (p.x > w + 10) p.x = -10;
        if (p.y < -10) p.y = h + 10;
        if (p.y > h + 10) p.y = -10;
      }
    }

    function draw() {
      ctx.clearRect(0, 0, w, h);

      // Draw connections
      ctx.strokeStyle = colors.line;
      ctx.lineWidth = 0.8;
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < CONNECTION_DIST) {
            const alpha = 1 - dist / CONNECTION_DIST;
            ctx.globalAlpha = alpha * 0.4;
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.stroke();
          }
        }
      }

      // Draw particles
      for (const p of particles) {
        ctx.globalAlpha = p.opacity;

        // Glow
        ctx.fillStyle = colors.glow;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r * 3, 0, Math.PI * 2);
        ctx.fill();

        // Core
        ctx.fillStyle = colors.particle;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.globalAlpha = 1;
    }

    function loop() {
      update();
      draw();
      animId = requestAnimationFrame(loop);
    }

    function updateColors() {
      colors = getColors();
    }

    // Init
    init();
    loop();

    window.addEventListener('resize', () => {
      resize();
    });

    return { updateColors };
  })();

  // ╔══════════════════════════════════════════╗
  // ║  6. LAZY LOAD IMAGES                     ║
  // ╚══════════════════════════════════════════╝
  if ('IntersectionObserver' in window) {
    const lazyImages = document.querySelectorAll('img[data-src]');
    const imgObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((en) => {
          if (en.isIntersecting) {
            const img = en.target;
            img.src = img.getAttribute('data-src');
            img.removeAttribute('data-src');
            imgObserver.unobserve(img);
          }
        });
      },
      { rootMargin: '200px' }
    );

    lazyImages.forEach((img) => imgObserver.observe(img));
  }

  // ╔══════════════════════════════════════════╗
  // ║  7. SCROLL PROGRESS + KEYBOARD NAV       ║
  // ╚══════════════════════════════════════════╝
  window.addEventListener('scroll', () => {
    const t = window.scrollY;
    const totalH = document.documentElement.scrollHeight - innerHeight;
    prog.style.width = (totalH > 0 ? (t / totalH) * 100 : 0) + '%';
    sh.classList.toggle('hide', t > 100);
  });

  document.addEventListener('keydown', (e) => {
    const ids = Array.from(slides).map((s) => s.id);
    const ci = ids.findIndex((id) => {
      const r = document.getElementById(id).getBoundingClientRect();
      return r.top >= -200 && r.top < innerHeight / 2;
    });

    if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
      e.preventDefault();
      document.getElementById(ids[Math.min(ci + 1, ids.length - 1)]).scrollIntoView({ behavior: 'smooth' });
    }
    if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
      e.preventDefault();
      document.getElementById(ids[Math.max(ci - 1, 0)]).scrollIntoView({ behavior: 'smooth' });
    }
    if (e.key === 'f' || e.key === 'F') {
      if (!document.fullscreenElement) document.documentElement.requestFullscreen();
      else document.exitFullscreen();
    }
  });

  // ╔══════════════════════════════════════════╗
  // ║  8. TOUCH / SWIPE NAV (bonus)            ║
  // ╚══════════════════════════════════════════╝
  let touchStartY = 0;
  let touchEndY = 0;

  document.addEventListener('touchstart', (e) => {
    touchStartY = e.changedTouches[0].screenY;
  }, { passive: true });

  document.addEventListener('touchend', (e) => {
    touchEndY = e.changedTouches[0].screenY;
    const diff = touchStartY - touchEndY;

    if (Math.abs(diff) < 60) return; // Too small

    const ids = Array.from(slides).map((s) => s.id);
    const ci = ids.findIndex((id) => {
      const r = document.getElementById(id).getBoundingClientRect();
      return r.top >= -200 && r.top < innerHeight / 2;
    });

    if (diff > 0) {
      // Swipe up → next
      document.getElementById(ids[Math.min(ci + 1, ids.length - 1)]).scrollIntoView({ behavior: 'smooth' });
    } else {
      // Swipe down → prev
      document.getElementById(ids[Math.max(ci - 1, 0)]).scrollIntoView({ behavior: 'smooth' });
    }
  }, { passive: true });

})();