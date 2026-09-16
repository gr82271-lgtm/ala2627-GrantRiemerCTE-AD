const leftButton = document.querySelector('.game-button-left');
const rightButton = document.querySelector('.game-button-right');
const gameTitle = document.getElementById('game-title');
const gameMessage = document.getElementById('game-message');
const inventory = document.getElementById('inventory');

if (leftButton && rightButton && gameTitle && gameMessage && inventory) {
  const state = {
    leftY: 120,
    rightY: 120,
    ballX: 240,
    ballY: 120,
    ballVX: 4,
    ballVY: 2,
    leftScore: 0,
    rightScore: 0,
    gameRunning: true,
  };

  const board = {
    width: 480,
    height: 240,
    paddleHeight: 70,
    paddleWidth: 14,
    ballSize: 12,
  };

  const setButtons = (leftText, rightText) => {
    leftButton.textContent = leftText;
    rightButton.textContent = rightText;
  };

  const updateHud = () => {
    inventory.textContent = `${state.leftScore} - ${state.rightScore}`;
    gameTitle.textContent = 'Pong';
    gameMessage.textContent = 'Use the left paddle to block the ball. First to 5 wins.';
  };

  const resetBall = () => {
    state.ballX = board.width / 2;
    state.ballY = board.height / 2;
    state.ballVX = (Math.random() > 0.5 ? 1 : -1) * 4;
    state.ballVY = (Math.random() * 2 - 1) * 3;
  };

  const checkScore = () => {
    if (state.ballX < 0) {
      state.rightScore += 1;
      resetBall();
    }

    if (state.ballX > board.width) {
      state.leftScore += 1;
      resetBall();
    }

    if (state.leftScore >= 5 || state.rightScore >= 5) {
      state.gameRunning = false;
      leftButton.disabled = true;
      rightButton.disabled = true;
      leftButton.textContent = 'Reset';
      rightButton.textContent = 'Reset';
      const winner = state.leftScore >= 5 ? 'Left player wins!' : 'Right player wins!';
      gameMessage.textContent = `${winner} Hit reset to play again.`;
    }

    updateHud();
  };

  const tick = () => {
    if (!state.gameRunning) return;

    state.ballX += state.ballVX;
    state.ballY += state.ballVY;

    if (state.ballY <= 0 || state.ballY >= board.height - board.ballSize) {
      state.ballVY *= -1;
    }

    const leftHit =
      state.ballX <= board.paddleWidth &&
      state.ballY >= state.leftY &&
      state.ballY <= state.leftY + board.paddleHeight;

    const rightHit =
      state.ballX + board.ballSize >= board.width - board.paddleWidth &&
      state.ballY >= state.rightY &&
      state.ballY <= state.rightY + board.paddleHeight;

    if (leftHit || rightHit) {
      state.ballVX *= -1.12;
      state.ballVY += (Math.random() - 0.5) * 2;
      state.ballX = leftHit ? board.paddleWidth : board.width - board.paddleWidth - board.ballSize;
    }

    if (state.ballX < -20 || state.ballX > board.width + 20) {
      checkScore();
    }
  };

  leftButton.addEventListener('click', () => {
    if (!state.gameRunning) {
      state.leftScore = 0;
      state.rightScore = 0;
      state.gameRunning = true;
      leftButton.disabled = false;
      rightButton.disabled = false;
      resetBall();
      updateHud();
      gameMessage.textContent = 'New match. First to 5 wins.';
      return;
    }

    state.leftY = Math.max(0, state.leftY - 24);
    tick();
  });

  rightButton.addEventListener('click', () => {
    if (!state.gameRunning) {
      state.leftScore = 0;
      state.rightScore = 0;
      state.gameRunning = true;
      leftButton.disabled = false;
      rightButton.disabled = false;
      resetBall();
      updateHud();
      gameMessage.textContent = 'New match. First to 5 wins.';
      return;
    }

    state.rightY = Math.max(0, state.rightY - 24);
    tick();
  });

  setButtons('Move up', 'Move up');
  updateHud();
  resetBall();

  setInterval(() => {
    if (state.gameRunning) {
      state.leftY += (state.ballY > state.leftY + 35) ? 2.2 : -2.2;
      state.rightY += (state.ballY > state.rightY + 35) ? 2.2 : -2.2;
      state.leftY = Math.max(0, Math.min(board.height - board.paddleHeight, state.leftY));
      state.rightY = Math.max(0, Math.min(board.height - board.paddleHeight, state.rightY));
      tick();
    }
  }, 30);
}
