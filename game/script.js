const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
const scoreElement = document.getElementById("score");
const highScoreElement = document.getElementById("high-score");
const tileSize = 24;
const tileCountX = canvas.width / tileSize;
const tileCountY = canvas.height / tileSize;
const invincibilityElement = document.getElementById("invincibility");
const shieldElement = document.getElementById("shield");
const timeSlowElement = document.getElementById("time-slow");
const levelElement = document.getElementById("level");

let snake = [
    { x: 12, y: 12 }
];

let apples = [
    { x: 5, y: 5 },
    { x: 10, y: 10 },
    { x: 15, y: 15 }
];
let score = 0;
let highscore = localStorage.getItem("snakeHighScore") || 0;
highScoreElement.textContent = highscore;
let applesEaten = 0;
let scoreMultiplier = 1;
let growthAmount = 1;
let gameSpeed = 120;
let gameInterval;
let upgradesChosen = 0;

let enemySnake = [];
let enemyActive = false;
let enemyMoveCounter = 0;
let enemyMoveDelay = 8;
let enemyStartingLength = 4;

let invincibilityLevel = 0;
let invincible = false;
let invincibilityReady = true;
let invincibilityDuration = 5000;
let invincibilityCooldown = 60000;
let invincibilityEndTimer;
let invincibilityCooldownTimer;
let shield = 0;                         
let piercingLevel = 0;                
let timeSlowLevel = 0;
let timeSlowActive = false;           
let timeSlowReady = false;              
let timeSlowDuration = 10000;
let timeSlowCooldown = 60000;    
let timeSlowEndTimer;                  
let timeSlowCooldownTimer;              
let magnetLevel = 0;           
let level = 1;                          
let walls = [];                  
let hazards = [];                   
let shieldFlashTimer = null;             
let shieldInvulnerable = false;         

const levelColors = [              
    "#1c232b", "#1a2830", "#1c2e30", "#1e2e3a", "#202e44",
    "#262c4c", "#2c2a50", "#342850", "#3c264c", "#442444"
];

let direction = { 
    x: 1, 
    y: 0 
};

let nextDirection = { 
    x: 1, 
    y: 0 
};

document.addEventListener("keydown", changeDirection);

function addScore(points) {
    score += points * scoreMultiplier;
    scoreElement.textContent = score;

    if (score > highscore) {
        highscore = score;
        highScoreElement.textContent = highscore;
        localStorage.setItem("snakeHighScore", highscore);
    }

}

function changeDirection(event) {
    const key = event.key.toLowerCase();

    if (key === "v") {
    activateInvincibility();
    return;
}
    if (key === "b") {
    activateTimeSlow();
    return;
}

    if ((key === "arrowup" || key === "w") && direction.y !== 1) {
        nextDirection = { x: 0, y: -1 };
    }  
    
    if ((key === "arrowdown" || key === "s") && direction.y !== -1) {
        nextDirection = { x: 0, y: 1 };
    }

    if ((key === "arrowleft" || key === "a") && direction.x !== 1) {
        nextDirection = { x: -1, y: 0 };
    }

    if ((key === "arrowright" || key === "d") && direction.x !== -1) {
        nextDirection = { x: 1, y: 0 };
    }
}

