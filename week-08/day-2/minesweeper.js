const boardEl = document.getElementById('board');
const statusEl = document.getElementById('status');
const resetBtn = document.getElementById('reset');
const mineCounterEl = document.getElementById('mine-count');
const modeButtons = document.querySelectorAll('.mode-btn');

const difficultySettings = {
  easy: { rows: 9, cols: 9, mineCount: 10, label: 'Easy' },
  medium: { rows: 12, cols: 12, mineCount: 18, label: 'Medium' },
  hard: { rows: 25, cols: 25, mineCount: Math.floor((25 * 25) / 3), label: 'Hard' },
};

let rows = difficultySettings.hard.rows;
let cols = difficultySettings.hard.cols;
let mineCount = difficultySettings.hard.mineCount;
let currentMode = 'hard';

let board = [];
let firstMove = true;
let gameOver = false;
let selectedCell = null;
let audioCtx = null;

function getAudioContext() {
  if (!audioCtx) {
    const AudioCtor = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtor) return null;
    audioCtx = new AudioCtor();
  }

  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }

  return audioCtx;
}

function playTone(frequency, duration, type = 'sine', volume = 0.05) {
  const context = getAudioContext();
  if (!context) return;

  const oscillator = context.createOscillator();
  const gainNode = context.createGain();

  oscillator.type = type;
  oscillator.frequency.value = frequency;

  gainNode.gain.setValueAtTime(volume, context.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + duration);

  oscillator.connect(gainNode);
  gainNode.connect(context.destination);

  oscillator.start();
  oscillator.stop(context.currentTime + duration);
}

function playExplosionSound() {
  const context = getAudioContext();
  if (!context) return;

  const noiseBuffer = context.createBuffer(1, context.sampleRate * 0.4, context.sampleRate);
  const channel = noiseBuffer.getChannelData(0);

  for (let i = 0; i < channel.length; i += 1) {
    const envelope = 1 - i / channel.length;
    channel[i] = (Math.random() * 2 - 1) * envelope * 0.6;
  }

  const source = context.createBufferSource();
  const gainNode = context.createGain();
  source.buffer = noiseBuffer;
  gainNode.gain.setValueAtTime(0.15, context.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + 0.28);

  source.connect(gainNode);
  gainNode.connect(context.destination);
  source.start();
  source.stop(context.currentTime + 0.28);

  playTone(90, 0.18, 'sawtooth', 0.09);
  playTone(55, 0.24, 'triangle', 0.08);
}

function playWinSound() {
  playTone(523.25, 0.14, 'triangle', 0.08);
  setTimeout(() => playTone(659.25, 0.14, 'triangle', 0.08), 90);
  setTimeout(() => playTone(783.99, 0.22, 'triangle', 0.08), 180);
}

function createCell() {
  return {
    mine: false,
    revealed: false,
    flagged: false,
    adjacent: 0,
  };
}

function createBoard() {
  board = [];
  for (let row = 0; row < rows; row += 1) {
    const rowCells = [];
    for (let col = 0; col < cols; col += 1) {
      rowCells.push(createCell());
    }
    board.push(rowCells);
  }
}

function placeMines(exceptRow, exceptCol) {
  const safeRadius = 1;
  let placed = 0;

  while (placed < mineCount) {
    const row = Math.floor(Math.random() * rows);
    const col = Math.floor(Math.random() * cols);

    const inSafeZone = Math.abs(row - exceptRow) <= safeRadius && Math.abs(col - exceptCol) <= safeRadius;

    if (inSafeZone || board[row][col].mine) {
      continue;
    }

    board[row][col].mine = true;
    placed += 1;
  }

  for (let row = 0; row < rows; row += 1) {
    for (let col = 0; col < cols; col += 1) {
      if (!board[row][col].mine) {
        board[row][col].adjacent = countAdjacentMines(row, col);
      }
    }
  }
}

function countAdjacentMines(row, col) {
  let total = 0;

  for (let r = row - 1; r <= row + 1; r += 1) {
    for (let c = col - 1; c <= col + 1; c += 1) {
      if (r === row && c === col) {
        continue;
      }
      if (r >= 0 && r < rows && c >= 0 && c < cols && board[r][c].mine) {
        total += 1;
      }
    }
  }

  return total;
}

