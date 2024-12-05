const gridSize = 10;
const totalWordsToFind = 5;
const wordListUrl = 'wordlist.txt';

const gridElement = document.getElementById('grid');
const wordsListElement = document.getElementById('words-to-find');
const newGameButton = document.getElementById('new-game-button');

let grid = [];
let wordList = [];
let wordsInGrid = [];
let selectedCells = [];
let isMouseDown = false;
let startCell = null;
let gameStartTime = null;
let gameTimer = null;
let timerDisplay = null;

// Create timer display element
function createTimerDisplay() {
    const timerContainer = document.createElement('div');
    timerContainer.className = 'timer-container';
    
    timerDisplay = document.createElement('div');
    timerDisplay.className = 'timer';
    timerDisplay.textContent = '0:00';
    
    const highScoreDisplay = document.createElement('div');
    highScoreDisplay.className = 'high-score';
    const bestTime = localStorage.getItem('wordSearchBestTime');
    highScoreDisplay.textContent = `Best Time: ${bestTime ? formatTime(parseInt(bestTime)) : 'None'}`;
    
    timerContainer.appendChild(timerDisplay);
    timerContainer.appendChild(highScoreDisplay);
    
    const header = document.querySelector('#game-container h1');
    header.parentNode.insertBefore(timerContainer, header.nextSibling);
}

function formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}

function startTimer() {
    gameStartTime = Date.now();
    if (gameTimer) clearInterval(gameTimer);
    
    gameTimer = setInterval(() => {
        const elapsedSeconds = Math.floor((Date.now() - gameStartTime) / 1000);
        timerDisplay.textContent = formatTime(elapsedSeconds);
    }, 1000);
}

function stopTimer() {
    if (gameTimer) {
        clearInterval(gameTimer);
        const finalTime = Math.floor((Date.now() - gameStartTime) / 1000);
        
        // Check if it's a new best time
        const currentBest = localStorage.getItem('wordSearchBestTime');
        if (!currentBest || finalTime < parseInt(currentBest)) {
            localStorage.setItem('wordSearchBestTime', finalTime.toString());
            document.querySelector('.high-score').textContent = `Best Time: ${formatTime(finalTime)}`;
            return true; // Indicates new high score
        }
    }
    return false;
}

async function loadWordList() {
    try {
        const response = await fetch(wordListUrl);
        const text = await response.text();
        wordList = text.split('\n')
            .map(word => word.trim().toUpperCase())
            .filter(word => word.length > 0 && word.length <= gridSize);
    } catch (err) {
        console.error("Error loading word list: ", err);
        wordList = ['LOVE', 'HEART', 'SMILE', 'HAPPY', 'JOY']; // Fallback words
    }
}

function createGrid() {
    gridElement.style.gridTemplateColumns = `repeat(${gridSize}, 40px)`;
    gridElement.innerHTML = '';
    grid = [];

    for (let i = 0; i < gridSize; i++) {
        grid[i] = [];
        for (let j = 0; j < gridSize; j++) {
            const cell = document.createElement('div');
            cell.className = 'grid-cell';
            cell.dataset.row = i;
            cell.dataset.col = j;
            cell.textContent = '';
            gridElement.appendChild(cell);
            grid[i][j] = cell;
        }
    }
}

function randomLetter() {
    return 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'[Math.floor(Math.random() * 26)];
}

function pickRandomWords() {
    const words = [];
    const shuffledList = [...wordList].sort(() => Math.random() - 0.5);
    
    for (const word of shuffledList) {
        if (word.length <= gridSize && words.length < totalWordsToFind) {
            words.push(word);
        }
        if (words.length === totalWordsToFind) break;
    }
    
    return words;
}

function getAllPlacements(word) {
    const placements = [];
    
    // Get all possible horizontal and vertical placements
    for (let row = 0; row < gridSize; row++) {
        for (let col = 0; col <= gridSize - word.length; col++) {
            // Check horizontal placement
            let validHorizontal = true;
            for (let i = 0; i < word.length; i++) {
                if (grid[row][col + i].textContent !== '' && 
                    grid[row][col + i].textContent !== word[i]) {
                    validHorizontal = false;
                    break;
                }
            }
            if (validHorizontal) {
                placements.push({ row, col, direction: 'horizontal' });
            }
        }
    }
    
    for (let row = 0; row <= gridSize - word.length; row++) {
        for (let col = 0; col < gridSize; col++) {
            // Check vertical placement
            let validVertical = true;
            for (let i = 0; i < word.length; i++) {
                if (grid[row + i][col].textContent !== '' && 
                    grid[row + i][col].textContent !== word[i]) {
                    validVertical = false;
                    break;
                }
            }
            if (validVertical) {
                placements.push({ row, col, direction: 'vertical' });
            }
        }
    }
    
    return placements.sort(() => Math.random() - 0.5);
}

function placeWord(word, placement) {
    const { row, col, direction } = placement;
    
    if (direction === 'horizontal') {
        for (let i = 0; i < word.length; i++) {
            grid[row][col + i].textContent = word[i];
        }
    } else {
        for (let i = 0; i < word.length; i++) {
            grid[row + i][col].textContent = word[i];
        }
    }
}

