import React, { useState } from "react";
import { View, Text, TextInput, Pressable, Keyboard, ActivityIndicator, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useApp } from "../context/AppContext";
import { User, Mail, Lock, Key, ArrowLeft } from "lucide-react-native";

export default function Signup() {
  const router = useRouter();
  const { userRole } = useApp();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSignup = () => {
    if (!fullName || !email || !password || !confirmPassword) {
      setError("All fields are required");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }
    setError("");
    setIsSubmitting(true);

    setTimeout(() => {
      setIsSubmitting(false);
      if (userRole === "driver") {
        router.replace("/(driver)/home");
      } else {
        router.replace("/(rider)/home");
      }
    }, 1200);
  };

  return (
    <SafeAreaView className="flex-1 bg-surface">
      {/* Top Header Bar */}
      <View className="flex-row items-center px-margin-mobile h-touch-target border-b border-outline-variant bg-surface-container-lowest">
        <Pressable onPress={() => router.back()} className="p-2 -ml-2 rounded-full active:bg-surface-container">
          <ArrowLeft color="#001caa" size={24} />
        </Pressable>
        <Text className="text-headline-md font-bold text-primary ml-2 font-jakarta">Futo Ride</Text>
      </View>

      <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
        <Pressable onPress={Keyboard.dismiss} className="flex-1 justify-center px-margin-mobile py-6">
          <View className="w-full max-w-md bg-surface-container-lowest border border-[#E5E5E5] rounded-2xl p-6 sm:p-8 shadow-sm">
            
            {/* Header */}
            <View className="mb-stack-lg">
              <Text className="text-headline-lg-mobile font-bold text-on-surface">
                Create Account
              </Text>
              <Text className="text-body-sm text-secondary mt-1">
                Join the FUTO transit network for faster, safer rides across campus.
              </Text>
            </View>

            {error ? (
              <Text className="text-error text-body-sm mb-4 font-semibold text-center">{error}</Text>
            ) : null}

            {/* Inputs Form */}
            <View className="gap-4">
              
              {/* Full Name */}
              <View>
                <Text className="text-body-sm text-on-surface-variant mb-1 font-semibold">
                  Full Name
                </Text>
                <View className="flex-row items-center bg-surface border border-[#E5E5E5] rounded-lg px-3 py-2">
                  <User color="#5b5e66" size={20} className="mr-2" />
                  <TextInput
                    placeholder="e.g. John Doe"
                    placeholderTextColor="#c5c5d8"
                    value={fullName}
                    onChangeText={(val) => {
                      setFullName(val);
                      setError("");
                    }}
                    className="flex-1 text-on-surface text-body-md py-1"
                  />
                </View>
              </View>

              {/* FUTO Email */}
              <View>
                <Text className="text-body-sm text-on-surface-variant mb-1 font-semibold">
                  FUTO Email Address
                </Text>
                <View className="flex-row items-center bg-surface border border-[#E5E5E5] rounded-lg px-3 py-2">
                  <Mail color="#5b5e66" size={20} className="mr-2" />
                  <TextInput
                    placeholder="student@futo.edu.ng"
                    placeholderTextColor="#c5c5d8"
                    value={email}
                    onChangeText={(val) => {
                      setEmail(val);
                      setError("");
                    }}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    className="flex-1 text-on-surface text-body-md py-1"
                  />
                </View>
              </View>

              {/* Password */}
              <View>
                <Text className="text-body-sm text-on-surface-variant mb-1 font-semibold">
                  Password
                </Text>
                <View className="flex-row items-center bg-surface border border-[#E5E5E5] rounded-lg px-3 py-2">
                  <Lock color="#5b5e66" size={20} className="mr-2" />
                  <TextInput
                    placeholder="••••••••"
                    placeholderTextColor="#c5c5d8"
                    secureTextEntry
                    value={password}
                    onChangeText={(val) => {
                      setPassword(val);
                      setError("");
                    }}
                    autoCapitalize="none"
                    className="flex-1 text-on-surface text-body-md py-1"
                  />
                </View>
                <Text className="text-[11px] text-secondary mt-1">Must be at least 8 characters.</Text>
              </View>

              {/* Confirm Password */}
              <View>
                <Text className="text-body-sm text-on-surface-variant mb-1 font-semibold">
                  Confirm Password
                </Text>
                <View className="flex-row items-center bg-surface border border-[#E5E5E5] rounded-lg px-3 py-2">
                  <Key color="#5b5e66" size={20} className="mr-2" />
                  <TextInput
                    placeholder="••••••••"
                    placeholderTextColor="#c5c5d8"
                    secureTextEntry
                    value={confirmPassword}
                    onChangeText={(val) => {
                      setConfirmPassword(val);
                      setError("");
                    }}
                    autoCapitalize="none"
                    className="flex-1 text-on-surface text-body-md py-1"
                  />
                </View>
              </View>

              {/* Sign Up Button */}
              <Pressable
                onPress={handleSignup}
                disabled={isSubmitting}
                className="w-full bg-primary hover:bg-surface-tint h-14 rounded-lg flex items-center justify-center shadow-md active:scale-[0.98] transition-all mt-4"
              >
                {isSubmitting ? (
                  <ActivityIndicator color="#ffffff" />
                ) : (
                  <Text className="text-on-primary text-action-lg font-bold">Sign Up</Text>
                )}
              </Pressable>

            </View>

            {/* Divider */}
            <View className="flex-row items-center my-5">
              <View className="flex-1 h-[1px] bg-surface-container-high" />
              <Text className="px-3 text-body-sm text-secondary">or</Text>
              <View className="flex-1 h-[1px] bg-surface-container-high" />
            </View>

            {/* Google Signup Button */}
            <Pressable className="w-full bg-inverse-surface hover:bg-on-surface h-14 rounded-lg flex-row items-center justify-center gap-2 active:scale-[0.98] transition-all mb-4">
              <Text className="text-on-primary text-action-lg font-bold">Sign up with Google</Text>
            </Pressable>

            {/* Already have account */}
            <View className="flex-row justify-center mt-2">
              <Text className="text-body-sm text-secondary font-medium">Already have an account? </Text>
              <Pressable onPress={() => router.replace("/login")}>
                <Text className="text-body-sm text-primary font-semibold hover:underline">
                  Log in
                </Text>
              </Pressable>
            </View>

          </View>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}
