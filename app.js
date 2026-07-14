document.addEventListener('DOMContentLoaded', () => {
    // ----------------------------------------------------
    // 1. CUSTOM CURSOR TRACKING
    // ----------------------------------------------------
    const cursor = document.getElementById('custom-cursor');
    const ring = document.getElementById('custom-cursor-ring');
    
    let mouseX = 0;
    let mouseY = 0;
    let ringX = 0;
    let ringY = 0;
    
    // Smooth trailing physics using LERP (Linear Interpolation)
    const lerp = (start, end, amt) => (1 - amt) * start + amt * end;
    
    document.addEventListener('mousemove', (e) => {
        mouseX = e.clientX;
        mouseY = e.clientY;
        
        // Move small dot cursor immediately
        cursor.style.left = `${mouseX}px`;
        cursor.style.top = `${mouseY}px`;
    });
    
    function animateCursor() {
        // Smoothly interpolate the trailing ring position
        ringX = lerp(ringX, mouseX, 0.15);
        ringY = lerp(ringY, mouseY, 0.15);
        
        ring.style.left = `${ringX}px`;
        ring.style.top = `${ringY}px`;
        
        requestAnimationFrame(animateCursor);
    }
    animateCursor();
    
    // Expand cursor ring on hoverable interactive elements
    const hoverables = document.querySelectorAll('a, button, .skill-category-box, input, textarea');
    hoverables.forEach(el => {
        el.addEventListener('mouseenter', () => {
            cursor.classList.add('hovered');
            ring.classList.add('hovered');
        });
        el.addEventListener('mouseleave', () => {
            cursor.classList.remove('hovered');
            ring.classList.remove('hovered');
        });
    });

    // ----------------------------------------------------
    // 2. SCROLL REVEAL (INTERSECTION OBSERVER)
    // ----------------------------------------------------
    const reveals = document.querySelectorAll('.animate-reveal');
    const revealObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('active');
                revealObserver.unobserve(entry.target); // Reveal once
            }
        });
    }, {
        threshold: 0.15,
        rootMargin: '0px 0px -50px 0px'
    });
    
    reveals.forEach(el => {
        revealObserver.observe(el);
    });

    // Scroll Fade Out for Header Logo Text & Socials
    const headerLogo = document.querySelector('.header-logo');
    if (headerLogo) {
        window.addEventListener('scroll', () => {
            if (window.scrollY > 80) {
                headerLogo.classList.add('scrolled');
            } else {
                headerLogo.classList.remove('scrolled');
            }
        });
    }

    // ----------------------------------------------------
    // 3. SKILLS CATEGORY INTERACTIVE BOXES & TRAY
    // ----------------------------------------------------
    const skillsData = {
        languages: ["C", "Python", "Java", "JavaScript", "MySQL"],
        concepts: ["Data Structure & Algorithms", "OS", "Computer Network", "DBMS", "Machine Learning", "Object Oriented Design and Programming"],
        technologies: ["Node.js", "React", "MongoDB", "REST APIs", "Relational Databases"],
        tools: ["Git", "GitHub", "Postman", "Android Studio", "VS Code"]
    };
    
    const categoryBoxes = document.querySelectorAll('.skill-category-box');
    const skillsTray = document.getElementById('skills-tray');
    
    categoryBoxes.forEach(box => {
        box.addEventListener('click', () => {
            // Do nothing if already active
            if (box.classList.contains('active-box')) return;
            
            // Toggle active box borders and glow
            categoryBoxes.forEach(b => b.classList.remove('active-box'));
            box.classList.add('active-box');
            
            const category = box.getAttribute('data-category');
            const items = skillsData[category] || [];
            
            // Fade out tray, swap items, and fade back in
            skillsTray.classList.remove('active-tray');
            
            setTimeout(() => {
                skillsTray.innerHTML = '';
                
                items.forEach((skill, index) => {
                    const chip = document.createElement('div');
                    chip.className = 'skill-chip animate-chip';
                    // Stagger animation entry delays
                    chip.style.animationDelay = `${index * 0.06}s`;
                    chip.textContent = skill;
                    
                    // Bind custom cursor events to new dynamically created chips
                    chip.addEventListener('mouseenter', () => {
                        cursor.classList.add('hovered');
                        ring.classList.add('hovered');
                    });
                    chip.addEventListener('mouseleave', () => {
                        cursor.classList.remove('hovered');
                        ring.classList.remove('hovered');
                    });
                    
                    skillsTray.appendChild(chip);
                });
                
                // Trigger tray fade-in reveal
                skillsTray.classList.add('active-tray');
            }, 250);
        });
    });

    // ----------------------------------------------------
    // 4. THREE.JS INITIALIZATION (EARTH GLOBE & BEACON)
    // ----------------------------------------------------
    initThreeJS();
});

