// --- INTRO SEQUENCE (PHYSICS CURTAIN) ---
window.addEventListener('load', () => {
    const counterElement = document.getElementById('day-counter');
    const introOverlay = document.getElementById('intro-overlay');
    const heroElements = document.querySelector('.hero-content');
    
    if(!counterElement || !introOverlay || !heroElements) return;

    heroElements.style.opacity = '0';
    heroElements.style.transform = 'translateY(30px)';
    
    // Performance: Avoid excessive blur calculation during load
    // heroElements.style.filter = 'blur(10px)'; 
    
    heroElements.style.transition = 'opacity 1.5s ease 0.5s, transform 1.5s ease 0.5s';

    let currentDay = 0;
    const targetDay = 365;
    const easeOutQuad = (t) => t * (2 - t);
    
    let startTime = null;
    const duration = 2000; // Speed up slightly for UX

    function updateCounter(timestamp) {
        if (!startTime) startTime = timestamp;
        const progress = Math.min((timestamp - startTime) / duration, 1);
        const easedProgress = easeOutQuad(progress);
        
        currentDay = Math.floor(easedProgress * targetDay);
        counterElement.innerText = currentDay;

        if (progress < 1) {
            requestAnimationFrame(updateCounter);
        } else {
            counterElement.innerText = targetDay;
            setTimeout(() => { finishIntro(); }, 200);
        }
    }
    requestAnimationFrame(updateCounter);

    function finishIntro() {
        introOverlay.classList.add('fade-text');
        setTimeout(() => {
            introOverlay.classList.add('open-curtains');
            heroElements.style.opacity = '1';
            heroElements.style.transform = 'translateY(0)';
        }, 500);
        setTimeout(() => {
            introOverlay.classList.add('finished');
            introOverlay.style.display = 'none'; // Optimize: remove from render tree
        }, 2800); 
    }
});

// --- SCROLL & PARALLAX ---
const timelineProgress = document.getElementById('timeline-progress');
const timelineContainer = document.querySelector('.timeline-container');
const parallaxElements = document.querySelectorAll('.parallax-element');

let isScrolling = false;

// Optimization: Throttle scroll event to just set a flag
window.addEventListener('scroll', () => { isScrolling = true; }, { passive: true });

function updateLoop() {
    if (isScrolling) {
        isScrolling = false;
        
        const scrollY = window.scrollY;
        const winHeight = window.innerHeight;

        if (timelineContainer && timelineProgress) {
            const containerTop = timelineContainer.offsetTop;
            const containerHeight = timelineContainer.offsetHeight;
            const scrollPosition = scrollY + (winHeight / 2);
            let progress = (scrollPosition - containerTop) / containerHeight;
            progress = Math.max(0, Math.min(1, progress));
            timelineProgress.style.height = (progress * 100) + '%';
        }

        if (parallaxElements.length > 0) {
            parallaxElements.forEach(el => {
                const rect = el.getBoundingClientRect();
                // Optimization: Only animate if in viewport
                if (rect.top < winHeight && rect.bottom > 0) {
                    const speed = parseFloat(el.getAttribute('data-speed')) || 0.05;
                    const distanceFromCenter = (winHeight / 2) - (rect.top + rect.height / 2);
                    el.style.transform = `translateY(${distanceFromCenter * speed}px)`;
                }
            });
        }
    }
    requestAnimationFrame(updateLoop);
}
requestAnimationFrame(updateLoop);


// --- THEME OBSERVER ---
// Optimization: Higher threshold to prevent rapid flickering
const themeObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if(entry.isIntersecting) {
            entry.target.classList.add('visible');
            const accent = entry.target.getAttribute('data-theme-accent');
            if(accent) {
                document.documentElement.style.setProperty('--accent-gold', accent);
            }
        }
    });
}, { threshold: 0.2 });

document.querySelectorAll('.story-section, .hero').forEach(section => {
    themeObserver.observe(section);
});

// --- LIGHTBOX & CONFETTI ---
const lightbox = document.getElementById('lightbox');
const lightboxImg = document.getElementById('lightbox-img');
const lightboxCaption = document.getElementById('lightbox-caption');
const closeBtn = document.querySelector('.close-btn');

function openLightbox(imgSrc, caption) {
    lightboxImg.src = imgSrc;
    lightboxCaption.innerText = caption;
    lightbox.classList.add('active');
    fireConfetti();
}

