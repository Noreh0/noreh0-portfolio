/* ==================================================================
   ÍNDICE DO SCRIPT
   1. Lenis — smooth scroll + sincronização com ScrollTrigger
   2. Cursor customizado (anime.js)
   3. Header — transformação em pílula ao rolar
   4. Hero — animação abstrata de fundo (canvas, estilo sumi-e / katana)
   5. Hero — revelação de texto (SplitType + GSAP)
   6. Relógios (Brasil / EUA)
   7. Sobre mim — scroll-jacking leve (GSAP ScrollTrigger)
   8. Projetos — tilt 3D
   9. Clientes — stagger de entrada
================================================================== */

gsap.registerPlugin(ScrollTrigger);

/* ---------- 1. LENIS ---------- */
const lenis = new Lenis({
  duration: 1.15,
  easing: (t) => 1 - Math.pow(1 - t, 3),
  smoothWheel: true,
});
lenis.on('scroll', ScrollTrigger.update);
gsap.ticker.add((time) => lenis.raf(time * 1000));
gsap.ticker.lagSmoothing(0);

// Âncoras do header/nav usam o Lenis para rolagem suave
document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
  anchor.addEventListener('click', (e) => {
    const target = document.querySelector(anchor.getAttribute('href'));
    if (target) {
      e.preventDefault();
      lenis.scrollTo(target, { offset: -20, duration: 1.3 });
    }
  });
});

/* ---------- 2. CURSOR CUSTOMIZADO ---------- */
const cursorDot = document.getElementById('cursorDot');
const cursorRing = document.getElementById('cursorRing');
let mouseX = window.innerWidth / 2, mouseY = window.innerHeight / 2;

// O ponto segue o mouse quase instantaneamente
window.addEventListener('mousemove', (e) => {
  mouseX = e.clientX;
  mouseY = e.clientY;
  anime({
    targets: cursorDot,
    left: mouseX,
    top: mouseY,
    duration: 120,
    easing: 'linear',
  });
});

// O anel "around" segue com atraso suave (efeito de rastro) — loop de animação
let ringX = mouseX, ringY = mouseY;
function animateRing(){
  // Ajuste fino: 0.12 controla a "preguiça" do rastro do anel
  ringX += (mouseX - ringX) * 0.12;
  ringY += (mouseY - ringY) * 0.12;
  cursorRing.style.left = ringX + 'px';
  cursorRing.style.top = ringY + 'px';
  requestAnimationFrame(animateRing);
}
animateRing();

// Estado de link (hover) — anel expande
document.querySelectorAll('[data-cursor="link"]').forEach((el) => {
  el.addEventListener('mouseenter', () => cursorRing.classList.add('is-link'));
  el.addEventListener('mouseleave', () => cursorRing.classList.remove('is-link'));
});

// Alterna a variante do cursor conforme entra/sai da Hero
const heroSection = document.getElementById('hero');
ScrollTrigger.create({
  trigger: heroSection,
  start: 'top top',
  end: 'bottom top',
  onEnter: () => document.body.classList.add('in-hero'),
  onLeave: () => document.body.classList.remove('in-hero'),
  onEnterBack: () => document.body.classList.add('in-hero'),
  onLeaveBack: () => document.body.classList.remove('in-hero'),
});
document.body.classList.add('in-hero');

/* ---------- 3. HEADER — PÍLULA FLUTUANTE ---------- */
const siteHeader = document.getElementById('siteHeader');
ScrollTrigger.create({
  start: 60,
  end: 99999,
  onUpdate: (self) => {
    siteHeader.classList.toggle('is-scrolled', self.scroll() > 60 || window.scrollY > 60);
  },
});
// Fallback simples baseado em scroll nativo (garante resposta mesmo antes do primeiro update do ST)
window.addEventListener('scroll', () => {
  siteHeader.classList.toggle('is-scrolled', window.scrollY > 60);
});

/* ---------- 4. HERO — ANIMAÇÃO ABSTRATA (CANVAS) ---------- */
// Referência: cortes limpos de katana + partículas tipo tinta sumi-e,
// em tons de azul-céu / cinza / preto. Ajuste NUM_STROKES e NUM_PARTICLES
// para controlar a densidade visual.
const canvas = document.getElementById('heroCanvas');
const ctx = canvas.getContext('2d');
let cw, ch;
function resizeCanvas(){
  cw = canvas.width = heroSection.offsetWidth;
  ch = canvas.height = heroSection.offsetHeight;
}
resizeCanvas();
window.addEventListener('resize', resizeCanvas);