// Setup 3D Scene in global scope for clean structure
function initThreeJS() {
    const container = document.getElementById('threejs-container');
    if (!container) return;
    
    const width = container.clientWidth;
    const height = container.clientHeight;
    
    // 1. SCENE & CAMERA SETUP
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.z = 5.5;
    
    // 2. RENDERER SETUP
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);
    
    // 3. GLOBE & NETWORK MESH SETUP
    const group = new THREE.Group();
    scene.add(group);
    
    // Base solid globe mesh
    const R = 1.8;
    const globeGeometry = new THREE.SphereGeometry(R, 48, 48);
    const globeMaterial = new THREE.MeshBasicMaterial({
        color: 0x08080a // Dark matching the website background
    });
    const globe = new THREE.Mesh(globeGeometry, globeMaterial);
    
    // The world_map_detailed.jpg texture aligns Greenwich (0° longitude) in the center of the image.
    // Three.js wraps standard texture maps onto SphereGeometry such that U=0.5 (center) aligns with 180° theta rotation
    // (negative X-axis). Since the spherical Cartesian formula places Greenwich at theta = 180° (lon = 0), they naturally
    // align perfectly. Therefore, we keep globe.rotation.y = 0.
    globe.rotation.y = 0;
    group.add(globe);
    
    // Load high-end dark texture with fallback
    const loader = new THREE.TextureLoader();
    loader.load(
        'assets/world_map_detailed.jpg',
        (texture) => {
            globeMaterial.map = texture;
            globeMaterial.color.setHex(0xffffff); // Display original texture details
            globeMaterial.needsUpdate = true;
        },
        undefined,
        (err) => {
            console.log("Failed to load local map texture, defaulting to dark wireframe");
            globeMaterial.color.setHex(0x0e0e11);
        }
    );
    
    // Primary Red wireframe network grid
    const gridGeometry = new THREE.SphereGeometry(R + 0.005, 30, 30);
    const gridMaterial = new THREE.MeshBasicMaterial({
        color: 0xff3b30, // Crimson Red
        wireframe: true,
        transparent: true,
        opacity: 0.04,
        depthWrite: false
    });
    const grid = new THREE.Mesh(gridGeometry, gridMaterial);
    group.add(grid);
    
    // Secondary Grey wireframe grid
    const gridGeo2 = new THREE.SphereGeometry(R + 0.002, 16, 16);
    const gridMat2 = new THREE.MeshBasicMaterial({
        color: 0xede6d6, // Sand Beige
        wireframe: true,
        transparent: true,
        opacity: 0.03,
        depthWrite: false
    });
    const grid2 = new THREE.Mesh(gridGeo2, gridMat2);
    group.add(grid2);
    
    // Subtle outer atmosphere glow
    const glowGeometry = new THREE.SphereGeometry(R + 0.1, 32, 32);
    const glowMaterial = new THREE.MeshBasicMaterial({
        color: 0xff3b30,
        transparent: true,
        opacity: 0.03,
        side: THREE.BackSide
    });
    const glowSphere = new THREE.Mesh(glowGeometry, glowMaterial);
    group.add(glowSphere);
    
    // 4. MANGALORE, INDIA BEACON SETUP
    const lat = -5;
