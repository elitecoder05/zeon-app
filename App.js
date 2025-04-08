import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";

import LudoGame from "./screens/LudoGame";
import TicTacToe from "./screens/ParachuteEscape";
import GrabEgg from "./screens/GrabEgg";
import TicTacToeMain from "./screens/TicTacToeMain";

const Stack = createStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="LudoGame"
        screenOptions={{ headerShown: false }}
      >
        <Stack.Screen name="TicTacToe" component={TicTacToe} />
        <Stack.Screen name="LudoGame" component={LudoGame} />


        <Stack.Screen name="GrabEgg" component={GrabEgg} />
        <Stack.Screen name="TicTacToeMain" component={TicTacToeMain} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
