import React, { useState, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, TouchableOpacity, Dimensions, ImageBackground, PanResponder } from 'react-native';

// Get window dimensions
const windowWidth = Dimensions.get('window').width;
const windowHeight = Dimensions.get('window').height;

export default function TicTacToe() {
  // Game state
  const [gameStarted, setGameStarted] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);
  
  // Parachute position
  const [parachutePosition, setParachutePosition] = useState({
    x: windowWidth / 2 - 30,
    y: windowHeight - 100,
    width: 60,
    height: 80
  });
  
  // Spikes array
  const [spikes, setSpikes] = useState([]);
  
  // Create pan responder for touch handling
  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => gameStarted && !gameOver,
    onPanResponderMove: (event, gestureState) => {
      if (gameStarted && !gameOver) {
        const touchX = event.nativeEvent.pageX;
        setParachutePosition(prev => ({
          ...prev,
          x: Math.max(0, Math.min(windowWidth - prev.width, touchX - prev.width / 2))
        }));
      }
    },
    onPanResponderTerminationRequest: () => true,
  });
  
  // Check for collisions
  const checkCollision = () => {
    for (let i = 0; i < spikes.length; i++) {
      const spike = spikes[i];
      
      // Basic collision detection
      if (
        parachutePosition.x < spike.x + spike.width &&
        parachutePosition.x + parachutePosition.width > spike.x &&
        parachutePosition.y < spike.y + spike.height &&
        parachutePosition.y + parachutePosition.height > spike.y
      ) {
        endGame();
        return;
      }
    }
  };
  
  // Start game
  const startGame = () => {
    console.log("Game started");
    setGameStarted(true);
    setGameOver(false);
    setScore(0);
    setSpikes([]);
    setParachutePosition({
      x: windowWidth / 2 - 30,
      y: windowHeight - 100,
      width: 60,
      height: 80
    });
  };
  
  // End game
  const endGame = () => {
    console.log("Game over");
    setGameOver(true);
  };
  
  // Game loop using useEffect
  useEffect(() => {
    let gameLoopInterval;
    let spikeGeneratorInterval;
    
    if (gameStarted && !gameOver) {
      // Game update loop - runs at 60fps
      gameLoopInterval = setInterval(() => {
        // Update spike positions
        setSpikes(prevSpikes => {
          return prevSpikes.map(spike => ({
            ...spike,
             // ADJUST SPEED HERE: Increase this multiplier to make spikes move faster
            // Current formula: spike.y + spike.speed
            // You can change it to spike.y + (spike.speed * 2) to double the speed
          //this is the place where i can adjust the speed of the coming spikes
            y: spike.y + spike.speed
                      // y:  spike.y + (spike.speed * 8)

          })).filter(spike => spike.y < windowHeight);
        });
        
        // Increment score
        setScore(prevScore => prevScore + 1);
      }, 1); // This controls the game frame rate - lower number = faster game
      
      // Spike generator - creates new spikes periodically
      spikeGeneratorInterval = setInterval(() => {
        const newSpike = {
          id: Date.now().toString(),
          x: Math.random() * (windowWidth - 30),
          y: -50,
          width: 30,
          height: 50,


 // ADJUST INITIAL SPEED HERE: This defines how fast each spike falls
          // Current speed is random between 3-5 pixels per frame
          // Increase these numbers to make spikes fall faster
          // For example: 6 + Math.random() * 4 would give speeds between 6-10
          // speed: 3 + Math.random() * 2
          speed: 10 + Math.random() * 20
        };
        
        console.log("Creating new spike at position:", newSpike.x);
        setSpikes(prevSpikes => [...prevSpikes, newSpike]);
      }, 200); // This controls how often new spikes appear
    }
    
    // Clean up intervals when effect changes
    return () => {
      clearInterval(gameLoopInterval);
      clearInterval(spikeGeneratorInterval);
    };
  }, [gameStarted, gameOver]);
  
  // Collision detection in separate useEffect to run on every render
  useEffect(() => {
    if (gameStarted && !gameOver) {
      checkCollision();
    }
  });
  
  return (
    <View style={styles.container} {...panResponder.panHandlers}>
      {/* Game area */}
      <View style={styles.gameArea}>
        {/* Debug text */}
        <Text style={styles.debugText}>
          Spikes: {spikes.length} | Game Started: {gameStarted ? 'Yes' : 'No'}
        </Text>
        
        {/* Spikes */}
        {spikes.map(spike => (
          <View
            key={spike.id}
            style={{
              position: 'absolute',
              left: spike.x,
              top: spike.y,
              width: spike.width,
              height: spike.height,
            }}
          >
            <ImageBackground 
              source={require('../assets/spike.png')}
              style={{
                width: '100%',
                height: '100%',
                resizeMode: 'contain',
              }}
            />
          </View>
        ))}
        
        {/* Parachute */}
        <View
          style={{
            position: 'absolute',
            left: parachutePosition.x,
            top: parachutePosition.y,
            width: parachutePosition.width,
            height: parachutePosition.height,
          }}
        >
          <ImageBackground 
            source={require('../assets/parachute.png')}
            style={{
              width: '100%',
              height: '100%',
              resizeMode: 'contain',
            }}
          />
        </View>
      </View>
      
      {/* Score display */}
      <Text style={styles.scoreText}>Score: {score}</Text>
      
      {/* Game over screen */}
      {gameOver && (
        <View style={styles.gameOverContainer}>
          <Text style={styles.gameOverText}>Game Over</Text>
          <Text style={styles.finalScoreText}>Final Score: {score}</Text>
          <TouchableOpacity 
            style={styles.restartButton} 
            onPress={startGame}
            activeOpacity={0.7}
          >
            <Text style={styles.restartText}>Restart</Text>
          </TouchableOpacity>
        </View>
      )}
      
      {/* Start screen */}
      {!gameStarted && !gameOver && (
        <View style={styles.startContainer}>
          <Text style={styles.titleText}>Parachute Game</Text>
          <Text style={styles.instructionText}>Slide to move</Text>
          <Text style={styles.instructionText}>Avoid the falling spikes!</Text>
          <TouchableOpacity 
            style={styles.startButton} 
            onPress={startGame}
            activeOpacity={0.7}
          >
            <Text style={styles.startText}>Start Game</Text>
          </TouchableOpacity>
        </View>
      )}
      
      <StatusBar style="auto" hidden />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#87CEEB',  // Sky blue background
  },
  gameArea: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  scoreText: {
    position: 'absolute',
    top: 40,
    left: 20,
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    zIndex: 5,
  },
  debugText: {
    position: 'absolute',
    top: 80,
    left: 20,
    fontSize: 14,
    color: 'white',
    zIndex: 5,
  },
  gameOverContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 20,
  },
  gameOverText: {
    fontSize: 48,
    fontWeight: 'bold',
    color: 'red',
    marginBottom: 20,
  },
  finalScoreText: {
    fontSize: 36,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 30,
  },
  restartButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 10,
    elevation: 5,
  },
  restartText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
  startContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 20,
  },
  titleText: {
    fontSize: 48,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 30,
  },
  instructionText: {
    fontSize: 24,
    color: 'white',
    marginBottom: 15,
  },
  startButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 10,
    marginTop: 20,
    elevation: 5,
  },
  startText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
});