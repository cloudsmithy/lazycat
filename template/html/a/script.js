class Minesweeper {
    constructor() {
        this.difficulties = {
            easy: { rows: 9, cols: 9, mines: 10 },
            medium: { rows: 16, cols: 16, mines: 40 },
            hard: { rows: 16, cols: 30, mines: 99 },
            custom: { rows: 10, cols: 10, mines: 10 }
        };
        
        this.currentDifficulty = 'easy';
        this.board = [];
        this.gameOver = false;
        this.gameStarted = false;
        this.minesCount = 0;
        this.flagsCount = 0;
        this.revealedCount = 0;
        this.timerInterval = null;
        this.timeElapsed = 0;
        this.scores = this.loadScores();
        
        this.gameBoard = document.getElementById('game-board');
        this.minesCounter = document.getElementById('mines-count');
        this.timer = document.getElementById('timer');
        this.newGameBtn = document.getElementById('new-game-btn');
        this.customModal = document.getElementById('custom-modal');
        
        this.initEventListeners();
        this.startNewGame();
        this.updateScoreList('easy');
    }
    
    initEventListeners() {
        this.newGameBtn.addEventListener('click', () => this.startNewGame());
        
        document.getElementById('easy').addEventListener('click', () => this.changeDifficulty('easy'));
        document.getElementById('medium').addEventListener('click', () => this.changeDifficulty('medium'));
        document.getElementById('hard').addEventListener('click', () => this.changeDifficulty('hard'));
        document.getElementById('custom').addEventListener('click', () => this.openCustomModal());
        
        document.getElementById('cancel-custom').addEventListener('click', () => this.closeCustomModal());
        document.getElementById('apply-custom').addEventListener('click', () => this.applyCustomSettings());
        
        // Custom mines input event
        document.getElementById('custom-rows').addEventListener('input', () => this.updateMinesLimit());
        document.getElementById('custom-cols').addEventListener('input', () => this.updateMinesLimit());
        document.getElementById('custom-mines').addEventListener('input', () => this.updateMinesPercentage());
        
        // Tab buttons for score display
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                this.updateScoreList(e.target.dataset.difficulty);
            });
        });
    }
    
    openCustomModal() {
        const { rows, cols, mines } = this.difficulties.custom;
        document.getElementById('custom-rows').value = rows;
        document.getElementById('custom-cols').value = cols;
        document.getElementById('custom-mines').value = mines;
        this.updateMinesPercentage();
        this.customModal.style.display = 'flex';
    }
    
    closeCustomModal() {
        this.customModal.style.display = 'none';
    }
    
    updateMinesLimit() {
        const rows = parseInt(document.getElementById('custom-rows').value);
        const cols = parseInt(document.getElementById('custom-cols').value);
        const minesInput = document.getElementById('custom-mines');
        const maxMines = Math.floor(rows * cols * 0.9); // Max 90% of cells can be mines
        
        minesInput.max = maxMines;
        if (parseInt(minesInput.value) > maxMines) {
            minesInput.value = maxMines;
        }
        
        this.updateMinesPercentage();
    }
    
    updateMinesPercentage() {
        const rows = parseInt(document.getElementById('custom-rows').value);
        const cols = parseInt(document.getElementById('custom-cols').value);
        const mines = parseInt(document.getElementById('custom-mines').value);
        const percentage = Math.round((mines / (rows * cols)) * 100);
        
        document.getElementById('mines-percentage').textContent = `(${percentage}%)`;
    }
    
    applyCustomSettings() {
        const rows = parseInt(document.getElementById('custom-rows').value);
        const cols = parseInt(document.getElementById('custom-cols').value);
        const mines = parseInt(document.getElementById('custom-mines').value);
        
        // Validate inputs
        if (rows < 5 || rows > 30 || cols < 5 || cols > 30 || mines < 1 || mines > rows * cols * 0.9) {
            alert('请输入有效的设置！');
            return;
        }
        
        this.difficulties.custom = { rows, cols, mines };
        this.changeDifficulty('custom');
        this.closeCustomModal();
    }
    
    changeDifficulty(difficulty) {
        if (this.currentDifficulty !== difficulty) {
            this.currentDifficulty = difficulty;
            
            // Update active button
            document.querySelectorAll('.difficulty-btn').forEach(btn => {
                btn.classList.remove('active');
            });
            document.getElementById(difficulty).classList.add('active');
            
            this.startNewGame();
        }
    }
    
    startNewGame() {
        this.stopTimer();
        this.gameOver = false;
        this.gameStarted = false;
        this.timeElapsed = 0;
        this.timer.textContent = '0';
        
        const { rows, cols, mines } = this.difficulties[this.currentDifficulty];
        this.minesCount = mines;
        this.flagsCount = 0;
        this.revealedCount = 0;
        this.minesCounter.textContent = mines;
        
        this.createBoard(rows, cols);
        this.renderBoard();
    }
    
    createBoard(rows, cols) {
        // Initialize empty board
        this.board = [];
        for (let i = 0; i < rows; i++) {
            this.board.push(Array(cols).fill(null).map(() => ({
                isMine: false,
                isRevealed: false,
                isFlagged: false,
                adjacentMines: 0
            })));
        }
    }
    
    placeMines(firstClickRow, firstClickCol) {
        const { rows, cols, mines } = this.difficulties[this.currentDifficulty];
        let minesPlaced = 0;
        
        while (minesPlaced < mines) {
            const row = Math.floor(Math.random() * rows);
            const col = Math.floor(Math.random() * cols);
            
            // Don't place mine at first click or where a mine already exists
            if ((row === firstClickRow && col === firstClickCol) || this.board[row][col].isMine) {
                continue;
            }
            
            this.board[row][col].isMine = true;
            minesPlaced++;
        }
        
        // Calculate adjacent mines for each cell
        for (let row = 0; row < rows; row++) {
            for (let col = 0; col < cols; col++) {
                if (!this.board[row][col].isMine) {
                    this.board[row][col].adjacentMines = this.countAdjacentMines(row, col);
                }
            }
        }
    }
    
    countAdjacentMines(row, col) {
        let count = 0;
        const { rows, cols } = this.difficulties[this.currentDifficulty];
        
        for (let r = Math.max(0, row - 1); r <= Math.min(rows - 1, row + 1); r++) {
            for (let c = Math.max(0, col - 1); c <= Math.min(cols - 1, col + 1); c++) {
                if (r === row && c === col) continue;
                if (this.board[r][c].isMine) count++;
            }
        }
        
        return count;
    }
    
    renderBoard() {
        const { rows, cols } = this.difficulties[this.currentDifficulty];
        
        // Clear existing board
        this.gameBoard.innerHTML = '';
        
        // Set grid template
        this.gameBoard.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;
        
        // Create cells
        for (let row = 0; row < rows; row++) {
            for (let col = 0; col < cols; col++) {
                const cell = document.createElement('div');
                cell.className = 'cell';
                cell.dataset.row = row;
                cell.dataset.col = col;
                
                cell.addEventListener('click', (e) => this.handleCellClick(row, col));
                cell.addEventListener('contextmenu', (e) => {
                    e.preventDefault();
                    this.handleRightClick(row, col);
                });
                
                this.gameBoard.appendChild(cell);
            }
        }
    }
    
    updateCell(row, col) {
        const cellData = this.board[row][col];
        const cellElement = this.gameBoard.querySelector(`[data-row="${row}"][data-col="${col}"]`);
        
        if (cellData.isRevealed) {
            cellElement.classList.add('revealed');
            
            if (cellData.isMine) {
                cellElement.classList.add('mine');
            } else if (cellData.adjacentMines > 0) {
                cellElement.textContent = cellData.adjacentMines;
                cellElement.dataset.mines = cellData.adjacentMines;
            }
        } else {
            cellElement.classList.remove('revealed');
            cellElement.textContent = '';
            
            if (cellData.isFlagged) {
                cellElement.classList.add('flagged');
            } else {
                cellElement.classList.remove('flagged');
            }
        }
    }
    
    handleCellClick(row, col) {
        if (this.gameOver || this.board[row][col].isFlagged || this.board[row][col].isRevealed) {
            return;
        }
        
        // First click
        if (!this.gameStarted) {
            this.gameStarted = true;
            this.placeMines(row, col);
            this.startTimer();
        }
        
        if (this.board[row][col].isMine) {
            this.revealAllMines();
            this.gameOver = true;
            this.stopTimer();
            setTimeout(() => {
                alert('游戏结束！你踩到了地雷。');
            }, 100);
            return;
        }
        
        this.revealCell(row, col);
        
        // Check for win
        const { rows, cols, mines } = this.difficulties[this.currentDifficulty];
        const totalCells = rows * cols;
        
        if (this.revealedCount === totalCells - mines) {
            this.gameOver = true;
            this.stopTimer();
            this.flagAllMines();
            
            // Save score
            if (this.currentDifficulty !== 'custom') {
                this.saveScore(this.currentDifficulty, this.timeElapsed);
                this.updateScoreList(this.currentDifficulty);
            }
            
            setTimeout(() => {
                alert(`恭喜！你赢了！用时：${this.timeElapsed}秒`);
            }, 100);
        }
    }
    
    revealCell(row, col) {
        const cellData = this.board[row][col];
        
        if (cellData.isRevealed || cellData.isFlagged) {
            return;
        }
        
        cellData.isRevealed = true;
        this.revealedCount++;
        this.updateCell(row, col);
        
        // If cell has no adjacent mines, reveal neighbors
        if (cellData.adjacentMines === 0) {
            const { rows, cols } = this.difficulties[this.currentDifficulty];
            
            for (let r = Math.max(0, row - 1); r <= Math.min(rows - 1, row + 1); r++) {
                for (let c = Math.max(0, col - 1); c <= Math.min(cols - 1, col + 1); c++) {
                    if (r === row && c === col) continue;
                    this.revealCell(r, c);
                }
            }
        }
    }
    
    handleRightClick(row, col) {
        if (this.gameOver || this.board[row][col].isRevealed) {
            return;
        }
        
        if (!this.gameStarted) {
            this.gameStarted = true;
            this.placeMines(row, col);
            this.startTimer();
        }
        
        const cellData = this.board[row][col];
        
        if (cellData.isFlagged) {
            cellData.isFlagged = false;
            this.flagsCount--;
        } else {
            cellData.isFlagged = true;
            this.flagsCount++;
        }
        
        this.updateCell(row, col);
        this.minesCounter.textContent = this.minesCount - this.flagsCount;
    }
    
    revealAllMines() {
        const { rows, cols } = this.difficulties[this.currentDifficulty];
        
        for (let row = 0; row < rows; row++) {
            for (let col = 0; col < cols; col++) {
                if (this.board[row][col].isMine) {
                    this.board[row][col].isRevealed = true;
                    this.updateCell(row, col);
                }
            }
        }
    }
    
    flagAllMines() {
        const { rows, cols } = this.difficulties[this.currentDifficulty];
        
        for (let row = 0; row < rows; row++) {
            for (let col = 0; col < cols; col++) {
                if (this.board[row][col].isMine && !this.board[row][col].isFlagged) {
                    this.board[row][col].isFlagged = true;
                    this.updateCell(row, col);
                }
            }
        }
        
        this.minesCounter.textContent = '0';
    }
    
    startTimer() {
        this.stopTimer();
        this.timerInterval = setInterval(() => {
            this.timeElapsed++;
            this.timer.textContent = this.timeElapsed;
        }, 1000);
    }
    
    stopTimer() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
    }
    
    // Score management
    loadScores() {
        const savedScores = localStorage.getItem('minesweeperScores');
        if (savedScores) {
            return JSON.parse(savedScores);
        }
        return {
            easy: [],
            medium: [],
            hard: []
        };
    }
    
    saveScore(difficulty, time) {
        if (!this.scores[difficulty]) {
            this.scores[difficulty] = [];
        }
        
        const date = new Date();
        const formattedDate = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`;
        
        this.scores[difficulty].push({
            time,
            date: formattedDate
        });
        
        // Sort scores by time (ascending)
        this.scores[difficulty].sort((a, b) => a.time - b.time);
        
        // Keep only top 10 scores
        if (this.scores[difficulty].length > 10) {
            this.scores[difficulty] = this.scores[difficulty].slice(0, 10);
        }
        
        // Save to localStorage
        localStorage.setItem('minesweeperScores', JSON.stringify(this.scores));
    }
    
    updateScoreList(difficulty) {
        const scoreList = document.getElementById('score-list');
        scoreList.innerHTML = '';
        
        if (!this.scores[difficulty] || this.scores[difficulty].length === 0) {
            const noScores = document.createElement('div');
            noScores.className = 'no-scores';
            noScores.textContent = '暂无记录';
            scoreList.appendChild(noScores);
            return;
        }
        
        this.scores[difficulty].forEach((score, index) => {
            const scoreItem = document.createElement('div');
            scoreItem.className = 'score-item';
            
            const rank = document.createElement('span');
            rank.textContent = `#${index + 1}`;
            
            const time = document.createElement('span');
            time.textContent = `${score.time}秒`;
            
            const date = document.createElement('span');
            date.textContent = score.date;
            
            scoreItem.appendChild(rank);
            scoreItem.appendChild(time);
            scoreItem.appendChild(date);
            
            scoreList.appendChild(scoreItem);
        });
    }
}

// Initialize game when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new Minesweeper();
});
