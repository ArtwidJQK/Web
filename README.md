<!DOCTYPE html>
<html lang="vi">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Chào Phạm Tổng!</title>
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/animate.css/4.1.1/animate.min.css">
<style>
:root {
    /* Palette nâng cấp với màu gradient hiện đại */
    --primary: #6366f1;
    --primary-light: #818cf8;
    --primary-dark: #4f46e5;
    --secondary: #06b6d4;
    --secondary-light: #22d3ee;
    --accent: #f43f5e;
    --accent-light: #fb7185;
    --dark: #1e293b;
    --darker: #0f172a;
    --light: #f8fafc;
    --lighter: #ffffff;
    
    /* Backgrounds */
    --night-bg-start: #0f172a;
    --night-bg-end: #1e293b;
    --day-bg-start: #e0f2fe;
    --day-bg-end: #bae6fd;
    --pink-bg-start: #fce7f3;
    --pink-bg-end: #fbcfe8;
    
    /* Animations & Effects */
    --loading-start: #67e8f9;
    --loading-mid: #a5f3fc;
    --loading-end: #ecfeff;
}

body {
    margin: 0;
    overflow: hidden;
    background: linear-gradient(135deg, var(--day-bg-start), var(--day-bg-end));
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 100vh;
    perspective: 1200px;
    transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
    color: var(--dark);
}

.main-container {
    width: 100%;
    max-width: 100vw;
    height: 100vh;
    display: flex;
    justify-content: center;
    align-items: center;
    position: relative;
}

.cosmic-container {
    position: relative;
    width: 90%;
    max-width: 600px;
    border-radius: 24px;
    box-shadow: 
        0 20px 40px rgba(0, 0, 0, 0.1),
        0 10px 20px rgba(0, 0, 0, 0.08),
        inset 0 0 80px rgba(99, 102, 241, 0.1);
    overflow: hidden;
    background-color: rgba(255, 255, 255, 0.8);
    text-align: center;
    padding: 40px;
    backdrop-filter: blur(16px);
    transform-style: preserve-3d;
    transition: transform 0.6s cubic-bezier(0.4, 0, 0.2, 1);
}

#header-container {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 30vh;
    overflow: hidden;
    background: linear-gradient(45deg, var(--primary-light), var(--secondary-light));
    transition: all 0.5s ease;
}

#header-canvas {
    width: 100%;
    height: 100%;
}

.notification-wrapper {
    margin-top: 25vh;
    position: relative;
    z-index: 1;
}

#notification {
    color: var(--dark);
    font-size: 2.4em;
    font-weight: 700;
    margin-bottom: 30px;
    transform-style: preserve-3d;
    transform: translateZ(10px);
    transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
    text-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
    background: linear-gradient(to right, var(--primary), var(--secondary));
    -webkit-background-clip: text;
    background-clip: text;
    -webkit-text-fill-color: transparent;
    line-height: 1.4;
}

#notification.angry {
    background: linear-gradient(to right, var(--accent), var(--accent-light));
    -webkit-background-clip: text;
    background-clip: text;
    -webkit-text-fill-color: transparent;
    text-shadow: 0 0 20px rgba(244, 63, 94, 0.3);
    transform: translateZ(20px) scale(1.05);
}

#notification.happy {
    background: linear-gradient(to right, var(--primary), var(--secondary-light));
    -webkit-background-clip: text;
    background-clip: text;
    -webkit-text-fill-color: transparent;
    text-shadow: 0 0 20px rgba(99, 102, 241, 0.3);
    transform: translateZ(15px);
}

#notification:hover {
    transform: translateZ(25px);
}

.button-group {
    display: flex;
    gap: 20px;
    justify-content: center;
    margin-top: 40px;
    transform-style: preserve-3d;
}

.btn-3d {
    padding: 16px 32px;
    background: linear-gradient(45deg, var(--primary) 0%, var(--primary-light) 100%);
    border: none;
    border-radius: 50px;
    color: var(--light);
    font-size: 1.2em;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
    box-shadow: 
        0 10px 25px -5px rgba(99, 102, 241, 0.5),
        0 8px 10px -6px rgba(99, 102, 241, 0.3);
    position: relative;
    overflow: hidden;
    z-index: 1;
    transform-style: preserve-3d;
    transform: translateZ(5px);
    letter-spacing: 0.5px;
}

.btn-3d::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 0%;
    height: 100%;
    background: linear-gradient(45deg, var(--secondary) 0%, var(--primary) 100%);
    transition: width 0.6s cubic-bezier(0.4, 0, 0.2, 1);
    z-index: -1;
    border-radius: 50px;
}

