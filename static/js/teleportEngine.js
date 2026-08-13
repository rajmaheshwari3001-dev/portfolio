/**
 * Cinematic Thunder Teleportation Navigation System
 * Enhanced Edition (Audio + Branching Lightning)
 */

const TeleportTransition = {
    isTransitioning: false,
    elementsCreated: false,

    // DOM Elements
    overlay: null,
    flash: null,
    lightningContainer: null,
    appShell: null,

    init() {
        if (this.elementsCreated) return;

        this.overlay = document.createElement('div');
        this.overlay.className = 'teleport-overlay';

        this.flash = document.createElement('div');
        this.flash.className = 'teleport-flash';

        this.lightningContainer = document.createElement('div');
        this.lightningContainer.className = 'teleport-lightning-container';

        document.body.appendChild(this.overlay);
        document.body.appendChild(this.lightningContainer);
        document.body.appendChild(this.flash);

        this.appShell = document.body;
        this.elementsCreated = true;
    },

    playThunder() {
        try {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            if (!AudioContext) return;
            const ctx = new AudioContext();
            
            // Generate deep rumble (Brownian noise)
            const bufferSize = ctx.sampleRate * 1.5;
            const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
            const data = buffer.getChannelData(0);
            
            let lastOut = 0;
            for (let i = 0; i < bufferSize; i++) {
                const white = Math.random() * 2 - 1;
                data[i] = (lastOut + (0.02 * white)) / 1.02;
                lastOut = data[i];
                data[i] *= 3.5;
            }
            
            const noise = ctx.createBufferSource();
            noise.buffer = buffer;
            
            const filter = ctx.createBiquadFilter();
            filter.type = 'lowpass';
            filter.frequency.value = 400; // Deep rumble
            
            const gain = ctx.createGain();
            gain.gain.setValueAtTime(0, ctx.currentTime);
            gain.gain.linearRampToValueAtTime(1.5, ctx.currentTime + 0.05); // Impact crack
            gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 1.2); // Fade out
            
            noise.connect(filter);
            filter.connect(gain);
            gain.connect(ctx.destination);
            
            noise.start();
        } catch(e) {
            console.log("Audio skipped");
        }
    },

    generateLightning() {
        const svgns = "http://www.w3.org/2000/svg";
        const svg = document.createElementNS(svgns, "svg");
        svg.setAttribute("width", "100%");
        svg.setAttribute("height", "100%");
        
        const width = window.innerWidth;
        const height = window.innerHeight;

        // Generate 8-12 massive main branches for the Thor effect
        const numBranches = Math.floor(Math.random() * 5) + 8;
        
        for (let i = 0; i < numBranches; i++) {
            // Main branch
            const path = document.createElementNS(svgns, "path");
            path.classList.add("teleport-lightning-path");
            
            let currentX = Math.random() * width;
            let currentY = 0;
            let d = `M ${currentX} ${currentY} `;
            
            while (currentY < height) {
                currentX += (Math.random() - 0.5) * (width * 0.2);
                currentY += Math.random() * 100 + 20;
                d += `L ${currentX} ${currentY} `;
                
                // 30% chance to fork
                if (Math.random() > 0.7) {
                    const fork = document.createElementNS(svgns, "path");
                    fork.classList.add("teleport-lightning-path");
                    fork.classList.add("fork");
                    let fx = currentX;
                    let fy = currentY;
                    let fd = `M ${fx} ${fy} `;
                    for(let j=0; j<3; j++) {
                        fx += (Math.random() - 0.5) * 200;
                        fy += Math.random() * 100 + 10;
                        fd += `L ${fx} ${fy} `;
                    }
                    fork.setAttribute("d", fd);
                    svg.appendChild(fork);
                }
            }
            
            path.setAttribute("d", d);
            svg.appendChild(path);
        }

        this.lightningContainer.innerHTML = '';
        this.lightningContainer.appendChild(svg);
        
        return svg.querySelectorAll('.teleport-lightning-path');
    },

    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    },

    async charge() {
        this.init();
        this.overlay.classList.add('charging');
        await this.sleep(400);
    },

    async impact() {
        const paths = this.generateLightning();
        paths.forEach(p => p.classList.add('strike'));
        
        this.flash.classList.add('impact');
        this.appShell.classList.add('teleport-shake');
        
        // Play generative thunder rumble
        this.playThunder();

        await this.sleep(50);
    },

    async reveal() {
        await this.sleep(300);
        
        this.overlay.classList.remove('charging');
        this.flash.classList.remove('impact');
        this.appShell.classList.remove('teleport-shake');
        this.lightningContainer.innerHTML = '';
        
        await this.sleep(300);
    },

    async go(targetSelector, scrollEngine) {
        if (this.isTransitioning) return;
        
        const targetEl = document.querySelector(targetSelector);
        if (!targetEl) return false;

        this.isTransitioning = true;

        try {
            await this.charge();
            await this.impact();
            
            if (scrollEngine) {
                scrollEngine.scrollTo(targetSelector, { offset: -50, duration: 0.1 });
            } else {
                targetEl.scrollIntoView({ behavior: 'auto' });
            }

            await this.reveal();
        } catch (error) {
            console.error(error);
        } finally {
            this.isTransitioning = false;
        }
        return true;
    }
};
