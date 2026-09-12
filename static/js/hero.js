/* ==========================================================================
   hero.js — cinematic boot, typewriters, background-video gate
   The hero is fully legible with JavaScript disabled; everything here is
   enhancement layered on top of static markup.
   ========================================================================== */
(function () {
    'use strict';

    var RM = window.RM = window.RM || {};

    /* ----------------------------------------------------------------------
       Boot sequence. Repeat visitors skip straight to the site.
       ---------------------------------------------------------------------- */
    var BOOT_LINES = ['INITIALIZING RAJ.M', 'AI / ML DEVELOPER', 'PYTHON', 'DATA', 'SYSTEM READY'];

    function boot() {
        var root = document.documentElement;
        var loader = RM.$('#loader');
        var typing = RM.$('#loader-typing');

        var seen = false;
        try { seen = !!window.sessionStorage.getItem('hasLoadedBefore'); } catch (e) {}

        if (!loader || seen || RM.reduced()) {
            root.classList.add('is-booted');
            return;
        }

        var i = 0;
        function nextLine() {
            if (i >= BOOT_LINES.length) {
                RM.after('boot', function () {
                    root.classList.add('is-booted');
                    try { window.sessionStorage.setItem('hasLoadedBefore', 'true'); } catch (e) {}
                }, 450);
                return;
            }
            RM.txt(typing, BOOT_LINES[i]);
            i += 1;
            RM.after('boot', nextLine, 560);
        }
        RM.after('boot', nextLine, 260);
    }

    /* ----------------------------------------------------------------------
       Typewriter. Text is written with textContent; the caret is a sibling
       element, never injected markup.
       ---------------------------------------------------------------------- */
    function typewriter(host, phrases, startDelay, scope) {
        if (!host) return;

        var textNode = RM.el('span', 'type-text');
        var caret = RM.el('span', 'type-caret');
        caret.setAttribute('aria-hidden', 'true');
        RM.clear(host);
        host.appendChild(textNode);
        host.appendChild(caret);

        /* Reduced motion: show the first phrase in full and stop. */
        if (RM.reduced()) {
            RM.txt(textNode, phrases[0]);
            caret.style.display = 'none';
            return;
        }

        var phrase = 0;
        var chars = 0;
        var deleting = false;

        function tick() {
            var current = phrases[phrase];
            chars += deleting ? -1 : 1;
            RM.txt(textNode, current.slice(0, chars));

            var delay = deleting ? 45 : 95;
            if (!deleting && chars === current.length) {
                delay = 2100;
                deleting = true;
            } else if (deleting && chars === 0) {
                deleting = false;
                phrase = (phrase + 1) % phrases.length;
                delay = 480;
            }
            RM.after(scope, tick, delay);
        }
        RM.after(scope, tick, startDelay);
    }

    /* ----------------------------------------------------------------------
       Background video. The head probe decides capability; here we honour it
       and pause whenever the tab is hidden so a background tab costs nothing.
       ---------------------------------------------------------------------- */
    function videoGate(scope) {
        var video = RM.$('#hero-bg-video');
        if (!video) return;

        var enabled = document.documentElement.dataset.video === 'on';
        if (!enabled) {
            video.removeAttribute('autoplay');
            if (!video.paused) video.pause();
            return;
        }
        RM.on(scope, document, 'visibilitychange', function () {
            if (document.hidden) video.pause();
            else video.play().catch(function () {});
        });
    }

    RM.initHero = function (scope) {
        typewriter(
            RM.$('#hero-typewriter'),
            ['INTELLIGENT\nSYSTEMS.', 'SOFTWARE WITH\nDATA.', 'IDEAS INTO\nCODE.'],
            900,
            scope
        );
        typewriter(
            RM.$('#contact-typewriter'),
            ['OPPORTUNITIES.', 'COLLABORATIONS.', 'FREELANCE WORK.', 'NEW IDEAS.'],
            400,
            scope
        );
        videoGate(scope);
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function () { boot(); }, { once: true });
    } else {
        boot();
    }
})();
