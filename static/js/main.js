document.addEventListener('DOMContentLoaded', () => {
    // --- Smooth Scroll (Lenis) ---
    window.lenis = new Lenis({
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
        window.lenis.raf(time);
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
            'help': 'Available commands:<br>- whoami: Information about Raj<br>- skills: List of core competencies<br>- ls: List directory contents<br>- cat resume.txt: View resume<br>- clear: Clear terminal<br>- sudo: Gain root access<br>- hack: Initialize neural interface',
            'whoami': 'Raj Maheshwari<br>AI/ML Developer & Software Engineer<br>Status: Building intelligent systems.',
            'skills': '> Loading matrix...<br>[OK] Python, Machine Learning, Data Science<br>[OK] Flask, Web Development<br>[OK] Problem Solving (LeetCode: 60+)',
            'hack': '> ACCESSING MAINFRAME...<br>> NEURAL NETWORKS DEPLOYED...<br>> Just kidding, I mostly build safe models.',
            'ls': 'drwxr-xr-x  projects/<br>drwxr-xr-x  models/<br>-rw-r--r--  resume.txt<br>-rw-------  secret_keys.env',
            'cat resume.txt': 'Loading resume...<br>Raj Maheshwari - B.Tech AI/ML @ GLA University.<br>Building Full-Stack ML Apps. Scroll down for more.',
            'cat secret_keys.env': 'Permission denied. Nice try! 😉',
            'sudo': 'raj@system is not in the sudoers file. This incident will be reported.'
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
                const teleportSections = ['projects', 'about', 'journey', 'contact', 'skills', 'activity', 'hero'];
                if (val === 'clear') {
                    terminalOutput.innerHTML = '';
                } else if (teleportSections.includes(val)) {
                    // Thor Teleportation!
                    let oldFlash = document.getElementById('thor-flash-overlay');
                    if (oldFlash) oldFlash.remove();
                    
                    let flash = document.createElement('div');
                    flash.id = 'thor-flash-overlay';
                    flash.className = 'thor-flash thor-striking';
                    document.body.appendChild(flash);
                    
                    // Trigger screen shake on the smooth-wrapper for maximum impact without scrollbar glitches
                    const shakeWrapper = document.getElementById('smooth-wrapper') || document.body;
                    shakeWrapper.classList.remove('screen-shake');
                    
                    // Use requestAnimationFrame to ensure the class removal is processed before re-adding
                    requestAnimationFrame(() => {
                        requestAnimationFrame(() => {
                            shakeWrapper.classList.add('screen-shake');
                            setTimeout(() => shakeWrapper.classList.remove('screen-shake'), 600);
                        });
                    });
                    
                    const response = document.createElement('div');
                    response.style.marginBottom = "8px";
                    response.style.color = "#06b6d4";
                    response.innerHTML = `> INITIATING BIFROST TELEPORT TO /${val.toUpperCase()}...`;
                    terminalOutput.appendChild(response);
                    
                    // Wait for the peak of the flash (approx 150ms) to scroll
                    setTimeout(() => {
                        this.blur(); // Remove focus to prevent browser snapping back
                        const targetSection = document.getElementById(val);
                        if (targetSection && window.lenis) {
                            window.lenis.scrollTo('#' + val, { duration: 1.5, easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)) });
                        } else if (targetSection) {
                            targetSection.scrollIntoView({ behavior: 'smooth' });
                        }
                    }, 150);

                } else {
                    const response = document.createElement('div');
                    response.style.marginBottom = "8px";
                    response.style.color = "#10b981";
                    
                    // Simple easter egg check
                    let outputText = commands[val];
                    if (!outputText) {
                        if (val.startsWith('cat ')) {
                            outputText = `cat: ${val.split(' ')[1]}: No such file or directory`;
                        } else {
                            outputText = `Command not found: ${val}. Type 'help' for a list of commands.`;
                        }
                    }
                    
                    // Small delay to simulate processing
                    setTimeout(() => {
                        response.innerHTML = outputText;
                        terminalOutput.appendChild(response);
                        terminalOutput.parentElement.scrollTop = terminalOutput.parentElement.scrollHeight;
                    }, 150);
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

    // --- Mobile Nav Scroll Animation & ScrollSpy ---
    const topNav = document.getElementById('mobile-nav');
    const bottomNav = document.getElementById('mobile-bottom-nav');
    
    if (topNav || bottomNav) {
        let lastScrollY = window.scrollY;
        let ticking = false;
        
        if (topNav) topNav.style.transition = 'transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)';
        if (bottomNav) bottomNav.style.transition = 'transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)';
        
        window.addEventListener('scroll', () => {
            if (!ticking) {
                window.requestAnimationFrame(() => {
                    const currentScrollY = window.scrollY;
                    
                    if (currentScrollY > lastScrollY && currentScrollY > 100) {
                        // Scrolling down - hide
                        if (topNav) topNav.style.transform = 'translateY(-100%)';
                        if (bottomNav) bottomNav.style.transform = 'translate(-50%, 150%)';
                    } else {
                        // Scrolling up - show
                        if (topNav) topNav.style.transform = 'translateY(0)';
                        if (bottomNav) bottomNav.style.transform = 'translate(-50%, 0)';
                    }
                    
                    lastScrollY = currentScrollY;
                    ticking = false;
                });
                ticking = true;
            }
        });
    }

    // Update active state and indicator on scroll for bottom nav
    const sections = document.querySelectorAll('section.chapter');
    const bottomNavLinks = document.querySelectorAll('.bottom-nav-link');
    const navIndicator = document.querySelector('.nav-indicator');
    
    function updateNavIndicator(activeLink) {
        if (!activeLink || !navIndicator || !bottomNav) return;
        
        const navRect = bottomNav.getBoundingClientRect();
        const linkRect = activeLink.getBoundingClientRect();
        
        // Calculate the left position relative to the parent nav container
        const leftPos = linkRect.left - navRect.left + (linkRect.width / 2) - (50 / 2); // 50px is indicator width
        navIndicator.style.left = `${leftPos}px`;
    }

    bottomNavLinks.forEach(link => {
        link.addEventListener('click', function() {
            bottomNavLinks.forEach(l => l.classList.remove('active'));
            this.classList.add('active');
            updateNavIndicator(this);
        });
    });
    
    if (sections.length > 0 && bottomNavLinks.length > 0) {
        const observerOptions = {
            root: null,
            rootMargin: '-50% 0px -50% 0px',
            threshold: 0
        };
        
        const sectionObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const currentId = entry.target.getAttribute('id');
                    
                    bottomNavLinks.forEach(link => {
                        if (link.getAttribute('href') === `#${currentId}`) {
                            if (!link.classList.contains('active')) {
                                bottomNavLinks.forEach(l => l.classList.remove('active'));
                                link.classList.add('active');
                                updateNavIndicator(link);
                            }
                        }
                    });
                }
            });
        }, observerOptions);
        
        sections.forEach(sec => {
            if (sec.getAttribute('id')) {
                sectionObserver.observe(sec);
            }
        });

        // Initialize indicator position after layout is complete
        window.addEventListener('load', () => {
            setTimeout(() => {
                const activeLink = document.querySelector('.bottom-nav-link.active') || bottomNavLinks[0];
                updateNavIndicator(activeLink);
            }, 500);
        });
        
        // Handle window resize which might shift link positions
        window.addEventListener('resize', () => {
            const activeLink = document.querySelector('.bottom-nav-link.active');
            if (activeLink) updateNavIndicator(activeLink);
        });
    }

    // --- Scroll Animations (Intersection Observer) ---
    const animatedElements = document.querySelectorAll('.scroll-fade-up, .scroll-fade-right, .scroll-fade-left, .scroll-scale, .scroll-slide-up, .scroll-draw-line, .scroll-blur-in, .scroll-rotate-in');
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('is-visible');
            }
        });
    }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });

    animatedElements.forEach(el => observer.observe(el));

    // --- Animated Counters ---
    const counterElements = document.querySelectorAll('.animated-counter');
    const counterObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const el = entry.target;
                if (!el.dataset.animated) {
                    el.dataset.animated = 'true';
                    const target = parseInt(el.getAttribute('data-target')) || 0;
                    if (target > 0) {
                        if (el.classList.contains('glitch-text')) {
                            el.classList.add('is-glitching');
                            animateValue(el, 0, target, 2000, () => {
                                el.classList.remove('is-glitching');
                                el.setAttribute('data-text', target);
                            });
                        } else {
                            animateValue(el, 0, target, 2000);
                        }
                    }
                }
            }
        });
    }, { threshold: 0.1 });
    
    counterElements.forEach(el => counterObserver.observe(el));

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
                    el.setAttribute('data-target', vals[idx]);
                    if (el.dataset.animated === 'true') {
                        el.classList.add('is-glitching');
                        animateValue(el, 0, vals[idx], 2000, () => {
                            el.classList.remove('is-glitching');
                            el.setAttribute('data-text', vals[idx]);
                        });
                    }
                });
                
                // Chart.js Doughnut for Solved Stats
                const ctxDoughnut = document.getElementById('lcDoughnutChart');
                if (ctxDoughnut) {
                    new Chart(ctxDoughnut, {
                        type: 'doughnut',
                        data: {
                            labels: ['Easy', 'Medium', 'Hard'],
                            datasets: [{
                                data: [easy, med, hard],
                                backgroundColor: ['#10b981', '#f59e0b', '#f43f5e'],
                                borderColor: 'rgba(5, 5, 5, 1)',
                                borderWidth: 3,
                                hoverOffset: 8
                            }]
                        },
                        options: {
                            responsive: true,
                            maintainAspectRatio: false,
                            cutout: '75%',
                            plugins: {
                                legend: { display: false },
                                tooltip: {
                                    backgroundColor: 'rgba(0,0,0,0.8)',
                                    titleFont: { family: "'Space Grotesk', sans-serif" },
                                    bodyFont: { family: "'Space Grotesk', sans-serif" }
                                }
                            }
                        }
                    });
                }
                
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
                
                // Chart.js Radar for Skill Matrix
                const ctxRadar = document.getElementById('lcRadarChart');
                if (ctxRadar && d.skills) {
                    const topSkills = d.skills.slice(0, 6);
                    new Chart(ctxRadar, {
                        type: 'radar',
                        data: {
                            labels: topSkills.map(s => s.name.toUpperCase()),
                            datasets: [{
                                label: 'Problems Solved',
                                data: topSkills.map(s => s.count),
                                backgroundColor: 'rgba(37, 99, 235, 0.2)',
                                borderColor: 'rgba(37, 99, 235, 1)',
                                pointBackgroundColor: '#06b6d4',
                                pointBorderColor: '#fff',
                                pointHoverBackgroundColor: '#fff',
                                pointHoverBorderColor: '#06b6d4',
                                borderWidth: 2,
                            }]
                        },
                        options: {
                            responsive: true,
                            maintainAspectRatio: false,
                            scales: {
                                r: {
                                    angleLines: { color: 'rgba(255, 255, 255, 0.1)' },
                                    grid: { color: 'rgba(255, 255, 255, 0.1)' },
                                    pointLabels: {
                                        color: 'rgba(255, 255, 255, 0.7)',
                                        font: { family: "'Space Grotesk', sans-serif", size: 10 }
                                    },
                                    ticks: { display: false }
                                }
                            },
                            plugins: {
                                legend: { display: false },
                                tooltip: { backgroundColor: 'rgba(0,0,0,0.8)' }
                            }
                        }
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
            // Check if not typewriter and not text-outline
            if (text.id !== 'hero-typewriter' && !text.classList.contains('text-outline')) {
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

// --- Luxury AI Sentiment Inference ---
document.addEventListener('DOMContentLoaded', () => {
    const input = document.getElementById('ai-sentiment-input');
    const label = document.getElementById('ai-prediction-label');
    const bar = document.getElementById('ai-confidence-bar');
    const val = document.getElementById('ai-confidence-val');
    
    if (!input || !label || !bar || !val) return;
    
    // Simple heuristic dictionary for demonstration
    const positiveWords = ['good', 'great', 'awesome', 'excellent', 'amazing', 'love', 'perfect', 'beautiful', 'luxury', 'premium'];
    const negativeWords = ['bad', 'terrible', 'awful', 'poor', 'worst', 'hate', 'ugly', 'cheap', 'broken'];
    
    let timeout = null;
    
    input.addEventListener('input', (e) => {
        clearTimeout(timeout);
        const text = e.target.value.toLowerCase();
        
        if (text.trim() === '') {
            label.innerText = 'WAITING...';
            label.style.color = '#fff';
            bar.style.width = '0%';
            val.innerText = '0.00%';
            return;
        }
        
        // Simulate processing delay for "luxury" feel
        label.innerText = 'PROCESSING TENSORS...';
        label.style.color = '#d4af37'; // Champagne
        
        timeout = setTimeout(() => {
            const words = text.split(/\s+/);
            let score = 0;
            
            words.forEach(word => {
                if (positiveWords.includes(word)) score += 1;
                if (negativeWords.includes(word)) score -= 1;
            });
            
            // Calculate a fake confidence between 65% and 99%
            const baseConfidence = 65 + Math.random() * 25;
            let finalConfidence = baseConfidence + (Math.abs(score) * 5);
            if (finalConfidence > 99.9) finalConfidence = 99.9;
            
            if (score > 0) {
                label.innerText = 'POSITIVE';
                label.style.color = '#10b981'; // Emerald
                bar.style.background = 'linear-gradient(90deg, #10b981, #d4af37)';
            } else if (score < 0) {
                label.innerText = 'NEGATIVE';
                label.style.color = '#ef4444'; // Rose
                bar.style.background = 'linear-gradient(90deg, #ef4444, #d4af37)';
            } else {
                label.innerText = 'NEUTRAL';
                label.style.color = '#b0b0b0'; // Silver
                bar.style.background = 'linear-gradient(90deg, #b0b0b0, #d4af37)';
                finalConfidence = 45 + Math.random() * 10; // Lower confidence for neutral
            }
            
            bar.style.width = `${finalConfidence}%`;
            val.innerText = `${finalConfidence.toFixed(2)}%`;
            
        }, 600); // 600ms fake processing delay
    });
});

// --- Hero Video GSAP Scroll Animation ---
document.addEventListener('DOMContentLoaded', () => {
    if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined') {
        gsap.registerPlugin(ScrollTrigger);
        
        const heroVideo = document.getElementById('hero-bg-video');
        if (heroVideo) {
            // Fade out the video and parallax it slightly on scroll
            gsap.to(heroVideo, {
                scrollTrigger: {
                    trigger: "#hero",
                    start: "top top",
                    end: "bottom top",
                    scrub: true
                },
                opacity: 0,
                y: 150, // Slight parallax effect downwards
                ease: "none"
            });
        }
    }
});

// --- Page Load & Scroll Handling ---
// Force scroll to top before unload and on load
window.addEventListener('beforeunload', () => {
    window.scrollTo(0, 0);
});

// Remove any hash from the URL on load to prevent auto-scrolling
if (window.location.hash) {
    window.history.replaceState('', document.title, window.location.pathname + window.location.search);
}

// --- Desktop Sidebar Toggle & Auto-Collapse ---
document.addEventListener('DOMContentLoaded', () => {
    // 1. Force scroll to top on load (smoothly)
    if (history.scrollRestoration) {
        history.scrollRestoration = 'manual';
    }
    window.scrollTo(0, 0);

    const desktopToggleBtn = document.getElementById('desktop-sidebar-toggle');
    const sidebar = document.getElementById('sidebar');
    
    if (desktopToggleBtn) {
        desktopToggleBtn.addEventListener('click', () => {
            document.body.classList.toggle('sidebar-collapsed');
        });
    }

    // 2. Collapse sidebar automatically on first mouse leave (with smooth delay)
    if (sidebar) {
        const onFirstMouseLeave = () => {
            // Add a small delay so it doesn't feel like a sudden glitch
            setTimeout(() => {
                document.body.classList.add('sidebar-collapsed');
            }, 400);
            sidebar.removeEventListener('mouseleave', onFirstMouseLeave);
        };
        sidebar.addEventListener('mouseleave', onFirstMouseLeave);
    }

    // --- Interactive System Terminal ---
    const termInput = document.getElementById('terminal-input');
    const termBody = document.getElementById('terminal-body');
    
    if (termInput && termBody) {
        // Focus input when clicking anywhere on the terminal
        const terminalContainer = document.querySelector('.interactive-terminal');
        if (terminalContainer) {
            terminalContainer.addEventListener('click', () => {
                termInput.focus();
            });
        }

        const appendLine = (htmlContent) => {
            const div = document.createElement('div');
            div.className = 'term-line';
            div.innerHTML = htmlContent;
            termBody.appendChild(div);
            termBody.scrollTop = termBody.scrollHeight;
        };

        termInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                const cmd = termInput.value.trim().toLowerCase();
                termInput.value = '';
                
                if (!cmd) return;

                // Echo command
                const echo = document.createElement('div');
                echo.className = 'term-line cmd-echo';
                echo.innerHTML = `<span class="term-prompt">raj@system:~$</span> ${cmd}`;
                termBody.appendChild(echo);

                // Process command
                switch (cmd) {
                    case 'help':
                        appendLine(`Available commands:<br>
                        <span class="term-highlight">about</span> - Teleport to About section<br>
                        <span class="term-highlight">projects</span> - Teleport to Projects section<br>
                        <span class="term-highlight">journey</span> - Teleport to Timeline section<br>
                        <span class="term-highlight">contact</span> - Teleport to Contact section<br>
                        <span class="term-highlight">whoami</span> - Display user info<br>
                        <span class="term-highlight">clear</span> - Clear terminal output`);
                        break;
                    case 'about':
                    case 'go about':
                        appendLine(`Initiating teleport sequence to <span class="term-highlight">ABOUT</span>...`);
                        lenis.scrollTo('#about', { offset: -50 });
                        break;
                    case 'projects':
                    case 'go projects':
                    case 'work':
                        appendLine(`Initiating teleport sequence to <span class="term-highlight">PROJECTS</span>...`);
                        lenis.scrollTo('#projects', { offset: -50 });
                        break;
                    case 'journey':
                    case 'timeline':
                    case 'go journey':
                        appendLine(`Initiating teleport sequence to <span class="term-highlight">JOURNEY</span>...`);
                        lenis.scrollTo('#journey', { offset: -50 });
                        break;
                    case 'contact':
                    case 'go contact':
                        appendLine(`Initiating teleport sequence to <span class="term-highlight">CONTACT</span>...`);
                        lenis.scrollTo('#contact', { offset: -50 });
                        break;
                    case 'whoami':
                        appendLine(`RAJ MAHESHWARI<br>AI/ML Developer building intelligent software systems.`);
                        break;
                    case 'clear':
                        termBody.innerHTML = '';
                        break;
                    case 'sudo':
                        appendLine(`Nice try. This incident will be reported.`);
                        break;
                    default:
                        appendLine(`Command not found: ${cmd}. Type <span class="term-highlight">help</span> for a list of commands.`);
                }
                termBody.scrollTop = termBody.scrollHeight;
            }
        });
    }
});
