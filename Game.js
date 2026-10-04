const canvas = document.getElementById('pong-canvas');
const scoreLeft = document.getElementById('score-left');
const scoreRight = document.getElementById('score-right');
const gameMessage = document.getElementById('game-message');
const restartButton = document.getElementById('restart-pong');

if (canvas && scoreLeft && scoreRight && gameMessage && restartButton) {
  const ctx = canvas.getContext('2d');
  const width = canvas.width;
  const height = canvas.height;

  const leftPaddle = { x: 18, y: height / 2 - 55, width: 14, height: 110, speed: 430, vy: 0, activated: false };
  const rightPaddle = { x: width - 32, y: height / 2 - 55, width: 14, height: 110, speed: 430, vy: 0, activated: false };
  const hotColor = getComputedStyle(document.documentElement).getPropertyValue('--hot').trim();
  const ball = {
    x: width / 2,
    y: height / 2,
    radius: 10,
    vx: 340,
    vy: 180,
    spin: 0,
    stuckTo: null,
    stickTimer: 0,
    storedSpeed: 0
  };
  const keys = { w: false, s: false, o: false, l: false };
  const particles = [];

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
    ball.spin = 0;
    ball.stuckTo = null;
    ball.stickTimer = 0;
    ball.storedSpeed = 0;
  }

  function spawnParticles(x, y, color = '#f8fafc') {
    for (let i = 0; i < 12; i += 1) {
      particles.push({
        x,
        y,
        vx: (Math.random() - 0.5) * 180,
        vy: (Math.random() - 0.5) * 160,
        life: 0.4 + Math.random() * 0.35,
        maxLife: 0.4 + Math.random() * 0.35,
        size: 2 + Math.random() * 3,
        color
      });
    }
  }

  function updateScore() {
    scoreLeft.textContent = String(leftScore);
    scoreRight.textContent = String(rightScore);
  }

  function updatePaddles(dt) {
    const leftDir = (keys.w ? -1 : 0) + (keys.s ? 1 : 0);
    const rightDir = (keys.o ? -1 : 0) + (keys.l ? 1 : 0);

    const leftY = leftPaddle.y;
    const rightY = rightPaddle.y;

    leftPaddle.y = clamp(leftPaddle.y + leftDir * leftPaddle.speed * dt, 0, height - leftPaddle.height);
    rightPaddle.y = clamp(rightPaddle.y + rightDir * rightPaddle.speed * dt, 0, height - rightPaddle.height);
    leftPaddle.vy = (leftPaddle.y - leftY) / dt;
    rightPaddle.vy = (rightPaddle.y - rightY) / dt;
  }

  function applyPaddleSpin(paddle) {
    ball.spin = -paddle.vy * 1.8;
  }

  function updateParticles(dt) {
    for (let i = particles.length - 1; i >= 0; i -= 1) {
      const particle = particles[i];
      particle.life -= dt;
      particle.x += particle.vx * dt;
      particle.y += particle.vy * dt;
      particle.vy += 90 * dt;

      if (particle.life <= 0) {
        particles.splice(i, 1);
      }
    }
  }

  function updateBall(dt) {
    if (ball.stuckTo) {
      const paddle = ball.stuckTo;
      ball.x = paddle === leftPaddle ? paddle.x + paddle.width + ball.radius : paddle.x - ball.radius;
      ball.y = paddle.y + paddle.height / 2;
      ball.vx = 0;
      ball.vy = 0;
      ball.stickTimer -= dt;

      if (ball.stickTimer <= 0) {
        const direction = paddle === leftPaddle ? 1 : -1;
        const releaseSpeed = Math.max(ball.storedSpeed * 2, 360);
        ball.vx = direction * releaseSpeed;
        ball.vy = 0;
        ball.spin = 0;
        ball.stuckTo = null;
        ball.stickTimer = 0;
        ball.storedSpeed = 0;
        spawnParticles(ball.x, ball.y);
      }
      return;
    }

    ball.vy += ball.spin * dt;
    ball.spin *= Math.exp(-1.3 * dt);
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
      if (leftPaddle.activated) {
        ball.stuckTo = leftPaddle;
        ball.stickTimer = 1;
        ball.storedSpeed = Math.hypot(ball.vx, ball.vy);
        ball.vx = 0;
        ball.vy = 0;
        ball.x = leftPaddle.x + leftPaddle.width + ball.radius;
        ball.y = leftPaddle.y + leftPaddle.height / 2;
        return;
      }

      ball.x = leftPaddle.x + leftPaddle.width + ball.radius;
      const impact = (ball.y - (leftPaddle.y + leftPaddle.height / 2)) / (leftPaddle.height / 2);
      ball.vx = Math.abs(ball.vx) + 18;
      ball.vy = impact * 260;
      applyPaddleSpin(leftPaddle);
    }

    if (
      ball.x + ball.radius >= rightPaddle.x &&
      ball.y >= rightPaddle.y &&
      ball.y <= rightPaddle.y + rightPaddle.height &&
      ball.x <= rightPaddle.x + rightPaddle.width
    ) {
      if (rightPaddle.activated) {
        ball.stuckTo = rightPaddle;
        ball.stickTimer = 1;
        ball.storedSpeed = Math.hypot(ball.vx, ball.vy);
        ball.vx = 0;
        ball.vy = 0;
        ball.x = rightPaddle.x - ball.radius;
        ball.y = rightPaddle.y + rightPaddle.height / 2;
        return;
      }

      ball.x = rightPaddle.x - ball.radius;
      const impact = (ball.y - (rightPaddle.y + rightPaddle.height / 2)) / (rightPaddle.height / 2);
      ball.vx = -Math.abs(ball.vx) - 18;
      ball.vy = impact * 260;
      applyPaddleSpin(rightPaddle);
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

  function drawParticles() {
    for (const particle of particles) {
      const alpha = Math.max(particle.life / particle.maxLife, 0);
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.fillStyle = particle.color;
      ctx.fillRect(particle.x, particle.y, particle.size, particle.size);
      ctx.restore();
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

    ctx.fillStyle = leftPaddle.activated ? hotColor : '#f8fafc';
    ctx.fillRect(leftPaddle.x, leftPaddle.y, leftPaddle.width, leftPaddle.height);
    ctx.fillStyle = rightPaddle.activated ? hotColor : '#f8fafc';
    ctx.fillRect(rightPaddle.x, rightPaddle.y, rightPaddle.width, rightPaddle.height);

    drawParticles();

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

    updateParticles(dt);
    drawField();
    requestAnimationFrame(loop);
  }

  function resetGame() {
    leftScore = 0;
    rightScore = 0;
    running = true;
    particles.length = 0;
    gameMessage.textContent = 'Left: W/S move, D activate. Right: O/L move, K activate. Moving paddles add reverse spin.';
    updateScore();
    resetBall(Math.random() > 0.5 ? 1 : -1);
    leftPaddle.y = height / 2 - leftPaddle.height / 2;
    rightPaddle.y = height / 2 - rightPaddle.height / 2;
    leftPaddle.vy = 0;
    rightPaddle.vy = 0;
  }

  document.addEventListener('keydown', (event) => {
    const key = event.key.length === 1 ? event.key.toLowerCase() : event.key;
    if (key === 'd') leftPaddle.activated = true;
    if (key === 'k') rightPaddle.activated = true;
    if (key in keys) {
      keys[key] = true;
    }
  });

  document.addEventListener('keyup', (event) => {
    const key = event.key.length === 1 ? event.key.toLowerCase() : event.key;
    if (key === 'd') leftPaddle.activated = false;
    if (key === 'k') rightPaddle.activated = false;
    if (key in keys) {
      keys[key] = false;
    }
  });

  restartButton.addEventListener('click', () => {
    resetGame();
  });

  resetGame();
  requestAnimationFrame(loop);
}
