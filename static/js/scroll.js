/* ==========================================================================
   scroll.js — exactly one Lenis instance for the whole session
   The previous runtime constructed a new Lenis on every page view, stacking
   rAF loops and fighting each other. One instance, created once, owned here.
   ========================================================================== */
(function () {
    'use strict';

    var RM = window.RM = window.RM || {};
    RM.lenis = null;

    function start() {
        if (RM.lenis || !RM.cap.lenis || RM.reduced()) return;

        RM.lenis = new window.Lenis({
            duration: 1.15,
            easing: function (t) { return Math.min(1, 1.001 - Math.pow(2, -10 * t)); },
            smoothWheel: true,
            touchMultiplier: 2
        });

        /* Legacy alias: copilot.js reaches for window.lenis when it plays a
           teleport. One instance, two names. */
        window.lenis = RM.lenis;

        function raf(time) {
            if (RM.lenis) RM.lenis.raf(time);
            window.requestAnimationFrame(raf);
        }
        window.requestAnimationFrame(raf);

        /* Keep ScrollTrigger in sync when GSAP is present. */
        if (RM.cap.gsap && window.ScrollTrigger) {
            RM.lenis.on('scroll', window.ScrollTrigger.update);
        }
    }

    /* Single entry point for programmatic scrolling. Falls back to native
       smooth scroll, and to an instant jump when motion is reduced. */
    RM.scrollTo = function (target, opts) {
        var options = opts || {};
        if (RM.reduced()) {
            var node = typeof target === 'string' ? document.querySelector(target) : target;
            if (node) node.scrollIntoView();
            else window.scrollTo(0, 0);
            return;
        }
        if (RM.lenis) {
            RM.lenis.scrollTo(target, {
                duration: options.duration || 1.4,
                offset: options.offset || 0
            });
            return;
        }
        var el = typeof target === 'string' ? document.querySelector(target) : target;
        if (el && el.scrollIntoView) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        else window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    RM.stopScroll = function () {
        if (RM.lenis) RM.lenis.stop();
    };

    RM.startScroll = function () {
        if (RM.lenis) RM.lenis.start();
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', start, { once: true });
    } else {
        start();
    }
})();