// Event Delegation for better performance
document.addEventListener('click', (e) => {
    const target = e.target.closest('.polaroid-stack img, .fan-card img, .trail-photo img, .floating-frame img');
    if (target) {
        e.stopPropagation();
        const caption = target.getAttribute('data-caption') || target.alt || "A beautiful memory";
        openLightbox(target.src, caption);
    }
});

if(closeBtn) closeBtn.addEventListener('click', () => { lightbox.classList.remove('active'); });
if(lightbox) lightbox.addEventListener('click', (e) => {
    if(e.target === lightbox || e.target.classList.contains('lightbox-backdrop')) lightbox.classList.remove('active');
});

const canvas = document.getElementById('confetti-canvas');
const ctx = canvas.getContext('2d');
const dpr = window.devicePixelRatio || 1;
// Set canvas size once
function resizeConfetti() {
    canvas.width = window.innerWidth * dpr;
    canvas.height = window.innerHeight * dpr;
    ctx.scale(dpr, dpr);
    canvas.style.width = window.innerWidth + 'px';
    canvas.style.height = window.innerHeight + 'px';
}
resizeConfetti();
window.addEventListener('resize', resizeConfetti, {passive: true});

let confettiParticles = [];
function fireConfetti() {
    confettiParticles = [];
    const color = getComputedStyle(document.documentElement).getPropertyValue('--accent-gold').trim();
    // Reduce particle count slightly for mobile performance
    const count = window.innerWidth < 700 ? 50 : 100;
    
    for(let i=0; i<count; i++) { 
        confettiParticles.push({
            x: window.innerWidth / 2, y: window.innerHeight / 2,
            r: Math.random() * 6 + 3,
            dx: (Math.random() - 0.5) * 25, dy: (Math.random() - 0.5) * 25,
            color: color, life: 150
        });
    }
    animateConfetti();
}

function animateConfetti() {
    if(confettiParticles.length === 0) return;
    ctx.clearRect(0, 0, canvas.width / dpr, canvas.height / dpr);
    for (let i = confettiParticles.length - 1; i >= 0; i--) {
        const p = confettiParticles[i];
        p.x += p.dx; p.y += p.dy; p.dy += 0.3; p.dx *= 0.95; p.life--;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = p.color; ctx.globalAlpha = Math.max(0, p.life / 150); ctx.fill();
        if(p.life <= 0) confettiParticles.splice(i, 1);
    }
    if(confettiParticles.length > 0) requestAnimationFrame(animateConfetti);
}

// --- THREE.JS BACKGROUND ---
const scene = new THREE.Scene();

const STORY_CHAPTERS = [
    { percent: 0.0, sky: new THREE.Color(0xffe4e1), sun: new THREE.Color(0xffd700), fog: new THREE.Color(0xffe4e1), tree: new THREE.Color(0xd8bfd8), fogDensity: 0.03, sunPos: { x: 0, y: -2, z: -20 } },
    { percent: 0.15, sky: new THREE.Color(0x4ca1af), sun: new THREE.Color(0xffeeb1), fog: new THREE.Color(0xc4e0e5), tree: new THREE.Color(0x4caf50), fogDensity: 0.008, sunPos: { x: 3, y: 5, z: -15 } },
    
    // UPDATED APRIL: Reduced fogDensity to 0.002 to remove the "foggy filter" look
    { percent: 0.3, sky: new THREE.Color(0x87CEEB), sun: new THREE.Color(0xffffff), fog: new THREE.Color(0xe0f7fa), tree: new THREE.Color(0x228b22), fogDensity: 0.002, sunPos: { x: 5, y: 10, z: -10 } },
    
    { percent: 0.55, sky: new THREE.Color(0xff7f50), sun: new THREE.Color(0xff4500), fog: new THREE.Color(0xffdab9), tree: new THREE.Color(0xcd853f), fogDensity: 0.025, sunPos: { x: -5, y: 2, z: -20 } },
    { percent: 0.65, sky: new THREE.Color(0x050510), sun: new THREE.Color(0xddeeff), fog: new THREE.Color(0x050510), tree: new THREE.Color(0x1a1a2e), fogDensity: 0.035, sunPos: { x: 0, y: 10, z: -20 } },
    { percent: 0.85, sky: new THREE.Color(0x2a0a12), sun: new THREE.Color(0xffd700), fog: new THREE.Color(0x4a1a00), tree: new THREE.Color(0xffd700), fogDensity: 0.02, sunPos: { x: 0, y: 5, z: -10 } },
    { percent: 1.0, sky: new THREE.Color(0x050510), sun: new THREE.Color(0xffd700), fog: new THREE.Color(0x050510), tree: new THREE.Color(0x120a21), fogDensity: 0.004, sunPos: { x: 0, y: 8, z: -15 } }
];

