// 游戏变量
let posX = 0;
let posY = 0;
let gameRunning = false;
let isPaused = false;
let selectedCharacters = [];
let enemies = [];
let gameTimer = null;
let timeLeft = 60;
const speed = 5;
let remainingEnemies = 50;  // 默认值
let selectedEnemyCount = 50;  // 默认难度
let defeatedEnemies = 0;  // 记录击败的怪物数量
const maxScale = 20.0;  // 最大缩放倍数
const scaleIncrement = 0.04;  // 初始增长率4%
const reducedScaleIncrement = 0.02;  // 超过3倍后的增长率2%
const scaleThreshold = 3.0;  // 增长率改变的阈值
let currentScale = 1.0;  // 当前缩放值
let bgOffsetX = 0;
let bgOffsetY = 0;
const bgSpeed = 2; // 背景移动速度
const scaleTransitionDuration = 200; // 缩放动画持续时间（毫秒）
let isScaling = false; // 是否正在缩放
const BASE_WINDOW_WIDTH = 1920;  // 基准窗口宽度
const BASE_WINDOW_HEIGHT = 1080; // 基准窗口高度
let windowScale = 1.0;  // 窗口缩放比例

// DOM 元素
const player1 = document.getElementById('gameObject');
const startButton = document.getElementById('startButton');
const restartButton = document.getElementById('restartButton');
const surrenderButton = document.getElementById('surrenderButton');
const gameOverDisplay = document.getElementById('gameOver');
const gameWinDisplay = document.getElementById('gameWin');
const pauseMessage = document.getElementById('pauseMessage');
const characterSelection = document.querySelector('.characters');
const bgMusic = document.getElementById('bgMusic');
const clickSound = document.getElementById('clickSound');
const loseSound = document.getElementById('loseSound');
const gameoverSound = document.getElementById('gameoverSound');
const volumeControl = document.getElementById('volume');
const volumeLabel = document.querySelector('#volume-control label');
const characterSounds = {
    qilin: document.getElementById('qilinSound'),
    fenghuang: document.getElementById('fenghuangSound'),
    baihu: document.getElementById('baihuSound'),
    xuanwu: document.getElementById('xuanwuSound'),
    jiuweihu: document.getElementById('jiuweihuSound')
};

// 键盘控制
const keys = {
    ArrowLeft: false,
    ArrowRight: false,
    ArrowUp: false,
    ArrowDown: false,
    KeyW: false,
    KeyA: false,
    KeyS: false,
    KeyD: false
};

// 初始化音频状态
bgMusic.volume = 0;
clickSound.volume = 0.5;  // 设置点击音效音量
loseSound.volume = 0.5;  // 设置失败音效音量
gameoverSound.volume = 0.5;  // 设置游戏结束音效音量
// 设置所有角色音效的音量
Object.values(characterSounds).forEach(sound => {
    sound.volume = 0.5;
});

// 添加用户交互监听
let hasInteracted = false;
document.addEventListener('click', () => {
    if (!hasInteracted) {
        hasInteracted = true;
        // 初始化音频（静音状态）
        bgMusic.play().then(() => {
            bgMusic.pause();
        }).catch(error => {
            console.log("Background music initialization failed:", error);
        });
    }
}, { once: true });

// 播放点击音效函数
function playClickSound() {
    if (hasInteracted) {
        clickSound.currentTime = 0;  // 重置音效，以便连续播放
        clickSound.play().catch(error => {
            console.log("Click sound play failed:", error);
        });
    }
}

// 角色选择
document.querySelectorAll('.character').forEach(character => {
    character.addEventListener('click', () => {
        if (gameRunning) return;
        
        // 播放点击音效
        playClickSound();
        
        // 移除所有已选择的状态
        document.querySelectorAll('.character').forEach(c => {
            c.classList.remove('selected-first');
        });
        
        // 设置新选择的角色
        character.classList.add('selected-first');
        selectedCharacters = [character];
        
        // 激活开始按钮
        document.querySelector('#startButton').classList.add('active');
    });
});