const STROKE_COLORS = ['rgba(95,194,240,0.5)', 'rgba(139,149,161,0.35)', 'rgba(191,230,251,0.4)'];

// "Katana" — traços retos e rápidos que cruzam a tela
function makeStroke(){
  const angle = (Math.random() * 40 - 20) * (Math.PI / 180) + (Math.random() > 0.5 ? 0 : Math.PI);
  const length = cw * (0.35 + Math.random() * 0.35);
  const startX = Math.random() * cw;
  const startY = Math.random() * ch;
  return {
    x1: startX, y1: startY,
    x2: startX + Math.cos(angle) * length,
    y2: startY + Math.sin(angle) * length,
    color: STROKE_COLORS[Math.floor(Math.random() * STROKE_COLORS.length)],
    width: 1 + Math.random() * 1.6,
    progress: 0,
    life: 0,
    delay: Math.random() * 4000,
  };
}
const NUM_STROKES = 7;
let strokes = Array.from({ length: NUM_STROKES }, makeStroke);

// "Sumi-e" — manchas de tinta que respiram lentamente
const NUM_PARTICLES = 16;
let particles = Array.from({ length: NUM_PARTICLES }, () => ({
  x: Math.random() * cw,
  y: Math.random() * ch,
  r: 20 + Math.random() * 70,
  baseR: 0,
  alpha: 0.02 + Math.random() * 0.04,
  speed: 0.2 + Math.random() * 0.3,
  offset: Math.random() * 1000,
}));
particles.forEach(p => p.baseR = p.r);

let clock = 0;
function drawHeroCanvas(){
  clock += 16;
  ctx.clearRect(0, 0, cw, ch);

  // Manchas sumi-e — pulsam suavemente via seno (movimento orgânico, ambient)
  particles.forEach((p) => {
    const pulse = Math.sin((clock + p.offset) * 0.0006 * p.speed) * 8;
    ctx.beginPath();
    const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.baseR + pulse);
    grad.addColorStop(0, `rgba(95,194,240,${p.alpha})`);
    grad.addColorStop(1, 'rgba(95,194,240,0)');
    ctx.fillStyle = grad;
    ctx.arc(p.x, p.y, p.baseR + pulse, 0, Math.PI * 2);
    ctx.fill();
  });

  // Katanas — desenham o traço progressivamente, pausam, e recriam-se
  strokes.forEach((s, i) => {
    s.life += 16;
    if (s.life < s.delay) return;
    const drawTime = 420; // duração do "corte", em ms
    const pauseTime = 3200; // tempo visível após o corte
    const t = s.life - s.delay;

    if (t < drawTime) {
      s.progress = t / drawTime;
    } else if (t < drawTime + pauseTime) {
      s.progress = 1;
    } else {
      strokes[i] = makeStroke();
      return;
    }

    const ease = 1 - Math.pow(1 - s.progress, 3);
    const cx = s.x1 + (s.x2 - s.x1) * ease;
    const cy = s.y1 + (s.y2 - s.y1) * ease;
    const fade = t < drawTime + pauseTime ? 1 - Math.max(0, (t - (drawTime + pauseTime * 0.6)) / (pauseTime * 0.4)) : 0;

    ctx.strokeStyle = s.color;
    ctx.globalAlpha = Math.max(0, fade);
    ctx.lineWidth = s.width;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(s.x1, s.y1);
    ctx.lineTo(cx, cy);
    ctx.stroke();
    ctx.globalAlpha = 1;
  });

  requestAnimationFrame(drawHeroCanvas);
}
drawHeroCanvas();

/* ---------- 5. HERO — REVELAÇÃO DE TEXTO ---------- */
document.fonts.ready.then(() => {
  const splitLines = new SplitType('.hero-title .line', { types: 'lines' });

  const tl = gsap.timeline({ defaults: { ease: 'power4.out' } });

  tl.set('.hero-title .line', { overflow: 'hidden' })
    .from('.hero-title .line', {
      yPercent: 120,
      opacity: 0,
      duration: 1.1,
      stagger: 0.12,
    })
    .from('[data-hero-fade]', {
      y: 24,
      opacity: 0,
      duration: 0.9,
      stagger: 0.12,
    }, '-=0.6');
});

