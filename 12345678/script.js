/* ==========================================================================
   PRIYAA DHARSHINI TN PORTFOLIO - CORE INTERACTION SCRIPT
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {

    /* --------------------------------------------------------------------------
       1. SYSTEM INITIALIZER & PRELOADER
       -------------------------------------------------------------------------- */
    const preloader = document.getElementById('preloader');
    const percentEl = document.querySelector('.loader-percentage');
    let loadProgress = 0;
    
    // Simulate high-fidelity circuit load progress
    const loadTimer = setInterval(() => {
        loadProgress += Math.floor(Math.random() * 12) + 3;
        if (loadProgress >= 100) {
            loadProgress = 100;
            clearInterval(loadTimer);
            
            // Fade out preloader
            setTimeout(() => {
                preloader.style.opacity = '0';
                preloader.style.visibility = 'hidden';
                document.body.classList.remove('loading');
                // Trigger typing & path reveal
                startHeroAnimations();
            }, 600);
        }
        percentEl.textContent = `${loadProgress}%`;
    }, 45);

    /* --------------------------------------------------------------------------
       2. CUSTOM INTERACTIVE CURSOR & DRAGGING CIRCLE WITH SPARKS
       -------------------------------------------------------------------------- */
    const cursorDot = document.getElementById('custom-cursor-dot');
    const cursorCircle = document.getElementById('custom-cursor-circle');
    const trailContainer = document.querySelector('.cursor-trail-container');
    
    let mouseX = 0, mouseY = 0; // Actual mouse coords
    let circleX = 0, circleY = 0; // Lagging outer circle coords
    let lastMouseX = 0, lastMouseY = 0; // Track movement speed
    let isMoving = false;
    let speed = 0;

    // Track mouse coordinates
    window.addEventListener('mousemove', (e) => {
        mouseX = e.clientX;
        mouseY = e.clientY;
        
        // Render dot instantly
        cursorDot.style.left = `${mouseX}px`;
        cursorDot.style.top = `${mouseY}px`;
        
        // Calculate speed for sparks
        const dx = mouseX - lastMouseX;
        const dy = mouseY - lastMouseY;
        speed = Math.sqrt(dx * dx + dy * dy);
        
        // Spawn sparks if moving fast
        if (speed > 25 && Math.random() < 0.4) {
            createSpark(mouseX, mouseY);
        }
        
        lastMouseX = mouseX;
        lastMouseY = mouseY;
    });

    // Lagging Outer Circle Lerp Animation Loop
    function updateCursorCircle() {
        const delay = 0.12; // Lags behind dot
        circleX += (mouseX - circleX) * delay;
        circleY += (mouseY - circleY) * delay;
        
        cursorCircle.style.left = `${circleX}px`;
        cursorCircle.style.top = `${circleY}px`;
        
        requestAnimationFrame(updateCursorCircle);
    }
    updateCursorCircle();

    // Custom Spark Generator
    function createSpark(x, y) {
        const spark = document.createElement('div');
        spark.classList.add('cursor-spark');
        spark.style.left = `${x}px`;
        spark.style.top = `${y}px`;
        
        // Random drift direction
        const angle = Math.random() * Math.PI * 2;
        const distance = Math.random() * 20 + 5;
        const tx = Math.cos(angle) * distance;
        const ty = Math.sin(angle) * distance;
        
        spark.style.setProperty('--tx', `${tx}px`);
        spark.style.setProperty('--ty', `${ty}px`);
        
        trailContainer.appendChild(spark);
        
        // Cleanup spark
        setTimeout(() => {
            spark.remove();
        }, 600);
    }

    // Handle Active Dragging Cursor transitions
    window.addEventListener('mousedown', () => {
        cursorCircle.classList.add('active');
        cursorDot.style.transform = 'translate(-50%, -50%) scale(1.6)';
    });

    window.addEventListener('mouseup', () => {
        cursorCircle.classList.remove('active');
        cursorDot.style.transform = 'translate(-50%, -50%) scale(1)';
    });

    /* --------------------------------------------------------------------------
       3. LIVING PCB CIRCUIT BOARD CANVAS RENDERING ENGINE
       -------------------------------------------------------------------------- */
    const canvas = document.getElementById('circuit-bg');
    const ctx = canvas.getContext('2d');
    
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    window.addEventListener('resize', () => {
        width = (canvas.width = window.innerWidth);
        height = (canvas.height = window.innerHeight);
        initCircuitGrid();
    });

    // Core Circuit nodes & pathways array
    let nodes = [];
    let lines = [];
    let impulses = [];

    // Initialize structured circuit board pathways
    function initCircuitGrid() {
        nodes = [];
        lines = [];
        impulses = [];
        
        // Deterministic Grid setup
        const cols = Math.ceil(width / 160);
        const rows = Math.ceil(height / 140);
        
        for (let r = 0; r <= rows; r++) {
            for (let c = 0; c <= cols; c++) {
                // Add jitter to avoid standard squares
                const x = c * 160 + (Math.random() - 0.5) * 80;
                const y = r * 140 + (Math.random() - 0.5) * 60;
                
                nodes.push({
                    x: Math.max(10, Math.min(width - 10, x)),
                    y: Math.max(10, Math.min(height - 10, y)),
                    radius: Math.random() < 0.25 ? (Math.random() * 3.5 + 2) : 1.5, // Some nodes are vias
                    glow: Math.random() < 0.3,
                    opacity: Math.random() * 0.4 + 0.1
                });
            }
        }
        
        // Link nodes together to build logic traces
        nodes.forEach((n1, idx) => {
            // Find 2-3 closest nodes
            const sorted = nodes
                .map((n2, i) => ({ dist: Math.hypot(n1.x - n2.x, n1.y - n2.y), idx: i }))
                .filter(item => item.idx !== idx && item.dist < 220)
                .sort((a, b) => a.dist - b.dist)
                .slice(0, Math.random() < 0.5 ? 2 : 1);
                
            sorted.forEach(item => {
                const n2 = nodes[item.idx];
                
                // Add orthodiagonal PCB bends occasionally
                const midX = n1.x + (n2.x - n1.x) * 0.5;
                const midY = n1.y + (n2.y - n1.y) * 0.5;
                
                lines.push({
                    start: n1,
                    end: n2,
                    bend: Math.random() < 0.4,
                    midX: Math.random() < 0.5 ? n1.x : n2.x,
                    midY: Math.random() < 0.5 ? n2.y : n1.y,
                    active: false,
                    opacity: Math.random() * 0.12 + 0.03
                });
            });
        });
    }

    // Spawn an electric impulse flowing along lines
    function spawnImpulse() {
        if (lines.length === 0 || impulses.length > 25) return;
        
        // Pick random line to start
        const startLine = lines[Math.floor(Math.random() * lines.length)];
        impulses.push({
            currentLine: startLine,
            progress: 0,
            speed: Math.random() * 0.02 + 0.008,
            color: Math.random() < 0.6 ? 'cyan' : 'violet'
        });
    }

    // Mouse click triggers a local trace burst
    window.addEventListener('click', (e) => {
        // Only spawn impulses near click if screen is large
        if (window.innerWidth < 1024) return;
        
        // Find 5 closest lines and launch sparks
        const clickX = e.clientX;
        const clickY = e.clientY;
        
        lines.forEach(line => {
            const dStart = Math.hypot(line.start.x - clickX, line.start.y - clickY);
            if (dStart < 180) {
                impulses.push({
                    currentLine: line,
                    progress: 0,
                    speed: 0.03,
                    color: 'cyan'
                });
            }
        });
    });

    // Draw the circuit background frame-by-frame
    function drawCircuit() {
        ctx.clearRect(0, 0, width, height);
        
        // 1. Draw static grid nodes & connection pathways
        ctx.lineWidth = 1;
        lines.forEach(line => {
            ctx.strokeStyle = `rgba(0, 245, 255, ${line.opacity})`;
            ctx.beginPath();
            ctx.moveTo(line.start.x, line.start.y);
            if (line.bend) {
                ctx.lineTo(line.midX, line.midY);
            }
            ctx.lineTo(line.end.x, line.end.y);
            ctx.stroke();
        });
        
        // 2. Draw static nodes (Vias)
        nodes.forEach(node => {
            ctx.fillStyle = `rgba(124, 58, 237, ${node.opacity})`;
            ctx.beginPath();
            ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
            ctx.fill();
            
            if (node.glow) {
                ctx.shadowBlur = 8;
                ctx.shadowColor = 'rgba(0, 245, 255, 0.4)';
                ctx.fillStyle = `rgba(0, 245, 255, ${node.opacity + 0.2})`;
                ctx.beginPath();
                ctx.arc(node.x, node.y, node.radius * 0.8, 0, Math.PI * 2);
                ctx.fill();
                ctx.shadowBlur = 0; // Reset glow
            }
        });
        
        // 3. Render moving electric impulses
        impulses.forEach((imp, idx) => {
            imp.progress += imp.speed;
            
            if (imp.progress >= 1) {
                // Find connecting line
                const currentEnd = imp.currentLine.end;
                const nextLines = lines.filter(l => l.start === currentEnd && l !== imp.currentLine);
                
                if (nextLines.length > 0 && Math.random() < 0.9) {
                    imp.currentLine = nextLines[Math.floor(Math.random() * nextLines.length)];
                    imp.progress = 0;
                } else {
                    // Impulse dies
                    impulses.splice(idx, 1);
                    return;
                }
            }
            
            // Interpolate position along path (linear/bends)
            let x, y;
            const line = imp.currentLine;
            
            if (line.bend) {
                if (imp.progress < 0.5) {
                    const p = imp.progress * 2;
                    x = line.start.x + (line.midX - line.start.x) * p;
                    y = line.start.y + (line.midY - line.start.y) * p;
                } else {
                    const p = (imp.progress - 0.5) * 2;
                    x = line.midX + (line.end.x - line.midX) * p;
                    y = line.midY + (line.end.y - line.midY) * p;
                }
            } else {
                x = line.start.x + (line.end.x - line.start.x) * imp.progress;
                y = line.start.y + (line.end.y - line.start.y) * imp.progress;
            }
            
            // Render glowing impulse head
            ctx.shadowBlur = 12;
            if (imp.color === 'cyan') {
                ctx.shadowColor = 'rgba(0, 245, 255, 0.8)';
                ctx.fillStyle = '#ffffff';
                ctx.strokeStyle = 'rgba(0, 245, 255, 0.8)';
            } else {
                ctx.shadowColor = 'rgba(124, 58, 237, 0.8)';
                ctx.fillStyle = '#ffffff';
                ctx.strokeStyle = 'rgba(124, 58, 237, 0.8)';
            }
            
            ctx.beginPath();
            ctx.arc(x, y, 3, 0, Math.PI * 2);
            ctx.fill();
            
            // Subtle aura ring
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.arc(x, y, 7, 0, Math.PI * 2);
            ctx.stroke();
            
            ctx.shadowBlur = 0; // Reset
        });
        
        // Spawn naturally
        if (Math.random() < 0.08) spawnImpulse();
        
        requestAnimationFrame(drawCircuit);
    }
    
    initCircuitGrid();
    drawCircuit();

    /* --------------------------------------------------------------------------
       4. TYPING TEXT CYCLER & STAGGERED HERO LETTER REVEAL
       -------------------------------------------------------------------------- */
    const typingElement = document.getElementById('typing-element');
    const sentences = [
        "Electronics & Computer Engineering Student",
        "VLSI & Embedded Systems Aspirant",
        "Programming Enthusiast",
        "Circuit Architect | Problem Solver"
    ];
    
    let sentenceIndex = 0;
    let charIndex = 0;
    let isDeleting = false;
    
    function typeText() {
        const currentSentence = sentences[sentenceIndex];
        
        if (isDeleting) {
            typingElement.textContent = currentSentence.substring(0, charIndex - 1);
            charIndex--;
        } else {
            typingElement.textContent = currentSentence.substring(0, charIndex + 1);
            charIndex++;
        }
        
        let typeSpeed = isDeleting ? 30 : 60;
        
        // Wait at full length
        if (!isDeleting && charIndex === currentSentence.length) {
            typeSpeed = 2200; // Pause at end of text
            isDeleting = true;
        } else if (isDeleting && charIndex === 0) {
            isDeleting = false;
            sentenceIndex = (sentenceIndex + 1) % sentences.length;
            typeSpeed = 400; // Pause before typing new text
        }
        
        setTimeout(typeText, typeSpeed);
    }

    function startHeroAnimations() {
        // Trigger Name staggered text split-reveal
        const nameEl = document.querySelector('.hero-name');
        const text = nameEl.textContent.trim();
        nameEl.innerHTML = '';
        
        // Wrap each word/letter in a tag
        text.split(' ').forEach((word, wordIdx) => {
            const wordSpan = document.createElement('span');
            wordSpan.style.display = 'inline-block';
            wordSpan.style.whiteSpace = 'nowrap';
            wordSpan.style.marginRight = '12px';
            
            word.split('').forEach((letter, charIdx) => {
                const charSpan = document.createElement('span');
                charSpan.textContent = letter;
                charSpan.classList.add('reveal-letter');
                charSpan.style.animationDelay = `${(wordIdx * 4 + charIdx) * 0.05}s`;
                wordSpan.appendChild(charSpan);
            });
            nameEl.appendChild(wordSpan);
        });
        
        // Start subtitle cycler
        setTimeout(typeText, 1200);
    }

    /* --------------------------------------------------------------------------
       5. STICKY NAV GLOWS, MOBILE DRAWER, & SCROLL PROGRESS
       -------------------------------------------------------------------------- */
    const navbar = document.querySelector('.navbar');
    const scrollBar = document.getElementById('scroll-progress-bar');
    const menuToggle = document.getElementById('menu-toggle-btn');
    const mobileDrawer = document.getElementById('mobile-drawer');
    const drawerCloseBtn = document.getElementById('drawer-close-btn');
    const drawerLinks = document.querySelectorAll('.drawer-link');
    
    // Mobile Drawer Open
    menuToggle.addEventListener('click', () => {
        mobileDrawer.classList.add('open');
    });

    // Mobile Drawer Close
    drawerCloseBtn.addEventListener('click', () => {
        mobileDrawer.classList.remove('open');
    });

    drawerLinks.forEach(link => {
        link.addEventListener('click', () => {
            mobileDrawer.classList.remove('open');
        });
    });

    // Scroll calculations
    window.addEventListener('scroll', () => {
        const scrolled = window.scrollY;
        const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
        
        // Update Scrollbar percentage
        if (totalHeight > 0) {
            const percent = (scrolled / totalHeight) * 100;
            scrollBar.style.width = `${percent}%`;
        }
        
        // Update sticky navbar transparency
        if (scrolled > 50) {
            navbar.style.background = 'rgba(5, 5, 8, 0.95)';
            navbar.style.borderBottomColor = 'rgba(0, 245, 255, 0.15)';
        } else {
            navbar.style.background = 'rgba(5, 5, 8, 0.7)';
            navbar.style.borderBottomColor = 'rgba(0, 245, 255, 0.08)';
        }
        
        // Highlight active navbar segment
        updateActiveNavSegment();
    });

    const navLinks = document.querySelectorAll('.nav-link');
    const sections = document.querySelectorAll('section');

    function updateActiveNavSegment() {
        let currentSectionId = 'home';
        const scrollPosition = window.scrollY + 200;
        
        sections.forEach(sec => {
            const secTop = sec.offsetTop;
            const secHeight = sec.clientHeight;
            if (scrollPosition >= secTop && scrollPosition < secTop + secHeight) {
                currentSectionId = sec.getAttribute('id');
            }
        });
        
        navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href') === `#${currentSectionId}`) {
                link.classList.add('active');
            }
        });
    }

    /* --------------------------------------------------------------------------
       6. ANCHOR SCROLL ANIMATION OVERRIDES
       -------------------------------------------------------------------------- */
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            if (targetId === '#') return;
            
            const targetEl = document.querySelector(targetId);
            if (targetEl) {
                const headerOffset = 80;
                const elementPosition = targetEl.getBoundingClientRect().top;
                const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
                
                window.scrollTo({
                    top: offsetPosition,
                    behavior: 'smooth'
                });
            }
        });
    });

    /* --------------------------------------------------------------------------
       7. STATS NODE COUNTERS INCREMENTS ENGINE
       -------------------------------------------------------------------------- */
    const statsGrid = document.getElementById('stats-counter-grid');
    const statCards = document.querySelectorAll('.stat-card');
    let countersAnimated = false;
    
    function animateCounters() {
        const numbers = document.querySelectorAll('.stat-num');
        numbers.forEach(numEl => {
            const targetVal = parseFloat(numEl.getAttribute('data-target'));
            const decimals = parseInt(numEl.getAttribute('data-decimals'));
            const duration = 1600; // Total ms
            const startTime = performance.now();
            
            function updateNumber(currentTime) {
                const elapsed = currentTime - startTime;
                const progress = Math.min(elapsed / duration, 1);
                
                // Ease out cubic
                const ease = 1 - Math.pow(1 - progress, 3);
                const currentVal = targetVal * ease;
                
                numEl.textContent = currentVal.toFixed(decimals);
                
                if (progress < 1) {
                    requestAnimationFrame(updateNumber);
                } else {
                    numEl.textContent = targetVal.toFixed(decimals);
                }
            }
            requestAnimationFrame(updateNumber);
        });
    }

    // Intersection observer for counters
    const observerOptions = { threshold: 0.2 };
    const statObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting && !countersAnimated) {
                animateCounters();
                countersAnimated = true;
                statObserver.unobserve(entry.target);
            }
        });
    }, observerOptions);
    
    if (statsGrid) statObserver.observe(statsGrid);

    /* --------------------------------------------------------------------------
       8. TECHNICAL HONEYCOMB SKILLS RENDERER & SWITCHER
       -------------------------------------------------------------------------- */
    const skills = [
        // Programming
        { name: "C Language", category: "programming", icon: "fab fa-cuttlefish" },
        { name: "C++", category: "programming", icon: "fas fa-laptop-code" },
        { name: "Python", category: "programming", icon: "fab fa-python" },
        { name: "Verilog HDL", category: "programming", icon: "fas fa-microchip" },
        
        // Hardware & Embedded Tools
        { name: "Arduino Uno", category: "embedded", icon: "fas fa-cube" },
        { name: "Raspberry Pi", category: "embedded", icon: "fab fa-raspberry-pi" },
        { name: "Cadence Suite", category: "embedded", icon: "fas fa-project-diagram" },
        { name: "Proteus", category: "embedded", icon: "fas fa-wave-square" },
        { name: "VS Code", category: "embedded", icon: "fas fa-code-branch" },
        { name: "Sensors", category: "embedded", icon: "fas fa-rss" },
        { name: "Biomedical sensors", category: "embedded", icon: "fas fa-heartbeat" },
        
        // Databases
        { name: "MySQL", category: "databases", icon: "fas fa-server" },
        { name: "Basic SQL", category: "databases", icon: "fas fa-database" },
        
        // Soft Skills
        { name: "Leadership", category: "softskills", icon: "fas fa-crown" },
        { name: "Resilience", category: "softskills", icon: "fas fa-shield-alt" },
        { name: "Determined", category: "softskills", icon: "fas fa-burn" },
        { name: "Doodling", category: "softskills", icon: "fas fa-palette" },
        { name: "Movies Analyzing", category: "softskills", icon: "fas fa-film" },
        
        // Languages
        { name: "Tamil", category: "languages", icon: "fas fa-bullhorn" },
        { name: "English", category: "languages", icon: "fas fa-globe" },
        { name: "Hindi", category: "languages", icon: "fas fa-language" },
        { name: "Japanese (Learning N5)", category: "languages", icon: "fas fa-map" }
    ];

    const honeycombGrid = document.getElementById('honeycomb-skills-grid');
    const skillTabs = document.querySelectorAll('.skill-tab-btn');

    function renderHoneycombGrid() {
        if (!honeycombGrid) return;
        honeycombGrid.innerHTML = '';
        
        skills.forEach(skill => {
            const cell = document.createElement('div');
            cell.className = `honeycomb-cell ${skill.category}`;
            
            cell.innerHTML = `
                <svg class="hex-badge" viewBox="0 0 100 115.47">
                    <polygon points="50,0 100,28.87 100,86.6 50,115.47 0,86.6 0,28.87" class="hex-bg-path" />
                </svg>
                <div class="hex-inner-content">
                    <i class="${skill.icon} hex-icon"></i>
                    <span class="hex-title">${skill.name}</span>
                </div>
            `;
            
            honeycombGrid.appendChild(cell);
        });
    }

    // Filter Honeycomb
    skillTabs.forEach(tab => {
        tab.addEventListener('click', function() {
            skillTabs.forEach(t => t.classList.remove('active'));
            this.classList.add('active');
            
            const category = this.getAttribute('data-category');
            const cells = document.querySelectorAll('.honeycomb-cell');
            
            cells.forEach(cell => {
                if (category === 'all') {
                    cell.classList.remove('filtered-out');
                } else if (cell.classList.contains(category)) {
                    cell.classList.remove('filtered-out');
                } else {
                    cell.classList.add('filtered-out');
                }
            });
        });
    });

    renderHoneycombGrid();

    /* --------------------------------------------------------------------------
       9. REAL ARCHIVE GALLERY MASONRY RENDERER
       -------------------------------------------------------------------------- */
    const galleryItems = [
        {
            title: "Professional Portrait",
            tag: "College Activities",
            category: "activities",
            image: "assets/priyaa_photo.jpg"
        },
        {
            title: "PC Assembling Workshop",
            tag: "Workshops & Events",
            category: "workshops",
            image: "assets/cert_pc_assembling.jpg"
        },
        {
            title: "Startup Sparks incubation",
            tag: "College Activities",
            category: "activities",
            image: "assets/cert_startup_sparks.jpg"
        },
        {
            title: "TN-IMPACT 2026 Student Volunteer",
            tag: "Workshops & Events",
            category: "workshops",
            image: "assets/cert_tn_impact.jpg"
        },
        {
            title: "Hands on Arduino Sensors Bootcamp",
            tag: "Workshops & Events",
            category: "workshops",
            image: "assets/cert_ksr_dot_bootcamp.jpg"
        },
        {
            title: "Electrothon 2025 Competitor",
            tag: "Hackathons",
            category: "hackathons",
            image: "assets/cert_electrothon.jpg"
        },
        {
            title: "T4TEQ Python Programming",
            tag: "Project Demos",
            category: "demos",
            image: "assets/cert_t4teq_python.jpg"
        },
        {
            title: "Circuit Building & Hardware",
            tag: "Project Demos",
            category: "demos",
            image: "assets/cert_circuit_building.jpg"
        },
        {
            title: "T4TEQ Advanced C Programming",
            tag: "Project Demos",
            category: "demos",
            image: "assets/cert_t4teq_c.jpg"
        },
        {
            title: "Professional Credentials Resume",
            tag: "College Activities",
            category: "activities",
            image: "assets/resume_image.jpg"
        }
    ];

    const masonryGrid = document.getElementById('gallery-masonry');
    const galleryFilterBtns = document.querySelectorAll('.gallery-filter-btn');

    function renderMasonryGrid() {
        if (!masonryGrid) return;
        masonryGrid.innerHTML = '';
        
        galleryItems.forEach((item, idx) => {
            const div = document.createElement('div');
            div.className = `gallery-item ${item.category}`;
            div.setAttribute('data-index', idx);
            
            div.innerHTML = `
                <div class="gallery-image-box">
                    <img src="${item.image}" alt="${item.title}" loading="lazy">
                    <div class="gallery-zoom-icon"><i class="fas fa-search-plus"></i></div>
                    <div class="gallery-overlay">
                        <span class="gallery-tag">${item.tag}</span>
                        <h4 class="gallery-title">${item.title}</h4>
                    </div>
                </div>
            `;
            
            // Add click event for lightbox trigger
            div.addEventListener('click', () => {
                openLightbox(idx);
            });
            
            masonryGrid.appendChild(div);
        });
    }

    // Filter Masonry
    galleryFilterBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            galleryFilterBtns.forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            
            const filterValue = this.getAttribute('data-filter');
            const items = document.querySelectorAll('.gallery-item');
            
            items.forEach(item => {
                if (filterValue === 'all') {
                    item.classList.remove('hidden');
                } else if (item.classList.contains(filterValue)) {
                    item.classList.remove('hidden');
                } else {
                    item.classList.add('hidden');
                }
            });
        });
    });

    renderMasonryGrid();

    /* --------------------------------------------------------------------------
       10. ACTIVE VISUALS LIGHTBOX ENGINE
       -------------------------------------------------------------------------- */
    const lightbox = document.getElementById('lightbox');
    const lightboxImg = document.getElementById('lightbox-target-img');
    const lightboxCaption = document.getElementById('lightbox-target-caption');
    const lightboxClose = document.getElementById('lightbox-close-btn');
    const lightboxPrev = document.getElementById('lightbox-prev-btn');
    const lightboxNext = document.getElementById('lightbox-next-btn');
    
    let currentLightboxIdx = 0;
    
    // Lightbox Open
    function openLightbox(index) {
        currentLightboxIdx = index;
        const item = galleryItems[index];
        
        lightboxImg.src = item.image;
        lightboxCaption.textContent = `${item.tag} // ${item.title}`;
        lightbox.style.display = 'flex';
    }

    // Lightbox Close
    lightboxClose.addEventListener('click', () => {
        lightbox.style.display = 'none';
    });

    // Close on click outside frame
    lightbox.addEventListener('click', (e) => {
        if (e.target === lightbox) {
            lightbox.style.display = 'none';
        }
    });

    // Navigate Lightbox
    lightboxPrev.addEventListener('click', () => {
        currentLightboxIdx = (currentLightboxIdx - 1 + galleryItems.length) % galleryItems.length;
        openLightbox(currentLightboxIdx);
    });

    lightboxNext.addEventListener('click', () => {
        currentLightboxIdx = (currentLightboxIdx + 1) % galleryItems.length;
        openLightbox(currentLightboxIdx);
    });

    // Bind certificate back "View Full Screen" trigger links
    document.querySelectorAll('.view-cert-btn').forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.stopPropagation();
            const imgSrc = this.getAttribute('data-image');
            
            // Find index matching this certificate image
            const matchIdx = galleryItems.findIndex(item => item.image === imgSrc);
            if (matchIdx !== -1) {
                openLightbox(matchIdx);
            } else {
                lightboxImg.src = imgSrc;
                lightboxCaption.textContent = "VERIFIED CREDENTIALS // Sona College of Technology";
                lightbox.style.display = 'flex';
            }
        });
    });

    /* --------------------------------------------------------------------------
       11. INTERACTIVE TERMINAL CONTACT FORM
       -------------------------------------------------------------------------- */
    const contactForm = document.getElementById('contact-form');
    const consoleLog = document.getElementById('form-feedback-console');

    // Custom console entry logs
    function printConsoleEntry(text, type = 'info') {
        const entry = document.createElement('div');
        entry.className = `console-entry ${type}`;
        
        const timestamp = new Date().toLocaleTimeString();
        entry.textContent = `[${timestamp}] > ${text}`;
        
        consoleLog.appendChild(entry);
        consoleLog.scrollTop = consoleLog.scrollHeight;
    }

    printConsoleEntry("Terminal online. Standing by for packet configurations...", "info");

    if (contactForm) {
        contactForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            const name = document.getElementById('form-name').value;
            const email = document.getElementById('form-email').value;
            const payload = document.getElementById('form-msg').value;
            
            // Print progress
            printConsoleEntry("Connecting socket channel port 2007...", "info");
            
            setTimeout(() => {
                printConsoleEntry(`Transmitting packet header [Source: ${email}]...`, "info");
            }, 600);

            setTimeout(() => {
                printConsoleEntry(`Parsing payload structure [Size: ${payload.length} bytes]...`, "info");
            }, 1200);

            setTimeout(() => {
                printConsoleEntry("Injecting encryption keys into secure database...", "warn");
            }, 1800);

            setTimeout(() => {
                printConsoleEntry(`Success: Transmission packets acknowledged by priority recipient PRIYAA DHARSHINI TN!`, "success");
                printConsoleEntry(`Resetting inputs. Ready for next packet deployment.`, "info");
                
                // Clear form
                contactForm.reset();
            }, 2600);
        });
    }

    /* --------------------------------------------------------------------------
       12. INTERACTION OBSERVER SCROLL REVEALS
       -------------------------------------------------------------------------- */
    const revealElements = document.querySelectorAll('[data-reveal]');
    
    const revealObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('revealed');
                revealObserver.unobserve(entry.target);
            }
        });
    }, {
        threshold: 0.12,
        rootMargin: '0px 0px -50px 0px' // Trigger slightly before entry
    });

    revealElements.forEach(el => {
        revealObserver.observe(el);
    });

    /* --------------------------------------------------------------------------
       13. THREE.JS OR DYNAMIC CIRCUIT IMPULSE CURSOR CLICK ACCENT
       -------------------------------------------------------------------------- */
    const demoTriggers = document.querySelectorAll('.demo-trigger');
    demoTriggers.forEach(trigger => {
        trigger.addEventListener('click', (e) => {
            e.preventDefault();
            printConsoleEntry("Triggering dynamic simulated project interface port...", "warn");
            alert("Simulating Interactive Live Demo Interface... System online!");
        });
    });

});