const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 100);
camera.position.set(0, 1.2, 5);

const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
document.getElementById('canvas-container').appendChild(renderer.domElement);

const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
scene.add(ambientLight);
const dirLight = new THREE.DirectionalLight(0xffffff, 1);
dirLight.position.set(0, 10, 0);
scene.add(dirLight);

const sunGeo = new THREE.SphereGeometry(3, 32, 32);
const sunMat = new THREE.MeshBasicMaterial({ color: 0xffd700, transparent: true, opacity: 0.8 });
const sunMesh = new THREE.Mesh(sunGeo, sunMat);
scene.add(sunMesh);

scene.fog = new THREE.FogExp2(0xffffff, 0.02);

const treeGroup = new THREE.Group();
scene.add(treeGroup);

// Optimization: Reuse Materials and Geometries
const treeMat = new THREE.MeshLambertMaterial({ color: 0x228b22, flatShading: true });
const trunkMat = new THREE.MeshLambertMaterial({ color: 0x8b4513, flatShading: true });
const treeTopGeo = new THREE.ConeGeometry(0.8, 1.8, 5);
const treeMidGeo = new THREE.ConeGeometry(1.2, 1.5, 5);
const trunkGeo = new THREE.CylinderGeometry(0.2, 0.3, 0.8, 5);

const trees = [];
const treeCount = 70;
const trailLength = 80;

// Function to create tree reusing geometries
function createTree(z) {
    const grp = new THREE.Group();
    const top = new THREE.Mesh(treeTopGeo, treeMat);
    top.position.y = 1.8;
    const mid = new THREE.Mesh(treeMidGeo, treeMat);
    mid.position.y = 0.8;
    const trunk = new THREE.Mesh(trunkGeo, trunkMat);
    trunk.position.y = 0.4;
    
    // Disable frustum culling for individual parts for performance in group
    top.frustumCulled = false;
    mid.frustumCulled = false;
    trunk.frustumCulled = false;

    grp.add(trunk, mid, top);
    
    const side = Math.random() > 0.5 ? 1 : -1;
    grp.position.x = side * (2.5 + Math.random() * 8); 
    grp.position.z = z;
    const s = 0.8 + Math.random() * 0.5;
    grp.scale.set(s,s,s);
    grp.rotation.y = Math.random() * Math.PI;
    return grp;
}

for(let i=0; i<treeCount; i++) {
    const z = -(i / treeCount) * trailLength;
    const t = createTree(z);
    trees.push({ mesh: t, initialZ: z, offset: Math.random() * 10 });
    treeGroup.add(t);
}

// Particle System
const particleCount = 200; // Reduced count for performance
const partGeo = new THREE.BufferGeometry();
const partPos = new Float32Array(particleCount * 3);
for(let i=0; i<particleCount*3; i++) partPos[i] = (Math.random()-0.5) * 50;
partGeo.setAttribute('position', new THREE.BufferAttribute(partPos, 3));
const partMat = new THREE.PointsMaterial({
    color: 0xffffff, size: 0.2, transparent: true, opacity: 0.6
});
const particles = new THREE.Points(partGeo, partMat);
scene.add(particles);

// --- FINALE OBJECTS ---
let isFinaleActive = false;
const lanterns = [];
const fireworks = [];

const lanternGeo = new THREE.CylinderGeometry(0.1, 0.15, 0.25, 8);
const lanternMat = new THREE.MeshBasicMaterial({ color: 0xff8c00, transparent: true, opacity: 0.9 });

function spawnLantern() {
    const lantern = new THREE.Mesh(lanternGeo, lanternMat);
    const x = (Math.random() - 0.5) * 40;
    const z = (Math.random() - 0.5) * 40 - 10;
    const y = -5 + Math.random() * 5;
    lantern.position.set(x, y, z);
    lantern.userData = { speed: 0.02 + Math.random() * 0.03, wobbleOffset: Math.random() * Math.PI * 2 };
    scene.add(lantern);
    lanterns.push(lantern);
}

