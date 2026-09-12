/* ==========================================================================
   core.js — capability tiers, safe DOM, listener registry, shared helpers
   Layer 0-2 of the progressive enhancement contract. No dependencies.
   ========================================================================== */
(function () {
    'use strict';

    var RM = window.RM = window.RM || {};

    /* ----------------------------------------------------------------------
       Capability tiers. Each layer degrades on its own; the visitor should
       never be able to tell which layer they are on.
       ---------------------------------------------------------------------- */
    var root = document.documentElement;

    RM.cap = {
        gsap: typeof window.gsap !== 'undefined' && typeof window.ScrollTrigger !== 'undefined',
        three: typeof window.THREE !== 'undefined',
        lenis: typeof window.Lenis !== 'undefined',
        swup: typeof window.Swup !== 'undefined',
        viewTransitions: typeof document.startViewTransition === 'function'
    };

    if (!RM.cap.gsap) root.dataset.gsap = 'off';
    if (!RM.cap.three && root.dataset.webgl !== 'off') root.dataset.webgl = 'off';

    RM.reduced = function () {
        return root.dataset.motion === 'reduced' || root.dataset.motion === 'off';
    };

    /* ----------------------------------------------------------------------
       Listener registry. Page swaps must not stack handlers: every listener
       bound through RM.on() belongs to a scope that router.js tears down.
       ---------------------------------------------------------------------- */
    var scopes = Object.create(null);

    RM.on = function (scope, target, type, fn, opts) {
        if (!target) return;
        target.addEventListener(type, fn, opts);
        (scopes[scope] = scopes[scope] || []).push([target, type, fn, opts]);
    };

    /* Observers, timers and third-party instances need the same discipline. */
    RM.observe = function (scope, observer) {
        (scopes[scope] = scopes[scope] || []).push({ disconnect: function () { observer.disconnect(); } });
        return observer;
    };

    RM.after = function (scope, fn, ms) {
        var id = window.setTimeout(fn, ms);
        (scopes[scope] = scopes[scope] || []).push({ disconnect: function () { window.clearTimeout(id); } });
        return id;
    };

    /* Cleanup that is not a listener — Chart.js instances, pending aborts. */
    RM.onTeardown = function (scope, fn) {
        (scopes[scope] = scopes[scope] || []).push({ disconnect: fn });
    };

    /* Entries are either [target,type,fn,opts] tuples or {disconnect} objects. */
    RM.offScope = function (scope) {
        var list = scopes[scope];
        if (!list) return;
        for (var i = 0; i < list.length; i++) {
            var entry = list[i];
            if (typeof entry.disconnect === 'function') entry.disconnect();
            else entry[0].removeEventListener(entry[1], entry[2], entry[3]);
        }
        delete scopes[scope];
    };

    /* ----------------------------------------------------------------------
       Safe DOM. External and API values are data, never markup: everything
       user- or API-supplied goes through textContent.
       ---------------------------------------------------------------------- */
    RM.el = function (tag, className, text) {
        var node = document.createElement(tag);
        if (className) node.className = className;
        if (text != null) node.textContent = text;
        return node;
    };

    RM.txt = function (el, value) {
        if (el) el.textContent = value == null ? '' : String(value);
        return el;
    };

    RM.clear = function (el) {
        if (el) el.textContent = '';
        return el;
    };

    /* ----------------------------------------------------------------------
       Small shared helpers
       ---------------------------------------------------------------------- */
    RM.$ = function (sel, ctx) { return (ctx || document).querySelector(sel); };
    RM.$$ = function (sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); };

    RM.timeAgo = function (date) {
        var seconds = Math.floor((Date.now() - date.getTime()) / 1000);
        if (seconds < 60) return 'just now';
        var minutes = Math.floor(seconds / 60);
        if (minutes < 60) return minutes + 'm ago';
        var hours = Math.floor(minutes / 60);
        if (hours < 24) return hours + 'h ago';
        var days = Math.floor(hours / 24);
        if (days < 30) return days + 'd ago';
        return Math.floor(days / 30) + 'mo ago';
    };

    /* Counters jump straight to the final value when motion is reduced —
       the number is the content, the animation is not. Same when the tab is
       hidden: requestAnimationFrame never fires there, so waiting for a frame
       would leave the caller's loading placeholder on screen indefinitely. */
    RM.animateValue = function (el, end, duration) {
        if (!el) return;
        var target = Math.max(0, Math.round(end) || 0);
        if (RM.reduced() || document.hidden || !window.requestAnimationFrame) {
            el.textContent = String(target);
            el.setAttribute('data-text', target);
            return;
        }
        var start = null;
        var step = function (ts) {
            if (start === null) start = ts;
            var progress = Math.min((ts - start) / duration, 1);
            var current = Math.floor(progress * target);
            el.textContent = String(current);
            el.setAttribute('data-text', current);
            if (progress < 1) window.requestAnimationFrame(step);
        };
        window.requestAnimationFrame(step);
    };

    /* Fetch wrapper with a timeout so a hung upstream cannot pin the UI. */
    RM.getJSON = function (url, ms) {
        var controller = typeof window.AbortController !== 'undefined' ? new AbortController() : null;
        var timer = window.setTimeout(function () { if (controller) controller.abort(); }, ms || 15000);
        return fetch(url, controller ? { signal: controller.signal } : undefined)
            .then(function (res) {
                if (!res.ok) throw new Error('HTTP ' + res.status);
                return res.json();
            })
            .finally(function () { window.clearTimeout(timer); });
    };
})();
