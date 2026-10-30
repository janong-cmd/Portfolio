/* Jan Carlo A. Trinidad — Portfolio interactions */
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