function gameLoop() {
    direction = nextDirection;

    if (magnetLevel > 0) {
        applyMagnet();

        for (let i = 0; i < apples.length; i++) {
            if (apples[i].x === snake[0].x && apples[i].y === snake[0].y) {
                addScore(10 + piercingLevel * 5);
                applesEaten++;
                apples[i] = createApple();

                if (applesEaten % 15 === 0) {
                    chooseUpgrade();
                }

                for (let j = 0; j < growthAmount; j++) {
                    snake.push({ ...snake[snake.length - 1] });
                }

                break;
            }
        }
    }

    const head = snake[0];

    const newHead = {
        x: head.x + direction.x,
        y: head.y + direction.y
    }; 

    if (invincible) {
        newHead.x = Math.max(0, Math.min(tileCountX - 1, newHead.x));
        newHead.y = Math.max(0, Math.min(tileCountY - 1, newHead.y));
    } else {
        let hitWallOrSelf = false;

        if (newHead.x < 0 || newHead.x >= tileCountX || newHead.y < 0 || newHead.y >= tileCountY || snakeHitsItself(newHead)) {
            hitWallOrSelf = true;
        }

        for (const wall of walls) {
            if (wall.x === newHead.x && wall.y === newHead.y) {
                hitWallOrSelf = true;
                break;
            }
        }

        for (const hazard of hazards) {
            if (hazard.x === newHead.x && hazard.y === newHead.y) {
                hitWallOrSelf = true;
                break;
            }
        }

        if (hitWallOrSelf) {
            if (tryUseShield()) {
                newHead.x = Math.max(0, Math.min(tileCountX - 1, newHead.x));
                newHead.y = Math.max(0, Math.min(tileCountY - 1, newHead.y));
            } else {
                resetGame();
                return;
            }
        }
    }

    snake.unshift(newHead);

    let ateApple = false;

    for (let i = 0; i < apples.length; i++) {
        if (newHead.x === apples[i].x && newHead.y === apples[i].y) {
            ateApple = true;

            addScore(10 + piercingLevel * 5);

            applesEaten++;

            apples[i] = createApple();

            if (applesEaten % 15 === 0) {

                chooseUpgrade();
            }

            break;

        }
    }

    if (!ateApple) {
        snake.pop();
    } else {
        for (let i = 0; i < growthAmount - 1; i++) {
            snake.push({ ...snake[snake.length - 1] });
        }
    }

    updateEnemySnake();
    draw();
    
}

function draw() {
    ctx.fillStyle = levelColors[(level - 1) % levelColors.length];
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = "#4a5568";
    for (const wall of walls) {
        ctx.fillRect(wall.x * tileSize, wall.y * tileSize, tileSize, tileSize);
        ctx.fillStyle = "#2d3748";
        ctx.fillRect(wall.x * tileSize + 2, wall.y * tileSize + 2, tileSize - 4, tileSize - 4);
        ctx.fillStyle = "#4a5568";
    }

    ctx.fillStyle = "#f59e0b";
    for (const hazard of hazards) {
        ctx.fillRect(hazard.x * tileSize, hazard.y * tileSize, tileSize, tileSize);
        ctx.fillStyle = "#d97706";
        ctx.fillRect(hazard.x * tileSize + 2, hazard.y * tileSize + 2, tileSize - 4, tileSize - 4);
        ctx.fillStyle = "#f59e0b";
    }

    for (let i = 0; i < snake.length; i++) {
        if (i === 0) {
            ctx.fillStyle = "#3b82f6";
        } else {
            ctx.fillStyle = "#4ade80";
        }

        ctx.fillRect(
            snake[i].x * tileSize,
            snake[i].y * tileSize,
            tileSize - 2,
            tileSize - 2
        );
    }

    ctx.fillStyle = "#ef4444";

    for (const apple of apples) {
        ctx.fillRect(
            apple.x * tileSize,
            apple.y * tileSize,
            tileSize - 2,
            tileSize - 2
        );
    }

    if (enemyActive) {
        for (let i = 0; i < enemySnake.length; i++) {
            if (i === 0) {
                ctx.fillStyle = "#facc15";
            } else {
                ctx.fillStyle = "#a855f7";
            }

            ctx.fillRect(
                enemySnake[i].x * tileSize,
                enemySnake[i].y * tileSize,
                tileSize - 2,
                tileSize - 2
            );
        }
    }
}


function createApple() {
    const newApple = {
        x: Math.floor(Math.random() * tileCountX),
        y: Math.floor(Math.random() * tileCountY)
    };

    for (const part of snake) {
        if (part.x === newApple.x && part.y === newApple.y) {
            return createApple();
        }
    }

    for (const apple of apples) {
        if (apple.x === newApple.x && apple.y === newApple.y) {
            return createApple();
        }
    }

    for (const enemyPart of enemySnake) {
        if (enemyPart.x === newApple.x && enemyPart.y === newApple.y) {
            return createApple();
        }
    }

    for (const wall of walls) {
        if (wall.x === newApple.x && wall.y === newApple.y) {
            return createApple();
        }
    }

    for (const hazard of hazards) {
        if (hazard.x === newApple.x && hazard.y === newApple.y) {
            return createApple();
        }
    }

    return newApple;

}

