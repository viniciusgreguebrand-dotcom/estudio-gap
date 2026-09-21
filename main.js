// Rolagem suave (referência: fiasco.design) — Lenis
const lenis = new Lenis({
  duration: 1.4,
  easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
  smoothWheel: true,
  wheelMultiplier: 0.9,
});

function raf(time) {
  lenis.raf(time);
  requestAnimationFrame(raf);
}
requestAnimationFrame(raf);

// Âncoras passam pelo Lenis
document.querySelectorAll('a[href^="#"]').forEach((a) => {
  a.addEventListener('click', (e) => {
    const id = a.getAttribute('href');
    if (id.length > 1 && document.querySelector(id)) {
      e.preventDefault();
      lenis.scrollTo(id, { offset: 0 });
    }
  });
});

// Nav: fundo ao passar da hero
const nav = document.querySelector('.nav');
lenis.on('scroll', ({ scroll }) => {
  nav.classList.toggle('is-scrolled', scroll > window.innerHeight * 0.85);
});


// Método: seção pinada; a rolagem avança as etapas (como nos projetos)
const method = document.querySelector('.method');
if (method) {
  const steps = [...method.querySelectorAll('.method__step')];
  const panels = [...method.querySelectorAll('.method__panel')];
  let active = 0;
  const setActive = (i) => {
    if (i === active) return;
    active = i;
    steps.forEach((s, k) => s.classList.toggle('is-active', k === i));
    panels.forEach((p, k) => {
      p.classList.remove('is-active');
      if (k === i) { void p.offsetWidth; p.classList.add('is-active'); } // reinicia a animação
    });
  };
  const onScroll = () => {
    const r = method.getBoundingClientRect();
    const total = r.height - window.innerHeight;
    const p = Math.min(1, Math.max(0, -r.top / total));
    setActive(Math.min(steps.length - 1, Math.floor(p * steps.length)));
  };
  lenis.on('scroll', onScroll);
  onScroll();

  // clique numa etapa: rola até o trecho da seção que corresponde a ela
  steps.forEach((s, i) => {
    s.setAttribute('role', 'button'); s.tabIndex = 0;
    const go = () => {
      const top = method.getBoundingClientRect().top + window.scrollY;
      const total = method.offsetHeight - window.innerHeight;
      lenis.scrollTo(top + total * ((i + 0.5) / steps.length), { duration: 0.8 });
    };
    s.addEventListener('click', go);
    s.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); go(); } });
  });

  // entrada por etapas ao chegar na seção
  new IntersectionObserver((entries, io) => {
    if (entries.some((e) => e.isIntersecting)) { method.classList.add('is-in'); io.disconnect(); }
  }, { rootMargin: '0px 0px -30% 0px' }).observe(method);
}

// Projetos: item ativo muda conforme a rolagem e atualiza o painel fixo
const info = document.querySelector('.showcase__info');
const items = [...document.querySelectorAll('.showcase__item')];
if (info && items.length) {
  let current = items[0];
  const render = (el) => {
    info.classList.add('is-switching');
    setTimeout(() => {
      info.querySelector('[data-field="name"]').textContent = el.dataset.name;
      info.querySelector('[data-field="desc"]').textContent = el.dataset.desc || '';
      const dl = info.querySelector('[data-field="meta"]');
      dl.innerHTML = (el.dataset.meta || '').split(';').filter(Boolean).map((row) => {
        const [k, v] = row.split('|');
        return `<div><dt>${k}</dt><dd>${v}</dd></div>`;
      }).join('');
      info.classList.remove('is-switching');
    }, 200);
  };
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting && e.target !== current) {
        current = e.target;
        items.forEach((i) => i.classList.toggle('is-active', i === current));
        render(current);
      }
    });
  }, { rootMargin: '-45% 0px -45% 0px', threshold: 0 });
  items.forEach((i) => io.observe(i));
}

// Faixas escuras: ao entrar na tela, o fundo escurece; depois o texto surge; depois a imagem.
const fades = [...document.querySelectorAll('.fade-dark')];
if (fades.length) {
  const fio = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      e.target.classList.add('is-revealed');
      e.target.querySelectorAll('.reveal-x').forEach((r) => r.classList.add('is-shown'));
      fio.unobserve(e.target);
    });
  }, { rootMargin: '0px 0px -30% 0px', threshold: 0 });
  fades.forEach((el) => fio.observe(el));
}

// Formulário de contato (sem backend ainda: só valida e confirma)
const form = document.querySelector('.contact__form');
if (form) {
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const status = form.querySelector('.form-status');
    if (!form.checkValidity()) { form.reportValidity(); return; }
    status.textContent = 'Mensagem enviada. Retornamos em breve.';
    form.reset();
  });
}


// Imagens: surgem ampliando da esquerda para a direita, uma vez, ao entrar na tela
const reveals = document.querySelectorAll('.reveal-x');
if (reveals.length) {
  const rio = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      if (e.target.closest('.fade-dark')) { rio.unobserve(e.target); return; } // faixa escura cuida da própria imagem
      e.target.classList.add('is-shown');
      rio.unobserve(e.target);
    });
  }, { rootMargin: '0px 0px -15% 0px', threshold: 0.1 });
  reveals.forEach((el) => rio.observe(el));
}

// Hero: enquanto a segunda faixa sobe por cima, o wordmark GAP dá um zoom grande
const heroMark = document.querySelector('.hero__wordmark');
const heroRest = document.querySelectorAll('.hero__headline, .hero__foot');
const navEl = document.querySelector('.nav');
if (heroMark) {
  // escala em que o GAP encosta no texto ao lado: fade começa exatamente aí
  let touchScale = 1.15;
  const measure = () => {
    const headline = document.querySelector('.hero__headline');
    if (!headline) return;
    const m = heroMark.getBoundingClientRect(), h = headline.getBoundingClientRect();
    const scaleNow = parseFloat((heroMark.style.transform.match(/scale\(([\d.]+)\)/) || [0, 1])[1]) || 1;
    const baseWidth = m.width / scaleNow;
    touchScale = Math.max(1, (h.left - m.left) / baseWidth);
  };
  measure();
  window.addEventListener('resize', measure);

  const update = (scroll) => {
    const p = Math.min(1, Math.max(0, scroll / window.innerHeight)); // 0 → 1 ao longo da primeira tela
    const eased = 1 - Math.pow(1 - p, 2);
    const scale = 1 + eased * 3.2;
    heroMark.style.transform = `scale(${scale})`;
    // as outras informações começam a sumir quando o GAP encosta no texto e somem rápido
    const fade = Math.max(0, 1 - (scale - touchScale) / 0.45);
    heroRest.forEach((el) => { el.style.opacity = String(fade); el.style.pointerEvents = fade < 0.05 ? 'none' : ''; });
    const navFade = navEl.classList.contains('is-scrolled') ? 1 : fade;
    navEl.style.opacity = String(navFade); navEl.style.pointerEvents = navFade < 0.05 ? 'none' : '';
  };
  lenis.on('scroll', ({ scroll }) => update(scroll));
  update(window.scrollY);
}
