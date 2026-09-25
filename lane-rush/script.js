const canvas = document.querySelector("#game-canvas");
const context = canvas.getContext("2d");
const gameMessage = document.querySelector("#game-message");
const messageTitle = document.querySelector("#message-title");
const messageCopy = document.querySelector("#message-copy");
const startButton = document.querySelector("#start-button");
const fullscreenButton = document.querySelector("#fullscreen-button");
const scoreReadout = document.querySelector("#score");
const speedReadout = document.querySelector("#speed");
const bestReadout = document.querySelector("#best");
const levelReadout = document.querySelector("#level");
const nextLevelReadout = document.querySelector("#next-level");
const progressBar = document.querySelector("#progress-bar");

const laneCount = 3;
const laneColors = ["#d7f56b", "#f47f48", "#ee5c53"];
let animationFrame;
let lastTime = 0;
let road = { width: 0, height: 0, left: 0, laneWidth: 0 };
let game = createGameState();

function getBestStorageKey() {
  const hitboxMode = document.body.dataset.mode === "hitbox"
    || new URLSearchParams(window.location.search).get("mode") === "hitbox";
  return hitboxMode ? "lane-rush-hitbox-best" : "lane-rush-best";
}

function loadBestScore() {
  return Number(localStorage.getItem(getBestStorageKey()) || 0);
}

function createGameState() {
  return {
    active: false,
    paused: false,
    playerLane: 1,
    playerX: 1,
    obstacles: [],
    distance: 0,
    roadOffset: 0,
    showDeathHitboxes: false,
    level: 1,
    speed: 1,
    spawnTimer: 0,
    best: loadBestScore(),
  };
}

function resizeCanvas() {
  const ratio = window.devicePixelRatio || 1;
  const bounds = canvas.getBoundingClientRect();
  canvas.width = Math.floor(bounds.width * ratio);
  canvas.height = Math.floor(bounds.height * ratio);
  context.setTransform(ratio, 0, 0, ratio, 0, 0);
  road.width = bounds.width;
  road.height = bounds.height;
  road.laneWidth = Math.min(bounds.width * 0.2, 150);
  road.left = (bounds.width - road.laneWidth * laneCount) / 2;
}

function startGame() {
  game = createGameState();
  game.active = true;
  gameMessage.classList.add("is-hidden");
  lastTime = performance.now();
  updateHud();
  cancelAnimationFrame(animationFrame);
  animationFrame = requestAnimationFrame(gameLoop);
}

window.addEventListener("lane-rush-mode-change", startGame);

function endGame() {
  if (!game.active) return;
  game.active = false;
  game.showDeathHitboxes = true;
  const finalScore = Math.floor(game.distance);
  if (finalScore > game.best) {
    game.best = finalScore;
    localStorage.setItem(getBestStorageKey(), String(finalScore));
  }
  messageTitle.textContent = "Traffic got you.";
  messageCopy.innerHTML = `You covered <strong>${String(finalScore).padStart(4, "0")}m</strong>. Find a new line and try again.`;
  startButton.innerHTML = "Restart run <span>↗</span>";
  gameMessage.classList.remove("is-hidden");
  updateHud();
}

function togglePause() {
  if (!game.active) return;
  game.paused = !game.paused;
  if (!game.paused) {
    lastTime = performance.now();
    animationFrame = requestAnimationFrame(gameLoop);
  }
}

function movePlayer(direction) {
  if (!game.active || game.paused) return;
  game.playerLane = Math.max(0, Math.min(laneCount - 1, game.playerLane + direction));
}

function spawnObstacle() {
  const lane = Math.floor(Math.random() * laneCount);
  const lastObstacle = game.obstacles[game.obstacles.length - 1];
  if (lastObstacle && lastObstacle.lane === lane && lastObstacle.y < 120) return;
  if (!hasSafeLane(lane)) return;
  game.obstacles.push({ lane, y: -100, color: laneColors[Math.floor(Math.random() * laneColors.length)] });
}

function hasSafeLane(nextLane) {
  const dangerStart = road.height - 270;
  const dangerEnd = road.height + 80;
  const occupiedLanes = new Set(
    game.obstacles
      .filter((obstacle) => obstacle.y > dangerStart && obstacle.y < dangerEnd)
      .map((obstacle) => obstacle.lane),
  );
  occupiedLanes.add(nextLane);
  return occupiedLanes.size < laneCount;
}

function gameLoop(time) {
  const delta = Math.min((time - lastTime) / 1000, 0.05);
  lastTime = time;
  if (game.active && !game.paused) update(delta);
  draw();
  if (game.active) animationFrame = requestAnimationFrame(gameLoop);
}

function update(delta) {
  game.speed = 1 + Math.min(game.distance / 230, 3.5);
  game.distance += delta * 13 * game.speed;
  game.level = Math.floor(game.distance / 100) + 1;
  game.spawnTimer -= delta;
  if (game.spawnTimer <= 0) {
    spawnObstacle();
    game.spawnTimer = Math.max(0.42, 1.05 - game.level * 0.055) * (0.82 + Math.random() * 0.3);
  }

  const obstacleSpeed = road.height * (0.34 + game.speed * 0.075);
  game.roadOffset += delta * obstacleSpeed;
  game.obstacles.forEach((obstacle) => { obstacle.y += delta * obstacleSpeed; });
  game.obstacles = game.obstacles.filter((obstacle) => obstacle.y < road.height + 130);

  const playerY = road.height - 100;
  const playerLane = Math.round(game.playerX);
  for (const obstacle of game.obstacles) {
    const laneMatch = obstacle.lane === playerLane;
    const verticalMatch = obstacle.y + 64 > playerY && obstacle.y < playerY + 64;
    if (laneMatch && verticalMatch) endGame();
  }
  game.playerX += (game.playerLane - game.playerX) * Math.min(delta * 13, 1);
  updateHud();
}

