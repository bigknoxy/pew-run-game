const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreEl = document.getElementById('scoreValue');
const healthEl = document.getElementById('healthValue');
const ammoEl = document.getElementById('ammoValue');
const startScreen = document.getElementById('startScreen');
const gameOverScreen = document.getElementById('gameOverScreen');
const finalScoreEl = document.getElementById('finalScore');
const startBtn = document.getElementById('startBtn');
const restartBtn = document.getElementById('restartBtn');
const startHighScoreEl = document.getElementById('startHighScore');
const highScoreDisplayEl = document.getElementById('highScoreDisplay');
const enemiesKilledDisplayEl = document.getElementById('enemiesKilledDisplay');
const totalGamesDisplayEl = document.getElementById('totalGamesDisplay');
const totalEnemiesDisplayEl = document.getElementById('totalEnemiesDisplay');
const pauseBtn = document.getElementById('pauseBtn');
const pauseMenu = document.getElementById('pauseMenu');
const resumeBtn = document.getElementById('resumeBtn');
const waveAnnouncement = document.getElementById('waveAnnouncement');
const waveAnnouncementNumber = document.getElementById('waveAnnouncementNumber');
const playerHighlight = document.getElementById('playerHighlight');
const playerHighlightBox = document.getElementById('playerHighlightBox');

function safeSetItem(key, value) {
    try { safeSetItem(key, value); } catch (e) { /* storage full */ }
}

// Shop system
const SKIN_COLORS = { default: '#4ecdc4', red: '#ff6b6b', gold: '#f39c12', purple: '#9b59b6' };
let shopData = { revives: 0, ammoBoost: false, skins: { red: false, gold: false, purple: false }, activeSkin: 'default' };
let usedReviveThisGame = false;
let reviveTimerInterval = null;

function loadShopData() {
    const saved = localStorage.getItem('shopData');
    if (saved) {
        try { shopData = JSON.parse(saved); } catch(e) {}
    }
}

function saveShopData() {
    safeSetItem('shopData', JSON.stringify(shopData));
}

function buyShopItem(item, cost) {
    if ((player.gems || 0) < cost) return false;
    player.gems -= cost;
    if (item === 'revive') {
        shopData.revives = (shopData.revives || 0) + 1;
    } else if (item === 'ammoBoost') {
        shopData.ammoBoost = true;
    } else if (item.startsWith('skin_')) {
        const skinName = item.replace('skin_', '');
        shopData.skins[skinName] = true;
        shopData.activeSkin = skinName;
    }
    saveShopData();
    safeSetItem('playerGems', player.gems.toString());
    updateShopUI();
    return true;
}

function equipSkin(skinName) {
    if (shopData.skins[skinName] || skinName === 'default') {
        shopData.activeSkin = skinName;
        player.color = SKIN_COLORS[skinName] || SKIN_COLORS.default;
        saveShopData();
        updateShopUI();
    }
}

function updateShopUI() {
    const gemsEl = document.getElementById('shopGemsDisplay');
    if (gemsEl) gemsEl.textContent = player.gems || 0;

    const reviveCountEl = document.getElementById('reviveCount');
    if (reviveCountEl) reviveCountEl.textContent = (shopData.revives || 0) + ' owned';

    const ammoEl = document.getElementById('ammoBoostStatus');
    if (ammoEl) ammoEl.textContent = shopData.ammoBoost ? 'Owned' : 'Not owned';

    const skinMap = { red: 'skinRedStatus', gold: 'skinGoldStatus', purple: 'skinPurpleStatus' };
    for (const [skin, elId] of Object.entries(skinMap)) {
        const el = document.getElementById(elId);
        if (el) {
            if (shopData.skins[skin] && shopData.activeSkin === skin) el.textContent = 'Equipped';
            else if (shopData.skins[skin]) el.textContent = 'Owned';
            else el.textContent = 'Not owned';
        }
    }

    // Update buy buttons
    document.querySelectorAll('.shop-buy-btn').forEach(btn => {
        const item = btn.dataset.item;
        const cost = parseInt(btn.dataset.cost);
        if (item === 'ammoBoost' && shopData.ammoBoost) {
            btn.textContent = 'OWNED';
            btn.disabled = true;
            btn.classList.add('owned');
        } else if (item.startsWith('skin_')) {
            const skinName = item.replace('skin_', '');
            if (shopData.skins[skinName] && shopData.activeSkin === skinName) {
                btn.textContent = 'EQUIPPED';
                btn.disabled = true;
                btn.classList.add('equipped');
                btn.classList.remove('owned');
            } else if (shopData.skins[skinName]) {
                btn.textContent = 'EQUIP';
                btn.disabled = false;
                btn.classList.add('owned');
                btn.classList.remove('equipped');
            } else {
                btn.textContent = cost + ' gems';
                btn.disabled = (player.gems || 0) < cost;
                btn.classList.remove('owned', 'equipped');
            }
        } else {
            btn.disabled = (player.gems || 0) < cost;
        }
    });
}

function showRevivePrompt() {
    const prompt = document.getElementById('revivePrompt');
    const timerEl = document.getElementById('reviveTimer');
    if (!prompt || !timerEl) { showGameOverScreen(); return; }

    prompt.classList.remove('hidden');
    let countdown = 5;
    timerEl.textContent = countdown;

    reviveTimerInterval = setInterval(() => {
        countdown--;
        timerEl.textContent = countdown;
        if (countdown <= 0) {
            clearInterval(reviveTimerInterval);
            prompt.classList.add('hidden');
            showGameOverScreen();
        }
    }, 1000);
}

function doRevive() {
    clearInterval(reviveTimerInterval);
    const prompt = document.getElementById('revivePrompt');
    if (prompt) prompt.classList.add('hidden');

    shopData.revives--;
    usedReviveThisGame = true;
    saveShopData();

    player.health = Math.floor(player.maxHealth * 0.5);
    gameRunning = true;
    updateUI();
    lastTime = performance.now();
    requestAnimationFrame(gameLoop);
}

function showGameOverScreen() {
    const gameOverScreen = document.getElementById('gameOverScreen');
    if (gameOverScreen) gameOverScreen.classList.remove('hidden');
    if (pauseBtn) pauseBtn.classList.add('hidden');
    const settingsBtn = document.getElementById('settingsBtn');
    if (settingsBtn) settingsBtn.classList.add('hidden');
    const settingsPanel = document.getElementById('settingsPanel');
    if (settingsPanel) settingsPanel.classList.add('hidden');
    const dailyRewardsBtn = document.getElementById('dailyRewardsBtn');
    if (dailyRewardsBtn) dailyRewardsBtn.classList.add('hidden');
}

let gameRunning = false;
let score = 0;
let lastTime = 0;
let lastShotTime = 0;
let enemiesKilledInGame = 0;
let isPaused = false;
const baseFireRate = 500;
const minFireRate = 100;

// Splash screen
let splashShown = false;

// Daily Rewards System
let dailyRewards = {
    streak: 0,
    lastClaimDate: null,
    consecutiveDays: 0
};

// Daily rewards configuration
const DAILY_REWARD_AMOUNTS = [50, 100, 150, 200, 300, 400, 1000];
const REWARD_INTERVAL = 24 * 60 * 60 * 1000; // 24 hours

// Tutorial System
const TUTORIAL_STEPS = [
    {
        id: 'welcome',
        title: 'Welcome to Pew Run!',
        text: 'Ready to blast your way through waves of enemies? Let\'s get started!',
        highlight: null,
        action: null,
        duration: 3000
    },
    {
        id: 'movement',
        title: 'Movement',
        text: 'Drag anywhere on the screen to move left and right. Easy!',
        highlight: { width: 200, height: 80, offsetY: -120 },
        action: 'move',
        duration: 4000
    },
    {
        id: 'shooting',
        title: 'Auto-Fire',
        text: 'Your ship auto-fires! Just focus on dodging and surviving.',
        highlight: { width: 60, height: 80, offsetY: -120 },
        action: 'shoot',
        duration: 4000
    },
    {
        id: 'enemies',
        title: 'Enemies',
        text: 'Red enemies are basic. Orange ones are fast!',
        highlight: null,
        action: 'kill_enemy',
        duration: 3000
    },
    {
        id: 'powerups',
        title: 'Powerups',
        text: 'Collect green orbs for health and blue for ammo!',
        highlight: null,
        action: 'collect_powerup',
        duration: 3000
    },
    {
        id: 'boss',
        title: 'Boss Battles',
        text: 'Every 5 waves, a Boss appears! Keep shooting!',
        highlight: null,
        action: 'boss_wave',
        duration: 3000
    },
    {
        id: 'complete',
        title: 'You\'re Ready!',
        text: 'You\'re all set! Good luck, Pilot!',
        highlight: null,
        action: null,
        duration: 2000
    }
];