function chooseUpgrade() {
    const choice = prompt(
        `Choose an upgrade:\n1. Speed Up\n2. Double Score\n3. Grow More\n4. Invincibility\n5. Shield\n6. Piercing\n7. Time Slow\n8. Magnet`
    );

    if (choice === "1") {
        gameSpeed = Math.max(50, gameSpeed - 20);
        clearInterval(gameInterval);
        gameInterval = setInterval(gameLoop, gameSpeed);
    } else if (choice === "2") {
        scoreMultiplier++;
    } else if (choice === "3") {
        growthAmount++;
    } else if (choice === "4") {
        invincibilityLevel++;
        invincibilityDuration += 1000;
        invincibilityCooldown += 1000;
        invincibilityReady = true;
        updateInvincibilityHud();
    } else if (choice === "5") {
        shield++;
        shieldElement.textContent = shield;
    } else if (choice === "6") {
        piercingLevel++;
    } else if (choice === "7") {
        timeSlowLevel++;
        timeSlowReady = true;
        timeSlowDuration += 1000;
        timeSlowCooldown += 1000;
        updateTimeSlowHud();
    } else if (choice === "8") {
        magnetLevel++;
    }

    upgradesChosen++;

    if (upgradesChosen === 2) {
        spawnEnemySnake();
    } else if (upgradesChosen > 2) {
        upgradeEnemySnake();
    }

    level++;
    levelElement.textContent = level;

    gameSpeed = Math.max(50, 120 - level * 5);
    clearInterval(gameInterval);
    gameInterval = setInterval(gameLoop, gameSpeed);

    generateLevel();
}

function activateInvincibility() {
    if (invincibilityLevel === 0 || !invincibilityReady || invincible) {
        return;
    }

    invincible = true;
    invincibilityReady = false;
    updateInvincibilityHud();

    clearTimeout(invincibilityEndTimer);
    clearTimeout(invincibilityCooldownTimer);

    invincibilityEndTimer = setTimeout(function () {
        invincible = false;
        updateInvincibilityHud();
    }, invincibilityDuration);

    invincibilityCooldownTimer = setTimeout(function () {
        invincibilityReady = true;
        updateInvincibilityHud();
    }, invincibilityCooldown);
}

function updateInvincibilityHud() {
    if (invincibilityLevel === 0) {
        invincibilityElement.textContent = "Locked";
    } else if (invincible) {
        invincibilityElement.textContent = "Active";
    } else if (invincibilityReady) {
        invincibilityElement.textContent = "Ready";
    } else {
        invincibilityElement.textContent = "Cooldown";
    }
}

function spawnEnemySnake() {
    enemyActive = true;
    enemySnake = [];

    const corners = [
        { x: 0, y: 0 },
        { x: tileCountX - 1, y: 0 },
        { x: 0, y: tileCountY - 1 },
        { x: tileCountX - 1, y: tileCountY - 1 }
    ];

    const corner = corners[Math.floor(Math.random() * corners.length)];

    for (let i = 0; i < enemyStartingLength; i++) {
        enemySnake.push({ 
            x: corner.x,
            y: corner.y
        });
    }
}

function upgradeEnemySnake() {
    enemyStartingLength++;

    if (enemySnake.length > 0) {
        enemySnake.push({ ...enemySnake[enemySnake.length - 1] });
    }

    enemyMoveDelay = Math.max(1, enemyMoveDelay - 1);
}

