// === Glide War - Game Engine ===

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const CANVAS_W = canvas.width;
const CANVAS_H = canvas.height;

// Game state
let running = false;
let gameOver = false;
let score = 0;

// Player
const player = {
    x: CANVAS_W / 2 - 20,
    y: CANVAS_H - 100,
    width: 40,
    height: 48,
    speed: 6
};

// Entity pools
let bullets = [];
let bossBullets = [];
let enemies = [];
let particles = [];
let powerups = [];

// Input tracking
const keys = {};

// Fire rate
let lastFireTime = 0;
const FIRE_COOLDOWN = 250;

// Power-up active effects (all temporary, from drops only)
let shieldTimer = 0;
let rapidFireTimer = 0;
let spreadShotTimer = 0;
let speedBoostTimer = 0;
let doubleDamageTimer = 0;
let iceFreezeTimer = 0;
let extraLives = 0;

// Special abilities
let abilityShieldCooldown = 0;   // 30s cooldown for Protective Shield (key 1)
let abilitySmashCooldown = 0;    // 30s cooldown for Smash Everything (key 2)
let abilityShieldActive = false; // true when shield was activated via ability (enhanced visual)

// Enemy spawn
let lastSpawnTime = 0;
const BASE_SPAWN_INTERVAL = 800;
const MIN_SPAWN_INTERVAL = 100;
let spawnInterval = BASE_SPAWN_INTERVAL;
const BASE_ENEMY_SPEED = 3.0;
const MAX_ENEMY_SPEED = 8.0;
let enemySpeed = BASE_ENEMY_SPEED;
let difficultyLevel = 1;

// Boss state
let boss = null;
let bossSpawnedThisLevel = false;
let bossWarningTimer = 0;
let bossWarningText = '';
let bossDefeatCooldown = 0;    // grace period after boss kill — keep spawns low


// Delta time
let lastTimestamp = 0;

// Screen shake
let shakeAmount = 0;
let shakeDuration = 0;

// Weather system
let weather = 'clear';        // 'clear', 'rain', 'snow'
let weatherTimer = 0;         // ms remaining for current weather
let weatherNextRoll = 0;      // ms until next weather change roll
let weatherParticles = [];

// Random events
let eventCooldown = 0;        // ms until next event roll
let activeEvent = null;       // 'meteor', 'ambush', 'powerupBonus'
let eventTimer = 0;           // ms remaining for current event
let eventWarning = '';
let meteors = [];

// Parallax background layers
const bgLayers = [
    { stars: [], speed: 0.3, count: 50, minSize: 0.5, maxSize: 1.0, alpha: 0.4 },  // Far: tiny slow stars
    { stars: [], speed: 0.7, count: 35, minSize: 0.8, maxSize: 1.8, alpha: 0.6 },  // Mid
    { stars: [], speed: 1.4, count: 20, minSize: 1.2, maxSize: 2.5, alpha: 0.85 }  // Near: larger fast stars
];

function initBackground() {
    for (let l = 0; l < bgLayers.length; l++) {
        const layer = bgLayers[l];
        layer.stars = [];
        for (let i = 0; i < layer.count; i++) {
            layer.stars.push({
                x: Math.random() * CANVAS_W,
                y: Math.random() * CANVAS_H,
                size: layer.minSize + Math.random() * (layer.maxSize - layer.minSize),
                twinkle: Math.random() * Math.PI * 2
            });
        }
    }
}
function updateBackground(dt) {
    if (!running) return;
    for (let l = 0; l < bgLayers.length; l++) {
        const layer = bgLayers[l];
        for (let i = 0; i < layer.stars.length; i++) {
            const s = layer.stars[i];
            s.y += layer.speed * dt;
            if (s.y > CANVAS_H + 5) { s.y = -5; s.x = Math.random() * CANVAS_W; }
            s.twinkle += 0.02 * dt;
        }
    }
}
function drawBackground() {
    for (let l = 0; l < bgLayers.length; l++) {
        const layer = bgLayers[l];
        for (let i = 0; i < layer.stars.length; i++) {
            const s = layer.stars[i];
            const flicker = 0.6 + 0.4 * Math.sin(s.twinkle);
            ctx.globalAlpha = layer.alpha * flicker;
            ctx.fillStyle = '#c8d8ff';
            ctx.beginPath();
            ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
            ctx.fill();
        }
    }
    ctx.globalAlpha = 1.0;
}

function triggerShake(amount, duration) {
    shakeAmount = Math.max(shakeAmount, amount);
    shakeDuration = Math.max(shakeDuration, duration);
}

// === Weather system ===
function initWeather() {
    weather = 'clear'; weatherTimer = 0;
    weatherNextRoll = 20000 + Math.random() * 30000; // first roll in 20-50s
    weatherParticles = [];
}
function rollWeather() {
    const r = Math.random();
    if (r < 0.35) weather = 'rain';
    else if (r < 0.65) weather = 'snow';
    else weather = 'clear';
    weatherTimer = 15000 + Math.random() * 15000; // 15-30s
    weatherNextRoll = weatherTimer + 15000 + Math.random() * 25000;
}
function updateWeather(dt, elapsed) {
    weatherNextRoll -= elapsed;
    if (weatherNextRoll <= 0) rollWeather();
    if (weather !== 'clear') {
        weatherTimer -= elapsed;
        if (weatherTimer <= 0) { weather = 'clear'; weatherNextRoll = 25000 + Math.random() * 35000; weatherParticles = []; }
    }
    // Manage weather particles
    if (weather === 'rain') {
        // Spawn rain drops
        const spawnRate = 2; // per frame at 60fps
        for (let i = 0; i < Math.ceil(spawnRate * dt); i++) {
            weatherParticles.push({
                x: Math.random() * (CANVAS_W + 80) - 40,
                y: -10 - Math.random() * CANVAS_H,
                vy: 6 + Math.random() * 4,
                vx: -1 - Math.random() * 1.5,
                life: 1.0, size: 0.5 + Math.random() * 1,
                color: 'rgba(130, 180, 255, ' + (0.3 + Math.random() * 0.35) + ')'
            });
        }
    } else if (weather === 'snow') {
        const spawnRate = 1;
        for (let i = 0; i < Math.ceil(spawnRate * dt); i++) {
            weatherParticles.push({
                x: Math.random() * (CANVAS_W + 80) - 40,
                y: -10,
                vy: 0.8 + Math.random() * 1.2,
                vx: (Math.random() - 0.5) * 1.5,
                life: 1.0, size: 1.5 + Math.random() * 3,
                wobble: Math.random() * Math.PI * 2, wobbleSpeed: 0.01 + Math.random() * 0.03,
                color: 'rgba(220, 230, 255, ' + (0.4 + Math.random() * 0.5) + ')'
            });
        }
    }
    // Update particles
    for (let i = weatherParticles.length - 1; i >= 0; i--) {
        const p = weatherParticles[i];
        p.y += p.vy * dt;
        p.x += p.vx * dt;
        if (p.wobble !== undefined) { p.wobble += p.wobbleSpeed * dt; p.x += Math.sin(p.wobble) * 0.3 * dt; }
        if (p.y > CANVAS_H + 10) weatherParticles.splice(i, 1);
    }
    // Cap particles
    if (weatherParticles.length > 300) weatherParticles.splice(0, weatherParticles.length - 300);
}
function drawWeather() {
    if (weather === 'clear' && weatherParticles.length === 0) return;
    for (let i = 0; i < weatherParticles.length; i++) {
        const p = weatherParticles[i];
        ctx.fillStyle = p.color;
        if (weather === 'rain') {
            ctx.fillRect(p.x, p.y, 1, 8 + p.size * 3);
        } else {
            ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2); ctx.fill();
        }
    }
    // Weather label
    if (weather !== 'clear') {
        ctx.fillStyle = weather === 'rain' ? 'rgba(100, 150, 220, 0.7)' : 'rgba(200, 220, 240, 0.7)';
        ctx.font = 'bold 11px Arial'; ctx.textAlign = 'left';
        ctx.fillText(weather === 'rain' ? 'RAIN' : 'SNOW', 14, CANVAS_H - 14);
    }
}

