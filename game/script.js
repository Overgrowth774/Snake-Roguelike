const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
const scoreElement = document.getElementById("score");

const tileSize = 24;
const tileCount = canvas.width / tileSize;

let snake = [
    { x: 12, y: 12 }
];

let apple = { 
    x: 5, 
    y: 5 
};

let score = 0;

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
        newHead.x >= tileCount ||
        newHead.y < 0 || 
        newHead.y >= tileCount ||
        snakeHitsItself(newHead)
    ) {
        resetGame();
        return;
    }

    snake.unshift(newHead);

    if (newHead.x === apple.x && newHead.y === apple.y) {
        score += 10;
        scoreElement.textContent = score;
        placeApple();
    } else {
        snake.pop();
    }
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

    ctx.fillRect(
        apple.x * tileSize,
        apple.y * tileSize,
        tileSize - 2,
        tileSize - 2
    );
}

function placeApple() {
    apple = {
        x: Math.floor(Math.random() * tileCount),
        y: Math.floor(Math.random() * tileCount)
    };

    for (const part of snake) {
        if (part.x === apple.x && part.y === apple.y) {
            placeApple();
            break;
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

function resetGame() {
    snake = [
        { x: 12, y: 12 }
    ];

    apple = { 
        x: 5, 
        y: 5 
    };

    score = 0;
    scoreElement.textContent = score;

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
setInterval(gameLoop, 120);
