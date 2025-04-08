// App.js
import React, { useState, useEffect, useRef } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  TouchableOpacity, 
  Dimensions, 
  StatusBar,
  Animated,
  Easing
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');
const BOARD_SIZE = width * 0.9;
const CELL_SIZE = BOARD_SIZE / 3;

export default function App() {
  // Reference to track if component is mounted
  const isMounted = useRef(true);

  const [playerSymbol, setPlayerSymbol] = useState(null); // 'X' or 'O'
  const [board, setBoard] = useState(Array(9).fill(null));
  const [currentTurn, setCurrentTurn] = useState('X'); // X always starts
  const [winner, setWinner] = useState(null);
  const [winningLine, setWinningLine] = useState(null);
  const [gameStarted, setGameStarted] = useState(false);
  
  // Use useRef for persistent animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const slideAnim = useRef(new Animated.Value(-100)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const symbolAnimations = useRef(
    Array(9).fill().map(() => new Animated.Value(0))
  ).current;
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);
  
  useEffect(() => {
    // Entrance animation for selection screen
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      })
    ]).start();
  }, [fadeAnim, scaleAnim, slideAnim]);

  useEffect(() => {
    if (gameStarted) {
      // Reset animations for game board
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 8,
          tension: 40,
          useNativeDriver: true,
        })
      ]).start();
    }
  }, [gameStarted, fadeAnim, scaleAnim]);

  useEffect(() => {
    // Computer's turn
    if (gameStarted && currentTurn !== playerSymbol && !winner) {
      const timer = setTimeout(() => {
        if (isMounted.current) {
          makeComputerMove();
        }
      }, 700); // Add a small delay to make it feel more natural
      
      return () => clearTimeout(timer);
    }
  }, [currentTurn, gameStarted, winner, playerSymbol]);

  const selectSymbol = (symbol) => {
    // Animation for selection
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1.05,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      })
    ]).start();
    
    // Slight delay before transitioning to game
    setTimeout(() => {
      if (isMounted.current) {
        setPlayerSymbol(symbol);
        setGameStarted(true);
        
        // Call resetGame after state updates
        setTimeout(() => {
          if (isMounted.current) {
            resetGame(symbol);
          }
        }, 100);
      }
    }, 300);
  };

  const resetGame = (symbol = playerSymbol) => {
    // Clear the board
    setBoard(Array(9).fill(null));
    setCurrentTurn('X');
    setWinner(null);
    setWinningLine(null);
    
    // Reset symbol animations
    symbolAnimations.forEach(anim => anim.setValue(0));
    
    // Reset rotation animation
    rotateAnim.setValue(0);
    
    // If player chose O, computer (X) starts
    if (symbol === 'O') {
      setTimeout(() => {
        if (isMounted.current) {
          makeComputerMove();
        }
      }, 800);
    }
  };

  const checkWinner = (boardState) => {
    // All possible winning combinations
    const lines = [
      [0, 1, 2], [3, 4, 5], [6, 7, 8], // Rows
      [0, 3, 6], [1, 4, 7], [2, 5, 8], // Columns
      [0, 4, 8], [2, 4, 6]             // Diagonals
    ];
    
    for (let i = 0; i < lines.length; i++) {
      const [a, b, c] = lines[i];
      if (boardState[a] && boardState[a] === boardState[b] && boardState[a] === boardState[c]) {
        return { winner: boardState[a], line: lines[i] };
      }
    }
    
    // Check for draw
    if (boardState.every(cell => cell !== null)) {
      return { winner: 'draw', line: null };
    }
    
    return { winner: null, line: null };
  };
  
  const makeComputerMove = () => {
    if (winner || !isMounted.current) return;
    
    // Copy the current board
    const newBoard = [...board];
    
    // AI logic (simple)
    // 1. Try to win
    // 2. Block player from winning
    // 3. Take center
    // 4. Take corner
    // 5. Take any available cell
    
    const computerSymbol = playerSymbol === 'X' ? 'O' : 'X';
    
    // Find winning move for computer
    const winningMove = findWinningMove(newBoard, computerSymbol);
    if (winningMove !== -1) {
      makeMove(winningMove);
      return;
    }
    
    // Block player's winning move
    const blockingMove = findWinningMove(newBoard, playerSymbol);
    if (blockingMove !== -1) {
      makeMove(blockingMove);
      return;
    }
    
    // Take center if available
    if (newBoard[4] === null) {
      makeMove(4);
      return;
    }
    
    // Take corner if available
    const corners = [0, 2, 6, 8];
    const availableCorners = corners.filter(i => newBoard[i] === null);
    if (availableCorners.length > 0) {
      const randomCorner = availableCorners[Math.floor(Math.random() * availableCorners.length)];
      makeMove(randomCorner);
      return;
    }
    
    // Take any available cell
    const availableCells = newBoard.map((cell, index) => cell === null ? index : null).filter(index => index !== null);
    if (availableCells.length > 0) {
      const randomMove = availableCells[Math.floor(Math.random() * availableCells.length)];
      makeMove(randomMove);
    }
  };
  
  const findWinningMove = (boardState, symbol) => {
    const lines = [
      [0, 1, 2], [3, 4, 5], [6, 7, 8], // Rows
      [0, 3, 6], [1, 4, 7], [2, 5, 8], // Columns
      [0, 4, 8], [2, 4, 6]             // Diagonals
    ];
    
    for (let i = 0; i < lines.length; i++) {
      const [a, b, c] = lines[i];
      // Check if we can win in this line
      if (boardState[a] === symbol && boardState[b] === symbol && boardState[c] === null) return c;
      if (boardState[a] === symbol && boardState[c] === symbol && boardState[b] === null) return b;
      if (boardState[b] === symbol && boardState[c] === symbol && boardState[a] === null) return a;
    }
    
    return -1; // No winning move found
  };
  
  const makeMove = (index) => {
    if (board[index] !== null || winner || !isMounted.current) return;
    
    const newBoard = [...board];
    newBoard[index] = currentTurn;
    setBoard(newBoard);
    
    // Animate the symbol appearance
    Animated.spring(symbolAnimations[index], {
      toValue: 1,
      friction: 5,
      tension: 40,
      useNativeDriver: true,
    }).start();
    
    // Check if there's a winner
    const result = checkWinner(newBoard);
    if (result.winner) {
      setWinner(result.winner);
      setWinningLine(result.line);
      
      // Winning animation
      if (result.line) {
        Animated.loop(
          Animated.timing(rotateAnim, {
            toValue: 1,
            duration: 1500,
            easing: Easing.linear,
            useNativeDriver: true
          })
        ).start();
      }
    } else {
      setCurrentTurn(currentTurn === 'X' ? 'O' : 'X');
    }
  };
  
  const handleCellPress = (index) => {
    // Only allow player to make a move on their turn
    if (currentTurn === playerSymbol && !winner) {
      makeMove(index);
    }
  };
  
  const renderSymbol = (index) => {
    const value = board[index];
    
    if (!value) return null;
    
    const isWinningCell = winningLine && winningLine.includes(index);
    
    const animatedStyle = {
      transform: [
        { scale: symbolAnimations[index] },
        ...(isWinningCell ? [{
          rotate: rotateAnim.interpolate({
            inputRange: [0, 1],
            outputRange: ['0deg', '360deg']
          })
        }] : [])
      ],
      opacity: symbolAnimations[index]
    };
    
    return (
      <Animated.View style={[styles.symbol, animatedStyle]}>
        <Text style={[
          styles.symbolText,
          { color: value === 'X' ? '#FF5252' : '#448AFF' },
          isWinningCell && styles.winningSymbol
        ]}>
          {value}
        </Text>
      </Animated.View>
    );
  };
  
  const renderCell = (index) => {
    const isSelectable = !board[index] && !winner && currentTurn === playerSymbol;
    
    return (
      <TouchableOpacity
        key={index}
        style={[
          styles.cell,
          {
            borderTopWidth: index < 3 ? 0 : 2,
            borderLeftWidth: index % 3 === 0 ? 0 : 2,
          }
        ]}
        onPress={() => handleCellPress(index)}
        activeOpacity={isSelectable ? 0.7 : 1}
      >
        {renderSymbol(index)}
      </TouchableOpacity>
    );
  };
  
  const renderStatus = () => {
    if (winner === 'draw') {
      return <Text style={styles.statusText}>It's a draw!</Text>;
    } else if (winner) {
      return (
        <Text style={styles.statusText}>
          {winner === playerSymbol ? 'You win!' : 'Computer wins!'}
        </Text>
      );
    } else {
      return (
        <Text style={styles.statusText}>
          {currentTurn === playerSymbol ? 'Your turn' : 'Computer is thinking...'}
        </Text>
      );
    }
  };
  
  const renderSelectionScreen = () => {
    return (
      <Animated.View 
        style={[
          styles.selectionContainer,
          {
            opacity: fadeAnim,
            transform: [
              { scale: scaleAnim },
              { translateY: slideAnim }
            ]
          }
        ]}
      >
        <Text style={styles.title}>Tic Tac Toe</Text>
        <Text style={styles.selectText}>Choose your symbol</Text>
        <View style={styles.symbolContainer}>
          <TouchableOpacity 
            style={styles.symbolButton} 
            onPress={() => selectSymbol('X')}
          >
            <LinearGradient
              colors={['#FF5252', '#B71C1C']}
              style={styles.symbolGradient}
            >
              <Text style={styles.symbolButtonText}>X</Text>
            </LinearGradient>
          </TouchableOpacity>
          <Text style={styles.orText}>or</Text>
          <TouchableOpacity 
            style={styles.symbolButton}
            onPress={() => selectSymbol('O')}
          >
            <LinearGradient
              colors={['#448AFF', '#0D47A1']}
              style={styles.symbolGradient}
            >
              <Text style={styles.symbolButtonText}>O</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </Animated.View>
    );
  };
  
  const renderGameBoard = () => {
    return (
      <Animated.View 
        style={[
          styles.container,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }]
          }
        ]}
      >
        <Text style={styles.title}>Tic Tac Toe</Text>
        {renderStatus()}
        <View style={styles.board}>
          {Array(9).fill().map((_, index) => renderCell(index))}
        </View>
        {winner && (
          <TouchableOpacity 
            style={styles.resetButton}
            onPress={() => resetGame()}
          >
            <LinearGradient
              colors={['#4CAF50', '#2E7D32']}
              style={styles.resetButtonGradient}
            >
              <Text style={styles.resetButtonText}>Play Again</Text>
            </LinearGradient>
          </TouchableOpacity>
        )}
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => {
            setGameStarted(false);
            setPlayerSymbol(null);
          }}
        >
          <Text style={styles.backButtonText}>Change Symbol</Text>
        </TouchableOpacity>
      </Animated.View>
    );
  };
  
  return (
    <LinearGradient
      colors={['#303F9F', '#1A237E']}
      style={styles.background}
    >
      <StatusBar barStyle="light-content" />
      {!gameStarted ? renderSelectionScreen() : renderGameBoard()}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    width: '100%',
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 20,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  statusText: {
    fontSize: 20,
    color: 'white',
    marginBottom: 30,
    textAlign: 'center',
  },
  board: {
    width: BOARD_SIZE,
    height: BOARD_SIZE,
    flexDirection: 'row',
    flexWrap: 'wrap',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 10,
    overflow: 'hidden',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  cell: {
    width: CELL_SIZE,
    height: CELL_SIZE,
    justifyContent: 'center',
    alignItems: 'center',
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  symbol: {
    width: CELL_SIZE * 0.7,
    height: CELL_SIZE * 0.7,
    justifyContent: 'center',
    alignItems: 'center',
  },
  symbolText: {
    fontSize: CELL_SIZE * 0.5,
    fontWeight: 'bold',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  winningSymbol: {
    textShadowColor: 'rgba(255, 215, 0, 0.7)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  resetButton: {
    marginTop: 30,
    width: BOARD_SIZE * 0.6,
    height: 50,
    borderRadius: 25,
    overflow: 'hidden',
  },
  resetButtonGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  resetButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  backButton: {
    marginTop: 15,
    padding: 10,
  },
  backButtonText: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 16,
  },
  selectionContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    width: '100%',
  },
  selectText: {
    fontSize: 24,
    color: 'white',
    marginBottom: 30,
  },
  symbolContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  symbolButton: {
    width: 100,
    height: 100,
    borderRadius: 20,
    overflow: 'hidden',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  symbolGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  symbolButtonText: {
    fontSize: 48,
    fontWeight: 'bold',
    color: 'white',
  },
  orText: {
    fontSize: 18,
    color: 'white',
    marginHorizontal: 20,
  }
});