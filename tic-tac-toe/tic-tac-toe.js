// Reference for making base game: https://www.youtube.com/watch?v=Y-GkMjUZsmM

let currentBoard;
const X_CLASS = 'x';
const CIRCLE_CLASS = 'circle';


human = X_CLASS;
aiPlayer = CIRCLE_CLASS;
humanWins = aiWins = tieCount = 0;

const WINNING_COMBINATIONS = [
    [0, 1, 2],
    [3, 4, 5], 
    [6, 7, 8],
    [0, 3, 6],
    [1, 4, 7],
    [2, 5, 8],
    [0, 4, 8],
    [2, 4, 6]
]


const cellElements = document.querySelectorAll('[data-cell]');
const cells = document.querySelectorAll('.cell');
const board = document.getElementById('board');
const winningMessageElement = document.getElementById('winningMessage');
const winningMessageTextElement = document.querySelector('[data-winning-message-text]');
const restartButton = document.getElementById('restartButton');
const resetButton = document.getElementById('resetButton');
const aiWinElement = document.getElementById('aiScore');
const humanWinElement = document.getElementById('humanScore');
const tieCountElement = document.getElementById('tieCount');
const aiSelection = document.getElementById('aiSetting');
let aiClass = 'Hard';
let circleTurn


/* Begins the game by clearing the board and removing the winning message */
function startGame() {
    circleTurn = false;
    currentBoard = Array.from(Array(9).keys());

    // clearing the board of all markers
    cellElements.forEach(cell => {
        cell.classList.remove(X_CLASS);
        cell.classList.remove(CIRCLE_CLASS);
        cell.removeEventListener('click', handleClick);
        cell.addEventListener('click', handleClick, {once: true});
    })
    setBoardHoverClass();
    winningMessageElement.classList.remove('show');
}

/*  Resets the score board and the game board */
function resetGame() {
    aiWinElement.innerText = "";
    humanWinElement.innerText = "";
    tieCountElement.innerText = "";
    aiWins = humanWins = tieCount = 0;
    startGame();
}

/* Updates the AI Setting when user makes a new selection */
function aiUpdate(e) {
    aiClass = e.target.value;
    startGame();
}

/* Handles the full click-event including placing the mark, checking for a win, and exchanging turns */
function handleClick(e) {
    const cell = e.target;
    // Make sure cell hasn't been clicked before
    if (typeof currentBoard[cell.id] == 'number') {
        // check to see if human is playing against another human
        if (aiClass == 'No AI') {
            if (!circleTurn) {
                turn(cell.id, human); 
            }
            else {
                turn(cell.id, aiPlayer); 
            }
        }
        // else ai makes a move
        else if (!isDraw()) {
            turn(cell.id, human)
            turn(bestSpot(aiClass), aiPlayer); 
        }
    }
}

/* Handles making a move for a player on a square */
function turn(squareId, player) {
    document.getElementById(squareId).classList.add(player);
    currentBoard[squareId] = player;

    win = checkWin(currentBoard, player);

    // Check for Win, Draw, or Swap Turns
    if (win) {
        endGame(false);
    } 
    else if (isDraw()) {
        endGame(true);
    } 
    else {
        swapTurns();
        setBoardHoverClass();
    }
}

/* Displays the winning game message */
function endGame(draw) {
    if (draw) {
        winningMessageTextElement.innerText = 'Draw!';
        tieCount++;
        tieCountElement.innerText = "_" + tieCount + "_"
    } else {
        winningMessageTextElement.innerText = `${circleTurn ? "O's" : "X's"} Win!`;
        if (circleTurn) {
            aiWins++;
            aiWinElement.innerText =  "_" + aiWins + "_";
        } else {
            humanWins++;
            humanWinElement.innerText =  "_" + humanWins + "_";
        }
    }

    winningMessageElement.classList.add('show');
}