function updateEnemySnake() {
    if (!enemyActive) {
        return;
    }

    enemyMoveCounter++;

    let effectiveDelay = enemyMoveDelay;
    if (timeSlowActive) {
        effectiveDelay = enemyMoveDelay * 2;
    }

    if (enemyMoveCounter < effectiveDelay) {
        return;
    }

    enemyMoveCounter = 0;

    const enemyHead = enemySnake[0];
    const playerHead = snake[0];

    const moves = [
        { x: 1, y: 0 },
        { x: -1, y: 0 },
        { x: 0, y: 1 },
        { x: 0, y: -1 }
    ];

    let bestMove = moves[0];
    let bestScore = Infinity;

    for (const move of moves) {
        const testHead = {
            x: enemyHead.x + move.x,
            y: enemyHead.y + move.y
        };

        let moveScore = getDistance(testHead, playerHead);

        if (testHead.x < 0 || testHead.x >= tileCountX || testHead.y < 0 || testHead.y >= tileCountY) {
            moveScore += 10000;
        }

        if (enemyWouldHitItself(testHead)) {
            moveScore += 5000;
        }

        if (enemyWouldHitPlayerBody(testHead)) {
            moveScore += 3000;
        }

        for (const wall of walls) {
            if (testHead.x === wall.x && testHead.y === wall.y) {
                moveScore += 10000;
                break;
            }
        }

        for (const hazard of hazards) {
            if (testHead.x === hazard.x && testHead.y === hazard.y) {
                moveScore += 8000;
                break;
            }
        }

        if (moveScore < bestScore) {
            bestScore = moveScore;
            bestMove = move;
        }
    }

    const newEnemyHead = {
        x: enemyHead.x + bestMove.x,
        y: enemyHead.y + bestMove.y
    };

    enemySnake.unshift(newEnemyHead);

    const appleIndex = apples.findIndex(function (apple) {
        return apple.x === newEnemyHead.x && apple.y === newEnemyHead.y;
    });

    if (appleIndex !== -1) {
        apples[appleIndex] = createApple();
    } else {
        enemySnake.pop();
    }

    handleEnemyPlayerCollision();
}

function handleEnemyPlayerCollision() {
    const enemyHead = enemySnake[0];
    const playerHead = snake[0];

    if (enemyHead.x === playerHead.x && enemyHead.y === playerHead.y) {
        if (invincible) {
            addScore(100);
            spawnEnemySnake();
        } else {
            resetGame();
        }

        return;
    }

    for (let i = 1; i < snake.length; i++) {
        if (enemyHead.x === snake[i].x && enemyHead.y === snake[i].y) {
            addScore(100);
            spawnEnemySnake();
            return;
        }
    }

    if (invincible) {
        for (const enemyPart of enemySnake) {
            if (playerHead.x === enemyPart.x && playerHead.y === enemyPart.y) {
                addScore(100);
                spawnEnemySnake();
                return;
            }
        }
    }
}


function snakeHitsItself(head) {
    for (const part of snake) {
        if (part.x === head.x && part.y === head.y) {
            return true;
        }
    }
    return false;
}

function getDistance(a, b) {
    return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
}

function enemyWouldHitItself(testHead) {
    for (const part of enemySnake) {
        if (testHead.x === part.x && testHead.y === part.y) {
            return true;
        }
    }

    return false;
}

function enemyWouldHitPlayerBody(testHead) {
    for (let i = 1; i < snake.length; i++) {
        if (testHead.x === snake[i].x && testHead.y === snake[i].y) {
            return true;
        }
    }

    return false;
}

function tryUseShield() {
    if (shieldInvulnerable) {
        return true;
    }

    if (shield > 0) {
        shield--;
        shieldInvulnerable = true;
        shieldElement.textContent = shield;

        clearTimeout(shieldFlashTimer);
        shieldFlashTimer = setTimeout(function () {
            shieldInvulnerable = false;
        }, 500);

        return true;
    }

    return false;
}

function activateTimeSlow() {
    if (timeSlowLevel === 0 || !timeSlowReady || timeSlowActive) {
        return;
    }

    timeSlowActive = true;
    timeSlowReady = false;
    updateTimeSlowHud();

    clearTimeout(timeSlowEndTimer);
    clearTimeout(timeSlowCooldownTimer);

    timeSlowEndTimer = setTimeout(function () {
        timeSlowActive = false;
        updateTimeSlowHud();
    }, timeSlowDuration);

    timeSlowCooldownTimer = setTimeout(function () {
        timeSlowReady = true;
        updateTimeSlowHud();
    }, timeSlowCooldown);
}

function updateTimeSlowHud() {
    if (timeSlowLevel === 0) {
        timeSlowElement.textContent = "Locked";
    } else if (timeSlowActive) {
        timeSlowElement.textContent = "Active";
    } else if (timeSlowReady) {
        timeSlowElement.textContent = "Ready";
    } else {
        timeSlowElement.textContent = "Cooldown";
    }
}