// 游戏边界检测
function getGameBounds() {
    return {
        maxX: window.innerWidth - player1.offsetWidth,
        maxY: window.innerHeight - player1.offsetHeight
    };
}

// 碰撞检测
function checkCollision(rect1, rect2) {
    return !(rect1.right < rect2.left || 
            rect1.left > rect2.right || 
            rect1.bottom < rect2.top || 
            rect1.top > rect2.bottom);
}

// 添加计算窗口缩放比例的函数
function calculateWindowScale() {
    const widthScale = window.innerWidth / BASE_WINDOW_WIDTH;
    const heightScale = window.innerHeight / BASE_WINDOW_HEIGHT;
    // 使用较小的缩放比例以确保游戏内容完全可见
    windowScale = Math.min(widthScale, heightScale);
    return windowScale;
}

// 更新玩家位置
function updatePlayerPositions() {
    if (!gameRunning || isPaused) return;

    const bounds = getGameBounds();
    const gameArea = document.getElementById('gameArea');
    
    let isMovingLeft = false;
    let isMovingRight = false;
    let isMovingUp = false;
    let isMovingDown = false;

    // 更新背景偏移量
    if (keys.ArrowLeft || keys.KeyA) {
        posX = Math.max(0, posX - speed * windowScale);
        player1.style.transform = `scaleX(1) scale(${currentScale * windowScale})`;
        isMovingLeft = true;
        bgOffsetX = (bgOffsetX + bgSpeed) % 100;
    }
    if (keys.ArrowRight || keys.KeyD) {
        posX = Math.min(bounds.maxX, posX + speed * windowScale);
        player1.style.transform = `scaleX(-1) scale(${currentScale * windowScale})`;
        isMovingRight = true;
        bgOffsetX = (bgOffsetX - bgSpeed) % 100;
    }
    if (keys.ArrowUp || keys.KeyW) {
        posY = Math.max(0, posY - speed * windowScale);
        isMovingUp = true;
        bgOffsetY = (bgOffsetY + bgSpeed) % 100;
        if (!isMovingLeft && !isMovingRight) {
            player1.style.transform = `scale(${currentScale * windowScale})`;
        }
    }
    if (keys.ArrowDown || keys.KeyS) {
        posY = Math.min(bounds.maxY, posY + speed);
        isMovingDown = true;
        bgOffsetY = (bgOffsetY - bgSpeed) % 100;
        if (!isMovingLeft && !isMovingRight) {
            player1.style.transform = `scale(${currentScale})`;
        }
    }

    // 更新背景位置
    gameArea.style.backgroundPosition = `${bgOffsetX}px ${bgOffsetY}px`;

    // 移除旧的移动类
    gameArea.classList.remove('moving-left', 'moving-right', 'moving-up', 'moving-down');
    
    // 添加移动状态类
    if (isMovingLeft || isMovingRight || isMovingUp || isMovingDown) {
        gameArea.classList.add('moving');
        
        if (isMovingLeft) gameArea.classList.add('moving-left');
        if (isMovingRight) gameArea.classList.add('moving-right');
        if (isMovingUp) gameArea.classList.add('moving-up');
        if (isMovingDown) gameArea.classList.add('moving-down');
    } else {
        gameArea.classList.remove('moving');
    }

    player1.style.left = posX + 'px';
    player1.style.top = posY + 'px';

    requestAnimationFrame(updatePlayerPositions);
}

