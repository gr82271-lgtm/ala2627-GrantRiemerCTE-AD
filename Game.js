const leftButton = document.querySelector('.game-button-left');
const rightButton = document.querySelector('.game-button-right');
const gameMessage = document.getElementById('game-message');
const inventory = document.getElementById('inventory');

if (leftButton && rightButton && gameMessage && inventory) {
  let hasKey = false;
  let isUnlocked = false;

  leftButton.addEventListener('click', () => {
    if (isUnlocked) {
      gameMessage.textContent = 'The vault is already open. You win.';
      return;
    }

    if (!hasKey) {
      hasKey = true;
      inventory.textContent = 'Bronze key';
      gameMessage.textContent = 'You found the bronze key hidden under a loose tile. The vault can open now.';
      return;
    }

    gameMessage.textContent = 'You already found the key. It is in your pocket and ready to use.';
  });

  rightButton.addEventListener('click', () => {
    if (isUnlocked) {
      gameMessage.textContent = 'The vault is already open. You have won the round.';
      return;
    }

    if (!hasKey) {
      gameMessage.textContent = 'The vault stays locked. Search for the hidden key first.';
      return;
    }

    isUnlocked = true;
    inventory.textContent = 'Bronze key + prize';
    leftButton.disabled = true;
    rightButton.textContent = 'Unlocked';
    rightButton.disabled = true;
    gameMessage.textContent = 'You unlock the vault and claim the prize. You win!';
  });
}
