// Интеграция с VK API (упрощенная версия для работы в iframe)
let gameInitialized = false;
let vkBridge = null;

// Функция инициализации VK API
function initVK() {
    // Игра работает независимо от VK API
    gameInitialized = true;
    console.log('Игра инициализирована');
    
    // Пытаемся использовать VK Bridge, если доступен (опционально)
    // ВКонтакте может предоставить его автоматически в iframe
    try {
        // Проверяем различные способы доступа к VK API
        if (window.vkBridge) {
            vkBridge = window.vkBridge;
            console.log('VK Bridge найден');
        } else if (window.parent !== window && window.parent.postMessage) {
            // В iframe, но VK Bridge не предоставлен напрямую
            // Создаем простую обертку
            vkBridge = {
                send: function(method, params) {
                    return new Promise((resolve, reject) => {
                        const requestId = Date.now().toString();
                        window.parent.postMessage({
                            handler: 'vk-connect',
                            type: method,
                            params: params || {},
                            request_id: requestId
                        }, '*');
                        
                        const listener = (event) => {
                            if (event.data && event.data.request_id === requestId) {
                                window.removeEventListener('message', listener);
                                if (event.data.error) {
                                    reject(event.data.error);
                                } else {
                                    resolve(event.data.response || event.data);
                                }
                            }
                        };
                        
                        window.addEventListener('message', listener);
                        setTimeout(() => {
                            window.removeEventListener('message', listener);
                            reject(new Error('Timeout'));
                        }, 3000);
                    });
                }
            };
            console.log('VK Bridge создан для iframe');
        } else {
            console.log('Игра работает в автономном режиме (без VK API)');
        }
    } catch (error) {
        console.log('Ошибка при инициализации VK API:', error);
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