// 生成敌人
function spawnEnemies() {
    const gameArea = document.getElementById('gameArea');
    const bounds = getGameBounds();
    
    enemies.forEach(enemy => enemy.remove());
    enemies = [];

    const characters = ['qilin', 'fenghuang', 'baihu', 'xuanwu', 'jiuweihu'];
    
    for (let i = 0; i < selectedEnemyCount; i++) {
        const randomCharacter = characters[Math.floor(Math.random() * characters.length)];
        const enemy = document.createElement('div');
        enemy.className = 'enemy';
        enemy.style.backgroundImage = `url('images/${randomCharacter}.png')`;
        
        let x, y;
        const side = Math.floor(Math.random() * 4);
        
        switch(side) {
            case 0: // 上边
                x = Math.random() * bounds.maxX;
                y = -60;
                break;
            case 1: // 右边
                x = bounds.maxX + 60;
                y = Math.random() * bounds.maxY;
                enemy.style.transform = 'scaleX(-1)'; // 向左移动时的初始方向
                break;
            case 2: // 下边
                x = Math.random() * bounds.maxX;
                y = bounds.maxY + 60;
                break;
            case 3: // 左边
                x = -60;
                y = Math.random() * bounds.maxY;
                enemy.style.transform = 'scaleX(1)'; // 向右移动时的初始方向
                break;
        }
        
        enemy.style.left = x + 'px';
        enemy.style.top = y + 'px';
        
        // 根据生成位置设置初始移动方向
        if (side === 1) { // 从右边生成
            enemy.dx = -2.5;
        } else if (side === 3) { // 从左边生成
            enemy.dx = 2.5;
        } else {
            enemy.dx = (Math.random() - 0.5) * 2 * 2.5;
        }
        enemy.dy = (Math.random() - 0.5) * 2 * 2.5;
        enemy.nextDirectionChange = Date.now() + Math.random() * 2000 + 1000;
        
        gameArea.appendChild(enemy);
        enemies.push(enemy);
        moveEnemy(enemy);
    }
}

// 敌人移动
function moveEnemy(enemy) {
    if (!gameRunning || isPaused) return;

    const bounds = getGameBounds();
    const enemyRect = enemy.getBoundingClientRect();
    const playerRect = player1.getBoundingClientRect();

    if (checkCollision(playerRect, enemyRect)) {
        // 获取敌人的类型并播放对应音效
        const enemyType = enemy.style.backgroundImage.match(/images\/(\w+)\.png/)[1];
        const sound = characterSounds[enemyType];
        if (sound) {
            sound.volume = volumeControl.value / 100;
            sound.currentTime = 0;
            sound.play().catch(error => {
                console.log(`${enemyType} sound play failed:`, error);
            });
        }

        enemy.remove();
        enemies = enemies.filter(e => e !== enemy);
        remainingEnemies--;
        defeatedEnemies++; // 增加击败怪物计数
        updateMonsterCount();
        
        // 优化缩放逻辑
        if (!isScaling) {
            isScaling = true;
            const oldScale = currentScale;
            const increment = currentScale > scaleThreshold ? reducedScaleIncrement : scaleIncrement;
            const newScale = Math.min(currentScale * (1 + increment), maxScale);
            
            // 保存当前位置
            const currentLeft = parseFloat(player1.style.left);
            const currentTop = parseFloat(player1.style.top);
            
            // 设置变换原点为角色中心
            player1.style.transformOrigin = 'center center';
            player1.style.transition = `transform ${scaleTransitionDuration}ms ease-out`;
            
            // 应用新的缩放
            currentScale = newScale;
            player1.style.transform = `scale(${currentScale})`;
            
            // 缩放动画结束后重置状态
            setTimeout(() => {
                player1.style.transition = 'none';
                isScaling = false;
            }, scaleTransitionDuration);
        }
        
        // 修改胜利条件判断
        if (remainingEnemies <= 0 && defeatedEnemies >= selectedEnemyCount) {
            gameWin();
            return;
        }
    }

    const dx = (enemyRect.left - playerRect.left);
    const dy = (enemyRect.top - playerRect.top);
    const dist = Math.sqrt(dx * dx + dy * dy);
    
    const fleeDistance = 200 * windowScale;
    if (dist < fleeDistance) {
        enemy.dx = (dx / dist) * 2.5 * windowScale;
        enemy.dy = (dy / dist) * 2.5 * windowScale;
        
        // 根据逃跑方向设置图片方向和缩放
        if (enemy.dx > 0) {
            enemy.style.transform = `scaleX(-1) scale(${windowScale})`;
        } else {
            enemy.style.transform = `scaleX(1) scale(${windowScale})`;
        }
    } else {
        if (Date.now() > enemy.nextDirectionChange) {
            enemy.dx = (Math.random() - 0.5) * 2 * 2.5 * windowScale;
            enemy.dy = (Math.random() - 0.5) * 2 * 2.5 * windowScale;
            enemy.nextDirectionChange = Date.now() + Math.random() * 2000 + 1000;
            
            // 根据随机移动方向设置图片方向和缩放
            if (enemy.dx > 0) {
                enemy.style.transform = `scaleX(-1) scale(${windowScale})`;
            } else {
                enemy.style.transform = `scaleX(1) scale(${windowScale})`;
            }
        }
    }

    let newX = parseFloat(enemy.style.left) + enemy.dx;
    let newY = parseFloat(enemy.style.top) + enemy.dy;

    // 边界碰撞时反转方向和图片
    if (newX <= 0 || newX >= bounds.maxX) {
        enemy.dx *= -1;
        newX = Math.max(0, Math.min(bounds.maxX, newX));
        // 反转图片方向
        enemy.style.transform = enemy.dx > 0 ? 'scaleX(-1)' : 'scaleX(1)';
    }
    if (newY <= 0 || newY >= bounds.maxY) {
        enemy.dy *= -1;
        newY = Math.max(0, Math.min(bounds.maxY, newY));
    }

    enemy.style.left = newX + 'px';
    enemy.style.top = newY + 'px';

    if (gameRunning) {
        requestAnimationFrame(() => moveEnemy(enemy));
    }
}

