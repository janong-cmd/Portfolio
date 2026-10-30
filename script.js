/* Jan Carlo A. Trinidad — Portfolio interactions */

/* ---- Gallery settings ----------------------------------------------------
   Paste your deployed Google Apps Script "Web app" URL (ends in /exec) below.
   See Code.gs for the setup steps. While it is empty, the gallery section
   simply shows the button that opens the Drive folder. */
var GALLERY_CONFIG = {
  APPS_SCRIPT_URL: '',
  PAGE_SIZE: 9
};
(function () {
  'use strict';

  // Mark JS as available so CSS can hide [data-reveal] elements safely.
  document.documentElement.classList.add('js');

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  document.addEventListener('DOMContentLoaded', function () {
    var nav = document.getElementById('nav');
    var toggle = document.getElementById('navToggle');
    var links = document.getElementById('navLinks');
    var toTop = document.getElementById('toTop');
    var navAnchors = Array.prototype.slice.call(links.querySelectorAll('a'));

    /* Footer year */
    var yearEl = document.getElementById('year');
    if (yearEl) yearEl.textContent = new Date().getFullYear();

    /* Mobile menu */
    function setMenu(open) {
      toggle.setAttribute('aria-expanded', String(open));
      links.classList.toggle('open', open);
    }
    toggle.addEventListener('click', function () {
      setMenu(toggle.getAttribute('aria-expanded') !== 'true');
    });
    navAnchors.forEach(function (a) {
      a.addEventListener('click', function () { setMenu(false); });
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') { setMenu(false); toggle.focus(); }
    });
    document.addEventListener('click', function (e) {
      if (!nav.contains(e.target)) setMenu(false);
    });
    window.matchMedia('(min-width: 721px)').addEventListener('change', function () { setMenu(false); });

    /* Scroll-reveal (Intersection Observer) */
    var revealEls = document.querySelectorAll('[data-reveal]');
    if (reduceMotion || !('IntersectionObserver' in window)) {
      revealEls.forEach(function (el) { el.classList.add('in'); });
    } else {
      var revealIO = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add('in');
            revealIO.unobserve(entry.target);
          }
        });
      }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
      revealEls.forEach(function (el) { revealIO.observe(el); });
    }

    /* Active nav link based on visible section */
    var sections = navAnchors
        .map(function (a) { return document.querySelector(a.getAttribute('href')); })
        .filter(Boolean);

    function setActive(id) {
      navAnchors.forEach(function (a) {
        var on = a.getAttribute('href') === '#' + id;
        a.classList.toggle('active', on);
        if (on) a.setAttribute('aria-current', 'true'); else a.removeAttribute('aria-current');
      });
    }
    if ('IntersectionObserver' in window) {
      var spyIO = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) setActive(entry.target.id);
        });
      }, { rootMargin: '-45% 0px -50% 0px', threshold: 0 });
      sections.forEach(function (s) { spyIO.observe(s); });
    }

    /* Scroll-driven: nav background, back-to-top, light parallax (one rAF-throttled handler) */
    var glows = Array.prototype.slice.call(document.querySelectorAll('[data-parallax]'));
    var ticking = false;

    function onScroll() {
      var y = window.scrollY || window.pageYOffset;
      nav.classList.toggle('scrolled', y > 24);
      toTop.classList.toggle('show', y > 600);
      if (y < 40) setActive('');
      if (!reduceMotion && y < window.innerHeight * 1.2) {
        glows.forEach(function (g) {
          g.style.transform = 'translate3d(0,' + (y * parseFloat(g.dataset.parallax)).toFixed(1) + 'px,0)';
        });
      }
      ticking = false;
    }
    window.addEventListener('scroll', function () {
      if (!ticking) { ticking = true; window.requestAnimationFrame(onScroll); }
    }, { passive: true });
    onScroll();

    toTop.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
    });

    /* Animated counter — only for the real "7+ years" figure */
    var counter = document.querySelector('[data-count]');
    if (counter && !reduceMotion && 'IntersectionObserver' in window) {
      var target = parseInt(counter.dataset.count, 10);
      var countIO = new IntersectionObserver(function (entries) {
        if (!entries[0].isIntersecting) return;
        countIO.disconnect();
        var start = null, dur = 1100;
        counter.textContent = '0';
        (function step(ts) {
          if (start === null) start = ts;
          var p = Math.min((ts - start) / dur, 1);
          counter.textContent = Math.round(target * (1 - Math.pow(1 - p, 3)));
          if (p < 1) window.requestAnimationFrame(step);
        })(performance.now());
      }, { threshold: 0.6 });
      countIO.observe(counter);
    }

    /* Contact form — opens the visitor's email app (no backend needed) */
    var form = document.getElementById('contactForm');
    var note = document.getElementById('formNote');
    if (form) {
      form.addEventListener('submit', function (e) {
        e.preventDefault();
        var fields = ['cName', 'cEmail', 'cMsg'].map(function (id) { return document.getElementById(id); });
        var valid = true;
        fields.forEach(function (f) {
          var ok = f.value.trim() !== '' && f.checkValidity();
          f.parentElement.classList.toggle('invalid', !ok);
          f.setAttribute('aria-invalid', String(!ok));
          if (!ok) valid = false;
        });
        if (!valid) {
          note.textContent = 'Please fill in every field with a valid email.';
          note.classList.add('error');
          return;
        }
        note.classList.remove('error');
        var subject = 'Portfolio inquiry from ' + fields[0].value.trim();
        var body = fields[2].value.trim() + '\n\n— ' + fields[0].value.trim() + ' (' + fields[1].value.trim() + ')';
        window.location.href = 'mailto:jancarlotrinidad1997@gmail.com' +
            '?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(body);
        note.textContent = 'Opening your email app…';
      });
    }
  });
})();

