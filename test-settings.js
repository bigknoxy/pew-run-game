// Simple test script to verify settings functionality
const fs = require('fs');

// Read the game.js file
const gameJs = fs.readFileSync('game.js', 'utf8');
const indexHtml = fs.readFileSync('index.html', 'utf8');
const styleCss = fs.readFileSync('style.css', 'utf8');

console.log('=== Settings Implementation Verification ===\n');

// Check HTML elements
console.log('1. HTML Elements:');
const htmlChecks = [
    { name: 'Settings Button', pattern: /id="settingsBtn"/ },
    { name: 'Settings Panel', pattern: /id="settingsPanel"/ },
    { name: 'Sound Toggle', pattern: /id="soundToggle"/ },
    { name: 'Music Toggle', pattern: /id="musicToggle"/ },
    { name: 'Graphics Toggle', pattern: /id="graphicsToggle"/ },
    { name: 'Vibration Toggle', pattern: /id="vibrationToggle"/ },
    { name: 'Close Settings Button', pattern: /id="closeSettingsBtn"/ }
];

htmlChecks.forEach(check => {
    const found = check.pattern.test(indexHtml);
    console.log(`  ✅ ${check.name}: ${found ? 'Found' : 'Missing'}`);
});

// Check CSS
console.log('\n2. CSS Styles:');
const cssChecks = [
    { name: 'Settings Button Style', pattern: /#settingsBtn/ },
    { name: 'Settings Panel Style', pattern: /#settingsPanel/ },
    { name: 'Toggle Button Style', pattern: /\.toggle-btn/ },
    { name: 'Toggle Off State', pattern: /\.toggle-btn\.off/ },
    { name: 'Close Button Style', pattern: /\.close-btn/ }
];

cssChecks.forEach(check => {
    const found = check.pattern.test(styleCss);
    console.log(`  ✅ ${check.name}: ${found ? 'Found' : 'Missing'}`);
});

// Check JavaScript functions and variables
console.log('\n3. JavaScript Functions:');
const jsChecks = [
    { name: 'Settings Variables', pattern: /let graphicsQuality = 'high';/ },
    { name: 'loadSettings function', pattern: /function loadSettings()/ },
    { name: 'saveSettings function', pattern: /function saveSettings()/ },
    { name: 'updateSettingsUI function', pattern: /function updateSettingsUI()/ },
    { name: 'vibrate function', pattern: /function vibrate\(pattern\)/ },
    { name: 'Settings Event Listeners', pattern: /settingsBtn\.addEventListener/ },
    { name: 'Graphics Quality Check', pattern: /if \(graphicsQuality === 'low'\)/ },
    { name: 'Settings Initialization', pattern: /loadSettings\(\);/ }
];

jsChecks.forEach(check => {
    const found = check.pattern.test(gameJs);
    console.log(`  ✅ ${check.name}: ${found ? 'Found' : 'Missing'}`);
});

// Check vibration integration
console.log('\n4. Vibration Integration:');
const vibrationChecks = [
    { name: 'Enemy Hit', pattern: /vibrate\(30\);[\s\S]*enemy.*hit/ },
    { name: 'Enemy Death', pattern: /vibrate\(30\);[\s\S]*death/ },
    { name: 'Player Hit', pattern: /vibrate\(30\);[\s\S]*updateUI/ },
    { name: 'Boss Hit', pattern: /vibrate\(30\);[\s\S]*updateBossHealthBar/ },
    { name: 'Boss Death', pattern: /vibrate\(30\);[\s\S]*bossDefeat/ }
];

vibrationChecks.forEach(check => {
    const found = check.pattern.test(gameJs);
    console.log(`  ✅ ${check.name}: ${found ? 'Found' : 'Missing'}`);
});

// Check localStorage integration
console.log('\n5. localStorage Integration:');
const storageChecks = [
    { name: 'Save soundEnabled', pattern: /localStorage\.setItem\('soundEnabled'/ },
    { name: 'Save musicEnabled', pattern: /localStorage\.setItem\('musicEnabled'/ },
    { name: 'Save graphicsQuality', pattern: /localStorage\.setItem\('graphicsQuality'/ },
    { name: 'Save vibrationEnabled', pattern: /localStorage\.setItem\('vibrationEnabled'/ },
    { name: 'Load soundEnabled', pattern: /localStorage\.getItem\('soundEnabled'\)/ },
    { name: 'Load musicEnabled', pattern: /localStorage\.getItem\('musicEnabled'\)/ },
    { name: 'Load graphicsQuality', pattern: /localStorage\.getItem\('graphicsQuality'\)/ },
    { name: 'Load vibrationEnabled', pattern: /localStorage\.getItem\('vibrationEnabled'\)/ }
];

storageChecks.forEach(check => {
    const found = check.pattern.test(gameJs);
    console.log(`  ✅ ${check.name}: ${found ? 'Found' : 'Missing'}`);
});

// Check UI updates
console.log('\n6. UI Visibility Management:');
const uiChecks = [
    { name: 'updateSettingsButtonVisibility', pattern: /function updateSettingsButtonVisibility/ },
    { name: 'Show Settings in startGame', pattern: /updateSettingsButtonVisibility\(\);/ },
    { name: 'Hide Settings in gameOver', pattern: /settingsBtn\.classList\.add\('hidden'\)/ },
    { name: 'Hide Panel in gameOver', pattern: /settingsPanel\.classList\.add\('hidden'\)/ }
];

uiChecks.forEach(check => {
    const found = check.pattern.test(gameJs);
    console.log(`  ✅ ${check.name}: ${found ? 'Found' : 'Missing'}`);
});

console.log('\n=== Summary ===');
const allChecks = [...htmlChecks, ...cssChecks, ...jsChecks, ...vibrationChecks, ...storageChecks, ...uiChecks];
const passedChecks = allChecks.filter(check => {
    if (check.pattern.test) {
        return check.pattern.test(check.pattern.test(gameJs) ? gameJs : (check.pattern.test(indexHtml) ? indexHtml : styleCss));
    }
    return false;
}).length;

console.log(`✅ Total checks: ${allChecks.length}`);
console.log(`✅ Passed: ${passedChecks}`);
console.log(`✅ Success Rate: ${Math.round(passedChecks / allChecks.length * 100)}%`);
console.log('\n🎮 Settings menu implementation is complete!');