// === Random Events system ===
function initEvents() {
    activeEvent = null; eventTimer = 0; eventWarning = '';
    meteors = [];
    eventCooldown = 20000 + Math.random() * 25000;
}
function rollRandomEvent() {
    if (activeEvent) return;
    const r = Math.random();
    if (r < 0.40) startMeteorShower();
    else if (r < 0.75) startAmbush();
    else startPowerUpBonus();
}
function startMeteorShower() {
    activeEvent = 'meteor'; eventTimer = 4000; eventWarning = 'METEOR SHOWER!';
    meteors = [];
    for (let i = 0; i < 8 + Math.floor(Math.random() * 6); i++) {
        meteors.push({
            x: Math.random() * CANVAS_W, y: -(Math.random() * 400),
            speed: 3 + Math.random() * 5, size: 6 + Math.random() * 12,
            delay: Math.random() * 2500
        });
    }
    playBossWarningSound();
}
function startAmbush() {
    activeEvent = 'ambush'; eventTimer = 500; eventWarning = 'ENEMY AMBUSH!';
    const count = 4 + Math.floor(Math.random() * 5);
    for (let i = 0; i < count; i++) {
        const type = pickEnemyType(), size = enemySize(type);
        const x = Math.random() * (CANVAS_W - size.w);
        const y = -size.h - Math.random() * 80;
        const bs = enemySpeed;
        const s = type === 0 ? bs * 1.1 : type === 1 ? bs * 0.9 : type === 2 ? bs * 0.6 : bs * 0.4;
        enemies.push({ x, y, width: size.w, height: size.h, speed: s, type, hp: enemyHPMax(type), hpMax: enemyHPMax(type), spawnX: x, spawnTime: performance.now() });
    }
    playBossWarningSound();
}
function startPowerUpBonus() {
    activeEvent = 'powerupBonus'; eventTimer = 3000; eventWarning = 'POWER-UP BONUS!';
    const types = Object.keys(POWERUP_TYPES);
    for (let i = 0; i < 4; i++) {
        setTimeout(function() {
            if (!running) return;
            const type = types[Math.floor(Math.random() * types.length)];
            powerups.push({
                x: 40 + Math.random() * (CANVAS_W - 80), y: 80 + Math.random() * 200,
                width: 18, height: 18, type: type, speed: 1.2
            });
        }, i * 400);
    }
    playPowerUpSound();
}
function updateEvents(dt, elapsed) {
    if (activeEvent) {
        eventTimer -= elapsed;
        if (eventTimer <= 0) { activeEvent = null; eventWarning = ''; meteors = []; }
    } else {
        eventCooldown -= elapsed;
        if (eventCooldown <= 0 && !boss) {
            rollRandomEvent();
            eventCooldown = 20000 + Math.random() * 30000;
        }
    }
    // Update meteors
    if (activeEvent === 'meteor') {
        for (let i = meteors.length - 1; i >= 0; i--) {
            const m = meteors[i];
            if (m.delay > 0) { m.delay -= elapsed; continue; }
            m.y += m.speed * dt;
            // Meteor vs player (only if shield down and no extra life buffer)
            if (shieldTimer <= 0 && checkCollision(player, { x: m.x - m.size / 2, y: m.y - m.size / 2, width: m.size, height: m.size })) {
                if (extraLives > 0) {
                    extraLives--;
                    spawnExplosion(m.x, m.y, '#ff8844', 10, 3);
                    scoreDisplay.textContent = 'Score: ' + score + ' | Lv ' + difficultyLevel + (extraLives > 0 ? ' | ' + extraLives + 'UP' : '');
                    playPowerUpSound();
                    meteors.splice(i, 1); continue;
                }
                spawnExplosion(player.x + player.width / 2, player.y + player.height / 2, '#ff4400', 15, 5);
                triggerShake(10, 500);
                playGameOverSound(); endGame(); return;
            }
            // Meteor vs enemies (instant kill)
            for (let e = enemies.length - 1; e >= 0; e--) {
                if (checkCollision({ x: m.x - m.size / 2, y: m.y - m.size / 2, width: m.size, height: m.size }, enemies[e])) {
                    const ex = enemies[e].x + enemies[e].width / 2, ey = enemies[e].y + enemies[e].height / 2;
                    spawnExplosion(ex, ey, '#ff8844', 8, 4);
                    spawnPowerup(ex, ey);
                    score += enemyPoints(enemies[e].type);
                    enemies.splice(e, 1);
                    meteors.splice(i, 1);
                    updateDifficulty(); break;
                }
            }
            if (m.y > CANVAS_H + 20) meteors.splice(i, 1);
        }
    }
}
function drawEvents() {
    // Meteor shower
    if (activeEvent === 'meteor') {
        for (let i = 0; i < meteors.length; i++) {
            const m = meteors[i];
            if (m.delay > 0) continue;
            ctx.save(); ctx.translate(m.x, m.y);
            // Meteor body
            const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, m.size);
            grad.addColorStop(0, '#ffffff'); grad.addColorStop(0.2, '#ffcc44');
            grad.addColorStop(0.6, '#ff6600'); grad.addColorStop(1, 'rgba(100, 20, 0, 0)');
            ctx.fillStyle = grad;
            ctx.beginPath(); ctx.arc(0, 0, m.size, 0, Math.PI * 2); ctx.fill();
            // Tail
            ctx.strokeStyle = 'rgba(255, 200, 50, 0.6)';
            ctx.lineWidth = m.size * 0.4;
            ctx.beginPath(); ctx.moveTo(0, -m.size); ctx.lineTo(0, -m.size - 12 - Math.random() * 8);
            ctx.stroke();
            ctx.restore();
        }
    }
    // Event warning text
    if (eventWarning) {
        ctx.fillStyle = activeEvent === 'meteor' ? '#ff6600' : activeEvent === 'ambush' ? '#ff3333' : '#ffcc00';
        ctx.font = 'bold 20px Arial'; ctx.textAlign = 'center';
        ctx.fillText(eventWarning, CANVAS_W / 2, CANVAS_H / 2 - 120);
    }
}

// === Enemy Types ===
// type 0: Scout  — fast, 1 HP, 100 pts
// type 1: Zigzag — sine wave, 1 HP, 150 pts
// type 2: Tank   — slow, 5 HP, 200 pts
// type 3: Elite  — very slow, 10 HP, 500 pts (lv 7+)
function enemyHPMax(type) { if (type === 3) return 15; if (type === 2) return 8; return 1; }
function enemyPoints(type) { if (type === 3) return 500; if (type === 2) return 200; if (type === 1) return 150; return 100; }
function enemySize(type) {
    if (type === 3) return { w: 56, h: 52 };
    if (type === 0) return { w: 40, h: 40 };
    if (type === 1) return { w: 36, h: 36 };
    return { w: 48, h: 44 };
}
function enemyColor(type) {
    if (type === 3) return '#d4d4d4'; // Silver — Elite
    if (type === 0) return '#ff4444';
    if (type === 1) return '#ff8800';
    return '#cc44cc';
}
function enemyCockpitColor(type) {
    if (type === 3) return '#ffd700'; // Gold — Elite
    if (type === 0) return '#ffaaaa';
    if (type === 1) return '#ffcc88';
    return '#eeaaee';
}
function pickEnemyType() {
    if (difficultyLevel >= 7) {
        const r = Math.random();
        if (r < 0.30) return 0;  // Scout
        if (r < 0.55) return 1;  // Zigzag
        if (r < 0.85) return 2;  // Tank
        return 3;                 // Elite (15%)
    }
    if (difficultyLevel >= 5) {
        const r = Math.random();
        if (r < 0.30) return 0; if (r < 0.65) return 1; return 2;
    }
    if (difficultyLevel >= 3) { return Math.random() < 0.50 ? 0 : 1; }
    return 0;
}

