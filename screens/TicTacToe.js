import React, { useState } from 'react';
import { View, Text, SafeAreaView, TouchableOpacity, StyleSheet, Button } from 'react-native';

const TicTacToe = () => {
  const emptyBoard = [
    [null, null, null],
    [null, null, null],
    [null, null, null],
  ];

  const [board, setBoard] = useState(emptyBoard);
  const [turn, setTurn] = useState('X');
  const [winner, setWinner] = useState(null);

  // Check all winning conditions: rows, columns, and diagonals.
  const checkWinner = (currentBoard) => {
    // Check rows.
    for (let i = 0; i < 3; i++) {
      if (
        currentBoard[i][0] &&
        currentBoard[i][0] === currentBoard[i][1] &&
        currentBoard[i][1] === currentBoard[i][2]
      ) {
        return currentBoard[i][0];
      }
    }
    // Check columns.
    for (let j = 0; j < 3; j++) {
      if (
        currentBoard[0][j] &&
        currentBoard[0][j] === currentBoard[1][j] &&
        currentBoard[1][j] === currentBoard[2][j]
      ) {
        return currentBoard[0][j];
      }
    }
    // Check main diagonal.
    if (
      currentBoard[0][0] &&
      currentBoard[0][0] === currentBoard[1][1] &&
      currentBoard[1][1] === currentBoard[2][2]
    ) {
      return currentBoard[0][0];
    }
    // Check anti-diagonal.
    if (
      currentBoard[0][2] &&
      currentBoard[0][2] === currentBoard[1][1] &&
      currentBoard[1][1] === currentBoard[2][0]
    ) {
      return currentBoard[0][2];
    }
    return null;
  };

  const handleCellPress = (row, col) => {
    // Ignore if the cell is already occupied or the game has ended.
    if (board[row][col] || winner) return;

    const updatedBoard = board.map((r, rowIndex) =>
      r.map((cell, colIndex) => {
        if (rowIndex === row && colIndex === col) {
          return turn;
        }
        return cell;
      })
    );

    setBoard(updatedBoard);

    // Check for a winner.
    const gameWinner = checkWinner(updatedBoard);
    if (gameWinner) {
      setWinner(gameWinner);
    } else if (updatedBoard.every(row => row.every(cell => cell !== null))) {
      // If every cell is filled and there's no winner, it's a draw.
      setWinner('Draw');
    } else {
      // Toggle turn.
      setTurn(turn === 'X' ? 'O' : 'X');
    }
  };

  const resetGame = () => {
    setBoard(emptyBoard);
    setTurn('X');
    setWinner(null);
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.infoText}>
        {winner ? (winner === 'Draw' ? "It's a Draw!" : `Winner: ${winner}`) : `Turn: ${turn}`}
      </Text>
      <View style={styles.board}>
        {board.map((row, rowIndex) => (
          <View style={styles.row} key={rowIndex}>
            {row.map((cell, colIndex) => (
              <TouchableOpacity
                key={colIndex}
                style={[
                  styles.cell,
                  colIndex < 2 && styles.cellBorderRight,
                  rowIndex < 2 && styles.cellBorderBottom,
                ]}
                onPress={() => handleCellPress(rowIndex, colIndex)}
              >
                <Text style={styles.cellText}>{cell}</Text>
              </TouchableOpacity>
            ))}
          </View>
        ))}
      </View>
      <View style={styles.resetButton}>
        <Button title="Reset Game" onPress={resetGame} />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoText: {
    fontSize: 24,
    marginBottom: 20,
  },
  board: {
    width: 300,
    height: 300,
  },
  row: {
    flex: 1,
    flexDirection: 'row',
  },
  cell: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cellText: {
    fontSize: 48,
  },
  cellBorderRight: {
    borderRightWidth: 4,
    borderRightColor: 'black',
  },
  cellBorderBottom: {
    borderBottomWidth: 4,
    borderBottomColor: 'black',
  },
  resetButton: {
    marginTop: 20,
  },
});

export default TicTacToe;
