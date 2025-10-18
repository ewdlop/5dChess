// 棋子Unicode符號
const PIECES = {
    white: {
        king: '♔',
        queen: '♕',
        rook: '♖',
        bishop: '♗',
        knight: '♘',
        pawn: '♙'
    },
    black: {
        king: '♚',
        queen: '♛',
        rook: '♜',
        bishop: '♝',
        knight: '♞',
        pawn: '♟'
    }
};

// 遊戲狀態
let gameState = {
    board: [],
    currentPlayer: 'white',
    selectedSquare: null,
    validMoves: [],
    moveHistory: [],
    capturedPieces: { white: [], black: [] },
    isGameOver: false,
    gameMode: 'standard' // 'standard', 'torus', 'klein'
};

// 模式描述
const MODE_DESCRIPTIONS = {
    standard: '標準國際象棋規則，棋盤有邊界。',
    torus: '環面模式：棋盤左右邊界相連，上下邊界相連。棋子可以從一邊穿越到另一邊。',
    klein: '克萊因瓶模式：類似環面，但水平穿越時棋子顏色會翻轉（白變黑、黑變白）！'
};

// 初始化棋盤
function initBoard() {
    const board = Array(8).fill(null).map(() => Array(8).fill(null));
    
    // 黑方棋子（第0-1行）
    board[0] = [
        { type: 'rook', color: 'black' },
        { type: 'knight', color: 'black' },
        { type: 'bishop', color: 'black' },
        { type: 'queen', color: 'black' },
        { type: 'king', color: 'black' },
        { type: 'bishop', color: 'black' },
        { type: 'knight', color: 'black' },
        { type: 'rook', color: 'black' }
    ];
    board[1] = Array(8).fill(null).map(() => ({ type: 'pawn', color: 'black' }));
    
    // 白方棋子（第6-7行）
    board[6] = Array(8).fill(null).map(() => ({ type: 'pawn', color: 'white' }));
    board[7] = [
        { type: 'rook', color: 'white' },
        { type: 'knight', color: 'white' },
        { type: 'bishop', color: 'white' },
        { type: 'queen', color: 'white' },
        { type: 'king', color: 'white' },
        { type: 'bishop', color: 'white' },
        { type: 'knight', color: 'white' },
        { type: 'rook', color: 'white' }
    ];
    
    return board;
}

// 渲染棋盤
function renderBoard() {
    const chessboard = document.getElementById('chessboard');
    chessboard.innerHTML = '';
    
    for (let row = 0; row < 8; row++) {
        for (let col = 0; col < 8; col++) {
            const square = document.createElement('div');
            square.classList.add('square');
            square.classList.add((row + col) % 2 === 0 ? 'light' : 'dark');
            square.dataset.row = row;
            square.dataset.col = col;
            
            const piece = gameState.board[row][col];
            if (piece) {
                const pieceSpan = document.createElement('span');
                pieceSpan.classList.add('piece');
                pieceSpan.textContent = PIECES[piece.color][piece.type];
                square.appendChild(pieceSpan);
                square.classList.add('has-piece');
                
                // 高亮顯示當前玩家可以移動的棋子
                if (piece.color === gameState.currentPlayer && !gameState.isGameOver) {
                    const validMovesForPiece = getValidMoves(row, col);
                    if (validMovesForPiece.length > 0) {
                        square.classList.add('can-move');
                    }
                }
            }
            
            // 標記選中的方塊
            if (gameState.selectedSquare && 
                gameState.selectedSquare.row === row && 
                gameState.selectedSquare.col === col) {
                square.classList.add('selected');
            }
            
            // 標記有效移動
            if (gameState.validMoves.some(move => move.row === row && move.col === col)) {
                square.classList.add('valid-move');
                if (piece) {
                    square.classList.add('has-piece');
                }
            }
            
            // 檢查將軍
            if (piece && piece.type === 'king' && isInCheck(piece.color)) {
                square.classList.add('in-check');
            }
            
            square.addEventListener('click', () => handleSquareClick(row, col));
            chessboard.appendChild(square);
        }
    }
    
    // 更新玩家回合顯示
    document.getElementById('current-player').textContent = 
        gameState.currentPlayer === 'white' ? '白方' : '黑方';
    
    // 更新被吃棋子
    renderCapturedPieces();
}

