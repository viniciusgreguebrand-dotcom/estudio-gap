/* Previews do painel: mostram a faixa/página com o CSS do site enquanto você edita. */
CMS.registerPreviewStyle('/styles.css');
CMS.registerPreviewStyle('/admin/preview.css');

const esc = (s) => String(s == null ? '' : s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const br = (s) => esc(s).replace(/\n/g, '<br>');
const get = (entry, path, fallback) => {
  const v = entry.getIn(['data', ...path.split('.')]);
  if (v == null) return fallback;
  return v.toJS ? v.toJS() : v;
};
const html = (str) => h('div', { className: 'pv', dangerouslySetInnerHTML: { __html: str } });
const asset = (getAsset, src) => (src ? String(getAsset(src)) : '');

/* ---------- Projeto ---------- */
const Projeto = createClass({
  render() {
    const { entry, getAsset } = this.props;
    const title = get(entry, 'title', 'Título do projeto');
    const meta = [['Serviços', get(entry, 'services', '')], ['Ano', get(entry, 'year', '')], ['Local', get(entry, 'local', '')], ['Créditos', get(entry, 'credits', '')]].filter((m) => m[1]);
    const slides = (get(entry, 'slides', []) || []).map((s) => (s && s.image) || s).filter(Boolean);
    const blocks = get(entry, 'blocks', []) || [];
    let body = '';
    blocks.forEach((b) => {
      if (b.type === 'image' && b.src) body += `<figure class="case__media"><img src="${asset(getAsset, b.src)}" alt="${esc(b.alt)}"></figure>`;
      else if (b.type === 'video' && b.src) body += `<div class="case__video pv-video">▶ Vídeo: ${esc(b.src)}</div>`;
      else if (b.type === 'heading') body += `<h2 class="case__h">${br(b.text)}</h2>`;
      else if (b.type === 'text') body += `<p class="case__p">${br(b.text)}</p>`;
    });
    return html(`
      <div class="pv-note">Prévia do projeto · ${get(entry, 'published', true) ? 'publicado' : 'oculto'}</div>
      <main class="page" style="padding-top:0">
        <article class="case">
          <div class="container">
            <div class="case__intro">
              <div>
                <h1 class="h-xl">${esc(title)}</h1>
                <dl class="case__meta">${meta.map((m) => `<div><dt>${m[0]}</dt><dd>${esc(m[1])}</dd></div>`).join('')}</dl>
              </div>
              ${get(entry, 'summary', '') ? `<p class="body case__summary">${esc(get(entry, 'summary', ''))}</p>` : ''}
            </div>
          </div>
          ${slides.length ? `<div class="container"><p class="label">Capa · slideshow (${slides.length})</p><div class="pv-slides">${slides.map((s) => `<img src="${asset(getAsset, s)}">`).join('')}</div></div>` : ''}
          <div class="container case__blocks">${body}</div>
        </article>
      </main>`);
  },
});
CMS.registerPreviewTemplate('projetos', Projeto);

/* ---------- Páginas ---------- */
const list = (arr, sep) => (arr || []).map((x) => esc(x && x.p != null ? x.p : x)).join(sep);

const Home = createClass({
  render() {
    const { entry } = this.props;
    const steps = get(entry, 'metodo.steps', []) || [];
    const dep = get(entry, 'depoimentos.items', []) || [];
    return html(`
      <section class="hero pv-hero"><div class="hero__inner"><div class="hero__headline"><p class="hero__eyebrow" style="opacity:1;transform:none;animation:none">${esc(get(entry, 'hero.eyebrow', ''))}</p><h2 style="opacity:1;transform:none;animation:none">${esc(get(entry, 'hero.headline', ''))}</h2><div class="hero__actions" style="opacity:1;transform:none;animation:none"><span class="btn btn--dark">${esc(get(entry, 'hero.btn1', ''))}</span><span class="btn btn--ghost-dark">${esc(get(entry, 'hero.btn2', ''))}</span></div></div></div></section>
      <section class="band band--white"><div class="container"><h2 class="h-lg gap-intro__text" style="white-space:normal">${list(get(entry, 'intro.lines', []), '<br>')}</h2></div></section>
      <section class="band band--white" style="padding-top:0"><div class="container"><p class="label">${esc(get(entry, 'cases.eyebrow', ''))}</p><p class="showcase__all">${esc(get(entry, 'cases.all', ''))} →</p></div></section>
      <section class="split fade-dark is-revealed pv-split"><div class="split__content"><h2 class="split__title">${list(get(entry, 'sobre.title_lines', []), '<br>')}</h2><p class="split__mid">${esc(get(entry, 'sobre.mid', ''))}</p><div class="split__foot"><ul class="split__facts"><li class="split__facts-lead">${esc(get(entry, 'sobre.facts_lead', ''))} <strong>${esc(get(entry, 'sobre.facts_name', ''))}</strong></li>${(get(entry, 'sobre.facts', []) || []).map((f) => `<li>${esc(f)}</li>`).join('')}</ul><span class="btn btn--ghost">${esc(get(entry, 'sobre.button', ''))}</span></div></div><div class="pv-media">vídeo</div></section>
      <section class="manifesto is-done" style="min-height:0"><div class="container manifesto__inner"><h2 class="manifesto__title">${list(get(entry, 'manifesto.lines', []), '<br>')}</h2><p class="manifesto__sub" style="opacity:1;transform:none">${br(get(entry, 'manifesto.sub', ''))}</p></div></section>
      <section class="band band--white"><div class="container"><p class="label method__eyebrow" style="opacity:1">${esc(get(entry, 'metodo.eyebrow', ''))}</p><h2 class="method__title" style="opacity:1">${br(get(entry, 'metodo.title', ''))}</h2>
        ${steps.map((s, i) => `<div class="pv-step"><p class="method__stage-label"><span>0${i + 1}.</span> ${esc(s.name)}</p><h3>${esc(s.question)}</h3><p class="method__desc">${esc(s.desc)}</p><div class="method__result"><h4>Resultado:</h4><p>${esc(s.result)}</p></div><ul class="mt-pillar__list method__tags">${(s.tags || []).map((t) => `<li>${esc(t)}</li>`).join('')}</ul></div>`).join('')}
      </div></section>
      <section class="band band--dark fade-dark is-revealed"><div class="container"><p class="label label--light">${esc(get(entry, 'depoimentos.eyebrow', ''))}</p><div class="pv-quotes">${dep.map((t) => `<blockquote class="testimonial"><p>“${esc(t.quote)}”</p><footer><strong>${esc(t.name)}</strong><span>${esc(t.org)}</span></footer></blockquote>`).join('')}</div></div></section>`);
  },
});
CMS.registerPreviewTemplate('home', Home);

const Sobre = createClass({
  render() {
    const { entry } = this.props;
    return html(`
      <section class="split split--hero pv-split"><div class="split__content" style="padding-bottom:60px"><h1 class="split__title">${list(get(entry, 'hero.title_lines', []), '<br>')}</h1><ul class="split__facts"><li class="split__facts-lead">${esc(get(entry, 'hero.facts_lead', ''))} <strong>${esc(get(entry, 'hero.facts_name', ''))}</strong></li>${(get(entry, 'hero.facts', []) || []).map((f) => `<li>${esc(f)}</li>`).join('')}</ul></div><div class="pv-media">vídeo</div></section>
      <section class="band band--white"><div class="container about-body"><p class="about-body__pull" style="position:static">${esc(get(entry, 'texto.pull', ''))}</p><div class="about-body__text">${(get(entry, 'texto.paragraphs', []) || []).map((t) => `<p>${esc(t && t.p != null ? t.p : t)}</p>`).join('')}</div></div></section>`);
  },
});
CMS.registerPreviewTemplate('sobre', Sobre);

const Metodo = createClass({
  render() {
    const { entry } = this.props;
    const pil = get(entry, 'pilares', []) || [];
    const steps = get(entry, 'processo.steps', []) || [];
    const faq = get(entry, 'faq.items', []) || [];
    return html(`
      <section class="band band--white mt-hero"><div class="container"><p class="label">${esc(get(entry, 'hero.eyebrow', ''))}</p><div class="mt-hero__grid"><h1 class="h-xl mt-hero__title">${br(get(entry, 'hero.title', ''))}</h1><p class="mt-hero__lead">${esc(get(entry, 'hero.lead', ''))}</p></div></div></section>
      <section class="band band--white mt-listband is-in" style="padding-bottom:40px"><div class="container"><ol class="mt-list">${pil.map((p, i) => `<li class="mt-list__item is-open" style="opacity:1;transform:none"><div class="mt-list__row"><span class="mt-list__num">0${i + 1}.</span><span class="mt-list__name">${esc(p.name)}</span></div><div class="mt-list__panel"><div class="mt-list__panel-inner"><p class="mt-pillar__q">${esc(p.question)}</p>${(p.paragraphs || []).map((t) => `<p class="body">${esc(t && t.p != null ? t.p : t)}</p>`).join('')}<ul class="mt-pillar__list">${(p.tags || []).map((t) => `<li>${esc(t)}</li>`).join('')}</ul></div></div></li>`).join('')}</ol></div></section>
      <section class="band band--dark fade-dark is-revealed mt-process"><div class="container"><p class="label label--light">${esc(get(entry, 'processo.eyebrow', ''))}</p><h2 class="h-lg mt-process__title">${esc(get(entry, 'processo.title', ''))}</h2><div class="mt-steps">${steps.map((s, i) => `<div class="mt-step is-in"><span>0${i + 1}.</span><h3>${esc(s.title)}</h3><p>${esc(s.text)}</p></div>`).join('')}</div></div></section>
      <section class="band band--dark fade-dark is-revealed"><div class="container"><h2 class="h-lg mt-tl__heading">${esc(get(entry, 'timeline.title', ''))}</h2><div class="pv-nodes">${(get(entry, 'timeline.nodes', []) || []).map((n) => `<div><b>${esc(n.label)}</b><em>${br(n.deliverable)}</em></div>`).join('')}</div><p class="body" style="color:#fff;margin-top:24px">${(get(entry, 'timeline.phases', []) || []).map((p) => esc(p.label)).join(' · ')}</p></div></section>
      <section class="band band--dark fade-dark is-revealed mt-leva"><div class="container mt-leva__inner"><h2 class="h-md" style="max-width:34ch">${esc(get(entry, 'leva.title', ''))}</h2><p class="body" style="opacity:1;transform:none">${esc(get(entry, 'leva.text', ''))}</p></div></section>
      <section class="band band--white mt-faq"><div class="container"><p class="label">${esc(get(entry, 'faq.eyebrow', ''))}</p><h2 class="h-lg">${esc(get(entry, 'faq.title', ''))}</h2><div class="faq">${faq.map((f, i) => `<details class="faq__item" open><summary><span>0${i + 1}</span>${esc(f.q)}</summary><p>${esc(f.a)}</p></details>`).join('')}</div></div></section>`);
  },
});
CMS.registerPreviewTemplate('metodo', Metodo);

const Contato = createClass({
  render() {
    const { entry } = this.props;
    const f = get(entry, 'form', {}) || {};
    return html(`
      <section class="band band--white contact"><div class="container cta" style="align-items:flex-start;text-align:left"><h1 class="h-xl">${esc(get(entry, 'title', ''))}</h1><p class="body">${esc(get(entry, 'sub', ''))}</p>
      <div class="cta__form" style="margin-top:40px"><div class="contact__form">
        <label class="field"><span>Qual momento melhor representa sua marca?</span><select>${(f.momentos || []).map((o) => `<option>${esc(o)}</option>`).join('')}</select></label>
        <fieldset class="field services-field"><legend>Como podemos ajudar?</legend><div>${(f.servicos || []).map((s) => `<label><input type="checkbox"> ${esc(s)}</label>`).join('')}</div></fieldset>
        <label class="field"><span>Investimento previsto</span><select>${(f.investimentos || []).map((o) => `<option>${esc(o)}</option>`).join('')}</select></label>
        <div class="form-submit"><span class="btn btn--dark btn--lg">${esc(f.submit || '')}</span></div><p class="form-status">${esc(f.success || '')}</p>
      </div></div></div></section>`);
  },
});
CMS.registerPreviewTemplate('contato', Contato);

const Global = createClass({
  render() {
    const { entry } = this.props;
    const nav = get(entry, 'nav', {}) || {}, foot = get(entry, 'footer', {}) || {}, cta = get(entry, 'cta', {}) || {};
    return html(`
      <header class="nav is-scrolled" style="position:static"><span class="nav__brand"><img src="/assets/gap-logo.png" class="nav__logo"></span><div class="nav__right"><nav class="nav__links"><a>${esc(nav.inicio)}</a><a>${esc(nav.projetos)}</a><a>${esc(nav.sobre)}</a><a>${esc(nav.metodo)}</a></nav><span class="btn btn--dark">${esc(nav.cta)}</span></div></header>
      <section class="band band--white"><div class="container cta cta--center"><h2 class="h-xl">${esc(cta.title)}</h2><p class="body">${esc(cta.sub)}</p><span class="btn btn--dark btn--lg">${esc(cta.button)}</span></div></section>
      <footer class="footer"><div class="container"><div class="footer__top"><span class="footer__wordmark"><img src="/assets/gap-logo.png" class="footer__logo"></span><nav class="footer__links"><a>${esc(nav.projetos)}</a><a>${esc(nav.sobre)}</a><a>${esc(nav.metodo)}</a><a>${esc(nav.cta)}</a></nav></div><div class="footer__bottom"><span>${esc(foot.tagline)}</span><span>${esc(foot.copyright)}</span></div></div></footer>`);
  },
});
CMS.registerPreviewTemplate('global', Global);

const Galeria = createClass({
  render() {
    const { entry } = this.props;
    return html(`<section class="band band--white"><div class="container"><p class="label">${esc(get(entry, 'eyebrow', ''))}</p><h1 class="h-lg">${esc(get(entry, 'title', ''))}</h1></div></section>`);
  },
});
CMS.registerPreviewTemplate('projetos_pagina', Galeria);
