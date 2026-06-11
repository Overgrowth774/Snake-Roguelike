const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
const scoreElement = document.getElementById("score");

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
let applesEaten = 0;
let scoreMultiplier = 1;
let growthAmount = 1;
let gameSpeed = 120;
let gameInterval;

let direction = { 
    x: 1, 
    y: 0 
};

let nextDirection = { 
    x: 1, 
    y: 0 
};

document.addEventListener("keydown", changeDirection);

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

            score += 10 * scoreMultiplier;
            scoreElement.textContent = score;

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

    draw();
    
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = "#4ade80";

    for (const part of snake) {
        ctx.fillRect(
            part.x * tileSize,
            part.y * tileSize,
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