function createFirework(x, y, z, color) {
    const geometry = new THREE.BufferGeometry();
    const positions = [];
    const velocities = [];
    const count = 40; // Reduced for performance
    for (let i = 0; i < count; i++) {
        positions.push(x, y, z);
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.random() * Math.PI;
        const speed = 0.2 + Math.random() * 0.3;
        velocities.push(speed * Math.sin(phi) * Math.cos(theta), speed * Math.sin(phi) * Math.sin(theta), speed * Math.cos(phi));
    }
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    const material = new THREE.PointsMaterial({ color: color, size: 0.3, transparent: true, opacity: 1, blending: THREE.AdditiveBlending });
    const points = new THREE.Points(geometry, material);
    points.userData = { velocities: velocities, life: 100 };
    scene.add(points);
    fireworks.push(points);
}

let mouseX = 0, mouseY = 0;
let smoothedScroll = 0;
const clock = new THREE.Clock();

window.addEventListener('mousemove', (e) => {
    mouseX = (e.clientX / window.innerWidth) - 0.5;
    mouseY = (e.clientY / window.innerHeight) - 0.5;
}, {passive: true});

function lerpColor(c1, c2, alpha) { return c1.clone().lerp(c2, alpha); }

function animate() {
    requestAnimationFrame(animate);
    const time = clock.getElapsedTime();
    
    if(!isFinaleActive) {
        const maxScroll = document.body.scrollHeight - window.innerHeight;
        const scrollPct = maxScroll > 0 ? Math.min(1, Math.max(0, window.scrollY / maxScroll)) : 0;
        smoothedScroll += (window.scrollY - smoothedScroll) * 0.1;

        let currentChapter = STORY_CHAPTERS[0];
        let nextChapter = STORY_CHAPTERS[STORY_CHAPTERS.length - 1];
        
        for(let i=0; i < STORY_CHAPTERS.length - 1; i++) {
            if(scrollPct >= STORY_CHAPTERS[i].percent && scrollPct <= STORY_CHAPTERS[i+1].percent) {
                currentChapter = STORY_CHAPTERS[i];
                nextChapter = STORY_CHAPTERS[i+1];
                break;
            }
        }
        
        const range = nextChapter.percent - currentChapter.percent;
        const localPct = range === 0 ? 0 : (scrollPct - currentChapter.percent) / range;
        
        scene.background = lerpColor(currentChapter.sky, nextChapter.sky, localPct);
        scene.fog.color = lerpColor(currentChapter.fog, nextChapter.fog, localPct);
        scene.fog.density = THREE.MathUtils.lerp(currentChapter.fogDensity, nextChapter.fogDensity, localPct);
        sunMat.color = lerpColor(currentChapter.sun, nextChapter.sun, localPct);
        dirLight.color = sunMat.color;
        sunMesh.position.x = THREE.MathUtils.lerp(currentChapter.sunPos.x, nextChapter.sunPos.x, localPct);
        sunMesh.position.y = THREE.MathUtils.lerp(currentChapter.sunPos.y, nextChapter.sunPos.y, localPct);
        sunMesh.position.z = THREE.MathUtils.lerp(currentChapter.sunPos.z, nextChapter.sunPos.z, localPct);
        treeMat.color = lerpColor(currentChapter.tree, nextChapter.tree, localPct);
        
        camera.position.x += (mouseX * 0.5 - camera.position.x) * 0.05;
        camera.position.y += (1.2 + (-mouseY * 0.3) - camera.position.y) * 0.05;
        camera.lookAt(0, 1, -10);
    } else {
         camera.position.y += 0.01;
    }

    const walkSpeed = time * 1.5 + (smoothedScroll * 0.02);
    for(let i=0; i<trees.length; i++) {
        const t = trees[i];
        let z = t.initialZ + walkSpeed;
        z = (z % trailLength);
        if(z > 5) z -= trailLength;
        t.mesh.position.z = z;
        if(z > -30) t.mesh.position.y = Math.sin(time * 2 + t.offset) * 0.05;
    }

    const pArr = particles.geometry.attributes.position.array;
    for(let i=0; i<particleCount; i++) { pArr[i*3+1] += Math.sin(time + i) * 0.01; }
    particles.geometry.attributes.position.needsUpdate = true;

    if (isFinaleActive) {
        for (let i = lanterns.length - 1; i >= 0; i--) {
            const l = lanterns[i];
            l.position.y += l.userData.speed;
            l.position.x += Math.sin(time + l.userData.wobbleOffset) * 0.02;
            l.rotation.y += 0.01;
            if(l.position.y > 30) { scene.remove(l); lanterns.splice(i, 1); }
        }
        for (let i = fireworks.length - 1; i >= 0; i--) {
            const fw = fireworks[i];
            const positions = fw.geometry.attributes.position.array;
            const vels = fw.userData.velocities;
            const count = 40;
            for(let j=0; j < count; j++) {
                positions[j*3] += vels[j*3]; positions[j*3+1] += vels[j*3+1]; positions[j*3+2] += vels[j*3+2]; vels[j*3+1] -= 0.015;
            }
            fw.geometry.attributes.position.needsUpdate = true;
            fw.userData.life--;
            fw.material.opacity = fw.userData.life / 60;
            if(fw.userData.life <= 0) {
                scene.remove(fw); fw.geometry.dispose(); fw.material.dispose(); fireworks.splice(i, 1);
            }
        }
    }
    renderer.render(scene, camera);
}
animate();

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    resizeConfetti();
}, {passive: true});