// 處理方塊點擊
function handleSquareClick(row, col) {
    if (gameState.isGameOver) return;
    
    const clickedPiece = gameState.board[row][col];
    
    // 如果點擊的是有效移動位置
    if (gameState.selectedSquare && 
        gameState.validMoves.some(move => move.row === row && move.col === col)) {
        movePiece(gameState.selectedSquare, { row, col });
        return;
    }
    
    // 選擇己方棋子
    if (clickedPiece && clickedPiece.color === gameState.currentPlayer) {
        gameState.selectedSquare = { row, col };
        gameState.validMoves = getValidMoves(row, col);
        renderBoard();
    } else {
        gameState.selectedSquare = null;
        gameState.validMoves = [];
        renderBoard();
    }
}

// 移動棋子
function movePiece(from, to) {
    const piece = gameState.board[from.row][from.col];
    const capturedPiece = gameState.board[to.row][to.col];
    
    // 檢查是否需要翻轉顏色（Klein bottle模式）
    const shouldFlipColor = to.colorFlip || false;
    
    // 記錄移動歷史
    gameState.moveHistory.push({
        from: { ...from },
        to: { row: to.row, col: to.col },
        piece: { ...piece },
        capturedPiece: capturedPiece ? { ...capturedPiece } : null,
        colorFlipped: shouldFlipColor
    });
    
    // 如果吃子，加入被吃棋子列表
    if (capturedPiece) {
        gameState.capturedPieces[capturedPiece.color].push(capturedPiece);
    }
    
    // 執行移動
    let movedPiece = { ...piece };
    
    // 在Klein bottle模式中翻轉顏色
    if (shouldFlipColor) {
        movedPiece = flipPieceColor(movedPiece);
    }
    
    gameState.board[to.row][to.col] = movedPiece;
    gameState.board[from.row][from.col] = null;
    
    // 兵升變（pawn promotion）
    if (movedPiece.type === 'pawn') {
        if ((movedPiece.color === 'white' && to.row === 0) || 
            (movedPiece.color === 'black' && to.row === 7)) {
            gameState.board[to.row][to.col].type = 'queen';
        }
    }
    
    // 在Torus/Klein模式中，檢查移動後己方是否仍被將軍（應該不可能，但作為安全檢查）
    const originalColor = piece.color;
    if (gameState.gameMode !== 'standard' && isInCheck(originalColor)) {
        // 如果移動後己方仍被將軍，撤銷此移動（這是一個安全措施）
        console.warn('非法移動：移動後己方仍處於將軍狀態');
        gameState.board[from.row][from.col] = piece;
        gameState.board[to.row][to.col] = capturedPiece;
        if (capturedPiece) {
            gameState.capturedPieces[capturedPiece.color].pop();
        }
        gameState.moveHistory.pop();
        gameState.selectedSquare = null;
        gameState.validMoves = [];
        renderBoard();
        return;
    }
    
    // 清除選擇
    gameState.selectedSquare = null;
    gameState.validMoves = [];
    
    // 切換玩家
    gameState.currentPlayer = gameState.currentPlayer === 'white' ? 'black' : 'white';
    
    // 檢查遊戲結束
    checkGameOver();
    
    renderBoard();
}

// 獲取有效移動
function getValidMoves(row, col) {
    const piece = gameState.board[row][col];
    if (!piece) return [];
    
    let moves = [];
    
    switch (piece.type) {
        case 'pawn':
            moves = getPawnMoves(row, col, piece.color);
            break;
        case 'rook':
            moves = getRookMoves(row, col, piece.color);
            break;
        case 'knight':
            moves = getKnightMoves(row, col, piece.color);
            break;
        case 'bishop':
            moves = getBishopMoves(row, col, piece.color);
            break;
        case 'queen':
            moves = getQueenMoves(row, col, piece.color);
            break;
        case 'king':
            moves = getKingMoves(row, col, piece.color);
            break;
    }
    
    // 過濾掉會讓自己將軍的移動
    return moves.filter(move => !wouldBeInCheck(piece.color, { row, col }, move));
}

