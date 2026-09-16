const style = document.createElement('style');
style.textContent = `
  * {
    box-sizing: border-box;
  }

  html, body {
    margin: 0;
    width: 100%;
    height: 100%;
    font-family: Arial, sans-serif;
    background: linear-gradient(180deg, #0f172a 0%, #111827 100%);
  }

  body {
    display: flex;
    align-items: stretch;
    justify-content: center;
    overflow: hidden;
  }

  .game-screen {
    position: relative;
    width: 100vw;
    height: 100vh;
    background: linear-gradient(180deg, #0b1220 0%, #111827 100%);
  }

  .window-panel {
    position: absolute;
    top: 60px;
    left: 50%;
    transform: translateX(-50%);
    width: min(80vw, 900px);
    height: 260px;
    background: rgba(255, 255, 255, 0.12);
    border: 3px solid rgba(255, 255, 255, 0.3);
    border-radius: 18px;
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.35);
    backdrop-filter: blur(8px);
  }

  .window-panel::before {
    content: "";
    position: absolute;
    inset: 16px;
    border-radius: 12px;
    border: 2px solid rgba(255, 255, 255, 0.12);
  }

  .action-button {
    position: absolute;
    bottom: 28px;
    width: 180px;
    height: 58px;
    border: none;
    border-radius: 999px;
    font-size: 1.1rem;
    font-weight: 700;
    color: white;
    background: linear-gradient(135deg, #38bdf8, #2563eb);
    box-shadow: 0 12px 25px rgba(37, 99, 235, 0.45);
    cursor: pointer;
    transition: transform 0.2s ease, box-shadow 0.2s ease;
  }

  .action-button:hover {
    transform: translateY(-2px);
    box-shadow: 0 15px 28px rgba(37, 99, 235, 0.6);
  }

  .action-button:active {
    transform: translateY(0);
  }

  .left-button {
    left: 30px;
  }

  .right-button {
    right: 30px;
    background: linear-gradient(135deg, #f59e0b, #f97316);
    box-shadow: 0 12px 25px rgba(249, 115, 22, 0.45);
  }

  .right-button:hover {
    box-shadow: 0 15px 28px rgba(249, 115, 22, 0.6);
  }
`;
document.head.appendChild(style);

const screen = document.createElement('div');
screen.className = 'game-screen';

const windowPanel = document.createElement('div');
windowPanel.className = 'window-panel';
windowPanel.setAttribute('aria-label', 'Large centered window');

const leftButton = document.createElement('button');
leftButton.type = 'button';
leftButton.className = 'action-button left-button';
leftButton.textContent = 'Left';

const rightButton = document.createElement('button');
rightButton.type = 'button';
rightButton.className = 'action-button right-button';
rightButton.textContent = 'Right';

screen.appendChild(windowPanel);
screen.appendChild(leftButton);
screen.appendChild(rightButton);
document.body.appendChild(screen);
