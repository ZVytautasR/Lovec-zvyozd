// Игровая логика
class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.canvas.width = 800;
        this.canvas.height = 600;
        
        this.player = {
            x: this.canvas.width / 2,
            y: this.canvas.height - 50,
            width: 60,
            height: 20,
            speed: 5,
            color: '#4CAF50'
        };
        
        this.stars = [];
        this.bombs = [];
        this.score = 0;
        this.lives = 3;
        this.highScore = parseInt(localStorage.getItem('highScore') || '0');
        this.gameRunning = false;
        this.gamePaused = false;
        this.lastStarTime = 0;
        this.lastBombTime = 0;
        this.starInterval = 1500;
        this.bombInterval = 3000;
        
        this.init();
    }
    
    init() {
        this.updateUI();
        this.setupEventListeners();
        this.canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        this.canvas.addEventListener('touchmove', (e) => this.handleTouchMove(e));
    }
    
    setupEventListeners() {
        document.getElementById('startBtn').addEventListener('click', () => this.start());
        document.getElementById('pauseBtn').addEventListener('click', () => this.togglePause());
        document.getElementById('restartBtn').addEventListener('click', () => this.restart());
    }
    
    handleMouseMove(e) {
        if (!this.gameRunning || this.gamePaused) return;
        const rect = this.canvas.getBoundingClientRect();
        this.player.x = e.clientX - rect.left - this.player.width / 2;
        this.player.x = Math.max(0, Math.min(this.player.x, this.canvas.width - this.player.width));
    }
    
    handleTouchMove(e) {
        if (!this.gameRunning || this.gamePaused) return;
        e.preventDefault();
        const rect = this.canvas.getBoundingClientRect();
        const touch = e.touches[0];
        this.player.x = touch.clientX - rect.left - this.player.width / 2;
        this.player.x = Math.max(0, Math.min(this.player.x, this.canvas.width - this.player.width));
    }
    
    start() {
        this.reset();
        this.gameRunning = true;
        this.gamePaused = false;
        document.getElementById('startBtn').disabled = true;
        document.getElementById('pauseBtn').disabled = false;
        document.getElementById('game-over').classList.add('hidden');
        this.gameLoop();
    }
    
    restart() {
        this.start();
    }
    
    togglePause() {
        if (!this.gameRunning) return;
        this.gamePaused = !this.gamePaused;
        if (!this.gamePaused) {
            this.gameLoop();
        }
    }
    
    reset() {
        this.stars = [];
        this.bombs = [];
        this.score = 0;
        this.lives = 3;
        this.player.x = this.canvas.width / 2;
        this.lastStarTime = Date.now();
        this.lastBombTime = Date.now();
        this.updateUI();
    }
    
    spawnStar() {
        const now = Date.now();
        if (now - this.lastStarTime > this.starInterval) {
            this.stars.push({
                x: Math.random() * (this.canvas.width - 30),
                y: -30,
                width: 30,
                height: 30,
                speed: 2 + Math.random() * 3,
                color: '#FFD700'
            });
            this.lastStarTime = now;
            this.starInterval = Math.max(800, 1500 - this.score * 10);
        }
    }
    
    spawnBomb() {
        const now = Date.now();
        if (now - this.lastBombTime > this.bombInterval) {
            this.bombs.push({
                x: Math.random() * (this.canvas.width - 30),
                y: -30,
                width: 30,
                height: 30,
                speed: 2 + Math.random() * 2,
                color: '#FF4444'
            });
            this.lastBombTime = now;
        }
    }
    
    update() {
        if (!this.gameRunning || this.gamePaused) return;
        
        this.spawnStar();
        this.spawnBomb();
        
        // Обновление звёзд
        for (let i = this.stars.length - 1; i >= 0; i--) {
            const star = this.stars[i];
            star.y += star.speed;
            
            // Проверка столкновения с игроком
            if (this.checkCollision(this.player, star)) {
                this.score += 10;
                this.stars.splice(i, 1);
                this.updateUI();
                continue;
            }
            
            // Удаление звёзд за экраном
            if (star.y > this.canvas.height) {
                this.stars.splice(i, 1);
            }
        }
        
        // Обновление бомб
        for (let i = this.bombs.length - 1; i >= 0; i--) {
            const bomb = this.bombs[i];
            bomb.y += bomb.speed;
            
            // Проверка столкновения с игроком
            if (this.checkCollision(this.player, bomb)) {
                this.lives--;
                this.bombs.splice(i, 1);
                this.updateUI();
                
                if (this.lives <= 0) {
                    this.gameOver();
                }
                continue;
            }
            
            // Удаление бомб за экраном
            if (bomb.y > this.canvas.height) {
                this.bombs.splice(i, 1);
            }
        }
    }
    
    checkCollision(rect1, rect2) {
        return rect1.x < rect2.x + rect2.width &&
               rect1.x + rect1.width > rect2.x &&
               rect1.y < rect2.y + rect2.height &&
               rect1.y + rect1.height > rect2.y;
    }
    
    draw() {
        // Очистка canvas
        this.ctx.fillStyle = '#1a1a2e';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Рисование игрока
        this.ctx.fillStyle = this.player.color;
        this.ctx.fillRect(this.player.x, this.player.y, this.player.width, this.player.height);
        
        // Рисование звёзд
        this.stars.forEach(star => {
            this.ctx.fillStyle = star.color;
            this.ctx.beginPath();
            this.drawStar(this.ctx, star.x + star.width / 2, star.y + star.height / 2, 5, 15, 7);
            this.ctx.fill();
        });
        
        // Рисование бомб
        this.bombs.forEach(bomb => {
            this.ctx.fillStyle = bomb.color;
            this.ctx.beginPath();
            this.ctx.arc(bomb.x + bomb.width / 2, bomb.y + bomb.height / 2, bomb.width / 2, 0, Math.PI * 2);
            this.ctx.fill();
            // Взрывающийся эффект
            this.ctx.fillStyle = '#FF8888';
            this.ctx.beginPath();
            this.ctx.arc(bomb.x + bomb.width / 2, bomb.y + bomb.height / 2, bomb.width / 3, 0, Math.PI * 2);
            this.ctx.fill();
        });
        
        // Отображение паузы
        if (this.gamePaused) {
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            this.ctx.fillStyle = '#FFFFFF';
            this.ctx.font = '48px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('ПАУЗА', this.canvas.width / 2, this.canvas.height / 2);
        }
    }
    
    drawStar(ctx, cx, cy, spikes, outerRadius, innerRadius) {
        let rot = Math.PI / 2 * 3;
        let x = cx;
        let y = cy;
        const step = Math.PI / spikes;
        
        ctx.moveTo(cx, cy - outerRadius);
        for (let i = 0; i < spikes; i++) {
            x = cx + Math.cos(rot) * outerRadius;
            y = cy + Math.sin(rot) * outerRadius;
            ctx.lineTo(x, y);
            rot += step;
            
            x = cx + Math.cos(rot) * innerRadius;
            y = cy + Math.sin(rot) * innerRadius;
            ctx.lineTo(x, y);
            rot += step;
        }
        ctx.lineTo(cx, cy - outerRadius);
        ctx.closePath();
    }
    
    gameOver() {
        this.gameRunning = false;
        document.getElementById('startBtn').disabled = false;
        document.getElementById('pauseBtn').disabled = true;
        
        if (this.score > this.highScore) {
            this.highScore = this.score;
            localStorage.setItem('highScore', this.highScore.toString());
            // Отправка рекорда в VK (если API инициализирован)
            if (window.VK && window.gameInitialized) {
                this.saveScoreToVK(this.score);
            }
        }
        
        document.getElementById('final-score').textContent = this.score;
        document.getElementById('game-over').classList.remove('hidden');
        this.updateUI();
    }
    
    saveScoreToVK(score) {
        // Сохранение рекорда через VK API
        if (window.saveScoreToVK) {
            window.saveScoreToVK(score);
        }
    }
    
    updateUI() {
        document.getElementById('score').textContent = this.score;
        document.getElementById('high-score').textContent = this.highScore;
        document.getElementById('lives').textContent = this.lives;
    }
    
    gameLoop() {
        if (!this.gameRunning || this.gamePaused) return;
        
        this.update();
        this.draw();
        
        requestAnimationFrame(() => this.gameLoop());
    }
}

// Инициализация игры при загрузке страницы
let game;
window.addEventListener('DOMContentLoaded', () => {
    game = new Game();
    window.game = game; // Делаем игру доступной глобально для VK API
});

