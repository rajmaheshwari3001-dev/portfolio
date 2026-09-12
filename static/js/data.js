/* ==========================================================================
   data.js — live data systems: GitHub + LeetCode, on /activity and /dashboard

   Two rules drive every line here.

   1. External data is data, never markup. Nothing from an API reaches
      innerHTML: values go through createElement / textContent / setAttribute,
      and URLs are scheme-checked before they become an href.
   2. Every region has a real state — loading, success, empty, error, stale.
      Loading states are shaped like the finished UI so nothing shifts when
      the payload lands, and a failure is announced instead of silently
      leaving a wall of "--" on screen.

   Template contract (see templates/activity.html, templates/dashboard.html):
     [data-state-region="key"]   the region; gets aria-busy while loading
       .state-content            the real UI, hidden while a notice is showing
       .state-block[data-state]  notice appended by this module
     [data-badge="github"]       .live-badge whose label tracks the state
     [data-updated="key"]        element receiving the human fetch timestamp
   ========================================================================== */
(function () {
    'use strict';

    var RM = window.RM;
    if (!RM) return;

    var GH_ENDPOINT = '/api/activity/github';
    var LC_ENDPOINT = '/api/activity/leetcode';
    var CHART_CDN = 'https://cdn.jsdelivr.net/npm/chart.js';
    var FETCH_TIMEOUT = 20000;

    /* Scope is set by initData() so router.js can tear a page down cleanly. */
    var S = 'data';

    /* ----------------------------------------------------------------------
       Design tokens, read from CSS so charts cannot drift from the palette.
       ---------------------------------------------------------------------- */
    var tokenCache = null;

    function tokens() {
        if (tokenCache) return tokenCache;
        var style = getComputedStyle(document.documentElement);
        function read(name, fallback) {
            var value = style.getPropertyValue(name).trim();
            return value || fallback;
        }
        tokenCache = {
            cyan: read('--accent-cyan', '#62E6E8'),
            gold: read('--accent-gold', '#D6AE68'),
            success: read('--status-success', '#51D88A'),
            warning: read('--status-warning', '#FFB45E'),
            error: read('--status-error', '#FF6978'),
            primary: read('--text-primary', '#F4F5F7'),
            meta: read('--text-meta', '#7C8794'),
            line: read('--line-hairline', 'rgba(244, 245, 247, 0.10)'),
            display: read('--font-display', "'Space Grotesk', sans-serif"),
            mono: read('--font-mono', 'ui-monospace, monospace')
        };
        return tokenCache;
    }

    function rgba(hex, alpha) {
        var match = /^#?([0-9a-f]{6})$/i.exec(String(hex).trim());
        if (!match) return hex;
        var int = parseInt(match[1], 16);
        return 'rgba(' + ((int >> 16) & 255) + ', ' + ((int >> 8) & 255) + ', ' + (int & 255) + ', ' + alpha + ')';
    }

    /* ----------------------------------------------------------------------
       Value coercion. A missing field becomes an honest placeholder, never a
       confident-looking zero.
       ---------------------------------------------------------------------- */
    function num(value) {
        var parsed = Number(value);
        return isFinite(parsed) ? parsed : 0;
    }

    function count(value) {
        return num(value).toLocaleString('en-US');
    }

    function hasCount(value) {
        return value !== null && value !== undefined && value !== '' && isFinite(Number(value));
    }

    function dash(value, suffix) {
        return hasCount(value) ? count(value) + (suffix || '') : '—';
    }

    /* Only http(s) may become an href: upstream data must not be able to
       smuggle a javascript: URL into the page. */
    function safeUrl(value) {
        if (typeof value !== 'string') return null;
        var trimmed = value.trim();
        return /^https?:\/\//i.test(trimmed) ? trimmed : null;
    }

    function stampDate(value) {
        var ms = typeof value === 'number' ? value : Date.parse(value);
        if (!isFinite(ms)) return null;
        return new Date(ms);
    }

    /* ----------------------------------------------------------------------
       State contract
       ---------------------------------------------------------------------- */
    var BADGE_TEXT = {
        loading: 'SYNCING',
        success: 'LIVE',
        cached: 'CACHED',
        stale: 'STALE',
        empty: 'NO DATA',
        error: 'OFFLINE'
    };

    function region(key) {
        return RM.$('[data-state-region="' + key + '"]');
    }

    function setBadge(key, state) {
        RM.$$('[data-badge="' + key + '"]').forEach(function (badge) {
            if (state === 'success') badge.removeAttribute('data-state');
            else badge.dataset.state = state;
            RM.txt(badge, BADGE_TEXT[state] || BADGE_TEXT.success);
        });
    }

    function setBusy(keys, busy) {
        keys.forEach(function (key) {
            var host = region(key);
            if (!host) return;
            if (busy) host.setAttribute('aria-busy', 'true');
            else host.removeAttribute('aria-busy');
        });
    }

    function contents(host, hidden) {
        if (!host) return;
        RM.$$('.state-content', host).forEach(function (el) { el.hidden = hidden; });
    }

    function clearNotice(host) {
        if (!host) return;
        var notice = RM.$('[data-state-notice]', host);
        if (notice) notice.parentNode.removeChild(notice);
        contents(host, false);
    }

    function stateBlock(state, title, message, meta, action) {
        var block = RM.el('div', 'state-block');
        block.dataset.state = state;
        block.setAttribute('data-state-notice', '');
        /* role=status: the notice is announced when it appears, and only then. */
        block.setAttribute('role', 'status');
        block.appendChild(RM.el('p', 'state-title', title));
        block.appendChild(RM.el('p', 'state-message', message));
        if (meta) block.appendChild(RM.el('span', 'state-meta', meta));
        if (action) {
            var control;
            if (action.href) {
                control = RM.el('a', 'btn', action.label);
                control.href = action.href;
                control.setAttribute('data-link', '');
            } else {
                control = RM.el('button', 'btn', action.label);
                control.type = 'button';
                RM.on(S, control, 'click', action.onClick);
            }
            block.appendChild(control);
        }
        return block;
    }

    /* Content stays in the DOM (so a retry can refill it) but is hidden while
       a notice explains what happened. */
    function notice(key, state, title, message, meta, action) {
        var host = region(key);
        if (!host) return;
        setBusy([key], false);
        clearNotice(host);
        contents(host, true);
        host.appendChild(stateBlock(state, title, message, meta, action));
    }

    function settle(key) {
        var host = region(key);
        if (!host) return;
        setBusy([key], false);
        clearNotice(host);
    }

    /* ----------------------------------------------------------------------
       Loading skeletons — same shape as the finished component.
       ---------------------------------------------------------------------- */
    function skeleton(el, placeholder) {
        if (!el) return;
        el.classList.add('state-skeleton');
        RM.txt(el, placeholder || '\u00A0');
    }

    function unskeleton(el) {
        if (el) el.classList.remove('state-skeleton');
    }

    function skeletonRows(host, count, build) {
        if (!host) return;
        RM.clear(host);
        for (var i = 0; i < count; i++) host.appendChild(build());
    }

    function shimmer(tag, className, lines) {
        var row = RM.el(tag || 'div', className + ' state-skeleton');
        for (var i = 0; i < (lines || 1); i++) row.appendChild(RM.el('span', null, '\u00A0'));
        return row;
    }

    /* ----------------------------------------------------------------------
       Envelope handling. app.py always answers with the same shape:
       { status: success|stale|error, success, data, updated_at, cached }
       ---------------------------------------------------------------------- */
    function readEnvelope(payload, fallbackMessage) {
        if (!payload || typeof payload !== 'object') {
            return { state: 'error', message: fallbackMessage };
        }
        if (payload.success === false || payload.status === 'error' || !payload.data) {
            return {
                state: 'error',
                message: payload.message || fallbackMessage,
                code: payload.error_code || null
            };
        }
        return {
            state: payload.status === 'stale' ? 'stale' : 'success',
            data: payload.data,
            cached: !!payload.cached,
            updatedAt: payload.updated_at || null
        };
    }

    var STALE_NOTE = 'Showing the last successful fetch. The upstream service is not answering right now.';

    /* ----------------------------------------------------------------------
       Chart.js — loaded on demand so a client-side navigation to /dashboard
       is not missing a script that was only inlined on a server render.
       ---------------------------------------------------------------------- */
    var chartLoader = null;

    function ensureChart() {
        if (typeof window.Chart !== 'undefined') return Promise.resolve(window.Chart);
        if (chartLoader) return chartLoader;
        chartLoader = new Promise(function (resolve, reject) {
            var script = document.createElement('script');
            script.src = CHART_CDN;
            script.defer = true;
            script.onload = function () {
                if (typeof window.Chart === 'undefined') { reject(new Error('chart-missing')); return; }
                applyChartDefaults(window.Chart);
                resolve(window.Chart);
            };
            script.onerror = function () { chartLoader = null; reject(new Error('chart-failed')); };
            document.head.appendChild(script);
        });
        return chartLoader;
    }

    function applyChartDefaults(Chart) {
        var t = tokens();
        Chart.defaults.color = t.meta;
        Chart.defaults.borderColor = rgba(t.primary, 0.06);
        Chart.defaults.font.family = t.display;
        Chart.defaults.font.size = 11;
        Chart.defaults.plugins.tooltip.backgroundColor = rgba('#04060A', 0.92);
        Chart.defaults.plugins.tooltip.borderColor = t.line;
        Chart.defaults.plugins.tooltip.borderWidth = 1;
        Chart.defaults.plugins.tooltip.titleColor = t.primary;
        Chart.defaults.plugins.tooltip.bodyColor = t.primary;
        /* Reduced motion means no animated bars either — the value is the
           content, the entrance is not. */
        if (RM.reduced()) Chart.defaults.animation = false;
    }

    function drawChart(canvasId, config, ariaLabel, fallbackRegion) {
        var canvas = RM.$('#' + canvasId);
        if (!canvas) return;

        ensureChart().then(function (Chart) {
            /* A page swap must not stack a second instance on the same canvas. */
            var existing = Chart.getChart ? Chart.getChart(canvas) : null;
            if (existing) existing.destroy();

            canvas.setAttribute('role', 'img');
            if (ariaLabel) canvas.setAttribute('aria-label', ariaLabel);

            var instance = new Chart(canvas, config);
            RM.onTeardown(S, function () { instance.destroy(); });
        }).catch(function () {
            canvas.setAttribute('role', 'img');
            canvas.setAttribute('aria-label', 'Chart unavailable.');
            if (fallbackRegion) chartUnavailable(fallbackRegion);
        });
    }

    function chartUnavailable(key) {
        notice(key, 'empty', 'CHART UNAVAILABLE',
            'The chart renderer could not load. The same numbers are readable on the Activity page.',
            null, { label: 'OPEN ACTIVITY', href: '/activity' });
    }

    function axisOptions() {
        var t = tokens();
        return {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: { beginAtZero: true, grid: { color: rgba(t.primary, 0.05) }, border: { display: false } },
                x: { grid: { display: false }, border: { display: false } }
            }
        };
    }

    /* ----------------------------------------------------------------------
       GitHub — /activity
       ---------------------------------------------------------------------- */
    function githubLoading() {
        skeleton(RM.$('#gh-name'), 'rajmaheshwari');
        skeleton(RM.$('#gh-repos'), '000');
        skeleton(RM.$('#gh-followers'), '000');
        skeletonRows(RM.$('#gh-lang-container'), 3, function () { return shimmer('div', 'led-row', 2); });
        skeletonRows(RM.$('#gh-repo-list'), 2, function () { return shimmer('div', 'repo-card', 2); });
        skeletonRows(RM.$('#gh-activity-list'), 4, function () { return shimmer('li', 'term-line', 1); });
        setBusy(['gh-profile', 'gh-langs', 'gh-repos', 'gh-stream'], true);
        setBadge('github', 'loading');
    }

    function renderGithubProfile(profile) {
        var avatar = RM.$('#gh-avatar');
        var src = safeUrl(profile.avatar_url);
        if (avatar) {
            if (src) {
                avatar.src = src;
                avatar.alt = (profile.login || 'GitHub') + ' profile avatar';
                avatar.hidden = false;
            } else {
                avatar.hidden = true;
            }
        }
        unskeleton(RM.$('#gh-name'));
        RM.txt(RM.$('#gh-name'), profile.name || profile.login || '—');

        [['#gh-repos', profile.public_repos], ['#gh-followers', profile.followers]].forEach(function (pair) {
            var el = RM.$(pair[0]);
            if (!el) return;
            unskeleton(el);
            if (hasCount(pair[1])) RM.animateValue(el, num(pair[1]), 1200);
            else RM.txt(el, '—');
        });

        settle('gh-profile');
    }

    function renderLanguages(languages) {
        var host = RM.$('#gh-lang-container');
        if (!host) return;

        var entries = Object.keys(languages || {}).map(function (name) {
            return { name: name, pct: num(languages[name]) };
        });

        if (!entries.length) {
            notice('gh-langs', 'empty', 'NO LANGUAGE DATA',
                'GitHub did not report a primary language for any public repository.');
            return;
        }

        settle('gh-langs');
        RM.clear(host);
        var reduced = RM.reduced();

        entries.forEach(function (entry, index) {
            var row = RM.el('div', 'led-row');
            var head = RM.el('div', 'led-header');
            head.appendChild(RM.el('span', null, entry.name));
            head.appendChild(RM.el('span', null, entry.pct + '%'));

            var segment = RM.el('div', 'led-segment');
            segment.setAttribute('data-width', Math.min(100, Math.max(0, entry.pct)) + '%');
            segment.setAttribute('role', 'presentation');
            if (!reduced) segment.style.transitionDelay = (index * 90) + 'ms';

            var track = RM.el('div', 'led-track');
            track.appendChild(segment);
            row.appendChild(head);
            row.appendChild(track);
            host.appendChild(row);
        });

        /* Width is set a frame later so the transition actually runs. */
        RM.after(S, function () {
            RM.$$('.led-segment', host).forEach(function (segment) {
                segment.style.width = segment.getAttribute('data-width');
            });
        }, reduced ? 0 : 120);
    }

    function renderRepos(repos) {
        var host = RM.$('#gh-repo-list');
        if (!host) return;

        var list = (repos || []).slice(0, 4);
        if (!list.length) {
            notice('gh-repos', 'empty', 'NO PUBLIC REPOSITORIES',
                'GitHub returned no public repositories for this account.');
            return;
        }

        settle('gh-repos');
        RM.clear(host);

        list.forEach(function (repo) {
            var url = safeUrl(repo.url);
            var card = url ? RM.el('a', 'repo-card') : RM.el('div', 'repo-card');
            if (url) {
                card.href = url;
                card.target = '_blank';
                card.rel = 'noopener noreferrer';
                card.setAttribute('data-external', '');
            }
            card.appendChild(RM.el('span', 'repo-name', repo.name || 'repository'));
            card.appendChild(RM.el('span', 'repo-stat',
                '\u2605 ' + dash(repo.stars) + ' \u00B7 ' + (repo.language || 'Code')));
            host.appendChild(card);
        });
    }

    function renderStream(activity) {
        var host = RM.$('#gh-activity-list');
        if (!host) return;

        var events = (activity || []).slice(0, 10);
        if (!events.length) {
            notice('gh-stream', 'empty', 'NO RECENT EVENTS',
                'GitHub reports no public events in the last 90 days.');
            return;
        }

        settle('gh-stream');
        RM.clear(host);
        var reduced = RM.reduced();

        events.forEach(function (event, index) {
            var line = RM.el('li', 'term-line');
            if (!reduced) line.style.animationDelay = (index * 60) + 'ms';

            var type = String(event.type || 'EVENT').toUpperCase().slice(0, 12);
            line.appendChild(RM.el('span', 'term-type', '[' + type + '] '));

            var title = RM.el('span', null, event.title || '');
            var url = safeUrl(event.url);
            if (url) {
                var link = RM.el('a', null, event.title || '');
                link.href = url;
                link.target = '_blank';
                link.rel = 'noopener noreferrer';
                link.setAttribute('data-external', '');
                line.appendChild(link);
            } else {
                line.appendChild(title);
            }

            var when = stampDate(event.timestamp);
            if (when) line.appendChild(RM.el('span', 'term-highlight', ' \u00B7 ' + RM.timeAgo(when)));

            host.appendChild(line);
        });
    }

    /* ----------------------------------------------------------------------
       LeetCode — /activity
       ---------------------------------------------------------------------- */
    function leetcodeLoading() {
        ['#lc-total', '#lc-easy', '#lc-med', '#lc-hard'].forEach(function (id) {
            skeleton(RM.$(id), '000');
        });
        ['#lc-pct-easy', '#lc-pct-med', '#lc-pct-hard'].forEach(function (id) {
            skeleton(RM.$(id), '00%');
        });
        skeletonRows(RM.$('#lc-lang-list'), 3, function () { return shimmer('li', 'lc-lang-item', 1); });
        skeletonRows(RM.$('#lc-recent-list'), 3, function () { return shimmer('li', 'lc-recent-item', 1); });
        skeletonRows(RM.$('#lc-heatmap'), 40, function () { return RM.el('div', 'heat-cell lvl-0'); });
        setBusy(['lc-overview', 'lc-bento', 'lc-heatmap'], true);
        setBadge('leetcode', 'loading');
    }

    /* API counters show the measured value, never a decorative count-up.
       Waiting for an IntersectionObserver to reveal the number would leave a
       fabricated zero resting in the DOM, in the accessibility tree and in
       print output, so data.js claims these elements and motion.js skips
       them. The count-up stays for template-authored counters, whose value
       is known at render time. */
    function setCounter(id, value) {
        var el = RM.$(id);
        if (!el) return;
        unskeleton(el);
        el.dataset.animated = 'true';

        if (!hasCount(value)) {
            el.setAttribute('data-target', '0');
            el.setAttribute('data-text', '');
            RM.txt(el, '—');
            return;
        }

        var target = num(value);
        var prior = el.getAttribute('data-text');
        el.setAttribute('data-target', target);
        el.setAttribute('data-text', String(target));
        RM.txt(el, String(target));

        /* A value that changes under the visitor is worth signalling. The
           template's initial 0 is not a prior value, so first paint is calm. */
        var changed = prior && prior !== '0' && prior !== String(target);
        if (changed && el.classList.contains('glitch-text')) {
            el.classList.add('is-glitching');
            RM.after(S, function () { el.classList.remove('is-glitching'); }, 900);
        }
    }

    function renderLeetcode(data) {
        var stats = data.statistics || {};
        var total = num(stats.total);
        var easy = num(stats.easy);
        var medium = num(stats.medium);
        var hard = num(stats.hard);
        var pct = stats.percentages || {};

        if (!total) {
            notice('lc-overview', 'empty', 'NO SOLVED PROBLEMS YET',
                'LeetCode reports zero accepted submissions for this profile.');
            return;
        }

        settle('lc-overview');
        setCounter('#lc-total', total);
        setCounter('#lc-easy', easy);
        setCounter('#lc-med', medium);
        setCounter('#lc-hard', hard);

        RM.txt(RM.$('#lc-pct-easy'), dash(pct.easy, '%'));
        RM.txt(RM.$('#lc-pct-med'), dash(pct.medium, '%'));
        RM.txt(RM.$('#lc-pct-hard'), dash(pct.hard, '%'));
        unskeleton(RM.$('#lc-pct-easy'));
        unskeleton(RM.$('#lc-pct-med'));
        unskeleton(RM.$('#lc-pct-hard'));

        drawLeetcodeRing(easy, medium, hard);
        renderLeetcodeBento(data);
        renderLeetcodeRadar(data.skills);
        renderHeatmap(data.calendar);
    }

    function drawLeetcodeRing(easy, medium, hard) {
        var t = tokens();
        var label = 'Solved problems by difficulty: ' + easy + ' easy, ' + medium + ' medium, ' + hard + ' hard.';
        var total = easy + medium + hard;

        var centerTextPlugin = {
            id: 'centerText',
            afterDraw: function(chart) {
                var ctx = chart.ctx;
                var width = chart.width;
                var height = chart.height;

                ctx.save();
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';

                ctx.font = 'bold 32px ' + t.display;
                ctx.fillStyle = t.primary;
                ctx.fillText(total, width / 2, height / 2 - 8);

                ctx.font = '11px ' + t.display;
                ctx.fillStyle = t.meta;
                ctx.fillText('SOLVED', width / 2, height / 2 + 16);

                ctx.restore();
            }
        };

        drawChart('lcDoughnutChart', {
            type: 'doughnut',
            data: {
                labels: ['Easy', 'Medium', 'Hard'],
                datasets: [{
                    data: [easy, medium, hard],
                    backgroundColor: ['#00FF88', '#FFD700', '#FF1744'],
                    borderColor: rgba('#07090C', 1),
                    borderWidth: 3,
                    hoverOffset: 15,
                    hoverBorderWidth: 0,
                    hoverBorderColor: rgba('#07090C', 0.5)
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                cutout: '70%',
                layout: {
                    padding: 10
                },
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        backgroundColor: rgba('#04060A', 0.95),
                        borderColor: t.line,
                        borderWidth: 1,
                        padding: 12,
                        titleFont: { size: 13, weight: '600' },
                        bodyFont: { size: 12 },
                        callbacks: {
                            label: function(context) {
                                var value = context.parsed;
                                var percentage = Math.round((value / total) * 100);
                                return context.label + ': ' + value + ' problems (' + percentage + '%)';
                            }
                        }
                    }
                },
                animation: {
                    animateScale: true,
                    animateRotate: true
                }
            },
            plugins: [centerTextPlugin]
        }, label);
    }

    function renderLeetcodeBento(data) {
        settle('lc-bento');

        RM.txt(RM.$('#lc-rank'), hasCount(data.ranking) ? count(data.ranking) : '—');
        RM.txt(RM.$('#lc-acceptance'), hasCount(data.acceptance_rate) ? num(data.acceptance_rate).toFixed(1) + '%' : '—');
        RM.txt(RM.$('#lc-total-subs'), dash(data.total_submissions));

        var langHost = RM.$('#lc-lang-list');
        var languages = data.languages || [];
        if (langHost) {
            RM.clear(langHost);
            if (!languages.length) {
                langHost.appendChild(RM.el('li', 'lc-lang-item', 'No language data reported.'));
            } else {
                languages.forEach(function (lang) {
                    var item = RM.el('li', 'lc-lang-item');
                    item.appendChild(RM.el('span', 'lang-name', lang.name || 'Unknown'));
                    item.appendChild(RM.el('span', 'lang-count', dash(lang.solved) + ' solved'));
                    langHost.appendChild(item);
                });
            }
        }

        var recentHost = RM.$('#lc-recent-list');
        var recent = data.problems || data.recent || [];
        if (recentHost) {
            RM.clear(recentHost);
            if (!recent.length) {
                recentHost.appendChild(RM.el('li', 'lc-recent-item', 'No recent accepted submissions.'));
            } else {
                recent.forEach(function (submission) {
                    var item = RM.el('li', 'lc-recent-item');
                    item.appendChild(RM.el('span', null, submission.title || 'Untitled'));
                    var when = num(submission.timestamp) ? new Date(num(submission.timestamp) * 1000) : null;
                    item.appendChild(RM.el('span', 'recent-time', when ? RM.timeAgo(when) : '—'));
                    recentHost.appendChild(item);
                });
            }
        }
    }

    function renderLeetcodeRadar(skills) {
        var list = (skills || []).slice(0, 6);
        if (list.length < 3) return;   /* a radar with two spokes is noise */

        var t = tokens();

        drawChart('lcRadarChart', {
            type: 'radar',
            data: {
                labels: list.map(function (skill) { return String(skill.name || '').toUpperCase(); }),
                datasets: [{
                    label: 'Problems solved',
                    data: list.map(function (skill) { return num(skill.count); }),
                    backgroundColor: rgba(t.cyan, 0.2),
                    borderColor: t.cyan,
                    pointBackgroundColor: t.cyan,
                    pointBorderColor: rgba('#07090C', 1),
                    pointHoverBackgroundColor: t.primary,
                    pointHoverBorderColor: t.cyan,
                    pointRadius: 5,
                    pointHoverRadius: 7,
                    pointBorderWidth: 2,
                    pointHoverBorderWidth: 3,
                    borderWidth: 2.5
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    r: {
                        beginAtZero: true,
                        angleLines: { color: rgba(t.primary, 0.12) },
                        grid: { color: rgba(t.primary, 0.10) },
                        pointLabels: {
                            color: t.meta,
                            font: { size: 10, weight: '600' }
                        },
                        ticks: { display: false }
                    }
                },
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        backgroundColor: rgba('#04060A', 0.95),
                        borderColor: t.line,
                        borderWidth: 1,
                        padding: 12,
                        titleFont: { size: 13, weight: '600' },
                        bodyFont: { size: 12 },
                        callbacks: {
                            label: function(context) {
                                return context.label + ': ' + context.parsed.r + ' problems';
                            }
                        }
                    }
                },
                interaction: {
                    intersect: false,
                    mode: 'index'
                }
            }
        }, 'Skill matrix: ' + list.map(function (s) { return s.name + ' ' + s.count; }).join(', ') + '.');
    }

    function renderHeatmap(calendar) {
        var host = RM.$('#lc-heatmap');
        if (!host) return;

        var cells = (calendar || []).map(function (value) {
            var level = Math.round(num(value));
            return level < 0 ? 0 : (level > 4 ? 4 : level);
        });

        if (!cells.length) {
            notice('lc-heatmap', 'empty', 'CALENDAR NOT PUBLISHED',
                'LeetCode does not expose a public submission calendar, so this heatmap has no real data to show. Nothing here is simulated.');
            return;
        }

        settle('lc-heatmap');
        RM.clear(host);
        cells.forEach(function (level) {
            host.appendChild(RM.el('div', 'heat-cell lvl-' + level));
        });
    }

    /* ----------------------------------------------------------------------
       Dashboard — the same two payloads, rendered as charts.
       ---------------------------------------------------------------------- */
    function renderDashboardGithub(data) {
        var languages = data.languages || {};
        var names = Object.keys(languages).slice(0, 5);
        var t = tokens();

        if (names.length) {
            var values = names.map(function (name) { return num(languages[name]); });
            var palette = [t.cyan, t.gold, t.success, t.warning, t.error];
            var summary = names.map(function (name, i) { return name + ' ' + values[i] + '%'; }).join(', ');

            settle('dash-langs');
            drawChart('githubLangChart', {
                type: 'doughnut',
                data: {
                    labels: names,
                    datasets: [{
                        data: values,
                        backgroundColor: names.map(function (_, i) { return palette[i % palette.length]; }),
                        borderWidth: 0,
                        hoverOffset: 15,
                        hoverBorderWidth: 0
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    cutout: '65%',
                    layout: {
                        padding: 10
                    },
                    plugins: {
                        legend: {
                            position: 'right',
                            labels: {
                                padding: 15,
                                usePointStyle: true,
                                pointStyle: 'circle',
                                font: { size: 11, weight: '500' }
                            }
                        },
                        tooltip: {
                            backgroundColor: rgba('#04060A', 0.95),
                            borderColor: t.line,
                            borderWidth: 1,
                            padding: 12,
                            titleFont: { size: 13, weight: '600' },
                            bodyFont: { size: 12 },
                            callbacks: {
                                label: function(context) {
                                    var total = values.reduce(function(a, b) { return a + b; }, 0);
                                    var value = context.parsed;
                                    var percentage = Math.round((value / total) * 100);
                                    return context.label + ': ' + value + '% (' + percentage + '% of repos)';
                                }
                            }
                        }
                    },
                    animation: {
                        animateScale: true,
                        animateRotate: true
                    }
                }
            }, 'Repository share by primary language: ' + summary + '.', 'dash-langs');
        } else {
            notice('dash-langs', 'empty', 'NO LANGUAGE DATA',
                'GitHub did not report a primary language for any public repository.');
        }

        var pushes = {};
        (data.activity || []).forEach(function (event) {
            if (String(event.type || '').toUpperCase() !== 'PUSH') return;
            var when = stampDate(event.timestamp);
            if (!when) return;
            var key = when.toISOString().slice(0, 10);
            pushes[key] = (pushes[key] || 0) + 1;
        });

        var days = Object.keys(pushes).sort();
        if (days.length) {
            settle('dash-activity');
            var totals = days.map(function (day) { return pushes[day]; });

            drawChart('githubActivityChart', {
                type: 'line',
                data: {
                    labels: days.map(function (day) { return day.slice(5); }),
                    datasets: [{
                        label: 'Push events',
                        data: totals,
                        borderColor: t.cyan,
                        backgroundColor: rgba(t.cyan, 0.15),
                        borderWidth: 3,
                        fill: true,
                        tension: 0.4,
                        pointRadius: 5,
                        pointBackgroundColor: t.cyan,
                        pointBorderColor: rgba('#07090C', 1),
                        pointBorderWidth: 2,
                        pointHoverRadius: 8,
                        pointHoverBackgroundColor: t.primary,
                        pointHoverBorderColor: t.cyan,
                        pointHoverBorderWidth: 3
                    }]
                },
                options: {
                    ...axisOptions(),
                    plugins: {
                        legend: { display: false },
                        tooltip: {
                            backgroundColor: rgba('#04060A', 0.95),
                            borderColor: t.line,
                            borderWidth: 1,
                            padding: 12,
                            titleFont: { size: 13, weight: '600' },
                            bodyFont: { size: 12 },
                            callbacks: {
                                label: function(context) {
                                    return context.parsed.y + ' push' + (context.parsed.y === 1 ? '' : 'es');
                                }
                            }
                        }
                    },
                    interaction: {
                        intersect: false,
                        mode: 'index'
                    }
                }
            }, 'Push events per day: ' + days.map(function (day, i) { return day + ' ' + totals[i]; }).join(', ') + '.', 'dash-activity');
        } else {
            notice('dash-activity', 'empty', 'NO RECENT PUSHES',
                'GitHub reports no push events in the current public event window.');
        }
    }

    function renderDashboardLeetcode(data) {
        var stats = data.statistics || {};
        var easy = num(stats.easy);
        var medium = num(stats.medium);
        var hard = num(stats.hard);
        var t = tokens();

        if (!num(stats.total)) {
            notice('dash-leetcode', 'empty', 'NO SOLVED PROBLEMS YET',
                'LeetCode reports zero accepted submissions for this profile.');
            return;
        }

        settle('dash-leetcode');
        drawChart('leetcodeChart', {
            type: 'bar',
            data: {
                labels: ['Easy', 'Medium', 'Hard'],
                datasets: [{
                    label: 'Problems solved',
                    data: [easy, medium, hard],
                    backgroundColor: ['#00FF88', '#FFD700', '#FF1744'],
                    borderColor: ['#00FF88', '#FFD700', '#FF1744'],
                    borderWidth: 2,
                    borderRadius: 8,
                    maxBarThickness: 80,
                    hoverBackgroundColor: ['#00FF88', '#FFD700', '#FF1744'],
                    hoverBorderWidth: 3
                }]
            },
            options: {
                ...axisOptions(),
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        backgroundColor: rgba('#04060A', 0.95),
                        borderColor: t.line,
                        borderWidth: 1,
                        padding: 12,
                        titleFont: { size: 13, weight: '600' },
                        bodyFont: { size: 12 },
                        callbacks: {
                            label: function(context) {
                                var total = easy + medium + hard;
                                var value = context.parsed.y;
                                var percentage = Math.round((value / total) * 100);
                                return context.label + ': ' + value + ' problems (' + percentage + '%)';
                            }
                        }
                    }
                },
                interaction: {
                    intersect: false,
                    mode: 'index'
                }
            }
        }, 'LeetCode problems solved: ' + easy + ' easy, ' + medium + ' medium, ' + hard + ' hard.', 'dash-leetcode');

        var rank = RM.$('#leetcode-rank');
        if (rank) {
            RM.clear(rank);
            rank.appendChild(document.createTextNode('Global ranking: '));
            rank.appendChild(RM.el('strong', null, hasCount(data.ranking) ? count(data.ranking) : 'unranked'));
        }
    }

    /* ----------------------------------------------------------------------
       Fetch timestamps — shown only when we actually know them.
       ---------------------------------------------------------------------- */
    var fetched = { github: null, leetcode: null };

    function setUpdated(key, value) {
        var when = stampDate(value);
        RM.$$('[data-updated="' + key + '"]').forEach(function (el) {
            RM.txt(el, when ? 'Last fetched ' + when.toLocaleTimeString() : '');
        });
        return when;
    }

    function renderActivityStamp() {
        var host = RM.$('#api-timestamp');
        if (!host) return;
        var parts = ['github', 'leetcode'].map(function (key) {
            var when = fetched[key];
            if (!when) return null;
            var label = key === 'github' ? 'GitHub' : 'LeetCode';
            return when.state === 'error'
                ? label + ' offline'
                : label + (when.state === 'stale' ? ' stale' : '') + ' ' + when.time.toLocaleTimeString();
        }).filter(Boolean);

        RM.txt(host, parts.length ? 'Live profile data \u2022 ' + parts.join(' \u2022 ') : 'Live profile data');
    }

    function recordFetch(source, result) {
        var when = result.updatedAt ? stampDate(result.updatedAt) : new Date();
        fetched[source] = { state: result.state, time: when || new Date() };
        setUpdated(source, when);
        renderActivityStamp();
    }

    /* ----------------------------------------------------------------------
       Loaders
       ---------------------------------------------------------------------- */
    function loadGithub() {
        var onActivity = !!RM.$('#gh-repo-list');
        var onDashboard = !!RM.$('#githubLangChart');
        if (!onActivity && !onDashboard) return;

        if (onActivity) githubLoading();
        if (onDashboard) {
            setBusy(['dash-langs', 'dash-activity'], true);
            setBadge('github', 'loading');
        }

        RM.getJSON(GH_ENDPOINT, FETCH_TIMEOUT).then(function (payload) {
            var result = readEnvelope(payload, 'GitHub data could not be read.');
            recordFetch('github', result);

            if (result.state === 'error') {
                setBadge('github', 'error');
                if (onActivity) {
                    ['gh-profile', 'gh-langs', 'gh-repos', 'gh-stream'].forEach(function (key) {
                        notice(key, 'error', 'GITHUB OFFLINE', result.message, result.code, { label: 'RETRY', onClick: loadGithub });
                    });
                }
                if (onDashboard) {
                    ['dash-langs', 'dash-activity'].forEach(function (key) {
                        notice(key, 'error', 'GITHUB OFFLINE', result.message, result.code, { label: 'RETRY', onClick: loadGithub });
                    });
                }
                return;
            }

            setBadge('github', result.state === 'stale' ? 'stale' : (result.cached ? 'cached' : 'success'));

            if (onActivity) {
                renderGithubProfile(result.data.profile || {});
                renderLanguages(result.data.languages);
                renderRepos(result.data.repos);
                renderStream(result.data.activity);
            }
            if (onDashboard) renderDashboardGithub(result.data);

            if (result.state === 'stale') {
                var staleKeys = [];
                if (onActivity) staleKeys.push('gh-profile');
                if (onDashboard) staleKeys.push('dash-langs');
                markStale(staleKeys);
            }
        }).catch(function () {
            setBadge('github', 'error');
            var message = 'The request to the activity service did not complete.';
            if (onActivity) {
                ['gh-profile', 'gh-langs', 'gh-repos', 'gh-stream'].forEach(function (key) {
                    notice(key, 'error', 'GITHUB UNREACHABLE', message, null, { label: 'RETRY', onClick: loadGithub });
                });
            }
            if (onDashboard) {
                ['dash-langs', 'dash-activity'].forEach(function (key) {
                    notice(key, 'error', 'GITHUB UNREACHABLE', message, null, { label: 'RETRY', onClick: loadGithub });
                });
            }
            recordFetch('github', { state: 'error' });
        });
    }

    function loadLeetcode() {
        var onActivity = !!RM.$('#lc-total');
        var onDashboard = !!RM.$('#leetcodeChart');
        if (!onActivity && !onDashboard) return;

        if (onActivity) leetcodeLoading();
        if (onDashboard) {
            setBusy(['dash-leetcode'], true);
            setBadge('leetcode', 'loading');
        }

        RM.getJSON(LC_ENDPOINT, FETCH_TIMEOUT).then(function (payload) {
            var result = readEnvelope(payload, 'LeetCode data could not be read.');
            recordFetch('leetcode', result);

            if (result.state === 'error') {
                setBadge('leetcode', 'error');
                var keys = onActivity ? ['lc-overview', 'lc-bento', 'lc-heatmap'] : [];
                if (onDashboard) keys.push('dash-leetcode');
                keys.forEach(function (key) {
                    notice(key, 'error', 'LEETCODE OFFLINE', result.message, result.code, { label: 'RETRY', onClick: loadLeetcode });
                });
                return;
            }

            setBadge('leetcode', result.state === 'stale' ? 'stale' : (result.cached ? 'cached' : 'success'));

            if (onActivity) renderLeetcode(result.data);
            if (onDashboard) renderDashboardLeetcode(result.data);

            if (result.state === 'stale') {
                var staleKeys = [];
                if (onActivity) staleKeys.push('lc-overview');
                if (onDashboard) staleKeys.push('dash-leetcode');
                markStale(staleKeys);
            }
        }).catch(function () {
            setBadge('leetcode', 'error');
            var message = 'The request to the activity service did not complete.';
            var keys = onActivity ? ['lc-overview', 'lc-bento', 'lc-heatmap'] : [];
            if (onDashboard) keys.push('dash-leetcode');
            keys.forEach(function (key) {
                notice(key, 'error', 'LEETCODE UNREACHABLE', message, null, { label: 'RETRY', onClick: loadLeetcode });
            });
            recordFetch('leetcode', { state: 'error' });
        });
    }

    /* A stale payload is still rendered — it just says so, once, up front. */
    function markStale(keys) {
        keys.forEach(function (key) {
            var host = region(key);
            if (host && !RM.$('[data-state="stale"]', host)) {
                host.appendChild(stateBlock('stale', 'CACHED DATA', STALE_NOTE));
            }
        });
    }

    RM.initData = function (scope) {
        S = scope || 'data';
        tokenCache = null;
        fetched = { github: null, leetcode: null };
        if (typeof window.Chart !== 'undefined') applyChartDefaults(window.Chart);
        loadGithub();
        loadLeetcode();
    };
})();
