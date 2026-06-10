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
      return 'http://localhost:3000/api' + endpoint;
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
  async function loadDynamicBanners() {
    var slider = document.getElementById('bannerSlider');
    if (!slider) return;

    slider.dataset.dynamic = 'true';

    try {
      var res = await fetch(getApiUrl('/banners?active=true'));
      if (!res.ok) throw new Error();
      
      var banners = await res.json();
      if (!banners || banners.length === 0) throw new Error("Sem banners ativos");

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

      slidesHtml += `<div class="banner-progress" id="bannerProgress"></div>`;
      
      var dotsHtml = '';
      banners.forEach(function (_, idx) {
        var activeClass = idx === 0 ? 'active' : '';
        dotsHtml += `<div class="banner-dot ${activeClass}" data-slide="${idx}"></div>`;
      });

      var textLinkServicos = "o-que-fazemos/index.html";

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
    } catch (err) {
      console.warn("Usando banners estáticos de fallback.", err);
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
          <a href="artistas/artista.html?slug=${artist.slug}" class="artist-card" style="text-decoration:none;">
            <div class="artist-img">
              <img src="${artist.imageUrl}" alt="${artist.name}" style="width:100%; height:100%; object-fit:cover;">
            </div>
            <div class="artist-info">
              <h3 class="artist-name">${artist.name}</h3>
            </div>
          </a>
        `;
      });

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
          <a href="artista.html?slug=${artist.slug}" class="artist-card reveal vis" data-name="${artist.name}" style="text-decoration:none;">
            <div class="artist-img">
              <img src="${artist.imageUrl}" alt="${artist.name}" style="width:100%; height:100%; object-fit:cover;">
            </div>
            <div class="artist-info">
              <h3 class="artist-name">${artist.name}</h3>
            </div>
          </a>
        `;
      });

      grid.innerHTML = itemsHtml;

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
      renderGalleryTabs();
      renderGalleryGrid('Todos');
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
  async function loadArtistProfilePage() {
    var nameEl = document.getElementById('artist-name');
    if (!nameEl) return;

    var params = new URLSearchParams(window.location.search);
    var slug = params.get('slug');
    if (!slug) {
      nameEl.textContent = 'Artista não especificado';
      return;
    }

    try {
      var res = await fetch(getApiUrl('/artistas?slug=' + slug));
      if (!res.ok) throw new Error("Artista não encontrado");

      var artist = await res.json();
      
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
      var schemaScript = document.createElement('script');
      schemaScript.type = 'application/ld+json';
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
        if (socialSection && hasSocial) socialSection.style.display = 'block';
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
      }

      // Hook Dynamic CTA links
      var waCta = document.getElementById('dynamic-wa-cta');
      if (waCta) {
        var waText = encodeURIComponent(`Olá! Tenho interesse em contratar o show do artista ${artist.name} pela Quinto Continente. Gostaria de verificar disponibilidade de rota.`);
        waCta.href = `https://wa.me/5567992185103?text=${waText}`;
        waCta.addEventListener('click', function() {
          trackEvent('artist_contact_click', {
            artistName: artist.name,
            channel: 'WhatsApp'
          });
        });
      }

      var formCta = document.getElementById('dynamic-form-cta');
      if (formCta) {
        formCta.href = `../contato/index.html?artista=${encodeURIComponent(artist.name)}`;
        formCta.addEventListener('click', function() {
          trackEvent('artist_contact_click', {
            artistName: artist.name,
            channel: 'Form'
          });
        });
      }

    } catch (err) {
      console.error("Erro ao carregar perfil do artista:", err);
      nameEl.textContent = 'Erro ao carregar informações';
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

    btnPrev.addEventListener('click', function() {
      if (index > 0) {
        index--;
        update();
      }
    });

    btnNext.addEventListener('click', function() {
      var visibleWidth = track.parentElement.clientWidth;
      var maxIndex = Math.max(0, totalSlides - Math.floor(visibleWidth / slideWidth));
      if (index < maxIndex) {
        index++;
        update();
      }
    });

    window.addEventListener('resize', update);
    setTimeout(update, 300);
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
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
