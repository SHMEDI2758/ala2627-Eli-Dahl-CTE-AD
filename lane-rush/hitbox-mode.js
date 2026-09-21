const hitboxMode = {
  enabled: true,

  draw(context, road, game, laneCount) {
    if (!this.enabled) return;

    context.save();
    context.lineWidth = 4;
    context.setLineDash([10, 5]);
    context.shadowBlur = 10;
    context.font = "500 12px 'DM Mono'";
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
  context.fillStyle = "rgba(215, 245, 107, .22)";
  context.shadowColor = "#d7f56b";
  context.fillRect(x, y, width, 64);
  context.strokeRect(x, y, width, 64);
  context.fillStyle = "#efffb2";
  context.fillText("PLAYER", x + width / 2, y - 7);
}

function drawObstacleHitbox(context, road, obstacle, laneCount) {
  const width = road.laneWidth * 0.54;
  const x = road.left + road.laneWidth * obstacle.lane + (road.laneWidth - width) / 2;
  const y = obstacle.y;
  context.strokeStyle = "#ff8a62";
  context.fillStyle = "rgba(244, 127, 72, .24)";
  context.shadowColor = "#ff704d";
  context.fillRect(x, y, width, 64);
  context.strokeRect(x, y, width, 64);
  context.fillStyle = "#ffd0bd";
  context.fillText(`OBSTACLE ${obstacle.lane + 1}/${laneCount}`, x + width / 2, y - 7);
}

window.hitboxMode = hitboxMode;
