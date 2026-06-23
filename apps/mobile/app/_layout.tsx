import { GluestackUIProvider } from '@/components/ui/gluestack-ui-provider';
import '../global.css';
import { Stack } from "expo-router";
import React from "react";
import { AppProvider } from '../context/AppContext';

export default function RootLayout() {
  return <RootLayoutNav />;
}

function RootLayoutNav() {
  return (
    <AppProvider>
      <GluestackUIProvider mode="light">
        <Stack
          screenOptions={{
            headerShown: false,
            animation: "slide_from_right",
            contentStyle: { backgroundColor: '#f8f9ff' } 
          }}
        >
          <Stack.Screen name="index" />
          <Stack.Screen name="login" />
          <Stack.Screen name="signup" />
          <Stack.Screen name="(rider)" />
          <Stack.Screen name="(driver)" />
        </Stack>
      </GluestackUIProvider>
    </AppProvider>
  );
}