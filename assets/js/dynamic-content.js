/* ============================================================
   QUINTO CONTINENTE — dynamic-content.js
   Integração dinâmica entre site estático e painel administrativo Next.js
   ============================================================ */
(function () {
  'use strict';

  var API_BASE = '/admin/api';

  // Helper para obter a URL da API (ajusta automaticamente entre local e produção)
  function getApiUrl(endpoint) {
    if (
      window.location.protocol === 'file:' || 
      window.location.hostname === 'localhost' || 
      window.location.hostname === '127.0.0.1'
    ) {
      return 'http://127.0.0.1:3000/api' + endpoint;
    }
    return 'https://quintocontinente-web-final-pb4v.vercel.app/api' + endpoint;
  }

  // Helper para disparar eventos GTM no Data Layer
  function trackEvent(eventName, eventData) {
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({
      event: eventName,
      data: eventData || {}
    });
  }

  // ── 0. Capturar e Preservar Parâmetros UTM ──────────────────
  function captureAndStoreUtms() {
    var params = new URLSearchParams(window.location.search);
    var utmSource = params.get('utm_source');
    var utmMedium = params.get('utm_medium');
    var utmCampaign = params.get('utm_campaign');
    var utmContent = params.get('utm_content');

    if (utmSource) sessionStorage.setItem('utm_source', utmSource);
    if (utmMedium) sessionStorage.setItem('utm_medium', utmMedium);
    if (utmCampaign) sessionStorage.setItem('utm_campaign', utmCampaign);
    if (utmContent) sessionStorage.setItem('utm_content', utmContent);
  }

  function getStoredUtms() {
    return {
      utmSource: sessionStorage.getItem('utm_source') || null,
      utmMedium: sessionStorage.getItem('utm_medium') || null,
      utmCampaign: sessionStorage.getItem('utm_campaign') || null,
      utmContent: sessionStorage.getItem('utm_content') || null
    };
  }

  // Monitora todos os cliques no site em botões do WhatsApp
  function hookWhatsAppClicks() {
    document.addEventListener('click', function(e) {
      var target = e.target.closest('a[href*="wa.me"]');
      if (target) {
        trackEvent('whatsapp_click', {
          link: target.href,
          text: target.textContent.trim(),
          page: window.location.pathname
        });
      }
    });
  }

  // Executa captura de UTMs imediatamente
  captureAndStoreUtms();

  /* ── 1. Carregar Banners na Home ──────────────────────────── */
  function renderBanners(slider, banners) {
    var slidesHtml = '';
    banners.forEach(function (banner, idx) {
      var activeClass = idx === 0 ? 'active' : '';
      var linkUrl = banner.linkUrl || '#contato';
      var label = banner.label || 'Destaque';
      var desc = banner.description || '';

      slidesHtml += `
        <div class="banner-slide ${activeClass}">
          <img src="${banner.imageUrl}" alt="${banner.title}" ${idx > 0 ? 'loading="lazy"' : 'fetchpriority="high"'} decoding="async" style="width:100%; height:100%; object-fit:cover; position:absolute; inset:0; z-index:-1;">
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

    slidesHtml += `<div class="banner-progress" id="bannerProgress"></div>`;
    
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

    if (typeof window.initBannerSlider === 'function') {
      window.initBannerSlider();
    }
  }

  async function loadDynamicBanners() {
    var slider = document.getElementById('bannerSlider');
    if (!slider) return;

    slider.dataset.dynamic = 'true';

    // Ler do Cache Local
    var cached = localStorage.getItem('qc_banners');
    if (cached) {
      try {
        var banners = JSON.parse(cached);
        renderBanners(slider, banners);
      } catch (e) {
        console.warn("Erro ao ler banners do cache local:", e);
      }
    }

    try {
      var res = await fetch(getApiUrl('/banners?active=true'));
      if (!res.ok) throw new Error();
      
      var banners = await res.json();
      if (!banners || banners.length === 0) throw new Error("Sem banners ativos");

      var serialized = JSON.stringify(banners);
      localStorage.setItem('qc_banners', serialized);

      // Só re-renderiza se os dados de fato mudaram para evitar flashes visuais
      if (serialized !== cached) {
        renderBanners(slider, banners);
      }
    } catch (err) {
      console.warn("Usando banners estáticos de fallback ou cache.", err);
      if (!cached && typeof window.initBannerSlider === 'function') {
        window.initBannerSlider();
      }
    }
  }

  /* ── 2. Carregar Marquee de Artistas na Home ───────────────── */
  function renderMarquee(track, artists) {
    var itemsHtml = '';
    artists.forEach(function (artist) {
      itemsHtml += `
        <a href="artistas/artista.html?slug=${artist.slug}" class="artist-card" style="text-decoration:none;">
          <div class="artist-img">
            <img src="${artist.imageUrl}" alt="${artist.name}" loading="lazy" decoding="async" style="width:100%; height:100%; object-fit:cover;">
          </div>
          <div class="artist-info">
            <h3 class="artist-name">${artist.name}</h3>
          </div>
        </a>
      `;
    });
    track.innerHTML = itemsHtml + itemsHtml;
  }

  async function loadMarqueeArtists() {
    var track = document.querySelector('.marquee-track');
    if (!track) return;

    // Ler do Cache Local
    var cached = localStorage.getItem('qc_featured_artists');
    if (cached) {
      try {
        var artists = JSON.parse(cached);
        renderMarquee(track, artists);
      } catch (e) {
        console.warn("Erro ao ler artistas do cache local:", e);
      }
    }

    try {
      var res = await fetch(getApiUrl('/artistas?active=true&featured=true'));
      if (!res.ok) throw new Error();

      var artists = await res.json();
      if (!artists || artists.length === 0) return;

      var serialized = JSON.stringify(artists);
      localStorage.setItem('qc_featured_artists', serialized);

      if (serialized !== cached) {
        renderMarquee(track, artists);
      }
    } catch (err) {
      console.warn("Erro ao carregar artistas dinâmicos no marquee.", err);
    }
  }

  /* ── 3. Carregar Lista de Artistas (Página Artistas) ────────── */
  function renderArtistsGrid(grid, artists) {
    var itemsHtml = '';
    artists.forEach(function (artist) {
      itemsHtml += `
        <a href="artista.html?slug=${artist.slug}" class="artist-card reveal vis" data-name="${artist.name}" style="text-decoration:none;">
          <div class="artist-img">
            <img src="${artist.imageUrl}" alt="${artist.name}" loading="lazy" decoding="async" style="width:100%; height:100%; object-fit:cover;">
          </div>
          <div class="artist-info">
            <h3 class="artist-name">${artist.name}</h3>
          </div>
        </a>
      `;
    });

    grid.innerHTML = itemsHtml;
  }

  async function loadArtistsPage() {
    var grid = document.getElementById('artistsGrid');
    if (!grid) return;

    // Ler do Cache Local
    var cached = localStorage.getItem('qc_all_artists');
    if (cached) {
      try {
        var artists = JSON.parse(cached);
        renderArtistsGrid(grid, artists);
      } catch (e) {
        console.warn("Erro ao ler catálogo do cache local:", e);
      }
    }

    try {
      var res = await fetch(getApiUrl('/artistas?active=true'));
      if (!res.ok) throw new Error();

      var artists = await res.json();
      if (!artists || artists.length === 0) {
        grid.innerHTML = '<div class="py-12 text-center text-muted2 w-full col-span-full">Nenhum artista disponível no momento.</div>';
        return;
      }

      var serialized = JSON.stringify(artists);
      localStorage.setItem('qc_all_artists', serialized);

      if (serialized !== cached) {
        renderArtistsGrid(grid, artists);
      }

      var searchInput = document.getElementById('artistSearch');
      if (searchInput) {
        // Remove event listener antigo caso já exista recriando o elemento ou removendo/adicionando handler
        var newSearchInput = searchInput.cloneNode(true);
        searchInput.parentNode.replaceChild(newSearchInput, searchInput);
        newSearchInput.addEventListener('input', function (e) {
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

    // Ler do Cache Local
    var cached = localStorage.getItem('qc_gallery');
    if (cached) {
      try {
        allGalleryItems = JSON.parse(cached);
        renderGalleryTabs();
        renderGalleryGrid('Todos');
      } catch (e) {
        console.warn("Erro ao ler galeria do cache local:", e);
      }
    }

    try {
      var res = await fetch(getApiUrl('/galeria?active=true'));
      if (!res.ok) throw new Error();

      var items = await res.json();
      var serialized = JSON.stringify(items);
      localStorage.setItem('qc_gallery', serialized);

      if (serialized !== cached) {
        allGalleryItems = items;
        renderGalleryTabs();
        renderGalleryGrid('Todos');
      }
    } catch (err) {
      console.warn("Erro ao carregar fotos da galeria.", err);
    }
  }

  function renderGalleryTabs() {
    var section = document.querySelector('.gallery-page-section');
    if (!section) return;

    var tabsDiv = section.querySelector('.gallery-tabs');
    if (!tabsDiv) {
      tabsDiv = document.createElement('div');
      tabsDiv.className = 'gallery-tabs reveal vis';
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

  /* ── 5. Integrar Formulário de Contato Real (CRM + UTMs) ────── */
  function setupContactForm() {
    var form = document.querySelector('form[data-form="contato"]');
    if (!form) return;

    // Evita acumular múltiplos listeners
    if (form.dataset.hooked) return;
    form.dataset.hooked = 'true';

    form.addEventListener('submit', async function (e) {
      e.preventDefault();
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

      var utms = getStoredUtms();
      var payload = {
        name: nameVal,
        email: emailVal,
        phone: telVal,
        eventType: typeVal,
        artistInterest: artistVal,
        utmSource: utms.utmSource,
        utmMedium: utms.utmMedium,
        utmCampaign: utms.utmCampaign,
        utmContent: utms.utmContent
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

        // GA/GTM conversion event trigger
        trackEvent('lead_form_submit', {
          name: nameVal,
          email: emailVal,
          eventType: typeVal,
          artistInterest: artistVal,
          utmSource: utms.utmSource,
          utmMedium: utms.utmMedium,
          utmCampaign: utms.utmCampaign,
          utmContent: utms.utmContent
        });

        if (btn) btn.style.display = 'none';
        if (ok) {
          ok.style.display = 'block';
          ok.style.color = '#D42B2B';
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

  /* ── 6. Carregar Detalhes de um Artista (artista.html) ─────── */
  function renderArtistProfile(artist) {
    document.getElementById('breadcrumb-name').textContent = artist.name;
    document.getElementById('artist-name').textContent = artist.name;
    
    var genreEl = document.getElementById('artist-genre');
    if (genreEl) genreEl.textContent = artist.genre || 'Gênero não informado';
    
    var bgEl = document.getElementById('artist-hero-bg');
    if (bgEl) bgEl.style.backgroundImage = `url('${artist.imageUrl}')`;
    
    var bioImgEl = document.getElementById('artist-bio-img');
    if (bioImgEl) bioImgEl.src = artist.imageUrl;
    
    var bioTextEl = document.getElementById('artist-bio-text');
    if (bioTextEl && artist.bio) {
      var paragraphs = artist.bio.split('\n').filter(Boolean);
      bioTextEl.innerHTML = paragraphs.map(function(p) { return `<p>${p}</p>`; }).join('');
    }

    // Dynamic SEO tags
    document.title = artist.name + ' — Quinto Continente | Agência de Artistas';
    
    var metaDesc = document.getElementById('meta-desc');
    if (metaDesc) metaDesc.setAttribute('content', `Contrate ${artist.name} pela Quinto Continente. Veja biografia, galeria de fotos e solicite disponibilidade de cotação.`);
    
    var canonical = document.getElementById('canonical-link');
    if (canonical) canonical.setAttribute('href', `https://quintocontinente.com.br/artistas/artista.html?slug=${artist.slug}`);
    
    var ogTitle = document.getElementById('og-title');
    if (ogTitle) ogTitle.setAttribute('content', artist.name + ' — Quinto Continente | Agência de Artistas');
    
    var ogDesc = document.getElementById('og-desc');
    if (ogDesc) ogDesc.setAttribute('content', `Contrate ${artist.name} pela Quinto Continente. Veja biografia, galeria de fotos e solicite disponibilidade de cotação.`);
    
    var ogImg = document.getElementById('og-img');
    if (ogImg) ogImg.setAttribute('content', artist.imageUrl);

    // JSON-LD dynamic injection
    var oldSchema = document.getElementById('dynamic-artist-jsonld');
    if (oldSchema) oldSchema.remove();

    var schemaScript = document.createElement('script');
    schemaScript.type = 'application/ld+json';
    schemaScript.id = 'dynamic-artist-jsonld';
    schemaScript.text = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "PerformingArtist",
      "name": artist.name,
      "image": artist.imageUrl,
      "description": artist.bio,
      "genre": artist.genre
    });
    document.head.appendChild(schemaScript);

    // Trigger GTM artist_page_view event
    trackEvent('artist_page_view', {
      artistName: artist.name,
      slug: artist.slug
    });

    // Render social links
    var socialContainer = document.getElementById('social-links-container');
    var hasSocial = false;
    if (socialContainer) {
      var socialHtml = '';
      if (artist.websiteUrl) {
        hasSocial = true;
        socialHtml += `<li><a href="${artist.websiteUrl}" target="_blank" rel="noopener" class="artist-social-link">Website Oficial</a></li>`;
      }
      if (artist.instagramUrl) {
        hasSocial = true;
        socialHtml += `<li><a href="${artist.instagramUrl}" target="_blank" rel="noopener" class="artist-social-link">Instagram</a></li>`;
      }
      if (artist.spotifyUrl) {
        hasSocial = true;
        socialHtml += `<li><a href="${artist.spotifyUrl}" target="_blank" rel="noopener" class="artist-social-link">Spotify / Streaming</a></li>`;
      }
      socialContainer.innerHTML = socialHtml;
      var socialSection = document.getElementById('social-section');
      if (socialSection) socialSection.style.display = hasSocial ? 'block' : 'none';
    }

    // Render gallery slider
    var trackEl = document.getElementById('gallery-track');
    if (trackEl && artist.galleryUrls && artist.galleryUrls.length > 0) {
      var slidesHtml = '';
      artist.galleryUrls.forEach(function (url) {
        slidesHtml += `
          <div class="gallery-slide">
            <img src="${url}" alt="Foto de ${artist.name}" loading="lazy">
          </div>
        `;
      });
      trackEl.innerHTML = slidesHtml;
      var gallerySection = document.getElementById('gallery-section');
      if (gallerySection) gallerySection.style.display = 'block';
      setupSliderLogic(artist.galleryUrls.length);
    } else {
      var gallerySection = document.getElementById('gallery-section');
      if (gallerySection) gallerySection.style.display = 'none';
    }

    // Hook Dynamic CTA links
    var waCta = document.getElementById('dynamic-wa-cta');
    if (waCta) {
      var waText = encodeURIComponent(`Olá! Tenho interesse em contratar o show do artista ${artist.name} pela Quinto Continente. Gostaria de verificar disponibilidade de rota.`);
      waCta.href = `https://wa.me/5567992185103?text=${waText}`;
      if (!waCta.dataset.hooked) {
        waCta.dataset.hooked = 'true';
        waCta.addEventListener('click', function() {
          trackEvent('artist_contact_click', {
            artistName: artist.name,
            channel: 'WhatsApp'
          });
        });
      }
    }

    var formCta = document.getElementById('dynamic-form-cta');
    if (formCta) {
      formCta.href = `../contato/index.html?artista=${encodeURIComponent(artist.name)}`;
      if (!formCta.dataset.hooked) {
        formCta.dataset.hooked = 'true';
        formCta.addEventListener('click', function() {
          trackEvent('artist_contact_click', {
            artistName: artist.name,
            channel: 'Form'
          });
        });
      }
    }
  }

  async function loadArtistProfilePage() {
    var nameEl = document.getElementById('artist-name');
    if (!nameEl) return;

    var params = new URLSearchParams(window.location.search);
    var slug = params.get('slug');
    if (!slug) {
      nameEl.textContent = 'Artista não especificado';
      return;
    }

    // Ler do Cache Local
    var cacheKey = 'qc_artist_profile_' + slug;
    var cached = localStorage.getItem(cacheKey);
    if (cached) {
      try {
        var artist = JSON.parse(cached);
        renderArtistProfile(artist);
      } catch (e) {
        console.warn("Erro ao ler perfil do artista do cache local:", e);
      }
    }

    try {
      var res = await fetch(getApiUrl('/artistas?slug=' + slug));
      if (!res.ok) throw new Error("Artista não encontrado");

      var artist = await res.json();
      var serialized = JSON.stringify(artist);
      localStorage.setItem(cacheKey, serialized);

      if (serialized !== cached) {
        renderArtistProfile(artist);
      }
    } catch (err) {
      console.error("Erro ao carregar perfil do artista:", err);
      if (!cached) {
        nameEl.textContent = 'Erro ao carregar informações';
      }
    }
  }

  // Slider navigation logic
  function setupSliderLogic(totalSlides) {
    var track = document.getElementById('gallery-track');
    var btnPrev = document.getElementById('prev-slide');
    var btnNext = document.getElementById('next-slide');
    if (!track || !btnPrev || !btnNext) return;

    var index = 0;
    var slideWidth = 320 + 24; // Slide width + gap

    function update() {
      track.style.transform = `translateX(-${index * slideWidth}px)`;
      btnPrev.disabled = index === 0;
      
      var visibleWidth = track.parentElement.clientWidth;
      var maxIndex = Math.max(0, totalSlides - Math.floor(visibleWidth / slideWidth));
      btnNext.disabled = index >= maxIndex;
    }

    // Limpar event listeners antigos recriando os botões caso necessário
    var newBtnPrev = btnPrev.cloneNode(true);
    var newBtnNext = btnNext.cloneNode(true);
    btnPrev.parentNode.replaceChild(newBtnPrev, btnPrev);
    btnNext.parentNode.replaceChild(newBtnNext, btnNext);

    newBtnPrev.addEventListener('click', function() {
      if (index > 0) {
        index--;
        update();
      }
    });

    newBtnNext.addEventListener('click', function() {
      var visibleWidth = track.parentElement.clientWidth;
      var maxIndex = Math.max(0, totalSlides - Math.floor(visibleWidth / slideWidth));
      if (index < maxIndex) {
        index++;
        update();
      }
    });

    window.removeEventListener('resize', update);
    window.addEventListener('resize', update);
    setTimeout(update, 300);
  }

  /* ── 7. Carregar Conteúdo Dinâmico das Páginas (CMS) ────── */
  function renderDynamicPageContent(container, page, pageSlug) {
    if (page.title && pageSlug !== 'home') {
      document.title = page.title + ' — Quinto Continente | Agência de Artistas';
    }
    
    var metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc && page.description) {
      metaDesc.setAttribute('content', page.description);
    }

    // Injetar Hero da Home dinamicamente se existir (ordem 0)
    var heroSection = page.sections.find(function(s) { return s.order === 0; });
    if (heroSection && pageSlug === 'home') {
      var heroTitleEl = document.querySelector('.hero h1');
      var heroSubEl = document.querySelector('.hero .hero-sub');
      var heroBgEl = document.querySelector('.hero .hero-bg');
      var heroCtaMain = document.querySelector('.hero .hero-actions .btn-main');
      var heroCtaSec = document.querySelector('.hero .hero-actions .btn-outline');

      if (heroTitleEl && heroSection.title) {
        heroTitleEl.innerHTML = heroSection.title;
      }
      if (heroSubEl && heroSection.subtitle) {
        heroSubEl.innerHTML = heroSection.subtitle;
      }
      if (heroBgEl && heroSection.imageUrl) {
        heroBgEl.style.backgroundImage = `linear-gradient(180deg, rgba(10, 10, 10, 0.6) 0%, rgba(10, 10, 10, 0.8) 100%), url('${heroSection.imageUrl}')`;
        heroBgEl.style.backgroundSize = 'cover';
        heroBgEl.style.backgroundPosition = 'center center';
        heroBgEl.style.backgroundRepeat = 'no-repeat';
      }
      if (heroCtaMain && heroCtaSec && heroSection.content) {
        var ctaParts = heroSection.content.split('|');
        if (ctaParts[0]) {
          var svgIcon = heroCtaMain.querySelector('svg');
          heroCtaMain.textContent = ctaParts[0].trim() + ' ';
          if (svgIcon) heroCtaMain.appendChild(svgIcon);
        }
        if (ctaParts[1]) {
          heroCtaSec.textContent = ctaParts[1].trim();
        }
      }
    }

    var html = '';
    var contentSections = page.sections.filter(function (sec) {
      return pageSlug !== 'home' || sec.order !== 0;
    });
    contentSections.forEach(function (sec, idx) {
      if (sec.bgType === 'GRID') {
        var cardData = [];
        try {
          cardData = JSON.parse(sec.content);
        } catch (e) {
          console.warn("Erro ao fazer parse dos cards de serviços:", e);
        }

        // Default icons (SVG inline) — used as fallback if card.icon is empty
        var defaultIcons = [
          `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M9 12l2 2 4-4"/></svg>`,
          `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="16" rx="2"/><path d="M8 4V2M16 4V2M3 9h18"/></svg>`,
          `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3L2 21h20L12 3z"/><path d="M12 9v5M12 17h.01"/></svg>`,
          `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 8v4l3 3"/></svg>`
        ];

        var cardsHtml = '';
        cardData.forEach(function (card, cIdx) {
          var iconContent = '';
          if (card.icon) {
            // If icon is an emoji or short text, display directly
            if (card.icon.length <= 4) {
              iconContent = `<span style="font-size:1.6rem;line-height:1;">${card.icon}</span>`;
            } else {
              // treat as SVG markup
              iconContent = card.icon;
            }
          } else {
            iconContent = defaultIcons[cIdx % defaultIcons.length];
          }

          cardsHtml += `
            <div class="svc-card reveal vis" style="opacity:1;transform:translate(0);">
              <div class="svc-icon-wrap">${iconContent}</div>
              <div>
                <h3 class="svc-title">${card.title}</h3>
              </div>
              <p class="svc-desc">${card.desc}</p>
            </div>
          `;
        });

        var ctaHtml = '';
        if (sec.imageUrl && sec.videoUrl) {
          ctaHtml = `
            <div style="text-align:center;margin-top:3.5rem;">
              <a href="${sec.videoUrl}" class="btn-main reveal vis" style="opacity:1;transform:translate(0);">
                ${sec.imageUrl}
                <svg class="arr" width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
              </a>
            </div>
          `;
        }

        html += `
          <section class="servicos section-dark" id="servicos" style="padding:7rem max(var(--site-pad),calc((100% - var(--max-w))/2));">
            <div class="servicos-hd">
              <div>
                <div class="s-label reveal vis" style="opacity:1;transform:translate(0);">${sec.subtitle || 'O Que Fazemos'}</div>
                <h2 class="s-title reveal vis" style="opacity:1;transform:translate(0);">${sec.title || 'Seu parceiro estratégico em todas as etapas.'}</h2>
              </div>
              <p class="servicos-hd-note reveal vis" style="opacity:1;transform:translate(0);">Cada entrega é construída com precisão técnica e visão estratégica.</p>
            </div>
            <div class="svc-grid">
              ${cardsHtml}
            </div>
            ${ctaHtml}
          </section>
        `;
        return; // Pula para a próxima seção
      }

      var bgClass = sec.bgType === 'WHITE' ? 'section-white' : 'section-dark';
      var num = (idx + 1).toString().padStart(2, '0');
      var labelHtml = sec.subtitle ? `<div class="s-label">${num} / ${sec.subtitle}</div>` : `<div class="s-label">${num} / Seção</div>`;
      var titleHtml = sec.title ? `<h2 class="s-title" style="margin-bottom: 1.5rem;">${sec.title}</h2>` : '';
      
      var paragraphs = sec.content ? sec.content.split('\n').filter(Boolean) : [];
      var contentHtml = paragraphs.map(function(p) { 
        return `<p class="s-sub" style="font-size: 1.05rem; line-height: 1.8; margin-top: 1rem;">${p}</p>`; 
      }).join('');

      if (sec.imageUrl) {
        var imageHtml = `
          <div class="reveal vis" style="border-radius: var(--radius-lg); overflow: hidden; height: 350px; border: 1px solid ${sec.bgType === 'WHITE' ? 'var(--line-dark)' : 'var(--line)'};">
            <img src="${sec.imageUrl}" alt="${sec.title || 'Imagem'}" loading="lazy" decoding="async" style="width:100%; height:100%; object-fit:cover;">
          </div>
        `;

        var gridStyle = 'display: grid; grid-template-columns: 1fr 1fr; gap: 4rem; align-items: center;';
        var isEven = idx % 2 === 0;
        var col1 = isEven ? `<div>${labelHtml}${titleHtml}${contentHtml}</div>` : imageHtml;
        var col2 = isEven ? imageHtml : `<div>${labelHtml}${titleHtml}${contentHtml}</div>`;

        html += `
          <section class="${bgClass}" style="padding: 7rem max(var(--site-pad), calc((100% - var(--max-w)) / 2));">
            <div class="container" style="${gridStyle}">
              ${col1}
              ${col2}
            </div>
          </section>
        `;
      } else {
        html += `
          <section class="${bgClass}" style="padding: 7rem max(var(--site-pad), calc((100% - var(--max-w)) / 2)); text-align: center;">
            <div class="container" style="max-width: 800px; margin: 0 auto;">
              ${labelHtml}
              ${titleHtml}
              <div style="text-align: left; max-width: 700px; margin: 0 auto;">
                ${contentHtml}
              </div>
            </div>
          </section>
        `;
      }
    });

    container.innerHTML = html;
  }

  async function loadDynamicPageContent() {
    var container = document.getElementById('dynamic-sections');
    if (!container) return;

    var pageSlug = document.body.dataset.page || '';
    if (!pageSlug) {
      var path = window.location.pathname;
      if (path.indexOf('/sobre') !== -1) pageSlug = 'sobre';
      else if (path.indexOf('/o-que-fazemos') !== -1) pageSlug = 'o-que-fazemos';
      else if (path.indexOf('/contato') !== -1) pageSlug = 'contato';
      else pageSlug = 'home';
    }

    // Ler do Cache Local
    var cacheKey = 'qc_page_' + pageSlug;
    var cached = localStorage.getItem(cacheKey);
    if (cached) {
      try {
        var page = JSON.parse(cached);
        renderDynamicPageContent(container, page, pageSlug);
      } catch (e) {
        console.warn("Erro ao ler seções dinâmicas do cache local:", e);
      }
    }

    try {
      var res = await fetch(getApiUrl('/paginas?slug=' + pageSlug + '&active=true'));
      if (!res.ok) throw new Error();
      
      var page = await res.json();
      if (!page || !page.sections || page.sections.length === 0) return;

      var serialized = JSON.stringify(page);
      localStorage.setItem(cacheKey, serialized);

      if (serialized !== cached) {
        renderDynamicPageContent(container, page, pageSlug);
      }
    } catch (err) {
      console.warn("Erro ao buscar seções dinâmicas ou usando cache.", err);
    }
  }

  /* ── Boot Inicializador ──────────────────────────────────── */
  function boot() {
    loadDynamicBanners();
    loadMarqueeArtists();
    loadArtistsPage();
    loadGalleryPage();
    setupContactForm();
    loadArtistProfilePage();
    hookWhatsAppClicks();
    loadDynamicPageContent();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
