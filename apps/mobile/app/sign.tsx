import { useRouter } from "expo-router";
import {
  ArrowLeft,
  ArrowRight,
  Key,
  Lock,
  Mail,
  User,
} from "lucide-react-native";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Keyboard,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useApp } from "../context/AppContext";

export default function Sign() {
  const router = useRouter();
  const { userRole } = useApp();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const [isNameFocused, setIsNameFocused] = useState(false);
  const [isEmailFocused, setIsEmailFocused] = useState(false);
  const [isPasswordFocused, setIsPasswordFocused] = useState(false);
  const [isConfirmFocused, setIsConfirmFocused] = useState(false);

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
    <SafeAreaView className="flex-1 bg-surface" edges={["top", "bottom"]}>
      {/* Top Header Bar */}
      <View className="flex-row items-center px-margin-mobile h-touch-target border-b border-outline-variant bg-surface-container-lowest z-20">
        <Pressable
          onPress={() => router.back()}
          className="p-2 -ml-2 rounded-full active:bg-surface-container"
        >
          <ArrowLeft color="#001caa" size={24} />
        </Pressable>
        <Text className="text-headline-md font-bold text-primary ml-2 font-jakarta">
          Futo Ride
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
        className="z-10"
      >
        {/* Background Pressable to dismiss keyboard */}
        <Pressable
          onPress={Keyboard.dismiss}
          className="absolute inset-0 z-0"
        />

        <View className="flex-1 justify-center px-margin-mobile py-xl max-w-md w-full mx-auto">
          {/* Header */}
          <View className="mb-xl">
            <Text className="text-headline-lg-mobile font-bold text-on-surface font-jakarta mb-2">
              Create Account
            </Text>
            <Text className="text-body-md text-secondary font-jakarta">
              Join the campus transit network for seamless mobility.
            </Text>
          </View>

          {error ? (
            <Text className="text-error text-body-sm mb-4 font-semibold text-center">
              {error}
            </Text>
          ) : null}

          {/* Form Fields */}
          <View className="gap-md">
            {/* Full Name */}
            <View>
              <Text className="block text-label-md font-label-md text-on-surface mb-xs">
                Full Name
              </Text>
              <View
                className={`flex-row items-center bg-surface-container-lowest border rounded-lg px-3 py-2 ${
                  isNameFocused ? "border-primary border-2" : "border-outline"
                }`}
              >
                <User
                  color={isNameFocused ? "#001caa" : "#757687"}
                  size={20}
                  className="mr-2"
                />
                <TextInput
                  placeholder="John Doe"
                  placeholderTextColor="#c5c5d8"
                  value={fullName}
                  onChangeText={(val) => {
                    setFullName(val);
                    setError("");
                  }}
                  onFocus={() => setIsNameFocused(true)}
                  onBlur={() => setIsNameFocused(false)}
                  underlineColorAndroid="transparent"
                  className="flex-1 text-on-surface text-body-md py-1"
                />
              </View>
            </View>

            {/* FUTO Email */}
            <View>
              <Text className="block text-label-md font-label-md text-on-surface mb-xs">
                FUTO Email Address
              </Text>
              <View
                className={`flex-row items-center bg-surface-container-lowest border rounded-lg px-3 py-2 ${
                  isEmailFocused ? "border-primary border-2" : "border-outline"
                }`}
              >
                <Mail
                  color={isEmailFocused ? "#001caa" : "#757687"}
                  size={20}
                  className="mr-2"
                />
                <TextInput
                  placeholder="student@futo.edu.ng"
                  placeholderTextColor="#c5c5d8"
                  value={email}
                  onChangeText={(val) => {
                    setEmail(val);
                    setError("");
                  }}
                  onFocus={() => setIsEmailFocused(true)}
                  onBlur={() => setIsEmailFocused(false)}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  underlineColorAndroid="transparent"
                  className="flex-1 text-on-surface text-body-md py-1"
                />
              </View>
            </View>

            {/* Password */}
            <View>
              <Text className="block text-label-md font-label-md text-on-surface mb-xs">
                Password
              </Text>
              <View
                className={`flex-row items-center bg-surface-container-lowest border rounded-lg px-3 py-2 ${
                  isPasswordFocused
                    ? "border-primary border-2"
                    : "border-outline"
                }`}
              >
                <Lock
                  color={isPasswordFocused ? "#001caa" : "#757687"}
                  size={20}
                  className="mr-2"
                />
                <TextInput
                  placeholder="••••••••"
                  placeholderTextColor="#c5c5d8"
                  secureTextEntry
                  value={password}
                  onChangeText={(val) => {
                    setPassword(val);
                    setError("");
                  }}
                  onFocus={() => setIsPasswordFocused(true)}
                  onBlur={() => setIsPasswordFocused(false)}
                  autoCapitalize="none"
                  underlineColorAndroid="transparent"
                  className="flex-1 text-on-surface text-body-md py-1"
                />
              </View>
              <Text className="text-[11px] text-secondary mt-1 font-jakarta">
                Must be at least 8 characters.
              </Text>
            </View>

            {/* Confirm Password */}
            <View>
              <Text className="block text-label-md font-label-md text-on-surface mb-xs">
                Confirm Password
              </Text>
              <View
                className={`flex-row items-center bg-surface-container-lowest border rounded-lg px-3 py-2 ${
                  isConfirmFocused
                    ? "border-primary border-2"
                    : "border-outline"
                }`}
              >
                <Key
                  color={isConfirmFocused ? "#001caa" : "#757687"}
                  size={20}
                  className="mr-2"
                />
                <TextInput
                  placeholder="••••••••"
                  placeholderTextColor="#c5c5d8"
                  secureTextEntry
                  value={confirmPassword}
                  onChangeText={(val) => {
                    setConfirmPassword(val);
                    setError("");
                  }}
                  onFocus={() => setIsConfirmFocused(true)}
                  onBlur={() => setIsConfirmFocused(false)}
                  autoCapitalize="none"
                  underlineColorAndroid="transparent"
                  className="flex-1 text-on-surface text-body-md py-1"
                />
              </View>
            </View>

            {/* Sign Up Button */}
            <Pressable
              onPress={handleSignup}
              disabled={isSubmitting}
              className="w-full bg-primary h-14 rounded-full flex-row items-center justify-center gap-2 shadow-[0_4px_14px_rgba(0,28,170,0.2)] active:scale-[0.98] transition-all mt-6"
            >
              {isSubmitting ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <>
                  <Text className="text-on-primary text-action-lg font-bold">
                    Sign Up
                  </Text>
                  <ArrowRight color="#ffffff" size={20} />
                </>
              )}
            </Pressable>

            {/* Divider */}
            <View className="flex-row items-center my-xl">
              <View className="flex-1 h-[1px] bg-outline-variant" />
              <Text className="px-3 text-label-sm font-label-sm text-secondary uppercase tracking-wider">
                or
              </Text>
              <View className="flex-1 h-[1px] bg-outline-variant" />
            </View>

            {/* Google Signup Button */}
            <Pressable className="w-full bg-surface-container-lowest border border-outline-variant h-14 rounded-full flex-row items-center justify-center gap-2 active:bg-surface-container-low transition-colors mb-4">
              <Text className="text-on-surface text-action-lg font-bold">
                Sign up with Google
              </Text>
            </Pressable>

            {/* Already have account */}
            <View className="flex-row justify-center mt-2 pb-8">
              <Text className="text-body-sm text-secondary font-medium">
                Already have an account?{" "}
              </Text>
              <Pressable onPress={() => router.replace("/login")}>
                <Text className="text-body-sm text-primary font-bold hover:underline">
                  Log in
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
