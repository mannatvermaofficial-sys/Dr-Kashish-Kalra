/* ============================================================
   Dr Kashish Kalra — interactions
   ============================================================ */
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

/* header shadow on scroll */
const header = document.querySelector('header.site');
if (header) addEventListener('scroll', () => header.classList.toggle('scrolled', scrollY > 8));

/* mobile menu */
const burger = document.getElementById('hamburger');
const menu = document.getElementById('mobileMenu');
if (burger && menu) {
  burger.addEventListener('click', () => {
    const open = menu.classList.toggle('open');
    burger.setAttribute('aria-expanded', open);
  });
  menu.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
    menu.classList.remove('open'); burger.setAttribute('aria-expanded', false);
  }));
}

/* scroll progress + back-to-top */
const bar = document.querySelector('.progress');
const totop = document.querySelector('.totop');
function onScroll() {
  const h = document.documentElement;
  const max = h.scrollHeight - h.clientHeight;
  const pct = max > 0 ? (h.scrollTop / max) * 100 : 0;
  if (bar) bar.style.width = pct + '%';
  if (totop) totop.classList.toggle('show', h.scrollTop > 600);
}
addEventListener('scroll', onScroll, { passive: true }); onScroll();
if (totop) totop.addEventListener('click', () => scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' }));

/* staggered reveal */
const reveals = document.querySelectorAll('.reveal');
if (!reduce && 'IntersectionObserver' in window) {
  const io = new IntersectionObserver((es) => {
    es.forEach(e => {
      if (e.isIntersecting) {
        const sibs = [...e.target.parentElement.children].filter(c => c.classList.contains('reveal'));
        const i = sibs.indexOf(e.target);
        e.target.style.transitionDelay = Math.min(i * 70, 350) + 'ms';
        e.target.classList.add('in');
        io.unobserve(e.target);
      }
    });
  }, { threshold: 0.12 });
  reveals.forEach(el => io.observe(el));
} else {
  reveals.forEach(el => el.classList.add('in'));
}

/* count-up stats */
function countUp(el) {
  const target = parseFloat(el.dataset.count);
  const suffix = el.dataset.suffix || '';
  const dur = 1300; const t0 = performance.now();
  function step(t) {
    const p = Math.min((t - t0) / dur, 1);
    const eased = 1 - Math.pow(1 - p, 3);
    el.textContent = Math.round(target * eased).toLocaleString('en-IN') + suffix;
    if (p < 1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}
const nums = document.querySelectorAll('[data-count]');
if (nums.length) {
  if (reduce || !('IntersectionObserver' in window)) {
    nums.forEach(n => n.textContent = (+n.dataset.count).toLocaleString('en-IN') + (n.dataset.suffix || ''));
  } else {
    const io2 = new IntersectionObserver((es) => es.forEach(e => { if (e.isIntersecting) { countUp(e.target); io2.unobserve(e.target); } }), { threshold: .6 });
    nums.forEach(n => io2.observe(n));
  }
}

/* myth flip cards */
document.querySelectorAll('.myth').forEach(card => {
  card.setAttribute('tabindex', '0');
  card.setAttribute('role', 'button');
  const toggle = () => card.classList.toggle('flipped');
  card.addEventListener('click', toggle);
  card.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(); } });
});

/* FAQ accordion */
document.querySelectorAll('.faq-q').forEach(q => {
  q.setAttribute('aria-expanded', 'false');
  q.addEventListener('click', () => {
    const item = q.closest('.faq-item');
    const panel = item.querySelector('.faq-a');
    const open = item.classList.toggle('open');
    q.setAttribute('aria-expanded', open);
    panel.style.maxHeight = open ? panel.scrollHeight + 'px' : 0;
  });
});
addEventListener('resize', () => document.querySelectorAll('.faq-item.open .faq-a').forEach(p => p.style.maxHeight = p.scrollHeight + 'px'));

/* before / after slider */
document.querySelectorAll('.ba').forEach(ba => {
  const before = ba.querySelector('.before');
  const handle = ba.querySelector('.handle');
  const grip = ba.querySelector('.grip');
  let dragging = false, playing = !reduce;
  function setPos(clientX) {
    const r = ba.getBoundingClientRect();
    let pct = ((clientX - r.left) / r.width) * 100;
    pct = Math.max(2, Math.min(98, pct));
    before.style.clipPath = `inset(0 ${100 - pct}% 0 0)`;
    handle.style.left = pct + '%'; grip.style.left = pct + '%';
  }
  const start = () => { dragging = true; playing = false; ba.style.cursor = 'ew-resize'; };
  const end = () => { dragging = false; ba.style.cursor = ''; };
  const move = e => { if (!dragging) return; setPos(e.clientX); };
  grip.addEventListener('pointerdown', start);
  ba.addEventListener('pointerdown', e => { start(); setPos(e.clientX); });
  addEventListener('pointerup', end);
  addEventListener('pointermove', move);
  ba.addEventListener('pointerenter', () => playing = false);
  let t = 0;
  (function drift() {
    if (playing) { t += 0.02; const pct = 50 + Math.sin(t) * 22; before.style.clipPath = `inset(0 ${100 - pct}% 0 0)`; handle.style.left = pct + '%'; grip.style.left = pct + '%'; }
    requestAnimationFrame(drift);
  })();
});

