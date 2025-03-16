import React, { useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Alert, Image, useWindowDimensions } from 'react-native';
import { numbering } from '../constants/numbering';
import { redInnerPath } from '../constants/redInnerPath';
import { yellowInnerPath } from '../constants/yellowInnerPath';
import { blueInnerPath } from '../constants/blueInnerPath';
import { greenInnerPath } from '../constants/greenInnerPath';









const GRID_SIZE = 13;
const maxIndex = Math.max(...Object.values(numbering));

 const indexToCoord = {};
Object.keys(numbering).forEach(numKey => {
  const idx = numbering[numKey];
  const [r, c] = numKey.split(',').map(Number);
  indexToCoord[idx] = { row: r, col: c };
});

// Define safe zones.
const safeZones = [
  { row: 7, col: 2 },
  { row: 10, col: 7 },
  { row: 2, col: 5 },
  { row: 5, col: 10 },
];
const isSafeZone = (coord) =>
  safeZones.some(zone => zone.row === coord.row && zone.col === coord.col);

const Grid = () => {
  const { width } = useWindowDimensions();
  const cellSize = Math.floor(width / GRID_SIZE);
  const blockSize = cellSize * 5;
  const innerBlockSize = blockSize * 0.7;

  // Default home positions for coins.
  const redHome = { row: 9, col: 1 };
  const yellowHome = { row: 1, col: 9 };

  // Two coins per color with a finished flag.
  const [redPieces, setRedPieces] = useState([
    { position: null, innerIndex: null, finished: false },
    { position: null, innerIndex: null, finished: false },
  ]);
  const [yellowPieces, setYellowPieces] = useState([
    { position: null, innerIndex: null, finished: false },
    { position: null, innerIndex: null, finished: false },
  ]);

  const [diceValue, setDiceValue] = useState(null);
  const [currentTurn, setCurrentTurn] = useState('red');
  const [isAnimating, setIsAnimating] = useState(false);
  // pendingMove is used when more than one coin is eligible.
  const [pendingMove, setPendingMove] = useState(null);
  const [gameOver, setGameOver] = useState(false);

  // Update a specific coin’s state.
  const updateCoinPosition = (color, coinIndex, newPos, newInnerIdx, finished = false) => {
    if (color === 'red') {
      setRedPieces(prev => {
        const updated = [...prev];
        updated[coinIndex] = { position: newPos, innerIndex: newInnerIdx, finished };
        return updated;
      });
    } else {
      setYellowPieces(prev => {
        const updated = [...prev];
        updated[coinIndex] = { position: newPos, innerIndex: newInnerIdx, finished };
        return updated;
      });
    }
  };

  // Check collision at the final destination.
  const checkCollision = (currentColor, movingCoord) => {
    const opponentPieces = currentColor === 'red' ? yellowPieces : redPieces;
    opponentPieces.forEach((coin, idx) => {
      if (coin.finished) return;
      const coinCoord = coin.innerIndex !== null
        ? (currentColor === 'red' ? yellowInnerPath[coin.innerIndex] : redInnerPath[coin.innerIndex])
        : (coin.position !== null ? indexToCoord[coin.position] : null);
      if (
        coinCoord &&
        coinCoord.row === movingCoord.row &&
        coinCoord.col === movingCoord.col &&
        !isSafeZone(movingCoord)
      ) {
        // Bump the opponent coin back to home.
        if (currentColor === 'red') {
          setYellowPieces(prev => {
            const updated = [...prev];
            updated[idx] = { position: null, innerIndex: null, finished: false };
            return updated;
          });
        } else {
          setRedPieces(prev => {
            const updated = [...prev];
            updated[idx] = { position: null, innerIndex: null, finished: false };
            return updated;
          });
        }
      }
    });
  };

  // Check win condition: if all coins of a color are finished.
  const checkWinCondition = (color) => {
    const pieces = color === 'red' ? redPieces : yellowPieces;
    const allFinished = pieces.every(coin => coin.finished);
    if (allFinished) {
      setGameOver(true);
      Alert.alert("Game Over", `${color.toUpperCase()} wins!`);
    }
  };

  // Animate movement of a coin.
  // For red, the coin enters its inner path after reaching position 42;
  // for yellow, after reaching position 20.
  // Collision is checked only at the final destination.
  const animateMovement = (color, coinIndex, currentPos, currentInnerIdx, stepsRemaining) => {
    const innerPath = color === 'red' ? redInnerPath : yellowInnerPath;
    const threshold = color === 'red' ? 42 : 20;
    const startingPosition = color === 'red' ? 0 : 22;

    // When no steps remain, the coin has finished moving.
    if (stepsRemaining === 0) {
      let finalCoord = currentInnerIdx !== null ? innerPath[currentInnerIdx] : indexToCoord[currentPos];
      if (currentInnerIdx !== null && currentInnerIdx === innerPath.length - 1) {
        updateCoinPosition(color, coinIndex, null, currentInnerIdx, true);
        Alert.alert("Coin Finished", `${color.toUpperCase()} coin finished!`);
      } else {
        checkCollision(color, finalCoord);
      }
      setIsAnimating(false);
      setCurrentTurn(color === 'red' ? 'yellow' : 'red');
      checkWinCondition(color);
      return;
    }

    // If in inner path and dice roll exceeds available steps, cancel movement.
    if (currentInnerIdx !== null) {
      const stepsNeeded = (innerPath.length - 1) - currentInnerIdx;
      if (stepsRemaining > stepsNeeded) {
        setIsAnimating(false);
        setCurrentTurn(color === 'red' ? 'yellow' : 'red');
        return;
      }
    }

    setTimeout(() => {
      let newPos = currentPos;
      let newInnerIdx = currentInnerIdx;
      let newCoord = null;

      if (currentPos === null && currentInnerIdx === null) {
        // Coin not in play: bring it into play.
        // **Important:** For a coin at home, if selected on a 6, it only comes out (no extra movement).
        newPos = startingPosition;
        newCoord = indexToCoord[newPos];
        updateCoinPosition(color, coinIndex, newPos, null);
      } else if (currentInnerIdx === null) {
        // Coin on the main board.
        if (color === 'red') {
          if (currentPos < threshold) {
            newPos = currentPos + 1;
            newCoord = indexToCoord[newPos];
          } else if (currentPos === threshold) {
            newInnerIdx = 0;
            newCoord = innerPath[0];
          }
        } else {
          if (currentPos !== threshold) {
            newPos = (currentPos + 1) % (maxIndex + 1);
            newCoord = indexToCoord[newPos];
          } else {
            newInnerIdx = 0;
            newCoord = innerPath[0];
          }
        }
        updateCoinPosition(color, coinIndex, newInnerIdx === null ? newPos : null, newInnerIdx);
      } else {
        // Coin already in inner path.
        if (currentInnerIdx < innerPath.length - 1) {
          newInnerIdx = currentInnerIdx + 1;
          newCoord = innerPath[newInnerIdx];
        }
        updateCoinPosition(color, coinIndex, newInnerIdx === null ? newPos : null, newInnerIdx);
      }

      // Continue moving without checking collision at intermediate steps.
      animateMovement(
        color,
        coinIndex,
        newInnerIdx === null ? newPos : null,
        newInnerIdx,
        stepsRemaining - 1
      );
    }, 300);
  };

  // Handle dice press.
  // • If a 6 is rolled and there is an eligible coin at home, let the user choose whether to bring that coin out or move a coin already in play.
  // • If only one eligible coin remains, auto move it.
  const onCenterPress = () => {
    if (gameOver || isAnimating || pendingMove) return;
    const dice = Math.floor(Math.random() * 6) + 1;
    setDiceValue(dice);

    const pieces = currentTurn === 'red' ? redPieces : yellowPieces;
    let eligibleCoins = [];
    for (let idx = 0; idx < pieces.length; idx++) {
      const coin = pieces[idx];
      if (coin.finished) continue;
      // A coin not in play is eligible only if dice is 6.
      if (coin.position === null && coin.innerIndex === null) {
        if (dice === 6) {
          eligibleCoins.push(idx);
        }
      } else {
        eligibleCoins.push(idx);
      }
    }

    if (eligibleCoins.length === 0) {
      setCurrentTurn(currentTurn === 'red' ? 'yellow' : 'red');
      return;
    }

    // If only one eligible coin remains, auto move it.
    if (eligibleCoins.length === 1) {
      const coinIndex = eligibleCoins[0];
      const coin = pieces[coinIndex];
      setIsAnimating(true);
      // For a coin at home, if chosen on a 6, simply bring it out without extra movement.
      if (coin.position === null && coin.innerIndex === null && dice === 6) {
        updateCoinPosition(currentTurn, coinIndex, currentTurn === 'red' ? 0 : 22, null);
        setCurrentTurn(currentTurn === 'red' ? 'yellow' : 'red');
      } else {
        animateMovement(currentTurn, coinIndex, coin.position, coin.innerIndex, dice);
      }
    } else {
      // More than one eligible coin – let the user choose.
      setPendingMove({ dice });
    }
  };

  // Render board grid cells.
  const cells = Array.from({ length: GRID_SIZE * GRID_SIZE }, (_, index) => {
    const row = Math.floor(index / GRID_SIZE);
    const col = index % GRID_SIZE;
    const isColoredCorner =
      (row < 5 && col < 5) ||
      (row < 5 && col >= GRID_SIZE - 5) ||
      (row >= GRID_SIZE - 5 && col < 5) ||
      (row >= GRID_SIZE - 5 && col >= GRID_SIZE - 5);
    let cellStyle = [styles.cell, { width: cellSize, height: cellSize }];

    if (!isColoredCorner) {
      if (row === 11 && col === 5) {
        cellStyle.push({ backgroundColor: 'red' });
      } else if (row === 1 && col === 7) {
        cellStyle.push({ backgroundColor: '#FFD700' });
      } else if (row === 5 && col === 1) {
        cellStyle.push({ backgroundColor: '#206ce6' });
      } else if (row === 7 && col === 11) {
        cellStyle.push({ backgroundColor: 'green' });
      }
    }
    if (isColoredCorner) {
      if (row < 5 && col < 5) {
        cellStyle.push({ backgroundColor: '#206ce6' });
      } else if (row < 5 && col >= GRID_SIZE - 5) {
        cellStyle.push({ backgroundColor: '#FFD700' });
      } else if (row >= GRID_SIZE - 5 && col < 5) {
        cellStyle.push({ backgroundColor: 'red' });
      } else if (row >= GRID_SIZE - 5 && col >= GRID_SIZE - 5) {
        cellStyle.push({ backgroundColor: 'green' });
      }
      cellStyle.push({ borderWidth: 0 });
    }
    if (row >= 5 && row <= 7 && col >= 5 && col <= 7) {
      cellStyle.push({ backgroundColor: 'pink', borderWidth: 0 });
    }
    const isYellowInner = yellowInnerPath.some(item => item.row === row && item.col === col);
    if (isYellowInner && (row !== 5 || col !== 6)) {
      cellStyle.push({ backgroundColor: '#FFD700' });
    }
    const isRedInner = redInnerPath.some(item => item.row === row && item.col === col);
    if (isRedInner && (row !== 7 || col !== 6)) {
      cellStyle.push({ backgroundColor: 'red' });
    }
    const isBlueInner = blueInnerPath.some(item => item.row === row && item.col === col);
    if (isBlueInner) {
      cellStyle.push({ backgroundColor: '#206ce6' });
    }
    const isGreenInner = greenInnerPath.some(item => item.row === row && item.col === col);
    if (isGreenInner) {
      cellStyle.push({ backgroundColor: 'green' });
    }
    return (
      <View key={index} style={cellStyle}>
        {isSafeZone({ row, col }) && (
          <Text style={styles.safeZoneStar}>⭐</Text>
        )}
      </View>
    );
  });

  return (
    <View style={styles.screen}>
      <Image source={require('../assets/ludofont.png')} style={styles.headerImage} />
      <View style={[styles.grid, { width: cellSize * GRID_SIZE, height: cellSize * GRID_SIZE }]}>
        {cells}
        {/* Render inner home blocks */}
        <View style={{
          position: 'absolute',
          top: (cellSize * 5 - innerBlockSize) / 2,
          left: (cellSize * 5 - innerBlockSize) / 2,
          width: innerBlockSize,
          height: innerBlockSize,
          borderRadius: 15,
          borderWidth: 3,
          borderColor: 'white',
          zIndex: 2,
        }} />
        <View style={{
          position: 'absolute',
          top: (cellSize * 5 - innerBlockSize) / 2,
          left: cellSize * (GRID_SIZE - 5) + (cellSize * 5 - innerBlockSize) / 2,
          width: innerBlockSize,
          height: innerBlockSize,
          borderRadius: 15,
          borderWidth: 3,
          borderColor: 'white',
          zIndex: 2,
        }} />
        <View style={{
          position: 'absolute',
          top: cellSize * (GRID_SIZE - 5) + (cellSize * 5 - innerBlockSize) / 2,
          left: (cellSize * 5 - innerBlockSize) / 2,
          width: innerBlockSize,
          height: innerBlockSize,
          borderRadius: 15,
          borderWidth: 3,
          borderColor: 'white',
          zIndex: 2,
        }} />
        <View style={{
          position: 'absolute',
          top: cellSize * (GRID_SIZE - 5) + (cellSize * 5 - innerBlockSize) / 2,
          left: cellSize * (GRID_SIZE - 5) + (cellSize * 5 - innerBlockSize) / 2,
          width: innerBlockSize,
          height: innerBlockSize,
          borderRadius: 15,
          borderWidth: 3,
          borderColor: 'white',
          zIndex: 2,
        }} />
        {/* Center dice component */}
        <TouchableOpacity
          style={[
            styles.centerBlock,
            { left: cellSize * 5, top: cellSize * 5, width: cellSize * 3, height: cellSize * 3 },
          ]}
          onPress={onCenterPress}
        >
          <Text style={styles.centerText}>
            {diceValue !== null ? diceValue : 'Roll'}
          </Text>
        </TouchableOpacity>
        {/* Render red coins (ignoring finished coins) */}
        {redPieces.map((coin, idx) => {
          if (coin.finished) return null;
          const coinCoord = coin.innerIndex !== null
            ? redInnerPath[coin.innerIndex]
            : (coin.position !== null ? indexToCoord[coin.position] : redHome);
          const offset = idx * 5;
          return (
            <TouchableOpacity
              key={`red-${idx}`}
              style={{
                position: 'absolute',
                top: coinCoord.row * cellSize + offset,
                left: coinCoord.col * cellSize + offset,
                zIndex: 3,
              }}
              onPress={() => {
                if (currentTurn === 'red' && pendingMove) {
                  // When a coin at home is chosen on a 6, simply bring it out.
                  if (coin.position === null && coin.innerIndex === null && pendingMove.dice === 6) {
                    updateCoinPosition('red', idx, 0, null);
                    setCurrentTurn('yellow');
                  } else {
                    setIsAnimating(true);
                    animateMovement('red', idx, coin.position, coin.innerIndex, pendingMove.dice);
                  }
                  setPendingMove(null);
                }
              }}
            >
              <Text style={styles.heartText}>❤️</Text>
            </TouchableOpacity>
          );
        })}
        {/* Render yellow coins (ignoring finished coins) */}
        {yellowPieces.map((coin, idx) => {
          if (coin.finished) return null;
          const coinCoord = coin.innerIndex !== null
            ? yellowInnerPath[coin.innerIndex]
            : (coin.position !== null ? indexToCoord[coin.position] : yellowHome);
          const offset = idx * 5;
          return (
            <TouchableOpacity
              key={`yellow-${idx}`}
              style={{
                position: 'absolute',
                top: coinCoord.row * cellSize + offset,
                left: coinCoord.col * cellSize + offset,
                zIndex: 3,
              }}
              onPress={() => {
                if (currentTurn === 'yellow' && pendingMove) {
                  if (coin.position === null && coin.innerIndex === null && pendingMove.dice === 6) {
                    updateCoinPosition('yellow', idx, 22, null);
                    setCurrentTurn('red');
                  } else {
                    setIsAnimating(true);
                    animateMovement('yellow', idx, coin.position, coin.innerIndex, pendingMove.dice);
                  }
                  setPendingMove(null);
                }
              }}
            >
              <Text style={styles.heartText}>💛</Text>
            </TouchableOpacity>
          );
        })}
      </View>
      <Text style={styles.turnText}>Current Turn: {currentTurn.toUpperCase()}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerImage: {
    width: '100%',
    height: 160,
    resizeMode: 'contain',
    marginTop: -40,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    position: 'relative',
    marginTop: 0,
  },
  cell: {
    borderWidth: 1,
    borderColor: 'grey',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  centerBlock: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.8)',
    borderWidth: 1,
    borderColor: '#000',
  },
  centerText: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  heartText: {
    fontSize: 24,
    zIndex: 3,
    textAlign: 'center',
  },
  safeZoneStar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    textAlign: 'center',
    fontSize: 16,
    opacity: 0.5,
    zIndex: 0,
  },
  turnText: {
    marginTop: 20,
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default Grid;
