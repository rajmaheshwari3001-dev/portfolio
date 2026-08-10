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
        
        // Smooth interpolation
        scrollY += (targetScrollY - scrollY) * 0.05;
        mouseX += (targetMouseX - mouseX) * 0.05;
        mouseY += (targetMouseY - mouseY) * 0.05;

        // Subtle camera movement based on scroll and mouse
        camera.position.y = 10 - scrollY * 0.005 + (mouseY * 2);
        camera.position.x = mouseX * 5;
        camera.lookAt(0, 0, 0);

        const posAttr = particles.geometry.attributes.position;
        let i = 0;
        
        // Liquid wave math
        for (let ix = 0; ix < AMOUNTX; ix++) {
            for (let iy = 0; iy < AMOUNTY; iy++) {
                // Generate fluid-like wave using combined sine waves
                posAttr.array[i * 3 + 1] = (Math.sin((ix + count) * 0.3) * 2) +
                                           (Math.sin((iy + count) * 0.5) * 2) + 
                                           (Math.sin((ix + iy + count) * 0.2) * 1.5);
                i++;
            }
        }
        
        posAttr.needsUpdate = true;
        count += 0.03;

        renderer.render(scene, camera);
    }
    
    animate();

    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    });
});