/* contact form -> WhatsApp (functional, no backend) */
const form = document.getElementById('enquiry');
if (form) {
  form.addEventListener('submit', e => {
    e.preventDefault();
    const num = form.dataset.wa;
    const name = (form.querySelector('[name=name]')?.value || '').trim();
    const phone = (form.querySelector('[name=phone]')?.value || '').trim();
    const concern = form.querySelector('[name=concern]')?.value || '';
    const msg = (form.querySelector('[name=message]')?.value || '').trim();
    const text = `Hi Dr Kalra's clinic! I'd like to book a consultation.%0A%0AName: ${encodeURIComponent(name)}%0APhone: ${encodeURIComponent(phone)}%0AConcern: ${encodeURIComponent(concern)}${msg ? '%0ADetails: ' + encodeURIComponent(msg) : ''}`;
    window.open(`https://wa.me/${num}?text=${text}`, '_blank');
  });
}

/* signature laser scan — the skin being read in light */
(function () {
  const canvas = document.getElementById('laserscan');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let w, h, dpr;
  function resize() {
    dpr = Math.min(devicePixelRatio || 1, 2);
    w = canvas.clientWidth; h = canvas.clientHeight;
    canvas.width = w * dpr; canvas.height = h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  resize(); addEventListener('resize', resize);
  const rm = reduce;

  const GOLD = '228,200,120', ROSE = '225,75,90', VIO = '138,107,242', AMB = '245,166,35';

  // rising gold embers
  const parts = [];
  function seed() {
    parts.length = 0;
    const n = Math.max(20, Math.round(w / 34));
    for (let i = 0; i < n; i++) {
      parts.push({ x: Math.random() * w, y: Math.random() * h, r: Math.random() * 1.7 + 0.4,
        s: Math.random() * 0.28 + 0.05, a: Math.random() * 0.5 + 0.18, tw: Math.random() * Math.PI * 2 });
    }
  }
  seed(); addEventListener('resize', seed);

  function beam(t, sweepX) {
    const mid = h * 0.56;
    const g = ctx.createLinearGradient(0, 0, w, 0);
    g.addColorStop(0, `rgba(${VIO},0)`);
    g.addColorStop(.18, `rgba(${VIO},.55)`);
    g.addColorStop(.44, `rgba(${ROSE},.95)`);
    g.addColorStop(.68, `rgba(${GOLD},1)`);
    g.addColorStop(.9, `rgba(${AMB},.65)`);
    g.addColorStop(1, `rgba(${AMB},0)`);
    const ph = rm ? 0 : t * 0.0018;
    const passes = [{ w: 18, a: .10 }, { w: 8, a: .22 }, { w: 2.6, a: 1 }];
    for (const p of passes) {
      ctx.beginPath();
      for (let x = 0; x <= w; x += 2) {
        const env = Math.sin((x / w) * Math.PI);
        const amp = 5 + 5 * env;
        const near = sweepX != null ? Math.max(0, 1 - Math.abs(x - sweepX) / 130) : 0;
        const y = mid + Math.sin(x * 0.016 + ph) * amp + Math.sin(x * 0.05 - ph * 1.6) * 2 - near * 12 * (rm ? 0.4 : Math.sin(t * 0.02));
        x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      }
      ctx.strokeStyle = g; ctx.lineWidth = p.w; ctx.globalAlpha = p.a; ctx.lineJoin = 'round'; ctx.lineCap = 'round'; ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }

  function draw(t) {
    ctx.clearRect(0, 0, w, h);
    // faint measurement grid
    ctx.strokeStyle = 'rgba(201,183,159,.05)'; ctx.lineWidth = 1;
    for (let x = 0; x <= w; x += 48) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke(); }

    let sweepX;
    if (!rm) { const period = 4200; sweepX = ((t % period) / period) * w; }
    else sweepX = w * 0.62;

    // embers
    for (const pt of parts) {
      if (!rm) { pt.y -= pt.s; pt.tw += 0.03; if (pt.y < -4) { pt.y = h + 4; pt.x = Math.random() * w; } }
      const tw = rm ? 1 : (0.6 + 0.4 * Math.sin(pt.tw));
      ctx.beginPath(); ctx.arc(pt.x, pt.y, pt.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${GOLD},${(pt.a * tw).toFixed(3)})`; ctx.fill();
    }

    beam(t, sweepX);

    // scanning head + reticle
    const mid = h * 0.56;
    const col = ctx.createLinearGradient(sweepX - 60, 0, sweepX + 60, 0);
    col.addColorStop(0, `rgba(${GOLD},0)`); col.addColorStop(.5, `rgba(${GOLD},.18)`); col.addColorStop(1, `rgba(${GOLD},0)`);
    ctx.fillStyle = col; ctx.fillRect(sweepX - 60, 0, 120, h);
    ctx.beginPath(); ctx.moveTo(sweepX, 6); ctx.lineTo(sweepX, h - 6);
    ctx.strokeStyle = 'rgba(246,240,232,.85)'; ctx.lineWidth = 1.5; ctx.stroke();
    ctx.beginPath(); ctx.arc(sweepX, mid, 6, 0, Math.PI * 2);
    ctx.fillStyle = `rgb(${GOLD})`; ctx.shadowColor = `rgb(${GOLD})`; ctx.shadowBlur = 20; ctx.fill(); ctx.shadowBlur = 0;
    ctx.beginPath(); ctx.arc(sweepX, mid, 12 + (rm ? 0 : Math.sin(t * 0.01) * 2), 0, Math.PI * 2);
    ctx.strokeStyle = `rgba(${GOLD},.5)`; ctx.lineWidth = 1; ctx.stroke();
  }

  if (rm) draw(0);
  else (function loop(t) { draw(t); requestAnimationFrame(loop); })(0);
})();
