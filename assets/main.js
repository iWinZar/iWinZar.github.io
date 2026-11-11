/* Portfolio evanbonhoure.me : animations, menu mobile, démo jouable.
   Aucune dépendance. Les animations ne touchent qu'à transform et opacity. */
(function () {
  'use strict';
  var doc = document;
  var GAME = '/jeux/zombie/index.html'; // build HTML/JS du jeu de zombies

  function list(sel, root) { return Array.prototype.slice.call((root || doc).querySelectorAll(sel)); }
  function visible(el) { return el.getClientRects().length > 0; }

  /* ---------- 1. Apparitions et parallaxe lissée ---------- */
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)');
  var off = null;

  function motionOn() {
    if (off) { off(); off = null; }
    if (!window.IntersectionObserver || (reduce && reduce.matches)) return;
    var se = doc.scrollingElement || doc.documentElement;
    var canScroll = function () { return se.scrollHeight - se.clientHeight > 80; };

    // Apparitions : une seule fois, à l'entrée dans l'écran
    var waiting = list('.fa-in').filter(visible);
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        e.target.classList.remove('fa-wait');
        io.unobserve(e.target);
      });
    }, { rootMargin: '0px 0px -10% 0px', threshold: 0.06 });
    if (canScroll()) {
      var limit = window.innerHeight * 0.94;
      waiting.forEach(function (el) {
        if (el.getBoundingClientRect().top > limit) { el.classList.add('fa-wait'); io.observe(el); }
      });
    }

    // Parallaxe : la position suit le défilement avec un amorti
    var layers = list('[data-px]').filter(visible).map(function (el) {
      return { el: el, k: parseFloat(el.getAttribute('data-px')) || 0, at: 0 };
    });
    var cur = se.scrollTop, target = cur, raf = 0, on = false;
    function measure() {
      on = canScroll();
      var y = se.scrollTop, half = window.innerHeight / 2;
      layers.forEach(function (l) {
        l.el.style.transform = '';
        var r = l.el.getBoundingClientRect();
        l.at = Math.max(0, r.top + y + r.height / 2 - half);
      });
    }
    function paint() {
      for (var i = 0; i < layers.length; i++) {
        var l = layers[i];
        var d = on ? (cur - l.at) * l.k : 0;
        if (d > 140) d = 140; else if (d < -140) d = -140;
        l.el.style.transform = d ? 'translate3d(0,' + d.toFixed(2) + 'px,0)' : '';
      }
    }
    function tick() {
      raf = 0;
      var gap = target - cur;
      cur = Math.abs(gap) < 0.1 ? target : cur + gap * 0.09;
      paint();
      if (cur !== target) raf = window.requestAnimationFrame(tick);
    }
    function onScroll() { target = se.scrollTop; if (!raf) raf = window.requestAnimationFrame(tick); }
    function onResize() { measure(); cur = target = se.scrollTop; paint(); }
    measure(); paint();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onResize);
    var late = setTimeout(onResize, 1500);
    off = function () {
      io.disconnect();
      clearTimeout(late);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onResize);
      if (raf) window.cancelAnimationFrame(raf);
      list('.fa-wait').forEach(function (el) { el.classList.remove('fa-wait'); });
      list('[data-px]').forEach(function (el) { el.style.transform = ''; });
    };
  }

  /* ---------- 2. Menu mobile ---------- */
  function setMenu(btn, open) {
    var panel = doc.getElementById(btn.getAttribute('aria-controls'));
    if (!panel) return;
    panel.hidden = !open;
    btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    var p = btn.querySelector('path');
    if (p) p.setAttribute('d', p.getAttribute(open ? 'data-open' : 'data-closed'));
  }

  /* ---------- 3. Démo jouable (chargée au clic uniquement) ---------- */
  function demoParts(el) {
    var box = el.closest('.fa-demo');
    return box && {
      box: box,
      idle: box.querySelector('[data-demo-idle]'),
      frame: box.querySelector('[data-demo-frame]'),
      msg: box.querySelector('[data-demo-msg]'),
      btns: list('.fa-ico', box)
    };
  }
  function demoReset(d) {
    d.frame.innerHTML = '';
    d.frame.hidden = true; d.msg.hidden = true; d.idle.hidden = false;
    d.btns.forEach(function (b) { b.disabled = true; });
  }
  function demoPlay(d) {
    var label = d.box.closest('[class*="fa-win"]');
    function show(ok) {
      d.idle.hidden = true;
      d.btns.forEach(function (b) { b.disabled = false; });
      if (!ok) { d.msg.hidden = false; return; }
      var f = doc.createElement('iframe');
      f.src = GAME; f.title = (d.box.querySelector('.fa-demo-bar span') || {}).textContent || 'Demo';
      f.setAttribute('allow', 'fullscreen; autoplay; gamepad');
      d.frame.appendChild(f); d.frame.hidden = false; f.focus();
    }
    // Le jeu n'est chargé que s'il est publié sur le site
    fetch(GAME, { method: 'HEAD', cache: 'no-store' })
      .then(function (r) { show(r.ok); })
      .catch(function () { show(false); });
    void label;
  }

  doc.addEventListener('click', function (e) {
    var t = e.target.closest && e.target.closest('[data-demo],[data-menu-btn],[data-menu-panel] a');
    if (!t) return;
    if (t.hasAttribute('data-menu-btn')) { setMenu(t, t.getAttribute('aria-expanded') !== 'true'); return; }
    if (t.closest('[data-menu-panel]')) {
      var b = t.closest('nav').querySelector('[data-menu-btn]'); if (b) setMenu(b, false); return;
    }
    var d = demoParts(t); if (!d) return;
    var act = t.getAttribute('data-demo');
    if (act === 'play') demoPlay(d);
    else if (act === 'stop') demoReset(d);
    else if (act === 'restart') {
      var f = d.frame.querySelector('iframe'); if (f) f.src = f.src;
    } else if (act === 'full') {
      var tgt = d.frame.querySelector('iframe') || d.frame;
      if (tgt.requestFullscreen) tgt.requestFullscreen();
    }
  });
  doc.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape') return;
    list('[data-menu-btn][aria-expanded="true"]').forEach(function (b) { setMenu(b, false); b.focus(); });
  });

  /* ---------- Démarrage ---------- */
  var mq = window.matchMedia ? window.matchMedia('(max-width: 760px)') : null;
  function start() { setTimeout(motionOn, 80); }
  if (mq && mq.addEventListener) mq.addEventListener('change', function () {
    list('[data-menu-btn]').forEach(function (b) { setMenu(b, false); });
    setTimeout(motionOn, 60);
  });
  if (reduce && reduce.addEventListener) reduce.addEventListener('change', motionOn);
  if (doc.readyState === 'complete') start(); else window.addEventListener('load', start);
})();