function updateMineCounter() {
  if (!mineCounterEl) return;

  const flaggedCount = board.flat().filter((tile) => tile.flagged).length;
  const remaining = mineCount - flaggedCount;
  mineCounterEl.textContent = `Mines Left: ${remaining}`;
}

function updateBoardSizing() {
  const safeMin = cols >= 20 ? 10 : cols >= 12 ? 18 : 26;
  boardEl.style.gridTemplateColumns = `repeat(${cols}, minmax(${safeMin}px, 1fr))`;
  boardEl.style.width = cols >= 20 ? 'min(96vw, 620px)' : cols >= 12 ? 'min(96vw, 760px)' : 'min(90vw, 620px)';
}

function buildBoardUI() {
  boardEl.innerHTML = '';
  updateBoardSizing();

  for (let row = 0; row < rows; row += 1) {
    for (let col = 0; col < cols; col += 1) {
      const cell = document.createElement('button');
      cell.type = 'button';
      cell.className = 'cell';
      cell.dataset.row = String(row);
      cell.dataset.col = String(col);
      cell.setAttribute('aria-label', `Row ${row + 1}, column ${col + 1}`);

      cell.addEventListener('click', () => revealCell(row, col));
      cell.addEventListener('mouseenter', () => {
        selectedCell = cell;
      });

      boardEl.appendChild(cell);
    }
  }
}

function updateCellUI(row, col) {
  const cell = document.querySelector(`.cell[data-row="${row}"][data-col="${col}"]`);
  if (!cell) return;

  const tile = board[row][col];

  cell.classList.toggle('revealed', tile.revealed);
  cell.classList.toggle('flagged', tile.flagged);
  cell.classList.toggle('mine', tile.mine && tile.revealed);

  if (tile.flagged && !tile.revealed) {
    cell.textContent = 'M';
    cell.dataset.number = '';
    return;
  }

  if (!tile.revealed) {
    cell.textContent = '';
    cell.dataset.number = '';
    return;
  }

  if (tile.mine) {
    cell.textContent = '💣';
    cell.dataset.number = '9';
    return;
  }

  cell.textContent = tile.adjacent > 0 ? String(tile.adjacent) : '';
  cell.dataset.number = String(tile.adjacent);
}

function revealAllMines() {
  for (let row = 0; row < rows; row += 1) {
    for (let col = 0; col < cols; col += 1) {
      if (board[row][col].mine) {
        board[row][col].revealed = true;
        updateCellUI(row, col);
      }
    }
  }
}

function triggerWinCelebration() {
  boardEl.classList.add('win-flash');
  setTimeout(() => boardEl.classList.remove('win-flash'), 500);

  document.querySelectorAll('.cell').forEach((cell) => {
    cell.classList.add('win-pulse');
    setTimeout(() => cell.classList.remove('win-pulse'), 700);
  });
}

function triggerExplosion(row, col) {
  const cell = document.querySelector(`.cell[data-row="${row}"][data-col="${col}"]`);
  if (!cell) return;

  cell.classList.add('exploding');
  setTimeout(() => {
    cell.classList.remove('exploding');
  }, 260);

  setTimeout(() => {
    boardEl.classList.add('shake');
    setTimeout(() => boardEl.classList.remove('shake'), 240);
  }, 20);
}

function countAdjacentFlags(row, col) {
  let total = 0;

  for (let r = row - 1; r <= row + 1; r += 1) {
    for (let c = col - 1; c <= col + 1; c += 1) {
      if (r === row && c === col) {
        continue;
      }

      if (r >= 0 && r < rows && c >= 0 && c < cols && board[r][c].flagged) {
        total += 1;
      }
    }
  }

  return total;
}