// 兵的移動
function getPawnMoves(row, col, color) {
    const moves = [];
    const direction = color === 'white' ? -1 : 1;
    const startRow = color === 'white' ? 6 : 1;
    
    // 向前一步
    const forward1 = wrapCoordinates(row + direction, col);
    if (forward1 && !gameState.board[forward1.row][forward1.col]) {
        moves.push(forward1);
        
        // 初始位置可以走兩步
        const forward2 = wrapCoordinates(row + 2 * direction, col);
        if (row === startRow && forward2 && !gameState.board[forward2.row][forward2.col]) {
            moves.push(forward2);
        }
    }
    
    // 斜向吃子
    [-1, 1].forEach(offset => {
        const newPos = wrapCoordinates(row + direction, col + offset);
        if (newPos) {
            const targetPiece = gameState.board[newPos.row][newPos.col];
            // 考慮顏色翻轉：在Klein模式中，翻轉後的顏色必須與對手匹配
            const effectiveColor = newPos.colorFlip ? (color === 'white' ? 'black' : 'white') : color;
            if (targetPiece && targetPiece.color !== effectiveColor) {
                moves.push(newPos);
            }
        }
    });
    
    return moves;
}

// 城堡的移動
function getRookMoves(row, col, color) {
    return getStraightMoves(row, col, color);
}

// 騎士的移動
function getKnightMoves(row, col, color) {
    const moves = [];
    const offsets = [
        [-2, -1], [-2, 1], [-1, -2], [-1, 2],
        [1, -2], [1, 2], [2, -1], [2, 1]
    ];
    
    offsets.forEach(([dRow, dCol]) => {
        const newPos = wrapCoordinates(row + dRow, col + dCol);
        if (newPos) {
            const targetPiece = gameState.board[newPos.row][newPos.col];
            const effectiveColor = newPos.colorFlip ? (color === 'white' ? 'black' : 'white') : color;
            if (!targetPiece || targetPiece.color !== effectiveColor) {
                moves.push(newPos);
            }
        }
    });
    
    return moves;
}

// 主教的移動
function getBishopMoves(row, col, color) {
    return getDiagonalMoves(row, col, color);
}

// 皇后的移動
function getQueenMoves(row, col, color) {
    return [...getStraightMoves(row, col, color), ...getDiagonalMoves(row, col, color)];
}

// 國王的移動
function getKingMoves(row, col, color) {
    const moves = [];
    const offsets = [
        [-1, -1], [-1, 0], [-1, 1],
        [0, -1],           [0, 1],
        [1, -1],  [1, 0],  [1, 1]
    ];
    
    offsets.forEach(([dRow, dCol]) => {
        const newPos = wrapCoordinates(row + dRow, col + dCol);
        if (newPos) {
            const targetPiece = gameState.board[newPos.row][newPos.col];
            const effectiveColor = newPos.colorFlip ? (color === 'white' ? 'black' : 'white') : color;
            if (!targetPiece || targetPiece.color !== effectiveColor) {
                moves.push(newPos);
            }
        }
    });
    
    return moves;
}

// 直線移動（城堡和皇后）
function getStraightMoves(row, col, color) {
    const moves = [];
    const directions = [[0, 1], [0, -1], [1, 0], [-1, 0]];
    
    directions.forEach(([dRow, dCol]) => {
        let steps = 0;
        const maxSteps = 8; // 在torus/klein模式中，最多走8步避免無限循環
        
        while (steps < maxSteps) {
            steps++;
            const newPos = wrapCoordinates(row + dRow * steps, col + dCol * steps);
            
            if (!newPos) break;
            
            // 檢查是否回到起始位置（在環繞模式中）
            if (newPos.row === row && newPos.col === col) break;
            
            const targetPiece = gameState.board[newPos.row][newPos.col];
            const effectiveColor = newPos.colorFlip ? (color === 'white' ? 'black' : 'white') : color;
            
            if (!targetPiece) {
                moves.push(newPos);
            } else {
                if (targetPiece.color !== effectiveColor) {
                    moves.push(newPos);
                }
                break;
            }
        }
    });
    
    return moves;
}

