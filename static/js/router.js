/* ==========================================================================
   router.js — one Swup instance, one page lifecycle
   The contract cinematic.css §18 draws against:
     html.is-animating            -> content fades/slides out
     html[data-nav-dir=forward]   -> exits left, enters right
     html[data-nav-dir=backward]  -> the reverse
     .transition-sweep.is-active  -> the light pass across the frame
     html.is-transitioning.stuck  -> escape hatch, hides the sweep

   Swup supplies is-animating; this file supplies the direction, the sweep
   and the stuck guard, and owns the teardown/re-init of every page module.
   ========================================================================== */
(function () {
    'use strict';

    var RM = window.RM = window.RM || {};
    var PAGE = 'page';
    var root = document.documentElement;

    /* Narrative order of the site. Direction is a story beat, not a guess:
       moving later through this list reads as forward, back up it as return. */
    var ROUTE_ORDER = ['/', '/projects', '/skills', '/activity', '/dashboard', '/journey', '/contact', '/resume'];

    var swup = null;
    var stuckTimer = null;
    var hashTimer = null;

    function offset() {
        return typeof RM.navOffset === 'function' ? -RM.navOffset() : 0;
    }

    function normalise(path) {
        var clean = (path || '/').split('#')[0].split('?')[0];
        if (clean.length > 1 && clean.charAt(clean.length - 1) === '/') clean = clean.slice(0, -1);
        return clean || '/';
    }

    /* ----------------------------------------------------------------------
       Pending hash. A programmatic jump to /projects#machine cannot scroll
       during the visit — the element does not exist yet. It is stashed and
       consumed once the new content is in the DOM.
       ---------------------------------------------------------------------- */
    function stashHash(fragment) {
        if (!fragment) return;
        try { window.sessionStorage.setItem('rm:pending-hash', fragment); } catch (e) {}
    }

    function takeHash() {
        try {
            var value = window.sessionStorage.getItem('rm:pending-hash');
            if (value) window.sessionStorage.removeItem('rm:pending-hash');
            return value || '';
        } catch (e) { return ''; }
    }

    function consumeHash() {
        var fragment = takeHash();
        if (!fragment) return;

        /* Two frames plus a beat: layout, then webfonts, then measure. */
        window.requestAnimationFrame(function () {
            window.requestAnimationFrame(function () {
                var target = document.getElementById(fragment);
                if (!target) return;
                RM.scrollTo(target, { offset: offset() });
                if (window.history && history.replaceState) {
                    history.replaceState(null, '', '#' + fragment);
                }
            });
        });
    }

    /* ----------------------------------------------------------------------
       Transition chrome
       ---------------------------------------------------------------------- */
    function setDirection(from, to, action) {
        if (action === 'pop') { root.dataset.navDir = 'backward'; return; }

        var a = ROUTE_ORDER.indexOf(normalise(from));
        var b = ROUTE_ORDER.indexOf(normalise(to));
        if (a === -1 || b === -1) { root.dataset.navDir = 'forward'; return; }
        root.dataset.navDir = b >= a ? 'forward' : 'backward';
    }

    function container() {
        return RM.$('#swup');
    }

    /* cinematic.css brings the new content back with
       `.transition-fade.is-entering`. Swup 4 only manages is-animating /
       is-changing / is-leaving / is-rendering, so the enter half of the
       contract has to be driven from here. */
    function enterState(on) {
        var node = container();
        if (node) node.classList.toggle('is-entering', !!on);
    }

    function transitionStart(from, to, action) {
        setDirection(from, to, action);
        /* A leftover enter state would override the exit rule and the page
           would never fade out. */
        enterState(false);
        root.classList.add('is-transitioning');
        root.classList.remove('stuck');

        var sweep = RM.$('.transition-sweep');
        if (sweep) {
            sweep.classList.remove('is-active');
            /* Force the reflow so re-adding the class restarts the animation
               instead of being ignored on a second consecutive visit. */
            void sweep.offsetWidth;
            sweep.classList.add('is-active');
        }

        RM.stopScroll();

        /* If a visit never completes — a swallowed network error, a container
           Swup could not find — the sweep would otherwise stay on screen and
           block the page. This is the documented escape hatch. */
        window.clearTimeout(stuckTimer);
        stuckTimer = window.setTimeout(function () {
            root.classList.add('stuck');
            /* Swup holds is-animating until the enter animation resolves, and
               that class is what keeps the content at opacity 0. Recovering
               the page matters more than the state machine staying tidy. */
            root.classList.remove('is-animating', 'is-changing', 'is-leaving', 'is-rendering');
            enterState(false);
            RM.startScroll();
            settleFocus();
        }, 5000);
    }

    function transitionEnd() {
        window.clearTimeout(stuckTimer);
        root.classList.remove('is-transitioning', 'stuck');
        enterState(false);

        var sweep = RM.$('.transition-sweep');
        if (sweep) sweep.classList.remove('is-active');

        RM.startScroll();
        consumeHash();
    }

    /* ----------------------------------------------------------------------
       Page lifecycle. Every page-scoped listener, observer and timer is
       dropped before the new page boots, so a swap can never stack handlers.
       ---------------------------------------------------------------------- */
    function bootPage() {
        RM.offScope(PAGE);

        if (RM.initMotion) RM.initMotion(PAGE);
        if (RM.initHero) RM.initHero(PAGE);
        if (RM.initData) RM.initData(PAGE);
        if (RM.initFeatures) RM.initFeatures(PAGE);

        /* Lenis caches the document height; new content changes it. */
        if (RM.lenis && typeof RM.lenis.resize === 'function') RM.lenis.resize();
        if (window.ScrollTrigger && typeof window.ScrollTrigger.refresh === 'function') {
            window.ScrollTrigger.refresh();
        }
    }

    function settleFocus() {
        var main = RM.$('#main-content');
        if (!main) return;
        /* preventScroll: the visitor should land where the router put them,
           not where the browser decides a focused element ought to be. */
        try { main.focus({ preventScroll: true }); } catch (e) { main.focus(); }
    }

    /* ----------------------------------------------------------------------
       Programmatic navigation. The terminal, the palette and the copilot all
       route through here so there is exactly one way to change pages.
       ---------------------------------------------------------------------- */
    RM.navigate = function (href) {
        if (!href) return;

        /* Anything that is not a same-origin document leaves the SPA path. */
        if (/^(?:[a-z][a-z0-9+.-]*:)?\/\//i.test(href) || /^(?:mailto|tel):/i.test(href)) {
            window.location.assign(href);
            return;
        }

        var parts = href.split('#');
        var path = normalise(parts[0] || window.location.pathname);
        var fragment = parts[1] || '';

        if (path === normalise(window.location.pathname)) {
            if (!fragment) { RM.scrollTo(0); return; }
            var local = document.getElementById(fragment);
            if (local) {
                RM.scrollTo(local, { offset: offset() });
                if (window.history && history.replaceState) history.replaceState(null, '', '#' + fragment);
            } else {
                window.location.assign(href);
            }
            return;
        }

        stashHash(fragment);
        /* Swup 4 exposes navigate(); swup.visit is the current visit state. */
        if (swup && typeof swup.navigate === 'function') swup.navigate(path);
        else window.location.assign(href);
    };

    /* ----------------------------------------------------------------------
       Boot
       ---------------------------------------------------------------------- */
    function hook(name, fn) {
        if (!swup) return;
        if (swup.hooks && typeof swup.hooks.on === 'function') { swup.hooks.on(name, fn); return; }
        if (typeof swup.on === 'function') swup.on(name, fn);
    }

    function start() {
        if (!RM.cap.swup || typeof window.Swup !== 'function') {
            /* No router: the site is still fully usable as ordinary links. */
            bootPage();
            return;
        }

        try {
            swup = new window.Swup({
                containers: ['#swup'],
                animationSelector: '[class*="transition-"]',
                cache: true,
                scroll: true
            });
        } catch (error) {
            swup = null;
            bootPage();
            return;
        }

        hook('visit:start', function (visit) {
            var to = (visit && visit.to) || {};
            var from = (visit && visit.from) || {};
            var action = (visit && visit.history && visit.history.action) || 'push';
            transitionStart(from.url || window.location.pathname, to.url || '', action);
            if (to.hash) stashHash(String(to.hash).replace(/^#/, ''));
        });

        hook('content:replace', function () {
            bootPage();
            /* The new page exists now: fade it in and hand focus to it. Doing
               this on visit:end would strand keyboard users whenever the
               enter animation never resolves. */
            enterState(true);
            settleFocus();
        });

        hook('visit:end', function () {
            transitionEnd();
        });

        /* A failed fetch must not leave the visitor on a half-swapped page. */
        hook('fetch:error', function () {
            transitionEnd();
        });

        /* Neither of these fires visit:end, so the sweep and the scroll lock
           would otherwise linger until the stuck guard caught them. */
        hook('visit:fail', function () {
            transitionEnd();
        });
        hook('visit:abort', function () {
            transitionEnd();
        });

        bootPage();
    }

    /* Deferred scripts run in order, but readyState is already "interactive"
       by then — waiting on 'loading' would boot the page before data.js and
       features.js had defined their init hooks. DOMContentLoaded is queued
       only after every deferred script in the batch has executed. */
    if (document.readyState === 'complete') {
        start();
    } else {
        window.addEventListener('DOMContentLoaded', start, { once: true });
    }
})();