let tutorialState = {
    currentStep: 0,
    completed: false,
    skipped: false
};

let tutorialTimeout = null;

function showSplashScreen() {
    const splash = document.getElementById('splashScreen');
    if (splash) {
        splash.classList.remove('hidden');
    }
}

function hideSplashScreen() {
    const splash = document.getElementById('splashScreen');
    if (splash) {
        splash.classList.add('hidden');
        // Remove from DOM after transition
        setTimeout(() => {
            splash.style.display = 'none';
        }, 500);
    }
    // Allow scroll again
    document.body.classList.remove('splash-active');
}

// Initialize splash screen on page load - always show for testing
function initSplashScreen() {
    // Prevent scroll during splash
    document.body.classList.add('splash-active');
    
    // Force show splash
    const splash = document.getElementById('splashScreen');
    if (splash) {
        splash.classList.remove('hidden');
        splash.style.display = 'flex';
        splash.style.opacity = '1';
    }
    
    // Attach dismiss handlers immediately
    setupSplashDismiss();
}

// Dismiss splash screen directly (called from onclick)
function dismissSplashDirect() {
    safeSetItem('splashShown', 'true');
    hideSplashScreen();
    
    // Initialize audio on first interaction
    initAudio();
    
    // Check for daily reward after splash
    if (canClaimReward()) {
        setTimeout(() => {
            showRewardClaimAnimation(0);
            const dailyRewardsPanel = document.getElementById('dailyRewardsPanel');
            if (dailyRewardsPanel) {
                dailyRewardsPanel.classList.remove('hidden');
            }
        }, 500);
    }
}

// Dismiss splash screen on tap/click
function setupSplashDismiss() {
    const splash = document.getElementById('splashScreen');
    if (!splash) return;
    
    // Simple dismiss function
    const doDismiss = (e) => {
        if (e) {
            e.preventDefault();
            e.stopPropagation();
        }
        
        // Hide splash
        splash.classList.add('hidden');
        splash.style.display = 'none';
        
        // Save state
        safeSetItem('splashShown', 'true');
        
        // Initialize audio
        initAudio();
        
        // Check for daily reward
        if (typeof canClaimReward !== 'undefined' && canClaimReward()) {
            setTimeout(() => {
                const panel = document.getElementById('dailyRewardsPanel');
                if (panel) {
                    panel.classList.remove('hidden');
                }
            }, 500);
        }
    };
    
    // Attach click handler to splash
    splash.onclick = doDismiss;
    splash.ontouchstart = doDismiss;
    
    // Also attach to body for coverage
    document.body.onclick = doDismiss;
    
}

// Audio system
let audioCtx = null;
let musicOscillator = null;
let musicGain = null;
let isBossMusic = false;
let soundEnabled = true;
let musicEnabled = true;
let graphicsQuality = 'high';
let vibrationEnabled = true;

// Wave system variables
let currentWave = 1;
let enemiesRemaining = 0;
let waveEnemiesToKill = 10;  // Start with 10 enemies per wave
let isWaveComplete = false;

// Audio system functions
function initAudio() {
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioCtx.state === 'suspended') {
        audioCtx.resume();
    }
}

function playSound(type) {
    if (!soundEnabled || !audioCtx) return;
    
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    
    const now = audioCtx.currentTime;
    
    switch(type) {
        case 'shoot':
            // Sharp laser pew
            osc.type = 'square';
            osc.frequency.setValueAtTime(880, now);
            osc.frequency.exponentialRampToValueAtTime(220, now + 0.1);
            gain.gain.setValueAtTime(0.1, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
            osc.start(now);
            osc.stop(now + 0.1);
            break;
            
        case 'hit':
            // Short thud
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(200, now);
            osc.frequency.exponentialRampToValueAtTime(100, now + 0.05);
            gain.gain.setValueAtTime(0.15, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.05);
            osc.start(now);
            osc.stop(now + 0.05);
            break;
            
        case 'death':
            // Explosion crunch
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(100, now);
            osc.frequency.exponentialRampToValueAtTime(20, now + 0.2);
            gain.gain.setValueAtTime(0.2, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
            osc.start(now);
            osc.stop(now + 0.2);
            break;
            
        case 'powerup':
            // Rising chime
            osc.type = 'sine';
            osc.frequency.setValueAtTime(440, now);
            osc.frequency.exponentialRampToValueAtTime(880, now + 0.15);
            gain.gain.setValueAtTime(0.15, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
            osc.start(now);
            osc.stop(now + 0.2);
            break;
            
        case 'click':
            // UI click
            osc.type = 'sine';
            osc.frequency.setValueAtTime(1200, now);
            gain.gain.setValueAtTime(0.05, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.05);
            osc.start(now);
            osc.stop(now + 0.05);
            break;
            
        case 'boss':
            // Dramatic swell
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(55, now);
            osc.frequency.linearRampToValueAtTime(110, now + 0.5);
            gain.gain.setValueAtTime(0.1, now);
            gain.gain.linearRampToValueAtTime(0.15, now + 0.3);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 1);
            osc.start(now);
            osc.stop(now + 1);
            break;
            
        case 'bossDefeat':
            // Triumphant fanfare
            const notes = [523, 659, 784, 1047]; // C, E, G, C
            notes.forEach((freq, i) => {
                const o = audioCtx.createOscillator();
                const g = audioCtx.createGain();
                o.connect(g);
                g.connect(audioCtx.destination);
                o.type = 'square';
                o.frequency.setValueAtTime(freq, now + i * 0.1);
                g.gain.setValueAtTime(0.1, now + i * 0.1);
                g.gain.exponentialRampToValueAtTime(0.01, now + i * 0.1 + 0.15);
                o.start(now + i * 0.1);
                o.stop(now + i * 0.1 + 0.15);
            });
            gain.gain.value = 0; // Don't play base sound
            break;
    }
}

// Boss music system
function startBossMusic() {
    if (!musicEnabled || !audioCtx || isBossMusic) return;
    isBossMusic = true;
    
    musicOscillator = audioCtx.createOscillator();
    musicGain = audioCtx.createGain();
    musicOscillator.connect(musicGain);
    musicGain.connect(audioCtx.destination);
    
    const now = audioCtx.currentTime;
    musicOscillator.type = 'sawtooth';
    musicOscillator.frequency.setValueAtTime(55, now); // Low ominous drone
    musicGain.gain.setValueAtTime(0.05, now);
    
    musicOscillator.start(now);
}

function stopBossMusic() {
    if (musicOscillator) {
        musicOscillator.stop();
        musicOscillator = null;
    }
    isBossMusic = false;
}

// Sound/music toggle
const soundBtn = document.getElementById('soundBtn');
const musicBtn = document.getElementById('musicBtn');

soundBtn.addEventListener('click', () => {
    soundEnabled = !soundEnabled;
    saveSettings();
    updateSettingsUI();
    playSound('click');
});

musicBtn.addEventListener('click', () => {
    musicEnabled = !musicEnabled;
    saveSettings();
    updateSettingsUI();
    if (!musicEnabled && isBossMusic) {
        stopBossMusic();
    } else if (musicEnabled && isBossWave) {
        startBossMusic();
    }
    playSound('click');
});

// Show sound/music buttons when game starts
function updateSoundButtonVisibility() {
    if (gameRunning) {
        soundBtn.classList.remove('hidden');
        musicBtn.classList.remove('hidden');
    } else {
        soundBtn.classList.add('hidden');
        musicBtn.classList.add('hidden');
    }
}

function updateSettingsButtonVisibility() {
    const settingsBtn = document.getElementById('settingsBtn');
    const settingsPanel = document.getElementById('settingsPanel');
    const dailyRewardsBtn = document.getElementById('dailyRewardsBtn');
    
    if (gameRunning) {
        settingsBtn.classList.remove('hidden');
    } else {
        settingsBtn.classList.add('hidden');
        settingsPanel.classList.add('hidden');
    }
    
    // Update daily rewards button visibility
    if (dailyRewardsBtn) {
        if (gameRunning) {
            dailyRewardsBtn.classList.add('hidden');
        } else {
            checkDailyRewardAvailability();
        }
    }
}

// Settings functions
function loadSettings() {
    soundEnabled = localStorage.getItem('soundEnabled') !== 'false';
    musicEnabled = localStorage.getItem('musicEnabled') !== 'false';
    graphicsQuality = localStorage.getItem('graphicsQuality') || 'high';
    vibrationEnabled = localStorage.getItem('vibrationEnabled') !== 'false';
    updateSettingsUI();
}

function saveSettings() {
    safeSetItem('soundEnabled', soundEnabled);
    safeSetItem('musicEnabled', musicEnabled);
    safeSetItem('graphicsQuality', graphicsQuality);
    safeSetItem('vibrationEnabled', vibrationEnabled);
}

function updateSettingsUI() {
    const soundBtn = document.getElementById('soundBtn');
    const musicBtn = document.getElementById('musicBtn');
    const soundToggle = document.getElementById('soundToggle');
    const musicToggle = document.getElementById('musicToggle');
    const graphicsToggle = document.getElementById('graphicsToggle');
    const vibrationToggle = document.getElementById('vibrationToggle');
    
    if (soundBtn) soundBtn.textContent = soundEnabled ? '🔊' : '🔇';
    if (musicBtn) musicBtn.textContent = musicEnabled ? '🎵' : '🎶';
    if (soundToggle) {
        soundToggle.textContent = soundEnabled ? 'ON' : 'OFF';
        soundToggle.classList.toggle('off', !soundEnabled);
    }
    if (musicToggle) {
        musicToggle.textContent = musicEnabled ? 'ON' : 'OFF';
        musicToggle.classList.toggle('off', !musicEnabled);
    }
    if (graphicsToggle) {
        graphicsToggle.textContent = graphicsQuality.toUpperCase();
        graphicsToggle.classList.toggle('off', graphicsQuality === 'low');
    }
    if (vibrationToggle) {
        vibrationToggle.textContent = vibrationEnabled ? 'ON' : 'OFF';
        vibrationToggle.classList.toggle('off', !vibrationEnabled);
    }
}

function vibrate(pattern) {
    if (vibrationEnabled && navigator.vibrate) {
        navigator.vibrate(pattern);
    }
}

// Daily Rewards Functions
function loadDailyRewards() {
    const saved = localStorage.getItem('dailyRewards');
    if (saved) {
        dailyRewards = JSON.parse(saved);
    }
    updateDailyRewardsUI();
}

function loadPlayerGems() {
    player.gems = parseInt(localStorage.getItem('playerGems') || '0');
}

function saveDailyRewards() {
    safeSetItem('dailyRewards', JSON.stringify(dailyRewards));
    // Also save gems
    safeSetItem('playerGems', (player.gems || 0).toString());
}

function canClaimReward() {
    if (!dailyRewards.lastClaimDate) return true;
    
    const lastClaim = new Date(dailyRewards.lastClaimDate);
    const now = new Date();
    const timeDiff = now.getTime() - lastClaim.getTime();
    
    return timeDiff >= REWARD_INTERVAL;
}

function checkDailyRewardAvailability() {
    const dailyRewardsBtn = document.getElementById('dailyRewardsBtn');
    if (canClaimReward() && dailyRewardsBtn) {
        dailyRewardsBtn.classList.remove('hidden');
    } else if (dailyRewardsBtn) {
        dailyRewardsBtn.classList.add('hidden');
    }
}

function getDaysUntilReward() {
    if (!dailyRewards.lastClaimDate) return 0;
    
    const lastClaim = new Date(dailyRewards.lastClaimDate);
    const now = new Date();
    const timeDiff = REWARD_INTERVAL - (now.getTime() - lastClaim.getTime());
    
    if (timeDiff <= 0) return 0;
    
    const hours = Math.floor(timeDiff / (1000 * 60 * 60));
    const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));
    
    return { hours, minutes };
}