function revealNumberNeighbors(row, col) {
  const tile = board[row][col];

  if (!tile.revealed || tile.adjacent === 0) {
    return;
  }

  if (countAdjacentFlags(row, col) !== tile.adjacent) {
    return;
  }

  for (let r = row - 1; r <= row + 1; r += 1) {
    for (let c = col - 1; c <= col + 1; c += 1) {
      if (r === row && c === col) {
        continue;
      }

      if (r >= 0 && r < rows && c >= 0 && c < cols) {
        const neighbor = board[r][c];

        if (neighbor.flagged || neighbor.revealed) {
          continue;
        }

        if (neighbor.mine) {
          neighbor.revealed = true;
          updateCellUI(r, c);
          triggerExplosion(r, c);
          playExplosionSound();
          revealAllMines();
          gameOver = true;
          statusEl.textContent = 'Boom! You lost.';
          return;
        }

        floodReveal(r, c);
      }
    }
  }

  checkWin();
}

function revealCell(row, col) {
  if (gameOver) return;

  const tile = board[row][col];

  if (tile.flagged) return;

  if (tile.revealed) {
    revealNumberNeighbors(row, col);
    return;
  }

  if (firstMove) {
    firstMove = false;
    placeMines(row, col);
  }

  if (tile.mine) {
    tile.revealed = true;
    updateCellUI(row, col);
    triggerExplosion(row, col);
    playExplosionSound();
    revealAllMines();
    gameOver = true;
    statusEl.textContent = 'Boom! You lost.';
    return;
  }

  floodReveal(row, col);
  checkWin();
}

function floodReveal(row, col) {
  const stack = [[row, col]];

  while (stack.length > 0) {
    const [currentRow, currentCol] = stack.pop();
    const tile = board[currentRow][currentCol];

    if (tile.revealed || tile.flagged) {
      continue;
    }

    tile.revealed = true;
    updateCellUI(currentRow, currentCol);

    if (tile.adjacent !== 0) {
      continue;
    }

    for (let r = currentRow - 1; r <= currentRow + 1; r += 1) {
      for (let c = currentCol - 1; c <= currentCol + 1; c += 1) {
        if (r >= 0 && r < rows && c >= 0 && c < cols) {
          const nextTile = board[r][c];
          if (!nextTile.revealed && !nextTile.mine && !nextTile.flagged) {
            stack.push([r, c]);
          }
        }
      }
    }
  }
}

function toggleFlag(row, col) {
  if (gameOver) return;
  const tile = board[row][col];

  if (tile.revealed) return;

  tile.flagged = !tile.flagged;
  updateCellUI(row, col);
  updateMineCounter();
  checkWin();
}

function checkWin() {
  let safeCells = 0;
  let revealedSafe = 0;

  for (let row = 0; row < rows; row += 1) {
    for (let col = 0; col < cols; col += 1) {
      if (!board[row][col].mine) {
        safeCells += 1;
        if (board[row][col].revealed) {
          revealedSafe += 1;
        }
      }
    }
  }

  if (revealedSafe === safeCells) {
    gameOver = true;
    statusEl.textContent = 'You win!';
    triggerWinCelebration();
    playWinSound();
    for (let row = 0; row < rows; row += 1) {
      for (let col = 0; col < cols; col += 1) {
        if (board[row][col].mine) {
          board[row][col].flagged = true;
          updateCellUI(row, col);
        }
      }
    }
  }
}

function setMode(mode) {
  if (!difficultySettings[mode]) return;

  currentMode = mode;
  rows = difficultySettings[mode].rows;
  cols = difficultySettings[mode].cols;
  mineCount = difficultySettings[mode].mineCount;

  modeButtons.forEach((button) => {
    const isActive = button.dataset.mode === mode;
    button.classList.toggle('active', isActive);
    button.setAttribute('aria-pressed', isActive ? 'true' : 'false');
  });

  resetGame();
}

function resetGame() {
  createBoard();
  firstMove = true;
  gameOver = false;
  selectedCell = null;
  statusEl.textContent = `${difficultySettings[currentMode].label} Mode`;
  buildBoardUI();
  updateMineCounter();
}

document.addEventListener('keydown', (event) => {
  const key = event.key.toLowerCase();
  if (!selectedCell || key !== 'm') return;

  const row = Number(selectedCell.dataset.row);
  const col = Number(selectedCell.dataset.col);
  toggleFlag(row, col);
});

resetBtn.addEventListener('click', resetGame);
modeButtons.forEach((button) => {
  button.addEventListener('click', () => setMode(button.dataset.mode));
});

resetGame();