/* Gallery: loads images/videos from Google Drive (through Apps Script) and previews them */
(function () {
  'use strict';

  document.addEventListener('DOMContentLoaded', function () {
    var grid = document.getElementById('galleryGrid');
    if (!grid) return;

    var statusEl = document.getElementById('galleryStatus');
    var countEl = document.getElementById('galleryCount');
    var moreBtn = document.getElementById('galleryMore');
    var chips = Array.prototype.slice.call(document.querySelectorAll('.gallery-filters .chip'));

    var box = document.getElementById('lightbox');
    var stage = document.getElementById('lbStage');
    var capEl = document.getElementById('lbCaption');
    var cntEl = document.getElementById('lbCount');
    var openEl = document.getElementById('lbOpen');
    var btnClose = document.getElementById('lbClose');
    var btnPrev = document.getElementById('lbPrev');
    var btnNext = document.getElementById('lbNext');

    var items = [];
    var filter = 'all';
    var shown = GALLERY_CONFIG.PAGE_SIZE;
    var current = 0;
    var lastFocus = null;

    function thumb(id, w) {
      return 'https://drive.google.com/thumbnail?id=' + encodeURIComponent(id) + '&sz=w' + w;
    }
    function filtered() {
      return items.filter(function (it) { return filter === 'all' || it.type === filter; });
    }
    function setStatus(msg) { statusEl.textContent = msg || ''; }

    /* ---------- grid ---------- */
    function showSkeletons() {
      grid.innerHTML = '';
      for (var i = 0; i < 6; i++) {
        var s = document.createElement('div');
        s.className = 'g-item skeleton';
        s.setAttribute('aria-hidden', 'true');
        grid.appendChild(s);
      }
    }

    function render() {
      var list = filtered();
      var visible = list.slice(0, shown);
      grid.innerHTML = '';
      grid.setAttribute('aria-busy', 'false');

      visible.forEach(function (it, n) {
        var b = document.createElement('button');
        b.type = 'button';
        b.className = 'g-item';
        b.style.setProperty('--n', n % GALLERY_CONFIG.PAGE_SIZE);
        b.setAttribute('aria-label', (it.type === 'video' ? 'Play video: ' : 'View image: ') + it.name);

        var img = document.createElement('img');
        img.alt = '';
        img.loading = 'lazy';
        img.decoding = 'async';
        img.addEventListener('load', function () { img.classList.add('loaded'); });
        img.addEventListener('error', function () {
          b.classList.add('broken');
          b.textContent = it.type === 'video' ? '▶ Video' : 'Preview unavailable';
        });
        img.src = thumb(it.id, 640);
        b.appendChild(img);

        if (it.type === 'video') {
          var badge = document.createElement('span');
          badge.className = 'g-badge';
          badge.setAttribute('aria-hidden', 'true');
          badge.textContent = '▶';
          b.appendChild(badge);
        }
        var cap = document.createElement('span');
        cap.className = 'g-cap';
        cap.textContent = it.name;
        b.appendChild(cap);

        b.addEventListener('click', function () { openBox(n, b); });
        grid.appendChild(b);
      });

      moreBtn.hidden = list.length <= shown;
      countEl.textContent = list.length ? list.length + (list.length === 1 ? ' item' : ' items') : '';
      if (!list.length) setStatus(items.length ? 'Nothing in this category yet.' : '');
      else setStatus('');
    }

    chips.forEach(function (chip) {
      chip.addEventListener('click', function () {
        filter = chip.dataset.filter;
        shown = GALLERY_CONFIG.PAGE_SIZE;
        chips.forEach(function (c) { c.setAttribute('aria-pressed', String(c === chip)); });
        render();
      });
    });
    moreBtn.addEventListener('click', function () {
      shown += GALLERY_CONFIG.PAGE_SIZE;
      render();
    });

    /* ---------- lightbox ---------- */
    function showItem(i) {
      var list = filtered();
      if (!list.length) return;
      current = (i + list.length) % list.length;
      var it = list[current];

      stage.innerHTML = '';
      if (it.type === 'video') {
        var f = document.createElement('iframe');
        f.src = 'https://drive.google.com/file/d/' + encodeURIComponent(it.id) + '/preview';
        f.title = it.name;
        f.allow = 'autoplay; fullscreen';
        f.allowFullscreen = true;
        stage.appendChild(f);
      } else {
        var spin = document.createElement('span');
        spin.className = 'lb-spin';
        stage.appendChild(spin);
        var im = document.createElement('img');
        im.alt = it.name;
        im.addEventListener('load', function () { if (spin.parentNode) spin.remove(); });
        im.addEventListener('error', function () { spin.remove(); stage.textContent = 'This image could not be loaded.'; });
        im.src = thumb(it.id, 2000);
        stage.appendChild(im);
      }

      capEl.textContent = it.name;
      cntEl.textContent = (current + 1) + ' / ' + list.length;
      openEl.href = 'https://drive.google.com/file/d/' + encodeURIComponent(it.id) + '/view';
      var many = list.length > 1;
      btnPrev.hidden = btnNext.hidden = !many;
    }

    function openBox(i, opener) {
      lastFocus = opener || document.activeElement;
      box.hidden = false;
      document.body.classList.add('lb-open');
      showItem(i);
      btnClose.focus();
    }
    function closeBox() {
      box.hidden = true;
      stage.innerHTML = '';           // stops any playing video
      document.body.classList.remove('lb-open');
      if (lastFocus && lastFocus.focus) lastFocus.focus();
    }

    btnClose.addEventListener('click', closeBox);
    btnPrev.addEventListener('click', function () { showItem(current - 1); });
    btnNext.addEventListener('click', function () { showItem(current + 1); });
    box.addEventListener('click', function (e) {
      if (e.target === box || e.target === stage) closeBox();
    });

    document.addEventListener('keydown', function (e) {
      if (box.hidden) return;
      if (e.key === 'Escape') { e.stopImmediatePropagation(); closeBox(); }
      else if (e.key === 'ArrowLeft') showItem(current - 1);
      else if (e.key === 'ArrowRight') showItem(current + 1);
      else if (e.key === 'Tab') {                       // keep focus inside the dialog
        var f = [btnClose, btnPrev, btnNext, openEl].filter(function (el) { return !el.hidden; });
        var first = f[0], last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    }, true);

    var tx = null;
    box.addEventListener('touchstart', function (e) { tx = e.changedTouches[0].clientX; }, { passive: true });
    box.addEventListener('touchend', function (e) {
      if (tx === null) return;
      var dx = e.changedTouches[0].clientX - tx;
      tx = null;
      if (Math.abs(dx) > 60) showItem(current + (dx < 0 ? 1 : -1));
    }, { passive: true });

    /* ---------- load from Apps Script ---------- */
    var url = GALLERY_CONFIG.APPS_SCRIPT_URL;
    if (!url) {
      grid.setAttribute('aria-busy', 'false');
      grid.innerHTML = '';
      document.querySelector('.gallery-bar').hidden = true;
      setStatus('Browse my images and videos in the shared Google Drive folder.');
      if (window.console) console.info('Gallery: set GALLERY_CONFIG.APPS_SCRIPT_URL in script.js to load items here.');
      return;
    }

    showSkeletons();
    fetch(url)
        .then(function (r) { return r.json(); })
        .then(function (data) {
          if (!data || !data.ok) throw new Error((data && data.error) || 'Bad response');
          items = data.items || [];
          if (!items.length) {
            grid.innerHTML = '';
            grid.setAttribute('aria-busy', 'false');
            setStatus('No images or videos found yet. Check back soon.');
            return;
          }
          render();
        })
        .catch(function () {
          grid.innerHTML = '';
          grid.setAttribute('aria-busy', 'false');
          setStatus('The gallery could not be loaded right now. You can still view everything on Google Drive.');
        });
  });
})();