function claimDailyReward() {
    if (!canClaimReward()) return;
    
    const dayIndex = dailyRewards.consecutiveDays % 7;
    const reward = DAILY_REWARD_AMOUNTS[dayIndex];
    
    // Add gems/currency to player
    player.gems = (player.gems || 0) + reward;
    
    // Update streak
    const lastClaim = dailyRewards.lastClaimDate ? new Date(dailyRewards.lastClaimDate) : null;
    const now = new Date();
    
    if (lastClaim) {
        const daysSinceLastClaim = Math.floor((now.getTime() - lastClaim.getTime()) / (1000 * 60 * 60 * 24));
        
        // Check if consecutive day
        if (daysSinceLastClaim === 1) {
            dailyRewards.consecutiveDays++;
        } else if (daysSinceLastClaim > 1) {
            dailyRewards.consecutiveDays = 1; // Reset streak
        }
    } else {
        dailyRewards.consecutiveDays = 1;
    }
    
    dailyRewards.lastClaimDate = now.toISOString();
    
    // Show reward animation
    showRewardClaimAnimation(reward);
    
    saveDailyRewards();
    updateDailyRewardsUI();
    
    // Play sound
    playSound('powerup');
}

function showRewardClaimAnimation(amount) {
    const notification = document.getElementById('dailyRewardNotification');
    if (!notification) return;
    const notificationText = notification.querySelector('.notification-text');
    if (!notificationText) return;

    notificationText.textContent = `+${amount} Gems!`;
    notification.classList.remove('hidden');

    setTimeout(() => {
        notification.classList.add('hidden');
    }, 3000);
}

function updateDailyRewardsUI() {
    const panel = document.getElementById('dailyRewardsPanel');
    const streakCount = document.getElementById('streakCount');
    const claimBtn = document.getElementById('claimDailyBtn');
    const nextTimer = document.getElementById('nextRewardTimer');
    if (!panel || !streakCount || !claimBtn || !nextTimer) return;

    // Update streak
    streakCount.textContent = dailyRewards.consecutiveDays;
    
    // Update day statuses
    const rewardDays = panel.querySelectorAll('.reward-day');
    rewardDays.forEach((day, index) => {
        const dayNum = index + 1;
        day.classList.remove('available', 'claimed', 'locked');
        
        if (dayNum <= dailyRewards.consecutiveDays) {
            day.classList.add('claimed');
        } else if (dayNum === dailyRewards.consecutiveDays + 1 && canClaimReward()) {
            day.classList.add('available');
        } else {
            day.classList.add('locked');
        }
    });
    
    // Update claim button
    if (canClaimReward()) {
        claimBtn.disabled = false;
        claimBtn.textContent = 'CLAIM REWARD';
        nextTimer.textContent = 'NOW!';
    } else {
        claimBtn.disabled = true;
        const time = getDaysUntilReward();
        if (typeof time === 'object') {
            nextTimer.textContent = `${time.hours}h ${time.minutes}m`;
        } else {
            nextTimer.textContent = '--:--';
        }
    }
}

// Add after wave variables
let spawnRateMultiplier = 1.0;
let enemySpeedMultiplier = 1.0;

// Enemy Types
const EnemyTypes = {
    BASIC: {
        id: 'basic',
        width: 40,
        height: 40,
        health: 1,
        speed: 3,
        damage: 20,
        scoreValue: 10,
        color: '#e74c3c'  // Red
    },
    FAST: {
        id: 'fast',
        width: 30,
        height: 30,
        health: 1,
        speed: 6,
        damage: 25,
        scoreValue: 15,
        color: '#f39c12'  // Orange/Yellow
    },
    TANK: {
        id: 'tank',
        width: 60,
        height: 60,
        health: 3,
        speed: 2,
        damage: 40,
        scoreValue: 30,
        color: '#9b59b6'  // Purple
    },
    SHOOTER: {
        id: 'shooter',
        width: 40,
        height: 40,
        health: 2,
        speed: 2.5,
        damage: 20,
        scoreValue: 25,
        color: '#e67e22'  // Dark Orange
    },
    BOSS: {
        id: 'boss',
        width: 100,
        height: 100,
        health: 20,
        speed: 1,
        damage: 50,
        scoreValue: 500,
        color: '#c0392b'  // Dark Red
    }
};

