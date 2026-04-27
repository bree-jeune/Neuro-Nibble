import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import MainTabNavigator from "@/navigation/MainTabNavigator";
import BreathingScreen from "@/screens/BreathingScreen";
import BreakItDownScreen from "@/screens/BreakItDownScreen";
import OnboardingScreen from "@/screens/OnboardingScreen";
import QuietRoomScreen from "@/screens/QuietRoomScreen";
import WeeklyRoomSetupScreen from "@/screens/WeeklyRoomSetupScreen";
import { useScreenOptions } from "@/hooks/useScreenOptions";
import { useAppStore } from "@/lib/store";

export type RootStackParamList = {
  Onboarding: undefined;
  WeeklyRoomSetup: { mode?: "initial" | "change" } | undefined;
  Main: undefined;
  Breathing: undefined;
  BreakItDown: { taskId?: string } | undefined;
  QuietRoom: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function RootStackNavigator() {
  const screenOptions = useScreenOptions();
  const { onboardingCompleted, hasCompletedRoomSetup } = useAppStore();
  const initialRouteName = !onboardingCompleted
    ? "Onboarding"
    : hasCompletedRoomSetup
      ? "Main"
      : "WeeklyRoomSetup";

  return (
    <Stack.Navigator
      screenOptions={screenOptions}
      initialRouteName={initialRouteName}
    >
      {!onboardingCompleted ? (
        <Stack.Screen
          name="Onboarding"
          component={OnboardingScreen}
          options={{ headerShown: false }}
        />
      ) : null}
      {onboardingCompleted ? (
        <Stack.Screen
          name="WeeklyRoomSetup"
          component={WeeklyRoomSetupScreen}
          options={{
            presentation: "modal",
            headerShown: false,
          }}
          initialParams={{
            mode: hasCompletedRoomSetup ? "change" : "initial",
          }}
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
      <Stack.Screen
        name="Breathing"
        component={BreathingScreen}
        options={{
          presentation: "modal",
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="QuietRoom"
        component={QuietRoomScreen}
        options={{
          headerTitle: "Quiet Room",
        }}
      />
    </Stack.Navigator>
  );
}
