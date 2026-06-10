/* ============================================================
   QUINTO CONTINENTE — dynamic-content.js
   Integração dinâmica entre site estático e painel administrativo Next.js
   ============================================================ */
(function () {
  'use strict';

  var API_BASE = '/admin/api';

  // Helper para verificar a profundidade do path (para ajustar links relativos das APIs se necessário)
  function getApiUrl(endpoint) {
    // Se a página estiver em subpastas (ex: artistas/index.html), precisamos de "../admin/api"
    var path = window.location.pathname;
    var depth = (path.match(/\//g) || []).length;
    
    // Se for local file system (ex: C:/.../artistas/index.html)
    if (window.location.protocol === 'file:') {
      // Usaremos url absoluto local para fins de desenvolvimento
      return 'http://localhost:3000/api' + endpoint;
    }

    var prefix = '';
    // Ajusta a rota caso esteja em subdiretórios
    if (path.indexOf('/artistas/') !== -1 || path.indexOf('/galeria/') !== -1 || path.indexOf('/servicos/') !== -1 || path.indexOf('/sobre/') !== -1) {
      prefix = '../';
    }
    
    return prefix + 'admin/api' + endpoint;
  }

  /* ── 1. Carregar Banners na Home ──────────────────────────── */
  async function loadDynamicBanners() {
    var slider = document.getElementById('bannerSlider');
    if (!slider) return;

    // Sinaliza para o banner.js original que o carregamento é dinâmico
    slider.dataset.dynamic = 'true';

    try {
      var res = await fetch(getApiUrl('/banners?active=true'));
      if (!res.ok) throw new Error();
      
      var banners = await res.json();
      if (!banners || banners.length === 0) throw new Error("Sem banners ativos");

      // Monta os Slides
      var slidesHtml = '';
      banners.forEach(function (banner, idx) {
        var activeClass = idx === 0 ? 'active' : '';
        var linkUrl = banner.linkUrl || '#contato';
        var label = banner.label || 'Destaque';
        var desc = banner.description || '';

        slidesHtml += `
          <div class="banner-slide ${activeClass}">
            <img src="${banner.imageUrl}" alt="${banner.title}" style="width:100%; height:100%; object-fit:cover; position:absolute; inset:0; z-index:-1;">
            <div class="banner-overlay"></div>
            <div class="banner-content">
              <div class="banner-label"><span class="banner-label-dot"></span>${label}</div>
              <div class="banner-title">${banner.title}</div>
              <div class="banner-desc">${desc}</div>
              <a href="${linkUrl}" class="btn-main">
                Consultar disponibilidade 
                <svg class="arr" width="14" height="14" viewBox="0 0 16 16" fill="none">
                  <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
                </svg>
              </a>
            </div>
          </div>
        `;
      });

      // Adiciona a barra de progresso e controles
      slidesHtml += `<div class="banner-progress" id="bannerProgress"></div>`;
      
      // Monta os Controles / Dots
      var dotsHtml = '';
      banners.forEach(function (_, idx) {
        var activeClass = idx === 0 ? 'active' : '';
        dotsHtml += `<div class="banner-dot ${activeClass}" data-slide="${idx}"></div>`;
      });

      var controlsHtml = `
        <div class="banner-controls">
          <button class="banner-btn" id="bannerPrev" aria-label="Anterior">
            <svg viewBox="0 0 16 16" stroke="currentColor" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M10 4l-4 4 4 4" />
            </svg>
          </button>
          <div class="banner-dots" id="bannerDots">
            ${dotsHtml}
          </div>
          <button class="banner-btn" id="bannerNext" aria-label="Próximo">
            <svg viewBox="0 0 16 16" stroke="currentColor" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M6 4l4 4-4 4" />
            </svg>
          </button>
        </div>
      `;

      slider.innerHTML = slidesHtml + controlsHtml;

      // Executa a inicialização do script slider (banner.js)
      if (typeof window.initBannerSlider === 'function') {
        window.initBannerSlider();
      }
    } catch (err) {
      console.warn("Usando banners estáticos de fallback.", err);
      // Se falhar, inicializa o slider com o HTML estático padrão
      if (typeof window.initBannerSlider === 'function') {
        window.initBannerSlider();
      }
    }
  }

  /* ── 2. Carregar Marquee de Artistas na Home ───────────────── */
  async function loadMarqueeArtists() {
    var track = document.querySelector('.marquee-track');
    if (!track) return;

    try {
      var res = await fetch(getApiUrl('/artistas?active=true&featured=true'));
      if (!res.ok) throw new Error();

      var artists = await res.json();
      if (!artists || artists.length === 0) return;

      var itemsHtml = '';
      artists.forEach(function (artist) {
        itemsHtml += `
          <div class="artist-card">
            <div class="artist-img">
              <img src="${artist.imageUrl}" alt="${artist.name}" style="width:100%; height:100%; object-fit:cover;">
            </div>
            <div class="artist-info">
              <h3 class="artist-name">${artist.name}</h3>
            </div>
          </div>
        `;
      });

      // Duplica a lista para o efeito de rolagem infinita do marquee CSS
      track.innerHTML = itemsHtml + itemsHtml;
    } catch (err) {
      console.warn("Erro ao carregar artistas dinâmicos no marquee.", err);
    }
  }

  /* ── 3. Carregar Lista de Artistas (Página Artistas) ────────── */
  async function loadArtistsPage() {
    var grid = document.getElementById('artistsGrid');
    if (!grid) return;

    try {
      var res = await fetch(getApiUrl('/artistas?active=true'));
      if (!res.ok) throw new Error();

      var artists = await res.json();
      if (!artists || artists.length === 0) {
        grid.innerHTML = '<div class="py-12 text-center text-muted2 w-full col-span-full">Nenhum artista disponível no momento.</div>';
        return;
      }

      var itemsHtml = '';
      artists.forEach(function (artist) {
        itemsHtml += `
          <div class="artist-card reveal vis" data-name="${artist.name}">
            <div class="artist-img">
              <img src="${artist.imageUrl}" alt="${artist.name}" style="width:100%; height:100%; object-fit:cover;">
            </div>
            <div class="artist-info">
              <h3 class="artist-name">${artist.name}</h3>
            </div>
          </div>
        `;
      });

      grid.innerHTML = itemsHtml;

      // Vincula novamente a pesquisa local
      var searchInput = document.getElementById('artistSearch');
      if (searchInput) {
        searchInput.addEventListener('input', function (e) {
          var term = e.target.value.toLowerCase();
          var cards = grid.querySelectorAll('.artist-card');
          cards.forEach(function (card) {
            var name = card.getAttribute('data-name').toLowerCase();
            card.style.display = name.indexOf(term) !== -1 ? 'block' : 'none';
          });
        });
      }
    } catch (err) {
      console.warn("Erro ao carregar catálogo de artistas dinâmicos.", err);
    }
  }

  /* ── 4. Carregar Galeria de Fotos ─────────────────────────── */
  var allGalleryItems = [];
  async function loadGalleryPage() {
    var grid = document.getElementById('galleryGrid');
    if (!grid) return;

    try {
      var res = await fetch(getApiUrl('/galeria?active=true'));
      if (!res.ok) throw new Error();

      allGalleryItems = await res.json();
      
      // Renderiza as abas de categoria no topo
      renderGalleryTabs();

      // Renderiza todas as imagens inicialmente
      renderGalleryGrid('Todos');
    } catch (err) {
      console.warn("Erro ao carregar fotos da galeria.", err);
    }
  }

  function renderGalleryTabs() {
    var section = document.querySelector('.gallery-page-section');
    if (!section) return;

    // Verifica se a div de abas já existe, se não, cria
    var tabsDiv = section.querySelector('.gallery-tabs');
    if (!tabsDiv) {
      tabsDiv = document.createElement('div');
      tabsDiv.className = 'gallery-tabs reveal vis';
      // Insere antes do grid
      var grid = document.getElementById('galleryGrid');
      section.insertBefore(tabsDiv, grid);
    }

    var categories = ['Todos', 'Geral', 'Shows', 'Eventos', 'Corporativos'];
    var tabsHtml = '';
    categories.forEach(function (cat) {
      var activeClass = cat === 'Todos' ? 'active' : '';
      tabsHtml += `<button class="gallery-tab-btn ${activeClass}" data-cat="${cat}">${cat}</button>`;
    });

    tabsDiv.innerHTML = tabsHtml;

    // Listener para as abas
    tabsDiv.querySelectorAll('.gallery-tab-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        tabsDiv.querySelectorAll('.gallery-tab-btn').forEach(function (b) { b.classList.remove('active'); });
        btn.classList.add('active');
        renderGalleryGrid(btn.dataset.cat);
      });
    });
  }

  function renderGalleryGrid(category) {
    var grid = document.getElementById('galleryGrid');
    if (!grid) return;

    var filtered = allGalleryItems.filter(function (item) {
      // Mapeia categorias do banco para o filtro do front
      var dbCat = item.category;
      if (category === 'Todos') return true;
      return dbCat === category;
    });

    if (filtered.length === 0) {
      grid.innerHTML = '<div class="py-16 text-center text-muted2 col-span-full">Nenhum registro fotográfico nesta categoria.</div>';
      return;
    }

    var gridHtml = '';
    filtered.forEach(function (item) {
      var title = item.title || '';
      gridHtml += `
        <div class="gallery-item reveal vis">
          <img src="${item.imageUrl}" alt="${title}" loading="lazy">
          <div class="gallery-item-caption">
            <span class="gallery-item-cat">${item.category}</span>
            <span class="gallery-item-title">${title}</span>
          </div>
        </div>
      `;
    });

    grid.innerHTML = gridHtml;
  }

  /* ── 5. Integrar Formulário de Contato Real (CRM) ─────────── */
  function setupContactForm() {
    var form = document.querySelector('form[data-form="contato"]');
    if (!form) return;

    form.addEventListener('submit', async function (e) {
      e.preventDefault();
      // Interrompe imediatamente qualquer outro listener (como o mock de main.js)
      e.stopImmediatePropagation();

      var btn = form.querySelector('.btn-form');
      var ok = form.querySelector('.form-ok');

      var nameVal = document.getElementById('f-nome').value;
      var emailVal = document.getElementById('f-email').value;
      var telVal = document.getElementById('f-tel').value;
      var typeVal = document.getElementById('f-tipo').value;
      var artistVal = document.getElementById('f-artista').value || null;

      if (btn) {
        btn.disabled = true;
        btn.textContent = 'Enviando...';
      }

      var payload = {
        name: nameVal,
        email: emailVal,
        phone: telVal,
        eventType: typeVal,
        artistInterest: artistVal
      };

      try {
        var res = await fetch(getApiUrl('/leads'), {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(payload)
        });

        var data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Erro ao enviar lead.');

        if (btn) btn.style.display = 'none';
        if (ok) {
          ok.style.display = 'block';
          ok.style.color = '#ff5858';
          ok.textContent = '✓ Proposta enviada! Nossa equipe entrará em contato em breve.';
        }
        form.reset();
      } catch (err) {
        console.error("Erro no envio do formulário:", err);
        alert('Falha ao enviar solicitação. Por favor, tente novamente.');
        if (btn) {
          btn.disabled = false;
          btn.textContent = 'Solicitar Atendimento Estratégico';
        }
      }
    });
  }

  /* ── Boot Inicializador ──────────────────────────────────── */
  function boot() {
    loadDynamicBanners();
    loadMarqueeArtists();
    loadArtistsPage();
    loadGalleryPage();
    setupContactForm();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