function placeWords() {
    wordsInGrid = [];
    const words = pickRandomWords();
    let horizontalCount = 0;
    let verticalCount = 0;
    
    for (const word of words) {
        const placements = getAllPlacements(word);
        if (placements.length > 0) {
            // Separate horizontal and vertical placements
            const horizontalPlacements = placements.filter(p => p.direction === 'horizontal');
            const verticalPlacements = placements.filter(p => p.direction === 'vertical');
            
            let placement;
            
            // Force alternating directions when possible
            if (horizontalPlacements.length > 0 && (verticalCount > horizontalCount || !verticalPlacements.length)) {
                placement = horizontalPlacements[Math.floor(Math.random() * horizontalPlacements.length)];
                horizontalCount++;
            } else if (verticalPlacements.length > 0) {
                placement = verticalPlacements[Math.floor(Math.random() * verticalPlacements.length)];
                verticalCount++;
            } else if (horizontalPlacements.length > 0) {
                placement = horizontalPlacements[Math.floor(Math.random() * horizontalPlacements.length)];
                horizontalCount++;
            } else {
                continue; // Skip this word if no valid placements
            }
            
            placeWord(word, placement);
            wordsInGrid.push(word);
            addWordToList(word);
        }
    }
    
    // Fill remaining empty cells
    for (let i = 0; i < gridSize; i++) {
        for (let j = 0; j < gridSize; j++) {
            if (grid[i][j].textContent === '') {
                grid[i][j].textContent = randomLetter();
            }
        }
    }
}

function addWordToList(word) {
    const li = document.createElement('li');
    li.textContent = word;
    li.className = 'word-item';
    wordsListElement.appendChild(li);
}

function isValidSelection(cell1, cell2) {
    const row1 = parseInt(cell1.dataset.row);
    const col1 = parseInt(cell1.dataset.col);
    const row2 = parseInt(cell2.dataset.row);
    const col2 = parseInt(cell2.dataset.col);
    
    return row1 === row2 || col1 === col2;
}

function getCellsBetween(start, end) {
    const cells = [];
    const startRow = parseInt(start.dataset.row);
    const startCol = parseInt(start.dataset.col);
    const endRow = parseInt(end.dataset.row);
    const endCol = parseInt(end.dataset.col);
    
    if (startRow === endRow) { // Horizontal
        const row = startRow;
        const start = Math.min(startCol, endCol);
        const end = Math.max(startCol, endCol);
        for (let col = start; col <= end; col++) {
            cells.push(grid[row][col]);
        }
    } else if (startCol === endCol) { // Vertical
        const col = startCol;
        const start = Math.min(startRow, endRow);
        const end = Math.max(startRow, endRow);
        for (let row = start; row <= end; row++) {
            cells.push(grid[row][col]);
        }
    }
    
    return cells;
}

function clearSelection() {
    selectedCells.forEach(cell => {
        if (!cell.classList.contains('found')) {
            cell.classList.remove('selected');
        }
    });
    selectedCells = [];
}

function handleMouseDown(e) {
    const cell = e.target;
    if (!cell.classList.contains('grid-cell')) return;
    
    isMouseDown = true;
    startCell = cell;
    clearSelection();
    selectedCells = [cell];
    cell.classList.add('selected');
}

function handleMouseOver(e) {
    if (!isMouseDown || !startCell) return;
    
    const cell = e.target;
    if (!cell.classList.contains('grid-cell')) return;
    
    if (isValidSelection(startCell, cell)) {
        clearSelection();
        selectedCells = getCellsBetween(startCell, cell);
        selectedCells.forEach(cell => cell.classList.add('selected'));
    }
}

function checkWord() {
    if (selectedCells.length < 2) return;
    
    const word = selectedCells.map(cell => cell.textContent).join('');
    const reversedWord = [...word].reverse().join('');
    
    if (wordsInGrid.includes(word) || wordsInGrid.includes(reversedWord)) {
        const foundWord = wordsInGrid.includes(word) ? word : reversedWord;
        selectedCells.forEach(cell => cell.classList.add('found'));
        
        // Mark word as found in the list
        const wordItems = document.querySelectorAll('.word-item');
        wordItems.forEach(item => {
            if (item.textContent === foundWord) {
                item.classList.add('found');
            }
        });
        
        // Check if all words are found
        const foundWords = document.querySelectorAll('.word-item.found');
        if (foundWords.length === wordsInGrid.length) {
            const isNewHighScore = stopTimer();
            setTimeout(() => {
                if (isNewHighScore) {
                    alert('Congratulations! You found all the words AND set a new best time!');
                } else {
                    alert('Congratulations! You found all the words!');
                }
            }, 500);
        }
    }
}

function handleMouseUp() {
    if (!isMouseDown) return;
    
    isMouseDown = false;
    checkWord();
    clearSelection();
    startCell = null;
}

async function startNewGame() {
    if (wordList.length === 0) {
        await loadWordList();
    }
    wordsListElement.innerHTML = '';
    createGrid();
    placeWords();
    startTimer();
}

// Initialize game and event listeners
createTimerDisplay();
gridElement.addEventListener('mousedown', handleMouseDown);
gridElement.addEventListener('mouseover', handleMouseOver);
document.addEventListener('mouseup', handleMouseUp);
newGameButton.addEventListener('click', startNewGame);

// Prevent text selection while dragging
gridElement.addEventListener('selectstart', e => e.preventDefault());

// Start the first game
startNewGame();