.btn-3d:hover {
    transform: translateZ(15px) translateY(-5px);
    box-shadow: 
        0 20px 25px -5px rgba(99, 102, 241, 0.4),
        0 10px 10px -6px rgba(99, 102, 241, 0.2);
}

.btn-3d:hover::before {
    width: 100%;
}

.btn-3d:active {
    transform: translateZ(5px) translateY(0);
}

.theme-controls {
    position: fixed;
    top: 20px;
    right: 20px;
    display: flex;
    gap: 10px;
    z-index: 100;
}

.theme-button {
    padding: 12px 18px;
    border: none;
    border-radius: 12px;
    cursor: pointer;
    font-size: 1em;
    font-weight: 500;
    color: var(--darker);
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    box-shadow: 
        0 4px 6px -1px rgba(0, 0, 0, 0.1),
        0 2px 4px -2px rgba(0, 0, 0, 0.05);
}

.theme-button:hover {
    transform: translateY(-2px);
    box-shadow: 
        0 10px 15px -3px rgba(0, 0, 0, 0.1),
        0 4px 6px -4px rgba(0, 0, 0, 0.05);
}

.blue-theme {
    background-color: var(--day-bg-start);
}

.pink-theme {
    background-color: var(--pink-bg-start);
}

.night-theme {
    background-color: var(--night-bg-start);
    color: var(--light);
}

/* Entrance Animation */
.entrance-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: linear-gradient(135deg, var(--darker), var(--dark));
    z-index: 1000;
    display: flex;
    justify-content: center;
    align-items: center;
    flex-direction: column;
    transition: opacity 1s cubic-bezier(0.4, 0, 0.2, 1);
}

.entrance-title {
    font-size: 3.5rem;
    font-weight: 800;
    background: linear-gradient(to right, var(--secondary), var(--primary-light));
    -webkit-background-clip: text;
    background-clip: text;
    color: transparent;
    opacity: 0;
    transform: translateY(50px);
    animation: fadeInUp 1.5s forwards 0.5s;
    text-align: center;
    letter-spacing: 1px;
}

.entrance-subtitle {
    font-size: 1.8rem;
    color: var(--light);
    opacity: 0;
    transform: translateY(30px);
    animation: fadeInUp 1.5s forwards 1s;
    text-align: center;
    margin-top: 20px;
    font-weight: 300;
}

.entrance-loader {
    width: 250px;
    height: 8px;
    background: rgba(255, 255, 255, 0.1);
    margin-top: 40px;
    border-radius: 8px;
    overflow: hidden;
    opacity: 0;
    animation: fadeIn 0.5s forwards 1.5s;
}

.entrance-loader-progress {
    height: 100%;
    width: 0;
    background: linear-gradient(to right, var(--loading-start), var(--loading-mid), var(--loading-end));
    border-radius: 8px;
    animation: loading 2s forwards 1.7s;
}

/* Particle Effects */
.particles-container {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    pointer-events: none;
    z-index: 0;
    overflow: hidden;
}

.particle {
    position: absolute;
    background: var(--primary-light);
    border-radius: 50%;
    opacity: 0;
    animation: float 15s infinite ease-in-out;
}

/* Geometric Decorations */
.geometric-shapes {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    z-index: -1;
    pointer-events: none;
    overflow: hidden;
}

.shape {
    position: absolute;
    opacity: 0.05;
    background: linear-gradient(45deg, var(--primary), var(--secondary));
    animation: rotate 30s infinite linear;
}

.square {
    width: 100px;
    height: 100px;
}

.circle {
    width: 150px;
    height: 150px;
    border-radius: 50%;
}

.triangle {
    width: 0;
    height: 0;
    border-left: 100px solid transparent;
    border-right: 100px solid transparent;
    border-bottom: 173px solid var(--primary-light);
    background: transparent;
}

/* Animations */
@keyframes fadeInUp {
    to {
        opacity: 1;
        transform: translateY(0);
    }
}

@keyframes fadeIn {
    to {
        opacity: 1;
    }
}

@keyframes loading {
    to {
        width: 100%;
    }
}

@keyframes float {
    0%, 100% { 
        transform: translateY(0) translateX(0);
        opacity: 0;
    }
    25% { 
        opacity: 0.3;
    }
    50% { 
        transform: translateY(-80vh) translateX(40vw);
        opacity: 0.6;
    }
    75% {
        opacity: 0.3;
    }
}

@keyframes rotate {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
}

/* Responsive Design */
@media (max-width: 768px) {
    .cosmic-container {
        width: 90%;
        padding: 30px 20px;
    }
    
    #notification {
        font-size: 1.8em;
    }
    
    .btn-3d {
        padding: 14px 28px;
        font-size: 1em;
    }
    
    .entrance-title {
        font-size: 2.5rem;
    }
    
    .entrance-subtitle {
        font-size: 1.4rem;
    }
    
    .theme-controls {
        flex-direction: column;
    }
}

