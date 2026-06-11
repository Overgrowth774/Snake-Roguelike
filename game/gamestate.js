const tileSIze =24;
const tileCount =25;

let snake = [{x:12, y:12}];
let apple = {x:5, y:5};
let score =0;

let direction = {x:1, y:0};
let nextDirection = {x:1, y:0};

document.addEventListener("keydown", (event) => {
    if ((event.key === "ArrowUp" || event.key === "w") && direction.y !== 1) {
        nextDirection = {x:0, y:-1};
    }

    if ((event.key === "ArrowDown" || event.key === "s") && direction.y !== -1) {
        nextDirection = {x:0, y:1};
    }

    if ((event.key === "ArrowLeft" || event.key === "a") && direction.x !== 1) {
        nextDirection = {x:-1, y:0};
    }

    if ((event.key === "ArrowRight" || event.key === "d") && direction.x !== -1) {
        nextDirection = {x:1, y:0};
    }

});

direction = nextDirection;

const head = snake[0];
const newHead = {
    x: head.x + direction.x,
    y: head.y + direction.y
};

snake.unshift(newHead);

if (newHead.x === apple.x && newHead.y === apple.y) {
    score+= 10;
    scoreElement.textContent = score;
    placeApple();
} else {
    snake.pop();
}

function placeApple() {
    apple = {
        x: Math.floor(Math.random() * tileCount),
        y: Math.floor(Math.random() * tileCount)
    };
}

ctx.clearRect(0, 0, canvas.width, canvas.height);

ctx.fillStyle = "lime";
for (const part of snake) {
    ctx.fillRect(part.x * tileSize, part.y * tileSize, tileSize - 2, tileSize - 2);
}

ctx.fillStyle = "red";
ctx.fillRect(apple.x * tileSize, apple.y * tileSize, tileSize - 2, tileSize - 2);

setInterval(gameLoop, 120);