// 斜線移動（主教和皇后）
function getDiagonalMoves(row, col, color) {
    const moves = [];
    const directions = [[1, 1], [1, -1], [-1, 1], [-1, -1]];
    
    directions.forEach(([dRow, dCol]) => {
        let steps = 0;
        const maxSteps = 8; // 在torus/klein模式中，最多走8步避免無限循環
        
        while (steps < maxSteps) {
            steps++;
            const newPos = wrapCoordinates(row + dRow * steps, col + dCol * steps);
            
            if (!newPos) break;
            
            // 檢查是否回到起始位置（在環繞模式中）
            if (newPos.row === row && newPos.col === col) break;
            
            const targetPiece = gameState.board[newPos.row][newPos.col];
            const effectiveColor = newPos.colorFlip ? (color === 'white' ? 'black' : 'white') : color;
            
            if (!targetPiece) {
                moves.push(newPos);
            } else {
                if (targetPiece.color !== effectiveColor) {
                    moves.push(newPos);
                }
                break;
            }
        }
    });
    
    return moves;
}

// 檢查坐標是否有效
function isValidSquare(row, col) {
    if (gameState.gameMode === 'standard') {
        return row >= 0 && row < 8 && col >= 0 && col < 8;
    }
    // 對於torus和klein模式，所有坐標都可以通過包裝處理
    return true;
}

// 包裝坐標（用於torus和klein bottle模式）
// 返回: { row, col, colorFlip }
function wrapCoordinates(row, col) {
    if (gameState.gameMode === 'standard') {
        if (row < 0 || row >= 8 || col < 0 || col >= 8) {
            return null;
        }
        return { row, col, colorFlip: false };
    }
    
    let colorFlip = false;
    
    if (gameState.gameMode === 'klein') {
        // Klein bottle: 水平穿越時翻轉顏色
        if (col < 0 || col >= 8) {
            colorFlip = true;
        }
    }
    
    // 包裝坐標到0-7範圍內
    const wrappedRow = ((row % 8) + 8) % 8;
    const wrappedCol = ((col % 8) + 8) % 8;
    
    return { row: wrappedRow, col: wrappedCol, colorFlip };
}

// 翻轉棋子顏色
function flipPieceColor(piece) {
    if (!piece) return null;
    return {
        ...piece,
        color: piece.color === 'white' ? 'black' : 'white'
    };
}

// 檢查是否將軍
function isInCheck(color) {
    // 找到國王位置
    let kingPos = null;
    for (let row = 0; row < 8; row++) {
        for (let col = 0; col < 8; col++) {
            const piece = gameState.board[row][col];
            if (piece && piece.type === 'king' && piece.color === color) {
                kingPos = { row, col };
                break;
            }
        }
        if (kingPos) break;
    }
    
    if (!kingPos) return false;
    
    // 檢查對方所有棋子是否能攻擊國王
    const opponentColor = color === 'white' ? 'black' : 'white';
    for (let row = 0; row < 8; row++) {
        for (let col = 0; col < 8; col++) {
            const piece = gameState.board[row][col];
            if (piece && piece.color === opponentColor) {
                const moves = getValidMovesWithoutCheckValidation(row, col);
                if (moves.some(move => move.row === kingPos.row && move.col === kingPos.col)) {
                    return true;
                }
            }
        }
    }
    
    return false;
}

// 獲取有效移動（不驗證將軍，避免無限遞歸）
function getValidMovesWithoutCheckValidation(row, col) {
    const piece = gameState.board[row][col];
    if (!piece) return [];
    
    switch (piece.type) {
        case 'pawn':
            return getPawnMoves(row, col, piece.color);
        case 'rook':
            return getRookMoves(row, col, piece.color);
        case 'knight':
            return getKnightMoves(row, col, piece.color);
        case 'bishop':
            return getBishopMoves(row, col, piece.color);
        case 'queen':
            return getQueenMoves(row, col, piece.color);
        case 'king':
            return getKingMoves(row, col, piece.color);
        default:
            return [];
    }
}

// 檢查移動後是否會將軍
function wouldBeInCheck(color, from, to) {
    // 模擬移動
    const originalPiece = gameState.board[to.row][to.col];
    const movingPiece = gameState.board[from.row][from.col];
    
    // 如果是Klein模式且需要翻轉顏色
    let pieceAtDestination = movingPiece;
    if (to.colorFlip) {
        pieceAtDestination = flipPieceColor(movingPiece);
    }
    
    gameState.board[to.row][to.col] = pieceAtDestination;
    gameState.board[from.row][from.col] = null;
    
    // 在Klein模式中，如果顏色翻轉，檢查翻轉後的顏色
    const checkColor = to.colorFlip ? (color === 'white' ? 'black' : 'white') : color;
    const inCheck = isInCheck(checkColor);
    
    // 恢復狀態
    gameState.board[from.row][from.col] = movingPiece;
    gameState.board[to.row][to.col] = originalPiece;
    
    return inCheck;
}