/* ---------- 6. RELÓGIOS ---------- */
function updateClocks(){
  const optsBR = { timeZone: 'America/Sao_Paulo', hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' };
  const optsUS = { timeZone: 'America/New_York', hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' };
  document.getElementById('clockBR').textContent = new Intl.DateTimeFormat('pt-BR', optsBR).format(new Date());
  document.getElementById('clockUS').textContent = new Intl.DateTimeFormat('en-US', optsUS).format(new Date());
}
updateClocks();
setInterval(updateClocks, 1000);

document.getElementById('year').textContent = new Date().getFullYear();

/* ---------- 7. SOBRE MIM — SCROLL-JACKING LEVE ---------- */
gsap.to('#aboutShade', {
  opacity: 1,
  scrollTrigger: {
    trigger: '.about',
    start: 'top 70%',
    end: 'center center',
    scrub: 1,
  },
});

gsap.utils.toArray('[data-about-block]').forEach((block) => {
  gsap.timeline({
    scrollTrigger: {
      trigger: block,
      start: 'top 78%',
      end: 'top 30%',
      scrub: 1,
    },
  }).to(block, { opacity: 1, y: 0, ease: 'none' });

  // Fade-out gradual conforme o bloco sobe e sai da viewport (efeito Apple)
  gsap.timeline({
    scrollTrigger: {
      trigger: block,
      start: 'bottom 40%',
      end: 'bottom -10%',
      scrub: 1,
    },
  }).to(block, { opacity: 0.15, y: -50, ease: 'none' });

  // Parallax sutil no placeholder de imagem
  const visual = block.querySelector('[data-parallax]');
  if (visual) {
    gsap.to(visual, {
      yPercent: -12,
      ease: 'none',
      scrollTrigger: {
        trigger: block,
        start: 'top bottom',
        end: 'bottom top',
        scrub: 1.2,
      },
    });
  }
});

/* ---------- 8. PROJETOS — TILT 3D (JS puro) ---------- */
document.querySelectorAll('[data-tilt]').forEach((card) => {
  const MAX_TILT = 10; // graus — ajuste fino da intensidade do tilt

  card.addEventListener('mousemove', (e) => {
    const rect = card.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width;
    const py = (e.clientY - rect.top) / rect.height;
    const rotateY = (px - 0.5) * MAX_TILT * 2;
    const rotateX = (0.5 - py) * MAX_TILT * 2;
    card.style.transform = `perspective(900px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02,1.02,1.02)`;
  });

  card.addEventListener('mouseleave', () => {
    card.style.transform = 'perspective(900px) rotateX(0) rotateY(0) scale3d(1,1,1)';
  });

  gsap.from(card, {
    opacity: 0,
    y: 60,
    duration: 0.9,
    ease: 'power3.out',
    scrollTrigger: { trigger: card, start: 'top 88%' },
  });
});

/* ---------- 9. CLIENTES — STAGGER DE ENTRADA DISTINTO ---------- */
// Cada logo recebe uma direção/rotação diferente para uma entrada não-uniforme
const clientAnims = [
  { y: 40, x: 0, rotate: 0 },
  { y: -30, x: 0, rotate: 0 },
  { y: 0, x: 40, rotate: -3 },
  { y: 0, x: -40, rotate: 3 },
  { y: 30, x: 0, scale: 0.85 },
  { y: -20, x: 0, rotate: -2 },
];

gsap.utils.toArray('[data-client]').forEach((el, i) => {
  const cfg = clientAnims[i % clientAnims.length];
  gsap.fromTo(el,
    { opacity: 0, y: cfg.y || 0, x: cfg.x || 0, rotate: cfg.rotate || 0, scale: cfg.scale || 1 },
    {
      opacity: 1, y: 0, x: 0, rotate: 0, scale: 1,
      duration: 0.9,
      ease: 'power3.out',
      delay: i * 0.08,
      scrollTrigger: { trigger: '#clientsGrid', start: 'top 85%' },
    }
  );
});
