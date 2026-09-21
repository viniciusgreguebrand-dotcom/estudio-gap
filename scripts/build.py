#!/usr/bin/env python3
"""Gera o site a partir de content/ (JSON editável pelo painel /admin) e templates/ (Jinja2).

Uso: python3 scripts/build.py
Saída: index.html, sobre.html, metodo.html, contato.html, projetos.html, projetos/<slug>.html
"""
import json, os, re, html as htmlmod
from jinja2 import Environment, FileSystemLoader

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
env = Environment(loader=FileSystemLoader(os.path.join(ROOT, 'templates')), autoescape=False, trim_blocks=False, lstrip_blocks=False)


def load(path):
    with open(os.path.join(ROOT, path), encoding='utf-8') as f:
        return json.load(f)


def esc(s):
    return htmlmod.escape(str(s), quote=True)


# ---------- projetos: texto bilíngue em duas colunas (PT | EN) ----------
EN_HINTS = (' the ', ' and ', ' with ', ' of ', ' is ', ' are ', ' that ', ' their ', ' through ')


def is_english(txt):
    t = ' ' + txt.lower() + ' '
    return sum(t.count(h) for h in EN_HINTS) >= 4


def split_langs(txt):
    parts = re.split(r'(?:^|\n)\s*(PT-BR|PT|EN)\b\s*', txt)
    if len(parts) > 1:
        pt, en = [], []
        lead = parts[0].strip()
        for i in range(1, len(parts), 2):
            (en if parts[i] == 'EN' else pt).append(parts[i + 1].strip())
        return '\n'.join(pt).strip(), '\n'.join(en).strip(), lead
    if (len(txt) < 70 and '\n' in txt) or len(txt) < 45:
        return '', '', txt
    return ('', txt, '') if is_english(txt) else (txt, '', '')


def render_blocks(blocks):
    out, pt, en = '', [], []

    def flush():
        nonlocal out, pt, en
        if pt and en:
            out += ('        <div class="case__text">\n          <div class="case__pt">' + ''.join(f'<p class="case__p">{x}</p>' for x in pt)
                    + '</div>\n          <div class="case__en">' + ''.join(f'<p class="case__p">{x}</p>' for x in en) + '</div>\n        </div>\n')
        elif pt or en:
            out += ''.join(f'        <p class="case__p">{x}</p>\n' for x in (pt or en))
        pt, en = [], []

    for b in blocks:
        t = b.get('type')
        if t == 'image':
            flush(); out += f'        <figure class="case__media"><img src="{b["src"]}" alt="{esc(b.get("alt", ""))}" loading="lazy" /></figure>\n'
        elif t == 'video':
            flush()
            src = b['src']
            # aceita link do Vimeo colado do navegador e converte em player
            m = re.search(r'vimeo\.com/(?:video/)?(\d+)', src)
            if m and 'player.vimeo.com' not in src:
                src = f'https://player.vimeo.com/video/{m.group(1)}?autoplay=1&loop=1&autopause=0&controls=0&muted=1'
            out += f'        <div class="case__video"><iframe src="{src}" allow="autoplay; fullscreen" loading="lazy" title="Vídeo do projeto"></iframe></div>\n'
        elif t == 'heading':
            flush(); out += f'        <h2 class="case__h">{esc(b["text"]).replace(chr(10), "<br>")}</h2>\n'
        elif t == 'text':
            p_txt, e_txt, lead = split_langs(b.get('text', ''))
            if lead:
                flush(); out += f'        <h2 class="case__h">{esc(lead).replace(chr(10), "<br>")}</h2>\n'
            if p_txt: pt.append(esc(p_txt).replace('\n', '<br>'))
            if e_txt: en.append(esc(e_txt).replace('\n', '<br>'))
    flush()
    return out


def main():
    g = load('content/paginas/global.json')
    c = load('content/paginas/contato.json')
    projects = []
    pdir = os.path.join(ROOT, 'content', 'projetos')
    for fn in sorted(os.listdir(pdir)):
        if fn.endswith('.json'):
            pr = load(f'content/projetos/{fn}')
            if pr.get('published', True):
                if not pr.get('slides'):
                    pr['slides'] = [pr['cover']] if pr.get('cover') else []
                projects.append(pr)
    projects.sort(key=lambda x: (x.get('order', 999), x['title']))

    hero_svg = open(os.path.join(ROOT, 'templates', 'partials', 'hero-logo.svg'), encoding='utf-8').read().strip()

    def write(name, html):
        with open(os.path.join(ROOT, name), 'w', encoding='utf-8') as f:
            f.write(html)

    pages = {
        'index.html': ('home.html', 'home', {'home': True, 'active': ''}),
        'sobre.html': ('sobre.html', 'sobre', {'active': 'sobre'}),
        'metodo.html': ('metodo.html', 'metodo', {'active': 'metodo'}),
        'contato.html': ('contato.html', 'contato', {'active': ''}),
        'projetos.html': ('projetos.html', 'projetos', {'active': 'projetos'}),
    }
    for out, (tpl, content, extra) in pages.items():
        p = load(f'content/paginas/{content}.json')
        html = env.get_template(tpl).render(p=p, seo=p['seo'], g=g, c=c, projects=projects, rel='', hero_svg=hero_svg, **extra)
        write(out, html)

    os.makedirs(os.path.join(ROOT, 'projetos'), exist_ok=True)
    tpl = env.get_template('projeto.html')
    for i, pr in enumerate(projects):
        nxt = projects[(i + 1) % len(projects)]
        seo = {'title': f"{pr['title']} · Estúdio GAP", 'description': pr.get('summary') or pr['title']}
        html = tpl.render(pr=pr, nxt=nxt, seo=seo, g=g, c=c, rel='../', active='projetos', blocks_html=render_blocks(pr.get('blocks', [])))
        write(f"projetos/{pr['slug']}.html", html)
    print(f'ok: {len(pages)} páginas + {len(projects)} projetos')


if __name__ == '__main__':
    main()