// Boss wave variables
let isBossWave = false;
let boss = null;
let bossHealthBar = null;

function getWaveConfig(waveNumber) {
    const isBoss = waveNumber % 5 === 0;  // Boss every 5 waves
    
    if (isBoss) {
        return {
            isBossWave: true,
            enemyCount: 1,
            composition: [{ type: 'BOSS', count: 1 }],
            speedMultiplier: 1.0,
            spawnRateMultiplier: 1.0
        };
    }
    
    // Determine wave tier
    const tier = Math.ceil(waveNumber / 5);
    
    // Calculate composition based on tier
    let baseCount = Math.min(80, 10 + (waveNumber - 1) * 3);
    let composition = [];
    
    // Always have basic enemies
    composition.push({ type: 'BASIC', count: Math.floor(baseCount * 0.5) });
    
    // Add fast enemies (unlock wave 3)
    if (waveNumber >= 3) {
        composition.push({ type: 'FAST', count: Math.floor(baseCount * 0.3) });
    }
    
    // Add tanks (unlock wave 6)
    if (waveNumber >= 6) {
        composition.push({ type: 'TANK', count: Math.floor(baseCount * 0.15) });
    }
    
    // Add shooters (unlock wave 9)
    if (waveNumber >= 9) {
        composition.push({ type: 'SHOOTER', count: Math.floor(baseCount * 0.1) });
    }
    
    return {
        isBossWave: false,
        composition: composition,
        speedMultiplier: Math.min(3.0, 1.0 + (waveNumber - 1) * 0.05),
        spawnRateMultiplier: Math.max(0.5, 1.0 - (waveNumber - 1) * 0.02)
    };
}

function createEnemy(type) {
    const config = EnemyTypes[type] || EnemyTypes.BASIC;
    return {
        x: Math.random() * (canvas.width - config.width),
        y: -config.height - 10,
        width: config.width,
        height: config.height,
        health: config.health,
        speed: config.speed,
        damage: config.damage,
        scoreValue: config.scoreValue,
        color: config.color,
        type: type,
        maxHealth: config.health
    };
}

function spawnEnemyFromConfig(type, count, speedMult) {
    for (let i = 0; i < count; i++) {
        const enemy = createEnemy(type);
        enemy.speed *= speedMult;
        enemies.push(enemy);
    }
}

function showBossHealthBar() {
    const bar = document.getElementById('bossHealthBar');
    if (bar) {
        bar.classList.remove('hidden');
        updateBossHealthBar();
    }
}

function updateBossHealthBar() {
    const fill = document.getElementById('bossHealthFill');
    if (fill && boss) {
        const percent = (boss.health / boss.maxHealth) * 100;
        fill.style.width = percent + '%';
    }
}

function hideBossHealthBar() {
    const bar = document.getElementById('bossHealthBar');
    if (bar) {
        bar.classList.add('hidden');
    }
}

function checkBossDefeated() {
    if (boss && boss.health <= 0) {
        // Boss defeated!
        score += boss.scoreValue;
        createParticles(boss.x + boss.width/2, boss.y + boss.height/2, 80, boss.color);
        enemies = enemies.filter(e => e !== boss);
        boss = null;
        hideBossHealthBar();
        triggerScreenShake(50, 15);
        vibrate(30);
        playSound('bossDefeat');
        stopBossMusic();
        checkWaveComplete();
    }
}

// Delta time normalization
const TARGET_FPS = 60;
const FRAME_TIME = 1000 / TARGET_FPS;

// Spawn rate accumulators
let enemySpawnAccumulator = 0;
let obstacleSpawnAccumulator = 0;
let powerupSpawnAccumulator = 0;

function normalizeDelta(deltaTime) {
    return deltaTime / FRAME_TIME;  // Returns ~1.0 at 60fps
}

const player = {
    x: 0,
    y: 0,
    width: 40,
    height: 60,
    health: 100,
    maxHealth: 100,
    ammo: 30,
    maxAmmo: 30,
    speed: 5,
    color: '#4ecdc4',
    gems: 0
};

let bullets = [];
let enemies = [];
let obstacles = [];
let powerups = [];
let particles = [];

// Screen shake system
let screenShake = {
    intensity: 0,
    duration: 0,
    decay: 0.9
};

function triggerScreenShake(intensity, duration) {
    screenShake.intensity = intensity;
    screenShake.duration = duration;
}

// Damage numbers
let damageNumbers = [];

function createDamageNumber(x, y, damage) {
    damageNumbers.push({
        x: x,
        y: y,
        damage: damage,
        life: 1,
        vy: -2
    });
}



function resizeCanvas() {
    const oldWidth = canvas.width || canvas.offsetWidth;
    const relativeX = oldWidth > 0 ? player.x / oldWidth : 0.5;
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
    if (gameRunning) {
        player.x = Math.max(0, Math.min(canvas.width - player.width, relativeX * canvas.width));
    } else {
        player.x = canvas.width / 2 - player.width / 2;
    }
    player.y = canvas.height - player.height - 80;
}

function updateHighScoreDisplay() {
    const highScore = parseInt(localStorage.getItem('highScore') || '0');
    startHighScoreEl.textContent = highScore;
}

function updateGameStats() {
    // Update total games played
    const totalGames = parseInt(localStorage.getItem('totalGames') || '0');
    safeSetItem('totalGames', (totalGames + 1).toString());
    
    // Update total enemies killed
    const totalEnemiesKilled = parseInt(localStorage.getItem('totalEnemiesKilled') || '0');
    safeSetItem('totalEnemiesKilled', (totalEnemiesKilled + enemiesKilledInGame).toString());
}

// Add pause functions
function pauseGame() {
    if (!gameRunning || isPaused) return;
    
    isPaused = true;
    pauseMenu.classList.remove('hidden');
}

function resumeGame() {
    if (!isPaused) return;
    
    isPaused = false;
    pauseMenu.classList.add('hidden');
}

function restartFromPause() {
    resumeGame();
    startGame();
}

function quitToMenu() {
    resumeGame();
    gameOver();
    // Show start screen
    document.getElementById('startScreen').classList.remove('hidden');
}

function updatePauseButtonVisibility() {
    if (gameRunning) {
        pauseBtn.classList.remove('hidden');
    } else {
        pauseBtn.classList.add('hidden');
    }
    updateSoundButtonVisibility();
}

// Initialize audio on first user interaction
function initAudioOnFirstInteraction() {
    initAudio();
    document.removeEventListener('click', initAudioOnFirstInteraction);
    document.removeEventListener('touchstart', initAudioOnFirstInteraction);
}