// === Audio Engine ===
let audioCtx = null;
function initAudio() { if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)(); }
function playShootSound() {
    if (!audioCtx) return;
    const o = audioCtx.createOscillator(), g = audioCtx.createGain();
    o.connect(g); g.connect(audioCtx.destination);
    o.type = 'square'; o.frequency.setValueAtTime(600, audioCtx.currentTime);
    o.frequency.exponentialRampToValueAtTime(200, audioCtx.currentTime + 0.08);
    g.gain.setValueAtTime(0.1, audioCtx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.08);
    o.start(audioCtx.currentTime); o.stop(audioCtx.currentTime + 0.08);
}
function playExplosionSound() {
    if (!audioCtx) return;
    const s = audioCtx.sampleRate * 0.15, b = audioCtx.createBuffer(1, s, audioCtx.sampleRate), d = b.getChannelData(0);
    for (let i = 0; i < s; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / s);
    const src = audioCtx.createBufferSource(), g = audioCtx.createGain(), f = audioCtx.createBiquadFilter();
    src.buffer = b; f.type = 'lowpass';
    f.frequency.setValueAtTime(800, audioCtx.currentTime);
    f.frequency.exponentialRampToValueAtTime(100, audioCtx.currentTime + 0.15);
    g.gain.setValueAtTime(0.15, audioCtx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.15);
    src.connect(f); f.connect(g); g.connect(audioCtx.destination);
    src.start(audioCtx.currentTime);
}
function playBossExplosionSound() {
    if (!audioCtx) return;
    const o1 = audioCtx.createOscillator(), o2 = audioCtx.createOscillator(), g = audioCtx.createGain();
    o1.connect(g); o2.connect(g); g.connect(audioCtx.destination);
    o1.type = 'sawtooth'; o1.frequency.setValueAtTime(200, audioCtx.currentTime);
    o1.frequency.exponentialRampToValueAtTime(30, audioCtx.currentTime + 0.8);
    o2.type = 'square'; o2.frequency.setValueAtTime(100, audioCtx.currentTime);
    o2.frequency.exponentialRampToValueAtTime(20, audioCtx.currentTime + 0.6);
    g.gain.setValueAtTime(0.2, audioCtx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.8);
    o1.start(audioCtx.currentTime); o2.start(audioCtx.currentTime);
    o1.stop(audioCtx.currentTime + 0.8); o2.stop(audioCtx.currentTime + 0.8);
}
function playGameOverSound() {
    if (!audioCtx) return;
    const o = audioCtx.createOscillator(), g = audioCtx.createGain();
    o.connect(g); g.connect(audioCtx.destination); o.type = 'sawtooth';
    o.frequency.setValueAtTime(300, audioCtx.currentTime);
    o.frequency.exponentialRampToValueAtTime(60, audioCtx.currentTime + 0.5);
    g.gain.setValueAtTime(0.15, audioCtx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.5);
    o.start(audioCtx.currentTime); o.stop(audioCtx.currentTime + 0.5);
}
function playBossWarningSound() {
    if (!audioCtx) return;
    const o = audioCtx.createOscillator(), g = audioCtx.createGain();
    o.connect(g); g.connect(audioCtx.destination); o.type = 'triangle';
    o.frequency.setValueAtTime(440, audioCtx.currentTime);
    o.frequency.setValueAtTime(660, audioCtx.currentTime + 0.3);
    o.frequency.setValueAtTime(440, audioCtx.currentTime + 0.6);
    g.gain.setValueAtTime(0.1, audioCtx.currentTime);
    g.gain.setValueAtTime(0.0, audioCtx.currentTime + 1.0);
    o.start(audioCtx.currentTime); o.stop(audioCtx.currentTime + 1.0);
}
function playPowerUpSound() {
    if (!audioCtx) return;
    const o = audioCtx.createOscillator(), g = audioCtx.createGain();
    o.connect(g); g.connect(audioCtx.destination); o.type = 'sine';
    o.frequency.setValueAtTime(400, audioCtx.currentTime);
    o.frequency.exponentialRampToValueAtTime(1200, audioCtx.currentTime + 0.12);
    g.gain.setValueAtTime(0.12, audioCtx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.15);
    o.start(audioCtx.currentTime); o.stop(audioCtx.currentTime + 0.15);
}

// === DOM elements ===
const scoreDisplay = document.getElementById('scoreDisplay');
const startScreen = document.getElementById('startScreen');
const gameOverScreen = document.getElementById('gameOver');
const finalScoreSpan = document.getElementById('finalScore');
const startBtn = document.getElementById('startBtn');
const restartBtn = document.getElementById('restartBtn');

// === Input ===
document.addEventListener('keydown', function(e) {
    keys[e.code] = true;
    if (e.code === 'Space') e.preventDefault();
    // Special abilities
    if (e.code === 'Digit1' || e.code === 'Numpad1') activateProtectiveShield();
    if (e.code === 'Digit2' || e.code === 'Numpad2') { activateSmashEverything(); e.preventDefault(); }
});
document.addEventListener('keyup', function(e) { keys[e.code] = false; });

// === Collision detection ===
function checkCollision(a, b) {
    return a.x < b.x + b.width && a.x + a.width > b.x &&
           a.y < b.y + b.height && a.y + a.height > b.y;
}

// === Particle system ===
function spawnExplosion(x, y, color, count, size) {
    count = count || 12; size = size || 4;
    for (let i = 0; i < count; i++) {
        const a = (Math.PI * 2 * i) / count + Math.random() * 0.4;
        const s = 2 + Math.random() * 4;
        particles.push({
            x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s,
            life: 1.0, decay: 0.015 + Math.random() * 0.035,
            size: 1 + Math.random() * size, color, shape: 'circle'
        });
    }
}

function spawnSparkBurst(x, y, color) {
    for (let i = 0; i < 6; i++) {
        const a = Math.random() * Math.PI * 2;
        const s = 2 + Math.random() * 3;
        particles.push({
            x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s,
            life: 1.0, decay: 0.04 + Math.random() * 0.06,
            size: 0.8 + Math.random() * 1.5, color, shape: 'spark'
        });
    }
}

function spawnDebris(x, y) {
    for (let i = 0; i < 5; i++) {
        const a = Math.random() * Math.PI * 2;
        const s = 1 + Math.random() * 2.5;
        particles.push({
            x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 1,
            life: 1.0, decay: 0.008 + Math.random() * 0.015,
            size: 2 + Math.random() * 4,
            color: Math.random() < 0.5 ? '#ff8844' : '#ffaa22',
            shape: 'debris'
        });
    }
}

