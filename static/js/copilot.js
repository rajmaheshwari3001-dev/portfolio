document.addEventListener('DOMContentLoaded', () => {
    const copilotOrb = document.getElementById('copilot-orb');
    const copilotWindow = document.getElementById('copilot-window');
    const copilotClose = document.getElementById('copilot-close');
    const copilotNewChat = document.getElementById('copilot-new-chat');
    const copilotInput = document.getElementById('copilot-input');
    const copilotSend = document.getElementById('copilot-send');
    const copilotBody = document.getElementById('copilot-body');
    const typingIndicator = document.getElementById('copilot-typing');
    const statusText = document.getElementById('copilot-status-text');
    const statusDot = copilotWindow.querySelector('.copilot-status-dot');

    let chatHistory = [];
    let isOpen = false;

    // --- Status: fetch truth from /api/status ---
    function fetchStatus() {
        fetch('/api/status')
            .then(r => r.json())
            .then(data => {
                if (!data || data.status !== 'success') return;
                const d = data.data;
                const parts = [];
                if (d.engine) parts.push(d.engine);
                if (d.build) parts.push(d.build);
                statusText.textContent = parts.length ? parts.join(' · ') : 'Online';
                if (d.llm === 'not_configured') {
                    statusDot.style.background = '#f59e0b';
                    statusDot.style.boxShadow = '0 0 8px #f59e0b';
                } else if (d.llm === 'degraded') {
                    statusDot.style.background = '#f97316';
                    statusDot.style.boxShadow = '0 0 8px #f97316';
                }
            })
            .catch(() => { statusText.textContent = 'Online'; });
    }
    fetchStatus();

    // --- Toggle Chat Window ---
    function toggleChat() {
        isOpen = !isOpen;
        if (isOpen) {
            copilotWindow.classList.add('active');
            copilotOrb.setAttribute('aria-expanded', 'true');
            copilotWindow.setAttribute('aria-hidden', 'false');
            if (chatHistory.length === 0) {
                setTimeout(() => copilotInput.focus(), 400);
            }
        } else {
            copilotWindow.classList.remove('active');
            copilotOrb.setAttribute('aria-expanded', 'false');
            copilotWindow.setAttribute('aria-hidden', 'true');
        }
    }

    copilotOrb.addEventListener('click', toggleChat);
    copilotClose.addEventListener('click', toggleChat);

    // --- NEW CHAT: reset conversation ---
    copilotNewChat.addEventListener('click', () => {
        chatHistory = [];
        const msgs = copilotBody.querySelectorAll('.copilot-msg:not(:first-child)');
        msgs.forEach(m => m.remove());
        const qa = copilotBody.querySelector('.copilot-quick-actions');
        if (qa) qa.style.display = '';
        copilotInput.value = '';
        copilotInput.focus();
    });

    function escapeHtml(str) {
        return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    }

    // --- Lightweight Markdown -> HTML ---
    function parseMarkdown(text) {
        const codeBlocks = [];
        const inlineCode = [];
        const OPEN = '\uE000', CLOSE = '\uE001'; // private-use sentinels

        let src = text.replace(/```[ \t]*[\w+-]*\n?([\s\S]*?)```/g, (m, code) => {
            const i = codeBlocks.length;
            codeBlocks.push('<div class="copilot-code-wrap"><pre class="copilot-code"><code>' + escapeHtml(code.replace(/\n+$/, '')) + '</code></pre></div>');
            return OPEN + 'B' + i + CLOSE;
        });

        src = src.replace(/`([^`\n]+)`/g, (m, code) => {
            const i = inlineCode.length;
            inlineCode.push('<code class="copilot-inline-code">' + escapeHtml(code) + '</code>');
            return OPEN + 'I' + i + CLOSE;
        });

        const lines = src.split('\n');
        let html = '', inList = false, para = [];
        const flushPara = () => { if (para.length) { html += '<p>' + para.join('<br>') + '</p>'; para = []; } };
        const closeList = () => { if (inList) { html += '</ul>'; inList = false; } };
        const blockRe = new RegExp('^\\s*' + OPEN + 'B\\d+' + CLOSE + '\\s*$');
        for (const line of lines) {
            if (blockRe.test(line)) { flushPara(); closeList(); html += line.trim(); continue; }
            const li = line.match(/^\s*[-*]\s+(.*)$/);
            if (li) { flushPara(); if (!inList) { html += '<ul>'; inList = true; } html += '<li>' + li[1] + '</li>'; }
            else if (line.trim() === '') { flushPara(); closeList(); }
            else { closeList(); para.push(line); }
        }
        flushPara(); closeList();

        html = html
            .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
            .replace(/\*([^*]+)\*/g, '<em>$1</em>')
            .replace(/\[([^\]]*?)\]\(([^)]*?)\)/g, '<a href="$2" target="_blank" rel="noopener" style="color: var(--c-amber); text-decoration: underline;">$1</a>');

        html = html.replace(new RegExp(OPEN + 'I(\\d+)' + CLOSE, 'g'), (m, i) => inlineCode[+i]);
        html = html.replace(new RegExp(OPEN + 'B(\\d+)' + CLOSE, 'g'), (m, i) => codeBlocks[+i]);
        return html;
    }

    // --- Shared navigation handler ---
    function handleNavClick(btn) {
        const target = btn.getAttribute('data-target');
        if (!target) return;

        if (window.innerWidth <= 768) {
            toggleChat();
        }

        const targetEl = document.querySelector(target);
        if (targetEl) {
            if (typeof TeleportTransition !== 'undefined') {
                TeleportTransition.go(target, window.lenis || null);
            } else {
                targetEl.scrollIntoView({ behavior: 'smooth' });
            }
            return;
        }

        const ANCHOR_ROUTES = {
            '#about': '/#about',
            '#hero': '/#hero',
            '#machine': '/projects#machine'
        };
        const route = ANCHOR_ROUTES[target] || target.replace('#', '/');
        if (window.RM && typeof window.RM.navigate === 'function') {
            window.RM.navigate(route);
        } else {
            window.location.href = route;
        }
    }

    function attachNavHandlers(container) {
        container.querySelectorAll('.copilot-action[data-action="navigate"]').forEach(btn => {
            btn.addEventListener('click', () => handleNavClick(btn));
        });
    }

    // --- Copy buttons on code blocks ---
    function attachCopyButtons(container) {
        container.querySelectorAll('.copilot-code-wrap').forEach(wrap => {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'copilot-copy-btn';
            btn.textContent = 'Copy';
            btn.addEventListener('click', () => {
                const code = wrap.querySelector('code');
                if (!code) return;
                navigator.clipboard.writeText(code.textContent).then(() => {
                    btn.textContent = 'Copied';
                    btn.classList.add('copied');
                    setTimeout(() => { btn.textContent = 'Copy'; btn.classList.remove('copied'); }, 1500);
                });
            });
            wrap.appendChild(btn);
        });
    }

    function addMessage(role, content) {
        const msgDiv = document.createElement('div');
        msgDiv.className = `copilot-msg ${role}`;

        if (role === 'ai') {
            msgDiv.innerHTML = parseMarkdown(content);
            attachCopyButtons(msgDiv);
        } else {
            msgDiv.textContent = content;
        }

        copilotBody.insertBefore(msgDiv, typingIndicator);
        scrollToBottom();

        if (role === 'ai') {
            attachNavHandlers(msgDiv);
        }
    }

    function scrollToBottom() {
        requestAnimationFrame(() => {
            copilotBody.scrollTop = copilotBody.scrollHeight;
        });
    }

    async function sendMessage(content) {
        if (!content.trim()) return;

        addMessage('user', content);
        chatHistory.push({ role: 'user', content: content });

        copilotInput.value = '';
        typingIndicator.classList.add('active');
        scrollToBottom();

        try {
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ messages: chatHistory })
            });

            const data = await response.json();

            typingIndicator.classList.remove('active');

            if (data.success) {
                addMessage('ai', data.response);
                chatHistory.push({ role: 'ai', content: data.response });

                if (Array.isArray(data.actions) && data.actions.length > 0) {
                    const lastMsg = copilotBody.querySelector('.copilot-msg.ai:last-of-type');
                    if (lastMsg) {
                        data.actions.forEach(action => {
                            if (action.type !== 'navigate' || !action.target) return;
                            const btn = document.createElement('button');
                            btn.type = 'button';
                            btn.className = 'copilot-action';
                            btn.setAttribute('data-action', 'navigate');
                            btn.setAttribute('data-target', action.target);
                            btn.textContent = action.label || 'Go';
                            lastMsg.appendChild(document.createElement('br'));
                            lastMsg.appendChild(btn);
                        });
                        attachNavHandlers(lastMsg);
                    }
                }
            } else {
                addMessage('ai', `*Error: ${data.error}*`);
            }
        } catch (err) {
            console.error('Chat API Error:', err);
            typingIndicator.classList.remove('active');
            addMessage('ai', '*I am having trouble connecting right now. Please try again later.*');
        }
    }

    copilotSend.addEventListener('click', () => { sendMessage(copilotInput.value); });
    copilotInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') sendMessage(copilotInput.value);
    });

    // Quick Actions
    document.querySelectorAll('.copilot-quick-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const prompt = btn.getAttribute('data-prompt');
            if (prompt) {
                const qa = document.querySelector('.copilot-quick-actions');
                if (qa) qa.style.display = 'none';
                sendMessage(prompt);
            }
        });
    });

    // --- Mobile keyboard: keep input visible ---
    if (window.visualViewport) {
        visualViewport.addEventListener('resize', () => {
            if (window.innerWidth <= 768 && isOpen) {
                copilotWindow.style.height = visualViewport.innerHeight * 0.7 + 'px';
                scrollToBottom();
            }
        });
        visualViewport.addEventListener('scroll', () => {
            if (window.innerWidth <= 768 && isOpen) {
                copilotWindow.style.bottom = (window.innerHeight - visualViewport.height - visualViewport.offsetTop) + 'px';
            }
        });
    }
});
