const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
const scoreElement = document.getElementById("score");
const highScoreElement = document.getElementById("high-score");
const tileSize = 24;
const tileCountX = canvas.width / tileSize;
const tileCountY = canvas.height / tileSize;

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

    const head = snake[0];

    const newHead = {
        x: head.x + direction.x,
        y: head.y + direction.y
    }; 

    if (
        newHead.x < 0 || 
        newHead.x >= tileCountX ||
        newHead.y < 0 || 
        newHead.y >= tileCountY ||
        snakeHitsItself(newHead)
    ) {
        resetGame();
        return;
    }

    snake.unshift(newHead);

    let ateApple = false;

    for (let i = 0; i < apples.length; i++) {
        if (newHead.x === apples[i].x && newHead.y === apples[i].y) {
            ateApple = true;

            addScore(10 * scoreMultiplier);

            applesEaten++;

            apples[i] = createApple();

            if (applesEaten % 10 === 0) {
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
    ctx.clearRect(0, 0, canvas.width, canvas.height);

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

    return newApple;

}

function chooseUpgrade() {
    const upgrades = [
        "Speed Up",
        "Double Score",
        "Grow More"
    ];

    const choice = prompt(
        `Choose an upgrade:\n1. Speed Up\n2. Double Score\n3. Grow More`
    );

    if (choice === "1") {
        gameSpeed = Math.max(50, gameSpeed - 20);
        clearInterval(gameInterval);
        gameInterval = setInterval(gameLoop, gameSpeed);
    }

    if (choice === "2") {
        scoreMultiplier++;
    }

    if (choice === "3") {
        growthAmount++;
    }

    upgradesChosen++;

    if (upgradesChosen === 2) {
        spawnEnemySnake();
    } else if (upgradesChosen > 2) {
        upgradeEnemySnake();
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

    if (enemyMoveCounter < enemyMoveDelay) {
        return;
    }

    enemyMoveCounter = 0;

    const enemyHead = enemySnake[0];
    const playerHead = snake[0];

    let moveX = 0;
    let moveY = 0;

    const distanceX = playerHead.x - enemyHead.x;
    const distanceY = playerHead.y - enemyHead.y;

    if (Math.abs(distanceX) > Math.abs(distanceY)) {
        moveX = distanceX > 0 ? 1 : -1;
    } else {
        moveY = distanceY > 0 ? 1 : -1;
    }

    const newEnemyHead = {
        x: enemyHead.x + moveX,
        y: enemyHead.y + moveY
    };

    enemySnake.unshift(newEnemyHead);
    enemySnake.pop();

    if (enemyHitsPlayer()) {
        addScore(100 * scoreMultiplier);
        spawnEnemySnake();
    }
}

function enemyHitsPlayer() {
    const enemyHead = enemySnake[0];

    for (const part of snake) {
        if (part.x === enemyHead.x && part.y === enemyHead.y) {
            return true;
        }
    }

    return false;

}


function snakeHitsItself(head) {
    for (const part of snake) {
        if (part.x === head.x && part.y === head.y) {
            return true;
        }
    }
    return false;
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

draw();
gameInterval = setInterval(gameLoop, gameSpeed);