function updateParticles() {
    for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx; p.y += p.vy;
        if (p.shape === 'debris') p.vy += 0.05; // gravity on debris
        p.life -= p.decay;
        if (p.life <= 0) particles.splice(i, 1);
    }
}
function drawParticles() {
    for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        ctx.globalAlpha = p.life;
        if (p.shape === 'spark') {
            ctx.strokeStyle = p.color;
            ctx.lineWidth = p.size * 0.6;
            ctx.beginPath();
            ctx.moveTo(p.x - p.vx * 0.5, p.y - p.vy * 0.5);
            ctx.lineTo(p.x, p.y);
            ctx.stroke();
        } else if (p.shape === 'debris') {
            ctx.fillStyle = p.color;
            ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size * 0.6);
        } else {
            // circle with glow
            ctx.fillStyle = p.color;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size * 0.4, 0, Math.PI * 2);
            ctx.fill();
        }
    }
    ctx.globalAlpha = 1.0;
}

// === Power-up system ===
const POWERUP_TYPES = {
    shield:       { color: '#4488ff', label: 'S', desc: 'Shield 3.75s' },
    rapidFire:    { color: '#ffcc00', label: 'R', desc: 'Rapid Fire 5s' },
    spread:       { color: '#44ff44', label: 'W', desc: 'Spread Shot 6.25s' },
    speedBoost:   { color: '#ff8800', label: '>>', desc: 'Speed Boost 5s' },
    doubleDamage: { color: '#ff4444', label: '2X', desc: 'Double Damage 10s' },
    iceFreeze:    { color: '#88ddff', label: 'Ice', desc: 'Ice Freeze 5s' },
    extraLife:    { color: '#ff66aa', label: '+', desc: 'Extra Life' }
};

function spawnPowerup(x, y) {
    // 40% chance to drop from destroyed enemy
    if (Math.random() > 0.40) return;
    const types = Object.keys(POWERUP_TYPES);
    const type = types[Math.floor(Math.random() * types.length)];
    powerups.push({ x, y, width: 18, height: 18, type: type, speed: 1.2, glow: 0 });
}

function collectPowerup(type) {
    playPowerUpSound();
    switch (type) {
        case 'shield':       shieldTimer = 3750; abilityShieldActive = false; break;
        case 'rapidFire':    rapidFireTimer = 5000; break;
        case 'spread':       spreadShotTimer = 6250; break;
        case 'speedBoost':   speedBoostTimer = 5000; player.speed = 10; break;
        case 'doubleDamage': doubleDamageTimer = 10000; break;
        case 'iceFreeze':    iceFreezeTimer = 5000; break;
        case 'extraLife':    extraLives++; break;
    }
}

// === Special Abilities ===
function activateProtectiveShield() {
    if (abilityShieldCooldown > 0 || !running || gameOver) return;
    shieldTimer = 5000;
    abilityShieldActive = true;
    abilityShieldCooldown = 30000;
    // Visual burst
    for (let i = 0; i < 12; i++) {
        const a = (Math.PI * 2 * i) / 12;
        particles.push({
            x: player.x + player.width / 2, y: player.y + player.height / 2,
            vx: Math.cos(a) * 4, vy: Math.sin(a) * 4,
            life: 1.0, decay: 0.025, size: 3, color: '#ffd700', shape: 'circle'
        });
    }
    playPowerUpSound();
}

function activateSmashEverything() {
    if (abilitySmashCooldown > 0 || !running || gameOver) return;
    abilitySmashCooldown = 30000;
    // Destroy all enemies on screen
    const count = enemies.length + (boss ? 1 : 0);
    if (count === 0) return; // nothing to smash — don't waste cooldown

    for (let i = enemies.length - 1; i >= 0; i--) {
        const ex = enemies[i].x + enemies[i].width / 2;
        const ey = enemies[i].y + enemies[i].height / 2;
        spawnExplosion(ex, ey, '#ffffff', 8, 5);
        spawnSparkBurst(ex, ey, '#ffd700');
        spawnPowerup(ex, ey);
        score += enemyPoints(enemies[i].type);
        enemies.splice(i, 1);
    }
    if (boss) {
        const bx = boss.x + boss.width / 2, by = boss.y + boss.height / 2;
        spawnExplosion(bx, by, '#ffffff', 20, 6);
        spawnExplosion(bx, by, '#ffd700', 15, 5);
        for (let d = 0; d < 3; d++) spawnDebris(bx, by);
        score += 500 * Math.floor(difficultyLevel / 3);
        boss = null; bossSpawnedThisLevel = true; bossBullets = [];
    }
    triggerShake(12, 400);
    playBossExplosionSound();
    scoreDisplay.textContent = 'Score: ' + score + ' | Lv ' + difficultyLevel + (extraLives > 0 ? ' | ' + extraLives + 'UP' : '');
    updateDifficulty();
}

// === Spawn enemy ===
function spawnEnemy() {
    const type = pickEnemyType(), size = enemySize(type);
    let x = Math.random() < 0.5 ? player.x + (Math.random() - 0.5) * 50 : Math.random() * (CANVAS_W - size.w);
    x = Math.max(0, Math.min(CANVAS_W - size.w, x));
    const bs = enemySpeed;
    let s = type === 0 ? bs * 1.1 : type === 1 ? bs * 0.9 : type === 2 ? bs * 0.6 : bs * 0.4;  // Elite slowest
    enemies.push({ x, y: -size.h, width: size.w, height: size.h, speed: s, type, hp: enemyHPMax(type), hpMax: enemyHPMax(type), spawnX: x, spawnTime: performance.now() });
}

// === Boss system ===
// Boss type 0: Gunship    — shoots aimed bullets at player
// Boss type 1: Destroyer  — shoots 3-way spread
// Boss type 2: Dreadnought— shoots 5-way fan + aimed
// Boss type 3: Mothership — summons enemies + shoots spreads
const BOSS_TYPES = [
    { name: 'GUNSHIP',     w: 72, h: 54, speed: 2.2, hpMul: 1.0, fireInterval: 1400, bodyColor: '#ff3333', accentColor: '#cc0000', cockpitColor: '#ff8888' },
    { name: 'DESTROYER',   w: 90, h: 66, speed: 1.6, hpMul: 1.6, fireInterval: 1800, bodyColor: '#ff6600', accentColor: '#cc4400', cockpitColor: '#ffaa44' },
    { name: 'DREADNOUGHT', w: 106, h: 78, speed: 1.2, hpMul: 2.4, fireInterval: 2200, bodyColor: '#cc22cc', accentColor: '#881188', cockpitColor: '#ee88ee' },
    { name: 'MOTHERSHIP',  w: 120, h: 88, speed: 1.0, hpMul: 3.5, fireInterval: 2800, bodyColor: '#ff2244', accentColor: '#990022', cockpitColor: '#ff6688' }
];

function bossTypeInfo() {
    const cycle = Math.floor(difficultyLevel / 3); // 1,2,3,4...
    return BOSS_TYPES[(cycle - 1) % BOSS_TYPES.length];
}

function spawnBoss() {
    const info = bossTypeInfo();
    const hpBase = 40 + Math.floor(difficultyLevel / 3) * 25;
    const hp = Math.floor(hpBase * info.hpMul);
    boss = {
        x: CANVAS_W / 2 - info.w / 2, y: -info.h,
        width: info.w, height: info.h,
        speed: info.speed,
        hp: hp, hpMax: hp,
        spawnTime: performance.now(), phase: 0,
        bossType: (Math.floor(difficultyLevel / 3) - 1) % BOSS_TYPES.length,
        lastFire: performance.now(),
        movePhaseX: Math.random() * Math.PI * 2,
        movePhaseY: Math.random() * Math.PI * 2,
        entryDone: false
    };
    bossSpawnedThisLevel = true; bossWarningTimer = 0; bossWarningText = '';
    // Thin out existing enemies for a cleaner boss fight — keep at most 2
    while (enemies.length > 2) enemies.splice(Math.floor(Math.random() * enemies.length), 1);
    playBossWarningSound();
}

