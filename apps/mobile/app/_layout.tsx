import { GluestackUIProvider } from '@/components/ui/gluestack-ui-provider';
import '../global.css';
import { Stack, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { AppProvider } from '../context/AppContext';
import { auth } from '@/config/firebaseConfig';
import { User, onAuthStateChanged } from 'firebase/auth';

export default function RootLayout() {
  return <RootLayoutNav />;
}

function RootLayoutNav() {

  

// Keep Splash Screen visible while checking storage

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
          <Stack.Screen name="sign" />
          <Stack.Screen name="(rider)" />
          <Stack.Screen name="(driver)" />
          <Stack.Screen name="sos" />
        </Stack>
      </GluestackUIProvider>
    </AppProvider>
  );
}