/* Night Mode */
body.night-mode {
    background: linear-gradient(135deg, var(--night-bg-start), var(--night-bg-end));
    color: var(--light);
}

body.night-mode .cosmic-container {
    background-color: rgba(30, 41, 59, 0.8);
}

body.night-mode #notification {
    color: var(--light);
}

/* Pink Mode */
body.pink-mode {
    background: linear-gradient(135deg, var(--pink-bg-start), var(--pink-bg-end));
}

/* Custom Scrollbar */
::-webkit-scrollbar {
    width: 8px;
}

::-webkit-scrollbar-track {
    background: rgba(241, 245, 249, 0.5);
    border-radius: 10px;
}

::-webkit-scrollbar-thumb {
    background: var(--primary-light);
    border-radius: 10px;
}

::-webkit-scrollbar-thumb:hover {
    background: var(--primary);
}
</style>
</head>
<body>
<!-- Entrance Overlay -->
<div class="entrance-overlay">
    <div class="entrance-title animate__animated animate__fadeInUp">Chào Phạm Tổng!</div>
    <div class="entrance-subtitle animate__animated animate__fadeInUp animate__delay-1s">Đến giờ đi ngẩu rồi nèee</div>
    <div class="entrance-loader">
        <div class="entrance-loader-progress"></div>
    </div>
</div>

<!-- Geometric Decoration Elements -->
<div class="geometric-shapes" id="shapes-container"></div>

<!-- Particles -->
<div class="particles-container" id="particles-container"></div>

<!-- Main Content -->
<div class="main-container">
    <div class="cosmic-container" id="cosmic-container">
        <div id="header-container">
            <canvas id="header-canvas"></canvas>
        </div>
        <div class="notification-wrapper">
            <p id="notification">Chào Phạm tổng! Anh xin thông báo đã đến giờ bé phải đi ngẩu!! 🐼</p>
            <div class="button-group">
                <button id="goodnight-btn" class="btn-3d">vịu ơ rõ ạaa</button>
                <button id="hokkk-btn" class="btn-3d">hokkk</button>
            </div>
        </div>
    </div>
</div>

<!-- Theme Controls -->
<div class="theme-controls">
    <button id="blueTheme" class="theme-button blue-theme">Ngày Xanh</button>
    <button id="pinkTheme" class="theme-button pink-theme">Ngày Hồng</button>
    <button id="nightTheme" class="theme-button night-theme">Đêm</button>
</div>