// 更新计时器显示
function updateTimer() {
    document.getElementById('timer').textContent = `倒计时：${timeLeft}`;
}

// 更新怪物计数显示
function updateMonsterCount() {
    const total = selectedEnemyCount;
    const killed = defeatedEnemies; // 使用 defeatedEnemies 而不是计算差值
    let difficulty = '';
    if (total === 50) difficulty = '简单难度';
    else if (total === 80) difficulty = '中等难度';
    else if (total === 150) difficulty = '困难难度';
    document.getElementById('monster-count').textContent = `${difficulty} ${killed}/${total}`;
}

// 游戏开始
function startGame() {
    if (selectedCharacters.length === 0) {
        alert('请先选择一个角色！');
        return;
    }

    if (gameRunning) {
        resetGame();
        return;
    }

    // 设置选中角色的图片
    const imgSrc = selectedCharacters[0].querySelector('img').src;
    player1.style.backgroundImage = `url('${imgSrc}')`;

    characterSelection.style.display = 'none';
    gameRunning = true;
    remainingEnemies = selectedEnemyCount;
    defeatedEnemies = 0; // 重置击败怪物计数
    timeLeft = 60;
    document.getElementById('game-stats').style.display = 'flex';
    updateTimer();
    updateMonsterCount();

    gameOverDisplay.style.display = 'none';
    gameWinDisplay.style.display = 'none';
    restartButton.style.display = 'block';
    surrenderButton.style.display = 'block';
    pauseMessage.style.display = 'none';
    
    // 更新窗口缩放比例
    calculateWindowScale();
    
    // 重置角色大小和变换属性
    defeatedEnemies = 0;
    currentScale = 1.0;
    isScaling = false;
    player1.style.transformOrigin = 'center center';
    player1.style.transition = 'none';
    player1.style.transform = `scale(${windowScale})`;
    
    posX = window.innerWidth / 2 - player1.offsetWidth / 2;
    posY = window.innerHeight * 0.3;
    player1.style.left = posX + 'px';
    player1.style.top = posY + 'px';

    if (gameTimer) {
        clearInterval(gameTimer);
        gameTimer = null;
    }

    spawnEnemies();
    requestAnimationFrame(updatePlayerPositions);
    
    gameTimer = setInterval(() => {
        timeLeft--;
        updateTimer();
        if (timeLeft <= 0) {
            gameLose();
        }
    }, 1000);

    // 播放背景音乐
    if (bgMusic.volume > 0 && gameRunning) {
        bgMusic.play().catch(error => {
            console.log("Background music play failed:", error);
        });
    }
}