function updateHud() {
  game.best = loadBestScore();
  scoreReadout.textContent = String(Math.floor(game.distance)).padStart(4, "0");
  bestReadout.textContent = String(game.best).padStart(4, "0");
  speedReadout.textContent = game.speed.toFixed(1);
  levelReadout.textContent = String(game.level).padStart(2, "0");
  const levelProgress = game.distance % 100;
  progressBar.style.width = `${levelProgress}%`;
  nextLevelReadout.textContent = String(Math.ceil(100 - levelProgress));
}

function draw() {
  context.clearRect(0, 0, road.width, road.height);
  drawRoad();
  game.obstacles.forEach(drawObstacle);
  drawPlayer();
  if (window.hitboxMode) {
    window.hitboxMode.draw(context, road, game, laneCount, game.showDeathHitboxes);
  }
  if (game.paused) drawPauseLayer();
}

function drawRoad() {
  context.fillStyle = "#242d27";
  context.fillRect(0, 0, road.width, road.height);
  context.fillStyle = "#1b241e";
  context.fillRect(road.left - 18, 0, 8, road.height);
  context.fillRect(road.left + road.laneWidth * laneCount + 10, 0, 8, road.height);
  context.strokeStyle = "rgba(215, 245, 107, .38)";
  context.lineWidth = 2;
  context.setLineDash([24, 24]);
  context.lineDashOffset = -game.roadOffset;
  for (let index = 1; index < laneCount; index += 1) {
    const x = road.left + road.laneWidth * index;
    context.beginPath();
    context.moveTo(x, 0);
    context.lineTo(x, road.height);
    context.stroke();
  }
  context.setLineDash([]);
  const shade = context.createLinearGradient(0, 0, 0, road.height);
  shade.addColorStop(0, "rgba(255,255,255,.03)");
  shade.addColorStop(1, "rgba(0,0,0,.18)");
  context.fillStyle = shade;
  context.fillRect(road.left, 0, road.laneWidth * laneCount, road.height);
}

function drawPlayer() {
  const x = road.left + road.laneWidth * game.playerX + road.laneWidth / 2;
  const y = road.height - 100;
  drawCar(x, y, "#d7f56b", true);
}

function drawObstacle(obstacle) {
  const x = road.left + road.laneWidth * obstacle.lane + road.laneWidth / 2;
  drawCar(x, obstacle.y + 32, obstacle.color, false);
}

function drawCar(centerX, centerY, color, isPlayer) {
  const width = road.laneWidth * 0.54;
  const height = width * 1.44;
  context.save();
  context.translate(centerX, centerY);
  context.shadowColor = isPlayer ? "rgba(215,245,107,.4)" : "rgba(0,0,0,.35)";
  context.shadowBlur = isPlayer ? 22 : 14;
  context.fillStyle = color;
  context.beginPath();
  context.roundRect(-width / 2, -height / 2, width, height, width * .2);
  context.fill();
  context.shadowBlur = 0;
  context.fillStyle = isPlayer ? "#263228" : "#303b31";
  context.beginPath();
  context.roundRect(-width * .29, -height * .2, width * .58, height * .37, width * .1);
  context.fill();
  context.fillStyle = isPlayer ? "#f4fff0" : "#f7d6a2";
  context.fillRect(-width * .36, -height * .39, width * .16, height * .07);
  context.fillRect(width * .2, -height * .39, width * .16, height * .07);
  context.fillStyle = "#101713";
  context.fillRect(-width * .57, -height * .27, width * .12, height * .19);
  context.fillRect(width * .45, -height * .27, width * .12, height * .19);
  context.fillRect(-width * .57, height * .13, width * .12, height * .19);
  context.fillRect(width * .45, height * .13, width * .12, height * .19);
  context.restore();
}

function drawPauseLayer() {
  context.fillStyle = "rgba(16, 23, 19, .72)";
  context.fillRect(0, 0, road.width, road.height);
  context.fillStyle = "#d7f56b";
  context.textAlign = "center";
  context.font = "500 18px 'DM Mono'";
  context.fillText("PAUSED", road.width / 2, road.height / 2);
}

window.addEventListener("resize", resizeCanvas);
fullscreenButton.addEventListener("click", async () => {
  if (document.fullscreenElement) {
    await document.exitFullscreen();
  } else {
    await document.querySelector(".game-frame").requestFullscreen();
  }
});
document.addEventListener("fullscreenchange", () => {
  const isFullscreen = Boolean(document.fullscreenElement);
  fullscreenButton.textContent = isFullscreen ? "⛶ exit fullscreen" : "⛶ fullscreen";
  fullscreenButton.setAttribute("aria-label", isFullscreen ? "Exit fullscreen" : "Enter fullscreen");
  resizeCanvas();
});
window.addEventListener("keydown", (event) => {
  if (["ArrowLeft", "ArrowRight", "a", "d", "p", "P", " "].includes(event.key)) event.preventDefault();
  if (event.key === "ArrowLeft" || event.key.toLowerCase() === "a") movePlayer(-1);
  if (event.key === "ArrowRight" || event.key.toLowerCase() === "d") movePlayer(1);
  if (event.key.toLowerCase() === "p" || event.key === " ") togglePause();
  if (event.key === "Enter" && !game.active) startGame();
});
startButton.addEventListener("click", startGame);
resizeCanvas();
bestReadout.textContent = String(game.best).padStart(4, "0");
draw();