function updateBoss(dt, timestamp) {
    if (!boss) return;
    const info = BOSS_TYPES[boss.bossType];

    // Smooth phase-based movement
    boss.movePhaseX += dt * 0.0008;
    boss.movePhaseY += dt * 0.0005;

    // Entry: glide down to patrol position
    if (!boss.entryDone) {
        const targetY = 140;
        if (boss.y < targetY) {
            boss.y += boss.speed * dt;
        }
        if (boss.y >= targetY) {
            boss.y = targetY;
            boss.entryDone = true;
        }
        // Gentle horizontal drift during entry
        boss.x += Math.sin(boss.movePhaseX * 2) * 0.8 * dt;
    } else {
        // Patrol: smooth sine-based cruising
        boss.x = CANVAS_W / 2 - boss.width / 2 + Math.sin(boss.movePhaseX) * (CANVAS_W * 0.38);
        boss.y = 140 + Math.sin(boss.movePhaseY) * 35;
    }
    boss.x = Math.max(5, Math.min(CANVAS_W - boss.width - 5, boss.x));

    // Fire boss bullets
    if (timestamp - boss.lastFire >= info.fireInterval) {
        boss.lastFire = timestamp;
        const bcx = boss.x + boss.width / 2;
        const bcy = boss.y + boss.height / 2;
        const aimX = player.x + player.width / 2;
        const aimY = player.y + player.height / 2;
        const angle = Math.atan2(aimY - bcy, aimX - bcx);
        const bspd = 3.0;

        switch (boss.bossType) {
            case 0: // Gunship: single aimed shot
                bossBullets.push({ x: bcx, y: bcy + 10, vx: Math.cos(angle) * bspd, vy: Math.sin(angle) * bspd, size: 10, color: '#ff4444' });
                break;
            case 1: // Destroyer: 3-way spread
                for (let a = -0.25; a <= 0.25; a += 0.25) {
                    const aa = angle + a;
                    bossBullets.push({ x: bcx, y: bcy + 10, vx: Math.cos(aa) * bspd, vy: Math.sin(aa) * bspd, size: 9, color: '#ff8800' });
                }
                break;
            case 2: // Dreadnought: 5-way fan
                for (let a = -0.4; a <= 0.4; a += 0.2) {
                    const aa = angle + a;
                    bossBullets.push({ x: bcx, y: bcy + 10, vx: Math.cos(aa) * bspd, vy: Math.sin(aa) * bspd, size: 10, color: '#dd44dd' });
                }
                break;
            case 3: // Mothership: 3-way spread + summon 1 enemy
                for (let a = -0.3; a <= 0.3; a += 0.3) {
                    const aa = angle + a;
                    bossBullets.push({ x: bcx, y: bcy + 10, vx: Math.cos(aa) * (bspd + 0.5), vy: Math.sin(aa) * (bspd + 0.5), size: 12, color: '#ff4466' });
                }
                // Summon a minion from the side
                if (enemies.length < 5) {
                    const type = Math.random() < 0.5 ? 0 : 1;
                    const size = enemySize(type);
                    const sx = Math.random() < 0.5 ? 0 : CANVAS_W - size.w;
                    enemies.push({ x: sx, y: boss.y + 30, width: size.w, height: size.h, speed: enemySpeed * 0.7, type, hp: enemyHPMax(type), hpMax: enemyHPMax(type), spawnX: sx, spawnTime: timestamp });
                }
                break;
        }
    }
}