function init() {
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    setupControls();
    startBtn.addEventListener('click', () => {
        initAudio(); // Ensure audio is initialized
        playSound('click');
        startGame();
    });
    restartBtn.addEventListener('click', () => {
        initAudio(); // Ensure audio is initialized
        playSound('click');
        startGame();
    });

    // Shop
    const shopBtn = document.getElementById('shopBtn');
    const shopPanel = document.getElementById('shopPanel');
    const closeShopBtn = document.getElementById('closeShopBtn');
    if (shopBtn && shopPanel) {
        shopBtn.addEventListener('click', () => {
            playSound('click');
            updateShopUI();
            shopPanel.classList.remove('hidden');
        });
    }
    if (closeShopBtn && shopPanel) {
        closeShopBtn.addEventListener('click', () => {
            playSound('click');
            shopPanel.classList.add('hidden');
        });
    }
    shopPanel && shopPanel.addEventListener('click', (e) => {
        const btn = e.target.closest('.shop-buy-btn');
        if (!btn) return;
        const item = btn.dataset.item;
        const cost = parseInt(btn.dataset.cost);
        if (item.startsWith('skin_') && shopData.skins[item.replace('skin_', '')]) {
            equipSkin(item.replace('skin_', ''));
        } else {
            buyShopItem(item, cost);
        }
        playSound('click');
    });

    // Revive
    const reviveBtn = document.getElementById('reviveBtn');
    const reviveSkipBtn = document.getElementById('reviveSkipBtn');
    if (reviveBtn) reviveBtn.addEventListener('click', () => { playSound('powerup'); doRevive(); });
    if (reviveSkipBtn) reviveSkipBtn.addEventListener('click', () => {
        clearInterval(reviveTimerInterval);
        const prompt = document.getElementById('revivePrompt');
        if (prompt) prompt.classList.add('hidden');
        showGameOverScreen();
    });

    document.addEventListener('click', initAudioOnFirstInteraction);
    document.addEventListener('touchstart', initAudioOnFirstInteraction);
    
    // Add pause event listeners
    pauseBtn.addEventListener('click', () => {
        initAudio(); // Ensure audio is initialized
        playSound('click');
        pauseGame();
    });
    resumeBtn.addEventListener('click', () => {
        initAudio(); // Ensure audio is initialized
        playSound('click');
        resumeGame();
    });
    document.getElementById('restartFromPauseBtn').addEventListener('click', () => {
        initAudio(); // Ensure audio is initialized
        playSound('click');
        restartFromPause();
    });
    document.getElementById('quitBtn').addEventListener('click', () => {
        initAudio(); // Ensure audio is initialized
        playSound('click');
        quitToMenu();
    });
    
    // Settings panel elements
    const settingsBtn = document.getElementById('settingsBtn');
    const settingsPanel = document.getElementById('settingsPanel');
    const closeSettingsBtn = document.getElementById('closeSettingsBtn');
    const soundToggle = document.getElementById('soundToggle');
    const musicToggle = document.getElementById('musicToggle');
    const graphicsToggle = document.getElementById('graphicsToggle');
    const vibrationToggle = document.getElementById('vibrationToggle');

    // Open settings
    settingsBtn.addEventListener('click', () => {
        initAudio();
        playSound('click');
        settingsPanel.classList.remove('hidden');
    });

    // Close settings
    closeSettingsBtn.addEventListener('click', () => {
        playSound('click');
        settingsPanel.classList.add('hidden');
    });

    // Sound toggle
    soundToggle.addEventListener('click', () => {
        soundEnabled = !soundEnabled;
        saveSettings();
        updateSettingsUI();
        playSound('click');
        vibrate(20);
    });

    // Music toggle
    musicToggle.addEventListener('click', () => {
        musicEnabled = !musicEnabled;
        saveSettings();
        updateSettingsUI();
        if (!musicEnabled && isBossMusic) {
            stopBossMusic();
        } else if (musicEnabled && isBossWave) {
            startBossMusic();
        }
        playSound('click');
        vibrate(20);
    });

    // Graphics toggle
    graphicsToggle.addEventListener('click', () => {
        graphicsQuality = graphicsQuality === 'high' ? 'low' : 'high';
        saveSettings();
        updateSettingsUI();
        playSound('click');
        vibrate(20);
    });

    // Vibration toggle
    vibrationToggle.addEventListener('click', () => {
        vibrationEnabled = !vibrationEnabled;
        saveSettings();
        updateSettingsUI();
        if (vibrationEnabled) {
            vibrate(50);
        }
        playSound('click');
    });
    
    // Daily rewards elements
    const dailyRewardsBtn = document.getElementById('dailyRewardsBtn');
    const dailyRewardsPanel = document.getElementById('dailyRewardsPanel');
    const closeDailyBtn = document.getElementById('closeDailyBtn');
    const claimDailyBtn = document.getElementById('claimDailyBtn');

    // Open daily rewards
    dailyRewardsBtn.addEventListener('click', () => {
        initAudio();
        playSound('click');
        dailyRewardsPanel.classList.remove('hidden');
        updateDailyRewardsUI();
    });

    // Close daily rewards
    closeDailyBtn.addEventListener('click', () => {
        playSound('click');
        dailyRewardsPanel.classList.add('hidden');
    });

    // Claim daily reward
    claimDailyBtn.addEventListener('click', () => {
        if (canClaimReward()) {
            playSound('powerup');
            claimDailyReward();
        }
    });

    // Update daily rewards button visibility
    function updateDailyRewardsButtonVisibility() {
        if (dailyRewardsBtn) {
            if (gameRunning) {
                dailyRewardsBtn.classList.add('hidden');
            } else {
                checkDailyRewardAvailability();
            }
        }
    }
    
    // Add keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' || e.key === 'p' || e.key === 'P') {
            if (isPaused) {
                resumeGame();
            } else if (gameRunning) {
                pauseGame();
            }
        }
    });
    
    // Add visibility change listener for mobile
    document.addEventListener('visibilitychange', () => {
        if (document.hidden && gameRunning && !isPaused) {
            pauseGame();
        }
    });

    // Tutorial elements
    const tutorialOverlay = document.getElementById('tutorialOverlay');
    const tutorialSkipBtn = document.getElementById('tutorialSkipBtn');

    // Skip tutorial
    tutorialSkipBtn.addEventListener('click', () => {
        playSound('click');
        skipTutorial();
    });

    // Close tutorial hint on tap
    tutorialOverlay.addEventListener('click', () => {
        if (!tutorialState.completed && !tutorialState.skipped) {
            tutorialState.currentStep++;
            showTutorialStep(tutorialState.currentStep);
        }
    });
    
    updateHighScoreDisplay(); // Initialize high score display
}

// Check if player needs tutorial
function needsTutorial() {
    // Check if first time player
    const hasPlayed = localStorage.getItem('hasPlayed') === 'true';
    const tutorialCompleted = localStorage.getItem('tutorialCompleted') === 'true';
    
    return !hasPlayed && !tutorialCompleted;
}

// Start tutorial
function startTutorial() {
    tutorialState.currentStep = 0;
    tutorialState.completed = false;
    tutorialState.skipped = false;

    showTutorialStep(0);
}

// Show tutorial step
function showTutorialStep(stepIndex) {
    if (tutorialState.completed || tutorialState.skipped) return;
    
    const overlay = document.getElementById('tutorialOverlay');
    const step = TUTORIAL_STEPS[stepIndex];
    
    if (!step) {
        completeTutorial();
        return;
    }
    
    // Update progress bar
    const progress = ((stepIndex + 1) / TUTORIAL_STEPS.length) * 100;
    document.getElementById('tutorialProgress').style.width = progress + '%';
    
    // Update text
    document.getElementById('tutorialText').innerHTML = `
        <h3>${step.title}</h3>
        <p>${step.text}</p>
    `;
    
    // Update highlight
    const highlight = document.getElementById('tutorialHighlight');
    
    if (step.highlight) {
        const playerRect = player;
        const highlightWidth = step.highlight.width;
        const highlightHeight = step.highlight.height;
        const highlightX = playerRect.x + (playerRect.width - highlightWidth) / 2;
        const highlightY = playerRect.y + step.highlight.offsetY;
        
        highlight.style.width = highlightWidth + 'px';
        highlight.style.height = highlightHeight + 'px';
        highlight.style.left = highlightX + 'px';
        highlight.style.top = highlightY + 'px';
        highlight.style.display = 'block';
    } else {
        highlight.style.display = 'none';
    }
    
    // Show overlay
    overlay.classList.remove('hidden');
    
    // Set timeout for auto-advance
    if (tutorialTimeout) clearTimeout(tutorialTimeout);
    
    if (step.duration > 0) {
        tutorialTimeout = setTimeout(() => {
            tutorialState.currentStep++;
            showTutorialStep(tutorialState.currentStep);
        }, step.duration);
    }
}

// Complete tutorial
function completeTutorial() {
    tutorialState.completed = true;
    tutorialState.skipped = false;
    
    safeSetItem('tutorialCompleted', 'true');
    safeSetItem('hasPlayed', 'true');
    
    hideTutorial();
    
    // Show completion message
    showTutorialHint('Tutorial Complete! Good luck!');
    
    playSound('powerup');
}

// Skip tutorial
function skipTutorial() {
    tutorialState.skipped = true;

    safeSetItem('tutorialCompleted', 'true');
    safeSetItem('hasPlayed', 'true');

    showTutorialHint('Tutorial skipped');
    hideTutorial();
}

// Hide tutorial
function hideTutorial() {
    const overlay = document.getElementById('tutorialOverlay');
    overlay.classList.add('hidden');
    
    if (tutorialTimeout) {
        clearTimeout(tutorialTimeout);
        tutorialTimeout = null;
    }
}

