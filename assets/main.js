/* Portfolio evanbonhoure.me : animations, navigation, menu mobile, démo jouable.
   Aucune dépendance. Les animations ne touchent qu'à transform, opacity, rotate et scale. */
(function () {
  'use strict';
  var doc = document;
  var GAME = '/jeux/zombie/index.html'; // build HTML/JS du jeu de zombies

  function list(sel, root) { return Array.prototype.slice.call((root || doc).querySelectorAll(sel)); }
  function visible(el) { return el.getClientRects().length > 0; }

  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)');
  var fine = window.matchMedia && window.matchMedia('(hover: hover) and (pointer: fine)');
  var mq = window.matchMedia ? window.matchMedia('(max-width: 760px)') : null;
  var canAnimate = !!(window.Element && Element.prototype.animate);
  function still() { return !!(reduce && reduce.matches); }

  // Défilement vers un élément, calculé sans ses transformations : une carte qui attend encore
  // son apparition est décalée de 80 px, et un défilement natif s'arrêterait trop bas.
  function pageY(node) {
    var y = 0;
    for (var e = node; e; e = e.offsetParent) y += e.offsetTop;
    return y;
  }
  function jump(node, block) {
    var y = pageY(node);
    var top = block === 'center'
      ? y - Math.max(0, (window.innerHeight - node.offsetHeight) / 2)
      : y - (parseFloat(window.getComputedStyle(node).scrollMarginTop) || 0);
    window.scrollTo({ top: Math.max(0, top), behavior: still() ? 'auto' : 'smooth' });
  }

  // Bulles libres : elles naissent dans un calque fixe au-dessus de la page et montent en s'effaçant.
  // Servent à la traversée de la surface, au sillage du pointeur ou du doigt sous l'eau, à la remontée.
  var fxBox = null, fxCount = 0;
  function bubble(x, y, size, rise, dur, delay) {
    if (!canAnimate || still() || fxCount > 70) return;
    if (!fxBox) {
      fxBox = doc.createElement('div');
      fxBox.className = 'fa-fx'; fxBox.setAttribute('aria-hidden', 'true');
      doc.body.appendChild(fxBox);
    }
    var b = doc.createElement('i'), dx = (Math.random() - 0.5) * 56;
    b.style.width = b.style.height = size.toFixed(1) + 'px';
    b.style.left = (x - size / 2).toFixed(1) + 'px'; b.style.top = (y - size / 2).toFixed(1) + 'px';
    fxBox.appendChild(b); fxCount++;
    var an = b.animate([
      { transform: 'translate3d(0,0,0) scale(.4)', opacity: 0 },
      { transform: 'translate3d(' + (dx * 0.3).toFixed(1) + 'px,' + (-rise * 0.22).toFixed(1) + 'px,0) scale(1)', opacity: 0.85, offset: 0.2 },
      { transform: 'translate3d(' + dx.toFixed(1) + 'px,' + (-rise).toFixed(1) + 'px,0) scale(1.06)', opacity: 0 }
    ], { duration: dur, delay: delay || 0, easing: 'cubic-bezier(.3,.2,.5,1)', fill: 'both' });
    an.onfinish = an.oncancel = function () { fxCount--; if (b.parentNode) b.parentNode.removeChild(b); };
  }
  // Gerbe de bulles sur toute la largeur, à partir d'une hauteur d'écran donnée
  function splash(n, y) {
    for (var i = 0; i < n; i++) {
      bubble(Math.random() * window.innerWidth, y + Math.random() * 150 - 30, 6 + Math.random() * 22,
        170 + Math.random() * 260, 1100 + Math.random() * 1200, Math.random() * 380);
    }
  }
  // Surface de l'eau de la mise en page affichée (le bloc qui contient les vagues)
  function waterOf() {
    var h = list('.fa-heave').filter(visible)[0];
    return h ? h.parentNode : null;
  }

  /* ---------- 0. Démarrage : l'animation est en CSS, ici on gère « Passer » et la fin ---------- */
  var html = doc.documentElement, bootWait = [];
  var booting = html.classList.contains('fa-booting');
  function afterBoot(fn) { if (booting) bootWait.push(fn); else fn(); }
  (function () {
    var boot = doc.querySelector('.fa-boot');
    if (!booting || !boot) { booting = false; return; }
    var safety = 0;
    function done() {
      if (!booting) return;
      booting = false;
      clearTimeout(safety);
      html.classList.add('fa-booted');
      doc.removeEventListener('keydown', skip);
      bootWait.splice(0).forEach(function (fn) { fn(); });
    }
    function skip() {
      if (!booting || html.classList.contains('fa-boot-out')) return;
      // Temps écoulé depuis l'allumage : les apparitions du haut de page partent juste après
      var a = boot.getAnimations ? boot.getAnimations()[0] : null;
      var t = a && typeof a.currentTime === 'number' ? a.currentTime / 1000 : 0;
      if (t > 5.25) return;
      html.style.setProperty('--fa-b', (t + 0.15).toFixed(2) + 's');
      html.classList.add('fa-boot-out');
    }
    boot.addEventListener('animationend', function (e) { if (e.target === boot) done(); });
    boot.addEventListener('click', skip);
    doc.addEventListener('keydown', skip);
    safety = setTimeout(done, 9000);
  })();

  // Ordre de montage des schémas : nœuds, zones et fils apparaissent un par un (--fa-i)
  list('figure').forEach(function (fig) {
    list('.fa-node,.fa-zone,.fa-wire', fig).forEach(function (el, i) { el.style.setProperty('--fa-i', i); });
  });

  /* ---------- Ciel selon l'heure (data-sky sur <html>, posé d'abord par le script du <head>) ---------- */
  function skyAuto() { var h = new Date().getHours(); return h < 6 || h >= 21 ? 'night' : (h < 8 || h >= 18) ? 'dusk' : 'day'; }
  function setSky(v) {
    html.setAttribute('data-sky', v);
    window.dispatchEvent(new Event('scroll')); // la nav se recale (verre sombre la nuit)
  }

  /* ---------- Surface de l'eau : ondes au clic ou au passage du pointeur ---------- */
  function onWater(y) {
    var w = waterOf();
    if (!w) return false;
    var t = w.getBoundingClientRect().top;
    return y > t + 8 && y < t + 150;
  }
  function ripple(x, y, big) {
    if (!canAnimate || still()) return;
    var root = list('.fa-noblur').filter(visible)[0];
    if (!root) return;
    if (!root.faRip) {
      root.faRip = doc.createElement('div');
      root.faRip.className = 'fa-rip'; root.faRip.setAttribute('aria-hidden', 'true');
      root.appendChild(root.faRip);
    }
    var box = root.faRip, rect = root.getBoundingClientRect(), px = x - rect.left, py = y - rect.top;
    function gone(an, el) { an.onfinish = an.oncancel = function () { if (el.parentNode) el.parentNode.removeChild(el); }; }
    // Anneaux aplatis : l'onde est vue de biais, comme posée sur l'eau
    for (var i = 0; i < (big ? 3 : 1); i++) {
      var ring = doc.createElement('i'), w = (big ? 250 : 90) * (1 - i * 0.22), h = w * 0.3;
      ring.style.width = w.toFixed(0) + 'px'; ring.style.height = h.toFixed(0) + 'px';
      ring.style.left = (px - w / 2).toFixed(1) + 'px'; ring.style.top = (py - h / 2).toFixed(1) + 'px';
      box.appendChild(ring);
      gone(ring.animate([{ transform: 'scale(.12)', opacity: 0 }, { opacity: 0.9, offset: 0.16 }, { transform: 'scale(1)', opacity: 0 }],
        { duration: big ? 1500 : 1000, delay: i * 170, easing: 'cubic-bezier(.2,.7,.3,1)', fill: 'both' }), ring);
    }
    if (!big) return;
    // Gouttes : elles sautent puis retombent
    for (var k = 0; k < 6; k++) {
      var drop = doc.createElement('b'), sz = 4 + Math.random() * 5;
      var dx = (Math.random() - 0.5) * 170, up = 40 + Math.random() * 80;
      drop.style.width = drop.style.height = sz.toFixed(1) + 'px';
      drop.style.left = (px - sz / 2).toFixed(1) + 'px'; drop.style.top = (py - sz / 2).toFixed(1) + 'px';
      box.appendChild(drop);
      gone(drop.animate([
        { transform: 'translate3d(0,0,0)', opacity: 1, easing: 'cubic-bezier(.2,.7,.4,1)' },
        { transform: 'translate3d(' + (dx * 0.55).toFixed(1) + 'px,' + (-up).toFixed(1) + 'px,0)', opacity: 1, easing: 'cubic-bezier(.6,0,.9,.5)' },
        { transform: 'translate3d(' + dx.toFixed(1) + 'px,10px,0)', opacity: 0 }
      ], { duration: 700 + Math.random() * 350, fill: 'both' }), drop);
    }
  }

  // Grands titres de section : chaque lettre se redresse à l'apparition (.fa-ch)
  list('section > .fa-in > h2').forEach(function (h) {
    var text = h.textContent;
    if (!text || h.children.length) return;
    h.setAttribute('aria-label', text);
    h.textContent = '';
    h.style.perspective = '600px';
    text.split('').forEach(function (c, i) {
      var sp = doc.createElement('span');
      sp.className = 'fa-ch'; sp.setAttribute('aria-hidden', 'true');
      sp.style.setProperty('--fa-i', i);
      sp.textContent = c === ' ' ? '\u00a0' : c;
      h.appendChild(sp);
    });
  });

  /* ---------- 1. Apparitions, parallaxe lissée, décor mis en pause hors écran ---------- */
  var off = null;

  function motionOn() {
    if (off) { off(); off = null; }
    if (!window.IntersectionObserver || still()) return;
    var se = doc.scrollingElement || doc.documentElement;
    var canScroll = function () { return se.scrollHeight - se.clientHeight > 80; };

    // Paquets des schémas : mesurés avant que les cartes ne soient mises en attente
    var flowsOff = flowsOn();

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

    // Décor : les boucles (nuages, bulles, vagues, algues) ne tournent que près de l'écran
    var loops = list('.fa-drift,.fa-float,.fa-rise,.fa-wob,.fa-heave,.fa-shine,.fa-sway,.fa-swell,.fa-swell-b,.fa-swell-m,.fa-sun,.fa-snow').filter(visible);
    var pio = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { e.target.classList.toggle('fa-off', !e.isIntersecting); });
    }, { rootMargin: '260px 0px 260px 0px' });
    loops.forEach(function (el) { pio.observe(el); });

    // Parallaxe : la position suit le défilement avec un amorti
    var layers = list('[data-px]').filter(visible).map(function (el) {
      return { el: el, k: parseFloat(el.getAttribute('data-px')) || 0, at: 0 };
    });
    var cur = se.scrollTop, target = cur, raf = 0, on = false, last = 0;
    // Souris (bureau) : le décor suit aussi le pointeur, ce qui donne de la profondeur
    var hover = !!(fine && fine.matches);
    var mx = 0, my = 0, tmx = 0, tmy = 0;
    // Sans souris, les cartes basculent selon leur place à l'écran : le relief vient du défilement
    var vh = window.innerHeight, tiltUndo = [];
    var tilts = hover ? [] : list('.fa-win').filter(visible).filter(function (c) { return !c.hasAttribute('data-term'); }).map(function (c) {
      var par = c.parentElement;
      if (!par.style.perspective) { par.style.perspective = '1100px'; tiltUndo.push(par); }
      return { el: c, mid: 0 };
    });
    // Vagues : chaque plan glisse un peu avec le pointeur (propriété translate, toujours vers la gauche)
    var waves = list('.fa-heave').filter(visible).map(function (el, i) { return { el: el, k: 1 + i * 0.8 }; });
    // Lampe : le fond s'assombrit avec la profondeur, un rond de lumière suit le pointeur
    var lamp = list('.fa-lamp').filter(visible)[0] || null;
    var deepTop = 1e9, deepSpan = 1;
    var lpx = window.innerWidth * 0.5, lpy = window.innerHeight * 0.45, lx = lpx, ly = lpy;
    function measure() {
      on = canScroll();
      vh = window.innerHeight;
      var wEl = waterOf();
      if (wEl) {
        deepTop = pageY(wEl) + wEl.offsetHeight;
        deepSpan = Math.max(240, se.scrollHeight - vh - deepTop);
      }
      if (!hover) { lpx = lx = window.innerWidth * 0.5; lpy = ly = vh * 0.45; }
      tilts.forEach(function (c) { c.mid = pageY(c.el) + c.el.offsetHeight / 2; });
      var y = se.scrollTop, half = window.innerHeight / 2;
      layers.forEach(function (l) {
        l.el.style.transform = '';
        var r = l.el.getBoundingClientRect();
        l.at = Math.max(0, r.top + y + r.height / 2 - half);
        l.wide = r.width > window.innerWidth * 0.8; // montagnes, collines : pas de décalage horizontal
      });
    }
    function paint() {
      for (var i = 0; i < layers.length; i++) {
        var l = layers[i];
        var d = on ? (cur - l.at) * l.k : 0;
        if (d > 140) d = 140; else if (d < -140) d = -140;
        var x = l.wide ? 0 : mx * l.k * 160, y = d + my * l.k * 70;
        l.el.style.transform = (x || y) ? 'translate3d(' + x.toFixed(2) + 'px,' + y.toFixed(2) + 'px,0)' : '';
      }
      for (var j = 0; j < tilts.length; j++) {
        var c = tilts[j], rel = (c.mid - (cur + vh / 2)) / vh;
        if (rel > 1.3 || rel < -1.3) continue;
        var a = Math.max(-7, Math.min(7, rel * 9));
        c.el.style.rotate = Math.abs(a) < 0.05 ? '' : 'x ' + a.toFixed(2) + 'deg';
      }
      for (var w = 0; w < waves.length; w++) {
        waves[w].el.style.translate = ((mx - 1) * waves[w].k * 22).toFixed(1) + 'px 0px';
      }
      if (lamp) {
        var depth = Math.max(0, Math.min(1, (cur - deepTop) / deepSpan));
        var dark = Math.pow(depth, 1.25) * 0.9;
        lamp.style.opacity = dark.toFixed(3);
        if (dark > 0) lamp.style.transform = 'translate3d(' + lx.toFixed(1) + 'px,' + ly.toFixed(1) + 'px,0)';
      }
    }
    function tick(now) {
      raf = 0;
      // Amorti calculé sur le temps écoulé : même rendu à 60, 120 ou 144 Hz
      var dt = last ? Math.min(64, now - last) : 16.7;
      last = now;
      var ks = 1 - Math.pow(0.91, dt / 16.7), km = 1 - Math.pow(0.94, dt / 16.7);
      var gap = target - cur;
      cur = Math.abs(gap) < 0.1 ? target : cur + gap * ks;
      var gx = tmx - mx, gy = tmy - my;
      mx = Math.abs(gx) < 0.001 ? tmx : mx + gx * km;
      my = Math.abs(gy) < 0.001 ? tmy : my + gy * km;
      var kl = Math.min(1, km * 3), ex = lpx - lx, ey = lpy - ly;
      lx = Math.abs(ex) < 0.3 ? lpx : lx + ex * kl;
      ly = Math.abs(ey) < 0.3 ? lpy : ly + ey * kl;
      paint();
      if (cur !== target || mx !== tmx || my !== tmy || lx !== lpx || ly !== lpy) raf = window.requestAnimationFrame(tick);
      else last = 0;
    }
    function wake() { if (!raf) raf = window.requestAnimationFrame(tick); }
    // Surface de l'eau : une gerbe de bulles quand elle traverse le milieu de l'écran
    var water = waterOf(), wPrev = null, wLast = 0;
    function waterY() { return water ? water.getBoundingClientRect().top + 76 : 1e9; }
    function checkWater() {
      if (!water) return;
      var y = waterY(), line = window.innerHeight * 0.5, now = Date.now();
      if (wPrev !== null && (wPrev - line) * (y - line) < 0 && now - wLast > 1300) {
        wLast = now;
        splash(y < line ? 22 : 12, line);
      }
      wPrev = y;
    }
    // Sillage : sous l'eau, le pointeur ou le doigt laisse des bulles dans les zones libres
    var tx = 0, ty = 0, rx = -999;
    function trail(x, y, t) {
      if (y < waterY() + 30) return;
      if (t && t.closest && t.closest('.fa-win,a,button,nav')) return;
      if (Math.abs(x - tx) + Math.abs(y - ty) < 46) return;
      tx = x; ty = y;
      bubble(x + (Math.random() - 0.5) * 16, y + (Math.random() - 0.5) * 16, 4 + Math.random() * 10,
        70 + Math.random() * 120, 900 + Math.random() * 800);
    }
    function onScroll() { target = se.scrollTop; checkWater(); wake(); }
    function onResize() { measure(); cur = target = se.scrollTop; paint(); }
    function onPointer(e) {
      if (e.pointerType !== 'mouse') return;
      tmx = e.clientX / window.innerWidth * 2 - 1;
      tmy = e.clientY / window.innerHeight * 2 - 1;
      lpx = e.clientX; lpy = e.clientY;
      trail(e.clientX, e.clientY, e.target);
      // Passage sur les vagues : une petite onde tous les 70 px
      if (water && Math.abs(e.clientX - rx) > 70) {
        var wt = water.getBoundingClientRect().top;
        if (e.clientY > wt + 8 && e.clientY < wt + 150) { rx = e.clientX; ripple(e.clientX, e.clientY, false); }
      }
      wake();
    }
    function onTouch(e) {
      var t = e.touches && e.touches[0];
      if (t) trail(t.clientX, t.clientY, e.target);
    }
    // Gyroscope (téléphone) : le décor glisse quand on incline l'appareil, à partir de sa tenue de départ
    var g0 = null, b0 = null;
    function onTilt(e) {
      if (e.gamma === null || e.beta === null) return;
      if (g0 === null) { g0 = e.gamma; b0 = e.beta; }
      g0 += (e.gamma - g0) * 0.01; b0 += (e.beta - b0) * 0.01; // recentrage lent
      tmx = Math.max(-1, Math.min(1, (e.gamma - g0) / 22));
      tmy = Math.max(-1, Math.min(1, (e.beta - b0) / 22));
      wake();
    }
    measure(); paint();
    wPrev = waterY();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onResize);
    if (hover) window.addEventListener('pointermove', onPointer, { passive: true });
    else {
      window.addEventListener('touchmove', onTouch, { passive: true });
      window.addEventListener('deviceorientation', onTilt);
    }
    var late = setTimeout(onResize, 1500);
    var depthOff = hover ? depthOn() : null;
    off = function () {
      io.disconnect(); pio.disconnect();
      clearTimeout(late);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onResize);
      window.removeEventListener('pointermove', onPointer);
      window.removeEventListener('touchmove', onTouch);
      window.removeEventListener('deviceorientation', onTilt);
      if (raf) window.cancelAnimationFrame(raf);
      tilts.forEach(function (c) { c.el.style.rotate = ''; });
      waves.forEach(function (v) { v.el.style.translate = ''; });
      if (lamp) { lamp.style.opacity = ''; lamp.style.transform = ''; }
      tiltUndo.forEach(function (par) { par.style.perspective = ''; });
      if (depthOff) depthOff();
      if (flowsOff) flowsOff();
      list('.fa-wait').forEach(function (el) { el.classList.remove('fa-wait'); });
      list('.fa-off').forEach(function (el) { el.classList.remove('fa-off'); });
      list('[data-px]').forEach(function (el) { el.style.transform = ''; });
    };
  }

  /* ---------- 1 bis. Relief 3D : cartes inclinées avec reflet, boutons en verre ---------- */
  // Souris uniquement. Tout passe par rotate / transform / opacity.
  function depthOn() {
    var undo = [];
    function on(el, type, fn) { el.addEventListener(type, fn); undo.push(function () { el.removeEventListener(type, fn); }); }

    // Cartes en verre : inclinaison vers le pointeur + reflet qui suit la souris
    list('.fa-win').filter(visible).forEach(function (card) {
      if (card.hasAttribute('data-term')) return; // le terminal reste à plat : on y lit et on y tape
      var glare = doc.createElement('span'), spot = doc.createElement('span');
      glare.className = 'fa-glare'; glare.setAttribute('aria-hidden', 'true');
      glare.appendChild(spot); card.appendChild(glare);
      card.classList.add('fa-tilt');
      var parent = card.parentElement;
      if (!parent.style.perspective) {
        parent.style.perspective = '1800px';
        undo.push(function () { parent.style.perspective = ''; });
      }
      var ev = null, raf = 0;
      function frame() {
        raf = 0;
        if (!ev) return;
        // Pas d'inclinaison pendant qu'un jeu tourne dans la carte
        if (card.querySelector('[data-demo-frame]:not([hidden])')) { card.style.rotate = ''; return; }
        var r = card.getBoundingClientRect();
        var px = (ev.clientX - r.left) / r.width - 0.5, py = (ev.clientY - r.top) / r.height - 0.5;
        var amp = Math.max(2.6, Math.min(6, 3000 / r.width));
        var ax = -py * 2 * amp, ay = px * 2 * amp, ang = Math.sqrt(ax * ax + ay * ay);
        card.style.rotate = ang > 0.01 ? ax.toFixed(3) + ' ' + ay.toFixed(3) + ' 0 ' + ang.toFixed(2) + 'deg' : '';
        spot.style.transform = 'translate3d(' + (ev.clientX - r.left).toFixed(1) + 'px,' + (ev.clientY - r.top).toFixed(1) + 'px,0)';
      }
      on(card, 'pointermove', function (e) {
        if (e.pointerType !== 'mouse') return;
        ev = e; if (!raf) raf = window.requestAnimationFrame(frame);
      });
      on(card, 'pointerleave', function () { ev = null; card.style.rotate = ''; });
      undo.push(function () {
        if (raf) window.cancelAnimationFrame(raf);
        card.style.rotate = ''; card.classList.remove('fa-tilt');
        if (glare.parentNode) glare.parentNode.removeChild(glare);
      });
    });

    // Boutons capsule : reflet sous le curseur et légère bascule 3D
    list('.fa-btn:not(.fa-btn-off)').filter(visible).forEach(function (btn) {
      on(btn, 'pointermove', function (e) {
        if (e.pointerType !== 'mouse') return;
        var r = btn.getBoundingClientRect(), x = e.clientX - r.left, y = e.clientY - r.top;
        btn.style.setProperty('--mx', x.toFixed(1) + 'px');
        btn.style.setProperty('--my', y.toFixed(1) + 'px');
        btn.style.setProperty('--rx', ((0.5 - y / r.height) * -14).toFixed(2) + 'deg');
        btn.style.setProperty('--ry', ((x / r.width - 0.5) * 14).toFixed(2) + 'deg');
      });
      on(btn, 'pointerleave', function () {
        btn.style.setProperty('--rx', '0deg'); btn.style.setProperty('--ry', '0deg');
      });
      undo.push(function () { ['--mx', '--my', '--rx', '--ry'].forEach(function (p) { btn.style.removeProperty(p); }); });
    });

    return function () { undo.forEach(function (f) { f(); }); };
  }

  /* ---------- 1 ter. Schémas vivants : des paquets circulent sur les fils ---------- */
  // Chaque fil porte data-pk="flux:étape:départ:arrivée" (positions en % du fil, plusieurs flux possibles).
  // Un flux est un trajet complet ; les flux d'un schéma se suivent dans une même boucle.
  function flowsOn() {
    if (!canAnimate) return null;
    var SPEED = 78; // pixels par seconde
    var anims = [], made = [], fio = null;

    // Position dans la page sans tenir compte des transformations en cours
    function box(el) {
      var x = 0, y = 0;
      for (var e = el; e; e = e.offsetParent) { x += e.offsetLeft; y += e.offsetTop; }
      return { x: x, y: y, w: el.offsetWidth, h: el.offsetHeight };
    }
    function inside(b, p, m) { return p.x >= b.x - m && p.x <= b.x + b.w + m && p.y >= b.y - m && p.y <= b.y + b.h + m; }

    list('figure').filter(visible).forEach(function (fig) {
      var flows = {};
      list('.fa-wire[data-pk]', fig).forEach(function (w) {
        w.getAttribute('data-pk').split(' ').forEach(function (tok) {
          var p = tok.split(':');
          if (p.length !== 4) return;
          (flows[p[0]] = flows[p[0]] || []).push({ id: p[0], w: w, step: +p[1], from: +p[2] / 100, to: +p[3] / 100 });
        });
      });
      var ids = Object.keys(flows).sort();
      if (!ids.length) return;
      var nodes = list('.fa-node', fig).map(function (el) { return { el: el, b: box(el) }; });
      var zones = list('.fa-zone', fig).map(function (el) { return { el: el.querySelector('.fa-node'), b: box(el) }; });
      // Nœud touché par un point du trajet (ou premier nœud de la zone touchée)
      function hit(p) {
        var i;
        for (i = 0; i < nodes.length; i++) if (inside(nodes[i].b, p, 5)) return nodes[i].el;
        for (i = 0; i < zones.length; i++) if (zones[i].el && inside(zones[i].b, p, 5)) return zones[i].el;
        return null;
      }

      var plan = [], pulses = [], t = 0.5;
      ids.forEach(function (id) {
        var end = null;
        flows[id].sort(function (a, b) { return a.step - b.step; }).forEach(function (s) {
          var b = box(s.w);
          s.v = s.w.classList.contains('fa-wire-v');
          function at(f) { return s.v ? { x: b.x + b.w / 2, y: b.y + b.h * f } : { x: b.x + b.w * f, y: b.y + b.h / 2 }; }
          var p0 = at(s.from), p1 = at(s.to);
          if (end) {
            // Traversée d'un nœud entre deux fils : le paquet disparaît le temps de le franchir
            var gap = Math.sqrt(Math.pow(p0.x - end.x, 2) + Math.pow(p0.y - end.y, 2));
            if (gap > 3) {
              var mid = hit({ x: (p0.x + end.x) / 2, y: (p0.y + end.y) / 2 });
              if (mid) pulses.push({ el: mid, t: t + gap / SPEED / 2 });
              t += gap / SPEED;
            }
          }
          var len = (s.v ? b.h : b.w) * Math.abs(s.to - s.from);
          s.t0 = t; t += Math.max(len / SPEED, 0.16); s.t1 = t;
          end = p1;
          plan.push(s);
        });
        var dest = end && hit(end);
        if (dest) pulses.push({ el: dest, t: t + 0.04 });
        t += 1; // pause avant le flux suivant
      });
      var total = t, group = [];

      plan.forEach(function (s) {
        var pk = doc.createElement('span');
        pk.className = 'fa-pk' + (s.id === ids[0] ? '' : ' fa-pk-b');
        pk.setAttribute('aria-hidden', 'true');
        pk.appendChild(doc.createElement('i'));
        s.w.appendChild(pk); made.push(pk);
        var ax = s.v ? 'translateY(' : 'translateX(';
        var A = ax + (s.from * 100) + '%)', B = ax + (s.to * 100) + '%)';
        var o0 = s.t0 / total, o1 = s.t1 / total, e = Math.min(0.1 / total, (o1 - o0) / 3);
        group.push(pk.animate([
          { offset: 0, transform: A, opacity: 0 },
          { offset: o0, transform: A, opacity: 0 },
          { offset: o0 + e, opacity: 1 },
          { offset: o1 - e, opacity: 1 },
          { offset: o1, transform: B, opacity: 0 },
          { offset: 1, transform: B, opacity: 0 }
        ], { duration: total * 1000, iterations: Infinity }));
      });

      // Le nœud qui reçoit un paquet réagit d'une légère pulsation (propriété scale)
      var seen = [];
      pulses.sort(function (a, b) { return a.t - b.t; }).forEach(function (p) {
        var i = seen.indexOf(p.el);
        if (i < 0) { seen.push(p.el); p.el.faPulse = []; }
        p.el.faPulse.push(p.t);
      });
      seen.forEach(function (el) {
        var kf = [{ offset: 0, scale: '1' }], lastO = 0, d = 0.2 / total;
        el.faPulse.forEach(function (pt) {
          var o = pt / total;
          if (o - d <= lastO || o + 2 * d >= 1) return;
          kf.push({ offset: o - d, scale: '1', easing: 'cubic-bezier(.2,.8,.3,1)' });
          kf.push({ offset: o, scale: '1.055', easing: 'cubic-bezier(.4,0,.2,1)' });
          kf.push({ offset: o + 2 * d, scale: '1' });
          lastO = o + 2 * d;
        });
        kf.push({ offset: 1, scale: '1' });
        delete el.faPulse;
        if (kf.length > 2) group.push(el.animate(kf, { duration: total * 1000, iterations: Infinity }));
      });

      group.forEach(function (a) { a.pause(); });
      fig.faFlow = group;
      anims = anims.concat(group);
    });

    // Les schémas ne s'animent que lorsqu'ils sont à l'écran
    fio = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        (e.target.faFlow || []).forEach(function (a) { if (e.isIntersecting) a.play(); else a.pause(); });
      });
    }, { rootMargin: '80px 0px 80px 0px' });
    list('figure').forEach(function (fig) { if (fig.faFlow) fio.observe(fig); });

    return function () {
      fio.disconnect();
      anims.forEach(function (a) { a.cancel(); });
      made.forEach(function (el) { if (el.parentNode) el.parentNode.removeChild(el); });
      list('figure').forEach(function (fig) { delete fig.faFlow; });
    };
  }

  /* ---------- 1 quater. Bulles : elles éclatent au clic, puis se reforment ---------- */
  function pop(b) {
    b.faPop = true;
    var size = b.offsetWidth, host = b.parentNode, n = size > 60 ? 9 : size > 24 ? 7 : 5;
    var out = b.animate([{ transform: 'scale(1)', opacity: 1 }, { transform: 'scale(1.35)', opacity: 0 }],
      { duration: 180, easing: 'cubic-bezier(.2,.8,.3,1)', fill: 'forwards' });
    for (var i = 0; i < n; i++) (function (i) {
      var d = doc.createElement('span'), s = Math.max(4, size * (0.09 + Math.random() * 0.1));
      d.className = 'fa-drop'; d.setAttribute('aria-hidden', 'true');
      d.style.width = d.style.height = s.toFixed(1) + 'px';
      d.style.margin = (-s / 2).toFixed(1) + 'px 0 0 ' + (-s / 2).toFixed(1) + 'px';
      host.appendChild(d);
      var ang = (i / n) * Math.PI * 2 + Math.random() * 0.7, dist = size * (0.6 + Math.random() * 0.45) + 12;
      var an = d.animate([
        { transform: 'translate3d(0,0,0) scale(.5)', opacity: 0.95 },
        { transform: 'translate3d(' + (Math.cos(ang) * dist).toFixed(1) + 'px,' + (Math.sin(ang) * dist).toFixed(1) + 'px,0) scale(1)', opacity: 0 }
      ], { duration: 560 + Math.random() * 280, easing: 'cubic-bezier(.15,.7,.3,1)', fill: 'forwards' });
      an.onfinish = function () { if (d.parentNode) d.parentNode.removeChild(d); };
    })(i);
    setTimeout(function () {
      var back = b.animate([{ transform: 'scale(0)', opacity: 0 }, { transform: 'scale(1)', opacity: 1 }],
        { duration: 1100, easing: 'cubic-bezier(.2,1.3,.4,1)' });
      out.cancel();
      back.onfinish = function () { b.faPop = false; };
    }, 2400 + Math.random() * 1800);
  }
  function popAt(e) {
    if (still() || !canAnimate) return false;
    var hit = null;
    list('.fa-bub').forEach(function (b) {
      if (hit || b.faPop || !visible(b)) return;
      var r = b.getBoundingClientRect(), R = Math.max(r.width / 2, 16);
      var dx = e.clientX - (r.left + r.width / 2), dy = e.clientY - (r.top + r.height / 2);
      if (dx * dx + dy * dy > R * R) return;
      var rise = b.closest('.fa-rise');
      if (rise && parseFloat(window.getComputedStyle(rise).opacity) < 0.3) return;
      hit = b;
    });
    if (hit) pop(hit);
    return !!hit;
  }

  /* ---------- 2. Navigation : section en cours, pastille de verre, langue ---------- */
  var spyOff = null;

  function spyOn() {
    if (spyOff) { spyOff(); spyOff = null; }
    var se = doc.scrollingElement || doc.documentElement;
    var root = doc.querySelector(mq && mq.matches ? '.mob' : '.desk');
    if (!root) return;
    var items = [];
    list('.fa-nav-a[href^="#"],.fa-menu-a[href^="#"]', root).forEach(function (a) {
      var id = a.getAttribute('href').slice(1), sec = doc.getElementById(id);
      if (sec && sec.tagName === 'SECTION') items.push({ a: a, id: id, sec: sec });
    });
    if (!items.length) return;
    var langs = list('a.fa-seg-b:not(.fa-seg-on)', root);

    // Pastille de verre (barre du bureau) : elle glisse d'un lien à l'autre
    var pill = null, box = null, at = null;
    if (root.classList.contains('desk')) {
      box = items[0].a.parentNode;
      box.classList.add('fa-nav-links');
      pill = doc.createElement('span');
      pill.className = 'fa-nav-pill'; pill.setAttribute('aria-hidden', 'true');
      box.insertBefore(pill, box.firstChild);
    }
    function place(i, slide) {
      var a = items[i].a, to = { x: a.offsetLeft, y: a.offsetTop, w: a.offsetWidth, h: a.offsetHeight };
      var end = 'translate3d(' + to.x + 'px,' + to.y + 'px,0)';
      pill.style.transition = 'none';
      pill.style.width = to.w + 'px'; pill.style.height = to.h + 'px';
      if (slide && at) {
        // On part de l'ancienne place (et de l'ancienne largeur) puis on laisse la transition faire
        pill.style.transform = 'translate3d(' + at.x + 'px,' + at.y + 'px,0) scaleX(' + (at.w / to.w).toFixed(4) + ')';
        void pill.offsetWidth;
        pill.style.transition = '';
        pill.style.transform = end + ' scaleX(1)';
      } else {
        pill.style.transform = end + ' scaleX(1)';
        void pill.offsetWidth;
        pill.style.transition = '';
      }
      at = to;
    }

    var cur = -2;
    function show(i, force) {
      if (i === cur && !force) return;
      var was = cur; cur = i;
      items.forEach(function (it, k) {
        if (k === i) it.a.setAttribute('aria-current', 'true'); else it.a.removeAttribute('aria-current');
      });
      // Le changement de langue garde la section en cours
      langs.forEach(function (a) {
        a.setAttribute('href', a.getAttribute('href').split('#')[0] + (i >= 0 ? '#' + items[i].id : ''));
      });
      if (!pill) return;
      if (i < 0) { pill.classList.remove('fa-on'); return; }
      place(i, was >= 0 && !force);
      pill.classList.add('fa-on');
    }

    // Section en cours : la dernière dont le haut a passé 42 % de l'écran
    function compute() {
      var line = window.innerHeight * 0.42, best = -1, bestTop = 0, tops = [], i;
      for (i = 0; i < items.length; i++) {
        var top = items[i].sec.getBoundingClientRect().top;
        tops.push(top);
        if (top <= line && (best < 0 || top > bestTop + 1)) { best = i; bestTop = top; }
      }
      // Tout en bas, la dernière rangée de sections l'emporte même si elle n'a pas atteint la ligne
      if (se.scrollTop > 0 && se.scrollTop + window.innerHeight >= se.scrollHeight - 2) {
        var lastTop = tops[tops.length - 1];
        for (i = 0; i < tops.length; i++) if (tops[i] >= lastTop - 1) { best = i; break; }
      }
      return best;
    }

    // Un clic sur un lien de la nav l'emporte sur le calcul tant que la page n'a pas bougé d'elle-même
    // Sous la surface, la barre passe en verre sombre (.fa-deep)
    var navEl = root.querySelector('nav.fa-navskin'), waterEl = waterOf();
    function deep() {
      if (!navEl) return;
      var night = html.getAttribute('data-sky') === 'night';
      navEl.classList.toggle('fa-deep', night || (!!waterEl && waterEl.getBoundingClientRect().top + 96 < navEl.getBoundingClientRect().bottom));
    }
    var forced = -1, base = -1, settle = 0, raf = 0;
    function update() {
      raf = 0;
      deep();
      var c = compute();
      if (forced >= 0) {
        if (settle || c === base) { show(forced); return; }
        forced = -1;
      }
      show(c);
    }
    function done() {
      settle = 0;
      base = compute();
      if (forced >= 0) {
        var r = items[forced].sec.getBoundingClientRect();
        if (r.top > window.innerHeight || r.bottom < 0) forced = -1;
      }
      update();
    }
    function onScroll() {
      if (settle) { clearTimeout(settle); settle = setTimeout(done, 180); }
      if (!raf) raf = window.requestAnimationFrame(update);
    }
    function onResize() { cur = -2; update(); if (pill && cur >= 0) show(cur, true); }
    function onClick(e) {
      var a = e.target.closest && e.target.closest('a');
      if (!a) return;
      for (var i = 0; i < items.length; i++) if (items[i].a === a) {
        forced = i; show(i);
        clearTimeout(settle); settle = setTimeout(done, 1200);
        return;
      }
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onResize);
    root.addEventListener('click', onClick);
    update();
    if (doc.fonts && doc.fonts.ready) doc.fonts.ready.then(function () { if (pill && cur >= 0) show(cur, true); });

    spyOff = function () {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onResize);
      root.removeEventListener('click', onClick);
      clearTimeout(settle);
      if (raf) window.cancelAnimationFrame(raf);
      items.forEach(function (it) { it.a.removeAttribute('aria-current'); });
      if (navEl) navEl.classList.remove('fa-deep');
      if (pill) { box.removeChild(pill); box.classList.remove('fa-nav-links'); }
    };
  }

  /* ---------- 3. Menu mobile ---------- */
  function setMenu(btn, open) {
    var panel = doc.getElementById(btn.getAttribute('aria-controls'));
    if (!panel) return;
    panel.hidden = !open;
    btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    var p = btn.querySelector('path');
    if (p) p.setAttribute('d', p.getAttribute(open ? 'data-open' : 'data-closed'));
  }

  /* ---------- 4. Démo jouable (chargée au clic uniquement) ---------- */
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
  }

  doc.addEventListener('click', function (e) {
    var t = e.target.closest && e.target.closest('[data-demo],[data-demo-go],[data-menu-btn],[data-menu-panel] a');
    // Ancre vers une carte qui n'est pas encore apparue : on vise sa place finale
    // « Remonter à la surface » : une colonne de bulles accompagne la remontée
    if (e.target.closest && e.target.closest('[data-rise]') && !still()) {
      var n = 0, iv = setInterval(function () {
        splash(3, window.innerHeight * 0.75);
        if (++n > 12) clearInterval(iv);
      }, 90);
    }
    var link = !t && e.target.closest && e.target.closest('a[href^="#"]');
    var dest = link && doc.getElementById(link.getAttribute('href').slice(1));
    if (dest && dest.closest('.fa-wait')) {
      e.preventDefault();
      jump(dest);
      if (window.history && window.history.pushState) window.history.pushState(null, '', link.getAttribute('href'));
      return;
    }
    if (!t) {
      // Clic dans le décor : une bulle sous le pointeur éclate
      if (!(e.target.closest && e.target.closest('a,button,nav,.fa-win'))) {
        if (onWater(e.clientY)) ripple(e.clientX, e.clientY, true);
        popAt(e);
      }
      return;
    }
    if (t.hasAttribute('data-menu-btn')) { setMenu(t, t.getAttribute('aria-expanded') !== 'true'); return; }
    if (t.closest('[data-menu-panel]')) {
      var b = t.closest('nav').querySelector('[data-menu-btn]'); if (b) setMenu(b, false); return;
    }
    if (t.hasAttribute('data-demo-go')) {
      // Bouton placé à côté du lecteur : il le ramène à l'écran et lance la démo
      var card = t.closest('article'), play = card && card.querySelector('.fa-demo [data-demo="play"]');
      if (!play) return;
      var dd = demoParts(play);
      jump(dd.box, 'center');
      if (!dd.idle.hidden) demoPlay(dd);
      return;
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
  // Tactile : le reflet du bouton naît sous le doigt (au survol, c'est depthOn qui s'en charge)
  doc.addEventListener('pointerdown', function (e) {
    var b = e.pointerType !== 'mouse' && e.target.closest && e.target.closest('.fa-btn:not(.fa-btn-off)');
    if (!b) return;
    var r = b.getBoundingClientRect();
    b.style.setProperty('--mx', (e.clientX - r.left).toFixed(1) + 'px');
    b.style.setProperty('--my', (e.clientY - r.top).toFixed(1) + 'px');
  }, { passive: true });
  doc.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape') return;
    list('[data-menu-btn][aria-expanded="true"]').forEach(function (b) { setMenu(b, false); b.focus(); });
  });

  /* ---------- 5. Terminal en verre ---------- */
  // Les réponses sont lues dans la page (titres, descriptions, étiquettes, à propos, contact) :
  // un texte modifié dans le HTML l'est aussi dans le terminal, en français comme en anglais.
  function termOn() {
    var en = (html.lang || 'fr').toLowerCase().indexOf('en') === 0;
    var GAMES = en ? 'games' : 'jeux';
    var T = en ? {
      user: 'visitor',
      help: [['help', 'this help'], ['whoami', 'who I am'], ['ls [folder]', 'list labs/ and games/'], ['cat <project>', 'read a project sheet'],
        ['cd <project>', 'jump to its card on the page'], ['play', 'launch the zombie game'], ['contact', 'reach me'], ['theme <day|dusk|night>', 'change the time of the sky'], ['clear', 'clear the screen'], ['reboot', 'restart the site']],
      tip: 'Tab completes, ↑ recalls the previous command.',
      hint: 'Type help, or click a command below.',
      noFile: 'no such file or folder', isDir: 'is a folder', noDir: 'no such folder',
      usage: 'usage: cat <project>  (example: cat labs/network)',
      see: 'to see the card', playing: 'launching the demo…', noBuild: 'no web build yet', reboot: 'rebooting…',
      sudo: ' is not in the sudoers file. This incident will be reported.',
      unknown: ': command not found. Type help.',
      sky: { day: 'day', dusk: 'dusk', night: 'night' }, skyIs: 'sky: ', skyUse: 'usage: theme day | dusk | night | auto',
      keys: ['help', 'whoami', 'ls labs', 'cat labs/network', 'play', 'theme night', 'reboot']
    } : {
      user: 'visiteur',
      help: [['help', 'cette aide'], ['whoami', 'qui je suis'], ['ls [dossier]', 'lister labs/ et jeux/'], ['cat <projet>', 'lire la fiche d\'un projet'],
        ['cd <projet>', 'aller à sa carte dans la page'], ['play', 'lancer le jeu de zombies'], ['contact', 'me joindre'], ['theme <jour|soir|nuit>', 'changer l\'heure du ciel'], ['clear', 'effacer l\'écran'], ['reboot', 'redémarrer le site']],
      tip: 'Tab complète, ↑ rappelle la commande précédente.',
      hint: 'Tape help, ou clique une commande ci-dessous.',
      noFile: 'aucun fichier ou dossier de ce nom', isDir: 'est un dossier', noDir: 'aucun dossier de ce nom',
      usage: 'usage : cat <projet>  (exemple : cat labs/reseau)',
      see: 'pour voir la carte', playing: 'lancement de la démo…', noBuild: 'pas encore de build web', reboot: 'redémarrage…',
      sudo: ' n\'est pas dans le fichier sudoers. Cet incident sera signalé.',
      unknown: ' : commande introuvable. Tape help.',
      sky: { day: 'jour', dusk: 'soir', night: 'nuit' }, skyIs: 'ciel : ', skyUse: 'usage : theme jour | soir | nuit | auto',
      keys: ['help', 'whoami', 'ls labs', 'cat labs/reseau', 'play', 'theme nuit', 'reboot']
    };
    // Arborescence : un « fichier » par carte de la page
    var FILES = [
      { dir: 'labs', name: 'minecraft', alt: [], id: 'lab-minecraft' },
      { dir: 'labs', name: en ? 'network' : 'reseau', alt: ['network', 'reseau', 'réseau'], id: 'lab-reseau' },
      { dir: GAMES, name: 'zombie', alt: ['zombies'], id: 'demo', play: true },
      { dir: GAMES, name: 'rpg', alt: [], id: 'rpg' }
    ];
    var NAMES = ['help', 'whoami', 'ls', 'cat', 'cd', 'play', 'contact', 'theme', 'clear', 'reboot'];
    var PATHS = ['labs/', GAMES + '/'].concat(FILES.map(function (f) { return f.dir + '/' + f.name; }), [T.sky.day, T.sky.dusk, T.sky.night, 'auto']);
    var SKIES = { jour: 'day', day: 'day', soir: 'dusk', dusk: 'dusk', aube: 'dusk', dawn: 'dusk', nuit: 'night', night: 'night' };
    function clean(s) { return (s || '').replace(/\s+/g, ' ').trim(); }
    function norm(s) { return s.toLowerCase().replace(/^(\.\/|~\/|\/)+/, '').replace(/\/+$/, ''); }
    function dirOf(s) { return s === 'labs' ? 'labs' : (s === 'jeux' || s === 'games') ? GAMES : null; }
    function find(arg) {
      var parts = norm(arg).split('/'), name = parts[parts.length - 1], d = parts.length === 2 ? dirOf(parts[0]) : null;
      if (parts.length > 2 || (parts.length === 2 && !d)) return null;
      for (var i = 0; i < FILES.length; i++) {
        var f = FILES[i];
        if ((f.name === name || f.alt.indexOf(name) >= 0) && (!d || d === f.dir)) return f;
      }
      return null;
    }

    list('[data-term]').forEach(function (win) {
      var mob = !!win.closest('.mob'), p = mob ? 'm-' : '';
      var scr = win.querySelector('[data-term-scr]'), out = win.querySelector('[data-term-out]');
      var input = win.querySelector('[data-term-in]'), ps = win.querySelector('[data-term-ps]'), keys = win.querySelector('[data-term-keys]');
      if (!scr || !out || !input || !ps || !keys) return;
      var PS = (mob ? '' : T.user + '@evanbonhoure.me:') + '~$';
      var hist = [], hi = 0, typing = 0, started = false;

      function el(id) { return doc.getElementById(p + id); }
      function print(text, cls) {
        var d = doc.createElement('div');
        if (cls) d.className = cls;
        d.textContent = text;
        out.appendChild(d);
        while (out.childNodes.length > 160) out.removeChild(out.firstChild);
        scr.scrollTop = scr.scrollHeight;
        return d;
      }
      function go(node, block) { if (node) jump(node, block); }
      function card(f) {
        var a = el(f.id), h = a && a.querySelector('h3'), d = h && h.nextElementSibling;
        return a && {
          node: a, title: h ? clean(h.textContent) : f.name,
          desc: d && d.tagName === 'P' ? clean(d.textContent) : '',
          tags: list('.fa-tag', a).map(function (t) { return clean(t.textContent); })
        };
      }

      var C = {
        help: function () {
          var w = mob ? 14 : 18;
          T.help.forEach(function (h) { print(h[0] + new Array(Math.max(2, w - h[0].length + 1)).join(' ') + h[1]); });
          print(T.tip, 'fa-t-dim');
        },
        whoami: function () {
          var a = el('apropos'), t = a && a.querySelector('p');
          print(t ? clean(t.textContent) : T.user);
        },
        ls: function (arg) {
          var s = norm(arg), d = dirOf(s), f;
          if (!s || s === '~' || s === '.') print('labs/  ' + GAMES + '/', 'fa-t-hi');
          else if (d) print(FILES.filter(function (x) { return x.dir === d; }).map(function (x) { return x.name; }).join('  '), 'fa-t-hi');
          else if ((f = find(arg))) print(f.dir + '/' + f.name, 'fa-t-hi');
          else print('ls: ' + arg + ': ' + T.noFile, 'fa-t-err');
        },
        cat: function (arg) {
          if (!arg) { print(T.usage, 'fa-t-dim'); return; }
          if (dirOf(norm(arg))) { print('cat: ' + arg + ': ' + T.isDir, 'fa-t-err'); return; }
          var f = find(arg), c = f && card(f);
          if (!c) { print('cat: ' + arg + ': ' + T.noFile, 'fa-t-err'); return; }
          print(c.title, 'fa-t-hi');
          if (c.desc) print(c.desc);
          if (c.tags.length) print(c.tags.join(', '), 'fa-t-ok');
          print('cd ' + f.dir + '/' + f.name + '  ' + T.see, 'fa-t-dim');
        },
        cd: function (arg) {
          var s = norm(arg), d = dirOf(s), f, c;
          if (!s || s === '~') { go(el('haut')); return; }
          if (d) { go(el(d === 'labs' ? 'labs' : 'jeux')); return; }
          if ((f = find(arg)) && (c = card(f))) { print('→ ' + c.title, 'fa-t-dim'); go(c.node); return; }
          print('cd: ' + arg + ': ' + T.noDir, 'fa-t-err');
        },
        play: function (arg) {
          var f = arg ? find(arg) : FILES[2];
          if (!f) { print('play: ' + arg + ': ' + T.noFile, 'fa-t-err'); return; }
          if (!f.play) { print(f.name + ': ' + T.noBuild, 'fa-t-dim'); return; }
          var a = el(f.id), btn = a && a.querySelector('.fa-demo [data-demo="play"]'), d = btn && demoParts(btn);
          if (!d) return;
          print(T.playing, 'fa-t-ok');
          go(d.box, 'center');
          if (!d.idle.hidden) demoPlay(d);
        },
        contact: function () {
          list('a[href]', el('contact')).forEach(function (a) {
            var row = print('', ''), link = doc.createElement('a');
            link.href = a.href; link.textContent = a.href.replace(/^https?:\/\//, '').replace(/^mailto:/, '');
            row.appendChild(link);
          });
        },
        theme: function (arg) {
          var a = arg.toLowerCase(), v = a === 'auto' ? skyAuto() : SKIES[a];
          if (!v) { print(T.skyUse, 'fa-t-dim'); return; }
          setSky(v);
          print(T.skyIs + T.sky[v], 'fa-t-ok');
        },
        clear: function () { out.textContent = ''; },
        reboot: function () {
          print(T.reboot, 'fa-t-ok');
          setTimeout(function () {
            try { window.sessionStorage.removeItem('fa-boot'); } catch (e) {}
            window.scrollTo(0, 0);
            window.location.reload();
          }, 500);
        },
        sudo: function () { print(T.user + T.sudo, 'fa-t-err'); },
        pwd: function () { print('/home/' + T.user); },
        echo: function (arg, all) { print(all.join(' ')); }
      };
      C.aide = C.help; C.open = C.cd; C.dir = C.ls; C.cls = C.clear; C.sky = C.ciel = C.theme;

      function run(raw) {
        var cmd = clean(raw);
        print(PS + ' ' + cmd, 'fa-t-cmd');
        if (!cmd) return;
        if (hist[hist.length - 1] !== cmd) hist.push(cmd);
        hi = hist.length;
        var parts = cmd.split(' '), name = parts[0].toLowerCase();
        var all = parts.slice(1), args = all.filter(function (a) { return a.charAt(0) !== '-'; });
        if (name.indexOf('./') === 0) { args = [name]; name = 'play'; }
        if (Object.prototype.hasOwnProperty.call(C, name)) C[name](args[0] || '', all);
        else print(parts[0] + T.unknown, 'fa-t-err');
        scr.scrollTop = scr.scrollHeight;
      }

      // Tab : complète la commande, puis le chemin
      function complete() {
        var v = input.value, sp = v.lastIndexOf(' ');
        var head = v.slice(0, sp + 1), tail = v.slice(sp + 1).toLowerCase();
        var m = (sp < 0 ? NAMES : PATHS).filter(function (x) { return x.indexOf(tail) === 0; });
        if (!m.length) return;
        var pre = m[0];
        m.forEach(function (x) { while (x.indexOf(pre) !== 0) pre = pre.slice(0, -1); });
        if (m.length === 1) input.value = head + pre + (sp < 0 ? ' ' : '');
        else if (pre.length > tail.length) input.value = head + pre;
        else print(m.join('  '), 'fa-t-dim');
      }

      // Démonstration : deux commandes se tapent toutes seules quand le terminal arrive à l'écran
      function stopIntro() {
        if (!typing) return;
        clearTimeout(typing); typing = 0;
        input.value = '';
        print(T.hint, 'fa-t-dim');
      }
      function intro() {
        if (started) return;
        started = true;
        var seq = ['whoami', 'ls'], k = 0;
        if (still()) { seq.forEach(run); print(T.hint, 'fa-t-dim'); return; }
        (function next() {
          if (k >= seq.length) { typing = 0; print(T.hint, 'fa-t-dim'); return; }
          var word = seq[k++], i = 0;
          (function step() {
            if (i <= word.length) { input.value = word.slice(0, i); typing = setTimeout(step, i++ ? 75 : 380); return; }
            typing = setTimeout(function () { input.value = ''; run(word); typing = setTimeout(next, 480); }, 280);
          })();
        })();
      }

      ps.textContent = PS;
      out.textContent = '';
      T.keys.forEach(function (k) {
        var b = doc.createElement('button');
        b.type = 'button'; b.className = 'fa-term-key'; b.textContent = k; b.setAttribute('data-term-run', k);
        keys.appendChild(b);
      });
      win.querySelector('.fa-term-line').hidden = false;
      keys.hidden = false;

      input.addEventListener('focus', stopIntro);
      input.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') { e.preventDefault(); stopIntro(); var v = input.value; input.value = ''; run(v); }
        else if (e.key === 'ArrowUp') { if (hist.length) { e.preventDefault(); hi = Math.max(0, hi - 1); input.value = hist[hi]; } }
        else if (e.key === 'ArrowDown') { e.preventDefault(); hi = Math.min(hist.length, hi + 1); input.value = hist[hi] || ''; }
        else if (e.key === 'Tab' && !e.shiftKey && input.value) { e.preventDefault(); complete(); } // champ vide : Tab quitte le terminal
        else if (e.key === 'Escape') { input.value = ''; }
        else if ((e.key === 'l' || e.key === 'L') && e.ctrlKey) { e.preventDefault(); C.clear(); }
        e.stopPropagation();
      });
      scr.addEventListener('click', function (e) {
        if (e.target.closest('a')) return;
        var sel = window.getSelection && window.getSelection();
        if (sel && String(sel)) return; // on laisse copier une sortie
        input.focus({ preventScroll: true });
      });
      keys.addEventListener('click', function (e) {
        var b = e.target.closest('[data-term-run]');
        if (!b) return;
        stopIntro(); started = true;
        run(b.getAttribute('data-term-run'));
      });

      if (window.IntersectionObserver) {
        var tio = new IntersectionObserver(function (entries) {
          if (!entries[0].isIntersecting) return;
          tio.disconnect();
          afterBoot(function () { typing = setTimeout(intro, 1300); });
        }, { threshold: 0.45 });
        tio.observe(win);
      } else intro();
    });
  }

  /* ---------- Démarrage ---------- */
  termOn();
  function start() { spyOn(); setTimeout(motionOn, 80); }
  if (mq && mq.addEventListener) mq.addEventListener('change', function () {
    list('[data-menu-btn]').forEach(function (b) { setMenu(b, false); });
    spyOn();
    setTimeout(motionOn, 60);
  });
  if (reduce && reduce.addEventListener) reduce.addEventListener('change', motionOn);
  if (doc.readyState === 'complete') start(); else window.addEventListener('load', start);
})();
