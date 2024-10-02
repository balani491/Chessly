
import React, { useState } from "react";
import Board from "./Board";
import { Chess } from "chess.js";
import { ToastContainer, toast } from "react-toastify";
import 'react-toastify/dist/ReactToastify.css'; // Import toast styles

const generateBoardState = (gameInstance) => {
  return Array(8).fill(null).map((_, rowIndex) =>
    Array(8).fill(null).map((_, colIndex) => {
      const squareLabel = `${String.fromCharCode(97 + colIndex)}${8 - rowIndex}`;
      return gameInstance.get(squareLabel);
    })
  );
};

// Function to get the chess piece's symbol (using Unicode)
const getPieceSymbol = (piece) => {
  const pieceSymbols = {
    w: {
      p: "♙",
      n: "♘",
      b: "♗",
      r: "♖",
      q: "♕",
      k: "♔"
    },
    b: {
      p: "♟",
      n: "♞",
      b: "♝",
      r: "♜",
      q: "♛",
      k: "♚"
    }
  };
  
  return piece ? pieceSymbols[piece.color][piece.type] : "";
};

const App = () => {
  const [game, setGame] = useState(new Chess());
  const [boardState, setBoardState] = useState(generateBoardState(game));
  const [moveHistory, setMoveHistory] = useState([]);
  const [capturedByWhite, setCapturedByWhite] = useState([]); // Pieces captured by White
  const [capturedByBlack, setCapturedByBlack] = useState([]); // Pieces captured by Black
  const [selectedSquare, setSelectedSquare] = useState(null); // Track selected square

  const currentPlayer = game.turn() === 'w' ? 'w' : 'b'; // 'w' for White, 'b' for Black

  const handleSquareClick = (row, col) => {
    const square = `${String.fromCharCode(97 + col)}${8 - row}`;
    const selectedPiece = game.get(square); // Get the piece at the selected square
  
    if (selectedSquare) {
      const currentlySelectedPiece = game.get(selectedSquare); // The piece currently selected
  
      // If the square clicked is the same as the current selection, deselect it
      if (selectedSquare === square) {
        setSelectedSquare(null); // Deselect the currently selected square
        return;
      }
  
      // If you click on another piece of the same color, re-select that piece
      if (selectedPiece && selectedPiece.color === currentPlayer) {
        setSelectedSquare(square); // Re-select the new piece of the same color
        return;
      }
  
      // Otherwise, attempt to move the selected piece
      handleMove(selectedSquare, square);
      setSelectedSquare(null); // Reset selection after move attempt
  
    } else {
      // First click: select the piece to move (fromSquare)
      if (selectedPiece && selectedPiece.color === currentPlayer) {
        setSelectedSquare(square); // Select only if it's the correct player's piece
      } else if (selectedPiece && selectedPiece.color !== currentPlayer) {
        toast.error(`Invalid selection: It's ${currentPlayer === 'w' ? 'White' : 'Black'}'s turn!`);
      } else {
        toast.error("Invalid selection: No piece at this square!");
      }
    }
  };

  const handleMove = (fromSquare, toSquare) => {
    const piece = game.get(fromSquare); // Get the piece being moved
    const move = game.move({ from: fromSquare, to: toSquare });
  
    if (move) {
      const pieceSymbol = getPieceSymbol(piece); // Get the symbol of the moved piece
      const moveDescription = `${pieceSymbol} moved from ${move.from} to ${move.to}`;
  
      // Update board state and move history
      setBoardState(generateBoardState(game));
      setMoveHistory([...moveHistory, moveDescription]); // Add the detailed move to the history
  
      // If a piece was captured, update the captured pieces list
      if (move.captured) {
        const capturedPieceSymbol = getPieceSymbol({ color: game.turn() === 'w' ? 'b' : 'w', type: move.captured });
  
        if (game.turn() === 'b') {
          // White captured a black piece
          setCapturedByWhite([...capturedByWhite, capturedPieceSymbol]);
        } else {
          // Black captured a white piece
          setCapturedByBlack([...capturedByBlack, capturedPieceSymbol]);
        }
      }
  
      // Check for checkmate, draw, or check
      if (game.isCheckmate()) {
        toast.success(`${currentPlayer === 'w' ? 'Black' : 'White'} wins by checkmate!`);
      } else if (game.isDraw()) {
        toast.info('The game is a draw!');
      } else if (game.inCheck()) { // Use game.inCheck() to check for check
        toast.info(`${currentPlayer === 'w' ? 'White' : 'Black'} is in check!`);
      }
    } else {
      // Provide detailed error toast for invalid move
      toast.error(`Invalid move from ${fromSquare} to ${toSquare}. Try again.`);
      setSelectedSquare(null); // Reset selection after an invalid move
  
      // Force re-render to ensure the toast shows up
      setBoardState(generateBoardState(game)); // Refresh the board even if invalid
    }
  };

  // Function to handle undoing the last move
  const handleUndo = () => {
    const lastMove = game.undo(); // Undo the last move
  
    if (lastMove) {
      const { captured, color } = lastMove;
  
      // Update captured pieces if necessary
      if (captured) {
        if (color === 'w') {
          setCapturedByBlack(capturedByBlack.slice(0, -1)); // Undo White's capture (remove last Black piece)
        } else {
          setCapturedByWhite(capturedByWhite.slice(0, -1)); // Undo Black's capture (remove last White piece)
        }
      }
  
      // Remove the last move from the history
      setMoveHistory(moveHistory.slice(0, -1));
  
      // Update the board state after undoing the move
      setBoardState(generateBoardState(game));
      toast.info('Last move undone');
    } else {
      toast.error("No moves to undo!");
    }
  };

  return (
    <div className="App">
      <nav className="navbar">
        <h1 className="nav-h1">Chessly</h1>
      </nav>

      <h2>Current Turn: {currentPlayer === 'w' ? 'White' : 'Black'}</h2>
      <div className="below">
      <div className="left">
        {/* Chess Board */}
        <Board boardState={boardState} handleMove={handleSquareClick} selectedSquare={selectedSquare} />
      </div>
      
      <div className="right">
        {/* Captured Pieces */}
        <div className="captured-pieces">
          <h3>Captured by White:</h3>
          <div>{capturedByWhite.map((piece, index) => <span key={index}>{piece} </span>)}</div>

          <h3>Captured by Black:</h3>
          <div>{capturedByBlack.map((piece, index) => <span key={index}>{piece} </span>)}</div>
        </div>

        {/* Move History */}
        <div className="move-history">
          <h3>Move History</h3>
          <ol>
            {moveHistory.map((move, index) => (
              <li key={index}>{move}</li>
            ))}
          </ol>
        </div>

        {/* Undo Button */}
        <button onClick={handleUndo}>Undo Last Move</button>
      </div>
      
      </div>
      {/* Toast Container for notifications */}
      <ToastContainer />
    </div>
  );
};

export default App;
