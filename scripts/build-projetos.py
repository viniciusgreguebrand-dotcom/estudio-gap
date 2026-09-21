#!/usr/bin/env python3
"""Gera projetos.html e projetos/<slug>.html a partir do site antigo (estudiogap.com.br).

Imagens ficam linkadas ao CDN do Behance e vídeos ao Vimeo (opção B — nada hospedado localmente).
Uso: python3 scripts/build-projetos.py [--from-cache]
Os dados extraídos ficam em data/projetos.json para edição manual posterior.
"""
import json, os, re, sys, html as htmlmod
from html.parser import HTMLParser
from urllib.request import urlopen, Request

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BASE = 'https://www.estudiogap.com.br'
SLUGS = [
    'karvalho-advocacia-tributaria',
    'debora-ricco-psicologia',
    'crg-advocacia-consultoria-juridica-identidade-visual',
    'tsc-group-branding',
    'callibra-studio-videomaker-identidade-visual',
]
COVERS = {  # capas já usadas na home
    'karvalho-advocacia-tributaria': 'assets/karvalho.jpg',
    'debora-ricco-psicologia': 'assets/debora-ricco.png',
    'crg-advocacia-consultoria-juridica-identidade-visual': 'assets/crg.png',
    'tsc-group-branding': 'assets/tsc.png',
    'callibra-studio-videomaker-identidade-visual': 'assets/callibra.png',
}


class CaseParser(HTMLParser):
    """Percorre <main><article class="case"> e devolve blocos em ordem: texto, img, video."""
    TEXT_TAGS = {'h1', 'h2', 'h3', 'p', 'dt', 'dd'}

    def __init__(self):
        super().__init__()
        self.blocks = []
        self.in_main = False
        self.cur = None  # (tag, cls, [text])
        self.skip = 0    # dentro de <a class="next-project"> / back-link

    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        if tag == 'main':
            self.in_main = True
        if not self.in_main:
            return
        cls = a.get('class', '') or ''
        if tag == 'a' and ('next-project' in cls or 'back-link' in cls):
            self.skip += 1
        if self.skip:
            return
        if tag == 'img' and a.get('src') and 'gap-original' not in a['src']:
            self.blocks.append({'t': 'img', 'src': a['src'], 'alt': a.get('alt', '')})
        elif tag == 'iframe' and a.get('src'):
            self.blocks.append({'t': 'video', 'src': a['src']})
        elif tag in self.TEXT_TAGS and self.cur is None:
            self.cur = (tag, cls, [])
        elif tag == 'br' and self.cur is not None:
            self.cur[2].append('\n')

    def handle_endtag(self, tag):
        if tag == 'main':
            self.in_main = False
        if tag == 'a' and self.skip:
            self.skip -= 1
        if self.cur and tag == self.cur[0]:
            txt = ''.join(self.cur[2]).strip()
            if txt:
                self.blocks.append({'t': self.cur[0], 'txt': txt, 'cls': self.cur[1]})
            self.cur = None

    def handle_data(self, data):
        if self.cur is not None:
            self.cur[2].append(data)


def fetch(path):
    req = Request(BASE + path, headers={'User-Agent': 'Mozilla/5.0'})
    return urlopen(req, timeout=30).read().decode('utf-8')


def extract(slug):
    p = CaseParser()
    p.feed(fetch('/projetos/' + slug))
    b = p.blocks
    name = next(x['txt'] for x in b if x['t'] == 'h1')
    meta = []
    for i, x in enumerate(b):
        if x['t'] == 'dt' and i + 1 < len(b) and b[i + 1]['t'] == 'dd':
            meta.append([x['txt'], b[i + 1]['txt']])
    # resumo = primeiro <p> antes da primeira mídia
    first_media = next((i for i, x in enumerate(b) if x['t'] in ('img', 'video')), len(b))
    summary = next((x['txt'] for x in b[:first_media] if x['t'] == 'p'), '')
    # corpo = tudo depois do bloco de intro (h1 + dl + resumo)
    start = 1 + 2 * len(meta) + (1 if summary else 0)
    body = [x for x in b[start:] if x['t'] != 'dt' and x['t'] != 'dd']
    return {'slug': slug, 'name': name, 'meta': meta, 'summary': summary,
            'cover': COVERS.get(slug, ''), 'body': body}


# ---------- templates ----------
def esc(s):
    return htmlmod.escape(s, quote=True)


def nav(rel, active=''):
    return f'''  <header class="nav is-scrolled">
    <a href="{rel}index.html" class="nav__brand">GAP<sup>®</sup></a>
    <nav class="nav__links">
      <a href="{rel}projetos.html"{' class="is-active"' if active == 'projetos' else ''}>Projetos</a>
      <a href="{rel}sobre.html">Sobre</a>
      <a href="{rel}index.html#metodo">Método</a>
    </nav>
    <a href="{rel}contato.html" class="btn btn--dark">Fale conosco</a>
  </header>
'''


