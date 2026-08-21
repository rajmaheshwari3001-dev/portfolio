document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('neural-canvas');
    if (!canvas) return;

    // --- Scene Setup ---
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x050505, 0.04);

    const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 1, 1000);
    // Position camera looking down slightly at the wave
    camera.position.set(0, 15, 30);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({
        canvas: canvas,
        alpha: true,
        antialias: true,
        powerPreference: "high-performance"
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    // --- The Luxury Wave (Fluid Particles) ---
    const waveGroup = new THREE.Group();
    scene.add(waveGroup);

    const SEPARATION = 1.2;
    const AMOUNTX = 60;
    const AMOUNTY = 60;
    const numParticles = AMOUNTX * AMOUNTY;

    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(numParticles * 3);
    const colors = new Float32Array(numParticles * 3);

    // Subtle Champagne Gold and Silver for the wave
    const colorSilver = new THREE.Color(0xb0b0b0);
    const colorChampagne = new THREE.Color(0xd4af37);

    let i = 0;
    for (let ix = 0; ix < AMOUNTX; ix++) {
        for (let iy = 0; iy < AMOUNTY; iy++) {
            positions[i * 3] = ix * SEPARATION - ((AMOUNTX * SEPARATION) / 2);
            positions[i * 3 + 1] = 0;
            positions[i * 3 + 2] = iy * SEPARATION - ((AMOUNTY * SEPARATION) / 2) - 10;

            // Mix colors randomly
            const mixRatio = Math.random();
            const c = colorSilver.clone().lerp(colorChampagne, mixRatio * 0.4); // Mostly silver with hints of champagne
            
            colors[i * 3] = c.r;
            colors[i * 3 + 1] = c.g;
            colors[i * 3 + 2] = c.b;

            i++;
        }
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    // We use a canvas texture for soft, glowing circular particles instead of harsh squares
    const createCircleTexture = () => {
        const canvas = document.createElement('canvas');
        canvas.width = 32;
        canvas.height = 32;
        const context = canvas.getContext('2d');
        const gradient = context.createRadialGradient(16, 16, 0, 16, 16, 16);
        gradient.addColorStop(0, 'rgba(255,255,255,1)');
        gradient.addColorStop(0.2, 'rgba(255,255,255,0.8)');
        gradient.addColorStop(0.5, 'rgba(255,255,255,0.2)');
        gradient.addColorStop(1, 'rgba(0,0,0,0)');
        context.fillStyle = gradient;
        context.fillRect(0, 0, 32, 32);
        return new THREE.CanvasTexture(canvas);
    };

    const material = new THREE.PointsMaterial({
        size: 0.6,
        vertexColors: true,
        transparent: true,
        opacity: 0.7,
        map: createCircleTexture(),
        depthWrite: false,
        blending: THREE.AdditiveBlending
    });

    const particles = new THREE.Points(geometry, material);
    waveGroup.add(particles);

    // --- Interactive Mouse Physics ---
    let mouseX = 0;
    let mouseY = 0;
    let targetX = 0;
    let targetY = 0;
    
    document.addEventListener('mousemove', (event) => {
        mouseX = (event.clientX - window.innerWidth / 2);
        mouseY = (event.clientY - window.innerHeight / 2);
    });

    // --- Mouse & Scroll Physics ---
    let scrollY = 0;
    let targetScrollY = 0;
    let mouseX = 0;
    let mouseY = 0;
    let targetMouseX = 0;
    let targetMouseY = 0;

    window.addEventListener('scroll', () => {
        targetScrollY = window.scrollY;
    });

    document.addEventListener('mousemove', (event) => {
        targetMouseX = (event.clientX / window.innerWidth) * 2 - 1;
        targetMouseY = -(event.clientY / window.innerHeight) * 2 + 1;
    });

    // --- Animation Loop ---
    let count = 0;

    function animate() {
        requestAnimationFrame(animate);
        

        count += 0.05;
        
        // Smooth mouse interpolation
        mouseX += (targetMouseX - mouseX) * 0.05;
        mouseY += (targetMouseY - mouseY) * 0.05;
        
        targetX = mouseX * 0.001;
        targetY = mouseY * 0.001;

        const positions = particles.geometry.attributes.position.array;

        let i = 0;
        for (let ix = 0; ix < AMOUNTX; ix++) {
            for (let iy = 0; iy < AMOUNTY; iy++) {
                // Base wave calculation
                let waveZ = (Math.sin((ix + count) * 0.3) * 2) +
                           (Math.sin((iy + count) * 0.5) * 2);
                           
                // Add interactive mouse distortion
                const distX = (ix - AMOUNTX/2) * SEPARATION - (mouseX * 0.05);
                const distY = (iy - AMOUNTY/2) * SEPARATION + (mouseY * 0.05);
                const dist = Math.sqrt(distX*distX + distY*distY);
                
                // If close to mouse, push the wave down/up
                if (dist < 15) {
                    waveZ -= (15 - dist) * 0.5;
                }

                positions[i * 3 + 1] = waveZ;
                i++;
            }
        }

        particles.geometry.attributes.position.needsUpdate = true;
        
        // Slight camera tilt based on mouse
        camera.position.x += (mouseX * 0.01 - camera.position.x) * 0.05;
        camera.position.y += (-mouseY * 0.01 + 15 - camera.position.y) * 0.05;
        camera.lookAt(scene.position);

        renderer.render(scene, camera);
    }
    
    animate();

    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    });
});
