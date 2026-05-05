/**
 * components.js
 * Carrega header.html e footer.html dinamicamente em todas as páginas.
 * Marca o link ativo no nav baseado na URL atual.
 */

(function () {
  'use strict';

  /* ── Utilitário: busca e injeta HTML de um componente ─────── */
  async function loadComponent(selector, url) {
    const el = document.querySelector(selector);
    if (!el) return;
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      el.innerHTML = await res.text();
    } catch (err) {
      console.warn(`[components.js] Não foi possível carregar ${url}:`, err);
    }
  }

  /* ── Resolve o path do componente relativo à raiz ─────────── */
  function resolveComponentPath(filename) {
    // Detecta a profundidade da página atual para ajustar o path
    const depth = location.pathname.replace(/\/$/, '').split('/').length - 1;
    const prefix = depth <= 1 ? '' : '../'.repeat(depth - 1);
    return `${prefix}components/${filename}`;
  }

  /* ── Marca o link ativo no nav ────────────────────────────── */
  function setActiveNav() {
    const path = location.pathname;
    document.querySelectorAll('.nav-links a').forEach(link => {
      const href = link.getAttribute('href');
      if (!href) return;
      // Extrai o segmento principal da URL
      const segment = href.replace(/^\.\.\//, '').replace(/\/$/, '').split('/')[0];
      if (
        (segment === '' && (path === '/' || path.endsWith('index.html'))) ||
        (segment && path.includes(`/${segment}/`))
      ) {
        link.classList.add('active');
      }
    });
  }

  /* ── Hamburger / menu mobile ──────────────────────────────── */
  function initMobileMenu() {
    const btn = document.querySelector('.nav-hamburger');
    const menu = document.querySelector('.nav-mobile');
    if (!btn || !menu) return;

    btn.addEventListener('click', () => {
      const open = menu.classList.toggle('open');
      btn.classList.toggle('open', open);
      document.body.style.overflow = open ? 'hidden' : '';
    });

    // Fecha ao clicar em link
    menu.querySelectorAll('a').forEach(a => {
      a.addEventListener('click', () => {
        menu.classList.remove('open');
        btn.classList.remove('open');
        document.body.style.overflow = '';
      });
    });
  }

  /* ── Inicializa tudo após o DOM + componentes carregarem ───── */
  async function init() {
    const headerPath = resolveComponentPath('header.html');
    const footerPath = resolveComponentPath('footer.html');

    await Promise.all([
      loadComponent('#site-header', headerPath),
      loadComponent('#site-footer', footerPath),
    ]);

    setActiveNav();
    initMobileMenu();

    // Dispara evento para que main.js saiba que os componentes estão prontos
    document.dispatchEvent(new CustomEvent('components:ready'));
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
