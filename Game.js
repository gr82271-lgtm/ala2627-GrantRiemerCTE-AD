const canvas = document.getElementById('pong-canvas');
const scoreLeft = document.getElementById('score-left');
const scoreRight = document.getElementById('score-right');
const gameMessage = document.getElementById('game-message');
const restartButton = document.getElementById('restart-pong');

if (canvas && scoreLeft && scoreRight && gameMessage && restartButton) {
  const ctx = canvas.getContext('2d');
  const width = canvas.width;
  const height = canvas.height;

  const leftPaddle = { x: 18, y: height / 2 - 55, width: 14, height: 110, speed: 430 };
  const rightPaddle = { x: width - 32, y: height / 2 - 55, width: 14, height: 110, speed: 430 };
  const ball = { x: width / 2, y: height / 2, radius: 10, vx: 340, vy: 180 };
  const keys = { w: false, s: false, ArrowUp: false, ArrowDown: false };

  let leftScore = 0;
  let rightScore = 0;
  let running = true;
  let lastTime = 0;

  function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
  }

  function resetBall(direction = 1) {
    ball.x = width / 2;
    ball.y = height / 2;
    const vertical = (Math.random() * 2 - 1) * 180;
    const speed = 360;
    ball.vx = direction * speed;
    ball.vy = vertical;
  }

  function updateScore() {
    scoreLeft.textContent = String(leftScore);
    scoreRight.textContent = String(rightScore);
  }

  function updatePaddles(dt) {
    const leftDir = (keys.w ? -1 : 0) + (keys.s ? 1 : 0);
    const rightDir = (keys.ArrowUp ? -1 : 0) + (keys.ArrowDown ? 1 : 0);

    leftPaddle.y += leftDir * leftPaddle.speed * dt;
    rightPaddle.y += rightDir * rightPaddle.speed * dt;

    if (!rightDir) {
      const target = ball.y - rightPaddle.height / 2;
      const diff = target - rightPaddle.y;
      rightPaddle.y += Math.sign(diff) * rightPaddle.speed * 0.72 * dt;
    }

    leftPaddle.y = clamp(leftPaddle.y, 0, height - leftPaddle.height);
    rightPaddle.y = clamp(rightPaddle.y, 0, height - rightPaddle.height);
  }

  function updateBall(dt) {
    ball.x += ball.vx * dt;
    ball.y += ball.vy * dt;

    if (ball.y - ball.radius <= 0 || ball.y + ball.radius >= height) {
      ball.vy *= -1;
      ball.y = clamp(ball.y, ball.radius, height - ball.radius);
    }

    if (
      ball.x - ball.radius <= leftPaddle.x + leftPaddle.width &&
      ball.y >= leftPaddle.y &&
      ball.y <= leftPaddle.y + leftPaddle.height &&
      ball.x >= leftPaddle.x
    ) {
      ball.x = leftPaddle.x + leftPaddle.width + ball.radius;
      const impact = (ball.y - (leftPaddle.y + leftPaddle.height / 2)) / (leftPaddle.height / 2);
      ball.vx = Math.abs(ball.vx) + 18;
      ball.vy = impact * 260;
    }

    if (
      ball.x + ball.radius >= rightPaddle.x &&
      ball.y >= rightPaddle.y &&
      ball.y <= rightPaddle.y + rightPaddle.height &&
      ball.x <= rightPaddle.x + rightPaddle.width
    ) {
      ball.x = rightPaddle.x - ball.radius;
      const impact = (ball.y - (rightPaddle.y + rightPaddle.height / 2)) / (rightPaddle.height / 2);
      ball.vx = -Math.abs(ball.vx) - 18;
      ball.vy = impact * 260;
    }

    if (ball.x + ball.radius < 0) {
      rightScore += 1;
      updateScore();
      resetBall(1);
    }

    if (ball.x - ball.radius > width) {
      leftScore += 1;
      updateScore();
      resetBall(-1);
    }

    if (leftScore >= 7 || rightScore >= 7) {
      running = false;
      const winner = leftScore > rightScore ? 'Left player wins!' : 'Right player wins!';
      gameMessage.textContent = `${winner} Press Restart to play again.`;
    }
  }

  function drawField() {
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, width, height);

    ctx.strokeStyle = 'rgba(255,255,255,0.45)';
    ctx.lineWidth = 3;
    ctx.setLineDash([12, 12]);
    ctx.beginPath();
    ctx.moveTo(width / 2, 0);
    ctx.lineTo(width / 2, height);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(leftPaddle.x, leftPaddle.y, leftPaddle.width, leftPaddle.height);
    ctx.fillRect(rightPaddle.x, rightPaddle.y, rightPaddle.width, rightPaddle.height);

    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
    ctx.fill();
  }

  function loop(timestamp) {
    const dt = Math.min((timestamp - lastTime) / 1000 || 0.016, 0.025);
    lastTime = timestamp;

    if (running) {
      updatePaddles(dt);
      updateBall(dt);
    }

    drawField();
    requestAnimationFrame(loop);
  }

  function resetGame() {
    leftScore = 0;
    rightScore = 0;
    running = true;
    gameMessage.textContent = 'Press the arrow keys or W/S to rally the ball.';
    updateScore();
    resetBall(Math.random() > 0.5 ? 1 : -1);
    leftPaddle.y = height / 2 - leftPaddle.height / 2;
    rightPaddle.y = height / 2 - rightPaddle.height / 2;
  }

  document.addEventListener('keydown', (event) => {
    if (event.key in keys) {
      keys[event.key] = true;
    }
  });

  document.addEventListener('keyup', (event) => {
    if (event.key in keys) {
      keys[event.key] = false;
    }
  });

  restartButton.addEventListener('click', () => {
    resetGame();
  });

  resetGame();
  requestAnimationFrame(loop);
}
