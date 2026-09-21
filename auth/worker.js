// Proxy de login do painel (Decap CMS ⇄ GitHub OAuth) para rodar como Cloudflare Worker.
// Variáveis de ambiente necessárias no Worker: GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === '/auth') {
      const state = crypto.randomUUID();
      const redirect = new URL('https://github.com/login/oauth/authorize');
      redirect.searchParams.set('client_id', env.GITHUB_CLIENT_ID);
      redirect.searchParams.set('redirect_uri', `${url.origin}/callback`);
      redirect.searchParams.set('scope', 'repo,user');
      redirect.searchParams.set('state', state);
      return Response.redirect(redirect.toString(), 302);
    }
    if (url.pathname === '/callback') {
      const code = url.searchParams.get('code');
      const res = await fetch('https://github.com/login/oauth/access_token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ client_id: env.GITHUB_CLIENT_ID, client_secret: env.GITHUB_CLIENT_SECRET, code }),
      });
      const data = await res.json();
      const status = data.error ? 'error' : 'success';
      const payload = data.error ? JSON.stringify(data) : JSON.stringify({ token: data.access_token, provider: 'github' });
      const html = `<!doctype html><html><body><script>
        (function () {
          function send(msg) { window.opener.postMessage(msg, '*'); }
          window.addEventListener('message', function (e) {
            if (e.data === 'authorizing:github') {
              send('authorization:github:${status}:${payload.replace(/'/g, "\\'")}');
            }
          }, false);
          send('authorizing:github');
        })();
      </script></body></html>`;
      return new Response(html, { headers: { 'Content-Type': 'text/html; charset=utf-8' } });
    }
    return new Response('Estúdio GAP · proxy de login do painel', { status: 200 });
  },
};
