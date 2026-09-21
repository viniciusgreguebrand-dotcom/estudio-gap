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
const hasHero = !!document.querySelector('.hero');
lenis.on('scroll', ({ scroll }) => {
  // só a home tem hero transparente; nas páginas internas a nav fica sempre com fundo
  if (hasHero) nav.classList.toggle('is-scrolled', scroll > window.innerHeight * 0.85);
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
    // troca no meio do trecho de cada etapa (mais sensível) e limita ao índice válido
    setActive(Math.min(steps.length - 1, Math.round(p * (steps.length - 1))));
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

  // entrada por etapas: só depois que o manifesto terminar de escrever (e a seção estiver na tela)
  let methodVisible = false, manifestoDone = !document.querySelector('.manifesto');
  const tryReveal = () => {
    if (!methodVisible) return;
    // se o usuário pulou o manifesto (ex.: link "Método"), não fica esperando
    const man = document.querySelector('.manifesto');
    if (man && man.getBoundingClientRect().bottom < 0) manifestoDone = true;
    if (manifestoDone) method.classList.add('is-in');
  };
  new IntersectionObserver((entries, io) => {
    if (entries.some((e) => e.isIntersecting)) { methodVisible = true; io.disconnect(); tryReveal(); }
  }, { rootMargin: '0px 0px -30% 0px' }).observe(method);
  document.addEventListener('manifesto:done', () => { manifestoDone = true; tryReveal(); });
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
      e.target.querySelectorAll('video[autoplay]').forEach((v) => v.play().catch(() => {}));
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
    status.textContent = status.dataset.success || 'Mensagem enviada. Retornamos em breve.';
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


// Efeito de escrita: qualquer .tw-block com um .typewriter[data-text] (frases separadas por |)
document.querySelectorAll('.tw-block').forEach((block) => {
  const tw = block.querySelector('.typewriter');
  if (!tw) return;
  const typed = tw.querySelector('.typewriter__typed');
  const cursor = tw.querySelector('.typewriter__cursor');
  const full = tw.dataset.text.split('|').join('\n');
  const speed = parseFloat(tw.dataset.speed || '1'); // <1 = mais rápido
  const placeCursor = () => {
    const node = typed.firstChild;
    if (!node) { cursor.style.left = '0px'; cursor.style.top = '0px'; return; }
    const range = document.createRange();
    range.setStart(node, node.length); range.setEnd(node, node.length);
    const rects = range.getClientRects(); const r = rects[rects.length - 1] || range.getBoundingClientRect();
    const box = tw.getBoundingClientRect();
    cursor.style.left = (r.right - box.left) + 'px';
    cursor.style.top = (r.top - box.top + (r.height - cursor.offsetHeight) / 2) + 'px';
  };
  const run = () => {
    block.classList.add('is-typing');
    let i = 0;
    const step = () => {
      i += 1;
      typed.textContent = full.slice(0, i);
      placeCursor();
      if (i < full.length) {
        const ch = full[i - 1];
        const delay = ch === '.' ? 170 : ch === '\n' ? 120 : ch === ' ' ? 28 : 15 + Math.random() * 16;
        // data-ease="slow-end": começa rápido e desacelera até o fim (curva quadrática)
        const p = i / full.length;
        const ease = tw.dataset.ease === 'slow-end' ? 0.4 + 2.2 * p * p : 1;
        setTimeout(step, delay * speed * ease);
      } else {
        block.classList.remove('is-typing');
        block.classList.add('is-done');
        if (block.classList.contains('manifesto')) document.dispatchEvent(new Event('manifesto:done'));
      }
    };
    setTimeout(step, 140);
  };
  new IntersectionObserver((entries, io) => {
    if (entries.some((e) => e.isIntersecting)) { io.disconnect(); run(); }
  }, { rootMargin: '0px 0px -35% 0px' }).observe(block);
  window.addEventListener('resize', placeCursor);
});

// CTA: botão "Fale conosco" abre o formulário logo abaixo
const ctaToggle = document.querySelector('.cta__toggle');
if (ctaToggle) {
  const box = document.getElementById(ctaToggle.getAttribute('aria-controls'));
  ctaToggle.addEventListener('click', () => {
    const open = box.hasAttribute('hidden');
    if (open) box.removeAttribute('hidden'); else box.setAttribute('hidden', '');
    ctaToggle.setAttribute('aria-expanded', String(open));
    if (open) { lenis.scrollTo(box, { offset: -120, duration: 0.8 }); box.querySelector('input')?.focus({ preventScroll: true }); }
  });
}

// Método: lista de pilares entra em cascata; cada item abre o detalhe ao clicar
const listband = document.querySelector('.mt-listband');
if (listband) {
  const pin = () => { listband.style.top = Math.min(0, window.innerHeight - listband.offsetHeight) + 'px'; };
  pin(); window.addEventListener('resize', pin); lenis.on('scroll', pin);
  new IntersectionObserver((entries, io) => {
    if (entries.some((e) => e.isIntersecting)) { listband.classList.add('is-in'); io.disconnect(); }
  }, { rootMargin: '0px 0px -25% 0px' }).observe(listband);
  listband.querySelectorAll('.mt-list__row').forEach((row) => {
    row.addEventListener('click', () => {
      const li = row.closest('.mt-list__item');
      const open = li.classList.toggle('is-open');
      row.setAttribute('aria-expanded', String(open));
    });
  });
}


// Método: os 8 passos do processo surgem um por um, depois que a faixa escurece
const process = document.querySelector('.mt-process');
if (process) {
  const steps = [...process.querySelectorAll('.mt-step')];
  let shown = false;
  const showSteps = () => { if (shown) return; shown = true; steps.forEach((s, i) => setTimeout(() => s.classList.add('is-in'), 100 + i * 220)); };
  // só quando metade da faixa já subiu na tela (o título entra antes, pelo fade da faixa)
  const check = () => { if (process.getBoundingClientRect().top <= window.innerHeight * 0.5) showSteps(); };
  lenis.on('scroll', check); check();
}


// Formulário: "Outro" libera um campo de texto
document.querySelectorAll('input[data-other]').forEach((cb) => {
  const txt = cb.closest('fieldset').querySelector('.services-field__other-text');
  cb.addEventListener('change', () => { if (cb.checked) { txt.removeAttribute('hidden'); txt.focus(); } else { txt.setAttribute('hidden', ''); txt.value = ''; } });
});


// Vídeos com autoplay: garante o play ao carregar (Safari às vezes segura)
window.addEventListener('load', () => document.querySelectorAll('video[autoplay]').forEach((v) => v.play().catch(() => {})));


// Hero: depois da entrada do símbolo, liga a "respiração" leve dos anéis
const heroLogo = document.querySelector('.hero__logo');
if (heroLogo) setTimeout(() => heroLogo.classList.add('is-settled'), 2700);


// Capas dos projetos: troca de imagens em loop (crossfade) dentro de cada quadro
document.querySelectorAll('.reveal-x').forEach((box) => {
  const slides = [...box.querySelectorAll('img.slide')];
  if (slides.length < 2) return;
  let i = 0;
  setInterval(() => {
    slides[i].classList.remove('is-on');
    i = (i + 1) % slides.length;
    slides[i].classList.add('is-on');
  }, 1000);
});