/* Checks if the board results in a draw */
function isDraw() {
    return [...cellElements].every(cell => {
        return cell.classList.contains(X_CLASS) || cell.classList.contains(CIRCLE_CLASS);
    })
}

/* Checks if the board results in a win */
function checkWin(board, player) {

    // Find current indexes on board with the current player's marker
        // .reduce loops through all elements in 'board'
            // marks is the 'accumulator' element that will be returned at the end; init as []
            // currentCell is the element in the board array that we're going through
            // i is the index
    let playerMarks = board.reduce((marks, currentCell, i) =>
        // if currentCell = player, add index, otherwise return the given playerMarks array
        (currentCell===player) ? marks.concat(i) : marks, []);

    let gameWon = null;
    // loop through each of the winning combinations
    for (let [i, win] of WINNING_COMBINATIONS.entries()) {
        // check to see if all indexes in the winning combo are from the player
        if (win.every(elem => playerMarks.indexOf(elem) > -1)) {
            gameWon = {index: i, player: player};
            break;
        }
    }
    return gameWon;
}

/* Puts a mark down on the physical board for a player */
function placeMark(cell, player, location) {
    marker = 'circle';
    if (player == 'x') {marker = 'x';}
    cell.classList.add(player);
    currentBoard[location] = marker;
}

/* Gets all empty squares on the board */
function emptySquares() {
    return currentBoard.filter(square => typeof square == 'number');
}

/* AI function to get best spot */
function bestSpot(ai) {
    if (ai == 'Easy') {
        return emptySquares()[0];
    }
    else {
        return minimax(currentBoard, aiPlayer).index;
    }
}

// Reference for creating minimax: https://www.youtube.com/watch?v=P2TcQ3h0ipQ&t
/* Recursive search function to return best possible move from current board */
function minimax(newBoard, player) {

    // get empty spots left on the board input
    let availSpots = emptySquares(newBoard);

    // base case, return score of winning board
    if (checkWin(newBoard, human)) {
        return {score: -10};
    } else if (checkWin(newBoard, aiPlayer)) {
        return {score: 20};
    } else if (availSpots.length === 0) {
        return {score: 0};
    }

    // get indexes of open spots on the current board
    let moves = [];
    for (let i = 0; i < availSpots.length; i++) {
        let move = {};
        move.index = newBoard[availSpots[i]];
        newBoard[availSpots[i]] = player;

        // get the score of the board after the move is placed
        if (player == aiPlayer) {
            let result = minimax(newBoard, human);
            move.score = result.score;
        } else {
            let result = minimax(newBoard, aiPlayer);
            move.score = result.score;
        }

        // resets the board to what it was before the move and places the move/score in moves
        newBoard[availSpots[i]] = move.index;
        moves.push(move);
    }

    // evalulate which move has the best score for each player
    let bestMove;
    if (player === aiPlayer) {
        let bestScore = -1000;
        for (let i = 0; i < moves.length; i++) {
            if (moves[i].score > bestScore) {
                bestScore = moves[i].score;
                bestMove = i;
            }
        }
    } else {
        let bestScore = 10000;
        for (let i = 0; i < moves.length; i++) {
            if (moves[i].score < bestScore) {
                bestScore = moves[i].score;
                bestMove = i;
            }
        }
    }
    return moves[bestMove];
}

/* Flips the boolean circleTurn letiable */
function swapTurns() {
    circleTurn = !circleTurn;
}

/* Sets the class for hovering the player's marker */
function setBoardHoverClass() {
    board.classList.remove(X_CLASS);
    board.classList.remove(CIRCLE_CLASS);
    if (circleTurn) {
        board.classList.add(CIRCLE_CLASS);
    } else {
        board.classList.add(X_CLASS);
    }
}


/* MAIN METHOD */
startGame(false);
restartButton.addEventListener('click', startGame);
resetButton.addEventListener('click', resetGame);
aiSelection.addEventListener('change', aiUpdate);
