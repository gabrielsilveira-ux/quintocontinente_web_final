/* ============================================================
   QUINTO CONTINENTE — banner.js
   Controle do banner rotativo
   ============================================================ */
(function () {
  'use strict';

  var INTERVAL = 6000; // ms entre transições automáticas

  var slider   = document.getElementById('bannerSlider');
  var slides   = slider ? slider.querySelectorAll('.banner-slide') : [];
  var dots     = slider ? slider.querySelectorAll('.banner-dot')   : [];
  var progress = document.getElementById('bannerProgress');
  var btnPrev  = document.getElementById('bannerPrev');
  var btnNext  = document.getElementById('bannerNext');

  if (!slides.length) return;

  var current = 0;
  var autoTimer;

  /* ── Navegar para slide ─────────────────────────────────── */
  function goTo(idx) {
    slides[current].classList.remove('active');
    if (dots[current]) dots[current].classList.remove('active');

    current = ((idx % slides.length) + slides.length) % slides.length;

    slides[current].classList.add('active');
    if (dots[current]) dots[current].classList.add('active');

    animateProgress();
  }

  /* ── Barra de progresso ─────────────────────────────────── */
  function animateProgress() {
    if (!progress) return;
    progress.style.transition = 'none';
    progress.style.width = '0%';
    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        progress.style.transition = 'width ' + INTERVAL + 'ms linear';
        progress.style.width = '100%';
      });
    });
  }

  /* ── Auto-play ──────────────────────────────────────────── */
  function startAuto() {
    clearInterval(autoTimer);
    autoTimer = setInterval(function () { goTo(current + 1); }, INTERVAL);
  }

  function stopAuto() { clearInterval(autoTimer); }

  /* ── Eventos: botões ────────────────────────────────────── */
  if (btnPrev) btnPrev.addEventListener('click', function () { goTo(current - 1); startAuto(); });
  if (btnNext) btnNext.addEventListener('click', function () { goTo(current + 1); startAuto(); });

  /* ── Eventos: dots ──────────────────────────────────────── */
  dots.forEach(function (dot) {
    dot.addEventListener('click', function () {
      goTo(parseInt(dot.dataset.slide, 10));
      startAuto();
    });
  });

  /* ── Eventos: swipe (touch) ─────────────────────────────── */
  var touchStartX = 0;
  slider.addEventListener('touchstart', function (e) {
    touchStartX = e.touches[0].clientX;
  }, { passive: true });
  slider.addEventListener('touchend', function (e) {
    var dx = e.changedTouches[0].clientX - touchStartX;
    if (Math.abs(dx) > 40) {
      goTo(dx < 0 ? current + 1 : current - 1);
      startAuto();
    }
  });

  /* ── Pausa ao hover ─────────────────────────────────────── */
  slider.addEventListener('mouseenter', stopAuto);
  slider.addEventListener('mouseleave', startAuto);

  /* ── Teclado ────────────────────────────────────────────── */
  document.addEventListener('keydown', function (e) {
    if (e.key === 'ArrowLeft')  { goTo(current - 1); startAuto(); }
    if (e.key === 'ArrowRight') { goTo(current + 1); startAuto(); }
  });

  /* ── Init ───────────────────────────────────────────────── */
  animateProgress();
  startAuto();
})();