const launchBtn = document.getElementById('launch-btn');
const preLaunch = document.querySelector('.pre-launch-message');
const postLaunch = document.querySelector('.post-launch-message');
const typewriterContainer = document.getElementById('typewriter-text');

if(launchBtn) {
    launchBtn.addEventListener('click', () => {
        isFinaleActive = true;
        preLaunch.style.opacity = '0';
        setTimeout(() => {
            preLaunch.style.display = 'none';
            postLaunch.classList.remove('hidden');
            postLaunch.classList.add('visible-finale');
            typeWriterEffect("2025 was beautiful because of you.\n2026 will be legendary because we are together.\nLet's write our next chapter.");
        }, 1000);
        const startRot = camera.rotation.x;
        const targetRot = 0.8; 
        let frame = 0;
        const tiltCamera = () => {
            if(frame < 100) { camera.rotation.x += (targetRot - startRot) / 100; frame++; requestAnimationFrame(tiltCamera); }
        };
        tiltCamera();
        setInterval(() => { spawnLantern(); }, 150);
        setInterval(() => {
            const colors = [0xffd700, 0xff0055, 0x00ffcc, 0xffffff];
            const c = colors[Math.floor(Math.random() * colors.length)];
            createFirework((Math.random() - 0.5) * 30, 10 + Math.random() * 10, -15 + (Math.random() - 0.5) * 10, c);
        }, 800);
    });
}

function typeWriterEffect(text) {
    let i = 0;
    typewriterContainer.innerHTML = "";
    function type() {
        if (i < text.length) {
            if(text.charAt(i) === '\n') { typewriterContainer.innerHTML += '<br>'; } else { typewriterContainer.innerHTML += text.charAt(i); }
            i++; setTimeout(type, 50); 
        }
    }
    type();
}

if (window.matchMedia("(min-width: 900px)").matches) {
    const stacks = document.querySelectorAll('.polaroid-stack');
    stacks.forEach(stack => {
        stack.addEventListener('mousemove', (e) => {
            const rect = stack.getBoundingClientRect();
            const x = (e.clientX - rect.left) / rect.width;
            const y = (e.clientY - rect.top) / rect.height;
            const xRotation = (y - 0.5) * 6; 
            const yRotation = (x - 0.5) * 6; 
            stack.style.transform = `rotateX(${-xRotation}deg) rotateY(${yRotation}deg)`;
        });
        stack.addEventListener('mouseleave', () => { stack.style.transform = `rotateX(0deg) rotateY(0deg)`; });
    });
}

// --- SMOOTH ATMOSPHERE FADES (HP & TRAIL) ---
const hpSection = document.querySelector('.hp-section');
const hpAtmosphere = document.getElementById('hp-atmosphere');
const trailSection = document.querySelector('.trail-section');
const trailAtmosphere = document.getElementById('trail-atmosphere');

const atmosphereObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        const isHP = entry.target.classList.contains('hp-section');
        const overlay = isHP ? hpAtmosphere : trailAtmosphere;
        
        if (entry.isIntersecting) {
            overlay.classList.add('visible');
            document.documentElement.style.setProperty('--bg-color', isHP ? '#0c0c14' : '#f0f5e5');
        } else {
            overlay.classList.remove('visible');
            document.documentElement.style.setProperty('--bg-color', '#fcfbf8');
        }
    });
}, { 
    threshold: 0, 
    rootMargin: "0px 0px -10% 0px" // Slight offset to trigger earlier/later smoothly
});

if (hpSection) atmosphereObserver.observe(hpSection);
if (trailSection) atmosphereObserver.observe(trailSection);