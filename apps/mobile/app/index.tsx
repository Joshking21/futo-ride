import { useRouter } from "expo-router";
import { ArrowRight, CarFront, Compass, ShieldCheck, User } from "lucide-react-native";
import React, { useEffect, useState, useRef } from "react";
import { ActivityIndicator, Pressable, Text, View, Image } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useApp } from "../context/AppContext";
import KekeIcon from "../components/KekeIcon";
import "../global.css";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/config/firebaseConfig";

export default function Splash() {
  const router = useRouter();
  const { setRole } = useApp();
  
  // Track loading state for the visual UI components
  const [showLoader, setShowLoader] = useState(true);
  
  // Keep standard refs/states to hold the auth instance response safely
  const authChecked = useRef(false);
  const foundUser = useRef<any>(null);

  const selectRole = (role: "rider" | "driver") => {
    setRole(role);
    // router.push("/(driver)/home")
    router.replace("/login")
  };

  useEffect(() => {
    // 1. Kick off the minimum 2-second presentation timer
    const timer = setTimeout(() => {
      // Once 2 seconds pass, check if Firebase has completed its storage check
      if (authChecked.current) {
        handleNavigationDecision();
      } else {
        // If Firebase is taking longer than 2 seconds, let it call navigation when ready
        authChecked.current = true; 
      }
    }, 2000);

    // 2. Listen to the background AsyncStorage token check
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      foundUser.current = firebaseUser;
      console.log('Firebase storage check complete. User present:', !!firebaseUser);

      if (authChecked.current) {
        // If the 2-second screen timer already finished, route immediately
        handleNavigationDecision();
      } else {
        // Mark that Firebase is done, wait for the 2-second timer block to complete
        authChecked.current = true;
      }
    });

    // Unified routing decision pipeline
    const handleNavigationDecision = () => {
      if (foundUser.current) {
        // Token found! Route smoothly straight into the authenticated Home dashboard
        router.replace('/(driver)/home');
      } else {
        // No token found! Drop the loading spinner so the selection buttons appear
        setShowLoader(false);
      }
    };

    return () => {
      clearTimeout(timer);
      unsubscribe();
    };
  }, []);

  return (
    <SafeAreaView className="flex-1 bg-surface-bright justify-between px-margin-mobile py-xl relative">
      {/* Map outline background image */}
      <Image
        source={{
          uri: "https://lh3.googleusercontent.com/aida-public/AB6AXuBhChECydpDyPgt27hlQrat9Rk2U89C00BRo9HxQfDmpSr4MRrxjAG1pGL6iwr1A__rTa5hkvxx5VNhyBHIwUrgEL1XAzRh3vdUsCbmpnjEWdd5tXIJyvuoNbsf17_pEryhtId0Y6snYs2mm-iQfYuoPK3Zrsg2EAG-XD5-Bq8QCQpcEyE5GcSDWhm7yhm20vy7oBcRqJFt0hbOoiU-LdxjqFg6qiW_P7A1aJmd6buI9IlGZRklUN8jk7Fl9tud8gafRai7G4XXH9hL",
        }}
        className="absolute inset-0 opacity-[0.07] object-cover"
        resizeMode="cover"
      />

      {/* Center Group: Branding & Logo always stays visible */}
      <View className="flex-1 justify-center items-center">
        <View className="flex flex-col items-center justify-center">
          {/* Logo Container */}
          <View className="w-28 h-28 rounded-3xl bg-white shadow-xl shadow-black/5 flex items-center justify-center border border-outline-variant/20 mb-6">
            <KekeIcon size={76} color="#001caa" />
          </View>

          {/* Typography */}
          <View className="flex flex-col items-center">
            <Text className="text-headline-xl font-bold text-on-surface tracking-tight text-center font-jakarta">
              Futo <Text className="text-primary">Ride</Text>
            </Text>
            <Text className="text-body-md text-secondary max-w-[280px] text-center mt-2 font-jakarta">
              Move better. Live better.
            </Text>
          </View>
        </View>
      </View>

      {/* Bottom Group: Swaps smoothly between the Spinner or the Role Buttons */}
      {showLoader ? (
        <View className="w-full justify-center items-center py-12">
          <ActivityIndicator size="large" color="#001caa" className="scale-110" />
        </View>
      ) : (
        <View className="w-full gap-4 pb-6 px-2">
          <Text className="text-center text-label-sm uppercase tracking-widest text-secondary font-bold mb-2">
            Select Your Role
          </Text>

          {/* Rider Button */}
          <Pressable
            onPress={() => selectRole("rider")}
            className="w-full bg-primary h-14 rounded-full flex-row items-center justify-center gap-2 shadow-md active:opacity-90 active:scale-[0.98]"
          >
            <User color="#ffffff" size={20} />
            <Text className="text-on-primary text-action-lg font-bold">
              Ride as Student (Rider)
            </Text>
            <ArrowRight color="#ffffff" size={16} />
          </Pressable>

          {/* Driver Button */}
          <Pressable
            onPress={() => selectRole("driver")


            }
            className="w-full bg-surface-container border border-outline-variant h-14 rounded-full flex-row items-center justify-center gap-2 active:opacity-85 active:scale-[0.98]"
          >
            <CarFront color="#001caa" size={20} />
            <Text className="text-primary text-action-lg font-bold">
              Drive Transit (Driver)
            </Text>
          </Pressable>
        </View>
      )}
    </SafeAreaView>
  );
}