// 游戏结束
function gameLose() {
    resetGame();
    // 设置结束界面的角色图片
    const resultCharacter = gameOverDisplay.querySelector('.result-character');
    resultCharacter.style.backgroundImage = player1.style.backgroundImage;
    gameOverDisplay.style.display = 'block';
    // 确保角色选择界面隐藏
    characterSelection.style.display = 'none';
    
    // 停止背景音乐
    if (bgMusic.volume > 0) {
        bgMusic.pause();
    }
    
    // 播放游戏结束音效
    gameoverSound.volume = volumeControl.value / 100;
    gameoverSound.currentTime = 0;
    gameoverSound.play().catch(error => {
        console.log("Game over sound play failed:", error);
    });
}

// 游戏胜利
function gameWin() {
    resetGame();
    // 设置结束界面的角色图片
    const resultCharacter = gameWinDisplay.querySelector('.result-character');
    resultCharacter.style.backgroundImage = player1.style.backgroundImage;
    gameWinDisplay.style.display = 'block';
    // 确保角色选择界面隐藏
    characterSelection.style.display = 'none';
    
    // 停止背景音乐
    if (bgMusic.volume > 0) {
        bgMusic.pause();
    }
    
    // 播放胜利音效
    loseSound.volume = volumeControl.value / 100;
    loseSound.currentTime = 0;
    loseSound.play().catch(error => {
        console.log("Win sound play failed:", error);
    });
}

// 重置游戏
function resetGame() {
    enemies.forEach(enemy => enemy.remove());
    enemies = [];
    
    if (gameTimer) {
        clearInterval(gameTimer);
        gameTimer = null;
    }
    
    timeLeft = 60;
    updateTimer();
    gameRunning = false;
    isPaused = false;
    
    document.getElementById('game-stats').style.display = 'none';
    startButton.classList.remove('active');
    restartButton.style.display = 'none';
    surrenderButton.style.display = 'none';
    pauseMessage.style.display = 'none';
    selectedCharacters = [];
    
    const gameArea = document.getElementById('gameArea');
    gameArea.classList.remove('moving-left', 'moving-right', 'moving-up', 'moving-down');

    // 保持当前音乐状态
    if (bgMusic.volume > 0 && gameRunning) {
        bgMusic.play().catch(error => {
            console.log("Background music play failed:", error);
        });
    }

    // 重置角色大小和变换属性
    defeatedEnemies = 0;
    currentScale = 1.0;
    isScaling = false;
    if (player1) {
        player1.style.transformOrigin = 'center center';
        player1.style.transition = 'none';
        player1.style.transform = 'scale(1)';
    }

    // 重置背景位置
    bgOffsetX = 0;
    bgOffsetY = 0;
    gameArea.style.backgroundPosition = '0 0';
    gameArea.classList.remove('moving', 'moving-left', 'moving-right', 'moving-up', 'moving-down');
}

// 键盘事件监听
document.addEventListener('keydown', (event) => {
    if (keys.hasOwnProperty(event.code)) {
        keys[event.code] = true;
    }
    
    if (event.code === 'Escape' && gameRunning) {
        isPaused = !isPaused;
        if (isPaused) {
            clearInterval(gameTimer);
            pauseMessage.style.display = 'block';
            if (bgMusic.volume > 0) {
                bgMusic.pause();
            }
        } else {
            gameTimer = setInterval(() => {
                timeLeft--;
                updateTimer();
                if (timeLeft <= 0) {
                    gameLose();
                }
            }, 1000);
            pauseMessage.style.display = 'none';
            if (bgMusic.volume > 0) {
                bgMusic.play().catch(error => {
                    console.log("Background music play failed:", error);
                });
            }
        }
    }
});