function drawBoss() {
    if (!boss) return;
    const info = BOSS_TYPES[boss.bossType];
    const cx = boss.x + boss.width / 2;
    const cy = boss.y + boss.height / 2;
    const hw = boss.width / 2;
    const hh = boss.height / 2;

    ctx.save(); ctx.translate(cx, cy);

    // Main body
    ctx.fillStyle = info.bodyColor; ctx.beginPath();
    ctx.moveTo(0, hh); ctx.lineTo(-hw + 6, -hh + 6);
    ctx.lineTo(-8, -hh + 10); ctx.lineTo(8, -hh + 10);
    ctx.lineTo(hw - 6, -hh + 6); ctx.closePath(); ctx.fill();

    // Wing accents
    ctx.fillStyle = info.accentColor;
    ctx.beginPath();
    ctx.moveTo(-hw + 10, -4); ctx.lineTo(-hw - 4, hh - 6); ctx.lineTo(-hw / 2, 4); ctx.closePath(); ctx.fill();
    ctx.beginPath();
    ctx.moveTo(hw - 10, -4); ctx.lineTo(hw + 4, hh - 6); ctx.lineTo(hw / 2, 4); ctx.closePath(); ctx.fill();

    // Cockpit
    ctx.fillStyle = info.cockpitColor; ctx.beginPath();
    ctx.arc(0, 4 + boss.height * 0.04, boss.width * 0.11, 0, Math.PI * 2); ctx.fill();

    // Eyes / gun ports
    ctx.fillStyle = '#ffffff';
    ctx.beginPath(); ctx.arc(-hw * 0.28, -hh * 0.1, 4, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(hw * 0.28, -hh * 0.1, 4, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#000000';
    ctx.beginPath(); ctx.arc(-hw * 0.28, -hh * 0.1, 2, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(hw * 0.28, -hh * 0.1, 2, 0, Math.PI * 2); ctx.fill();

    // Engine glow
    ctx.fillStyle = '#ffaa00';
    ctx.beginPath(); ctx.moveTo(-6, hh); ctx.lineTo(0, hh + 8 + Math.sin(performance.now() * 0.01) * 3); ctx.lineTo(6, hh); ctx.closePath(); ctx.fill();

    ctx.restore();

    // HP bar
    const barW = boss.width + 10, barH = 7, barX = boss.x - 5, barY = boss.y - 18, hpPct = boss.hp / boss.hpMax;
    ctx.fillStyle = '#333333'; ctx.fillRect(barX, barY, barW, barH);
    ctx.fillStyle = hpPct > 0.3 ? '#00ff00' : '#ff0000'; ctx.fillRect(barX, barY, barW * hpPct, barH);
    ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 1.5; ctx.strokeRect(barX, barY, barW, barH);
    ctx.fillStyle = '#ffffff'; ctx.font = 'bold 11px Arial'; ctx.textAlign = 'center';
    ctx.fillText(info.name, cx, barY - 5);
}

// === Difficulty scaling ===
function updateDifficulty() {
    const prev = difficultyLevel;
    difficultyLevel = Math.floor(score / 500) + 1;
    spawnInterval = Math.max(MIN_SPAWN_INTERVAL, BASE_SPAWN_INTERVAL - (difficultyLevel - 1) * 200);
    enemySpeed = Math.min(MAX_ENEMY_SPEED, BASE_ENEMY_SPEED + (difficultyLevel - 1) * 0.85);
    if (difficultyLevel !== prev) {
        scoreDisplay.style.color = '#ff6b35';
        scoreDisplay.style.textShadow = '0 0 12px rgba(255, 107, 53, 0.8)';
        if (difficultyLevel % 3 === 0 && !bossSpawnedThisLevel) {
            bossWarningTimer = performance.now(); bossWarningText = 'WARNING: BOSS INCOMING!';
            setTimeout(function() { if (running) spawnBoss(); }, 2000);
        }
        setTimeout(function() {
            scoreDisplay.style.color = '#ffffff';
            scoreDisplay.style.textShadow = '0 0 8px rgba(0, 212, 255, 0.6)';
        }, 300);
    }
}

// === Fire bullet ===
function fireBullet() {
    const bw = 4;
    const bx = player.x + player.width / 2 - bw / 2;
    const dmg = doubleDamageTimer > 0 ? 2 : 1;
    bullets.push({ x: bx, y: player.y, width: bw, height: 12, speed: 7, damage: dmg });
    // Spread shot: fire 2 extra bullets at angles
    if (spreadShotTimer > 0) {
        bullets.push({ x: bx - 8 + bw / 2, y: player.y + 4, width: bw, height: 12, speed: 7, vx: -1.2, damage: dmg });
        bullets.push({ x: bx + 8 + bw / 2, y: player.y + 4, width: bw, height: 12, speed: 7, vx: 1.2, damage: dmg });
    }
    playShootSound();
}

// === Update ===
function update(timestamp) {
    if (!running) return;
    const prevTimestamp = lastTimestamp;
    lastTimestamp = timestamp;
    const elapsed = prevTimestamp ? timestamp - prevTimestamp : 0;
    const dt = prevTimestamp ? Math.min(elapsed / 16.667, 3) : 1;

    // Background scroll and screen shake
    updateBackground(dt);
    if (shakeDuration > 0) {
        shakeDuration = Math.max(0, shakeDuration - elapsed);
        if (shakeDuration <= 0) shakeAmount = 0;
    }

    // Weather and random events
    updateWeather(dt, elapsed);
    updateEvents(dt, elapsed);

    // Power-up timers (count down in ms based on real elapsed time)
    const shieldWasActive = shieldTimer > 0;
    shieldTimer = Math.max(0, shieldTimer - elapsed);
    if (shieldWasActive && shieldTimer <= 0) abilityShieldActive = false;
    rapidFireTimer = Math.max(0, rapidFireTimer - elapsed);
    spreadShotTimer = Math.max(0, spreadShotTimer - elapsed);
    const prevSpeed = speedBoostTimer > 0;
    speedBoostTimer = Math.max(0, speedBoostTimer - elapsed);
    if (prevSpeed && speedBoostTimer <= 0) player.speed = 6;
    doubleDamageTimer = Math.max(0, doubleDamageTimer - elapsed);
    iceFreezeTimer = Math.max(0, iceFreezeTimer - elapsed);
    bossDefeatCooldown = Math.max(0, bossDefeatCooldown - elapsed);
    abilityShieldCooldown = Math.max(0, abilityShieldCooldown - elapsed);
    abilitySmashCooldown = Math.max(0, abilitySmashCooldown - elapsed);

    // Player movement (rain slows by 1)
    const weatherSpeedMod = weather === 'rain' ? 0.7 : 1.0;
    const effectiveSpeed = player.speed * weatherSpeedMod;
    if (keys['ArrowLeft'] || keys['KeyA']) player.x -= effectiveSpeed * dt;
    if (keys['ArrowRight'] || keys['KeyD']) player.x += effectiveSpeed * dt;
    if (player.x < 0) player.x = 0;
    if (player.x > CANVAS_W - player.width) player.x = CANVAS_W - player.width;

    // Fire bullet (faster with rapid fire power-up)
    const effectiveCooldown = rapidFireTimer > 0 ? FIRE_COOLDOWN / 2 : FIRE_COOLDOWN;
    if (keys['Space'] && timestamp - lastFireTime >= effectiveCooldown) {
        fireBullet(); lastFireTime = timestamp;
    }

    // Move bullets (with spread vx)
    for (let i = bullets.length - 1; i >= 0; i--) {
        bullets[i].y -= bullets[i].speed * dt;
        if (bullets[i].vx) bullets[i].x += bullets[i].vx * dt;
        if (bullets[i].y + bullets[i].height < 0 || bullets[i].x < -20 || bullets[i].x > CANVAS_W + 20)
            bullets.splice(i, 1);
    }

    // Move boss bullets
    for (let i = bossBullets.length - 1; i >= 0; i--) {
        const bb = bossBullets[i];
        bb.x += bb.vx * dt;
        bb.y += bb.vy * dt;
        if (bb.y > CANVAS_H + 10 || bb.y < -10 || bb.x < -10 || bb.x > CANVAS_W + 10)
            bossBullets.splice(i, 1);
    }

    // Spawn enemies (suppressed during boss warning, slowed during boss fight and post-boss grace period)
    const spawnThrottle = (boss || bossDefeatCooldown > 0) ? 3 : 1;
    if (!bossWarningText && timestamp - lastSpawnTime >= spawnInterval * spawnThrottle) {
        spawnEnemy(); lastSpawnTime = timestamp;
    }

    // Move enemies (snow slows by 30%, ice freeze slows by 50%)
    const weatherEnemyMod = weather === 'snow' ? 0.7 : 1.0;
    const iceFreezeMod = iceFreezeTimer > 0 ? 0.5 : 1.0;
    for (let i = enemies.length - 1; i >= 0; i--) {
        const e = enemies[i];
        if (e.type === 1) {
            e.y += e.speed * weatherEnemyMod * iceFreezeMod * dt;
            e.x = e.spawnX + Math.sin((timestamp - e.spawnTime) * 0.003) * 60;
            e.x = Math.max(0, Math.min(CANVAS_W - e.width, e.x));
        } else { e.y += e.speed * weatherEnemyMod * iceFreezeMod * dt; }
        if (e.y > CANVAS_H) enemies.splice(i, 1);
    }

    // Move power-ups
    for (let i = powerups.length - 1; i >= 0; i--) {
        powerups[i].y += powerups[i].speed * dt;
        if (powerups[i].y > CANVAS_H) powerups.splice(i, 1);
    }

    updateBoss(dt, timestamp);

    // Bullet collisions
    for (let b = bullets.length - 1; b >= 0; b--) {
        let hit = false;
        if (boss && checkCollision(bullets[b], boss)) {
            boss.hp--;
            spawnSparkBurst(bullets[b].x + 2, bullets[b].y + 6, '#ffff00');
            if (boss.hp <= 0) {
                const bx = boss.x + boss.width / 2, by = boss.y + boss.height / 2;
                spawnExplosion(bx, by, '#ff4400', 25, 6);
                spawnExplosion(bx, by, '#ffaa00', 20, 5);
                spawnExplosion(bx, by, '#ffffff', 12, 3);
                for (let d = 0; d < 4; d++) spawnDebris(bx, by);
                triggerShake(8, 450);
                playBossExplosionSound();
                score += 500 * Math.floor(difficultyLevel / 3);
                bossDefeatCooldown = 5000;
                boss = null; bossSpawnedThisLevel = true; bossBullets = [];
                updateDifficulty();
            }
            scoreDisplay.textContent = 'Score: ' + score + ' | Lv ' + difficultyLevel + (extraLives > 0 ? ' | ' + extraLives + 'UP' : '');
            hit = true;
        }
        if (!hit) {
            for (let e = enemies.length - 1; e >= 0; e--) {
                if (checkCollision(bullets[b], enemies[e])) {
                    enemies[e].hp -= (bullets[b].damage || 1);
                    if (enemies[e].hp <= 0) {
                        const ex = enemies[e].x + enemies[e].width / 2, ey = enemies[e].y + enemies[e].height / 2;
                        spawnExplosion(ex, ey, '#ff6b35', 10, 4);
                        spawnSparkBurst(ex, ey, '#ffcc44');
                        if (enemies[e].type === 2 || enemies[e].type === 3) spawnDebris(ex, ey);
                        playExplosionSound();
                        spawnPowerup(ex, ey);
                        score += enemyPoints(enemies[e].type);
                        enemies.splice(e, 1);
                        updateDifficulty();
                    } else {
                        spawnSparkBurst(bullets[b].x + 2, bullets[b].y + 6, '#ffff00');
                    }
                    scoreDisplay.textContent = 'Score: ' + score + ' | Lv ' + difficultyLevel + (extraLives > 0 ? ' | ' + extraLives + 'UP' : '');
                    hit = true; break;
                }
            }
        }
        if (hit) bullets.splice(b, 1);
    }

    // Player vs Enemy collision
    if (shieldTimer <= 0) {
        for (let e = 0; e < enemies.length; e++) {
            if (checkCollision(player, enemies[e])) {
                if (extraLives > 0) {
                    extraLives--;
                    spawnExplosion(enemies[e].x + enemies[e].width / 2, enemies[e].y + enemies[e].height / 2, '#ff44aa', 12, 4);
                    spawnSparkBurst(enemies[e].x + enemies[e].width / 2, enemies[e].y + enemies[e].height / 2, '#ffffff');
                    enemies.splice(e, 1);
                    scoreDisplay.textContent = 'Score: ' + score + ' | Lv ' + difficultyLevel + (extraLives > 0 ? ' | ' + extraLives + 'UP' : '');
                    playPowerUpSound();
                    return;
                }
                spawnExplosion(player.x + player.width / 2, player.y + player.height / 2, '#00d4ff', 15, 5);
                spawnSparkBurst(player.x + player.width / 2, player.y + player.height / 2, '#ffffff');
                triggerShake(10, 500);
                playGameOverSound(); endGame(); return;
            }
        }
        if (boss && checkCollision(player, boss)) {
            if (extraLives > 0) {
                extraLives--;
                scoreDisplay.textContent = 'Score: ' + score + ' | Lv ' + difficultyLevel + (extraLives > 0 ? ' | ' + extraLives + 'UP' : '');
                playPowerUpSound();
            } else {
                spawnExplosion(player.x + player.width / 2, player.y + player.height / 2, '#00d4ff', 15, 5);
                spawnSparkBurst(player.x + player.width / 2, player.y + player.height / 2, '#ffffff');
                triggerShake(10, 500);
                playGameOverSound(); endGame(); return;
            }
        }
        // Boss bullets vs player
        for (let i = bossBullets.length - 1; i >= 0; i--) {
            const bb = bossBullets[i];
            if (checkCollision(player, { x: bb.x - bb.size, y: bb.y - bb.size, width: bb.size * 2, height: bb.size * 2 })) {
                bossBullets.splice(i, 1);
                if (extraLives > 0) {
                    extraLives--;
                    spawnSparkBurst(bb.x, bb.y, '#ff4444');
                    scoreDisplay.textContent = 'Score: ' + score + ' | Lv ' + difficultyLevel + (extraLives > 0 ? ' | ' + extraLives + 'UP' : '');
                    playPowerUpSound();
                    return;
                }
                spawnExplosion(player.x + player.width / 2, player.y + player.height / 2, '#ff4444', 10, 4);
                triggerShake(6, 300);
                playGameOverSound(); endGame(); return;
            }
        }
    }

    // Player vs Power-up collection
    for (let i = powerups.length - 1; i >= 0; i--) {
        if (checkCollision(player, powerups[i])) {
            collectPowerup(powerups[i].type);
            powerups.splice(i, 1);
			scoreDisplay.textContent = 'Score: ' + score + ' | Lv ' + difficultyLevel + (extraLives > 0 ? ' | ' + extraLives + 'UP' : '');
        }
    }

    updateParticles();
}

// === Draw ===
function draw() {
    ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);

    // Apply screen shake
    let sx = 0, sy = 0;
    if (shakeDuration > 0) {
        const intensity = shakeAmount * (shakeDuration / 500);
        sx = (Math.random() - 0.5) * intensity * 2;
        sy = (Math.random() - 0.5) * intensity * 2;
    }
    ctx.save();
    ctx.translate(sx, sy);

    drawBackground();
    drawWeather();

    // Player
    ctx.save(); ctx.translate(player.x + player.width / 2, player.y + player.height / 2);
    // Shield glow (golden aura for ability shield, blue for pickup shield)
    if (shieldTimer > 0) {
        if (abilityShieldActive) {
            // Outer golden pulse
            ctx.strokeStyle = 'rgba(255, 215, 0, ' + (0.5 + Math.sin(performance.now() * 0.012) * 0.35) + ')';
            ctx.lineWidth = 5; ctx.beginPath(); ctx.arc(0, 0, 28, 0, Math.PI * 2); ctx.stroke();
            // Inner white ring
            ctx.strokeStyle = 'rgba(255, 255, 255, ' + (0.3 + Math.sin(performance.now() * 0.015 + 1) * 0.2) + ')';
            ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(0, 0, 22, 0, Math.PI * 2); ctx.stroke();
        } else {
            ctx.strokeStyle = 'rgba(68, 136, 255, ' + (0.5 + Math.sin(performance.now() * 0.01) * 0.3) + ')';
            ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(0, 0, 26, 0, Math.PI * 2); ctx.stroke();
        }
    }
    ctx.fillStyle = abilityShieldActive ? '#ffd700' : shieldTimer > 0 ? '#66bbff' : '#00d4ff';
    ctx.beginPath(); ctx.moveTo(0, -24); ctx.lineTo(-16, 18); ctx.lineTo(-6, 12); ctx.lineTo(6, 12); ctx.lineTo(16, 18); ctx.closePath(); ctx.fill();
    ctx.fillStyle = abilityShieldActive ? '#fff8cc' : shieldTimer > 0 ? '#cceeff' : '#e0f7ff';
    ctx.beginPath(); ctx.arc(0, -4, 5, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#ff6b35';
    ctx.beginPath(); ctx.moveTo(-4, 18); ctx.lineTo(0, 24); ctx.lineTo(4, 18); ctx.closePath(); ctx.fill();
    ctx.restore();

    // Bullets
    ctx.fillStyle = spreadShotTimer > 0 ? '#44ff44' : rapidFireTimer > 0 ? '#ffcc00' : '#ffff00';
    for (let i = 0; i < bullets.length; i++) {
        ctx.fillRect(bullets[i].x, bullets[i].y, bullets[i].width, bullets[i].height);
    }

    // Boss bullets
    for (let i = 0; i < bossBullets.length; i++) {
        const bb = bossBullets[i];
        // Outer glow
        ctx.globalAlpha = 0.3;
        ctx.fillStyle = bb.color;
        ctx.beginPath(); ctx.arc(bb.x, bb.y, bb.size * 1.6, 0, Math.PI * 2); ctx.fill();
        ctx.globalAlpha = 1.0;
        // Core with radial gradient
        const grad = ctx.createRadialGradient(bb.x, bb.y, 0, bb.x, bb.y, bb.size);
        grad.addColorStop(0, '#ffffff'); grad.addColorStop(0.35, bb.color); grad.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = grad;
        ctx.beginPath(); ctx.arc(bb.x, bb.y, bb.size, 0, Math.PI * 2); ctx.fill();
    }

    // Enemies
    for (let i = 0; i < enemies.length; i++) {
        const e = enemies[i];
        ctx.save(); ctx.translate(e.x + e.width / 2, e.y + e.height / 2);
        ctx.fillStyle = enemyColor(e.type);
        ctx.beginPath(); ctx.moveTo(0, e.height / 2); ctx.lineTo(-e.width / 2 + 4, -e.height / 2 + 4);
        ctx.lineTo(-4, -e.height / 2 + 8); ctx.lineTo(4, -e.height / 2 + 8); ctx.lineTo(e.width / 2 - 4, -e.height / 2 + 4);
        ctx.closePath(); ctx.fill();
        ctx.fillStyle = enemyCockpitColor(e.type);
        ctx.beginPath(); ctx.arc(0, 4, 4, 0, Math.PI * 2); ctx.fill();
        if ((e.type === 2 || e.type === 3) && e.hpMax > 1) {
            const bw = e.width - 4, bh = e.type === 3 ? 4 : 3, bx = -bw / 2, by = -e.height / 2 - 10;
            ctx.fillStyle = '#333333'; ctx.fillRect(bx, by, bw, bh);
            const hpPct = e.hp / e.hpMax;
            ctx.fillStyle = hpPct > 0.3 ? '#00ff00' : '#ff0000';
            ctx.fillRect(bx, by, bw * hpPct, bh);
            if (e.type === 3) {
                // Elite label
                ctx.fillStyle = '#ffd700'; ctx.font = 'bold 8px Arial'; ctx.textAlign = 'center';
                ctx.fillText('ELITE', 0, by - 2);
            }
        }
        // Ice freeze visual overlay
        if (iceFreezeTimer > 0) {
            ctx.globalAlpha = 0.25;
            ctx.fillStyle = '#88ddff';
            ctx.beginPath(); ctx.arc(0, 0, Math.max(e.width, e.height) / 2 + 2, 0, Math.PI * 2); ctx.fill();
            ctx.globalAlpha = 1.0;
        }
        ctx.restore();
    }

    // Power-ups (floating orbs)
    for (let i = 0; i < powerups.length; i++) {
        const p = powerups[i];
        const pulse = Math.sin(performance.now() * 0.005 + i) * 0.15;
        ctx.globalAlpha = 0.8 + pulse;
        ctx.fillStyle = POWERUP_TYPES[p.type].color;
        ctx.beginPath(); ctx.arc(p.x + p.width / 2, p.y + p.height / 2, 9, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.arc(p.x + p.width / 2, p.y + p.height / 2, 9, 0, Math.PI * 2); ctx.stroke();
        ctx.fillStyle = '#ffffff'; ctx.font = 'bold 10px Arial'; ctx.textAlign = 'center';
        ctx.fillText(POWERUP_TYPES[p.type].label, p.x + p.width / 2, p.y + p.height / 2 + 3);
    }
    ctx.globalAlpha = 1.0;

    drawBoss();
    drawEvents();
    drawParticles();

    // Active power-up indicators
    let indicatorY = 36;
    ctx.font = 'bold 12px Arial'; ctx.textAlign = 'right';
    if (shieldTimer > 0) {
        ctx.fillStyle = '#4488ff'; ctx.fillText('SHIELD ' + (shieldTimer / 1000).toFixed(1) + 's', CANVAS_W - 12, indicatorY); indicatorY += 16;
    }
    if (rapidFireTimer > 0) {
        ctx.fillStyle = '#ffcc00'; ctx.fillText('RAPID ' + (rapidFireTimer / 1000).toFixed(1) + 's', CANVAS_W - 12, indicatorY); indicatorY += 16;
    }
    if (spreadShotTimer > 0) {
        ctx.fillStyle = '#44ff44'; ctx.fillText('SPREAD ' + (spreadShotTimer / 1000).toFixed(1) + 's', CANVAS_W - 12, indicatorY); indicatorY += 16;
    }
    if (speedBoostTimer > 0) {
        ctx.fillStyle = '#ff8800'; ctx.fillText('SPEED ' + (speedBoostTimer / 1000).toFixed(1) + 's', CANVAS_W - 12, indicatorY); indicatorY += 16;
    }
    if (doubleDamageTimer > 0) {
        ctx.fillStyle = '#ff4444'; ctx.fillText('2X DMG ' + (doubleDamageTimer / 1000).toFixed(1) + 's', CANVAS_W - 12, indicatorY); indicatorY += 16;
    }
    if (iceFreezeTimer > 0) {
        ctx.fillStyle = '#88ddff'; ctx.fillText('ICE FREEZE ' + (iceFreezeTimer / 1000).toFixed(1) + 's', CANVAS_W - 12, indicatorY); indicatorY += 16;
    }

    // Ability cooldowns (left side)
    ctx.textAlign = 'left';
    let abilityY = 36;
    ctx.font = 'bold 11px Arial';
    // Protective Shield [1]
    if (abilityShieldCooldown > 0) {
        ctx.fillStyle = '#888888';
        ctx.fillText('[1] SHIELD ' + (abilityShieldCooldown / 1000).toFixed(0) + 's', 12, abilityY);
    } else {
        ctx.fillStyle = '#ffd700';
        ctx.fillText('[1] SHIELD READY', 12, abilityY);
    }
    abilityY += 15;
    // Smash Everything [2]
    if (abilitySmashCooldown > 0) {
        ctx.fillStyle = '#888888';
        ctx.fillText('[2] SMASH ' + (abilitySmashCooldown / 1000).toFixed(0) + 's', 12, abilityY);
    } else {
        ctx.fillStyle = '#ff6644';
        ctx.fillText('[2] SMASH READY', 12, abilityY);
    }

    // Boss warning overlay
    if (bossWarningText) {
        const elapsed = (performance.now() - bossWarningTimer) / 1000;
        if (elapsed < 2.0) {
            ctx.fillStyle = 'rgba(255, 0, 0, ' + (0.3 + Math.sin(elapsed * 10) * 0.2) + ')';
            ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
            ctx.fillStyle = '#ffffff'; ctx.font = 'bold 28px Arial'; ctx.textAlign = 'center';
            ctx.fillText(bossWarningText, CANVAS_W / 2, CANVAS_H / 2);
            ctx.font = '18px Arial'; ctx.fillText('BOSS INCOMING!', CANVAS_W / 2, CANVAS_H / 2 + 40);
        } else { bossWarningText = ''; }
    }

    ctx.restore(); // end screen shake
}

// === Game loop ===
function gameLoop(timestamp) { update(timestamp); draw(); requestAnimationFrame(gameLoop); }

// === Game flow ===
function startGame() {
    initAudio();
    initBackground();
    initWeather();
    initEvents();
    shakeAmount = 0; shakeDuration = 0;
    running = true; gameOver = false; score = 0;
    bullets = []; bossBullets = []; enemies = []; particles = []; powerups = [];
    boss = null; bossSpawnedThisLevel = false; bossWarningTimer = 0; bossWarningText = ''; bossDefeatCooldown = 0;
    shieldTimer = 0; rapidFireTimer = 0; spreadShotTimer = 0;
    speedBoostTimer = 0; doubleDamageTimer = 0; iceFreezeTimer = 0; extraLives = 0;
    abilityShieldCooldown = 0; abilitySmashCooldown = 0; abilityShieldActive = false;
    player.speed = 6;
    player.x = CANVAS_W / 2 - 20;
    lastFireTime = 0; lastSpawnTime = performance.now(); lastTimestamp = 0;
    difficultyLevel = 1; spawnInterval = BASE_SPAWN_INTERVAL; enemySpeed = BASE_ENEMY_SPEED;
    scoreDisplay.textContent = 'Score: 0 | Lv 1';
    scoreDisplay.style.color = '#ffffff';
    scoreDisplay.style.textShadow = '0 0 8px rgba(0, 212, 255, 0.6)';
    startScreen.style.display = 'none'; gameOverScreen.style.display = 'none';
}
function endGame() { running = false; gameOver = true; finalScoreSpan.textContent = score; gameOverScreen.style.display = 'flex'; }
function restartGame() { startGame(); }

startBtn.addEventListener('click', startGame);
restartBtn.addEventListener('click', restartGame);

startScreen.style.display = 'flex';
gameOverScreen.style.display = 'none';
requestAnimationFrame(gameLoop);
