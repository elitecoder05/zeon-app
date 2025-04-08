import React, { useState, useEffect } from 'react';
import {
  Animated,
  StyleSheet,
  View,
  Dimensions,
  TouchableWithoutFeedback,
  Text,
  Alert,
} from 'react-native';

const { width, height } = Dimensions.get('window');
const HORIZONTAL_LINE_Y = height - 100;
const EGG_SIZE = 50;
 const EGG_COUNT = 3;
const SPEEDS = [5000, 6000, 5500, 4500, 7000];

export default function GrabEgg() {
  const [eggs, setEggs] = useState(() =>
    Array.from({ length: EGG_COUNT }).map((_, i) => ({
      id: i,
      animatedValue: new Animated.Value(0),
      x: Math.random() * (width - EGG_SIZE),
      animation: null,
      listenerId: null,
    }))
  );
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);

  const scheduleEggFall = (egg, index) => {
    if (gameOver) return;
    const randomDelay = Math.random() * 4000; // delay between 0 and 4000ms
    setTimeout(() => {
      if (!gameOver) startEggFall(egg, index);
    }, randomDelay);
  };

  const startEggFall = (egg, index) => {
    egg.animatedValue.setValue(0);
    egg.x = Math.random() * (width - EGG_SIZE);
    //  speed from the SPEEDS array.
    const randomSpeed = SPEEDS[Math.floor(Math.random() * SPEEDS.length)];

    const animation = Animated.timing(egg.animatedValue, {
      toValue: HORIZONTAL_LINE_Y + 50, 
      duration: randomSpeed,
      useNativeDriver: false, 
    });
    egg.animation = animation;

    egg.listenerId = egg.animatedValue.addListener(({ value }) => {
      if (value >= HORIZONTAL_LINE_Y && !gameOver) {
        setGameOver(true);
        stopAllAnimations();
        Alert.alert('Game Over', 'An egg reached the bottom!', [
          { text: 'Restart', onPress: resetAllEggs },
        ]);
      }
    });

    animation.start();

    setEggs(prevEggs => {
      const newEggs = [...prevEggs];
      newEggs[index] = { ...egg };
      return newEggs;
    });
  };

  const stopAllAnimations = () => {
    eggs.forEach(egg => {
      if (egg.animation) {
        egg.animation.stop();
      }
    });
  };

  const resetAllEggs = () => {
    setGameOver(false);
    setScore(0); 
    eggs.forEach((egg, index) => {
      if (egg.listenerId) {
        egg.animatedValue.removeListener(egg.listenerId);
      }
      scheduleEggFall(egg, index);
    });
  };

  const handleEggPress = (egg, index) => {
    if (egg.animation) {
      egg.animation.stop();
    }
    if (egg.listenerId) {
      egg.animatedValue.removeListener(egg.listenerId);
    }
    if (!gameOver) {
      setScore(prev => prev + 10);
      startEggFall(egg, index);
    }
  };

  useEffect(() => {
    eggs.forEach((egg, index) => {
      scheduleEggFall(egg, index);
    });

    return () => {
      eggs.forEach(egg => {
        if (egg.listenerId) {
          egg.animatedValue.removeListener(egg.listenerId);
        }
      });
    };
  }, []);

  return (
    <View style={styles.container}>
      {eggs.map((egg, index) => (
        <TouchableWithoutFeedback
          key={egg.id}
          onPress={() => handleEggPress(egg, index)}
        >
          <Animated.Image
            source={{
              uri: 'https://img.freepik.com/premium-photo/chicken-egg-isolated-white_286373-23.jpg?semt=ais_hybrid',
            }}
            style={[styles.egg, { top: egg.animatedValue, left: egg.x }]}
          />
        </TouchableWithoutFeedback>
      ))}
      <View style={styles.horizontalLine} />
      <View style={styles.scoreContainer}>
        <Text style={styles.scoreText}>Score: {score}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  egg: {
    position: 'absolute',
    width: EGG_SIZE,
    height: EGG_SIZE,
  },
  horizontalLine: {
    position: 'absolute',
    bottom: 100,
    left: 0,
    right: 0,
    borderBottomColor: 'red',
    borderBottomWidth: 2,
  },
  scoreContainer: {
    position: 'absolute',
    bottom: 20,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  scoreText: {
    fontSize: 20,
    fontWeight: 'bold',
  },
});