// Show tutorial hint
function showTutorialHint(text) {
    const hint = document.getElementById('tutorialHint');
    const hintText = document.getElementById('hintText');
    
    hintText.textContent = text;
    hint.classList.remove('hidden');
    
    setTimeout(() => {
        hint.classList.add('hidden');
    }, 3000);
}

// Track tutorial actions
function trackTutorialAction(action) {
    if (tutorialState.completed || tutorialState.skipped) return;
    
    const step = TUTORIAL_STEPS[tutorialState.currentStep];
    if (step && step.action === action) {
        // Advance to next step immediately
        tutorialState.currentStep++;
        showTutorialStep(tutorialState.currentStep);
    }
}

// Check tutorial action triggers
function checkTutorialTriggers(event) {
    if (tutorialState.completed || tutorialState.skipped) return;
    
    switch(event) {
        case 'move':
            trackTutorialAction('move');
            break;
        case 'shoot':
            trackTutorialAction('shoot');
            break;
        case 'kill_enemy':
            trackTutorialAction('kill_enemy');
            break;
        case 'collect_powerup':
            trackTutorialAction('collect_powerup');
            break;
        case 'boss_wave':
            trackTutorialAction('boss_wave');
            break;
    }
}

function setupControls() {
    let isDragging = false;
    let startX = 0;
    let startY = 0;

    canvas.addEventListener('mousedown', (e) => {
        isDragging = true;
        const rect = canvas.getBoundingClientRect();
        startX = e.clientX - rect.left;
        startY = e.clientY - rect.top;
    });

    canvas.addEventListener('mousemove', (e) => {
        if (isDragging) {
            const rect = canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const dx = x - startX;
            player.x = Math.max(0, Math.min(canvas.width - player.width, player.x + dx));
            startX = x;
        }
    });

    canvas.addEventListener('mouseup', () => {
        isDragging = false;
    });

    canvas.addEventListener('touchstart', (e) => {
        e.preventDefault();
        isDragging = true;
        const rect = canvas.getBoundingClientRect();
        const touch = e.touches[0];
        startX = touch.clientX - rect.left;
        startY = touch.clientY - rect.top;
        
        // Show player highlight when touching
        if (playerHighlight && playerHighlightBox) {
            playerHighlight.classList.remove('hidden');
                playerHighlightBox.style.left = (player.x - 3) + 'px';
        }
    });

    canvas.addEventListener('touchmove', (e) => {
        e.preventDefault();
        if (isDragging) {
            const rect = canvas.getBoundingClientRect();
            const touch = e.touches[0];
            const x = touch.clientX - rect.left;
            const dx = x - startX;
            player.x = Math.max(0, Math.min(canvas.width - player.width, player.x + dx));
            startX = x;
            
            // Update highlight position
            if (playerHighlightBox) {
            playerHighlightBox.style.left = (player.x - 3) + 'px';
            }
            
            // Add tutorial trigger for movement
            checkTutorialTriggers('move');
        }
    });

    canvas.addEventListener('touchend', () => {
        isDragging = false;
        
        // Hide highlight with delay
        if (playerHighlight) {
            setTimeout(() => {
                playerHighlight.classList.add('hidden');
            }, 200);
        }
    });
}



function shoot() {
    if (player.ammo <= 0 || !gameRunning || isPaused) return;
    
    player.ammo--;
    updateUI();
    
    const bullet = {
        x: player.x + player.width / 2,
        y: player.y,
        vx: 0,
        vy: -12,
        radius: 5,
        color: '#ff6b6b'
    };
    bullets.push(bullet);
    
    createParticles(player.x + player.width / 2, player.y, 5, '#ffeb3b');
    triggerScreenShake(8, 3);
    playSound('shoot');
    
    // Add tutorial trigger
    checkTutorialTriggers('shoot');
}

function startGame() {
    gameRunning = true;
    score = 0;
    enemiesKilledInGame = 0;
    usedReviveThisGame = false;
    player.health = player.maxHealth;
    player.ammo = shopData.ammoBoost ? player.maxAmmo + 10 : player.maxAmmo;
    player.color = SKIN_COLORS[shopData.activeSkin] || SKIN_COLORS.default;
    player.gems = player.gems || 0;
    player.x = canvas.width / 2 - player.width / 2;
    player.y = canvas.height - player.height - 80;  // 80px from bottom
    bullets = [];
    enemies = [];
    obstacles = [];
    powerups = [];
    particles = [];
    
    // Reset spawn accumulators
    enemySpawnAccumulator = 0;
    obstacleSpawnAccumulator = 0;
    powerupSpawnAccumulator = 0;
    
    // Reset wave system
    currentWave = 1;
    isWaveComplete = false;
    
    // Initialize first wave with new system
    const firstWaveConfig = getWaveConfig(1);
    isBossWave = firstWaveConfig.isBossWave;
    spawnRateMultiplier = firstWaveConfig.spawnRateMultiplier;
    enemySpeedMultiplier = firstWaveConfig.speedMultiplier;
    
    if (firstWaveConfig.isBossWave) {
        enemiesRemaining = 1;
    } else {
        enemiesRemaining = firstWaveConfig.composition.reduce((sum, group) => sum + group.count, 0);
    }
    
    // Reset boss state
    boss = null;
    hideBossHealthBar();
    
    startScreen.classList.add('hidden');
    gameOverScreen.classList.add('hidden');
    updateUI();
    updateHighScoreDisplay(); // Update high score on start screen
    
    // Show pause button when game starts
    updatePauseButtonVisibility();
    updateSettingsButtonVisibility();
    updateSoundButtonVisibility();
    
    // Mark as played
    safeSetItem('hasPlayed', 'true');
    
    // Check if tutorial needed
    if (needsTutorial()) {
        // Start tutorial mode
        setTimeout(() => {
            startTutorial();
        }, 500);
    }
    
    lastTime = performance.now();
    requestAnimationFrame(gameLoop);
}

function gameOver() {
    gameRunning = false;
    
    // Reset screen shake
    screenShake.intensity = 0;
    screenShake.duration = 0;
    
    // Clean up boss state
    hideBossHealthBar();
    boss = null;
    isBossWave = false;
    stopBossMusic();
    
    // Update game statistics
    updateGameStats();
    
    // Save high score
    const currentHighScore = parseInt(localStorage.getItem('highScore') || '0');
    const flooredScore = Math.floor(score);
    if (flooredScore > currentHighScore) {
        safeSetItem('highScore', flooredScore.toString());
    }
    
    // Update game over screen
    if (finalScoreEl) finalScoreEl.textContent = flooredScore;

    // Display high score
    const highScore = parseInt(localStorage.getItem('highScore') || '0');
    if (highScoreDisplayEl) highScoreDisplayEl.textContent = highScore;

    // Display additional statistics
    if (enemiesKilledDisplayEl) enemiesKilledDisplayEl.textContent = enemiesKilledInGame;
    if (totalGamesDisplayEl) totalGamesDisplayEl.textContent = localStorage.getItem('totalGames') || '1';
    if (totalEnemiesDisplayEl) totalEnemiesDisplayEl.textContent = localStorage.getItem('totalEnemiesKilled') || '0';

    // Show wave reached
    const waveReachedEl = document.getElementById('waveReachedDisplay');
    if (waveReachedEl) waveReachedEl.textContent = currentWave;

    // Check for revive
    if (shopData.revives > 0 && !usedReviveThisGame) {
        showRevivePrompt();
    } else {
        showGameOverScreen();
    }
}

function spawnEnemy() {
    const config = getWaveConfig(currentWave);
    
    if (config.isBossWave) {
        // Spawn boss
        if (!boss) {
            boss = createEnemy('BOSS');
            boss.y = -boss.height - 20;
            enemies.push(boss);
            enemiesRemaining = 1;
            showBossHealthBar();
            startBossMusic();
        }
        return;
    }
    
    // Determine which enemy type to spawn based on remaining in wave
    const waveConfig = getWaveConfig(currentWave);
    
    // Weighted random selection from composition
    const totalWeight = waveConfig.composition.reduce((sum, g) => sum + g.count, 0);
    let roll = Math.random() * totalWeight;
    let selectedType = waveConfig.composition[0].type;
    for (const group of waveConfig.composition) {
        roll -= group.count;
        if (roll <= 0) {
            selectedType = group.type;
            break;
        }
    }
    const enemy = createEnemy(selectedType);
    enemy.speed *= waveConfig.speedMultiplier;
    enemies.push(enemy);
    enemiesRemaining--;
}

