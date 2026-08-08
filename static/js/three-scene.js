document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('neural-canvas');
    if (!canvas) return;

    // --- Scene Setup ---
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x000000, 0.05);

    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 15;

    const renderer = new THREE.WebGLRenderer({
        canvas: canvas,
        alpha: true,
        antialias: true,
        powerPreference: "high-performance"
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    // --- The Neural Core (Cinematic 3D Object) ---
    const coreGroup = new THREE.Group();
    scene.add(coreGroup);

    // 1. Core Sphere (Inner Energy)
    const icosahedronGeo = new THREE.IcosahedronGeometry(3, 2);
    const coreMat = new THREE.MeshBasicMaterial({ 
        color: 0x06b6d4, 
        wireframe: true, 
        transparent: true, 
        opacity: 0.15 
    });
    const coreMesh = new THREE.Mesh(icosahedronGeo, coreMat);
    coreGroup.add(coreMesh);

    // 2. Data Particles
    const particleCount = window.innerWidth < 768 ? 1000 : 3000;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    const targetPositions = new Float32Array(particleCount * 3);

    const color1 = new THREE.Color(0x06b6d4); // Cyan
    const color2 = new THREE.Color(0x10b981); // Emerald

    for (let i = 0; i < particleCount; i++) {
        // Random spherical distribution
        const r = 4 + Math.random() * 10;
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos((Math.random() * 2) - 1);
        
        positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
        positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
        positions[i * 3 + 2] = r * Math.cos(phi);
        
        // Save target for morphing/glitching
        targetPositions[i * 3] = positions[i * 3];
        targetPositions[i * 3 + 1] = positions[i * 3 + 1];
        targetPositions[i * 3 + 2] = positions[i * 3 + 2];

        const mixRatio = Math.random();
        const c = color1.clone().lerp(color2, mixRatio);
        
        colors[i * 3] = c.r;
        colors[i * 3 + 1] = c.g;
        colors[i * 3 + 2] = c.b;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const material = new THREE.PointsMaterial({
        size: 0.05,
        vertexColors: true,
        transparent: true,
        opacity: 0.8,
        blending: THREE.AdditiveBlending
    });

    const particles = new THREE.Points(geometry, material);
    coreGroup.add(particles);

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
    const clock = new THREE.Clock();

    function animate() {
        requestAnimationFrame(animate);
        const elapsedTime = clock.getElapsedTime();
        
        // Smooth interpolation for scroll and mouse
        scrollY += (targetScrollY - scrollY) * 0.05;
        mouseX += (targetMouseX - mouseX) * 0.05;
        mouseY += (targetMouseY - mouseY) * 0.05;

        // 1. Scroll Physics (Depth & Parallax)
        // Pushes the camera down and rotates the core based on scroll depth
        camera.position.y = -scrollY * 0.005;
        camera.position.z = 15 + scrollY * 0.002;
        
        // 2. Cinematic Core Rotation
        coreGroup.rotation.y = elapsedTime * 0.1 + (mouseX * 0.5);
        coreGroup.rotation.x = (mouseY * 0.5) + (scrollY * 0.001);
        coreMesh.rotation.y = -elapsedTime * 0.2;
        coreMesh.rotation.z = elapsedTime * 0.1;

        // 3. Particle Pulse (Breathing effect)
        const posAttr = particles.geometry.attributes.position;
        const pulse = Math.sin(elapsedTime * 2) * 0.1;
        
        for(let i=0; i<particleCount; i++) {
            const ix = i*3;
            // Add subtle noise/breathing
            posAttr.array[ix] = targetPositions[ix] + Math.sin(elapsedTime + ix)*pulse;
            posAttr.array[ix+1] = targetPositions[ix+1] + Math.cos(elapsedTime + ix)*pulse;
        }
        posAttr.needsUpdate = true;

        renderer.render(scene, camera);
    }
    
    animate();

    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    });
});