<script>
    // Entrance Animation
    document.addEventListener('DOMContentLoaded', function() {
        createParticles();
        createShapes();
        setupWaveHeader();
        setTimeout(() => {
            const entranceOverlay = document.querySelector('.entrance-overlay');
            entranceOverlay.style.opacity = '0';
            setTimeout(() => {
                entranceOverlay.style.display = 'none';
            }, 1000);
        }, 3500);
    });

    // Create Floating Particles
    function createParticles() {
        const container = document.getElementById('particles-container');
        const particlesCount = 20;
        
        for (let i = 0; i < particlesCount; i++) {
            const particle = document.createElement('div');
            particle.classList.add('particle');
            
            // Random size between 5px and 20px
            const size = 5 + Math.random() * 15;
            particle.style.width = `${size}px`;
            particle.style.height = `${size}px`;
            
            // Random starting position
            const posX = Math.random() * 100;
            const posY = Math.random() * 100;
            particle.style.left = `${posX}%`;
            particle.style.top = `${posY}%`;
            
            // Random animation delay and duration
            particle.style.animationDelay = `${Math.random() * 5}s`;
            particle.style.animationDuration = `${15 + Math.random() * 30}s`;
            
            // Random opacity
            particle.style.opacity = 0.1 + Math.random() * 0.3;
            
            // Random color - use CSS variables with transparency
            const colors = [
                'rgba(99, 102, 241, 0.3)', // primary
                'rgba(129, 140, 248, 0.3)', // primary-light
                'rgba(6, 182, 212, 0.3)',   // secondary
                'rgba(34, 211, 238, 0.3)'   // secondary-light
            ];
            particle.style.background = colors[Math.floor(Math.random() * colors.length)];
            
            container.appendChild(particle);
        }
    }

    // Create Geometric Shapes
    function createShapes() {
        const container = document.getElementById('shapes-container');
        const shapesCount = 8;
        const shapeTypes = ['square', 'circle', 'triangle'];
        
        for (let i = 0; i < shapesCount; i++) {
            const shape = document.createElement('div');
            const shapeType = shapeTypes[Math.floor(Math.random() * shapeTypes.length)];
            shape.classList.add('shape', shapeType);
            
            // Random position
            const posX = Math.random() * 100;
            const posY = Math.random() * 100;
            shape.style.left = `${posX}%`;
            shape.style.top = `${posY}%`;
            
            // Random rotation
            shape.style.transform = `rotate(${Math.random() * 360}deg)`;
            
            // Random animation delay and duration
            shape.style.animationDelay = `${Math.random() * 5}s`;
            shape.style.animationDuration = `${30 + Math.random() * 60}s`;
            
            container.appendChild(shape);
        }
    }

    // Wave Header with Canvas
    function setupWaveHeader() {
        const canvas = document.getElementById('header-canvas');
        const ctx = canvas.getContext('2d');
        const headerContainer = document.getElementById('header-container');
        
        // Set canvas dimensions
        canvas.width = headerContainer.offsetWidth;
        canvas.height = headerContainer.offsetHeight;
        
        // Animation variables
        let time = 0;
        const waveColors = ['#818cf8', '#6366f1', '#22d3ee', '#06b6d4'];
        
        function drawWaves() {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            
            // Draw multiple wave layers
            for (let i = 0; i < waveColors.length; i++) {
                ctx.fillStyle = waveColors[i];
                ctx.beginPath();
                
                // Wave parameters
                const amplitude = 15 + i * 5;
                const period = 200 + i * 50;
                const verticalOffset = 50 + i * 30;
                
                // Start drawing
                ctx.moveTo(0, canvas.height);
                
                // Draw the wave
                for (let x = 0; x <= canvas.width; x += 5) {
                    const y = verticalOffset + 
                              amplitude * Math.sin((x / period) * 2 * Math.PI + time + i * 0.5);
                    ctx.lineTo(x, y);
                }
                
                // Complete the shape
                ctx.lineTo(canvas.width, canvas.height);
                ctx.lineTo(0, canvas.height);
                ctx.closePath();
                ctx.fill();
            }
            
            // Update time for animation
            time += 0.01;
            requestAnimationFrame(drawWaves);
        }
        
        // Start wave animation
        drawWaves();
        
        // Handle resize
        window.addEventListener('resize', function() {
            canvas.width = headerContainer.offsetWidth;
            canvas.height = headerContainer.offsetHeight;
        });
    }

    // 3D Effect for Container
    document.getElementById('cosmic-container').addEventListener('mousemove', function(e) {
        const container = this;
        const containerRect = container.getBoundingClientRect();
        const containerCenterX = containerRect.left + containerRect.width / 2;
        const containerCenterY = containerRect.top + containerRect.height / 2;
        
        const mouseX = e.clientX;
        const mouseY = e.clientY;
        
        const percentX = (mouseX - containerCenterX) / (containerRect.width / 2);
        const percentY = -((mouseY - containerCenterY) / (containerRect.height / 2));
        
        const maxRotation = 5; // degrees
        
        container.style.transform = `perspective(1200px) rotateY(${percentX * maxRotation}deg) rotateX(${percentY * maxRotation}deg)`;
    });

    document.getElementById('cosmic-container').addEventListener('mouseleave', function() {
        this.style.transform = 'perspective(1200px) rotateY(0deg) rotateX(0deg)';
    });

    // Theme Switching
    document.getElementById('blueTheme').addEventListener('click', () => {
        document.body.className = 'blue-mode';
        updateNotificationStyle('default');
    });

    document.getElementById('pinkTheme').addEventListener('click', () => {
        document.body.className = 'pink-mode';
        updateNotificationStyle('default');
    });

    document.getElementById('nightTheme').addEventListener('click', () => {
        document.body.className = 'night-mode';
        updateNotificationStyle('default');
    });

    // Button Interactions
    const notificationText = document.getElementById('notification');
    const hokkkBtn = document.getElementById('hokkk-btn');
    const goodnightBtn = document.getElementById('goodnight-btn');

    hokkkBtn.addEventListener('click', () => {
        notificationText.textContent = "Hoii mà đi ngẩu ngoan dùm anh đi bé iuuu:<<";
        updateNotificationStyle('angry');
    });

    goodnightBtn.addEventListener('click', () => {
        notificationText.textContent = "gútttt chọp bé iuu của anh:33";
        updateNotificationStyle('happy');
    });

    function updateNotificationStyle(style) {
        notificationText.classList.remove('angry', 'happy');
        
        if (style === 'angry') {
            notificationText.classList.add('angry');
        } else if (style === 'happy') {
            notificationText.classList.add('happy');
        }
    }
</script>
</body>
</html>
