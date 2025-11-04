// Интеграция с VK API через VK Bridge (для iframe)
let gameInitialized = false;
let vkBridge = null;

// Функция инициализации VK Bridge
function initVK() {
    // Проверяем различные способы доступа к VK Bridge
    // ВКонтакте может предоставить его через разные способы
    if (typeof window.vkBridge !== 'undefined') {
        vkBridge = window.vkBridge;
    } else if (typeof window.VK !== 'undefined' && window.VK.Bridge) {
        vkBridge = window.VK.Bridge;
    } else if (typeof vkBridge !== 'undefined') {
        // Используем глобальный vkBridge если доступен
        vkBridge = window.vkBridge;
    } else {
        // Если VK Bridge еще не загружен, ждем немного и пробуем снова (максимум 10 раз)
        if (initVK.attempts === undefined) initVK.attempts = 0;
        if (initVK.attempts < 10) {
            initVK.attempts++;
            setTimeout(initVK, 200);
            return;
        }
        vkBridge = null;
    }
    
    if (vkBridge) {
        console.log('VK Bridge найден');
        gameInitialized = true;
        
        try {
            // Инициализация VK Bridge
            vkBridge.send('VKWebAppInit', {})
                .then(() => {
                    console.log('VK Web App инициализирован');
                    
                    // Получение информации о пользователе
                    vkBridge.send('VKWebAppGetUserInfo', {})
                        .then(data => {
                            if (data && data.first_name) {
                                console.log('Пользователь:', data.first_name, data.last_name);
                            }
                        })
                        .catch(error => {
                            console.log('Ошибка получения данных пользователя:', error);
                        });
                    
                    // Загрузка рекорда пользователя из VK
                    loadUserScore();
                })
                .catch(error => {
                    console.log('Ошибка инициализации VK Web App:', error);
                    gameInitialized = true;
                });
        } catch (error) {
            console.log('Ошибка при работе с VK Bridge:', error);
            gameInitialized = true;
        }
    } else {
        // Если VK Bridge недоступен (не в iframe ВКонтакте), игра всё равно работает
        console.log('VK Bridge недоступен, игра работает в автономном режиме');
        gameInitialized = true;
    }
}

// Запускаем инициализацию после загрузки DOM
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initVK);
} else {
    // DOM уже загружен
    initVK();
}

// Загрузка рекорда пользователя
function loadUserScore() {
    // Используем VK Storage API для сохранения рекордов
    if (vkBridge) {
        vkBridge.send('VKWebAppStorageGet', {
            keys: ['highScore']
        })
        .then(data => {
            if (data && data.keys && data.keys[0] && data.keys[0].value) {
                const vkHighScore = parseInt(data.keys[0].value);
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
        })
        .catch(error => {
            console.log('Ошибка загрузки рекорда:', error);
        });
    }
}

// Сохранение рекорда в VK
function saveScoreToVK(score) {
    if (vkBridge) {
        vkBridge.send('VKWebAppStorageSet', {
            key: 'highScore',
            value: score.toString()
        })
        .then(data => {
            console.log('Рекорд сохранён в VK');
        })
        .catch(error => {
            console.log('Ошибка сохранения рекорда:', error);
        });
    }
}

// Экспорт функций для использования в game.js
window.saveScoreToVK = saveScoreToVK;
window.gameInitialized = gameInitialized;

