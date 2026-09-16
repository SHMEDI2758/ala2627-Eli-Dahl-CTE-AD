const button = document.querySelector("#action");
const output = document.querySelector("#output");
const game = document.querySelector("#game");
const player = document.querySelector("#player");
const scoreEl = document.querySelector("#score");

let playerY = 0;
let velocity = 0;
let gravity = 0.8;
let score = 0;
let isRunning = false;
let obstacleTimer = 0;
let obstacles = [];
let animationId = null;

function updatePlayer() {
  player.style.bottom = playerY + "px";
}

function jump() {
  if (!isRunning) {
    startGame();
  }

  if (playerY <= 0) {
    velocity = -12;
    output.textContent = "Jump!";
  }
}

function startGame() {
  isRunning = true;
  score = 0;
  playerY = 0;
  velocity = 0;
  obstacleTimer = 0;
  scoreEl.textContent = "Score: 0";
  output.textContent = "Avoid the spikes!";

  obstacles.forEach(function (obstacle) {
    obstacle.remove();
  });
  obstacles = [];

  if (animationId) {
    cancelAnimationFrame(animationId);
  }

  animationId = requestAnimationFrame(gameLoop);
}

function spawnObstacle() {
  const obstacle = document.createElement("div");
  obstacle.classList.add("obstacle");

  const height = 30 + Math.random() * 70;
  obstacle.style.height = height + "px";
  obstacle.style.left = game.clientWidth + "px";
  obstacle.style.width = "28px";

  game.appendChild(obstacle);

  obstacles.push({
    element: obstacle,
    x: game.clientWidth,
    width: 28,
    height: height,
    speed: 5 + score * 0.03
  });
}

function checkCollision() {
  const playerBox = {
    left: 70,
    right: 104,
    top: playerY,
    bottom: playerY + 34
  };

  return obstacles.some(function (obstacle) {
    const obstacleBox = {
      left: obstacle.x,
      right: obstacle.x + obstacle.width,
      top: 0,
      bottom: obstacle.height
    };

    const horizontalHit = playerBox.right > obstacleBox.left && playerBox.left < obstacleBox.right;
    const verticalHit = playerBox.bottom > obstacleBox.top && playerBox.top < obstacleBox.bottom;

    return horizontalHit && verticalHit;
  });
}

function endGame() {
  isRunning = false;
  cancelAnimationFrame(animationId);
  output.textContent = "Game over! Press Jump to play again.";
}

function gameLoop() {
  if (!isRunning) {
    return;
  }

  velocity += gravity;
  playerY += velocity;

  if (playerY < 0) {
    playerY = 0;
    velocity = 0;
  }

  updatePlayer();

  obstacleTimer += 1;
  if (obstacleTimer > 90) {
    spawnObstacle();
    obstacleTimer = 0;
  }

  obstacles.forEach(function (obstacle) {
    obstacle.x -= obstacle.speed;
    obstacle.element.style.left = obstacle.x + "px";
  });

  obstacles = obstacles.filter(function (obstacle) {
    if (obstacle.x + obstacle.width < -10) {
      obstacle.element.remove();
      return false;
    }
    return true;
  });

  score += 0.5;
  scoreEl.textContent = "Score: " + Math.floor(score);

  if (checkCollision()) {
    endGame();
    return;
  }

  animationId = requestAnimationFrame(gameLoop);
}

button.addEventListener("click", jump);

document.addEventListener("keydown", function (event) {
  if (event.code === "Space") {
    event.preventDefault();
    jump();
  }
});

updatePlayer();
