# Colocar o site no ar — passo a passo

Tudo já está pronto no repositório: commit feito, arquivo `CNAME` com `estudiogap.com.br` e `.nojekyll`.
Você só precisa fazer os 4 passos abaixo. Tempo total: ~15 min + propagação do DNS.

---

## 1. Criar o repositório no GitHub (2 min)

1. Acesse https://github.com/new
2. **Repository name:** `estudio-gap`
3. **Public**
4. NÃO marque "Add a README", "Add .gitignore" nem "Choose a license"
5. Clique em **Create repository**

## 2. Enviar o site (2 min)

Abra o Terminal (ou peça ao Claude) e rode, trocando `SEU-USUARIO` pelo seu usuário do GitHub:

```bash
cd ~/code/estudio-branding
git remote add origin https://github.com/SEU-USUARIO/estudio-gap.git
git push -u origin main
```

Se pedir senha: use um **Personal Access Token** (GitHub → Settings → Developer settings → Personal access tokens → Generate new token (classic) → marque `repo`). Cole o token no lugar da senha.

## 3. Ativar o GitHub Pages (1 min)

1. No repositório: **Settings → Pages**
2. Em **Build and deployment → Source:** `Deploy from a branch`
3. **Branch:** `main` · pasta `/ (root)` → **Save**
4. Em **Custom domain** vai aparecer `estudiogap.com.br` (vem do arquivo CNAME). Se não aparecer, digite e salve.
5. Aguarde 1–2 min e teste em `https://SEU-USUARIO.github.io/estudio-gap/` — se abrir, está no ar.

## 4. Apontar o domínio (5 min + propagação)

O DNS de `estudiogap.com.br` está no **Cloudflare** (é onde o site do ChatGPT foi apontado). Entre em https://dash.cloudflare.com → estudiogap.com.br → **DNS → Records**.

**Apague** os registros atuais de `estudiogap.com.br` e `www` (os que apontam para `custom-domains.chatgpt.site` ou IPs 162.159.x / 172.66.x).

**Crie** estes:

| Tipo  | Nome | Conteúdo                 | Proxy            |
|-------|------|--------------------------|------------------|
| A     | @    | 185.199.108.153          | DNS only (nuvem cinza) |
| A     | @    | 185.199.109.153          | DNS only |
| A     | @    | 185.199.110.153          | DNS only |
| A     | @    | 185.199.111.153          | DNS only |
| CNAME | www  | SEU-USUARIO.github.io    | DNS only |

> Importante: deixe o proxy do Cloudflare **desligado** (nuvem cinza) nesses registros, senão o GitHub não consegue emitir o certificado HTTPS.

Depois, volte em **GitHub → Settings → Pages**, aguarde o check verde em "DNS check successful" e marque **Enforce HTTPS**.

Propagação: normalmente minutos, pode levar até algumas horas. Quando `https://estudiogap.com.br` abrir o site novo, o antigo saiu do ar.

---

## Alternativa sem terminal: Netlify Drop

Se preferir não usar o terminal:
1. Entre em https://app.netlify.com/drop (login com Google/GitHub)
2. Arraste o arquivo `estudio-gap-site.zip` (está na pasta do projeto) para a página
3. O site sobe em segundos numa URL `*.netlify.app`
4. **Domain management → Add custom domain** → `estudiogap.com.br`; o Netlify mostra os registros DNS para colar no Cloudflare (A `75.2.60.5` e CNAME `www` → `SEU-SITE.netlify.app`)

---

## Antes de trocar o DNS — pendências

- [ ] **Formulário de contato** ainda não envia nada (site estático). Opção rápida: criar conta em https://formspree.io, pegar o endpoint e trocar `action="#"` em `contato.html` por `action="https://formspree.io/f/SEU-ID"` (Claude faz isso em 1 min quando você tiver o ID).
- [ ] Depoimentos na home ainda são texto provisório ("Nome do sócio").
- [ ] Imagens dos projetos estão linkadas ao Behance (opção B). Para hospedar localmente depois: `python3 scripts/build-projetos.py` com download habilitado.

## Atualizar o site depois

Qualquer alteração: `git add -A && git commit -m "..." && git push` — o GitHub Pages republica sozinho em ~1 min.

---

## Backup — registros DNS antigos (ChatGPT), removidos em 20/09/2026

Caso precise voltar ao site antigo, recriar no Registro.br → Configurar zona DNS:

| Tipo  | Nome | Dados |
|-------|------|-------|
| A     | estudiogap.com.br | 162.159.143.30 |
| A     | estudiogap.com.br | 172.66.3.26 |
| CNAME | www.estudiogap.com.br | custom-domains.chatgpt.site. |
| TXT   | _cf-custom-hostname.estudiogap.com.br | "589efba0-545a-4fb2-8b37-854b9a6355b6" |
| TXT   | _openai-site-verification.estudiogap.com.br | "openai-site-verification=RC80Q9fB4mlmovnRHCw_WWmanFRnInNKZEYv1A8jU6A" |
| TXT   | _cf-custom-hostname.www.estudiogap.com.br | "654df390-ee28-44af-806a-0a96d9a1316c" |
| TXT   | _openai-site-verification.www.estudiogap.com.br | "openai-site-verification=CsN7rYl8N12f-Wbd0PHHleL5gncr6X3BxCB6O-C6d_8" |
