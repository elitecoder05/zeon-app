import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';

import LudoGame from './screens/LudoGame';
import TicTacToe from './screens/TicTacToe';

const Stack = createStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator 
        initialRouteName="LudoGame" 
        screenOptions={{ headerShown: false }}
      >
        <Stack.Screen 
          name="TicTacToe" 
          component={TicTacToe} 
        />
        <Stack.Screen 
          name="LudoGame" 
          component={LudoGame} 
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