document.addEventListener('keyup', (event) => {
    if (keys.hasOwnProperty(event.code)) {
        keys[event.code] = false;
    }
});

startButton.addEventListener('click', () => {
    if (selectedCharacters.length === 0) {
        alert('请先选择一个角色！');
        return;
    }
    playClickSound();
    startGame();
});

restartButton.addEventListener('click', () => {
    playClickSound();
    resetGame();
    characterSelection.style.display = 'flex';
});

window.addEventListener('resize', () => {
    // 重新计算窗口缩放比例
    calculateWindowScale();
    
    // 更新游戏边界
    const bounds = getGameBounds();
    posX = Math.min(posX, bounds.maxX);
    posY = Math.min(posY, bounds.maxY);
    
    // 更新玩家缩放
    if (player1) {
        const currentTransform = player1.style.transform;
        if (currentTransform.includes('scaleX(-1)')) {
            player1.style.transform = `scaleX(-1) scale(${currentScale * windowScale})`;
        } else {
            player1.style.transform = `scale(${currentScale * windowScale})`;
        }
    }
    
    // 更新所有敌人的缩放
    enemies.forEach(enemy => {
        const currentTransform = enemy.style.transform;
        if (currentTransform.includes('scaleX(-1)')) {
            enemy.style.transform = `scaleX(-1) scale(${windowScale})`;
        } else {
            enemy.style.transform = `scale(${windowScale})`;
        }
    });
    
    // 更新位置
    player1.style.left = posX + 'px';
    player1.style.top = posY + 'px';
});

// 添加难度选择功能
document.querySelectorAll('.difficulty-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        if (gameRunning) return;
        
        playClickSound();
        
        // 更新按钮状态
        document.querySelectorAll('.difficulty-btn').forEach(b => {
            b.classList.remove('active');
        });
        btn.classList.add('active');
        
        // 更新敌人数量
        selectedEnemyCount = parseInt(btn.dataset.enemies);
    });
});

// 音频控制
volumeControl.addEventListener('input', () => {
    const volume = volumeControl.value / 100;
    bgMusic.volume = volume;
    loseSound.volume = volume;
    gameoverSound.volume = volume;  // 同步更新游戏结束音效音量
    // 同步更新所有角色音效的音量
    Object.values(characterSounds).forEach(sound => {
        sound.volume = volume;
    });
    volumeLabel.textContent = volume === 0 ? '🔇' : '🔊';
    
    // 如果音量大于0，尝试播放音乐
    if (volume > 0) {
        bgMusic.play().catch(error => {
            console.log("Background music play failed:", error);
        });
    } else {
        bgMusic.pause();
    }
});

volumeLabel.addEventListener('click', () => {
    playClickSound();
    if (bgMusic.volume > 0) {
        bgMusic.volume = 0;
        volumeControl.value = 0;
        volumeLabel.textContent = '🔇';
        bgMusic.pause();
    } else {
        bgMusic.volume = 0.5;
        volumeControl.value = 50;
        volumeLabel.textContent = '🔊';
        bgMusic.play().catch(error => {
            console.log("Background music play failed:", error);
        });
    }
});

// 添加再来一局按钮的点击事件
document.querySelectorAll('.play-again-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        playClickSound();
        gameOverDisplay.style.display = 'none';
        gameWinDisplay.style.display = 'none';
        characterSelection.style.display = 'flex';
        resetGame();
    });
});

// 添加认输按钮点击事件
surrenderButton.addEventListener('click', () => {
    playClickSound();
    gameLose();
});

// 在游戏初始化时计算初始缩放比例
window.addEventListener('load', () => {
    calculateWindowScale();
}); 