def footer(rel):
    return f'''  <footer class="footer fade-dark">
    <div class="container">
      <div class="footer__top">
        <span class="footer__wordmark">GAP<sup>®</sup></span>
        <nav class="footer__links">
          <a href="{rel}projetos.html">Projetos</a>
          <a href="{rel}sobre.html">Sobre</a>
          <a href="{rel}index.html#metodo">Método</a>
          <a href="{rel}contato.html">Fale conosco</a>
        </nav>
      </div>
      <div class="footer__bottom">
        <span>Branding estratégico para advogados e escritórios consolidados.</span>
        <span>© 2026 Estúdio GAP</span>
      </div>
    </div>
  </footer>

  <script src="https://cdn.jsdelivr.net/npm/lenis@1.1.18/dist/lenis.min.js"></script>
  <script src="{rel}main.js"></script>
</body>
</html>
'''


def head(title, desc, rel):
    return f'''<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>{esc(title)}</title>
  <meta name="description" content="{esc(desc)}" />
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700&display=swap" rel="stylesheet" />
  <link rel="stylesheet" href="{rel}styles.css" />
</head>
<body class="page-inner">

'''


def meta_line(p):
    d = dict(p['meta'])
    parts = [x for x in [d.get('Local'), d.get('Ano')] if x]
    return ' · '.join(parts)


def gallery_page(projects):
    cards = ''
    for p in projects:
        cards += f'''        <article class="gallery__item">
          <a href="projetos/{p['slug']}.html">
            <span class="reveal-x gallery__cover"><img src="{p['cover']}" alt="{esc(p['name'])}" loading="lazy" /></span>
            <h2>{esc(p['name'])}</h2>
          </a>
          <div class="gallery__meta">
            <p>{esc(dict(p['meta']).get('Serviços', ''))}</p>
            <span>{esc(meta_line(p))}</span>
          </div>
          {f'<p class="gallery__summary">{esc(p["summary"])}</p>' if p['summary'] else ''}
        </article>
'''
    return (head('Projetos — Estúdio GAP', 'Galeria de projetos do Estúdio GAP.', '') + nav('', 'projetos') + f'''
  <main class="page">
    <section class="band band--white gallery">
      <div class="container">
        <p class="label">Projetos</p>
        <h1 class="h-lg">Cada projeto mostra por que aquela marca precisava existir daquela maneira.</h1>
        <div class="gallery__grid">
{cards}        </div>
      </div>
    </section>
  </main>

''' + footer(''))


def case_page(p, nxt):
    dl = ''.join(f'<div><dt>{esc(k)}</dt><dd>{esc(v)}</dd></div>' for k, v in p['meta'])
    body = ''
    for b in p['body']:
        if b['t'] == 'img':
            body += f'        <figure class="case__media"><img src="{b["src"]}" alt="{esc(b.get("alt", ""))}" loading="lazy" /></figure>\n'
        elif b['t'] == 'video':
            body += f'        <div class="case__video"><iframe src="{b["src"]}" allow="autoplay; fullscreen" loading="lazy" title="Vídeo do projeto"></iframe></div>\n'
        elif b['t'] in ('h2', 'h3'):
            body += f'        <h2 class="case__h">{esc(b["txt"])}</h2>\n'
        elif b['t'] == 'p':
            txt = esc(b['txt']).replace('\n', '<br>')
            body += f'        <p class="case__p">{txt}</p>\n'
    return (head(f"{p['name']} — Estúdio GAP", p['summary'] or p['name'], '../') + nav('../') + f'''
  <main class="page">
    <article class="case">
      <div class="container">
        <a href="../projetos.html" class="case__back">← Todos os projetos</a>
        <div class="case__intro">
          <div>
            <h1 class="h-xl">{esc(p['name'])}</h1>
            <dl class="case__meta">{dl}</dl>
          </div>
          {f'<p class="body case__summary">{esc(p["summary"])}</p>' if p['summary'] else ''}
        </div>
      </div>

      <div class="container case__blocks">
{body}      </div>

      <div class="container">
        <a href="{nxt['slug']}.html" class="case__next">
          <span class="label">Próximo projeto</span>
          <span class="h-lg">{esc(nxt['name'])} →</span>
        </a>
      </div>
    </article>
  </main>

''' + footer('../'))


def main():
    data_path = os.path.join(ROOT, 'data', 'projetos.json')
    if '--from-cache' in sys.argv and os.path.exists(data_path):
        projects = json.load(open(data_path))
    else:
        projects = [extract(s) for s in SLUGS]
        os.makedirs(os.path.dirname(data_path), exist_ok=True)
        json.dump(projects, open(data_path, 'w'), ensure_ascii=False, indent=1)
    os.makedirs(os.path.join(ROOT, 'projetos'), exist_ok=True)
    open(os.path.join(ROOT, 'projetos.html'), 'w').write(gallery_page(projects))
    for i, p in enumerate(projects):
        nxt = projects[(i + 1) % len(projects)]
        open(os.path.join(ROOT, 'projetos', p['slug'] + '.html'), 'w').write(case_page(p, nxt))
        print(f"{p['slug']}: {sum(1 for b in p['body'] if b['t']=='img')} imagens, {sum(1 for b in p['body'] if b['t']=='video')} vídeos")


if __name__ == '__main__':
    main()
