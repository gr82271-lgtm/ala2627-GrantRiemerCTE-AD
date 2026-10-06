const canvas = document.getElementById('pong-canvas');
const scoreLeft = document.getElementById('score-left');
const scoreRight = document.getElementById('score-right');
const gameMessage = document.getElementById('game-message');
const abortButton = document.getElementById('abort-game');
const leftHackFill = document.getElementById('hack-bar-fill-left');
const rightHackFill = document.getElementById('hack-bar-fill-right');

if (canvas && scoreLeft && scoreRight && gameMessage && abortButton) {
  const ctx = canvas.getContext('2d');
  const width = canvas.width;
  const height = canvas.height;
  const activationHits = 3;
  const powerShotHits = 5;
  const roundGoal = 3;
  const hackDuration = 5;

  const leftPaddle = { x: 18, y: height / 2 - 55, width: 14, height: 110, baseSpeed: 430, speed: 430, vy: 0, activated: false, charge: 0, hackMeter: 0, distortionTimer: 0 };
  const rightPaddle = { x: width - 32, y: height / 2 - 55, width: 14, height: 110, baseSpeed: 430, speed: 430, vy: 0, activated: false, charge: 0, hackMeter: 0, distortionTimer: 0 };
  const hotColor = getComputedStyle(document.documentElement).getPropertyValue('--hot').trim();
  const ball = {
    x: width / 2,
    y: height / 2,
    radius: 10,
    baseRadius: 10,
    vx: 340,
    vy: 180,
    spin: 0,
    stuckTo: null,
    stickTimer: 0,
    storedSpeed: 0,
    decoyMode: false
  };
  const keys = { w: false, s: false, o: false, l: false };
  const particles = [];
  const decoyBalls = [];
  const marketplace = document.getElementById('powerup-marketplace');
  const powerUpCatalog = {
    'power-shot': {
      label: 'Power Shot',
      description: '5-hit charge. Launches at 3x speed for a stronger strike.'
    },
    decoy: {
      label: 'Decoy',
      description: '3-hit charge. Fires 1 red ball and 2 white decoys to confuse the opponent.'
    },
    'curve-shot': {
      label: 'Curve Shot',
      description: '50% faster launch. Adds a random 30-degree reverse curve to the ball.'
    }
  };

  const nonRarePowerUpCatalog = {
    'curve-ball': {
      label: 'Curve-Ball',
      description: 'Increase your curve.'
    },
    decoy: {
      label: 'Decoy',
      description: '3-hit charge. Fires 1 red ball and 2 white decoys to confuse the opponent.'
    },
    baloon: {
      label: 'Baloon',
      description: 'Increase the ball size by 5% when it is on your half.'
    },
    'quick-draw': {
      label: 'Quick Draw',
      description: 'Decrease time stuck to your paddle by 10%.'
    },
    'speed-up': {
      label: 'Speed Up',
      description: 'Increase your paddle speed.'
    }
  };
  let powerupButtons = document.querySelectorAll('.powerup-option');

  let leftScore = 0;
  let rightScore = 0;
  let roundNumber = 1;
  let leftPowerChoices = [];
  let rightPowerChoices = [];
  let running = true;
  let lastTime = 0;

  function getPowerChoicesForPaddle(paddle) {
    return paddle === leftPaddle ? leftPowerChoices : rightPowerChoices;
  }

  function getPowerChoiceForPaddle(paddle) {
    const choices = getPowerChoicesForPaddle(paddle);
    return choices.length > 0 ? choices[0] : null;
  }

  function hasPowerChoiceForPaddle(paddle, optionKey) {
    return getPowerChoicesForPaddle(paddle).includes(optionKey);
  }

  function getOpponentPaddle(paddle) {
    return paddle === leftPaddle ? rightPaddle : leftPaddle;
  }

  function updateHackBar(paddle) {
    const fillElement = paddle === leftPaddle ? leftHackFill : rightHackFill;
    if (!fillElement) return;
    const percent = Math.max(0, Math.min(100, (paddle.hackMeter / hackDuration) * 100));
    fillElement.style.width = `${percent}%`;
    const isActive = hasPowerChoiceForPaddle(paddle, 'hack') && paddle.activated;
    fillElement.parentElement.style.opacity = isActive ? '1' : '0';
  }

  function triggerScreenDistortion(paddle) {
    const opponent = getOpponentPaddle(paddle);
    opponent.distortionTimer = 2.5;
    gameMessage.textContent = `${paddle === leftPaddle ? 'Left' : 'Right'} side triggered a Hack! The other screen is distorted.`;
  }

  function activatePaddle(paddle) {
    const powerChoice = getPowerChoiceForPaddle(paddle);
    paddle.activated = true;
    paddle.charge = 0;
    if (powerChoice === 'hack' || hasPowerChoiceForPaddle(paddle, 'hack')) {
      paddle.hackMeter = 0;
      updateHackBar(paddle);
    }
  }

  function shuffleList(items) {
    const copy = [...items];
    for (let index = copy.length - 1; index > 0; index -= 1) {
      const swapIndex = Math.floor(Math.random() * (index + 1));
      [copy[index], copy[swapIndex]] = [copy[swapIndex], copy[index]];
    }
    return copy;
  }

  function getPowerupConfig(optionKey) {
    return powerUpCatalog[optionKey] || nonRarePowerUpCatalog[optionKey];
  }

  function createPowerupOption(side, optionKey) {
    const config = getPowerupConfig(optionKey);
    const details = document.createElement('details');
    details.className = 'powerup-option';
    details.dataset.side = side;
    details.dataset.option = optionKey;

    const summary = document.createElement('summary');
    summary.textContent = config.label;
    details.appendChild(summary);

    const description = document.createElement('div');
    description.className = 'powerup-description';
    description.textContent = config.description;
    details.appendChild(description);

    return details;
  }

  function renderMarketplace() {
    const sideLists = document.querySelectorAll('.market-side .powerup-list');
    const isStarterMarketplace = roundNumber === 1;
    const marketplaceTitle = document.getElementById('marketplace-title');
    if (marketplaceTitle) {
      marketplaceTitle.textContent = isStarterMarketplace ? 'Starter powerups' : 'Powerups';
    }

    sideLists.forEach((list, index) => {
      const side = index === 0 ? 'left' : 'right';
      list.innerHTML = '';

      const shopKeys = isStarterMarketplace
        ? shuffleList(Object.keys(powerUpCatalog))
        : shuffleList(Object.keys(nonRarePowerUpCatalog)).slice(0, 3);

      shopKeys.forEach((key) => {
        list.appendChild(createPowerupOption(side, key));
      });
    });

    powerupButtons = document.querySelectorAll('.powerup-option');
    powerupButtons.forEach((button) => {
      button.addEventListener('click', handlePowerUpChoice);
    });
  }

  function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
  }

  function resetBall(direction = 1) {
    ball.x = width / 2;
    ball.y = height / 2;
    ball.radius = ball.baseRadius;
    const vertical = (Math.random() * 2 - 1) * 180;
    const speed = 360;
    ball.vx = direction * speed;
    ball.vy = vertical;
    ball.spin = 0;
    ball.stuckTo = null;
    ball.stickTimer = 0;
    ball.storedSpeed = 0;
    ball.decoyMode = false;
    decoyBalls.length = 0;
  }

  function spawnParticles(x, y, color = hotColor) {
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

  function hideMarketplace() {
    if (marketplace) {
      marketplace.classList.add('hidden');
    }
  }

  function showMarketplace() {
    if (!marketplace) return;
    renderMarketplace();
    leftPowerChoices = [];
    rightPowerChoices = [];
    powerupButtons.forEach((button) => {
      button.classList.remove('selected');
      button.removeAttribute('open');
      button.disabled = false;
    });
    marketplace.classList.remove('hidden');
    running = false;
    const starterText = roundNumber === 1 ? 'Choose your starter powerups for each side.' : 'Choose one or more power-ups for each side.';
    gameMessage.textContent = `Round ${roundNumber} complete. ${starterText}`;
  }

  function startNextRound() {
    hideMarketplace();
    roundNumber += 1;
    leftScore = 0;
    rightScore = 0;
    running = true;
    gameMessage.textContent = `Round ${roundNumber - 1} complete. Next round is live.`;
    updateScore();
    resetBall(Math.random() > 0.5 ? 1 : -1);
    leftPaddle.y = height / 2 - leftPaddle.height / 2;
    rightPaddle.y = height / 2 - rightPaddle.height / 2;
    leftPaddle.vy = 0;
    rightPaddle.vy = 0;
    leftPaddle.activated = false;
    rightPaddle.activated = false;
    leftPaddle.charge = 0;
    rightPaddle.charge = 0;
  }

  function closePowerupMarket() {
    hideMarketplace();
    roundNumber += 1;
    running = true;
    leftPaddle.hackMeter = 0;
    rightPaddle.hackMeter = 0;
    leftPaddle.distortionTimer = 0;
    rightPaddle.distortionTimer = 0;
    canvas.style.filter = '';
    gameMessage.textContent = `Round ${roundNumber} — First to ${roundGoal} points. Left activation: ${hitsToCharge(leftPaddle)} hits; right activation: ${hitsToCharge(rightPaddle)} hits.`;
    leftScore = 0;
    rightScore = 0;
    updateScore();
    resetBall(Math.random() > 0.5 ? 1 : -1);
    leftPaddle.y = height / 2 - leftPaddle.height / 2;
    rightPaddle.y = height / 2 - rightPaddle.height / 2;
    leftPaddle.vy = 0;
    rightPaddle.vy = 0;
    leftPaddle.activated = false;
    rightPaddle.activated = false;
    leftPaddle.charge = 0;
    rightPaddle.charge = 0;
    updateHackBar(leftPaddle);
    updateHackBar(rightPaddle);
  }

  function handlePowerUpChoice(event) {
    const button = event.currentTarget;
    const side = button.dataset.side;
    const value = button.dataset.option;
    const targetChoices = side === 'left' ? leftPowerChoices : rightPowerChoices;
    const alreadySelected = targetChoices.includes(value);

    if (alreadySelected) {
      const index = targetChoices.indexOf(value);
      targetChoices.splice(index, 1);
      button.classList.remove('selected');
    } else {
      targetChoices.push(value);
      button.classList.add('selected');
    }

    if (leftPowerChoices.length > 0 && rightPowerChoices.length > 0) {
      setTimeout(() => {
        closePowerupMarket();
      }, 180);
    }
  }

  function updatePaddles(dt) {
    const leftMove = (keys.w ? -1 : 0) + (keys.s ? 1 : 0);
    const rightMove = (keys.o ? -1 : 0) + (keys.l ? 1 : 0);

    const leftY = leftPaddle.y;
    const rightY = rightPaddle.y;

    const leftSpeedBoost = hasPowerChoiceForPaddle(leftPaddle, 'speed-up') ? 1.2 : 1;
    const rightSpeedBoost = hasPowerChoiceForPaddle(rightPaddle, 'speed-up') ? 1.2 : 1;

    leftPaddle.speed = leftPaddle.baseSpeed * leftSpeedBoost;
    rightPaddle.speed = rightPaddle.baseSpeed * rightSpeedBoost;

    leftPaddle.y = clamp(leftPaddle.y + leftMove * leftPaddle.speed * dt, 0, height - leftPaddle.height);
    rightPaddle.y = clamp(rightPaddle.y + rightMove * rightPaddle.speed * dt, 0, height - rightPaddle.height);
    leftPaddle.vy = (leftPaddle.y - leftY) / dt;
    rightPaddle.vy = (rightPaddle.y - rightY) / dt;
  }

  function applyPaddleSpin(paddle) {
    ball.spin = -paddle.vy * 1.8;
  }

  function hitsToCharge(paddle) {
    return hasPowerChoiceForPaddle(paddle, 'power-shot') ? powerShotHits : activationHits;
  }

  function chargePaddle(paddle) {
    paddle.charge = Math.min(paddle.charge + 1, hitsToCharge(paddle));
  }

  function updateHackMeter(dt) {
    [leftPaddle, rightPaddle].forEach((paddle) => {
      const powerChoice = getPowerChoiceForPaddle(paddle);
    if ((!hasPowerChoiceForPaddle(paddle, 'hack') && powerChoice !== 'hack') || !paddle.activated) {
        updateHackBar(paddle);
        return;
      }

      paddle.hackMeter = Math.min(paddle.hackMeter + dt, hackDuration);
      updateHackBar(paddle);

      if (paddle.hackMeter >= hackDuration) {
        triggerScreenDistortion(paddle);
        paddle.activated = false;
        paddle.hackMeter = 0;
        updateHackBar(paddle);
      }
    });

    if (leftPaddle.distortionTimer > 0) {
      leftPaddle.distortionTimer = Math.max(0, leftPaddle.distortionTimer - dt);
    }
    if (rightPaddle.distortionTimer > 0) {
      rightPaddle.distortionTimer = Math.max(0, rightPaddle.distortionTimer - dt);
    }

    if (leftPaddle.distortionTimer > 0 || rightPaddle.distortionTimer > 0) {
      canvas.style.filter = 'saturate(1.5) contrast(1.2) hue-rotate(18deg) blur(0.7px)';
    } else {
      canvas.style.filter = '';
    }
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

  function updateDecoyBalls(dt) {
    for (let index = decoyBalls.length - 1; index >= 0; index -= 1) {
      const decoy = decoyBalls[index];
      decoy.x += decoy.vx * dt;
      decoy.y += decoy.vy * dt;

      if (decoy.y - decoy.radius <= 0 || decoy.y + decoy.radius >= height) {
        decoy.vy *= -1;
        decoy.y = clamp(decoy.y, decoy.radius, height - decoy.radius);
      }

      if (decoy.x + decoy.radius < 0 || decoy.x - decoy.radius > width) {
        decoyBalls.splice(index, 1);
      }
    }
  }

  function releaseStuckBall(paddle) {
    const currentSpeed = Math.max(ball.storedSpeed || Math.hypot(ball.vx, ball.vy), 1);
    const direction = paddle === leftPaddle ? 1 : -1;
    const impact = (ball.y - (paddle.y + paddle.height / 2)) / (paddle.height / 2);
    const hasPowerShot = hasPowerChoiceForPaddle(paddle, 'power-shot');
    const hasDecoy = hasPowerChoiceForPaddle(paddle, 'decoy');
    const hasCurveShot = hasPowerChoiceForPaddle(paddle, 'curve-shot');
    const hasCurveBall = hasPowerChoiceForPaddle(paddle, 'curve-ball');
    const releaseMultiplier = hasPowerShot ? 3 : hasDecoy ? 1 : hasCurveShot ? 1.5 : hasCurveBall ? 1.8 : 2;
    const releaseSpeed = currentSpeed * releaseMultiplier;
    const launchAngle = Math.atan(impact * 0.7);
    let releaseSpin = 0;

    decoyBalls.length = 0;
    ball.decoyMode = hasDecoy;
    if (ball.decoyMode) {
      const launchAngles = [-0.45, 0, 0.45].map((offset) => launchAngle + offset);
      for (let index = launchAngles.length - 1; index > 0; index -= 1) {
        const swapIndex = Math.floor(Math.random() * (index + 1));
        [launchAngles[index], launchAngles[swapIndex]] = [launchAngles[swapIndex], launchAngles[index]];
      }
      const redBallIndex = Math.floor(Math.random() * launchAngles.length);

      launchAngles.forEach((angle, index) => {
        const vx = direction * releaseSpeed * Math.cos(angle);
        const vy = releaseSpeed * Math.sin(angle);
        if (index === redBallIndex) {
          ball.vx = vx;
          ball.vy = vy;
        } else {
          decoyBalls.push({ x: ball.x, y: ball.y, radius: ball.radius, vx, vy });
        }
      });
    } else if (hasPowerShot) {
      ball.vx = direction * releaseSpeed * Math.cos(launchAngle);
      ball.vy = releaseSpeed * Math.sin(launchAngle);
    } else if (hasCurveShot || hasCurveBall) {
      const curveDirection = Math.random() < 0.5 ? -1 : 1;
      const curveAngle = hasCurveBall ? Math.PI / 5 : Math.PI / 6;
      ball.vx = direction * releaseSpeed * Math.cos(curveAngle);
      ball.vy = curveDirection * releaseSpeed * Math.sin(curveAngle);
      releaseSpin = -curveDirection * releaseSpeed * (hasCurveBall ? 3.4 : 2.5);
    } else {
      ball.vx = direction * releaseSpeed;
      ball.vy = impact * releaseSpeed * 0.7;
    }
    ball.spin = releaseSpin;
    ball.stuckTo = null;
    ball.stickTimer = 0;
    ball.storedSpeed = 0;
    spawnParticles(ball.x, ball.y, hotColor);
  }

  function updateBallSizeForPowerups() {
    const leftBalloon = hasPowerChoiceForPaddle(leftPaddle, 'baloon');
    const rightBalloon = hasPowerChoiceForPaddle(rightPaddle, 'baloon');
    const inLeftHalf = ball.x < width / 2;
    const inRightHalf = ball.x > width / 2;

    if ((leftBalloon && inLeftHalf) || (rightBalloon && inRightHalf)) {
      ball.radius = ball.baseRadius * 1.05;
      return;
    }

    if (leftBalloon || rightBalloon) {
      ball.radius = ball.baseRadius * 0.95;
      return;
    }

    ball.radius = ball.baseRadius;
  }

  function updateBall(dt) {
    if (ball.stuckTo) {
      const paddle = ball.stuckTo;
      const controlDirection = paddle === leftPaddle
        ? (keys.w ? -1 : 0) + (keys.s ? 1 : 0)
        : (keys.o ? -1 : 0) + (keys.l ? 1 : 0);
      ball.x = paddle === leftPaddle ? paddle.x + paddle.width + ball.radius : paddle.x - ball.radius;
      ball.y = paddle.y + paddle.height / 2;
      ball.vx = 0;
      ball.vy = 0;
      if (hasPowerChoiceForPaddle(paddle, 'drone')) {
        ball.y = clamp(ball.y + controlDirection * 240 * dt, ball.radius, height - ball.radius);
        ball.vy = controlDirection * 260;
      }
      ball.stickTimer -= dt;

      if (ball.stickTimer <= 0) {
        releaseStuckBall(paddle);
      }
      return;
    }

    ball.vy += ball.spin * dt;
    ball.spin *= Math.exp(-1.3 * dt);
    ball.x += ball.vx * dt;
    ball.y += ball.vy * dt;
    updateBallSizeForPowerups();

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
      if (leftPaddle.activated && hasPowerChoiceForPaddle(leftPaddle, 'hack')) {
        ball.x = leftPaddle.x + leftPaddle.width + ball.radius;
        const impact = (ball.y - (leftPaddle.y + leftPaddle.height / 2)) / (leftPaddle.height / 2);
        ball.vx = Math.abs(ball.vx) + 18;
        ball.vy = impact * 260;
        leftPaddle.activated = false;
        leftPaddle.hackMeter = 0;
        updateHackBar(leftPaddle);
        applyPaddleSpin(leftPaddle);
        chargePaddle(leftPaddle);
        return;
      }

      if (leftPaddle.activated) {
        ball.stuckTo = leftPaddle;
        ball.stickTimer = hasPowerChoiceForPaddle(leftPaddle, 'quick-draw') ? 0.9 : 1;
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
      chargePaddle(leftPaddle);
    }

    if (
      ball.x + ball.radius >= rightPaddle.x &&
      ball.y >= rightPaddle.y &&
      ball.y <= rightPaddle.y + rightPaddle.height &&
      ball.x <= rightPaddle.x + rightPaddle.width
    ) {
      if (rightPaddle.activated && hasPowerChoiceForPaddle(rightPaddle, 'hack')) {
        ball.x = rightPaddle.x - ball.radius;
        const impact = (ball.y - (rightPaddle.y + rightPaddle.height / 2)) / (rightPaddle.height / 2);
        ball.vx = -Math.abs(ball.vx) - 18;
        ball.vy = impact * 260;
        rightPaddle.activated = false;
        rightPaddle.hackMeter = 0;
        updateHackBar(rightPaddle);
        applyPaddleSpin(rightPaddle);
        chargePaddle(rightPaddle);
        return;
      }

      if (rightPaddle.activated) {
        ball.stuckTo = rightPaddle;
        ball.stickTimer = hasPowerChoiceForPaddle(rightPaddle, 'quick-draw') ? 0.9 : 1;
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
      chargePaddle(rightPaddle);
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

    if (leftScore >= roundGoal || rightScore >= roundGoal) {
      const roundWinner = leftScore > rightScore ? 'left' : 'right';
      running = false;
      gameMessage.textContent = `${roundWinner === 'left' ? 'Left' : 'Right'} side wins round ${roundNumber}. Choose a power-up for the next round.`;
      showMarketplace();
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

    [leftPaddle, rightPaddle].forEach((paddle) => {
      ctx.fillStyle = paddle.activated ? hotColor : '#f8fafc';
      ctx.fillRect(paddle.x, paddle.y, paddle.width, paddle.height);
      ctx.fillStyle = 'rgba(15, 23, 42, 0.28)';
      ctx.fillRect(paddle.x + 5, paddle.y + 3, 4, paddle.height - 6);
      ctx.fillStyle = hotColor;
      const chargeHeight = (paddle.height - 6) * (paddle.charge / hitsToCharge(paddle));
      ctx.fillRect(paddle.x + 5, paddle.y + paddle.height - 3 - chargeHeight, 4, chargeHeight);
    });

    drawParticles();

    ctx.fillStyle = '#f8fafc';
    decoyBalls.forEach((decoy) => {
      ctx.beginPath();
      ctx.arc(decoy.x, decoy.y, decoy.radius, 0, Math.PI * 2);
      ctx.fill();
    });

    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
    ctx.fillStyle = ball.decoyMode ? '#ef4444' : '#f8fafc';
    ctx.fill();
  }

  function loop(timestamp) {
    const dt = Math.min((timestamp - lastTime) / 1000 || 0.016, 0.025);
    lastTime = timestamp;

    if (running) {
      updatePaddles(dt);
      updateHackMeter(dt);
      updateBall(dt);
      updateDecoyBalls(dt);
    }

    updateParticles(dt);
    drawField();
    requestAnimationFrame(loop);
  }

  function resetGame() {
    leftScore = 0;
    rightScore = 0;
    roundNumber = 1;
    leftPowerChoices = [];
    rightPowerChoices = [];
    running = true;
    particles.length = 0;
    leftPaddle.hackMeter = 0;
    rightPaddle.hackMeter = 0;
    leftPaddle.distortionTimer = 0;
    rightPaddle.distortionTimer = 0;
    canvas.style.filter = '';
    hideMarketplace();
    gameMessage.textContent = `Round ${roundNumber} — First to ${roundGoal} points. Hit ${activationHits} times to charge activation (Power Shot: ${powerShotHits}). Left: W/S move, D activate. Right: O/L move, K activate.`;
    updateScore();
    resetBall(Math.random() > 0.5 ? 1 : -1);
    leftPaddle.y = height / 2 - leftPaddle.height / 2;
    rightPaddle.y = height / 2 - rightPaddle.height / 2;
    leftPaddle.vy = 0;
    rightPaddle.vy = 0;
    leftPaddle.activated = false;
    rightPaddle.activated = false;
    leftPaddle.charge = 0;
    rightPaddle.charge = 0;
    updateHackBar(leftPaddle);
    updateHackBar(rightPaddle);
  }

  renderMarketplace();

  document.addEventListener('keydown', (event) => {
    const key = event.key.length === 1 ? event.key.toLowerCase() : event.key;
    if (event.repeat) {
      if (key in keys) {
        keys[key] = true;
      }
      return;
    }
    if (key === 'd' && leftPaddle.charge === hitsToCharge(leftPaddle)) {
      activatePaddle(leftPaddle);
    }
    if (key === 'k' && rightPaddle.charge === hitsToCharge(rightPaddle)) {
      activatePaddle(rightPaddle);
    }
    if (key in keys) {
      keys[key] = true;
    }
  });

  document.addEventListener('keyup', (event) => {
    const key = event.key.length === 1 ? event.key.toLowerCase() : event.key;
    if (key === 'd' && !hasPowerChoiceForPaddle(leftPaddle, 'hack')) leftPaddle.activated = false;
    if (key === 'k' && !hasPowerChoiceForPaddle(rightPaddle, 'hack')) rightPaddle.activated = false;
    if (key in keys) {
      keys[key] = false;
    }
  });

  abortButton.addEventListener('click', () => {
    resetGame();
  });

  resetGame();
  requestAnimationFrame(loop);
}