const lon = 78-9;
    
    // Convert geographic coordinates to Cartesian coordinates mathematically using Three.js sphere conventions
    const phi = THREE.MathUtils.degToRad(90 - lat);
    const theta = THREE.MathUtils.degToRad(lon + 180);
    
    const x = -(R * Math.sin(phi) * Math.cos(theta));
    const y =  R * Math.cos(phi);
    const z =  R * Math.sin(phi) * Math.sin(theta);
    
    const pinGroup = new THREE.Group();
    pinGroup.position.set(x, y, z);
    pinGroup.lookAt(0, 0, 0);
    pinGroup.rotateX(Math.PI);
    group.add(pinGroup);
    
    // Visual pointer (Cone) pointing straight out along local Z-axis (height: 0.15)
    const pinGeometry = new THREE.ConeGeometry(0.02, 0.15, 6);
    pinGeometry.rotateX(Math.PI / 2); // Orient cone along local Z
    const pinMaterial = new THREE.MeshBasicMaterial({ color: 0xff3b30 });
    const pin = new THREE.Mesh(pinGeometry, pinMaterial);
    pin.position.z = 0.075; // Position relative to pinGroup to sit on surface
    pinGroup.add(pin);
    
    // Radar pulsing ring flat at the tip of the pointer
    const pulseGeometry = new THREE.RingGeometry(0.015, 0.07, 16);
    const pulseMaterial = new THREE.MeshBasicMaterial({
        color: 0xff3b30,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.8
    });
    const pulseRing = new THREE.Mesh(pulseGeometry, pulseMaterial);
    pulseRing.position.z = 0.15; // Placed at the tip of the cone (0.15 local Z)
    pinGroup.add(pulseRing);
    
    // 5. INTERACTIVE PHYSICS VARIABLES
    let isDragging = false;
    let previousMousePosition = { x: 0, y: 0 };
    
    // Set initial target rotations to center India directly facing the camera on page load
    let targetRotationX = THREE.MathUtils.degToRad(lat);
    let targetRotationY = THREE.MathUtils.degToRad(lon) - Math.PI / 2;
    
    let mouseParallaxX = 0;
    let mouseParallaxY = 0;
    
    const clock = new THREE.Clock();
    
    // Drag rotation handlers
    container.addEventListener('mousedown', (e) => {
        isDragging = true;
        previousMousePosition = { x: e.clientX, y: e.clientY };
    });
    
    window.addEventListener('mouseup', () => {
        isDragging = false;
    });
    
    window.addEventListener('mousemove', (e) => {
        const deltaMove = {
            x: e.clientX - previousMousePosition.x,
            y: e.clientY - previousMousePosition.y
        };
        
        if (isDragging) {
            targetRotationY += deltaMove.x * 0.008;
            targetRotationX += deltaMove.y * 0.008;
            previousMousePosition = { x: e.clientX, y: e.clientY };
        } else {
            // General mouse move parallax when not dragging
            const rect = container.getBoundingClientRect();
            const x = (e.clientX - rect.left) / rect.width - 0.5;
            const y = (e.clientY - rect.top) / rect.height - 0.5;
            mouseParallaxX = x * 0.3;
            mouseParallaxY = y * 0.3;
        }
    });
    
    // Support mobile touch dragging
    container.addEventListener('touchstart', (e) => {
        if (e.touches.length === 1) {
            isDragging = true;
            previousMousePosition = { x: e.touches[0].clientX, y: e.touches[0].clientY };
        }
    });
    
    window.addEventListener('touchend', () => {
        isDragging = false;
    });
    
    container.addEventListener('touchmove', (e) => {
        if (isDragging && e.touches.length === 1) {
            const deltaMove = {
                x: e.touches[0].clientX - previousMousePosition.x,
                y: e.touches[0].clientY - previousMousePosition.y
            };
            targetRotationY += deltaMove.x * 0.008;
            targetRotationX += deltaMove.y * 0.008;
            previousMousePosition = { x: e.touches[0].clientX, y: e.touches[0].clientY };
        }
    });
    
    // 6. ANIMATION LOOP
    let pulseScale = 1;
    function animate() {
        requestAnimationFrame(animate);
        
        // Pulse animation for the Mangalore beacon
        pulseScale += 0.02;
        if (pulseScale > 2.5) {
            pulseScale = 1;
        }
        pulseRing.scale.set(pulseScale, pulseScale, 1);
        pulseRing.material.opacity = 1 - (pulseScale - 1) / 1.5;
        
        // Auto-rotation (very slow)
        group.rotation.y += 0.001;
        
        // Apply interactive drag and parallax rotations smoothly (LERP)
        group.rotation.y = lerp(group.rotation.y, targetRotationY + mouseParallaxX, 0.08);
        group.rotation.x = lerp(group.rotation.x, targetRotationX + mouseParallaxY, 0.08);
        
        renderer.render(scene, camera);
    }
    
    // Helper function for local lerping
    function lerp(start, end, amt) {
        return (1 - amt) * start + amt * end;
    }
    
    animate();
    
    // 7. RESIZE LISTENER
    window.addEventListener('resize', () => {
        const newWidth = container.clientWidth;
        const newHeight = container.clientHeight;
        
        camera.aspect = newWidth / newHeight;
        camera.updateProjectionMatrix();
        
        renderer.setSize(newWidth, newHeight);
    });
    
    // 8. NETLIFY AJAX FORM SUBMISSION
    const contactForm = document.getElementById('contact-form');
    if (contactForm) {
        contactForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const formData = new FormData(contactForm);
            
            fetch('/', {
                method: 'POST',
                headers: { "Content-Type": "application/x-www-form-urlencoded" },
                body: new URLSearchParams(formData).toString()
            })
            .then(() => {
                alert('Thank you! Your message has been sent successfully.');
                contactForm.reset();
            })
            .catch((error) => {
                alert('Oops! There was an error sending your message: ' + error);
            });
        });
    }
}
