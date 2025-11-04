// Интеграция с VK API
let gameInitialized = false;

// Инициализация VK API
VK.init({
    apiId: 54294322
}, function() {
    console.log('VK API инициализирован');
    gameInitialized = true;
    
    // Получение информации о пользователе
    VK.api('users.get', {
        fields: 'photo_100'
    }, function(response) {
        if (response && response[0]) {
            console.log('Пользователь:', response[0].first_name, response[0].last_name);
            // Можно добавить приветствие пользователя
        }
    });
    
    // Загрузка рекорда пользователя из VK
    loadUserScore();
}, function() {
    console.log('Ошибка инициализации VK API');
    // Игра будет работать и без VK API
    gameInitialized = true;
});

// Загрузка рекорда пользователя
function loadUserScore() {
    // Используем VK Storage API для сохранения рекордов
    if (window.VK && VK.callMethod) {
        VK.callMethod('getStorageValues', ['highScore'], function(data) {
            if (data && data.highScore) {
                const vkHighScore = parseInt(data.highScore);
                const localHighScore = parseInt(localStorage.getItem('highScore') || '0');
                
                // Используем максимальный рекорд
                if (vkHighScore > localHighScore) {
                    localStorage.setItem('highScore', vkHighScore.toString());
                    if (window.game && window.game.highScore !== undefined) {
                        window.game.highScore = vkHighScore;
                        window.game.updateUI();
                    }
                }
            }
        });
    }
}

// Сохранение рекорда в VK
function saveScoreToVK(score) {
    if (window.VK && VK.callMethod) {
        VK.callMethod('setStorageValues', {
            highScore: score.toString()
        }, function() {
            console.log('Рекорд сохранён в VK');
        });
    }
}

// Экспорт функций для использования в game.js
window.saveScoreToVK = saveScoreToVK;
window.gameInitialized = gameInitialized;