function spawnObstacle() {
    const types = ['box', 'spike'];
    const type = types[Math.floor(Math.random() * types.length)];
    const obstacle = {
        x: Math.random() * (canvas.width - 40),
        y: -50,
        width: type === 'box' ? 40 : 30,
        height: type === 'box' ? 40 : 30,
        type: type,
        speed: 4 + Math.random() * 2,
        color: type === 'box' ? '#95a5a6' : '#f39c12'
    };
    obstacles.push(obstacle);
}

function spawnPowerup() {
    const types = ['health', 'ammo'];
    const type = types[Math.floor(Math.random() * types.length)];
    const powerup = {
        x: Math.random() * (canvas.width - 25),
        y: -50,
        width: 25,
        height: 25,
        type: type,
        speed: 3,
        color: type === 'health' ? '#2ecc71' : '#3498db'
    };
    powerups.push(powerup);
}

function createParticles(x, y, count, color) {
    // Reduce particle count in low graphics mode
    if (graphicsQuality === 'low') {
        count = Math.floor(count * 0.5);
    }
    
    for (let i = 0; i < count; i++) {
        particles.push({
            x: x,
            y: y,
            vx: (Math.random() - 0.5) * 12,
            vy: (Math.random() - 0.5) * 12,
            radius: Math.random() * 5 + 3,
            color: color,
            life: 1,
            decay: 0.02 + Math.random() * 0.02
        });
    }
}

function update(deltaTime, currentTime) {
    // Add at very start of update:
    if (isPaused) return;
    
    const dt = normalizeDelta(deltaTime);
    const fireRate = Math.max(minFireRate, baseFireRate - score * 0.05);
    if (currentTime - lastShotTime >= fireRate && player.ammo > 0 && gameRunning) {
        shoot();
        lastShotTime = currentTime;
    }
    
    // Don't spawn if wave is complete
    if (isWaveComplete) {
        enemySpawnAccumulator = 0;  // Reset accumulator
    } else {
        // Use new wave system spawn rate
        const currentConfig = getWaveConfig(currentWave);
        enemySpawnAccumulator += (0.02 + score * 0.00001) * currentConfig.spawnRateMultiplier * dt;
        if (enemySpawnAccumulator >= 1) {
            spawnEnemy();
            enemySpawnAccumulator = 0;
        }
    }

    obstacleSpawnAccumulator += (0.01 + score * 0.00001) * dt;
    if (obstacleSpawnAccumulator >= 1) {
        spawnObstacle();
        obstacleSpawnAccumulator = 0;
    }

    powerupSpawnAccumulator += 0.005 * dt;
    if (powerupSpawnAccumulator >= 1) {
        spawnPowerup();
        powerupSpawnAccumulator = 0;
    }
    
    bullets = bullets.filter(bullet => {
        bullet.x += bullet.vx * dt;
        bullet.y += bullet.vy * dt;
        return bullet.x < canvas.width + 50 && bullet.y > -50 && bullet.y < canvas.height + 50;
    });
    
    enemies = enemies.filter(enemy => {
        enemy.y += enemy.speed * dt;
        
        // Add boss respawn logic:
        if (enemy.type === 'BOSS') {
            if (enemy.y > canvas.height - 50) {
                // Boss passed player - respawn at top instead of getting stuck
                enemy.y = -enemy.height - 20;
                enemy.x = Math.random() * (canvas.width - enemy.width);
            }
        }
        
        if (checkCollision(player, enemy)) {
            player.health -= enemy.damage;
            createParticles(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2, 20, enemy.color);
            updateUI();
            triggerScreenShake(35, 10);
            vibrate(30);
            playSound('hit');
            return false;
        }
        
        for (let bi = bullets.length - 1; bi >= 0; bi--) {
            const bullet = bullets[bi];
            if (checkBulletCollision(bullet, enemy)) {
                enemy.health--;
                createParticles(bullet.x, bullet.y, 5, '#ffeb3b');
                bullets.splice(bi, 1);
                createDamageNumber(enemy.x + enemy.width/2, enemy.y, 1);
                triggerScreenShake(15, 5);
                vibrate(30);
                playSound('hit');
                if (enemy.health <= 0) {
                    score += enemy.scoreValue;
                    enemiesKilledInGame++;
                    enemiesRemaining--;

                    // Check if boss
                    if (enemy.type === 'BOSS') {
                        boss = null;
                        hideBossHealthBar();
                        createParticles(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2, 80, enemy.color);
                    } else {
                        createParticles(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2, 25, enemy.color);
                    }
                    triggerScreenShake(25, 8);
                    vibrate(30);
                    playSound('death');

                    // Add tutorial trigger for enemy kills
                    checkTutorialTriggers('kill_enemy');

                    updateUI();

                    // Check wave completion
                    if (enemiesRemaining <= 0) {
                        checkWaveComplete();
                    }
                    break;
                } else if (enemy.type === 'BOSS') {
                    // Update boss health bar if boss is damaged but not dead
                    updateBossHealthBar();
                    triggerScreenShake(20, 5);
                    vibrate(30);
                }
            }
        }
        
        return enemy.y < canvas.height + enemy.height && enemy.health > 0;
    });
    
    obstacles = obstacles.filter(obstacle => {
        obstacle.y += obstacle.speed * dt;
        
        if (checkCollision(player, obstacle)) {
            player.health -= 30;
            createParticles(obstacle.x + obstacle.width / 2, obstacle.y + obstacle.height / 2, 10, obstacle.color);
            updateUI();
            triggerScreenShake(25, 8);
            vibrate(20);
            playSound('hit');
            return false;
        }
        
        return obstacle.y < canvas.height + obstacle.height;
    });
    
    powerups = powerups.filter(powerup => {
        powerup.y += powerup.speed * dt;
        
        if (checkCollision(player, powerup)) {
            if (powerup.type === 'health') {
                player.health = Math.min(player.maxHealth, player.health + 30);
            } else if (powerup.type === 'ammo') {
                player.ammo = Math.min(player.maxAmmo, player.ammo + 10);
            }
            createParticles(powerup.x + powerup.width / 2, powerup.y + powerup.height / 2, 10, powerup.color);
            
            // Add tutorial trigger for powerup collection
            checkTutorialTriggers('collect_powerup');
            
            updateUI();
            playSound('powerup');
            return false;
        }
        
        return powerup.y < canvas.height + powerup.height;
    });
    
    particles = particles.filter(particle => {
        particle.x += particle.vx * dt;
        particle.y += particle.vy * dt;
        particle.life -= (particle.decay || 0.02) * dt;
        particle.vy += 0.2 * dt;
        return particle.life > 0;
    });
    
    score += dt;
    if (Math.floor(score) > Math.floor(score - dt) && Math.floor(score) % 500 === 0) {
        updateUI();
    }
    
    if (player.health <= 0) gameOver();
}

function checkCollision(a, b) {
    return a.x < b.x + b.width &&
           a.x + a.width > b.x &&
           a.y < b.y + b.height &&
           a.y + a.height > b.y;
}

function checkBulletCollision(bullet, enemy) {
    return bullet.x + bullet.radius > enemy.x &&
           bullet.x - bullet.radius < enemy.x + enemy.width &&
           bullet.y + bullet.radius > enemy.y &&
           bullet.y - bullet.radius < enemy.y + enemy.height;
}

function checkWaveComplete() {
    if (enemiesRemaining <= 0 && !isWaveComplete) {
        isWaveComplete = true;
        
        setTimeout(() => {
            currentWave++;
            const newConfig = getWaveConfig(currentWave);
            
            // Reset for next wave
            isWaveComplete = false;
            isBossWave = newConfig.isBossWave;
            spawnRateMultiplier = newConfig.spawnRateMultiplier;
            enemySpeedMultiplier = newConfig.speedMultiplier;
            
            // Calculate total enemies for this wave
            if (newConfig.isBossWave) {
                enemiesRemaining = 1;
            } else {
                enemiesRemaining = newConfig.composition.reduce((sum, group) => sum + group.count, 0);
            }
            
            // Show wave announcement
            if (newConfig.isBossWave) {
                showWaveAnnouncement(`BOSS WAVE ${currentWave}`, true);
                playSound('boss');
                stopBossMusic(); // Stop any existing music before starting new
                startBossMusic();
                
                // Add tutorial trigger for boss wave
                checkTutorialTriggers('boss_wave');
            } else {
                showWaveAnnouncement(`WAVE ${currentWave}`, false);
                stopBossMusic(); // Stop boss music when it's not a boss wave
            }
        }, 2000);
    }
}

