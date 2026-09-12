/* ==========================================================================
   motion.js — scroll reveals and counters
   Reveals are IntersectionObserver + CSS transitions: one mechanism, no
   dependency, and identical with or without GSAP. Counters run once.
   ========================================================================== */
(function () {
    'use strict';

    var RM = window.RM = window.RM || {};

    var REVEAL_SELECTOR = [
        '.scroll-fade-up', '.scroll-fade-right', '.scroll-fade-left',
        '.scroll-scale', '.scroll-slide-up', '.scroll-draw-line',
        '.scroll-blur-in', '.scroll-rotate-in', '.animated-come-from'
    ].join(', ');

    function initReveals(scope) {
        var targets = RM.$$(REVEAL_SELECTOR).filter(function (el) {
            return !el.classList.contains('is-visible');
        });
        if (!targets.length) return;

        if (!('IntersectionObserver' in window)) {
            targets.forEach(function (el) { el.classList.add('is-visible'); });
            return;
        }

        var io = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (entry.isIntersecting) {
                    entry.target.classList.add('is-visible');
                    io.unobserve(entry.target);
                }
            });
        }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });

        targets.forEach(function (el) { io.observe(el); });
        RM.observe(scope, io);
    }

    function initCounters(scope) {
        var counters = RM.$$('.animated-counter').filter(function (el) {
            return el.dataset.animated !== 'true';
        });
        if (!counters.length) return;

        function run(el) {
            /* Re-check at callback time: data.js may have claimed this counter
               and written the measured value after registration. Animating it
               now would drag a real number back down to zero. */
            if (el.dataset.animated === 'true') return;

            el.dataset.animated = 'true';
            var target = parseInt(el.getAttribute('data-target'), 10) || 0;

            /* Zero is the server-rendered placeholder data.js later replaces.
               Still mark the handoff, just don't animate toward nothing. */
            if (!target) {
                el.setAttribute('data-text', '0');
                RM.txt(el, '0');
                return;
            }

            var glitch = el.classList.contains('glitch-text');
            if (glitch) el.classList.add('is-glitching');
            RM.animateValue(el, target, 1800);
            if (glitch) {
                RM.after(scope, function () { el.classList.remove('is-glitching'); }, 1900);
            }
        }

        if (!('IntersectionObserver' in window)) {
            counters.forEach(run);
            return;
        }

        var io = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (entry.isIntersecting) {
                    run(entry.target);
                    io.unobserve(entry.target);
                }
            });
        }, { threshold: 0.2 });

        counters.forEach(function (el) { io.observe(el); });
        RM.observe(scope, io);
    }

    /* GSAP owns exactly one thing: depth parallax on the hero light plane.
       Nothing else animates through it, so ownership never overlaps CSS. */
    function initParallax(scope) {
        if (!RM.cap.gsap || RM.reduced()) return;
        var light = RM.$('.hero-light');
        var hero = RM.$('#hero');
        if (!light || !hero) return;

        window.gsap.registerPlugin(window.ScrollTrigger);
        var tween = window.gsap.to(light, {
            yPercent: 18,
            opacity: 0.35,
            ease: 'none',
            scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: true }
        });
        RM.observe(scope, { disconnect: function () {
            if (tween && tween.scrollTrigger) tween.scrollTrigger.kill();
            if (tween) tween.kill();
        } });
    }

    RM.initMotion = function (scope) {
        initReveals(scope);
        initCounters(scope);
        initParallax(scope);
    };
})();