// 檢查是否有合法移動
function hasLegalMoves(color) {
    for (let row = 0; row < 8; row++) {
        for (let col = 0; col < 8; col++) {
            const piece = gameState.board[row][col];
            if (piece && piece.color === color) {
                const moves = getValidMoves(row, col);
                if (moves.length > 0) {
                    return true;
                }
            }
        }
    }
    return false;
}

// 檢查遊戲結束
function checkGameOver() {
    const currentColor = gameState.currentPlayer;
    const opponentColor = currentColor === 'white' ? 'black' : 'white';
    
    const currentInCheck = isInCheck(currentColor);
    const opponentInCheck = isInCheck(opponentColor);
    const hasLegalMove = hasLegalMoves(currentColor);
    
    const statusElement = document.getElementById('game-status');
    
    // 檢查異常情況：雙方都被將軍（在Torus/Klein模式中可能發生）
    if (currentInCheck && opponentInCheck) {
        statusElement.textContent = '⚠️ 異常：雙方都被將軍！遊戲狀態錯誤。';
        console.error('異常遊戲狀態：雙方國王都被將軍');
        return;
    }
    
    if (!hasLegalMove) {
        gameState.isGameOver = true;
        if (currentInCheck) {
            const winner = currentColor === 'white' ? '黑方' : '白方';
            statusElement.textContent = `將死！${winner}獲勝！`;
        } else {
            statusElement.textContent = '和局！（僵局）';
        }
    } else if (currentInCheck) {
        statusElement.textContent = '將軍！';
    } else {
        statusElement.textContent = '';
    }
}

// 渲染被吃棋子
function renderCapturedPieces() {
    const capturedWhiteElement = document.getElementById('captured-white');
    const capturedBlackElement = document.getElementById('captured-black');
    
    capturedWhiteElement.innerHTML = gameState.capturedPieces.white
        .map(piece => `<span class="captured-piece">${PIECES.white[piece.type]}</span>`)
        .join('');
    
    capturedBlackElement.innerHTML = gameState.capturedPieces.black
        .map(piece => `<span class="captured-piece">${PIECES.black[piece.type]}</span>`)
        .join('');
}

// 重置遊戲
function resetGame() {
    const currentMode = gameState.gameMode; // 保留當前模式
    gameState = {
        board: initBoard(),
        currentPlayer: 'white',
        selectedSquare: null,
        validMoves: [],
        moveHistory: [],
        capturedPieces: { white: [], black: [] },
        isGameOver: false,
        gameMode: currentMode
    };
    renderBoard();
}

// 悔棋
function undoMove() {
    if (gameState.moveHistory.length === 0) return;
    
    const lastMove = gameState.moveHistory.pop();
    
    // 恢復棋子位置
    gameState.board[lastMove.from.row][lastMove.from.col] = lastMove.piece;
    gameState.board[lastMove.to.row][lastMove.to.col] = lastMove.capturedPiece;
    
    // 恢復被吃棋子列表
    if (lastMove.capturedPiece) {
        const capturedColor = lastMove.capturedPiece.color;
        gameState.capturedPieces[capturedColor].pop();
    }
    
    // 切換回上一個玩家
    gameState.currentPlayer = gameState.currentPlayer === 'white' ? 'black' : 'white';
    
    // 清除選擇
    gameState.selectedSquare = null;
    gameState.validMoves = [];
    gameState.isGameOver = false;
    
    renderBoard();
}

// 初始化遊戲
function initGame() {
    gameState.board = initBoard();
    renderBoard();
    
    // 綁定按鈕事件
    document.getElementById('reset-btn').addEventListener('click', resetGame);
    document.getElementById('undo-btn').addEventListener('click', undoMove);
    
    // 綁定模式選擇器事件
    const modeSelector = document.getElementById('game-mode');
    const modeDescription = document.getElementById('mode-description');
    
    modeSelector.addEventListener('change', (e) => {
        gameState.gameMode = e.target.value;
        modeDescription.textContent = MODE_DESCRIPTIONS[e.target.value];
        resetGame();
    });
}

// 當頁面載入完成時初始化遊戲
window.addEventListener('DOMContentLoaded', initGame);

