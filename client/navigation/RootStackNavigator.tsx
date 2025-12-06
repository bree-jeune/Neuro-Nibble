import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import MainTabNavigator from "@/navigation/MainTabNavigator";
import BreakItDownScreen from "@/screens/BreakItDownScreen";
import OnboardingScreen from "@/screens/OnboardingScreen";
import { useScreenOptions } from "@/hooks/useScreenOptions";
import { useAppStore } from "@/lib/store";

export type RootStackParamList = {
  Onboarding: undefined;
  Main: undefined;
  BreakItDown: { taskId?: string } | undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function RootStackNavigator() {
  const screenOptions = useScreenOptions();
  const { onboardingCompleted } = useAppStore();

  return (
    <Stack.Navigator screenOptions={screenOptions}>
      {!onboardingCompleted ? (
        <Stack.Screen
          name="Onboarding"
          component={OnboardingScreen}
          options={{ headerShown: false }}
        />
      ) : null}
      <Stack.Screen
        name="Main"
        component={MainTabNavigator}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="BreakItDown"
        component={BreakItDownScreen}
        options={{
          presentation: "modal",
          headerTitle: "Break It Down",
        }}
      />
    </Stack.Navigator>
  );
}
