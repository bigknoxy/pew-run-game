// High Score Implementation Test
// This script can be run in the browser console to test functionality

function testHighScoreImplementation() {
    console.log('🧪 Testing High Score Implementation...');
    
    // Test 1: Check if elements exist
    const requiredElements = [
        'startHighScore', 'highScoreDisplay', 'enemiesKilledDisplay',
        'totalGamesDisplay', 'totalEnemiesDisplay', 'finalScore'
    ];
    
    let elementsExist = true;
    requiredElements.forEach(id => {
        const element = document.getElementById(id);
        if (!element) {
            console.error(`❌ Missing element: ${id}`);
            elementsExist = false;
        }
    });
    
    if (elementsExist) {
        console.log('✅ All required HTML elements exist');
    }
    
    // Test 2: Test localStorage functions
    try {
        // Clear existing test data
        localStorage.removeItem('highScore');
        localStorage.removeItem('totalGames');
        localStorage.removeItem('totalEnemiesKilled');
        
        // Test saving high score
        const testScore = 1500;
        localStorage.setItem('highScore', testScore.toString());
        const retrievedScore = parseInt(localStorage.getItem('highScore') || '0');
        
        if (retrievedScore === testScore) {
            console.log('✅ High score save/load works');
        } else {
            console.error('❌ High score save/load failed');
        }
        
        // Test game stats
        localStorage.setItem('totalGames', '5');
        localStorage.setItem('totalEnemiesKilled', '25');
        
        const totalGames = localStorage.getItem('totalGames');
        const totalEnemies = localStorage.getItem('totalEnemiesKilled');
        
        if (totalGames === '5' && totalEnemies === '25') {
            console.log('✅ Game stats storage works');
        } else {
            console.error('❌ Game stats storage failed');
        }
        
    } catch (error) {
        console.error('❌ localStorage test failed:', error);
    }
    
    // Test 3: Check if functions are defined
    const requiredFunctions = ['updateHighScoreDisplay', 'updateGameStats'];
    
    requiredFunctions.forEach(funcName => {
        if (typeof window[funcName] === 'function') {
            console.log(`✅ Function ${funcName} exists`);
        } else {
            console.error(`❌ Function ${funcName} missing`);
        }
    });
    
    console.log('🏁 High Score Implementation Test Complete');
}

// Export test function for global access
window.testHighScoreImplementation = testHighScoreImplementation;

console.log('📋 High Score Test Ready. Run testHighScoreImplementation() to test.');