function updateUI() {
    scoreEl.textContent = Math.floor(score);
    healthEl.textContent = player.health;
    ammoEl.textContent = player.ammo;
    
    // Add gems display
    const gemsEl = document.getElementById('gemsValue');
    if (gemsEl) {
        gemsEl.textContent = player.gems || 0;
    }
    
    // Add wave display
    const waveDisplay = document.getElementById('waveDisplay');
    if (waveDisplay) {
        waveDisplay.textContent = currentWave;
    }
}

function draw() {
    // Calculate shake offset
    let shakeX = 0, shakeY = 0;
    if (screenShake.duration > 0) {
        shakeX = (Math.random() - 0.5) * screenShake.intensity;
        shakeY = (Math.random() - 0.5) * screenShake.intensity;
        screenShake.duration--;
        screenShake.intensity *= screenShake.decay;
        if (screenShake.intensity < 0.5) screenShake.intensity = 0;
    }
    
    ctx.save();
    ctx.translate(shakeX, shakeY);
    
    ctx.fillStyle = '#0f0f1a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw player with optional glow
    if (graphicsQuality === 'high') {
        ctx.shadowBlur = 20;
        ctx.shadowColor = player.color;
    }
    ctx.fillStyle = player.color;
    ctx.fillRect(player.x, player.y, player.width, player.height);
    ctx.shadowBlur = 0;

    // Add highlight on top edge
    ctx.fillStyle = 'rgba(255,255,255,0.3)';
    ctx.fillRect(player.x, player.y, player.width, 10);

    // Keep gun detail
    ctx.fillStyle = '#ff6b6b';
    ctx.fillRect(player.x + player.width - 15, player.y + 10, 15, 8);
    ctx.fillStyle = player.color;
    ctx.fillRect(player.x + player.width - 10, player.y + 5, 5, 5);
    
    bullets.forEach(bullet => {
        ctx.beginPath();
        ctx.arc(bullet.x, bullet.y, bullet.radius, 0, Math.PI * 2);
        ctx.fillStyle = bullet.color;
        ctx.fill();
    });
    
    enemies.forEach(enemy => {
        ctx.fillStyle = enemy.color;
        ctx.fillRect(enemy.x, enemy.y, enemy.width, enemy.height);
        
        // Draw enemy-specific details
        if (enemy.type === 'BASIC') {
            ctx.fillStyle = '#c0392b';
            ctx.fillRect(enemy.x + 10, enemy.y + 10, 10, 10);
            ctx.fillRect(enemy.x + 30, enemy.y + 10, 10, 10);
            ctx.fillRect(enemy.x + 20, enemy.y + 30, 10, 10);
        } else if (enemy.type === 'FAST') {
            ctx.fillStyle = '#d68910';
            ctx.beginPath();
            ctx.arc(enemy.x + enemy.width/2, enemy.y + enemy.height/2, 8, 0, Math.PI * 2);
            ctx.fill();
        } else if (enemy.type === 'TANK') {
            ctx.fillStyle = '#7d3c98';
            ctx.fillRect(enemy.x + 15, enemy.y + 15, 30, 30);
            ctx.strokeStyle = '#4a235a';
            ctx.lineWidth = 3;
            ctx.strokeRect(enemy.x + 10, enemy.y + 10, 40, 40);
        } else if (enemy.type === 'SHOOTER') {
            ctx.fillStyle = '#ba4a00';
            ctx.fillRect(enemy.x + 5, enemy.y + 15, 10, 10);
            ctx.fillRect(enemy.x + 25, enemy.y + 15, 10, 10);
            ctx.fillStyle = '#935116';
            ctx.fillRect(enemy.x + 15, enemy.y + 25, 10, 10);
        } else if (enemy.type === 'BOSS') {
            // Draw boss with special details
            ctx.fillStyle = '#922b21';
            ctx.fillRect(enemy.x + 20, enemy.y + 20, 60, 60);
            
            // Draw boss eyes
            ctx.fillStyle = '#ff0000';
            ctx.fillRect(enemy.x + 30, enemy.y + 35, 15, 15);
            ctx.fillRect(enemy.x + 55, enemy.y + 35, 15, 15);
            
            // Draw boss mouth
            ctx.fillStyle = '#000000';
            ctx.fillRect(enemy.x + 35, enemy.y + 60, 30, 10);
            
            // Draw boss health indicator
            const healthPercent = enemy.health / enemy.maxHealth;
            ctx.fillStyle = '#2ecc71';
            ctx.fillRect(enemy.x + 10, enemy.y - 10, enemy.width * healthPercent, 5);
        }
    });
    
    obstacles.forEach(obstacle => {
        ctx.fillStyle = obstacle.color;
        ctx.fillRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
        
        if (obstacle.type === 'spike') {
            ctx.beginPath();
            ctx.moveTo(obstacle.x, obstacle.y + obstacle.height);
            ctx.lineTo(obstacle.x + obstacle.width / 2, obstacle.y);
            ctx.lineTo(obstacle.x + obstacle.width, obstacle.y + obstacle.height);
            ctx.closePath();
            ctx.fill();
        }
    });
    
    powerups.forEach(powerup => {
        ctx.fillStyle = powerup.color;
        ctx.beginPath();
        ctx.arc(powerup.x + powerup.width / 2, powerup.y + powerup.height / 2, powerup.width / 2, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = 'white';
        ctx.font = '14px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(powerup.type === 'health' ? '+' : 'A', powerup.x + powerup.width / 2, powerup.y + powerup.height / 2 + 5);
    });
    
    particles.forEach(particle => {
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.radius * particle.life, 0, Math.PI * 2);
        ctx.fillStyle = particle.color;
        ctx.globalAlpha = particle.life;
        ctx.fill();
        ctx.globalAlpha = 1;
    });
    
    // Draw damage numbers
    damageNumbers = damageNumbers.filter(dn => {
        dn.y += dn.vy;
        dn.life -= 0.02;
        
        if (dn.life > 0) {
            ctx.save();
            ctx.globalAlpha = dn.life;
            ctx.fillStyle = '#ffeb3b';
            ctx.font = 'bold 16px Arial';
            ctx.fillText('-' + dn.damage, dn.x, dn.y);
            ctx.restore();
            return true;
        }
        return false;
    });
    
    ctx.restore();  // End of shake translation
}

function gameLoop(currentTime) {
    if (!gameRunning) return;
    
    const deltaTime = currentTime - lastTime;
    lastTime = currentTime;
    
    update(deltaTime, currentTime);
    draw();
    
    requestAnimationFrame(gameLoop);
}

init();

// Initialize settings on load
loadSettings();

// Initialize daily rewards
loadDailyRewards();
loadPlayerGems();
loadShopData();
checkDailyRewardAvailability();

// Wave Announcement Functions
let waveAnnouncementTimeout = null;

function showWaveAnnouncement(waveText, isBossWave = false) {
    // Prevent multiple wave announcements from stacking
    if (waveAnnouncementTimeout) {
        clearTimeout(waveAnnouncementTimeout);
    }
    
    // Update wave text in announcement
    waveAnnouncementNumber.textContent = waveText;
    
    // Add special styling for boss waves
    const announcement = document.getElementById('waveAnnouncement');
    if (isBossWave) {
        announcement.classList.add('boss-wave');
    } else {
        announcement.classList.remove('boss-wave');
    }
    
    // Show the overlay
    waveAnnouncement.classList.remove('hidden');
    
    // Auto-hide after 2 seconds
    waveAnnouncementTimeout = setTimeout(() => {
        hideWaveAnnouncement();
    }, 2000);
}

function hideWaveAnnouncement() {
    waveAnnouncement.classList.add('hidden');
    waveAnnouncementTimeout = null;
}

// Initialize tutorial system
if (needsTutorial()) {
    document.getElementById('tutorialUI').classList.remove('hidden');
}

// Initialize splash screen
initSplashScreen();
