const boardEl = document.getElementById('board');
const statusEl = document.getElementById('status');
const resetBtn = document.getElementById('reset');

const rows = 14;
const cols = 14;
const mineCount = 30;

let board = [];
let firstMove = true;
let gameOver = false;
let selectedCell = null;

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

function buildBoardUI() {
  boardEl.innerHTML = '';

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

function revealCell(row, col) {
  if (gameOver) return;

  const tile = board[row][col];

  if (tile.flagged || tile.revealed) return;

  if (firstMove) {
    firstMove = false;
    placeMines(row, col);
  }

  if (tile.mine) {
    tile.revealed = true;
    updateCellUI(row, col);
    triggerExplosion(row, col);
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

function resetGame() {
  createBoard();
  firstMove = true;
  gameOver = false;
  selectedCell = null;
  statusEl.textContent = 'Hard Mode';
  buildBoardUI();
}

document.addEventListener('keydown', (event) => {
  const key = event.key.toLowerCase();
  if (!selectedCell || key !== 'm') return;

  const row = Number(selectedCell.dataset.row);
  const col = Number(selectedCell.dataset.col);
  toggleFlag(row, col);
});

resetBtn.addEventListener('click', resetGame);

resetGame();
