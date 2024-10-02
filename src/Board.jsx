import React from "react";

// Define a mapping of chess pieces to their respective Unicode symbols
const pieceSymbols = {
  p: { w: "♙", b: "♟︎" },
  r: { w: "♖", b: "♜" },
  n: { w: "♘", b: "♞" },
  b: { w: "♗", b: "♝" },
  q: { w: "♕", b: "♛" },
  k: { w: "♔", b: "♚" }
};

const Board = ({ boardState, handleMove, selectedSquare }) => {
  const renderSquare = (row, col) => {
    const isBlack = (row + col) % 2 === 1;
    const squareClass = isBlack ? "black-square" : "white-square";
    
    // Get the piece on this square (if any)
    const piece = boardState[row][col];
    const pieceDisplay = piece ? pieceSymbols[piece.type][piece.color] : null;

    // Create the square label (e.g., 'a1', 'e5')
    const squareLabel = `${String.fromCharCode(97 + col)}${8 - row}`;
    const isSelected = selectedSquare === squareLabel; // Check if the square is selected

    return (
      <div 
        key={`${row}-${col}`} 
        className={`square ${squareClass} ${isSelected ? "selected" : ""}`}
        onClick={() => handleMove(row, col)}
      >
        {pieceDisplay && <span className="piece">{pieceDisplay}</span>}
      </div>
    );
  };

  return (
    <div className="board">
      {Array(8)
        .fill(null)
        .map((_, row) =>
          <div key={row} className="row">
            {Array(8)
              .fill(null)
              .map((_, col) => renderSquare(row, col))
            }
          </div>
        )}
    </div>
  );
};

export default Board;
