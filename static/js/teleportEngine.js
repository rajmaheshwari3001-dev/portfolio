/**
 * Cinematic Thunder Teleportation Navigation System
 * Reusable transition engine for Marvel-style energy arrivals.
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

        // Create overlay
        this.overlay = document.createElement('div');
        this.overlay.className = 'teleport-overlay';

        // Create flash
        this.flash = document.createElement('div');
        this.flash.className = 'teleport-flash';

        // Create lightning container
        this.lightningContainer = document.createElement('div');
        this.lightningContainer.className = 'teleport-lightning-container';

        // Append to body
        document.body.appendChild(this.overlay);
        document.body.appendChild(this.lightningContainer);
        document.body.appendChild(this.flash);

        // Define the app shell for shaking (wrap body contents if needed, or just shake body)
        // Shaking the entire body is easiest without structural changes
        this.appShell = document.body;

        this.elementsCreated = true;
    },

    generateLightning() {
        const svgns = "http://www.w3.org/2000/svg";
        const svg = document.createElementNS(svgns, "svg");
        svg.setAttribute("width", "100%");
        svg.setAttribute("height", "100%");
        
        const width = window.innerWidth;
        const height = window.innerHeight;

        // Generate 3-5 random jagged lightning branches
        const numBranches = Math.floor(Math.random() * 3) + 3;
        
        for (let i = 0; i < numBranches; i++) {
            const path = document.createElementNS(svgns, "path");
            path.classList.add("teleport-lightning-path");
            
            let d = `M ${Math.random() * width} 0 `;
            let currentX = Math.random() * width;
            let currentY = 0;
            
            while (currentY < height) {
                currentX += (Math.random() - 0.5) * 150;
                currentY += Math.random() * 150 + 50;
                d += `L ${currentX} ${currentY} `;
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
        
        // State: CHARGING
        this.overlay.classList.add('charging');
        
        // Wait for energy buildup
        await this.sleep(400);
    },

    async impact() {
        // State: IMPACT
        
        // 1. Generate and strike lightning
        const paths = this.generateLightning();
        paths.forEach(p => p.classList.add('strike'));
        
        // 2. Flash screen
        this.flash.classList.add('impact');
        
        // 3. Screen shake
        this.appShell.classList.add('teleport-shake');

        // The exact moment of blindness is ~50ms into the flash
        await this.sleep(50);
    },

    async reveal() {
        // State: REVEAL
        
        // Wait for flash and shake to mostly finish
        await this.sleep(300);
        
        // Clean up classes
        this.overlay.classList.remove('charging');
        this.flash.classList.remove('impact');
        this.appShell.classList.remove('teleport-shake');
        this.lightningContainer.innerHTML = '';
        
        // Allow fade out
        await this.sleep(300);
    },

    async go(targetSelector, scrollEngine) {
        // Prevent double execution
        if (this.isTransitioning) return;
        
        // Check if target exists
        const targetEl = document.querySelector(targetSelector);
        if (!targetEl) {
            console.error(`Teleport target ${targetSelector} not found.`);
            return false;
        }

        this.isTransitioning = true;

        try {
            await this.charge();
            await this.impact();
            
            // Navigate strictly during the blind spot of the flash
            if (scrollEngine) {
                scrollEngine.scrollTo(targetSelector, { offset: -50, duration: 0.1 });
            } else {
                targetEl.scrollIntoView({ behavior: 'auto' });
            }

            await this.reveal();
        } catch (error) {
            console.error("Teleportation sequence failed:", error);
        } finally {
            this.isTransitioning = false;
        }
        
        return true;
    }
};
