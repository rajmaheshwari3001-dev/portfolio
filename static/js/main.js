document.addEventListener('DOMContentLoaded', () => {
    // --- Smooth Scroll (Lenis) ---
    const lenis = new Lenis({
        duration: 1.2,
        easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        direction: 'vertical',
        gestureDirection: 'vertical',
        smooth: true,
        mouseMultiplier: 1,
        smoothTouch: false,
        touchMultiplier: 2,
        infinite: false,
    });

    function raf(time) {
        lenis.raf(time);
        requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);

    // --- Loading Sequence ---
    const loader = document.getElementById('loader');
    const typingText = document.getElementById('loader-typing');
    const texts = ["INITIALIZING RAJ.M", "AI / ML DEVELOPER", "PYTHON", "DATA", "SYSTEM READY"];
    let textIndex = 0;
    
    function typeText() {
        if (textIndex >= texts.length) {
            setTimeout(() => {
                loader.style.opacity = '0';
                setTimeout(() => loader.style.display = 'none', 1000);
            }, 500);
            return;
        }
        
        typingText.innerText = texts[textIndex];
        textIndex++;
        setTimeout(typeText, 600);
    }
    
    // Start loader
    setTimeout(typeText, 300);

    // --- Custom Cursor ---
    const cursor = document.getElementById('custom-cursor');
    if (cursor && window.innerWidth > 1024) {
        let mouseX = 0, mouseY = 0;
        let cursorX = 0, cursorY = 0;
        
        document.addEventListener('mousemove', (e) => {
            mouseX = e.clientX;
            mouseY = e.clientY;
        });

        function updateCursor() {
            cursorX += (mouseX - cursorX) * 0.2;
            cursorY += (mouseY - cursorY) * 0.2;
            cursor.style.transform = `translate3d(calc(${cursorX}px - 50%), calc(${cursorY}px - 50%), 0)`;
            requestAnimationFrame(updateCursor);
        }
        requestAnimationFrame(updateCursor);
        
        const interactables = document.querySelectorAll('a, button, .node-circle, .proj-visual');
        interactables.forEach(el => {
            el.addEventListener('mouseenter', () => cursor.classList.add('hovering'));
            el.addEventListener('mouseleave', () => cursor.classList.remove('hovering'));
        });
    }

    // --- Hover Glow Effect for Bento Boxes ---
    document.addEventListener('mousemove', (e) => {
        const glowElements = document.querySelectorAll('.hover-glow');
        glowElements.forEach(el => {
            const rect = el.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            el.style.setProperty('--mouse-x', `${x}px`);
            el.style.setProperty('--mouse-y', `${y}px`);
        });
    });

    // --- Hero Typewriter Effect ---
    const heroTypewriter = document.getElementById('hero-typewriter');
    if (heroTypewriter) {
        const phrases = ["INTELLIGENT<br>SYSTEMS.", "SOFTWARE<br>WITH DATA.", "IDEAS INTO<br>CODE."];
        let phraseIndex = 0;
        let charIndex = 0;
        let isDeleting = false;
        
        function cycleHeroText() {
            const currentPhrase = phrases[phraseIndex].replace("<br>", "\n"); // Handle HTML break visually if needed, but innerHTML is better
            // Actually, let's just use simple string replacement since we have HTML tags
            const plainPhrases = ["INTELLIGENT SYSTEMS.", "SOFTWARE WITH DATA.", "IDEAS INTO CODE."];
            
            let currentText = plainPhrases[phraseIndex];
            
            if (isDeleting) {
                charIndex--;
            } else {
                charIndex++;
            }
            
            // Format with <br> for display
            let displayText = currentText.substring(0, charIndex);
            // Rough splitting for styling
            let words = displayText.split(' ');
            if (words.length > 1 && charIndex > currentText.indexOf(' ')) {
                displayText = words[0] + "<br>" + words.slice(1).join(' ');
            }
            
            heroTypewriter.innerHTML = displayText + '<span style="border-right: 0.1em solid #fff; animation: blink 1s step-end infinite;"></span>';
            
            let typeSpeed = isDeleting ? 50 : 100;
            
            if (!isDeleting && charIndex === currentText.length) {
                typeSpeed = 2000; // Pause at end
                isDeleting = true;
            } else if (isDeleting && charIndex === 0) {
                isDeleting = false;
                phraseIndex = (phraseIndex + 1) % plainPhrases.length;
                typeSpeed = 500;
            }
            
            setTimeout(cycleHeroText, typeSpeed);
        }
        
        setTimeout(cycleHeroText, 3000); // Start after loader
    }

    // --- Contact Typewriter Effect ---
    const contactTypewriter = document.getElementById('contact-typewriter');
    if (contactTypewriter) {
        const contactPhrases = ["OPPORTUNITIES.", "COLLABORATIONS.", "FREELANCE WORK.", "NEW IDEAS."];
        let contactPhraseIndex = 0;
        let contactCharIndex = 0;
        let contactIsDeleting = false;
        
        function cycleContactText() {
            let currentText = contactPhrases[contactPhraseIndex];
            
            if (contactIsDeleting) {
                contactCharIndex--;
            } else {
                contactCharIndex++;
            }
            
            let displayText = currentText.substring(0, contactCharIndex);
            contactTypewriter.innerHTML = displayText + '<span style="border-right: 0.1em solid #fff; animation: blink 1s step-end infinite;"></span>';
            
            let typeSpeed = contactIsDeleting ? 50 : 100;
            
            if (!contactIsDeleting && contactCharIndex === currentText.length) {
                typeSpeed = 2000; // Pause at end
                contactIsDeleting = true;
            } else if (contactIsDeleting && contactCharIndex === 0) {
                contactIsDeleting = false;
                contactPhraseIndex = (contactPhraseIndex + 1) % contactPhrases.length;
                typeSpeed = 500;
            }
            
            setTimeout(cycleContactText, typeSpeed);
        }
        
        const contactObserver = new IntersectionObserver((entries) => {
            if (entries[0].isIntersecting) {
                setTimeout(cycleContactText, 1000);
                contactObserver.disconnect();
            }
        });
        contactObserver.observe(contactTypewriter.parentElement);
    }

    // --- Interactive Playable Terminal ---
    const terminalOutput = document.getElementById('terminal-output');
    const terminalInput = document.getElementById('terminal-input');
    
    if (terminalOutput && terminalInput) {
        const commands = {
            'help': 'Available commands:<br>- whoami: Information about Raj<br>- skills: List of core competencies<br>- clear: Clear terminal<br>- hack: Initialize neural interface',
            'whoami': 'Raj Maheshwari<br>AI/ML Developer & Software Engineer<br>Passionate about building intelligent systems.',
            'skills': '> Loading matrix...<br>[OK] Python, Machine Learning, Data Science<br>[OK] Flask, Web Development<br>[OK] Problem Solving (LeetCode: 60+)',
            'hack': '> ACCESSING MAINFRAME...<br>> NEURAL NETWORKS DEPLOYED...<br>> Just kidding, I mostly build safe models.'
        };

        terminalInput.addEventListener('keydown', function(e) {
            if (e.key === 'Enter') {
                const val = this.value.trim().toLowerCase();
                if (!val) return;
                
                // Echo command
                const cmdLine = document.createElement('div');
                cmdLine.innerHTML = `<span style="color:#888;">raj@system:~$</span> ${val}`;
                terminalOutput.appendChild(cmdLine);
                
                // Handle command
                if (val === 'clear') {
                    terminalOutput.innerHTML = '';
                } else {
                    const response = document.createElement('div');
                    response.style.marginBottom = "8px";
                    response.style.color = "#10b981";
                    
                    if (commands[val]) {
                        response.innerHTML = commands[val];
                    } else {
                        response.innerHTML = `Command not found: ${val}. Type 'help' for a list of commands.`;
                    }
                    terminalOutput.appendChild(response);
                }
                
                this.value = '';
                terminalOutput.parentElement.scrollTop = terminalOutput.parentElement.scrollHeight;
            }
        });
    }
    
    // --- Skill Network Interactivity ---
    const skillNodes = document.querySelectorAll('.skill-node');
    const skillLine = document.getElementById('skill-line');
    
    skillNodes.forEach(node => {
        node.addEventListener('mouseenter', (e) => {
            // Highlight connections
            const connectsTo = node.getAttribute('data-connect');
            if (!connectsTo) return;
            
            const targets = connectsTo.split(',');
            skillNodes.forEach(n => {
                if (n !== node) {
                    const myId = n.closest('.skill-group').id.replace('sg-', '');
                    if (targets.includes(myId)) {
                        n.classList.add('active-node');
                    }
                }
            });
            
            // Draw line
            if (skillLine) {
                const rect = node.getBoundingClientRect();
                const containerRect = node.closest('.skill-network').getBoundingClientRect();
                
                skillLine.style.top = (rect.top - containerRect.top + rect.height/2) + 'px';
                skillLine.style.opacity = '1';
            }
        });
        
        node.addEventListener('mouseleave', () => {
            skillNodes.forEach(n => n.classList.remove('active-node'));
            if (skillLine) skillLine.style.opacity = '0';
        });
    });

    // --- 3D Tilt Effect for UI Elements ---
    const tiltElements = document.querySelectorAll('.proj-visual');
    tiltElements.forEach(el => {
        el.addEventListener('mousemove', (e) => {
            const rect = el.getBoundingClientRect();
            const x = e.clientX - rect.left; // x position within the element
            const y = e.clientY - rect.top;  // y position within the element
            
            const centerX = rect.width / 2;
            const centerY = rect.height / 2;
            
            const rotateX = ((y - centerY) / centerY) * -15; // Max 15deg
            const rotateY = ((x - centerX) / centerX) * 15;
            
            el.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`;
        });
        
        el.addEventListener('mouseleave', () => {
            el.style.transform = `perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)`;
        });
    });

    // --- Mobile Menu ---
    const mobileBtn = document.getElementById('mobile-menu-btn');
    const mobileOverlay = document.getElementById('mobile-menu-overlay');
    const mobileLinks = document.querySelectorAll('#mobile-menu-overlay .nav-link');
    
    if (mobileBtn && mobileOverlay) {
        mobileBtn.addEventListener('click', () => {
            mobileOverlay.classList.toggle('active');
        });
        
        mobileLinks.forEach(link => {
            link.addEventListener('click', () => {
                mobileOverlay.classList.remove('active');
            });
        });
    }

    // --- Scroll Animations (Intersection Observer) ---
    const animatedElements = document.querySelectorAll('.scroll-fade-up, .scroll-fade-right, .scroll-fade-left, .scroll-scale, .scroll-slide-up, .scroll-draw-line');
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('is-visible');
            }
        });
    }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });

    animatedElements.forEach(el => observer.observe(el));

    // --- Fetch Data ---
    fetchGithubData();
    fetchLeetcodeData();
});

function fetchGithubData() {
    fetch('/api/activity/github')
        .then(res => res.json())
        .then(data => {
            console.log('[GitHub API]', data);
            if (data.success && (data.data.profile || data.data.status === 'connected')) {
                const p = data.data.profile || {};
                
                // Profile
                document.getElementById('gh-avatar').src = p.avatar_url;
                document.getElementById('gh-name').innerText = p.login;
                animateValue(document.getElementById('gh-repos'), 0, p.public_repos, 1500);
                animateValue(document.getElementById('gh-followers'), 0, p.followers, 1500);
                
                // Language Analytics (LED Bars)
                const langContainer = document.getElementById('gh-lang-container');
                langContainer.innerHTML = '';
                Object.keys(data.data.languages).forEach((lang, idx) => {
                    const pct = data.data.languages[lang];
                    langContainer.innerHTML += `
                        <div class="led-row">
                            <div class="led-header">
                                <span>${lang}</span>
                                <span>${pct}%</span>
                            </div>
                            <div class="led-track">
                                <div class="led-segment" style="width: 0%; transition-delay: ${idx * 200}ms;" data-width="${pct}%"></div>
                            </div>
                        </div>
                    `;
                });
                
                // Trigger LED animation after short delay
                setTimeout(() => {
                    document.querySelectorAll('.led-segment').forEach(seg => {
                        seg.style.width = seg.getAttribute('data-width');
                    });
                }, 500);
                
                // Top Repos (Glass Cards)
                const repoContainer = document.getElementById('gh-repo-list');
                repoContainer.innerHTML = '';
                data.data.repos.slice(0,4).forEach(repo => {
                    repoContainer.innerHTML += `
                        <a href="${repo.url}" target="_blank" class="repo-card">
                            <span class="repo-name">${repo.name}</span>
                            <span class="repo-stat">★ ${repo.stars} | ${repo.language || 'Code'}</span>
                        </a>
                    `;
                });
                
                // Recent Events (Terminal Stream)
                const activityContainer = document.getElementById('gh-activity-list');
                activityContainer.innerHTML = '';
                const events = data.data.activity.slice(0, 10);
                let eIdx = 0;
                
                function streamEvent() {
                    if (eIdx < events.length) {
                        const act = events[eIdx];
                        const div = document.createElement('div');
                        div.className = 'term-line';
                        div.innerHTML = `<span class="term-type">[${act.type}]</span> ${act.title}`;
                        activityContainer.appendChild(div);
                        
                        activityContainer.scrollTop = activityContainer.scrollHeight;
                        eIdx++;
                        setTimeout(streamEvent, Math.random() * 800 + 400);
                    }
                }
                setTimeout(streamEvent, 1000);
            }
        })
        .catch(err => console.error('[GitHub API Error]', err));
}

function animateValue(obj, start, end, duration, callback = null) {
    let startTimestamp = null;
    const step = (timestamp) => {
        if (!startTimestamp) startTimestamp = timestamp;
        const progress = Math.min((timestamp - startTimestamp) / duration, 1);
        const current = Math.floor(progress * (end - start) + start);
        obj.innerHTML = current;
        obj.setAttribute('data-text', current);
        if (progress < 1) {
            window.requestAnimationFrame(step);
        } else if (callback) {
            callback();
        }
    };
    window.requestAnimationFrame(step);
}

function renderHeatmap(calendar) {
    const container = document.getElementById('lc-heatmap');
    if (!container) return;
    container.innerHTML = '';
    
    // Create cells
    calendar.forEach(val => {
        const cell = document.createElement('div');
        cell.className = `heat-cell lvl-${val}`;
        container.appendChild(cell);
    });
}

function fetchLeetcodeData() {
    fetch('/api/activity/leetcode')
        .then(res => res.json())
        .then(data => {
            console.log('[LeetCode API]', data);
            if (data.success && data.data.status === 'connected') {
                const d = data.data;
                const stats = d.stats;
                
                const total = stats.All || 0;
                const easy = stats.Easy || 0;
                const med = stats.Medium || 0;
                const hard = stats.Hard || 0;
                
                // Glitch Counters
                const els = ['lc-total', 'lc-easy', 'lc-med', 'lc-hard'];
                const vals = [total, easy, med, hard];
                
                els.forEach((id, idx) => {
                    const el = document.getElementById(id);
                    if (!el) return;
                    el.classList.add('is-glitching');
                    animateValue(el, 0, vals[idx], 2000, () => {
                        el.classList.remove('is-glitching');
                        el.setAttribute('data-text', vals[idx]);
                    });
                });
                
                // Neural Rings
                const totalTarget = Math.max(total, 500);
                const cEasy = 565;
                const cMed = 440;
                const cHard = 314;
                
                setTimeout(() => {
                    const re = document.getElementById('ring-easy');
                    const rm = document.getElementById('ring-med');
                    const rh = document.getElementById('ring-hard');
                    if (re) re.style.strokeDashoffset = cEasy - (easy / totalTarget) * cEasy;
                    if (rm) rm.style.strokeDashoffset = cMed - (med / totalTarget) * cMed;
                    if (rh) rh.style.strokeDashoffset = cHard - (hard / totalTarget) * cHard;
                }, 500);
                
                // Percentages
                if (total > 0) {
                    const pe = document.getElementById('lc-pct-easy');
                    const pm = document.getElementById('lc-pct-med');
                    const ph = document.getElementById('lc-pct-hard');
                    if (pe) pe.innerText = ((easy/total)*100).toFixed(0) + '%';
                    if (pm) pm.innerText = ((med/total)*100).toFixed(0) + '%';
                    if (ph) ph.innerText = ((hard/total)*100).toFixed(0) + '%';
                }
                
                // Rank & Profile Stats
                const rankEl = document.getElementById('lc-rank');
                if (rankEl) rankEl.innerText = d.ranking ? d.ranking.toLocaleString() : 'N/A';
                
                const accEl = document.getElementById('lc-acceptance');
                if (accEl) accEl.innerText = d.acceptance_rate ? d.acceptance_rate + '%' : '--';
                
                const subsEl = document.getElementById('lc-total-subs');
                if (subsEl) subsEl.innerText = d.total_submissions ? d.total_submissions.toLocaleString() : '--';
                
                // Languages
                const langList = document.getElementById('lc-lang-list');
                if (langList && d.languages) {
                    langList.innerHTML = '';
                    d.languages.forEach(lang => {
                        langList.innerHTML += `<div class="lc-lang-item"><span class="lang-name">${lang.name}</span><span class="lang-count">${lang.solved} solved</span></div>`;
                    });
                }
                
                // Skills
                const skillsList = document.getElementById('lc-skills-list');
                if (skillsList && d.skills) {
                    skillsList.innerHTML = '';
                    d.skills.forEach(skill => {
                        skillsList.innerHTML += `<span class="lc-skill-tag ${skill.level}">${skill.name} ×${skill.count}</span>`;
                    });
                }
                
                // Recent Solves
                const recentList = document.getElementById('lc-recent-list');
                if (recentList && d.recent) {
                    recentList.innerHTML = '';
                    d.recent.forEach(sub => {
                        const date = new Date(sub.timestamp * 1000);
                        const ago = getTimeAgo(date);
                        recentList.innerHTML += `<div class="lc-recent-item"><span>${sub.title}</span><span class="recent-time">${ago}</span></div>`;
                    });
                }
                
                // Heatmap
                if (d.calendar) renderHeatmap(d.calendar);
                
                // Timestamp
                const ts = document.getElementById('api-timestamp');
                if (ts && d.last_updated) {
                    const dt = new Date(d.last_updated * 1000);
                    ts.innerText = `Live profile data • Last updated: ${dt.toLocaleTimeString()}`;
                }
            }
        })
        .catch(err => console.error('[LeetCode API Error]', err));
}

function getTimeAgo(date) {
    const seconds = Math.floor((new Date() - date) / 1000);
    if (seconds < 60) return 'just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return minutes + 'm ago';
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return hours + 'h ago';
    const days = Math.floor(hours / 24);
    if (days < 30) return days + 'd ago';
    const months = Math.floor(days / 30);
    return months + 'mo ago';
}

// --- GSAP Animations & Magnetic Buttons ---
document.addEventListener('DOMContentLoaded', () => {
    // 1. Magnetic Buttons
    const magnets = document.querySelectorAll('.nav-link, .sidebar-socials a, .cyber-btn');
    magnets.forEach((magnet) => {
        magnet.addEventListener('mousemove', function(e) {
            const position = magnet.getBoundingClientRect();
            const x = e.clientX - position.left - position.width / 2;
            const y = e.clientY - position.top - position.height / 2;
            
            magnet.style.transform = `translate(${x * 0.3}px, ${y * 0.5}px)`;
            magnet.style.transition = 'transform 0s';
        });
        
        magnet.addEventListener('mouseleave', function() {
            magnet.style.transform = 'translate(0px, 0px)';
            magnet.style.transition = 'transform 0.3s ease';
        });
    });

    // 2. GSAP ScrollTrigger
    if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined') {
        gsap.registerPlugin(ScrollTrigger);
        
        // Massive Text Scrubbing Effect
        const massiveTexts = document.querySelectorAll('.massive-text');
        massiveTexts.forEach(text => {
            // Check if not typewriter
            if (text.id !== 'hero-typewriter') {
                gsap.fromTo(text, 
                    { backgroundPosition: "200% center", color: "transparent", WebkitTextStroke: "1px rgba(255,255,255,0.2)" },
                    { 
                        backgroundPosition: "0% center",
                        color: "inherit",
                        WebkitTextStroke: "0px transparent",
                        scrollTrigger: {
                            trigger: text,
                            start: "top 90%",
                            end: "bottom 50%",
                            scrub: 1
                        }
                    }
                );
                
                // Add required CSS for the effect
                text.style.backgroundImage = "linear-gradient(90deg, var(--c-accent-cyan) 0%, var(--c-accent-blue) 50%, transparent 50%)";
                text.style.backgroundSize = "200% 100%";
                text.style.WebkitBackgroundClip = "text";
            }
        });
    }
});
