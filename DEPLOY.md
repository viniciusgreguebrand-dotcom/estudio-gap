# Estúdio GAP — como o site funciona e como editar

**Site:** https://estudiogap.com.br · **Painel:** https://estudiogap.com.br/admin/

## Editar conteúdo (sem código)

1. Abra o **painel** e clique em *Entrar* (login com sua conta do GitHub).
2. **Projetos** → editar um projeto ou *+ Projeto*: capa, fotos do slideshow (até 6), serviços, ano, local, resumo e o conteúdo (imagem / vídeo Vimeo / título / texto — arraste para reordenar). *Publicado* desligado esconde o projeto.
3. **Páginas** → a copy de cada faixa da Home, Sobre, Método, Contato, Geral (menu/rodapé/CTA).
4. Clique em **Publicar**. Em ~1 minuto o site é reconstruído e atualizado (GitHub Actions → GitHub Pages).

Imagens: pode enviar um arquivo (vai para `assets/uploads/`) ou usar *Substituir com uma URL* e colar um link (Behance).

## Estrutura

- `content/paginas/*.json` — copy de cada página (o que o painel edita)
- `content/projetos/*.json` — um arquivo por projeto
- `templates/` — HTML (Jinja2) das páginas e partes comuns
- `scripts/build.py` — gera os `.html` a partir de content + templates
- `admin/` — painel (Decap CMS): `config.yml` define os campos; `preview.js` os previews
- `auth/worker.js` — proxy de login (Cloudflare Worker `estudiogap-auth`)
- `.github/workflows/build.yml` — build + deploy automáticos a cada push

## Editar localmente (opcional)

```bash
pip3 install jinja2
python3 scripts/build.py        # gera os HTML
npx -y serve -l 4321 .          # abre em http://localhost:4321
npx -y decap-server             # painel local em /admin sem login (local_backend)
git add -A && git commit -m "..." && git push
```

## Infra

- Hospedagem: GitHub Pages (repo `viniciusgreguebrand-dotcom/estudio-gap`, fonte: GitHub Actions)
- DNS: Registro.br → 4 registros A do GitHub + CNAME `www` → `viniciusgreguebrand-dotcom.github.io`
- HTTPS: emitido pelo GitHub; ative *Enforce HTTPS* em Settings → Pages quando disponível
- Login do painel: GitHub OAuth App "Painel Estúdio GAP" + Worker `estudiogap-auth` (variáveis `GITHUB_CLIENT_ID` / `GITHUB_CLIENT_SECRET`)

## Pendências

- [ ] Formulário de contato ainda não envia (ligar no Formspree ou similar)
- [ ] Depoimentos com nomes reais
- [ ] Marcar *Enforce HTTPS* no GitHub Pages