function applyMagnet() {
    const head = snake[0];
    const range = magnetLevel * 4;

    for (const apple of apples) {
        const dist = Math.abs(apple.x - head.x) + Math.abs(apple.y - head.y);
        if (dist === 0 || dist > range) {
            continue;
        }

        const dx = Math.sign(head.x - apple.x);
        const dy = Math.sign(head.y - apple.y);

        const newX = apple.x + dx;
        const newY = apple.y + dy;

        let blocked = false;

        if (newX < 0 || newX >= tileCountX || newY < 0 || newY >= tileCountY) {
            blocked = true;
        }

        if (!blocked) {
            for (const wall of walls) {
                if (wall.x === newX && wall.y === newY) {
                    blocked = true;
                    break;
                }
            }
        }

        if (!blocked) {
            for (const hazard of hazards) {
                if (hazard.x === newX && hazard.y === newY) {
                    blocked = true;
                    break;
                }
            }
        }

        if (!blocked) {
            apple.x = newX;
            apple.y = newY;
        }
    }
}

function generateLevel() {
    const wallCount = Math.min(5 + level * 2, 25);
    const hazardCount = Math.min(2 + level, 10);

    const occupied = new Set();

    for (const part of snake) {
        occupied.add(part.x + "," + part.y);
    }

    for (const apple of apples) {
        occupied.add(apple.x + "," + apple.y);
    }

    if (enemyActive) {
        for (const part of enemySnake) {
            occupied.add(part.x + "," + part.y);
        }
    }

    walls = [];
    hazards = [];

    for (let attempt = 0; attempt < 100 && walls.length < wallCount; attempt++) {
        const x = Math.floor(Math.random() * tileCountX);
        const y = Math.floor(Math.random() * tileCountY);
        const key = x + "," + y;

        if (!occupied.has(key)) {
            walls.push({ x, y });
            occupied.add(key);
        }
    }

    for (let attempt = 0; attempt < 100 && hazards.length < hazardCount; attempt++) {
        const x = Math.floor(Math.random() * tileCountX);
        const y = Math.floor(Math.random() * tileCountY);
        const key = x + "," + y;

        if (!occupied.has(key)) {
            hazards.push({ x, y });
            occupied.add(key);
        }
    }
}

function resetGame() {
    snake = [
        { x: 12, y: 12 }
    ];

    apples = [
        { x: 5, y: 5 },
        { x: 10, y: 10 },
        { x: 15, y: 15 }
    ];
    

    score = 0;
    scoreElement.textContent = score;
    applesEaten = 0;
    scoreMultiplier = 1;
    growthAmount = 1;
    gameSpeed = 120;

    upgradesChosen = 0;
    enemySnake = [];
    enemyActive = false;
    enemyMoveCounter = 0;
    enemyMoveDelay = 8;
    enemyStartingLength = 4;

    invincibilityLevel = 0;
    invincible = false;
    invincibilityReady = true;
    invincibilityDuration = 5000;
    invincibilityCooldown = 60000;

    clearTimeout(invincibilityEndTimer);
    clearTimeout(invincibilityCooldownTimer);

    updateInvincibilityHud();

    shield = 0;
    piercingLevel = 0;
    timeSlowLevel = 0;
    timeSlowActive = false;
    timeSlowReady = false;
    magnetLevel = 0;
    level = 1;
    walls = [];
    hazards = [];
    shieldInvulnerable = false;

    clearTimeout(timeSlowEndTimer);
    clearTimeout(timeSlowCooldownTimer);
    clearTimeout(shieldFlashTimer);

    shieldElement.textContent = "0";
    timeSlowElement.textContent = "Locked";
    levelElement.textContent = "1";

    clearInterval(gameInterval);
    gameInterval = setInterval(gameLoop, gameSpeed);

    direction = { 
        x: 1, 
        y: 0 
    };

    nextDirection = { 
        x: 1, 
        y: 0 
    };
}

updateInvincibilityHud();
updateTimeSlowHud();

draw();
gameInterval = setInterval(gameLoop, gameSpeed);