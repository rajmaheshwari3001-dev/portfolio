/* ==========================================================================
   features.js — the interactive layer visitors actually touch
   Terminal, skill network, card tilt, neural schematic, bottom-nav
   indicator, in-page anchors and the command palette.

   Two rules govern everything here:
     1. Nothing is written with innerHTML. Command output and palette labels
        are text nodes, so a visitor typing `<img onerror>` into the terminal
        gets text back, not markup.
     2. Every handler is registered against a scope so router.js can tear it
        down on a page swap. The palette is the one exception: it lives
        outside #swup, is built once, and belongs to the 'shell' scope.
   ========================================================================== */
(function () {
    'use strict';

    var RM = window.RM = window.RM || {};
    var SHELL = 'shell';

    /* ----------------------------------------------------------------------
       Navigation. router.js owns the real implementation; this keeps the
       features usable if routing never initialised.
       ---------------------------------------------------------------------- */
    function goTo(href) {
        if (typeof RM.navigate === 'function') { RM.navigate(href); return; }
        window.location.assign(href);
    }

    /* The fixed nav overlaps the top of every section; anchors land under it
       unless the scroll is offset by the same amount. */
    function navOffset() {
        var raw = getComputedStyle(document.documentElement).getPropertyValue('--nav-height');
        var px = parseInt(raw, 10);
        return isNaN(px) ? 0 : px + 16;
    }
    RM.navOffset = navOffset;

    function finePointer() {
        return window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    }

    /* ----------------------------------------------------------------------
       In-page anchors. getElementById, never querySelector(hash): a section
       id that happens to start with a digit is an invalid CSS selector and
       would throw on every click.
       ---------------------------------------------------------------------- */
    function initAnchors(scope) {
        RM.on(scope, document, 'click', function (event) {
            if (event.defaultPrevented || event.button !== 0) return;
            if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

            var link = event.target.closest ? event.target.closest('a[href^="#"]') : null;
            if (!link) return;

            var hash = link.getAttribute('href');
            if (!hash || hash === '#') return;

            var target = document.getElementById(hash.slice(1));
            if (!target) return;

            event.preventDefault();
            RM.scrollTo(target, { offset: -navOffset() });
            if (window.history && history.replaceState) {
                history.replaceState(null, '', hash);
            }
        });
    }

    /* ----------------------------------------------------------------------
       Navigation state. The navs live outside #swup, so a page swap leaves
       them pointing at the previous route unless something re-syncs them.
       ---------------------------------------------------------------------- */
    function routePath(href) {
        return (href || '').split('#')[0].split('?')[0] || '/';
    }

    RM.syncNavLinks = function (pathname) {
        var path = routePath(pathname || window.location.pathname);

        /* Both navs carry a link for the current route and each is the visible
           one at its own breakpoint, so both get marked. */
        RM.$$('#desktop-top-nav .nav-link, #mobile-bottom-nav .bottom-nav-link').forEach(function (link) {
            var isActive = routePath(link.getAttribute('href')) === path;
            link.classList.toggle('active', isActive);
            if (isActive) link.setAttribute('aria-current', 'page');
            else link.removeAttribute('aria-current');
        });

        RM.placeNavIndicator();
    };

    /* The indicator is positioned, not transformed, because its width has to
       follow the link it sits behind. */
    RM.placeNavIndicator = function () {
        var nav = RM.$('#mobile-bottom-nav');
        var indicator = nav ? RM.$('.nav-indicator', nav) : null;
        if (!nav || !indicator) return;

        var link = RM.$('.bottom-nav-link.active', nav) || RM.$('.bottom-nav-link', nav);
        if (!link) { indicator.style.opacity = '0'; return; }

        var navRect = nav.getBoundingClientRect();
        var linkRect = link.getBoundingClientRect();
        if (!linkRect.width) { indicator.style.opacity = '0'; return; }

        indicator.style.opacity = '1';
        indicator.style.width = linkRect.width + 'px';
        indicator.style.left = (linkRect.left - navRect.left) + 'px';
    };

    function initNav(scope) {
        RM.syncNavLinks();

        /* Sections only compete for the active state where a route holds more
           than one of them; elsewhere the server-rendered active link is right. */
        var chapters = RM.$$('#swup section.chapter[id]').filter(function (section) {
            return document.getElementById(section.id);
        });

        if (chapters.length > 1 && 'IntersectionObserver' in window) {
            var io = new IntersectionObserver(function (entries) {
                entries.forEach(function (entry) {
                    if (!entry.isIntersecting) return;
                    var anchor = RM.$('#desktop-top-nav .nav-link[href$="#' + entry.target.id + '"], ' +
                                        '#mobile-bottom-nav .bottom-nav-link[href$="#' + entry.target.id + '"]');
                    if (anchor) {
                        RM.$$('.nav-link, .bottom-nav-link').forEach(function (l) { l.classList.remove('active'); });
                        anchor.classList.add('active');
                        RM.placeNavIndicator();
                    }
                });
            }, { rootMargin: '-30% 0px -70% 0px', threshold: 0 });

            chapters.forEach(function (section) { io.observe(section); });
            RM.observe(scope, io);
        }

        RM.on(scope, window, 'resize', function () { RM.placeNavIndicator(); });
        /* Webfonts arriving late shift the links; re-measure once they settle. */
        if (document.fonts && document.fonts.ready) {
            document.fonts.ready.then(function () { RM.placeNavIndicator(); }).catch(function () {});
        }
    }

    /* ----------------------------------------------------------------------
       Skill network. Hovering a skill lights the groups it belongs to.
       ---------------------------------------------------------------------- */
    function initSkillNetwork(scope) {
        var nodes = RM.$$('.skill-node');
        if (!nodes.length) return;

        var line = RM.$('#skill-line');
        var network = RM.$('.skill-network');

        function clear() {
            nodes.forEach(function (node) { node.classList.remove('active-node'); });
            if (line) line.style.opacity = '0';
        }

        nodes.forEach(function (node) {
            RM.on(scope, node, 'mouseenter', function () {
                var connects = (node.getAttribute('data-connect') || '').split(',');
                nodes.forEach(function (other) {
                    if (other === node) return;
                    /* closest() returns null for a node outside a group; without
                       this guard one stray element breaks the whole handler. */
                    var group = other.closest('.skill-group');
                    if (!group || !group.id) return;
                    if (connects.indexOf(group.id.replace('sg-', '')) !== -1) {
                        other.classList.add('active-node');
                    }
                });

                if (line && network) {
                    var rect = node.getBoundingClientRect();
                    var host = network.getBoundingClientRect();
                    line.style.top = (rect.top - host.top + rect.height / 2) + 'px';
                    line.style.opacity = '1';
                }
            });
            RM.on(scope, node, 'mouseleave', clear);
            RM.on(scope, node, 'focus', function () { node.dispatchEvent(new Event('mouseenter')); });
            RM.on(scope, node, 'blur', clear);
        });
    }

    /* ----------------------------------------------------------------------
       Project card tilt. cinematic.css deliberately leaves .proj-visual's
       transform alone — this handler is the only writer.
       Writes are batched into one rAF per frame; a mousemove fires far more
       often than the display updates, and unbatched this reads layout on
       every event.
       ---------------------------------------------------------------------- */
    function initTilt(scope) {
        if (RM.reduced() || !finePointer()) return;

        var MAX_DEG = 8;

        RM.$$('.proj-visual').forEach(function (card) {
            var frame = null;
            var point = { x: 0, y: 0 };

            RM.on(scope, card, 'mousemove', function (event) {
                var rect = card.getBoundingClientRect();
                point.x = rect.width ? ((event.clientX - rect.left) / rect.width - 0.5) * 2 : 0;
                point.y = rect.height ? ((event.clientY - rect.top) / rect.height - 0.5) * 2 : 0;

                if (frame) return;
                frame = window.requestAnimationFrame(function () {
                    frame = null;
                    card.style.transform =
                        'perspective(1000px) rotateX(' + (-point.y * MAX_DEG).toFixed(2) + 'deg)' +
                        ' rotateY(' + (point.x * MAX_DEG).toFixed(2) + 'deg)';
                });
            });

            RM.on(scope, card, 'mouseleave', function () {
                if (frame) { window.cancelAnimationFrame(frame); frame = null; }
                /* The reset is eased; the tracking is not. Adding a permanent
                   transition would make the tilt lag behind the cursor. */
                card.style.transition = 'transform 420ms var(--ease-cinematic)';
                card.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg)';
                RM.after(scope, function () { card.style.transition = ''; }, 440);
            });
        });
    }

    /* ----------------------------------------------------------------------
       Neural schematic. The tooltip is a mouse-only flourish over a diagram
       whose column labels are already in the markup, so it is aria-hidden
       and nothing is lost by keyboard.
       ---------------------------------------------------------------------- */
    function initSchematic(scope) {
        var tooltip = RM.$('#nn-tooltip');
        var nodes = RM.$$('.node-circle[data-info]');
        if (!tooltip || !nodes.length) return;

        tooltip.setAttribute('aria-hidden', 'true');

        function show(node, event) {
            RM.txt(tooltip, node.getAttribute('data-info'));
            tooltip.classList.add('is-visible');
            move(event);
        }

        function move(event) {
            var pad = 14;
            var x = event.clientX + pad;
            var y = event.clientY + pad;
            var rect = tooltip.getBoundingClientRect();
            if (x + rect.width > window.innerWidth - 8) x = event.clientX - rect.width - pad;
            if (y + rect.height > window.innerHeight - 8) y = event.clientY - rect.height - pad;
            tooltip.style.transform = 'translate3d(' + x + 'px,' + y + 'px,0)';
        }

        function hide() { tooltip.classList.remove('is-visible'); }

        nodes.forEach(function (node) {
            RM.on(scope, node, 'mouseenter', function (event) { show(node, event); });
            RM.on(scope, node, 'mousemove', move);
            RM.on(scope, node, 'mouseleave', hide);
        });
    }

    /* ----------------------------------------------------------------------
       Terminal. Output is built from text nodes only: the echo line contains
       whatever the visitor typed, and that must never be parsed as HTML.
       ---------------------------------------------------------------------- */
    var HELP_LINES = [
        ['whoami', 'who is writing this'],
        ['skills', 'core toolkit'],
        ['projects', 'the work'],
        ['journey', 'how it happened'],
        ['activity', 'live GitHub + LeetCode signal'],
        ['contact', 'start a conversation'],
        ['resume', 'the CV, rendered'],
        ['ls', 'list this system'],
        ['cat resume.txt', 'print the short version'],
        ['clear', 'wipe the screen'],
        ['help', 'this list']
    ];

    /* Command word -> where it takes you. Sections that now live on their own
       route are addressed by path, not by hash. */
    var DESTINATIONS = {
        home: '/', hero: '/#hero', about: '/#about',
        projects: '/projects', work: '/projects', machine: '/projects#machine',
        skills: '/skills', toolkit: '/skills',
        activity: '/activity', signal: '/activity',
        dashboard: '/dashboard', stats: '/dashboard',
        journey: '/journey', story: '/journey',
        contact: '/contact', hire: '/contact',
        resume: '/resume', cv: '/resume'
    };

    function initTerminal(scope) {
        var body = RM.$('#terminal-body');
        var input = RM.$('#terminal-input');
        if (!body || !input) return;

        var history = [];
        var cursor = -1;

        function write(className, segments) {
            var row = RM.el('div', 'term-line' + (className ? ' ' + className : ''));
            (segments || []).forEach(function (segment) {
                if (typeof segment === 'string') row.appendChild(document.createTextNode(segment));
                else row.appendChild(RM.el('span', segment.c, segment.t));
            });
            body.appendChild(row);
            body.scrollTop = body.scrollHeight;
            return row;
        }

        function blank() {
            body.textContent = '';
        }

        function travel(word) {
            var href = DESTINATIONS[word];
            var hash = href.indexOf('#');
            var id = hash === -1 ? null : href.slice(hash + 1);
            var local = id ? document.getElementById(id) : null;

            /* Same page: play the teleport. Different route: hand it to the
               router, which carries the hash across the swap. */
            var teleport = typeof TeleportTransition !== 'undefined' ? TeleportTransition : null;
            if (local && !RM.reduced() && teleport && typeof teleport.go === 'function') {
                teleport.go('#' + id, RM.lenis);
                return;
            }
            if (local) {
                RM.scrollTo(local, { offset: -navOffset() });
                return;
            }
            goTo(href);
        }

        function run(raw) {
            var value = raw.trim().toLowerCase();
            if (!value) return;

            history.push(value);
            cursor = history.length;

            write('cmd-echo', [
                { t: 'raj@system:~$ ', c: 'term-prompt' },
                raw
            ]);

            if (value === 'clear') { blank(); return; }

            if (value === 'help') {
                write('', ['Available commands — type one and press Enter.']);
                HELP_LINES.forEach(function (pair) {
                    write('', [{ t: pair[0], c: 'term-highlight' }, '  —  ' + pair[1]]);
                });
                return;
            }

            if (value === 'whoami') {
                write('', [
                    'Raj Maheshwari — AI/ML developer and software engineer.',
                    { t: ' B.Tech AI/ML, GLA University.', c: '' }
                ]);
                write('', ['Building full-stack ML applications: Python, Flask, SQL, scikit-learn.']);
                return;
            }

            if (value === 'skills') {
                write('', [{ t: '[OK]', c: 'term-type' }, ' Python, NumPy, Pandas, scikit-learn']);
                write('', [{ t: '[OK]', c: 'term-type' }, ' Flask, JavaScript, REST APIs']);
                write('', [{ t: '[OK]', c: 'term-type' }, ' SQL / MySQL, data modelling']);
                write('', [{ t: '[OK]', c: 'term-type' }, ' C++, Java, Git & GitHub, Azure AZ-900']);
                return;
            }

            if (value === 'ls') {
                write('', ['drwxr-xr-x  projects/']);
                write('', ['drwxr-xr-x  models/']);
                write('', ['-rw-r--r--  resume.txt']);
                write('', ['-rw-------  secret_keys.env']);
                return;
            }

            if (value === 'cat resume.txt') {
                write('', ['Raj Maheshwari — B.Tech AI/ML @ GLA University.']);
                write('', ['Type ', { t: 'resume', c: 'term-highlight' }, ' for the rendered CV.']);
                return;
            }

            if (value === 'cat secret_keys.env') {
                write('', [{ t: 'Permission denied.', c: 'term-type' }, ' The keys stay on the server.']);
                return;
            }

            if (value === 'sudo' || value === 'sudo -i' || value === 'su') {
                write('', ['raj@system is not in the sudoers file. This incident will be reported.']);
                return;
            }

            if (value === 'hack' || value === 'hack the mainframe') {
                write('', [{ t: '> ACCESSING MAINFRAME...', c: 'term-type' }]);
                write('', ['> NEURAL NETWORKS DEPLOYED...']);
                write('', ['> Just kidding. I mostly build models that behave.']);
                return;
            }

            if (DESTINATIONS[value]) {
                write('', [
                    { t: '> INITIATING BIFROST TELEPORT TO /' + value.toUpperCase() + '...', c: 'term-type' }
                ]);
                RM.after(scope, function () { travel(value); }, 160);
                return;
            }

            if (value.indexOf('cat ') === 0) {
                write('', ['cat: ' + value.slice(4) + ': No such file or directory']);
                return;
            }

            write('', ['Command not found: ' + value + '. Type ', { t: 'help', c: 'term-highlight' }, ' for the list.']);
        }

        RM.on(scope, input, 'keydown', function (event) {
            if (event.key === 'Enter') {
                event.preventDefault();
                var value = input.value;
                input.value = '';
                run(value);
                return;
            }
            if (event.key === 'ArrowUp') {
                if (!history.length) return;
                event.preventDefault();
                cursor = Math.max(0, cursor - 1);
                input.value = history[cursor];
                return;
            }
            if (event.key === 'ArrowDown') {
                if (!history.length) return;
                event.preventDefault();
                cursor = Math.min(history.length, cursor + 1);
                input.value = cursor === history.length ? '' : history[cursor];
            }
        });

        /* Clicking anywhere in the console focuses the field — the affordance
           people expect from a terminal. */
        RM.on(scope, body, 'click', function () {
            if (finePointer()) input.focus();
        });

        if (RM.reduced()) body.classList.add('no-anim');
    }

    /* ----------------------------------------------------------------------
       Command palette. Built once, appended to the shell, survives every
       page swap. ARIA 1.2 combobox: focus never leaves the input, the
       selected option is announced through aria-activedescendant.
       ---------------------------------------------------------------------- */
    var palette = null;

    function icon(name) {
        var node = RM.el('i', 'ph ' + name);
        node.setAttribute('aria-hidden', 'true');
        return node;
    }

    /* Page entries are read out of the navigation rather than hardcoded, so
       the palette cannot drift away from the routes that actually exist. */
    function pageItems() {
        var seen = Object.create(null);
        var items = [];

        RM.$$('#desktop-top-nav .nav-link, #mobile-bottom-nav .bottom-nav-link').forEach(function (link) {
            var href = link.getAttribute('href');
            if (!href || seen[href]) return;
            seen[href] = true;

            var label = (link.textContent || link.getAttribute('aria-label') || '').trim();
            var glyph = RM.$('i', link);
            var classes = glyph ? glyph.className : 'ph ph-arrow-right';

            items.push({
                label: label,
                iconClass: classes.replace(/\bph-fill\b|\bph-duotone\b|\bph-bold\b/g, '').trim() || 'ph ph-arrow-right',
                href: href,
                hint: href,
                keywords: label + ' page ' + href
            });
        });
        return items;
    }

    function sectionItems() {
        var chapters = RM.$$('#swup section.chapter[id]');
        /* The opening section of a route is the route: listing it would repeat
           the page entry directly above it in the same list. */
        return chapters.slice(1).map(function (section) {
            var explicit = section.getAttribute('data-nav-label');
            var heading = RM.$('h1, h2, h3', section);
            /* Split display headlines read as fragments ("INSIDE"), so a
               template may name the section outright. */
            var label = explicit || (heading ? (heading.textContent || '').replace(/\s+/g, ' ').trim() : '');

            return {
                label: label || section.id,
                iconClass: 'ph ph-caret-down',
                href: '#' + section.id,
                hint: 'ON THIS PAGE',
                keywords: label + ' section ' + section.id + ' chapter',
                section: true
            };
        });
    }

    function actionItems() {
        var items = [];
        var github = RM.$('#mobile-nav a[aria-label="GitHub"], #desktop-top-nav a[aria-label="GitHub"]');
        var linkedin = RM.$('#mobile-nav a[aria-label="LinkedIn"], #desktop-top-nav a[aria-label="LinkedIn"]');

        items.push({
            label: 'Ask Portfolio Copilot',
            iconClass: 'ph ph-robot',
            hint: 'ACTION',
            keywords: 'ai chat assistant ask question copilot',
            run: function () {
                var orb = RM.$('#copilot-orb');
                if (orb) orb.click();
            }
        });

        if (github) {
            items.push({
                label: 'Open GitHub profile',
                iconClass: 'ph ph-github-logo',
                hint: 'EXTERNAL',
                keywords: 'github repositories code',
                href: github.getAttribute('href'),
                external: true
            });
        }
        if (linkedin) {
            items.push({
                label: 'Open LinkedIn profile',
                iconClass: 'ph ph-linkedin-logo',
                hint: 'EXTERNAL',
                keywords: 'linkedin network profile',
                href: linkedin.getAttribute('href'),
                external: true
            });
        }

        items.push({
            label: 'Download the CV (PDF)',
            iconClass: 'ph ph-download-simple',
            hint: '/cv_raw',
            keywords: 'cv resume pdf download print',
            href: '/cv_raw',
            external: true
        });

        return items;
    }

    function buildPalette() {
        var overlay = RM.$('#cmdk-overlay');
        if (!overlay) return null;

        var input = RM.$('.cmdk-input', overlay);
        var list = RM.$('.cmdk-list', overlay);
        var empty = RM.$('.cmdk-empty', overlay);
        var trigger = RM.$('#cmdk-trigger');
        if (!input || !list) return null;

        var all = [];
        var shown = [];
        var selected = 0;
        var lastFocus = null;
        var open = false;

        function rank(query) {
            var q = query.trim().toLowerCase();
            if (!q) return all.slice(0);

            var starts = [];
            var words = [];
            var contains = [];

            all.forEach(function (item) {
                var label = item.label.toLowerCase();
                var haystack = (item.keywords || label).toLowerCase();
                if (label.indexOf(q) === 0) starts.push(item);
                else if (haystack.split(/\s+/).some(function (w) { return w.indexOf(q) === 0; })) words.push(item);
                else if (haystack.indexOf(q) !== -1) contains.push(item);
            });
            return starts.concat(words, contains);
        }

        function render() {
            list.textContent = '';
            shown.forEach(function (item, index) {
                var option = RM.el('div', 'cmdk-item');
                option.id = 'cmdk-opt-' + index;
                option.setAttribute('role', 'option');
                option.setAttribute('aria-selected', index === selected ? 'true' : 'false');
                option.dataset.cmdkItem = String(index);

                option.appendChild(icon(item.iconClass));
                option.appendChild(RM.el('span', 'cmdk-label', item.label));
                if (item.hint) option.appendChild(RM.el('span', 'cmdk-hint', item.hint));

                list.appendChild(option);
            });

            if (empty) empty.hidden = shown.length > 0;
            list.hidden = shown.length === 0;
            input.setAttribute('aria-activedescendant', shown.length ? 'cmdk-opt-' + selected : '');
        }

        function move(delta) {
            if (!shown.length) return;
            selected = (selected + delta + shown.length) % shown.length;
            render();
            var node = document.getElementById('cmdk-opt-' + selected);
            if (node && node.scrollIntoView) node.scrollIntoView({ block: 'nearest' });
        }

        function activate(item) {
            if (!item) return;
            close();
            if (typeof item.run === 'function') { item.run(); return; }
            if (!item.href) return;

            if (item.external) {
                /* Palette actions are same-tab except the ones that are
                   explicitly documents or other sites. */
                if (/^https?:\/\//i.test(item.href)) {
                    window.open(item.href, '_blank', 'noopener,noreferrer');
                } else {
                    window.location.assign(item.href);
                }
                return;
            }
            if (item.section) {
                var target = document.getElementById(item.href.slice(1));
                if (target) RM.scrollTo(target, { offset: -navOffset() });
                return;
            }
            goTo(item.href);
        }

        function refresh() {
            all = pageItems().concat(sectionItems(), actionItems());
            selected = 0;
            shown = rank(input.value);
            render();
        }

        function openPalette() {
            if (open) return;
            open = true;
            lastFocus = document.activeElement;
            overlay.classList.add('is-open');
            if (trigger) trigger.setAttribute('aria-expanded', 'true');
            input.value = '';
            refresh();
            RM.stopScroll();
            input.focus();
        }

        /* Focusing the body is a no-op, so a palette opened without a real
           previous focus would strand the visitor inside the now-hidden
           overlay. Fall back to a target that is actually reachable. */
        function restoreFocus() {
            var target = lastFocus;
            var unusable = !target || target === document.body ||
                target === document.documentElement || overlay.contains(target);

            if (unusable) {
                /* offsetParent is null while the trigger is display:none, which
                   is the case on narrow viewports. */
                target = (trigger && trigger.offsetParent) ? trigger : RM.$('#main-content');
            }
            lastFocus = null;

            if (target && typeof target.focus === 'function') {
                try { target.focus({ preventScroll: true }); } catch (e) { target.focus(); }
            }
        }

        function close() {
            if (!open) return;
            open = false;
            overlay.classList.remove('is-open');
            if (trigger) trigger.setAttribute('aria-expanded', 'false');
            RM.startScroll();
            restoreFocus();
        }

        RM.on(SHELL, input, 'input', function () {
            selected = 0;
            shown = rank(input.value);
            render();
        });

        RM.on(SHELL, input, 'keydown', function (event) {
            switch (event.key) {
                case 'ArrowDown': event.preventDefault(); move(1); break;
                case 'ArrowUp': event.preventDefault(); move(-1); break;
                case 'Home': event.preventDefault(); selected = 0; render(); break;
                case 'End': event.preventDefault(); selected = Math.max(0, shown.length - 1); render(); break;
                case 'Enter': event.preventDefault(); activate(shown[selected]); break;
                case 'Escape': event.preventDefault(); close(); break;
                case 'Tab':
                    /* The panel holds one control; letting Tab escape would
                       leave an open modal with focus behind it. */
                    event.preventDefault();
                    break;
            }
        });

        RM.on(SHELL, list, 'click', function (event) {
            var option = event.target.closest ? event.target.closest('.cmdk-item') : null;
            if (!option) return;
            activate(shown[parseInt(option.dataset.cmdkItem, 10)]);
        });

        RM.on(SHELL, list, 'mousemove', function (event) {
            var option = event.target.closest ? event.target.closest('.cmdk-item') : null;
            if (!option) return;
            var index = parseInt(option.dataset.cmdkItem, 10);
            if (index === selected) return;
            selected = index;
            render();
        });

        RM.on(SHELL, overlay, 'click', function (event) {
            if (event.target === overlay) close();
        });

        if (trigger) RM.on(SHELL, trigger, 'click', openPalette);

        RM.on(SHELL, document, 'keydown', function (event) {
            if ((event.metaKey || event.ctrlKey) && (event.key === 'k' || event.key === 'K')) {
                event.preventDefault();
                if (open) close(); else openPalette();
                return;
            }
            /* '/' is the shortcut people reach for first in a terminal UI. */
            if (event.key === '/' && !open) {
                var tag = document.activeElement ? document.activeElement.tagName : '';
                var editable = document.activeElement && document.activeElement.isContentEditable;
                if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || editable) return;
                event.preventDefault();
                openPalette();
            }
        });

        return { open: openPalette, close: close };
    }

    function initPalette() {
        if (palette) return;
        palette = buildPalette();
        RM.cmdk = palette;
    }

    /* ----------------------------------------------------------------------
       Entry point
       ---------------------------------------------------------------------- */
    RM.initFeatures = function (scope) {
        initAnchors(scope);
        initNav(scope);
        initSkillNetwork(scope);
        initTilt(scope);
        initSchematic(scope);
        initTerminal(scope);
        initPalette();
    };
})();
