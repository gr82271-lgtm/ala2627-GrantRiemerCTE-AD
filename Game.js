const leftButton = document.querySelector('.game-button-left');
const rightButton = document.querySelector('.game-button-right');
const gameTitle = document.getElementById('game-title');
const gameMessage = document.getElementById('game-message');
const inventory = document.getElementById('inventory');

if (leftButton && rightButton && gameTitle && gameMessage && inventory) {
  let room = 'hall';
  let hasKey = false;
  let isUnlocked = false;
  let moves = 0;

  const updateInventory = () => {
    inventory.textContent = hasKey ? 'Bronze key' : 'Empty';
  };

  const setButtons = (leftText, rightText) => {
    leftButton.textContent = leftText;
    rightButton.textContent = rightText;
  };

  const showIntro = () => {
    gameTitle.textContent = 'The Vault';
    gameMessage.textContent = 'You stand in a dusty hall. A rug sits in the middle of the floor and a steel door is north.';
    setButtons('Search', 'North');
    updateInventory();
  };

  leftButton.addEventListener('click', () => {
    moves += 1;

    if (isUnlocked) {
      gameMessage.textContent = 'The vault is already open. You win!';
      return;
    }

    if (room === 'hall') {
      if (!hasKey) {
        hasKey = true;
        updateInventory();
        gameMessage.textContent = 'You lift the rug and find a brass key hidden underneath. The vault can be opened now.';
        setButtons('Look', 'North');
      } else {
        gameMessage.textContent = 'You already found the key. It is tucked safely in your pocket.';
      }
      return;
    }

    if (room === 'vault') {
      if (!hasKey) {
        gameMessage.textContent = 'The vault door is locked tight. You need the key from the hall.';
      } else {
        isUnlocked = true;
        gameTitle.textContent = 'You Win';
        inventory.textContent = 'Bronze key + prize';
        leftButton.disabled = true;
        rightButton.disabled = true;
        rightButton.textContent = 'Unlocked';
        leftButton.textContent = 'Finished';
        gameMessage.textContent = 'The key turns, the vault opens, and a prize is waiting inside. You win in ' + moves + ' moves!';
      }
    }
  });

  rightButton.addEventListener('click', () => {
    moves += 1;

    if (isUnlocked) {
      gameMessage.textContent = 'The vault is already open. You have already won.';
      return;
    }

    if (room === 'hall') {
      room = 'vault';
      gameMessage.textContent = 'You walk through the open doorway into the vault chamber. The metal door grinds shut behind you.';
      setButtons('Look', 'Open');
      return;
    }

    if (room === 'vault') {
      if (!hasKey) {
        gameMessage.textContent = 'The vault is locked. Search the hall for the key before trying to open it.';
      } else {
        isUnlocked = true;
        gameTitle.textContent = 'You Win';
        inventory.textContent = 'Bronze key + prize';
        leftButton.disabled = true;
        rightButton.disabled = true;
        rightButton.textContent = 'Unlocked';
        leftButton.textContent = 'Finished';
        gameMessage.textContent = 'You slide the key into the lock and hear a deep click. The vault opens. You win!';
      }
    }
  });

  showIntro();
}
