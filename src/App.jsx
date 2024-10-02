
import React, { useState, useEffect } from "react";
import Board from "./Board";
import { Chess } from "chess.js";
import { ToastContainer, toast } from "react-toastify";
import 'react-toastify/dist/ReactToastify.css'; 
import './App.css'; 

const generateBoardState = (gameInstance) => {
  return Array(8).fill(null).map((_, rowIndex) =>
    Array(8).fill(null).map((_, colIndex) => {
      const squareLabel = `${String.fromCharCode(97 + colIndex)}${8 - rowIndex}`;
      return gameInstance.get(squareLabel);
    })
  );
};

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
  const [game, setGame] = useState(null);
  const [boardState, setBoardState] = useState([]);
  const [moveHistory, setMoveHistory] = useState([]);
  const [capturedByWhite, setCapturedByWhite] = useState([]);
  const [capturedByBlack, setCapturedByBlack] = useState([]);
  const [selectedSquare, setSelectedSquare] = useState(null);

  const currentPlayer = game?.turn() === 'w' ? 'w' : 'b';

  const saveGameToLocalStorage = () => {
    if (game) {
      const gameState = {
        fen: game.fen(),
        moveHistory,
        capturedByWhite,
        capturedByBlack,
        selectedSquare
      };
      localStorage.setItem("chessGameState", JSON.stringify(gameState));
    }
  };

  const loadGameFromLocalStorage = () => {
    const savedState = JSON.parse(localStorage.getItem("chessGameState"));
    if (savedState) {
      const newGame = new Chess(savedState.fen);
      setGame(newGame);
      setBoardState(generateBoardState(newGame));
      setMoveHistory(savedState.moveHistory || []);
      setCapturedByWhite(savedState.capturedByWhite || []);
      setCapturedByBlack(savedState.capturedByBlack || []);
      setSelectedSquare(savedState.selectedSquare || null);
    } else {
      const newGame = new Chess();
      setGame(newGame);
      setBoardState(generateBoardState(newGame));
    }
  };

  useEffect(() => {
    // Load the game state from localStorage on initial render
    loadGameFromLocalStorage();
  }, []);

  useEffect(() => {
    // Save game state to localStorage whenever relevant state changes
    if (game) {
      saveGameToLocalStorage();
    }
  }, [game, moveHistory, capturedByWhite, capturedByBlack, selectedSquare]);

  const handleSquareClick = (row, col) => {
    if (!game) return;

    const square = `${String.fromCharCode(97 + col)}${8 - row}`;
    const selectedPiece = game.get(square);

    if (selectedSquare) {
      const currentlySelectedPiece = game.get(selectedSquare);

      if (selectedSquare === square) {
        setSelectedSquare(null);
        return;
      }

      if (selectedPiece && selectedPiece.color === currentPlayer) {
        setSelectedSquare(square);
        return;
      }

      handleMove(selectedSquare, square);
      setSelectedSquare(null);

    } else {
      if (selectedPiece && selectedPiece.color === currentPlayer) {
        setSelectedSquare(square);
      } else if (selectedPiece && selectedPiece.color !== currentPlayer) {
        toast.error(`Invalid selection: It's ${currentPlayer === 'w' ? 'White' : 'Black'}'s turn!`);
      } else {
        toast.error("Invalid selection: No piece at this square!");
      }
    }
  };

  const handleMove = (fromSquare, toSquare) => {
    if (!game) return;

    const piece = game.get(fromSquare);
    const move = game.move({ from: fromSquare, to: toSquare });

    if (move) {
      const pieceSymbol = getPieceSymbol(piece);
      const moveDescription = `${pieceSymbol} moved from ${move.from} to ${move.to}`;
      const capturedPiece = move.captured ? { color: game.turn() === 'w' ? 'b' : 'w', type: move.captured } : null;

      setBoardState(generateBoardState(game));
      setMoveHistory([...moveHistory, { description: moveDescription, capturedPiece }]);

      if (capturedPiece) {
        const capturedPieceSymbol = getPieceSymbol(capturedPiece);
        if (game.turn() === 'b') {
          setCapturedByWhite([...capturedByWhite, capturedPieceSymbol]);
        } else {
          setCapturedByBlack([...capturedByBlack, capturedPieceSymbol]);
        }
      }

      if (game.isCheckmate()) {
        toast.success(`${currentPlayer === 'w' ? 'Black' : 'White'} wins by checkmate!`);
      } else if (game.isDraw()) {
        toast.info('The game is a draw!');
      } else if (game.inCheck()) {
        toast.info(`${currentPlayer === 'w' ? 'White' : 'Black'} is in check!`);
      }
    } else {
      toast.error(`Invalid move from ${fromSquare} to ${toSquare}. Try again.`);
      setSelectedSquare(null);
      setBoardState(generateBoardState(game));
    }
  };

  const handleRestart = () => {
    const newGame = new Chess();
    setGame(newGame);
    setBoardState(generateBoardState(newGame));
    setMoveHistory([]);
    setCapturedByWhite([]);
    setCapturedByBlack([]);
    setSelectedSquare(null);
    toast.success("Game restarted!");
  };

  const handleUndo = () => {
    if (!game) return;

    const lastMove = game.undo();

    if (lastMove) {
      const { captured, color } = lastMove;
      const lastMoveDetails = moveHistory[moveHistory.length - 1];

      if (lastMoveDetails.capturedPiece) {
        const capturedPieceSymbol = getPieceSymbol(lastMoveDetails.capturedPiece);
        if (lastMoveDetails.capturedPiece.color === 'w') {
          setCapturedByWhite(capturedByWhite.slice(0, -1)); 
        } else {
          setCapturedByBlack(capturedByBlack.slice(0, -1)); 
        }
      }

      setMoveHistory(moveHistory.slice(0, -1));
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
        <button className="restart" onClick={handleRestart}>Restart Match</button>
      </nav>

      <h2>Current Turn: {currentPlayer === 'w' ? 'White' : 'Black'}</h2>
      <div className="below">
        <div className="left">
          <Board boardState={boardState} handleMove={handleSquareClick} selectedSquare={selectedSquare} />
        </div>
        <div className="right">
          <div className="captured-pieces">
            <h3>Captured by White:</h3>
            <div>{capturedByWhite.map((piece, index) => <span key={index}>{piece} </span>)}</div>

            <h3>Captured by Black:</h3>
            <div>{capturedByBlack.map((piece, index) => <span key={index}>{piece} </span>)}</div>
          </div>
          <div className="move-history">
            <h3>Move History</h3>
            <ol>
              {moveHistory.map((move, index) => (
                <li key={index}>
                  {move.description}
                  {move.capturedPiece && (
                    <span> (Captured: {getPieceSymbol(move.capturedPiece)})</span>
                  )}
                </li>
              ))}
            </ol>
          </div>
        </div>
      </div>
      <ToastContainer position="bottom-right" autoClose={5000} hideProgressBar={false} newestOnTop={false} closeOnClick pauseOnHover draggable />
      <div className="undo_btn">
        <button onClick={handleUndo}>Undo Last Move</button>
      </div>
    </div>
  );
};

export default App;
