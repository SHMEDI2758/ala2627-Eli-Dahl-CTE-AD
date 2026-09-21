const hitboxButton = document.querySelector("#hitbox-button");

const hitboxMode = {
  enabled: false,

  draw(context, road, game, laneCount) {
    if (!this.enabled) return;

    context.save();
    context.lineWidth = 2;
    context.setLineDash([5, 4]);
    context.font = "500 10px 'DM Mono'";
    context.textAlign = "center";
    drawPlayerHitbox(context, road, game);
    game.obstacles.forEach((obstacle) => drawObstacleHitbox(context, road, obstacle, laneCount));
    context.restore();
  },
};

function drawPlayerHitbox(context, road, game) {
  const width = road.laneWidth * 0.54;
  const x = road.left + road.laneWidth * game.playerX + (road.laneWidth - width) / 2;
  const y = road.height - 100;
  context.strokeStyle = "#d7f56b";
  context.fillStyle = "#d7f56b";
  context.strokeRect(x, y, width, 64);
  context.fillText("PLAYER", x + width / 2, y - 7);
}

function drawObstacleHitbox(context, road, obstacle, laneCount) {
  const width = road.laneWidth * 0.54;
  const x = road.left + road.laneWidth * obstacle.lane + (road.laneWidth - width) / 2;
  const y = obstacle.y;
  context.strokeStyle = "#ff8a62";
  context.fillStyle = "#ff8a62";
  context.strokeRect(x, y, width, 64);
  context.fillText(`OBSTACLE ${obstacle.lane + 1}/${laneCount}`, x + width / 2, y - 7);
}

function updateHitboxButton() {
  hitboxButton.textContent = hitboxMode.enabled ? "□ hitboxes on" : "□ hitboxes off";
  hitboxButton.setAttribute("aria-pressed", String(hitboxMode.enabled));
}

hitboxButton.addEventListener("click", () => {
  hitboxMode.enabled = !hitboxMode.enabled;
  updateHitboxButton();
});

window.hitboxMode = hitboxMode;
updateHitboxButton();
