import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import ReflectScreen from "@/screens/ReflectScreen";
import { useScreenOptions } from "@/hooks/useScreenOptions";

export type ReflectStackParamList = {
  Reflect: undefined;
};

const Stack = createNativeStackNavigator<ReflectStackParamList>();

export default function ReflectStackNavigator() {
  const screenOptions = useScreenOptions();

  return (
    <Stack.Navigator screenOptions={screenOptions}>
      <Stack.Screen
        name="Reflect"
        component={ReflectScreen}
        options={{
          headerTitle: "Reflect",
        }}
      />
    </Stack.Navigator>
  );
}
